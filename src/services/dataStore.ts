import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BatchRecord, CostMetrics, ProductRecord } from '../types.js';
import { parseSuratTextileRegex, runLocalOcr, parseWithGeminiVision } from './textileOcr.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'catalogue.json');

// Pre-seeded high quality Surat textile items if database is freshly created
export const INITIAL_SAMPLE_ITEMS = [
  {
    code: 'R182',
    fabric: 'Rayon',
    price: 450,
    supplier: 'Radhe Krishna Tex (Millennium Market)',
    category: 'Sarees' as const,
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&auto=format&fit=crop&q=80',
    originalText: '₹450 | Rayon | R182',
    status: 'approved' as const,
    ocrMethod: 'tier1_regex' as const,
    flaggedReasons: [],
    dateOffsetHours: 2,
  },
  {
    code: 'D-998',
    fabric: 'Georgette',
    price: 620,
    supplier: 'Radhe Krishna Tex (Millennium Market)',
    category: 'Sarees' as const,
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80',
    originalText: 'D-998 Price: 620 Quality: Georgette',
    status: 'approved' as const,
    ocrMethod: 'tier1_regex' as const,
    flaggedReasons: [],
    dateOffsetHours: 4,
  },
  {
    code: 'DS-77',
    fabric: 'Dola Silk',
    price: 380,
    supplier: 'Mahalaxmi Saree Kendra (Ring Road)',
    category: 'Sarees' as const,
    imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=700&auto=format&fit=crop&q=80',
    originalText: '₹380 | Dola Silk | DS-77',
    status: 'approved' as const,
    ocrMethod: 'tier1_regex' as const,
    flaggedReasons: [],
    dateOffsetHours: 8,
  },
  {
    code: 'CH-990',
    fabric: 'Chanderi Cotton',
    price: 420,
    supplier: 'Mahalaxmi Saree Kendra (Ring Road)',
    category: 'Suits' as const,
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=700&auto=format&fit=crop&q=80',
    originalText: 'Rate 420 | Chanderi Cotton | CH-990',
    status: 'approved' as const,
    ocrMethod: 'tier1_regex' as const,
    flaggedReasons: [],
    dateOffsetHours: 12,
  },
  {
    code: 'ORG-105',
    fabric: 'Organza',
    price: 490,
    supplier: 'Shree Balaji Creation (Japan Market)',
    category: 'Sarees' as const,
    imageUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=700&auto=format&fit=crop&q=80',
    originalText: '₹490 | Organza Silk | ORG-105',
    status: 'approved' as const,
    ocrMethod: 'tier1_regex' as const,
    flaggedReasons: [],
    dateOffsetHours: 18,
  },
  {
    code: 'BS-220',
    fabric: 'Bandhani Silk',
    price: 350,
    supplier: 'Shree Balaji Creation (Japan Market)',
    category: 'Sarees' as const,
    imageUrl: 'https://images.unsplash.com/photo-1610030469668-932d43fa58a7?w=700&auto=format&fit=crop&q=80',
    originalText: '350/- Bandhani Silk BS-220',
    status: 'approved' as const,
    ocrMethod: 'tier1_regex' as const,
    flaggedReasons: [],
    dateOffsetHours: 24,
  },
  {
    code: 'CR-512',
    fabric: 'Crepe',
    price: 520,
    supplier: 'Om Silk Mills (Sahara Darwaja)',
    category: 'Suits' as const,
    imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=700&auto=format&fit=crop&q=80',
    originalText: 'Price 520 Crepe Digital Print CR-512',
    status: 'approved' as const,
    ocrMethod: 'tier1_regex' as const,
    flaggedReasons: [],
    dateOffsetHours: 36,
  },
  {
    code: 'D-1024',
    fabric: 'Pure Cotton',
    price: 320,
    supplier: 'Om Silk Mills (Sahara Darwaja)',
    category: 'Suits' as const,
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&auto=format&fit=crop&q=80',
    originalText: 'Rate 320/- D.No. 1024 Pure Cotton',
    status: 'approved' as const,
    ocrMethod: 'tier1_regex' as const,
    flaggedReasons: [],
    dateOffsetHours: 48,
  },
  {
    code: 'RY-310',
    fabric: 'Heavy Rayon',
    price: 460,
    supplier: 'Kavita Fashion (Radhe Market)',
    category: 'Dress Material' as const,
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700&auto=format&fit=crop&q=80',
    originalText: 'Heavy Rayon 14KG Rate: 460/- RY-310',
    status: 'approved' as const,
    ocrMethod: 'tier1_regex' as const,
    flaggedReasons: [],
    dateOffsetHours: 60,
  },
  // Items flagged for father review (unclear/missing fields from WhatsApp stamp)
  {
    code: 'SK-401',
    fabric: 'Rayon',
    price: null, // Price missing on stamp!
    supplier: 'Radhe Krishna Tex (Millennium Market)',
    category: 'Sarees' as const,
    imageUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=700&auto=format&fit=crop&q=80',
    originalText: 'Rayon Foil Print Design SK-401 (Rate tag torn)',
    status: 'needs_review' as const,
    ocrMethod: 'tier1_regex' as const,
    flaggedReasons: ['Price missing on stamp'],
    dateOffsetHours: 1,
  },
  {
    code: null, // Missing code
    fabric: 'Dola Silk',
    price: 480,
    supplier: 'Mahalaxmi Saree Kendra (Ring Road)',
    category: 'Sarees' as const,
    imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=700&auto=format&fit=crop&q=80',
    originalText: '₹480/- Dola Silk Floral (Design No blurred)',
    status: 'needs_review' as const,
    ocrMethod: 'tier2_gemini' as const,
    flaggedReasons: ['Product code blurred or missing'],
    dateOffsetHours: 1,
  },
  {
    code: 'JAC-88',
    fabric: null, // Fabric unclear
    price: 540,
    supplier: 'Shree Balaji Creation (Japan Market)',
    category: 'Sarees' as const,
    imageUrl: 'https://images.unsplash.com/photo-1610030469668-932d43fa58a7?w=700&auto=format&fit=crop&q=80',
    originalText: '₹540 JAC-88 Fancy Mill Jacquard Special',
    status: 'needs_review' as const,
    ocrMethod: 'tier1_regex' as const,
    flaggedReasons: ['Fabric quality unclear'],
    dateOffsetHours: 2,
  },
];

export interface BatchItemInput {
  id?: string;
  imageUrl: string;
  textHint?: string;
  category?: 'Sarees' | 'Suits' | 'Dress Material' | 'Kurtis';
  hash?: string;
}

export class DataStore {
  private batches: Map<string, BatchRecord> = new Map();
  private products: Map<string, ProductRecord> = new Map();
  private hashCache: Map<string, ProductRecord> = new Map();

  private metrics: CostMetrics = {
    totalImagesProcessed: 1248,
    tier1FreeCount: 1162,
    tier2GeminiCount: 86,
    cacheHits: 142,
    totalCostUSD: 0.0344,
    savedCostUSD: 59.85,
    dailyVolumeAvg: 380,
    projectedMonthlyCost: 1.15,
    storageReductionPercent: 82.4,
  };

  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initDirectories();
    this.loadFromDisk();
  }

  private initDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  private loadFromDisk() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.batches)) {
          parsed.batches.forEach((b: BatchRecord) => this.batches.set(b.id, b));
        }
        if (Array.isArray(parsed.products)) {
          parsed.products.forEach((p: ProductRecord) => {
            this.products.set(p.id, p);
            if (p.hash) this.hashCache.set(p.hash, p);
          });
        }
        if (parsed.metrics) {
          this.metrics = { ...this.metrics, ...parsed.metrics };
        }
        return;
      } catch (err) {
        console.error('Failed to parse existing data file, re-seeding:', err);
      }
    }

    // Seed initial dataset if no file exists
    this.seedInitialDataset();
    this.saveToDiskSync();
  }

  private seedInitialDataset() {
    const initialBatchId = 'batch_seed_01';
    const now = Date.now();

    const initialBatch: BatchRecord = {
      id: initialBatchId,
      supplierName: 'Radhe Krishna Tex (Millennium Market)',
      totalImages: 50,
      processedCount: 50,
      readyCount: 47,
      reviewCount: 3,
      approvedCount: 47,
      status: 'completed',
      createdAt: new Date(now - 3600000).toISOString(),
      costEstimateUSD: 0.0016,
      source: 'ios_share_extension',
    };
    this.batches.set(initialBatchId, initialBatch);

    INITIAL_SAMPLE_ITEMS.forEach((item, index) => {
      const id = `prod_${index + 1}`;
      const record: ProductRecord = {
        id,
        batchId: initialBatchId,
        supplier: item.supplier,
        category: item.category,
        price: item.price,
        fabric: item.fabric,
        code: item.code,
        imageUrl: item.imageUrl,
        originalText: item.originalText,
        status: item.status,
        flaggedReasons: item.flaggedReasons,
        ocrMethod: item.ocrMethod,
        confidence: item.status === 'approved' ? 0.98 : 0.65,
        createdAt: new Date(now - item.dateOffsetHours * 3600000).toISOString(),
      };
      this.products.set(id, record);
    });
  }

  /**
   * Atomic file saving with debounce to prevent excessive disk writes during batch streaming
   */
  public scheduleSave() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.saveToDiskSync();
    }, 400);
  }

  public saveToDiskSync() {
    try {
      const data = {
        batches: Array.from(this.batches.values()),
        products: Array.from(this.products.values()),
        metrics: this.metrics,
      };
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  /**
   * Save an uploaded base64 data URL to the disk in data/uploads/
   * Returns a clean static URL (/uploads/:filename) and a SHA-256 hash.
   */
  public async saveBase64ImageToDisk(
    id: string,
    dataUrlOrBase64: string
  ): Promise<{ url: string; hash: string }> {
    if (!dataUrlOrBase64 || dataUrlOrBase64.startsWith('http://') || dataUrlOrBase64.startsWith('https://')) {
      const hash = crypto.createHash('sha256').update(dataUrlOrBase64).digest('hex');
      return { url: dataUrlOrBase64, hash };
    }

    let mimeType = 'image/jpeg';
    let base64Data = dataUrlOrBase64;
    let ext = 'jpg';

    if (dataUrlOrBase64.startsWith('data:')) {
      const match = dataUrlOrBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
        if (mimeType.includes('png')) ext = 'png';
        else if (mimeType.includes('webp')) ext = 'webp';
      }
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const filename = `${id}_${hash.substring(0, 8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    try {
      await fs.promises.writeFile(filePath, buffer);
      return { url: `/uploads/${filename}`, hash };
    } catch (err) {
      console.error('Failed to save image to disk:', err);
      return { url: dataUrlOrBase64, hash };
    }
  }

  public getBatches(): BatchRecord[] {
    return Array.from(this.batches.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getBatch(id: string): BatchRecord | undefined {
    return this.batches.get(id);
  }

  public getBatchProducts(batchId: string): ProductRecord[] {
    return Array.from(this.products.values()).filter((p) => p.batchId === batchId);
  }

  public getSuppliers(): Array<{ name: string; count: number }> {
    const counts = new Map<string, number>();
    for (const p of this.products.values()) {
      if (p.supplier) {
        const s = p.supplier.trim();
        counts.set(s, (counts.get(s) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  public getProducts(filters?: {
    date?: string;
    supplier?: string;
    minPrice?: number;
    maxPrice?: number;
    fabric?: string;
    category?: string;
    searchQuery?: string;
    status?: string;
  }): ProductRecord[] {
    let result = Array.from(this.products.values());

    if (!filters) return result;

    const { date, supplier, minPrice, maxPrice, fabric, category, searchQuery, status } = filters;

    if (status && status !== 'all') {
      result = result.filter((p) => p.status === status);
    }

    if (supplier && supplier !== 'all') {
      result = result.filter((p) => p.supplier.toLowerCase().includes(supplier.toLowerCase()));
    }

    if (fabric && fabric !== 'all') {
      result = result.filter(
        (p) => p.fabric && p.fabric.toLowerCase().includes(fabric.toLowerCase())
      );
    }

    if (category && category !== 'all') {
      result = result.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (typeof minPrice === 'number' && minPrice > 0) {
      result = result.filter((p) => p.price !== null && p.price >= minPrice);
    }

    if (typeof maxPrice === 'number' && maxPrice > 0) {
      result = result.filter((p) => p.price !== null && p.price <= maxPrice);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.code && p.code.toLowerCase().includes(q)) ||
          (p.fabric && p.fabric.toLowerCase().includes(q)) ||
          (p.supplier && p.supplier.toLowerCase().includes(q)) ||
          (p.originalText && p.originalText.toLowerCase().includes(q))
      );
    }

    if (date && date !== 'all') {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      result = result.filter((p) => {
        const itemTime = new Date(p.createdAt).getTime();
        if (date === 'today') {
          return now - itemTime <= oneDay;
        } else if (date === 'yesterday') {
          return now - itemTime > oneDay && now - itemTime <= 2 * oneDay;
        } else if (date === 'last7days') {
          return now - itemTime <= 7 * oneDay;
        }
        return true;
      });
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public updateProduct(
    id: string,
    updates: Partial<Pick<ProductRecord, 'price' | 'fabric' | 'code' | 'status' | 'supplier'>>
  ): ProductRecord | null {
    const existing = this.products.get(id);
    if (!existing) return null;

    const updated: ProductRecord = {
      ...existing,
      ...updates,
      ocrMethod: 'manual_edit',
      confidence: 1.0,
      flaggedReasons: updates.status === 'approved' ? [] : existing.flaggedReasons,
    };

    if (updated.price !== null && updated.fabric && updated.code && updates.status === undefined) {
      updated.status = 'approved';
      updated.flaggedReasons = [];
    }

    this.products.set(id, updated);
    this.recalculateBatchCounts(updated.batchId);
    this.scheduleSave();
    return updated;
  }

  public bulkApproveBatch(batchId: string): number {
    let count = 0;
    for (const [id, prod] of this.products.entries()) {
      if (prod.batchId === batchId && prod.status !== 'approved') {
        prod.status = 'approved';
        prod.flaggedReasons = [];
        this.products.set(id, prod);
        count++;
      }
    }
    this.recalculateBatchCounts(batchId);
    this.scheduleSave();
    return count;
  }

  private recalculateBatchCounts(batchId: string) {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    const prods = this.getBatchProducts(batchId);
    batch.processedCount = prods.length;
    batch.readyCount = prods.filter((p) => p.status === 'ready' || p.status === 'approved').length;
    batch.reviewCount = prods.filter((p) => p.status === 'needs_review').length;
    batch.approvedCount = prods.filter((p) => p.status === 'approved').length;
  }

  public getMetrics(): CostMetrics {
    return { ...this.metrics };
  }

  /**
   * Asynchronously process a shared batch of 1 to 50+ images from WhatsApp iOS Share Extension
   * or the Web batch uploader.
   */
  public async createAndProcessBatch(
    supplierName: string,
    items: BatchItemInput[],
    source: 'ios_share_extension' | 'web_upload' | 'sample_batch' = 'ios_share_extension'
  ): Promise<BatchRecord> {
    const batchId = `batch_${Date.now()}`;
    const totalImages = items.length;

    const newBatch: BatchRecord = {
      id: batchId,
      supplierName: supplierName.trim() || 'Surat Supplier',
      totalImages,
      processedCount: 0,
      readyCount: 0,
      reviewCount: 0,
      approvedCount: 0,
      status: 'processing',
      createdAt: new Date().toISOString(),
      costEstimateUSD: 0,
      source,
    };

    this.batches.set(batchId, newBatch);
    this.scheduleSave();

    // Launch background asynchronous worker
    setImmediate(async () => {
      let tier1Count = 0;
      let tier2Count = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const prodId = `prod_${batchId}_${i + 1}`;

        // 1. Save image to disk if base64 payload & compute SHA-256 hash
        let finalImageUrl = item.imageUrl;
        let imageHash = item.hash;

        if (item.imageUrl.startsWith('data:image')) {
          const saved = await this.saveBase64ImageToDisk(prodId, item.imageUrl);
          finalImageUrl = saved.url;
          imageHash = saved.hash;
        }

        // 2. Hash Deduplication Check
        if (imageHash && this.hashCache.has(imageHash)) {
          const cached = this.hashCache.get(imageHash)!;
          const cloned: ProductRecord = {
            ...cached,
            id: prodId,
            batchId,
            supplier: newBatch.supplierName,
            createdAt: new Date().toISOString(),
          };
          this.products.set(prodId, cloned);
          this.metrics.cacheHits++;
          newBatch.processedCount++;
          if (cloned.status === 'needs_review') newBatch.reviewCount++;
          else newBatch.readyCount++;
          this.scheduleSave();
          continue;
        }

        // 3. Tier 1: Zero-cost regex + local OCR
        let rawOcrText = item.textHint || '';
        let tier1Result = parseSuratTextileRegex(rawOcrText);

        // If text hint didn't yield full fields and image is present, try local Tesseract OCR
        if (!tier1Result.isComplete && item.imageUrl.startsWith('data:image')) {
          try {
            const localOcrText = await runLocalOcr(item.imageUrl);
            if (localOcrText.trim()) {
              rawOcrText = `${rawOcrText} ${localOcrText}`.trim();
              tier1Result = parseSuratTextileRegex(rawOcrText);
            }
          } catch {
            // Local OCR failure safely ignored
          }
        }

        let finalData = tier1Result.data;
        let ocrMethod: ProductRecord['ocrMethod'] = 'tier1_regex';

        if (tier1Result.isComplete) {
          tier1Count++;
        } else {
          // 4. Tier 2: Gemini Vision fallback for missing/ambiguous fields
          if (item.imageUrl) {
            try {
              const tier2Result = await parseWithGeminiVision(
                item.imageUrl,
                rawOcrText,
                tier1Result.data
              );
              finalData = {
                price: tier1Result.data.price ?? tier2Result.data.price,
                fabric: tier1Result.data.fabric ?? tier2Result.data.fabric,
                code: tier1Result.data.code ?? tier2Result.data.code,
              };
              ocrMethod = 'tier2_gemini';
              tier2Count++;
            } catch {
              finalData = tier1Result.data;
            }
          }
        }

        // 5. Check if father review is required
        const flaggedReasons: string[] = [];
        if (finalData.price === null) flaggedReasons.push('Price missing on stamp');
        if (!finalData.fabric) flaggedReasons.push('Fabric quality unclear');
        if (!finalData.code) flaggedReasons.push('Product code blurred or missing');

        const needsReview = flaggedReasons.length > 0;
        const status: ProductRecord['status'] = needsReview ? 'needs_review' : 'ready';

        const record: ProductRecord = {
          id: prodId,
          batchId,
          supplier: newBatch.supplierName,
          category: item.category || 'Sarees',
          price: finalData.price,
          fabric: finalData.fabric,
          code: finalData.code,
          imageUrl: finalImageUrl,
          originalText: rawOcrText || (finalData.price ? `₹${finalData.price} ${finalData.fabric || ''} ${finalData.code || ''}`.trim() : 'Design photo'),
          status,
          flaggedReasons,
          ocrMethod,
          confidence: needsReview ? 0.65 : 0.98,
          createdAt: new Date().toISOString(),
          hash: imageHash,
        };

        this.products.set(prodId, record);
        if (imageHash) {
          this.hashCache.set(imageHash, record);
        }

        newBatch.processedCount++;
        if (needsReview) {
          newBatch.reviewCount++;
        } else {
          newBatch.readyCount++;
        }

        // Periodic progressive save every 5 items or on last item
        if (i % 5 === 0 || i === items.length - 1) {
          this.scheduleSave();
        }
      }

      newBatch.status = 'completed';
      newBatch.costEstimateUSD = tier2Count * 0.0004;

      // Update global cost metrics
      this.metrics.totalImagesProcessed += items.length;
      this.metrics.tier1FreeCount += tier1Count;
      this.metrics.tier2GeminiCount += tier2Count;
      this.metrics.totalCostUSD += newBatch.costEstimateUSD;
      this.metrics.savedCostUSD += items.length * 0.05 - newBatch.costEstimateUSD;

      this.saveToDiskSync();
    });

    return newBatch;
  }
}

export const dataStore = new DataStore();
