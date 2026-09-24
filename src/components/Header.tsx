import React, { useRef, useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Smartphone,
  UploadCloud,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  LogIn,
  ShoppingBag,
  Sparkles,
  Share2
} from 'lucide-react';
import { BatchRecord, UserSession } from '../types.js';

interface HeaderProps {
  isAdmin: boolean;
  userSession: UserSession | null;
  activeTab: 'catalogue' | 'review' | 'ios_sim' | 'admin_dashboard' | 'login' | 'logout';
  setActiveTab: (tab: 'catalogue' | 'review' | 'ios_sim' | 'admin_dashboard' | 'login' | 'logout') => void;
  batches: BatchRecord[];
  onOpenUpload: () => void;
  onOpenShareGuide?: () => void;
  needsReviewCount: number;
  onTripleClickLogo: () => void;
  onExitAdmin: () => void;
  onNavigateLogin: () => void;
  onTriggerLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  userSession,
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenShareGuide,
  needsReviewCount,
  onTripleClickLogo,
  onExitAdmin,
  onNavigateLogin,
  onTriggerLogout,
}) => {
  const clickCountRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [clickAnim, setClickAnim] = useState<boolean>(false);
  const [clickCountDisplay, setClickCountDisplay] = useState<number>(0);

  const handleLogoClick = () => {
    clickCountRef.current += 1;
    setClickCountDisplay(clickCountRef.current);
    setClickAnim(true);
    setTimeout(() => setClickAnim(false), 200);

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      setClickCountDisplay(0);
      onTripleClickLogo();
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickCountRef.current = 0;
        setClickCountDisplay(0);
      }, 1500);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Market Identity (Click ST logo 3 times for Admin) */}
          <div className="flex items-center gap-3">
            <div 
              id="st-brand-logo"
              onClick={handleLogoClick}
              title="ST Surat Textile (Admin: Click 3 times)"
              className={`relative select-none w-10 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 flex items-center justify-center text-white shadow-xs font-bold text-lg tracking-tight cursor-pointer transition-all duration-150 ${
                clickAnim ? 'scale-90 bg-amber-800' : 'hover:scale-105'
              } ${isAdmin ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}
            >
              <span>ST</span>

              {/* Subtle visual indicator when clicked 1 or 2 times */}
              {!isAdmin && clickCountDisplay > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-900 text-amber-100 rounded-full text-[10px] flex items-center justify-center font-mono animate-ping">
                  {clickCountDisplay}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900 tracking-tight text-base">
                  Surat Textile B2B
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  Surat Wholesale
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-stone-950 shadow-xs">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                Direct Saree &amp; Suit Catalogue • Ring Road &amp; Millennium Market
              </p>
            </div>
          </div>

          {/* NAVIGATION AND AUTH CONTROLS */}
          {isAdmin ? (
            /* ADMIN ONLY NAVIGATION: Only visible when Admin is active */
            <div className="flex items-center gap-2 sm:gap-3">
              <nav className="flex items-center gap-1 sm:gap-1.5">
                <button
                  id="nav-admin-desk"
                  onClick={() => setActiveTab('admin_dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === 'admin_dashboard'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin Desk</span>
                </button>

                <button
                  id="nav-catalogue"
                  onClick={() => setActiveTab('catalogue')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'catalogue'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Catalogue</span>
                </button>

                <button
                  id="nav-review"
                  onClick={() => setActiveTab('review')}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'review'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Review</span>
                  {needsReviewCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-stone-950 text-[11px] font-bold rounded-full">
                      {needsReviewCount}
                    </span>
                  )}
                </button>

                <button
                  id="nav-ios-sim"
                  onClick={() => setActiveTab('ios_sim')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'ios_sim'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">WhatsApp Import</span>
                </button>
              </nav>

              {/* WhatsApp Direct Share Guide */}
              {onOpenShareGuide && (
                <button
                  id="btn-open-share-guide-admin"
                  onClick={onOpenShareGuide}
                  title="Direct WhatsApp Share (No Gallery Save)"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition shadow-2xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">WhatsApp Share</span>
                </button>
              )}

              {/* Admin Quick Action: New Batch Upload */}
              <button
                id="btn-open-upload"
                onClick={onOpenUpload}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span className="hidden sm:inline">Upload Photos</span>
              </button>

              {/* Log Out Admin button */}
              <button
                id="btn-logout-admin-header"
                onClick={onTriggerLogout}
                title="Log Out of Admin Session"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : userSession?.role === 'buyer' ? (
            /* LOGGED IN WHOLESALE BUYER VIEW */
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                id="nav-buyer-catalogue"
                onClick={() => setActiveTab('catalogue')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'catalogue'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Catalogue</span>
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                <span className="max-w-[120px] sm:max-w-[180px] truncate">{userSession.name}</span>
              </div>

              <button
                id="btn-logout-buyer-header"
                onClick={onTriggerLogout}
                title="Log out from wholesale account"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            /* PUBLIC / GUEST VIEW */
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                id="nav-guest-catalogue"
                onClick={() => setActiveTab('catalogue')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'catalogue'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Catalogue</span>
              </button>

              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium border border-stone-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Wholesale Live</span>
              </div>

              {onOpenShareGuide && (
                <button
                  id="btn-open-share-guide-guest"
                  onClick={onOpenShareGuide}
                  title="WhatsApp Direct Sharing Guide"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition shadow-2xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">WhatsApp Share</span>
                </button>
              )}

              {/* Login / Sign In Button */}
              <button
                id="btn-nav-login"
                onClick={onNavigateLogin}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login / Sign In</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

