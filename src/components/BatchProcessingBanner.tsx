import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  CheckCheck,
  PackageCheck
} from 'lucide-react';
import { BatchRecord } from '../types.js';

interface BatchProcessingBannerProps {
  batch: BatchRecord | undefined;
  onFilterReviewOnly: () => void;
  onBulkApprove: (batchId: string) => void;
  onViewAllBatch: () => void;
}

export const BatchProcessingBanner: React.FC<BatchProcessingBannerProps> = ({
  batch,
  onFilterReviewOnly,
  onBulkApprove,
  onViewAllBatch,
}) => {
  if (!batch) return null;

  const isComplete = batch.status === 'completed';
  const progressPct = batch.totalImages > 0 
    ? Math.round((batch.processedCount / batch.totalImages) * 100) 
    : 100;

  return (
    <div className="mb-3 sm:mb-5 bg-gradient-to-r from-stone-900 to-stone-850 text-white rounded-2xl p-3 sm:p-4 shadow-sm border border-stone-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left Side: Summary */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {batch.source === 'ios_shortcut' ? 'WhatsApp Batch' : 'Batch Upload'}
            </span>
            <span className="text-xs text-stone-300 font-bold truncate">
              {batch.supplierName}
            </span>
            <span className="text-xs text-stone-500">
              ({batch.totalImages} designs)
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1.5 flex-wrap text-xs font-semibold">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{batch.readyCount} Ready</span>
            </span>

            {batch.reviewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{batch.reviewCount} Need Review</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {batch.reviewCount > 0 && (
            <button
              onClick={onFilterReviewOnly}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 transition cursor-pointer active:scale-95"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Review ({batch.reviewCount})</span>
            </button>
          )}

          {batch.readyCount > 0 && (
            <button
              onClick={() => onBulkApprove(batch.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer active:scale-95"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Approve All Ready</span>
            </button>
          )}

          <button
            onClick={onViewAllBatch}
            className="px-2.5 py-1.5 text-xs text-stone-400 hover:text-white transition cursor-pointer font-medium"
          >
            View
          </button>
        </div>

      </div>

      {/* Progress bar if still running in background */}
      {!isComplete && (
        <div className="mt-2.5 pt-2 border-t border-stone-800">
          <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400 animate-spin" />
              Processing ({batch.processedCount}/{batch.totalImages})...
            </span>
            <span className="font-bold">{progressPct}%</span>
          </div>
          <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
