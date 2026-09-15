import React, { useState } from 'react';
import { 
  Share2, 
  Edit3, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  Check 
} from 'lucide-react';
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
  onApprove,
  isAdmin = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);

  // Generate WhatsApp message for textile B2B buyers
  const shareText = `*Surat Textile Wholesale Design*
📍 *Code:* ${product.code || 'N/A'}
🧵 *Fabric:* ${product.fabric || 'Quality not specified'}
💰 *Wholesale Rate:* ${product.price ? `₹${product.price}/-` : 'Contact for Rate'}
🏭 *Supplier:* ${product.supplier}
✨ *Category:* ${product.category}`;

  const handleCopyShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppDirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const isReviewNeeded = product.status === 'needs_review';

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

          {/* Top Overlays - Clean design badge and category, no error queries on photo */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1">
            {product.code ? (
              <span className="px-2 py-0.5 rounded-md text-xs font-bold tracking-wider uppercase bg-stone-900/85 backdrop-blur-xs text-white shadow-xs">
                {product.code}
              </span>
            ) : <span />}

            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-900/70 text-white backdrop-blur-xs">
              {product.category || 'Textile'}
            </span>
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

              {/* Fabric Pill (only shown if fabric is known - never show 'Fabric Unclear') */}
              {product.fabric ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                  {product.fabric}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
                  {product.category}
                </span>
              )}
            </div>

            {/* Supplier / Mill */}
            <p className="text-xs text-stone-600 truncate font-medium" title={product.supplier}>
              {product.supplier}
            </p>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5">
            {/* Quick Edit (Admin only) */}
            {isAdmin && (
              <button
                id={`btn-edit-product-${product.id}`}
                onClick={() => onEdit(product)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
                title="Edit extracted fields"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isReviewNeeded ? 'Fix Field' : 'Edit'}</span>
              </button>
            )}

            {/* WhatsApp Share to Client / Inquiry */}
            <div className={`flex items-center gap-1 ${!isAdmin ? 'w-full justify-between' : ''}`}>
              <button
                id={`btn-copy-quote-${product.id}`}
                onClick={handleCopyShare}
                className={`p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer ${
                  !isAdmin ? 'border border-stone-200 px-2 flex items-center gap-1 text-xs' : ''
                }`}
                title="Copy wholesale details"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {!isAdmin && <span className="text-[11px]">Copy</span>}
              </button>

              <button
                id={`btn-wa-share-${product.id}`}
                onClick={handleWhatsAppDirect}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs cursor-pointer ${
                  !isAdmin ? 'flex-1 justify-center' : ''
                }`}
                title="Share or Inquire on WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Quote</span>
              </button>
            </div>
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
                <p className="font-bold text-base">{product.code || 'Surat Saree Design'} • ₹{product.price || '—'}</p>
                <p className="text-xs text-stone-400">{product.fabric} • {product.supplier}</p>
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
