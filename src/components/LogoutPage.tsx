import React from 'react';
import { 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  LogIn, 
  Layers, 
  ShieldCheck, 
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { UserSession } from '../types.js';

interface LogoutPageProps {
  lastSession: UserSession | null;
  onLoginAgain: () => void;
  onBrowseCatalogue: () => void;
}

export const LogoutPage: React.FC<LogoutPageProps> = ({
  lastSession,
  onLoginAgain,
  onBrowseCatalogue,
}) => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6">
      
      <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center">
        
        {/* Animated Check & Lock Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5 relative shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center text-xs shadow-xs">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Status Heading */}
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Logged Out Successfully
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-2">
          Your session has been terminated and privileged controls are locked.
        </p>

        {/* Last Session Information Card */}
        {lastSession && (
          <div className="my-6 p-4 rounded-xl bg-stone-50 border border-stone-200 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              {lastSession.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                  Admin Account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900">
                  <ShoppingBag className="w-3 h-3 text-emerald-700" />
                  Buyer Account
                </span>
              )}
              <span className="text-[11px] text-stone-400">
                Closed just now
              </span>
            </div>

            <p className="text-sm font-semibold text-stone-900">
              {lastSession.name}
            </p>
            {lastSession.city && (
              <p className="text-xs text-stone-500">
                {lastSession.city} {lastSession.phone ? `• +91 ${lastSession.phone}` : ''}
              </p>
            )}

            <div className="mt-2.5 pt-2 border-t border-stone-200/80 text-[11px] text-stone-500">
              {lastSession.role === 'admin' ? (
                <span>Batch upload permissions, WhatsApp import desks, and OCR edit controls are locked.</span>
              ) : (
                <span>Personalized wholesale inquiry data has been cleared from this browser session.</span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 mt-6">
          <button
            id="btn-login-again"
            onClick={onLoginAgain}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In Again</span>
          </button>

          <button
            id="btn-return-catalogue"
            onClick={onBrowseCatalogue}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-stone-600" />
            <span>Browse Catalogue as Guest</span>
          </button>
        </div>

        {/* Helpful Tip */}
        <p className="text-[11px] text-stone-400 mt-6">
          Tip: You can quickly access the Admin Login anytime by clicking the <strong>ST</strong> logo 3 times.
        </p>

      </div>

    </div>
  );
};
