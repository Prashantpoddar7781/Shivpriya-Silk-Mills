import React from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  Smartphone, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  LogOut, 
  Clock, 
  CheckCheck,
  Package,
  FileCheck
} from 'lucide-react';
import { BatchRecord } from '../types.js';

interface AdminDashboardProps {
  onOpenUpload: () => void;
  onGoToReview: () => void;
  onGoToWhatsAppImport: () => void;
  onGoToCatalogue: () => void;
  onExitAdmin: () => void;
  onTriggerLogout?: () => void;
  needsReviewCount: number;
  totalProductsCount: number;
  activeBatch?: BatchRecord;
  onBulkApprove: (batchId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenUpload,
  onGoToReview,
  onGoToWhatsAppImport,
  onGoToCatalogue,
  onExitAdmin,
  onTriggerLogout,
  needsReviewCount,
  totalProductsCount,
  activeBatch,
  onBulkApprove,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner & Exit Admin Control */}
      <div className="bg-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Admin Control Desk
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-stone-950">
                  Owner Access
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-400 mt-1">
                Upload batches, review textile stamps, and manage the live wholesale buyer catalogue.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-admin-exit"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer"
            >
              <span>Exit to Buyer View</span>
            </button>
            {onTriggerLogout && (
              <button
                id="btn-admin-logout-desk"
                onClick={onTriggerLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Snapshot Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-stone-800">
          <div className="bg-stone-850/60 rounded-xl p-3 border border-stone-800">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Live Catalogue</span>
              <Package className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">
              {totalProductsCount}
            </p>
            <span className="text-[11px] text-stone-400">Active wholesale designs</span>
          </div>

          <div className={`rounded-xl p-3 border ${
            needsReviewCount > 0 
              ? 'bg-amber-950/40 border-amber-800/60' 
              : 'bg-stone-850/60 border-stone-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-amber-300">
              <span>Needs Review</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-amber-200 mt-1">
              {needsReviewCount}
            </p>
            <span className="text-[11px] text-stone-400">
              {needsReviewCount > 0 ? 'Unclear price/code stamps' : 'All stamps verified'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-stone-850/60 rounded-xl p-3 border border-stone-800">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Latest Batch</span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-300 mt-1">
              {activeBatch ? `${activeBatch.readyCount}/${activeBatch.totalImages}` : '0/0'}
            </p>
            <span className="text-[11px] text-stone-400">
              {activeBatch ? `${activeBatch.supplierName} ready` : 'No active batch'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Action Launchers */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3 px-1">
          Admin Management Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Action 1: Upload Photos */}
          <div 
            onClick={onOpenUpload}
            className="group bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-amber-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                Upload Design Photos
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Add 1 to 50 saree or suit images directly from supplier folders or camera roll. Automatically extracts Rates and Fabrics.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700">Open Batch Upload</span>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 2: Review Items Desk */}
          <div 
            onClick={onGoToReview}
            className="group bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-amber-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform relative">
                <CheckCircle2 className="w-6 h-6" />
                {needsReviewCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-amber-500 text-stone-950 font-bold text-[10px] rounded-full">
                    {needsReviewCount}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                  Review &amp; Approvals
                </h3>
              </div>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Rapid review desk for items with missing rates, unclear handwritten stamps, or unknown fabric quality.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">
                {needsReviewCount > 0 ? `Review ${needsReviewCount} Items` : 'Review Desk'}
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 3: WhatsApp Batch Simulator */}
          <div 
            onClick={onGoToWhatsAppImport}
            className="group bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-amber-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                WhatsApp Batch Import
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Simulate how your father selects 30–50 photos inside WhatsApp and sends them straight into the catalogue.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">Open WhatsApp Importer</span>
              <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* Active Batch Summary with Bulk Action */}
      {activeBatch && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-800">
                  Active Batch: {activeBatch.supplierName}
                </span>
                <span className="text-xs text-stone-500">
                  {new Date(activeBatch.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900 mt-1">
                {activeBatch.totalImages} designs • {activeBatch.readyCount} ready for buyers
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {activeBatch.reviewCount > 0 
                  ? `${activeBatch.reviewCount} designs need price or code verification before sharing.`
                  : 'All designs in this batch have complete details and are live.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activeBatch.reviewCount > 0 && (
                <button
                  onClick={onGoToReview}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 transition cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Review {activeBatch.reviewCount} Items</span>
                </button>
              )}

              {activeBatch.readyCount > 0 && (
                <button
                  onClick={() => onBulkApprove(activeBatch.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-stone-900 hover:bg-black text-white transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Approve All Ready</span>
                </button>
              )}

              <button
                onClick={onGoToCatalogue}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-stone-600" />
                <span>View in Catalogue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct link to catalogue with edit instructions */}
      <div className="bg-stone-100/80 rounded-2xl p-4 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-stone-500 shrink-0" />
          <span>
            While in Admin Mode, product cards in the Catalogue will display an <strong>Edit</strong> button to quickly adjust wholesale rates and fabrics.
          </span>
        </div>
        <button
          onClick={onGoToCatalogue}
          className="text-amber-800 font-bold hover:underline shrink-0 cursor-pointer"
        >
          Go to Catalogue &rarr;
        </button>
      </div>

    </div>
  );
};
