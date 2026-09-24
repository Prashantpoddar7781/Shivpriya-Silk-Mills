import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Share2, 
  Download, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  HelpCircle,
  Apple,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface WhatsAppShareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  installPrompt: any | null;
  onTriggerInstall: () => void;
}

export const WhatsAppShareGuideModal: React.FC<WhatsAppShareGuideModalProps> = ({
  isOpen,
  onClose,
  installPrompt,
  onTriggerInstall,
}) => {
  if (!isOpen) return null;

  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'direct'>('android');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const webhookUrl = 'https://shivpriya-silk-mills-production.up.railway.app/api/batches/upload';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
                Direct WhatsApp Sharing
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500">
                Share 10 to 100+ photos without saving to Gallery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="grid grid-cols-3 p-2 bg-stone-100/70 border-b border-stone-200/80 text-xs font-semibold shrink-0 gap-1">
          <button
            onClick={() => setActivePlatform('android')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activePlatform === 'android'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Android</span>
          </button>
          <button
            onClick={() => setActivePlatform('ios')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activePlatform === 'ios'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Apple className="w-3.5 h-3.5 text-stone-800" />
            <span>iPhone (iOS)</span>
          </button>
          <button
            onClick={() => setActivePlatform('direct')}
            className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activePlatform === 'direct'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>In-App</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-stone-800 text-xs sm:text-sm">
          
          {/* ANDROID TAB */}
          {activePlatform === 'android' && (
            <div className="space-y-4">
              
              {/* WhatsApp Android Explanation Alert */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <p className="font-bold text-amber-950 text-xs sm:text-sm">
                  ⚠️ Why WhatsApp shows only &quot;Forward&quot; on Android:
                </p>
                <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed">
                  When you long-press <strong>multiple photos (2 to 50+)</strong> inside a WhatsApp chat on Android, WhatsApp deliberately disables the system Share Sheet and only shows the internal <strong>Forward (➡️)</strong> arrow. <em>(On iPhone, WhatsApp has a Share button, but Android does not).</em>
                </p>
              </div>

              {/* Solution 1: In-App 1-Tap Upload (Zero Gallery Clutter) */}
              <div className="border-2 border-emerald-500/40 bg-emerald-50/50 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Method 1: Fastest &bull; In-App Batch Select (0 Gallery Clutter)
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  You can keep photos completely out of your phone&apos;s gallery while still uploading all 50 photos directly to the catalogue:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-xs text-stone-700">
                  <li>
                    <strong>Keep Gallery 100% Clean:</strong> In WhatsApp &rarr; tap Supplier name &rarr; <strong>Media visibility</strong> &rarr; select <strong>&quot;No&quot;</strong>. (Now WhatsApp will NEVER save their photos to your phone&apos;s Gallery/Google Photos!).
                  </li>
                  <li>
                    Open our app shortcut on your phone &rarr; tap <strong>&quot;Upload Photos&quot;</strong>.
                  </li>
                  <li>
                    Tap the dropzone &rarr; tap <strong>&quot;Browse / Files&quot;</strong> &rarr; open <strong>&quot;WhatsApp Images&quot;</strong> folder.
                  </li>
                  <li>
                    Select all 50 photos at once &rarr; enter Supplier name &rarr; tap <strong>Upload</strong>!
                  </li>
                </ol>
              </div>

              {/* Solution 2: Via Phone's File Manager Share Sheet */}
              <div className="border border-stone-200 bg-stone-50 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-xs">
                    Method 2: Via Phone&apos;s &quot;Files&quot; / File Manager App
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  If you want to use the Android system Share Sheet:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-xs text-stone-700">
                  <li>
                    Open your phone&apos;s built-in <strong>Files</strong> app (Google Files, Samsung My Files, or File Manager).
                  </li>
                  <li>
                    Go to <strong>Images &rarr; WhatsApp Images</strong>.
                  </li>
                  <li>
                    Select all 50 photos &rarr; tap <strong>Share (🔗)</strong> &rarr; choose <strong>&quot;Shivpriya Silk&quot;</strong>.
                  </li>
                  <li>
                    The app opens with all 50 photos ready to upload!
                  </li>
                </ol>
              </div>

              {/* Install Button if available */}
              {installPrompt && (
                <div className="bg-stone-100 border border-stone-200 rounded-xl p-3 text-center space-y-2">
                  <p className="text-xs font-semibold text-stone-800">
                    Install App for Direct File Manager Share Target:
                  </p>
                  <button
                    onClick={onTriggerInstall}
                    className="w-full py-2 px-4 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install &quot;Shivpriya Silk&quot; PWA</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* IPHONE TAB */}
          {activePlatform === 'ios' && (
            <div className="space-y-4">
              <div className="p-3 bg-stone-900 text-white rounded-xl">
                <p className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <Apple className="w-4 h-4 text-amber-400" />
                  iPhone (iOS) Zero-Gallery Sharing
                </p>
                <p className="text-[11px] sm:text-xs text-stone-300 mt-1">
                  Apple Safari restricts browser PWAs from receiving files directly. Use the <strong>Apple iOS Shortcut</strong> or our native <strong>iOS Share Extension</strong> to share directly from WhatsApp without saving to Photos!
                </p>
              </div>

              {/* Method A: Apple Shortcut */}
              <div className="border border-stone-200 rounded-xl p-3.5 space-y-2.5 bg-stone-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-xs">
                    Option A: Apple iOS Shortcut (Instant, 0 Install)
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  Using your iPhone&apos;s built-in <strong>Shortcuts</strong> app, you can create a 1-tap share action in 1 minute:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-xs text-stone-600">
                  <li>Open <strong>Shortcuts</strong> app on iPhone &rarr; tap <strong>+ (New Shortcut)</strong>.</li>
                  <li>Tap <strong>&quot;Receive Any on screen&quot;</strong> &rarr; enable <strong>&quot;Show in Share Sheet&quot;</strong> and select <strong>Images</strong>.</li>
                  <li>Add action: <strong>&quot;Get Contents of URL&quot;</strong> &rarr; Method: <strong>POST</strong> &rarr; paste backend URL.</li>
                </ol>

                <div className="pt-1">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                    Your Railway Backend URL:
                  </p>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 px-2.5 py-1.5 text-[11px] font-mono bg-white border border-stone-200 rounded-lg text-stone-700 select-all"
                    />
                    <button
                      onClick={handleCopyWebhook}
                      className="px-2.5 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Method B: Native iOS Share Extension */}
              <div className="border border-stone-200 rounded-xl p-3.5 space-y-1.5">
                <span className="font-bold text-stone-900 text-xs">
                  Option B: Native iOS App (Xcode / TestFlight)
                </span>
                <p className="text-xs text-stone-500">
                  We have included the complete native Swift Share Extension in the <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px]">ios/ShareExtension</code> directory. It can be built via Xcode for your father&apos;s iPhone.
                </p>
              </div>
            </div>
          )}

          {/* DIRECT IN-APP TAB */}
          {activePlatform === 'direct' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="font-bold text-amber-900 text-xs sm:text-sm">
                  📂 Direct In-App Batch Select (Any Phone)
                </p>
                <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5">
                  You can also upload unlimited designs directly from inside the app:
                </p>
              </div>

              <div className="space-y-2 text-xs text-stone-600">
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="font-bold text-stone-900 mb-0.5">1. Tap &quot;Upload Photos&quot; Button</p>
                  <p className="text-stone-500">
                    Located in the header or in the catalogue banner.
                  </p>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="font-bold text-stone-900 mb-0.5">2. Tap the Photo Dropzone &rarr; Select Files</p>
                  <p className="text-stone-500">
                    On your phone, tap &quot;Browse&quot; &rarr; select the <strong>WhatsApp Images</strong> folder.
                  </p>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="font-bold text-stone-900 mb-0.5">3. Select 10, 50, or 200+ Photos at Once</p>
                  <p className="text-stone-500">
                    There is <strong>no limit on photo count</strong>. The app auto-compresses them on your device before streaming to the server.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-stone-100 bg-stone-50/80 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-stone-500">
            Shivpriya Silk Mills • Surat Wholesale System
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
