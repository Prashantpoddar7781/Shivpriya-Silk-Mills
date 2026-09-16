import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
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
}) => {
  const [showImageZoom, setShowImageZoom] = useState(false);

  // Generate WhatsApp message for textile B2B buyers
  const shareText = `*Surat Textile Wholesale Design*
${product.code ? `📍 *Code:* ${product.code}\n` : ''}${product.fabric ? `🧵 *Fabric:* ${product.fabric}\n` : ''}💰 *Wholesale Rate:* ${product.price ? `₹${product.price}/-` : 'Contact for Rate'}
🏭 *Supplier:* ${product.supplier}
✨ *Category:* ${product.category}`;

  const handleWhatsAppDirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <>
      <div 
        id={`product-card-${product.id}`}
        className="group bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
      >
        {/* Image Container with Badges */}
        <div 
          className="relative aspect-4/5 bg-stone-100 overflow-hidden cursor-pointer"
          onClick={() => setShowImageZoom(true)}
        >
          <img
            src={getMediaUrl(product.imageUrl)}
            alt={product.code || 'Textile Design'}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />

          {/* Top Overlay - ONLY supplier name on top left */}
          <div className="absolute top-2 left-2">
            {product.supplier && (
              <span className="px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-stone-900/85 backdrop-blur-xs text-white shadow-sm">
                {product.supplier}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
          
          {/* Price & Fabric Header */}
          <div>
            <div className="flex items-baseline justify-between gap-1 mb-1">
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-medium text-stone-500">Rate:</span>
                <span className="text-xl font-black tracking-tight text-stone-900">
                  {product.price ? `₹${product.price}` : 'Rate on Request'}
                </span>
                {product.price && <span className="text-xs text-stone-400">/-</span>}
              </div>

              {/* Fabric Pill (only shown if fabric is known) */}
              {product.fabric && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                  {product.fabric}
                </span>
              )}
            </div>
          </div>

          {/* Clean Action Row: Single WhatsApp Share */}
          <div className="pt-2 border-t border-stone-100">
            <button
              id={`btn-wa-share-${product.id}`}
              onClick={handleWhatsAppDirect}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs cursor-pointer active:scale-98"
              title="Share or Inquire on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>
          </div>

        </div>
      </div>

      {/* Full Image Zoom Modal */}
      {showImageZoom && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowImageZoom(false)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-stone-900 rounded-xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <img 
              src={getMediaUrl(product.imageUrl)} 
              alt={product.code || 'Design Zoom'} 
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-lg"
            />
            <div className="p-3 text-white flex items-center justify-between">
              <div>
                <p className="font-bold text-base">{product.supplier} • {product.price ? `₹${product.price}/-` : 'Rate on Request'}</p>
                <p className="text-xs text-stone-400">{product.fabric ? `${product.fabric} • ` : ''}{product.category || 'Wholesale Design'}</p>
              </div>
              <button
                onClick={() => setShowImageZoom(false)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
