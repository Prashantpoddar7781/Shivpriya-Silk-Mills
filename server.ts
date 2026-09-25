import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { dataStore } from './src/services/dataStore.js';
import { parseSuratTextileRegex, runLocalOcr, parseWithGeminiVision } from './src/services/textileOcr.js';
import AdmZip from 'adm-zip';

async function parseMultipartBuffer(req: express.Request): Promise<{
  fields: Record<string, string>;
  files: Array<{ fieldname: string; filename: string; mimetype: string; buffer: Buffer }>;
}> {
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
  if (!boundaryMatch) {
    return { fields: {}, files: [] };
  }
  const boundary = boundaryMatch[1].trim().replace(/^"|"$/g, '');
  const delim = Buffer.from('--' + boundary);

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const full = Buffer.concat(chunks);

  const fields: Record<string, string> = {};
  const files: Array<{ fieldname: string; filename: string; mimetype: string; buffer: Buffer }> = [];

  let start = 0;
  while (true) {
    const idx = full.indexOf(delim, start);
    if (idx === -1) break;
    if (start > 0) {
      const part = full.subarray(start, idx);
      let sepIdx = part.indexOf(Buffer.from('\r\n\r\n'));
      let sepLen = 4;
      if (sepIdx === -1) {
        sepIdx = part.indexOf(Buffer.from('\n\n'));
        sepLen = 2;
      }
      if (sepIdx !== -1) {
        const headerStr = part.subarray(0, sepIdx).toString('utf-8');
        let body = part.subarray(sepIdx + sepLen);
        if (body.length >= 2 && body[body.length - 2] === 13 && body[body.length - 1] === 10) {
          body = body.subarray(0, body.length - 2);
        } else if (body.length >= 1 && body[body.length - 1] === 10) {
          body = body.subarray(0, body.length - 1);
        }

        const nameMatch = headerStr.match(/name="([^"]+)"/i) || headerStr.match(/name=([^\s;\r\n]+)/i);
        const filenameMatch = headerStr.match(/filename="([^"]+)"/i) || headerStr.match(/filename=([^\s;\r\n]+)/i);
        const typeMatch = headerStr.match(/content-type:\s*([^\s\r\n;]+)/i);

        const fieldname = nameMatch ? nameMatch[1] : '';
        const filename = filenameMatch ? filenameMatch[1] : '';
        const mimetype = typeMatch ? typeMatch[1] : '';

        // If filename is present, or image mime, or field is images/files, treat as image file
        if (filename || mimetype.startsWith('image/') || fieldname === 'images' || fieldname === 'files' || fieldname === 'file') {
          files.push({
            fieldname,
            filename: filename || `image_${files.length + 1}.jpg`,
            mimetype: mimetype || 'image/jpeg',
            buffer: body,
          });
        } else if (fieldname) {
          fields[fieldname] = body.toString('utf-8').trim();
        }
      }
    }
    start = idx + delim.length;
  }

  return { fields, files };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Support cross-origin requests from Vercel deployment, iOS, etc.
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Client-Source');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Support ultra-high payload for JSON batch transfers (from Web Uploader)
  app.use(express.json({ limit: '250mb' }));
  app.use(express.urlencoded({ extended: true, limit: '250mb' }));

  // Debug request tracker for iOS shortcut inspection
  const debugLogs: any[] = [];
  app.use((req, res, next) => {
    if (req.path.includes('upload') || req.path.includes('batches')) {
      debugLogs.push({
        time: new Date().toISOString(),
        method: req.method,
        url: req.url,
        contentType: req.headers['content-type'],
        userAgent: req.headers['user-agent'],
      });
      if (debugLogs.length > 50) debugLogs.shift();
    }
    next();
  });

  app.get('/api/debug-log', (req, res) => {
    res.json({ logs: debugLogs });
  });

  // Static serving for locally stored uploads (e.g. /uploads/img_xxx.jpg)
  const dataDirPath = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), 'data');
  const uploadsPath = path.join(dataDirPath, 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      productsCount: dataStore.getProducts({}).length,
      batchesCount: dataStore.getBatches().length,
      dataDir: dataDirPath,
      hasVolume: Boolean(process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR),
    });
  });

  // 1. Upload batch (called from iOS Shortcut, iOS Share Extension, or Web Uploader)
  app.post('/api/batches/upload', async (req, res) => {
    try {
      let images: any[] = [];
      let supplierName = req.body?.supplierName || req.body?.supplier || req.body?.['supplier...'] || 'Surat Supplier';
      let source = req.body?.source || 'web_upload';

      const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
      if (isMultipart) {
        source = 'ios_shortcut';
        const parsed = await parseMultipartBuffer(req);
        if (parsed.fields.supplierName || parsed.fields.supplier || parsed.fields['supplier...']) {
          supplierName = parsed.fields.supplierName || parsed.fields.supplier || parsed.fields['supplier...'];
        }

        if (parsed.files.length > 0) {
          for (const file of parsed.files) {
            // Check if file is a ZIP archive (by magic bytes PK\x03\x04 or extension/mime)
            const isZip =
              (file.buffer.length >= 4 &&
                file.buffer[0] === 0x50 &&
                file.buffer[1] === 0x4b &&
                file.buffer[2] === 0x03 &&
                file.buffer[3] === 0x04) ||
              file.filename.toLowerCase().endsWith('.zip') ||
              file.mimetype.includes('zip');

            if (isZip) {
              try {
                const zip = new AdmZip(file.buffer);
                const entries = zip.getEntries();
                for (const entry of entries) {
                  if (entry.isDirectory) continue;
                  const entryName = entry.entryName.toLowerCase();
                  if (entryName.includes('__macosx') || entryName.startsWith('.') || entryName.includes('/.')) continue;
                  if (
                    entryName.endsWith('.jpg') ||
                    entryName.endsWith('.jpeg') ||
                    entryName.endsWith('.png') ||
                    entryName.endsWith('.webp') ||
                    entryName.endsWith('.heic')
                  ) {
                    const entryBuf = entry.getData();
                    const mime = entryName.endsWith('.png')
                      ? 'image/png'
                      : entryName.endsWith('.webp')
                      ? 'image/webp'
                      : 'image/jpeg';
                    images.push({
                      id: `shortcut_img_${Date.now()}_${images.length + 1}`,
                      imageUrl: `data:${mime};base64,${entryBuf.toString('base64')}`,
                      category: 'Sarees',
                      textHint: '',
                    });
                  }
                }
              } catch (zErr) {
                console.error('Failed to unpack zip file from Shortcut:', zErr);
              }
            } else {
              // Regular image file
              const base64 = `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`;
              images.push({
                id: `shortcut_img_${Date.now()}_${images.length + 1}`,
                imageUrl: base64,
                category: 'Sarees',
                textHint: '',
              });
            }
          }
        }
      } else {
        // Case 2: JSON payload (from Web Uploader or iOS Share Extension)
        if (req.body?.images && Array.isArray(req.body.images)) {
          images = req.body.images;
        }
      }

      debugLogs.push({
        time: new Date().toISOString(),
        action: 'batches_upload_attempt',
        supplierName,
        source,
        isMultipart,
        parsedFiles: parsed.files.map((f) => ({
          filename: f.filename,
          fieldname: f.fieldname,
          size: f.buffer.length,
          isZip:
            (f.buffer.length >= 4 &&
              f.buffer[0] === 0x50 &&
              f.buffer[1] === 0x4b &&
              f.buffer[2] === 0x03 &&
              f.buffer[3] === 0x04) ||
            f.filename.toLowerCase().endsWith('.zip'),
        })),
        parsedImagesCount: images.length,
      });

      if (images.length === 0) {
        return res.status(400).json({ 
          error: 'No images received. Please ensure the "images" field in your Shortcut is set to "Shortcut Input" (type File).',
        });
      }

      const batch = await dataStore.createAndProcessBatch(
        supplierName,
        images,
        source
      );

      res.status(201).json(batch);
    } catch (err: any) {
      console.error('Batch upload error:', err);
      debugLogs.push({
        time: new Date().toISOString(),
        action: 'batches_upload_error',
        error: err.message || String(err),
      });
      res.status(500).json({ error: err.message || 'Failed to create batch' });
    }
  });

  // Web Share Target fallback (prevents HTTP 405 if POST hits backend directly)
  app.all('/share-target', (req, res) => {
    res.redirect(303, '/?shared=1');
  });

  // Admin endpoint to purge random/seed mock images
  app.post('/api/clean-mock-data', (req, res) => {
    try {
      const removed = dataStore.cleanMockData();
      res.json({ success: true, removed });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Get all batches
  app.get('/api/batches', (req, res) => {
    try {
      const batches = dataStore.getBatches();
      res.json(batches);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Get specific batch with real-time status and item list
  app.get('/api/batches/:id', (req, res) => {
    try {
      const batch = dataStore.getBatch(req.params.id);
      if (!batch) {
        return res.status(404).json({ error: 'Batch not found' });
      }
      const products = dataStore.getBatchProducts(req.params.id);
      res.json({ batch, products });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Products query (with the 4 core filters: date, supplier, price range, fabric)
  app.get('/api/products', (req, res) => {
    try {
      const {
        date,
        supplier,
        minPrice,
        maxPrice,
        fabric,
        category,
        searchQuery,
        status,
      } = req.query;

      const products = dataStore.getProducts({
        date: date as string,
        supplier: supplier as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        fabric: fabric as string,
        category: category as string,
        searchQuery: searchQuery as string,
        status: status as string,
      });

      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Update single product (Father's quick review & correction)
  app.patch('/api/products/:id', (req, res) => {
    try {
      const updated = dataStore.updateProduct(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Bulk approve ready products in batch
  app.post('/api/products/bulk-approve', (req, res) => {
    try {
      const { batchId } = req.body;
      if (!batchId) {
        return res.status(400).json({ error: 'batchId is required' });
      }
      const count = dataStore.bulkApproveBatch(batchId);
      res.json({ approvedCount: count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Get dynamic list of all suppliers with design counts
  app.get('/api/suppliers', (req, res) => {
    try {
      const suppliers = dataStore.getSuppliers();
      res.json(suppliers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Test OCR extraction on a single image or text stamp
  app.post('/api/ocr/test-extract', async (req, res) => {
    try {
      const { text, imageUrl } = req.body;
      let rawText = text || '';
      let usedMethod = 'tier1_regex';

      // If no text hint provided but image is present, run local Tesseract OCR
      if (!rawText && imageUrl) {
        rawText = await runLocalOcr(imageUrl);
        usedMethod = 'tier1_tesseract';
      }

      const tier1 = parseSuratTextileRegex(rawText);
      let finalData = tier1.data;

      let tier2: any = null;
      // If Tier 1 incomplete and image provided, fall back to Gemini Vision
      if (!tier1.isComplete && imageUrl) {
        tier2 = await parseWithGeminiVision(imageUrl, rawText, tier1.data);
        finalData = {
          price: tier1.data.price ?? tier2.data.price,
          fabric: tier1.data.fabric ?? tier2.data.fabric,
          code: tier1.data.code ?? tier2.data.code,
        };
        usedMethod = 'tier2_gemini';
      }

      res.json({
        data: finalData,
        method: usedMethod,
        rawOcrText: rawText,
        tier1Attempt: tier1,
        tier2Result: tier2,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Cost Optimization Metrics & Projections
  app.get('/api/metrics', (req, res) => {
    try {
      const metrics = dataStore.getMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Vite / Frontend Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  function listen(portToTry: number) {
    const server = app.listen(portToTry, '0.0.0.0', () => {
      console.log(`Surat Textile B2B Server running on port ${portToTry}`);
    });
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${portToTry} is already in use. Trying port ${portToTry + 1}...`);
        listen(portToTry + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  }

  listen(PORT);
}

startServer();
