export interface ExtractedProductData {
  price: number | null;
  fabric: string | null;
  code: string | null;
}

export interface ProductRecord {
  id: string;
  batchId: string;
  supplier: string;
  category: 'Sarees' | 'Suits' | 'Dress Material' | 'Kurtis';
  price: number | null;
  fabric: string | null;
  code: string | null;
  imageUrl: string;
  originalText?: string;
  status: 'ready' | 'needs_review' | 'approved';
  flaggedReasons: string[];
  ocrMethod: 'tier1_regex' | 'tier1_tesseract' | 'tier2_gemini' | 'manual_edit';
  confidence: number;
  createdAt: string;
  hash?: string;
}

export interface BatchRecord {
  id: string;
  supplierName: string;
  totalImages: number;
  processedCount: number;
  readyCount: number;
  reviewCount: number;
  approvedCount: number;
  status: 'queued' | 'processing' | 'completed';
  createdAt: string;
  costEstimateUSD: number;
  source: 'ios_share_extension' | 'web_upload' | 'sample_batch';
}

export interface CostMetrics {
  totalImagesProcessed: number;
  tier1FreeCount: number;
  tier2GeminiCount: number;
  cacheHits: number;
  totalCostUSD: number;
  savedCostUSD: number;
  dailyVolumeAvg: number;
  projectedMonthlyCost: number;
  storageReductionPercent: number;
}

export interface UserSession {
  role: 'admin' | 'buyer';
  name: string;
  phone?: string;
  businessName?: string;
  city?: string;
  loggedInAt: string;
}

export interface CatalogueFilterState {
  date: 'all' | 'today' | 'yesterday' | 'last7days';
  supplier: string;
  minPrice: number;
  maxPrice: number;
  fabric: string;
  category: string;
  searchQuery: string;
}
