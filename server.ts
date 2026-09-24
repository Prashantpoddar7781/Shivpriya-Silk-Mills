import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { dataStore } from './src/services/dataStore.js';
import { parseSuratTextileRegex, runLocalOcr, parseWithGeminiVision } from './src/services/textileOcr.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB per image
    files: 250, // up to 250 images in a batch
  },
});

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

  // Support ultra-high payload for large batch image transfers (100 to 200+ images) from iOS/Android Share Target
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
  const uploadsPath = path.join(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. Upload batch (called from iOS Shortcut, iOS Share Extension, or Web Uploader)
  app.post('/api/batches/upload', upload.any(), async (req, res) => {
    try {
      let images: any[] = [];
      const supplierName = req.body.supplierName || req.body.supplier || req.body['supplier...'] || 'Surat Supplier';
      const source = req.body.source || (req.files && (req.files as any[]).length > 0 ? 'ios_shortcut' : 'web_upload');

      // Case 1: multipart/form-data files (e.g. from Apple Shortcuts or HTML forms)
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const files = req.files as Express.Multer.File[];
        images = files.map((file, idx) => {
          const base64 = `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`;
          return {
            id: `shortcut_img_${Date.now()}_${idx + 1}`,
            imageUrl: base64,
            category: 'Sarees',
            textHint: file.originalname || '',
          };
        });
      } else if (req.body.images && Array.isArray(req.body.images)) {
        // Case 2: JSON payload (from Web Uploader or iOS Share Extension)
        images = req.body.images;
      }

      if (images.length === 0) {
        return res.status(400).json({ error: 'Please provide at least 1 image in the batch.' });
      }

      const batch = await dataStore.createAndProcessBatch(
        supplierName,
        images,
        source
      );

      res.status(201).json(batch);
    } catch (err: any) {
      console.error('Batch upload error:', err);
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

      // If Tier 1 incomplete and image provided, fall back to Gemini Vision
      if (!tier1.isComplete && imageUrl) {
        const tier2 = await parseWithGeminiVision(imageUrl, rawText, tier1.data);
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
