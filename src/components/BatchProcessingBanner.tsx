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
    <div className="mb-6 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-800">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Side: Summary & Counts */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {batch.source === 'ios_share_extension' ? 'WhatsApp Shared Batch' : 'New Collection Batch'}
            </span>
            <span className="text-xs text-stone-400">
              {new Date(batch.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • Supplier:
            </span>
            <strong className="text-sm font-semibold text-amber-100">{batch.supplierName}</strong>
          </div>

          {/* Workflow Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {batch.totalImages} designs received from {batch.supplierName}
            </h2>
          </div>

          {/* Result Metric Badges */}
          <div className="flex items-center gap-3 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{batch.readyCount} ready for buyers</span>
            </div>

            {batch.reviewCount > 0 && (
              <>
                <div className="text-stone-500 font-bold">·</div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{batch.reviewCount} need review</span>
                </div>
              </>
            )}

            {batch.reviewCount === 0 && (
              <>
                <div className="text-stone-500 font-bold">·</div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-300">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>All designs ready &amp; active</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {batch.reviewCount > 0 && (
            <button
              id="btn-banner-review-flagged"
              onClick={onFilterReviewOnly}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 transition shadow-xs cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Review {batch.reviewCount} Items</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {batch.readyCount > 0 && (
            <button
              id="btn-banner-bulk-approve"
              onClick={() => onBulkApprove(batch.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Approve All Ready</span>
            </button>
          )}

          <button
            id="btn-banner-view-batch"
            onClick={onViewAllBatch}
            className="px-3 py-2 text-xs text-stone-400 hover:text-white transition cursor-pointer"
          >
            View All ({batch.totalImages})
          </button>
        </div>

      </div>

      {/* Progress bar if still running */}
      {!isComplete && (
        <div className="mt-4 pt-3 border-t border-stone-800">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              Organizing designs ({batch.processedCount}/{batch.totalImages})...
            </span>
            <span className="font-semibold">{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
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
