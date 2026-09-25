import React, { useState } from 'react';
import { Share2, ZoomIn, Check, Edit3 } from 'lucide-react';
import { ProductRecord } from '../types.js';
import { getMediaUrl } from '../services/api.js';

interface ProductCardProps {
  product: ProductRecord;
  onEdit: (product: ProductRecord) => void;
  onApprove?: (product: ProductRecord) => void;
  isAdmin?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  isAdmin,
}) => {
  const [showImageZoom, setShowImageZoom] = useState(false);

  // Generate clean WhatsApp message for wholesale buyers
  const shareText = `*Shivpriya Silk Mills • Surat Wholesale Design*
${product.code ? `📍 *Design / Code:* ${product.code}\n` : ''}${product.fabric ? `🧵 *Fabric:* ${product.fabric}\n` : ''}💰 *Wholesale Rate:* ${product.price ? `₹${product.price}/-` : 'Contact for Rate'}
🏭 *Supplier:* ${product.supplier}
✨ *Category:* ${product.category || 'Sarees'}`;

  const handleWhatsAppDirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <>
      <div 
        id={`product-card-${product.id}`}
        className="group relative bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400/80 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
      >
        {/* Image Container with Badges */}
        <div 
          className="relative aspect-3/4 bg-stone-100 overflow-hidden cursor-pointer"
          onClick={() => setShowImageZoom(true)}
        >
          <img
            src={getMediaUrl(product.imageUrl)}
            alt={product.code || 'Surat Wholesale Saree'}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />

          {/* Top-Left Supplier Badge */}
          <div className="absolute top-2 left-2 max-w-[80%]">
            {product.supplier && (
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide bg-stone-900/80 backdrop-blur-md text-white shadow-xs truncate block">
                {product.supplier}
              </span>
            )}
          </div>

          {/* Top-Right Admin Status Badge */}
          {isAdmin && (
            <div 
              className="absolute top-2 right-2 cursor-pointer active:scale-90 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(product);
              }}
              title="Click to Edit"
            >
              {product.status === 'ready' || product.status === 'approved' ? (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-stone-950 shadow-xs">
                  Review
                </span>
              )}
            </div>
          )}

          {/* Subtle zoom hint */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-1 rounded-full backdrop-blur-xs">
            <ZoomIn className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between gap-2">
          
          {/* Rate & Fabric */}
          <div>
            <div className="flex items-baseline justify-between gap-1">
              <div className="flex items-baseline gap-1 min-w-0">
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Rate:</span>
                <span className={`font-black tracking-tight text-stone-900 truncate ${product.price ? 'text-base sm:text-xl' : 'text-xs text-stone-600'}`}>
                  {product.price ? `₹${product.price}` : 'Rate on Request'}
                </span>
                {product.price && <span className="text-[11px] font-bold text-stone-400">/-</span>}
              </div>

              {/* Fabric Pill */}
              {product.fabric && (
                <span 
                  className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80 truncate max-w-[85px] sm:max-w-none shrink-0"
                  title={product.fabric}
                >
                  {product.fabric}
                </span>
              )}
            </div>

            {/* Design notes/caption if present */}
            {product.code && (
              <p className="text-[10px] sm:text-[11px] text-stone-500 truncate mt-0.5" title={product.code}>
                {product.code}
              </p>
            )}
          </div>

          {/* Clean Action Row */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <button
                id={`btn-wa-share-${product.id}`}
                onClick={handleWhatsAppDirect}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all shadow-xs cursor-pointer active:scale-96"
                title="Share or Inquire on WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                <span className="truncate">Share</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(product);
                }}
                className="p-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer shrink-0 active:scale-96"
                title="Edit Rate & Fabric"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id={`btn-wa-share-${product.id}`}
              onClick={handleWhatsAppDirect}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all shadow-xs cursor-pointer active:scale-96"
              title="Share or Inquire on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              <span className="truncate">Share on WhatsApp</span>
            </button>
          )}

        </div>
      </div>

      {/* Full Image Zoom Modal */}
      {showImageZoom && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
          onClick={() => setShowImageZoom(false)}
        >
          <div className="relative max-w-xl w-full max-h-[92vh] bg-stone-900 rounded-2xl overflow-hidden shadow-2xl p-2 sm:p-3 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <img 
              src={getMediaUrl(product.imageUrl)} 
              alt={product.code || 'Design Zoom'} 
              className="max-h-[65vh] sm:max-h-[72vh] w-auto mx-auto object-contain rounded-xl"
            />
            <div className="pt-3 pb-1 text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black text-base sm:text-lg text-amber-400">
                  {product.price ? `₹${product.price}/-` : 'Rate on Request'}
                  <span className="text-white font-normal text-xs sm:text-sm ml-2">• {product.supplier}</span>
                </p>
                <p className="text-xs text-stone-300 truncate">
                  {product.fabric ? `${product.fabric} • ` : ''}{product.code || product.category || 'Wholesale Saree'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleWhatsAppDirect}
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <button
                  onClick={() => setShowImageZoom(false)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
