import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  CheckCircle2, 
  RefreshCw, 
  LogOut, 
  QrCode, 
  MessageSquare, 
  Sparkles, 
  Store,
  Check
} from 'lucide-react';
import { apiUrl } from '../services/api.js';

interface WhatsAppBotConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppBotConnectModal: React.FC<WhatsAppBotConnectModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [supplierInput, setSupplierInput] = useState<string>('');
  const [supplierSaved, setSupplierSaved] = useState<boolean>(false);
  const [pollInterval, setPollInterval] = useState<number>(3000);

  const fetchStatus = async () => {
    try {
      const res = await fetch(apiUrl('/api/whatsapp/status'));
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.activeSupplier && !supplierInput) {
          setSupplierInput(data.activeSupplier);
        }
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp bot status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/whatsapp/start'), { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to disconnect this WhatsApp device?')) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/whatsapp/logout'), { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierInput.trim()) return;
    try {
      const res = await fetch(apiUrl('/api/whatsapp/set-supplier'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier: supplierInput.trim() }),
      });
      if (res.ok) {
        setSupplierSaved(true);
        setTimeout(() => setSupplierSaved(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isConnected = status?.isConnected;
  const qrCode = status?.qrCodeDataUrl;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
                WhatsApp Forwarding Bot
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500">
                Direct Android forwarding for 40–50 photos at once
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

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            isConnected 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shrink-0 ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <div>
                <p className="font-bold">
                  {isConnected 
                    ? `Connected: +${status?.connectedUser || 'Active'}`
                    : 'WhatsApp Bot Disconnected'}
                </p>
                <p className="text-[11px] opacity-80">
                  {isConnected 
                    ? 'Ready to receive forwarded photos from Android'
                    : 'Scan the QR code below to connect your Android phone'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={fetchStatus}
                title="Refresh Status"
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-black/5 transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {isConnected && (
                <button
                  onClick={handleLogout}
                  title="Disconnect Device"
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* If Connected: Show instructions & supplier selector */}
          {isConnected ? (
            <div className="space-y-4">
              {/* Active Supplier Settings */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>Current Supplier for Incoming Photos</span>
                </label>
                <form onSubmit={handleSaveSupplier} className="flex gap-2">
                  <input
                    type="text"
                    value={supplierInput}
                    onChange={(e) => setSupplierInput(e.target.value)}
                    placeholder="e.g. Radhe Krishna Tex"
                    className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                  >
                    {supplierSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                    <span>{supplierSaved ? 'Saved' : 'Set'}</span>
                  </button>
                </form>
                <p className="text-[11px] text-stone-400">
                  Tip: You can also text <strong>Supplier: Mill Name</strong> directly in WhatsApp at any time!
                </p>
              </div>

              {/* How to Forward Photos Guide */}
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 space-y-2.5">
                <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>How to forward 40–50 photos on Android:</span>
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs text-stone-700">
                  <li>
                    Open WhatsApp on your Android phone and go to your supplier&apos;s chat.
                  </li>
                  <li>
                    Long-press the first saree photo, then tap all 40–50 photos received today.
                  </li>
                  <li>
                    Tap the regular WhatsApp <strong>Forward arrow (➡️)</strong>.
                  </li>
                  <li>
                    Select this bot chat (or forward to your own number / group).
                  </li>
                  <li>
                    Tap <strong>Send</strong>! The bot will automatically buffer all 50 photos, run Gemini AI OCR, and upload them to the catalogue!
                  </li>
                </ol>
              </div>
            </div>
          ) : (
            /* If Not Connected: Show QR Code to Link Device */
            <div className="space-y-4 text-center">
              {qrCode ? (
                <div className="space-y-3">
                  <div className="p-3 bg-white border-2 border-stone-200 rounded-2xl inline-block shadow-sm">
                    <img 
                      src={qrCode} 
                      alt="WhatsApp Web QR Code" 
                      className="w-56 h-56 sm:w-64 sm:h-64 mx-auto rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-stone-500 font-medium animate-pulse">
                    Scan with WhatsApp on Android to connect
                  </p>
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-stone-500 font-medium">
                    Initializing WhatsApp session &amp; generating QR code...
                  </p>
                  <button
                    onClick={handleStart}
                    className="mt-2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold"
                  >
                    Click to Reconnect
                  </button>
                </div>
              )}

              {/* Android Connection Steps */}
              <div className="text-left bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                <p className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>How to scan on Android (3 steps):</span>
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-xs text-stone-600">
                  <li>Open <strong>WhatsApp</strong> on your Android phone.</li>
                  <li>Tap the <strong>3 vertical dots (⋮)</strong> in the top-right corner.</li>
                  <li>Tap <strong>Linked devices</strong> &rarr; tap <strong>Link a device</strong> &rarr; point camera at the QR code above!</li>
                </ol>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
