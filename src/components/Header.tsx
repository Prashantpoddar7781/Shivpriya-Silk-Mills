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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand & Market Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div 
              id="st-brand-logo"
              onClick={handleLogoClick}
              title="Shivpriya Silk Mills (Tap 3 times for Admin)"
              className={`relative select-none w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 flex items-center justify-center text-white shadow-xs font-black text-base sm:text-lg tracking-tight cursor-pointer transition-all duration-150 shrink-0 ${
                clickAnim ? 'scale-90 brightness-90' : 'hover:scale-105 active:scale-95'
              } ${isAdmin ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}
            >
              <span>ST</span>

              {/* Indicator when tapped */}
              {!isAdmin && clickCountDisplay > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-900 text-amber-100 rounded-full text-[10px] flex items-center justify-center font-mono animate-ping">
                  {clickCountDisplay}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-stone-900 tracking-tight text-sm sm:text-base truncate">
                  Shivpriya Silk Mills
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-stone-950 shadow-2xs shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-stone-500 truncate hidden xs:block">
                Surat B2B Wholesale Catalogue • Ring Road
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on mobile, mobile uses bottom bar) */}
          <div className="hidden md:flex items-center gap-2">
            {isAdmin ? (
              <nav className="flex items-center gap-1">
                <button
                  id="nav-catalogue"
                  onClick={() => setActiveTab('catalogue')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'review'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Review</span>
                  {needsReviewCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-stone-950 text-[10px] font-black rounded-full">
                      {needsReviewCount}
                    </span>
                  )}
                </button>

                <button
                  id="nav-admin-desk"
                  onClick={() => setActiveTab('admin_dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'admin_dashboard'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Admin Desk</span>
                </button>

                <button
                  id="btn-open-upload"
                  onClick={onOpenUpload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs cursor-pointer ml-2"
                >
                  <UploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Upload Photos</span>
                </button>

                <button
                  onClick={onTriggerLogout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </nav>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('catalogue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'catalogue' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  Catalogue
                </button>

                {onOpenShareGuide && (
                  <button
                    onClick={onOpenShareGuide}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Share</span>
                  </button>
                )}

                <button
                  onClick={onNavigateLogin}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Clean & Uncrowded */}
          <div className="flex md:hidden items-center gap-1.5">
            {isAdmin && (
              <button
                onClick={onOpenUpload}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95"
              >
                <UploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Upload</span>
              </button>
            )}

            {!isAdmin && (
              <button
                onClick={onNavigateLogin}
                className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95"
              >
                Login
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
