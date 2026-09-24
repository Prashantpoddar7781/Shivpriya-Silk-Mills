import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BatchRecord, CostMetrics, ProductRecord } from '../types.js';
import { parseSuratTextileRegex, runLocalOcr, parseWithGeminiVision, extractDigitalWholesaleRate } from './textileOcr.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'catalogue.json');

export interface BatchItemInput {
  id?: string;
  imageUrl: string;
  textHint?: string;
  price?: number;
  category?: 'Sarees' | 'Suits' | 'Dress Material' | 'Kurtis';
  hash?: string;
}

export class DataStore {
  private batches: Map<string, BatchRecord> = new Map();
  private products: Map<string, ProductRecord> = new Map();
  private hashCache: Map<string, ProductRecord> = new Map();

  private metrics: CostMetrics = {
    totalImagesProcessed: 0,
    tier1FreeCount: 0,
    tier2GeminiCount: 0,
    cacheHits: 0,
    totalCostUSD: 0,
    savedCostUSD: 0,
    dailyVolumeAvg: 0,
    projectedMonthlyCost: 0,
    storageReductionPercent: 82.4,
  };

  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initDirectories();
    this.loadFromDisk();
    this.cleanMockData();
  }

  public cleanMockData(): number {
    let removed = 0;
    for (const [id, prod] of this.products.entries()) {
      if (prod.batchId === 'batch_seed_01' || prod.imageUrl?.includes('unsplash.com')) {
        this.products.delete(id);
        removed++;
      }
    }
    this.batches.delete('batch_seed_01');
    this.saveToDiskSync();
    return removed;
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
          parsed.batches
            .filter((b: BatchRecord) => b.id !== 'batch_seed_01')
            .forEach((b: BatchRecord) => this.batches.set(b.id, b));
        }
        if (Array.isArray(parsed.products)) {
          parsed.products
            .filter((p: ProductRecord) => p.batchId !== 'batch_seed_01' && !p.imageUrl?.includes('unsplash.com'))
            .forEach((p: ProductRecord) => {
              this.products.set(p.id, p);
              if (p.hash) this.hashCache.set(p.hash, p);
            });
        }
        if (parsed.metrics) {
          this.metrics = { ...this.metrics, ...parsed.metrics };
        }
        return;
      } catch (err) {
        console.error('Failed to parse existing data file:', err);
      }
    }
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

        // 3. Tier 1: Digital WhatsApp overlay extraction (white font) + regex + local OCR
        let digitalRate: number | null = null;
        if (item.imageUrl) {
          try {
            digitalRate = await extractDigitalWholesaleRate(item.imageUrl);
          } catch (e) {
            console.warn('Digital rate extraction warning:', e);
          }
        }

        let rawOcrText = item.textHint || '';
        let tier1Result = parseSuratTextileRegex(rawOcrText);

        if (digitalRate !== null) {
          tier1Result.data.price = digitalRate;
          tier1Result.isComplete = true;
          tier1Result.missingFields = tier1Result.missingFields.filter((f) => f !== 'price');
        }

        // If price or fabric is missing and image is present, try local Tesseract OCR
        if ((tier1Result.data.price === null || tier1Result.data.fabric === null) && (item.imageUrl || finalImageUrl)) {
          try {
            const localOcrText = await runLocalOcr(finalImageUrl || item.imageUrl);
            if (localOcrText.trim()) {
              rawOcrText = `${rawOcrText}\n${localOcrText}`.trim();
              const parsed = parseSuratTextileRegex(rawOcrText);
              if (tier1Result.data.price === null && parsed.data.price !== null) {
                tier1Result.data.price = parsed.data.price;
              }
              if (tier1Result.data.fabric === null && parsed.data.fabric !== null) {
                tier1Result.data.fabric = parsed.data.fabric;
              }
              if (tier1Result.data.code === null && parsed.data.code !== null) {
                tier1Result.data.code = parsed.data.code;
              }
            }
          } catch {
            // Local OCR failure safely ignored
          }
        }

        let finalData = tier1Result.data;
        let ocrMethod: ProductRecord['ocrMethod'] = digitalRate !== null ? 'tier1_tesseract' : 'tier1_regex';

        if (finalData.price !== null) {
          tier1Count++;
        } else {
          // 4. Tier 2: Gemini Vision fallback for missing fields
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

        if (typeof item.price === 'number' && item.price > 0) {
          finalData.price = item.price;
        }

        // 5. Check if father review is required
        const flaggedReasons: string[] = [];
        if (finalData.price === null) {
          flaggedReasons.push('Price not found on image');
        }

        const needsReview = finalData.price === null;
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

      // Batch-Level Rate & Fabric Inheritance:
      // When a supplier broadcasts 10-50 saree/suit designs, they are part of a single wholesale collection.
      // Often only 1 or 2 images have the WhatsApp sticker/tag (@385, Fabric Fenddy).
      // Any design in the batch missing rate or fabric automatically inherits the collection's details.
      const batchProducts = this.getBatchProducts(batchId);
      const detectedBatchPrice = batchProducts.find((p) => p.price !== null)?.price ?? null;
      const detectedBatchFabric = batchProducts.find((p) => p.fabric !== null)?.fabric ?? null;

      if (detectedBatchPrice !== null || detectedBatchFabric !== null) {
        for (const p of batchProducts) {
          let updated = false;
          if (p.price === null && detectedBatchPrice !== null) {
            p.price = detectedBatchPrice;
            p.status = 'ready';
            p.flaggedReasons = p.flaggedReasons.filter((r) => !r.includes('Price'));
            updated = true;
          }
          if (p.fabric === null && detectedBatchFabric !== null) {
            p.fabric = detectedBatchFabric;
            updated = true;
          }
          if (updated) {
            this.products.set(p.id, p);
          }
        }
      }

      this.recalculateBatchCounts(batchId);
      this.scheduleSave();

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
