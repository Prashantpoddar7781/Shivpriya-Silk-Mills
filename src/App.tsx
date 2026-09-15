import React, { useState, useEffect, useMemo } from 'react';
import { 
  Header 
} from './components/Header.js';
import { 
  FiltersBar 
} from './components/FiltersBar.js';
import { 
  ProductCard 
} from './components/ProductCard.js';
import { 
  BatchProcessingBanner 
} from './components/BatchProcessingBanner.js';
import { 
  ReviewModal 
} from './components/ReviewModal.js';
import { 
  WhatsAppShareSimulator 
} from './components/WhatsAppShareSimulator.js';
import { 
  WebUploadModal 
} from './components/WebUploadModal.js';
import { 
  AdminDashboard 
} from './components/AdminDashboard.js';
import { 
  LoginPage 
} from './components/LoginPage.js';
import { 
  LogoutPage 
} from './components/LogoutPage.js';
import { 
  BatchRecord, 
  CatalogueFilterState, 
  ProductRecord,
  UserSession
} from './types.js';
import { apiUrl } from './services/api.js';
import { getAndClearSharedFiles } from './services/shareDb.js';
import { 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  UploadCloud, 
  Share2, 
  Filter,
  ShieldCheck,
  LayoutDashboard,
  LogOut
} from 'lucide-react';

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('st_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [lastSession, setLastSession] = useState<UserSession | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('st_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.role === 'admin';
      }
    } catch {}
    return false;
  });
  const [activeTab, setActiveTab] = useState<'catalogue' | 'review' | 'ios_sim' | 'admin_dashboard' | 'login' | 'logout'>('catalogue');
  const [adminToast, setAdminToast] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 4 Core Filters: Date, Supplier, Price Range, Fabric + category & search
  const [filters, setFilters] = useState<CatalogueFilterState>({
    date: 'all',
    supplier: 'all',
    minPrice: 0,
    maxPrice: 5000,
    fabric: 'all',
    category: 'all',
    searchQuery: '',
  });

  // Modal states
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [sharedFiles, setSharedFiles] = useState<File[]>([]);
  const [dbSuppliers, setDbSuppliers] = useState<string[]>([]);

  // Load data
  const loadSuppliers = async () => {
    try {
      const res = await fetch(apiUrl('/api/suppliers'));
      if (res.ok) {
        const data = await res.json();
        setDbSuppliers(data.map((s: any) => s.name));
      }
    } catch (err) {
      console.error('Failed to load suppliers', err);
    }
  };

  const loadBatches = async () => {
    try {
      const res = await fetch(apiUrl('/api/batches'));
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
        if (data.length > 0 && !activeBatchId) {
          setActiveBatchId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load batches', err);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date !== 'all') params.append('date', filters.date);
      if (filters.supplier !== 'all') params.append('supplier', filters.supplier);
      if (filters.minPrice > 0) params.append('minPrice', String(filters.minPrice));
      if (filters.maxPrice < 5000) params.append('maxPrice', String(filters.maxPrice));
      if (filters.fabric !== 'all') params.append('fabric', filters.fabric);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.searchQuery.trim()) params.append('searchQuery', filters.searchQuery.trim());

      const res = await fetch(apiUrl(`/api/products?${params.toString()}`));
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
    loadSuppliers();

    // Check for images shared via WhatsApp Web Share Target
    const checkSharedImages = async () => {
      try {
        const files = await getAndClearSharedFiles();
        if (files && files.length > 0) {
          setSharedFiles(files);
          setIsUploadModalOpen(true);
          setAdminToast(`WhatsApp Share: Received ${files.length} design(s)! Select supplier.`);
          if (window.location.search.includes('shared=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (err) {
        console.error('Failed to check shared images:', err);
      }
    };

    checkSharedImages();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSharedImages();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  // Real-time polling for actively processing batch
  useEffect(() => {
    if (!activeBatchId) return;
    const current = batches.find((b) => b.id === activeBatchId);
    if (!current || current.status !== 'processing') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(apiUrl(`/api/batches/${activeBatchId}`));
        if (res.ok) {
          const { batch } = await res.json();
          setBatches((prev) => prev.map((b) => (b.id === activeBatchId ? batch : b)));
          if (batch.status === 'completed') {
            loadProducts();
            loadSuppliers();
            setAdminToast(`Batch complete: ${batch.readyCount} ready · ${batch.reviewCount} need review`);
            setTimeout(() => setAdminToast(null), 4000);
          }
        }
      } catch (err) {
        console.error('Batch polling error', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeBatchId, batches]);

  // Derived lists for dropdowns
  const suppliers = useMemo(() => {
    const set = new Set<string>(dbSuppliers);
    products.forEach((p) => {
      if (p.supplier) set.add(p.supplier);
    });
    return Array.from(set);
  }, [products, dbSuppliers]);

  const fabrics = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.fabric) set.add(p.fabric);
    });
    return Array.from(set);
  }, [products]);

  // Products needing review (father's task)
  const needsReviewProducts = useMemo(() => {
    return products.filter((p) => p.status === 'needs_review');
  }, [products]);

  const activeBatch = useMemo(() => {
    if (!batches.length) return undefined;
    return batches.find((b) => b.id === activeBatchId) || batches[0];
  }, [batches, activeBatchId]);

  // Next product for rapid review loop
  const nextReviewProduct = useMemo(() => {
    if (!editingProduct) return null;
    const remaining = needsReviewProducts.filter((p) => p.id !== editingProduct.id);
    return remaining.length > 0 ? remaining[0] : null;
  }, [editingProduct, needsReviewProducts]);

  // Save reviewed product
  const handleSaveProduct = async (
    id: string,
    updates: Partial<ProductRecord>,
    jumpToNext: boolean = false
  ) => {
    try {
      const res = await fetch(apiUrl(`/api/products/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        loadBatches();

        if (jumpToNext && nextReviewProduct) {
          setEditingProduct(nextReviewProduct);
        } else {
          setEditingProduct(null);
        }
      }
    } catch (err) {
      console.error('Failed to save product', err);
    }
  };

  // Bulk approve ready items in active batch
  const handleBulkApprove = async (batchId: string) => {
    try {
      const res = await fetch(apiUrl('/api/products/bulk-approve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId }),
      });
      if (res.ok) {
        loadProducts();
        loadBatches();
      }
    } catch (err) {
      console.error('Bulk approve failed', err);
    }
  };

  // When a batch is created via iOS Share Extension simulator or Web Uploader
  const handleBatchCreated = (batchId: string) => {
    setActiveBatchId(batchId);
    loadBatches();
    loadProducts();
    loadSuppliers();
    setActiveTab('catalogue');
    setAdminToast('Batch received! Processing OCR in background...');
    setTimeout(() => setAdminToast(null), 3500);
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    try {
      localStorage.setItem('st_user_session', JSON.stringify(session));
    } catch {}

    if (session.role === 'admin') {
      setIsAdmin(true);
      setActiveTab('admin_dashboard');
      setAdminToast(`Welcome, ${session.name}! Owner Control Desk unlocked.`);
    } else {
      setIsAdmin(false);
      setActiveTab('catalogue');
      setAdminToast(`Welcome, ${session.name}! Wholesale Catalogue ready.`);
    }
    setTimeout(() => setAdminToast(null), 3500);
  };

  const handleTriggerLogout = () => {
    setLastSession(userSession);
    setUserSession(null);
    setIsAdmin(false);
    try {
      localStorage.removeItem('st_user_session');
    } catch {}
    setActiveTab('logout');
    setAdminToast('Logged out securely');
    setTimeout(() => setAdminToast(null), 2500);
  };

  const handleTripleClickLogo = () => {
    const adminSession: UserSession = {
      role: 'admin',
      name: 'Agency Owner (Father)',
      loggedInAt: new Date().toISOString(),
    };
    setUserSession(adminSession);
    try {
      localStorage.setItem('st_user_session', JSON.stringify(adminSession));
    } catch {}
    setIsAdmin(true);
    setActiveTab('admin_dashboard');
    setAdminToast('Admin Access Unlocked: Welcome to Owner Control Desk');
    setTimeout(() => setAdminToast(null), 3500);
  };

  const handleExitAdmin = () => {
    setIsAdmin(false);
    setActiveTab('catalogue');
    setAdminToast('Exited to Buyer View');
    setTimeout(() => setAdminToast(null), 2500);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Top Navigation */}
      <Header
        isAdmin={isAdmin}
        userSession={userSession}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        batches={batches}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        needsReviewCount={needsReviewProducts.length}
        onTripleClickLogo={handleTripleClickLogo}
        onExitAdmin={handleExitAdmin}
        onNavigateLogin={() => setActiveTab('login')}
        onTriggerLogout={handleTriggerLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Tab -1: Dedicated Login Page */}
        {activeTab === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onBrowseAsGuest={() => setActiveTab('catalogue')}
            initialRole={isAdmin ? 'admin' : 'buyer'}
          />
        )}

        {/* Tab -2: Dedicated Logout Page */}
        {activeTab === 'logout' && (
          <LogoutPage
            lastSession={lastSession}
            onLoginAgain={() => setActiveTab('login')}
            onBrowseCatalogue={() => setActiveTab('catalogue')}
          />
        )}

        {/* Tab 0: Admin Dashboard Desk (Only accessible in Admin Mode) */}
        {activeTab === 'admin_dashboard' && (
          <AdminDashboard
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onGoToReview={() => setActiveTab('review')}
            onGoToWhatsAppImport={() => setActiveTab('ios_sim')}
            onGoToCatalogue={() => setActiveTab('catalogue')}
            onExitAdmin={handleExitAdmin}
            onTriggerLogout={handleTriggerLogout}
            needsReviewCount={needsReviewProducts.length}
            totalProductsCount={products.length}
            activeBatch={activeBatch}
            onBulkApprove={handleBulkApprove}
          />
        )}

        {/* Tab 1: Catalogue & B2B Wholesale Browsing */}
        {activeTab === 'catalogue' && (
          <div>
            {/* Admin Notice when viewing catalogue */}
            {isAdmin && (
              <div className="mb-4 bg-amber-500/10 border border-amber-400/40 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-950 font-medium">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Admin Mode Active: You can edit prices, fabrics, and design codes directly on any card below.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('admin_dashboard')}
                    className="font-bold text-amber-900 hover:underline cursor-pointer"
                  >
                    Open Admin Desk &rarr;
                  </button>
                  <span className="text-amber-300">•</span>
                  <button
                    onClick={handleExitAdmin}
                    className="text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
                  >
                    Exit to Buyer View
                  </button>
                </div>
              </div>
            )}

            {/* Batch Processing Live Progress Banner (Admin Only) */}
            {isAdmin && (
              <BatchProcessingBanner
                batch={activeBatch}
                onFilterReviewOnly={() => {
                  setActiveTab('review');
                }}
                onBulkApprove={handleBulkApprove}
                onViewAllBatch={() => {
                  setFilters({
                    date: 'all',
                    supplier: activeBatch?.supplierName || 'all',
                    minPrice: 0,
                    maxPrice: 5000,
                    fabric: 'all',
                    category: 'all',
                    searchQuery: '',
                  });
                }}
              />
            )}

            {/* 4 Core Filters Bar (Date, Supplier, Price Range, Fabric) */}
            <FiltersBar
              filters={filters}
              setFilters={setFilters}
              suppliers={suppliers}
              fabrics={fabrics}
              totalResultsCount={products.length}
            />

            {/* Product Grid */}
            {isLoading ? (
              <div className="py-20 text-center text-stone-400">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">Loading Surat wholesale designs...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto my-12 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  No Matching Wholesale Designs
                </h3>
                <p className="text-xs text-stone-500">
                  No items matched the current filter combination. Try clearing price bounds or choosing all fabrics.
                </p>
                <button
                  onClick={() =>
                    setFilters({
                      date: 'all',
                      supplier: 'all',
                      minPrice: 0,
                      maxPrice: 5000,
                      fabric: 'all',
                      category: 'all',
                      searchQuery: '',
                    })
                  }
                  className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
                {products.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    isAdmin={isAdmin}
                    onEdit={(p) => setEditingProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Father's Rapid Review & Approval */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500 text-white">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg font-bold text-stone-900">
                    Design Review &amp; Approvals
                  </h2>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Verify or update wholesale rates, fabrics, and design codes before sending to buyers.
                </p>
              </div>

              {activeBatch && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkApprove(activeBatch.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve All Ready ({activeBatch.readyCount})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Flagged Items Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Items Needing Review ({needsReviewProducts.length})</span>
                </h3>
                <span className="text-xs text-stone-500">
                  Click any card to fix missing price, fabric, or code
                </span>
              </div>

              {needsReviewProducts.length === 0 ? (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-8 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-sm font-bold text-emerald-950">
                    All Batch Items Approved &amp; Ready!
                  </p>
                  <p className="text-xs text-emerald-800">
                    No unclear stamps remaining. All designs are active in the client catalogue.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {needsReviewProducts.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      isAdmin={true}
                      onEdit={(p) => setEditingProduct(p)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Approved / Ready Items Section */}
            <div className="pt-4 border-t border-stone-200">
              <h3 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Ready &amp; Approved Catalogue Items ({products.filter((p) => p.status !== 'needs_review').length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 opacity-90">
                {products
                  .filter((p) => p.status !== 'needs_review')
                  .slice(0, 10)
                  .map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      isAdmin={true}
                      onEdit={(p) => setEditingProduct(p)}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive iPhone WhatsApp Share Extension Simulator */}
        {activeTab === 'ios_sim' && (
          <WhatsAppShareSimulator onBatchCreated={handleBatchCreated} />
        )}

      </main>

      {/* Review Dialog for Father */}
      <ReviewModal
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={handleSaveProduct}
        nextProductToReview={nextReviewProduct}
      />

      {/* Web Drag-and-Drop & WhatsApp Share Target Uploader */}
      <WebUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSharedFiles([]);
        }}
        onUploadSuccess={handleBatchCreated}
        initialFiles={sharedFiles}
      />

      {/* Admin Mode Floating Toast Feedback */}
      {adminToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-2.5 text-xs font-semibold animate-bounce">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{adminToast}</span>
        </div>
      )}

      {/* Clean Aesthetic Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">Surat Textile B2B Wholesale Catalogue</span>
            <span>•</span>
            <span>Millennium &amp; Ring Road Markets</span>
          </div>
          <p className="text-stone-400 text-[11px]">
            Private Buyer Portal • Fast Saree &amp; Suit WhatsApp Sharing
          </p>
        </div>
      </footer>

    </div>
  );
}
