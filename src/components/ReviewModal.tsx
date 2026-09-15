import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Zap, 
  Sparkles, 
  Save 
} from 'lucide-react';
import { ProductRecord } from '../types.js';
import { getMediaUrl } from '../services/api.js';

interface ReviewModalProps {
  product: ProductRecord | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<ProductRecord>, nextProduct?: boolean) => void;
  nextProductToReview?: ProductRecord | null;
}

const COMMON_FABRICS = [
  'Rayon',
  'Georgette',
  'Pure Georgette',
  'Dola Silk',
  'Pure Cotton',
  'Chanderi Cotton',
  'Organza',
  'Chiffon',
  'Bandhani Silk',
  'Crepe',
  'Heavy Rayon',
];

export const ReviewModal: React.FC<ReviewModalProps> = ({
  product,
  onClose,
  onSave,
  nextProductToReview,
}) => {
  if (!product) return null;

  const [price, setPrice] = useState<string>(product.price !== null ? String(product.price) : '');
  const [fabric, setFabric] = useState<string>(product.fabric || '');
  const [code, setCode] = useState<string>(product.code || '');
  const [supplier, setSupplier] = useState<string>(product.supplier || '');

  useEffect(() => {
    setPrice(product.price !== null ? String(product.price) : '');
    setFabric(product.fabric || '');
    setCode(product.code || '');
    setSupplier(product.supplier || '');
  }, [product]);

  const handleSubmit = (next: boolean = false) => {
    const numPrice = price.trim() ? Number(price) : null;
    onSave(
      product.id,
      {
        price: numPrice,
        fabric: fabric.trim() || null,
        code: code.trim() || null,
        supplier: supplier.trim() || product.supplier,
        status: 'approved',
      },
      next
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(Boolean(nextProductToReview));
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Product Image & OCR Text Stamp */}
        <div className="md:w-1/2 bg-stone-100 p-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-200">
          <div className="relative aspect-4/5 rounded-xl overflow-hidden bg-stone-200 shadow-inner">
            <img 
              src={getMediaUrl(product.imageUrl)} 
              alt={product.code || 'Textile Design'} 
              className="w-full h-full object-cover"
            />
            
            {/* Status indicator on image */}
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                product.status === 'needs_review' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-emerald-600 text-white'
              }`}>
                {product.status === 'needs_review' ? 'Needs Review' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Raw Text Detected */}
          <div className="mt-3 p-2.5 bg-white rounded-lg border border-stone-200 text-xs">
            <p className="text-stone-400 font-medium mb-0.5">Raw Text / Stamp Detected:</p>
            <p className="font-mono text-stone-800 text-[11px] bg-stone-50 p-1.5 rounded border border-stone-100 truncate">
              {product.originalText || 'No clear text stamp found'}
            </p>
            {product.flaggedReasons && product.flaggedReasons.length > 0 && (
              <div className="mt-1 text-amber-700 flex items-center gap-1 font-medium text-[11px]">
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Flag: {product.flaggedReasons.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Correction Form */}
        <div className="md:w-1/2 p-5 flex flex-col justify-between space-y-4 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Quick Design Review
                </h3>
                <p className="text-xs text-stone-500">
                  Verify or update details before sharing with clients
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              
              {/* Field 1: Price */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                  <span>1. Wholesale Rate (₹)</span>
                  {!price && <span className="text-rose-500 text-[11px] font-medium">*Missing</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">₹</span>
                  <input
                    id="input-review-price"
                    type="number"
                    step="10"
                    placeholder="e.g. 450"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    autoFocus={!price}
                    className={`w-full pl-8 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      !price ? 'border-rose-300 bg-rose-50/20' : 'border-stone-200 bg-stone-50'
                    }`}
                  />
                </div>
                {/* Quick Price Chips */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[350, 380, 420, 450, 490, 550, 620].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrice(String(p))}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                        price === String(p)
                          ? 'bg-amber-600 text-white border-amber-600 font-bold'
                          : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      ₹{p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Fabric */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                  <span>2. Fabric / Quality</span>
                  {!fabric && <span className="text-rose-500 text-[11px] font-medium">*Missing</span>}
                </label>
                <input
                  id="input-review-fabric"
                  type="text"
                  placeholder="e.g. Rayon, Georgette, Dola Silk"
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    !fabric ? 'border-rose-300 bg-rose-50/20' : 'border-stone-200 bg-stone-50'
                  }`}
                />
                
                {/* Quick Fabric Chips */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {COMMON_FABRICS.slice(0, 5).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFabric(f)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                        fabric.toLowerCase() === f.toLowerCase()
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Product Code */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                  <span>3. Design / Product Code</span>
                  {!code && <span className="text-rose-500 text-[11px] font-medium">*Missing</span>}
                </label>
                <input
                  id="input-review-code"
                  type="text"
                  placeholder="e.g. R182, D-998, 1024"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    !code ? 'border-rose-300 bg-rose-50/20' : 'border-stone-200 bg-stone-50'
                  }`}
                />
              </div>

              {/* Supplier (Readonly or editable) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Supplier / Mill Name
                </label>
                <input
                  id="input-review-supplier"
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-stone-600 rounded-lg border border-stone-200 bg-stone-50 focus:outline-none"
                />
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="flex items-center gap-2">
              <button
                id="btn-save-approve"
                type="button"
                onClick={() => handleSubmit(false)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve &amp; Save</span>
              </button>

              {nextProductToReview && (
                <button
                  id="btn-save-next"
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 hover:bg-black text-white transition cursor-pointer"
                  title="Save and jump to next review item"
                >
                  <span>Next Flagged</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-[11px] text-stone-400 text-center">
              Press <strong>Ctrl+Enter</strong> to approve
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
