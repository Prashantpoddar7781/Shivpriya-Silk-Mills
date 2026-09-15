import React, { useState } from 'react';
import { 
  Share2, 
  Check, 
  Smartphone, 
  UploadCloud, 
  ArrowRight, 
  CheckCircle2, 
  Info 
} from 'lucide-react';
import { SAMPLE_TEXTILE_ITEMS } from '../services/store.js';
import { apiUrl } from '../services/api.js';

interface WhatsAppShareSimulatorProps {
  onBatchCreated: (batchId: string) => void;
}

// Simulated WhatsApp photos received in Surat textile agent chat
const WHATSAPP_CHAT_PHOTOS = [
  { id: 'wa_1', text: '₹450 | Rayon | R182', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80', code: 'R182' },
  { id: 'wa_2', text: 'D-998 Price: 620 Quality: Georgette', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80', code: 'D-998' },
  { id: 'wa_3', text: '₹380 | Dola Silk | DS-77', url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80', code: 'DS-77' },
  { id: 'wa_4', text: 'Rate 420 | Chanderi Cotton | CH-990', url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80', code: 'CH-990' },
  { id: 'wa_5', text: '₹490 | Organza Silk | ORG-105', url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80', code: 'ORG-105' },
  { id: 'wa_6', text: '350/- Bandhani Silk BS-220', url: 'https://images.unsplash.com/photo-1610030469668-932d43fa58a7?w=600&auto=format&fit=crop&q=80', code: 'BS-220' },
  { id: 'wa_7', text: 'Price 520 Crepe Digital Print CR-512', url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80', code: 'CR-512' },
  { id: 'wa_8', text: 'Rate 320/- D.No. 1024 Pure Cotton', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80', code: 'D-1024' },
  { id: 'wa_9', text: 'Heavy Rayon 14KG Rate: 460/- RY-310', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80', code: 'RY-310' },
  { id: 'wa_10', text: 'Rayon Foil Print Design SK-401 (Rate torn)', url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80', code: 'SK-401' },
  { id: 'wa_11', text: '₹480/- Dola Silk Floral (Design blurred)', url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80', code: 'DS-90' },
  { id: 'wa_12', text: '₹540 JAC-88 Fancy Mill Jacquard Special', url: 'https://images.unsplash.com/photo-1610030469668-932d43fa58a7?w=600&auto=format&fit=crop&q=80', code: 'JAC-88' },
];

export const WhatsAppShareSimulator: React.FC<WhatsAppShareSimulatorProps> = ({
  onBatchCreated,
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>(
    WHATSAPP_CHAT_PHOTOS.map((p) => p.id) // Default all 12 selected
  );
  const [batchMultiplier50, setBatchMultiplier50] = useState<boolean>(true); // Simulate full 50 batch
  const [showShareSheet, setShowShareSheet] = useState<boolean>(false);
  const [supplierName, setSupplierName] = useState<string>('Radhe Krishna Tex (Millennium Market)');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [availableSuppliers, setAvailableSuppliers] = useState<string[]>([
    'Radhe Krishna Tex',
    'Mahalaxmi Saree Kendra',
    'Shree Balaji Creation',
    'Om Silk Mills',
    'Kavita Fashion',
  ]);

  React.useEffect(() => {
    fetch(apiUrl('/api/suppliers'))
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Array<{ name: string; count: number }>) => {
        if (data && data.length > 0) {
          setAvailableSuppliers(data.map((d) => d.name));
        }
      })
      .catch(() => {});
  }, []);

  const effectiveCount = batchMultiplier50 ? 50 : selectedPhotos.length;

  const togglePhoto = (id: string) => {
    if (selectedPhotos.includes(id)) {
      setSelectedPhotos(selectedPhotos.filter((p) => p !== id));
    } else {
      setSelectedPhotos([...selectedPhotos, id]);
    }
  };

  const selectAll = () => {
    setSelectedPhotos(WHATSAPP_CHAT_PHOTOS.map((p) => p.id));
  };

  const handleShareClick = () => {
    if (selectedPhotos.length === 0 && !batchMultiplier50) return;
    setShowShareSheet(true);
  };

  const handleExecuteUpload = async () => {
    setIsUploading(true);

    // Build the 50 items payload
    let itemsToUpload = [];
    const baseItems = WHATSAPP_CHAT_PHOTOS.map((p) => ({
      id: p.id,
      imageUrl: p.url,
      textHint: p.text,
      category: 'Sarees' as const,
    }));

    if (batchMultiplier50) {
      // Repeat/expand to exactly 50 realistic Surat designs
      for (let i = 0; i < 50; i++) {
        const template = baseItems[i % baseItems.length];
        const num = 100 + i;
        itemsToUpload.push({
          id: `sim_img_${i + 1}`,
          imageUrl: template.imageUrl,
          textHint: template.textHint.replace(/R182|D-998|DS-77|CH-990|ORG-105|BS-220|CR-512|D-1024|RY-310|SK-401|JAC-88/g, `DES-${num}`),
          category: 'Sarees' as const,
          hash: `hash_${i % 12}`,
        });
      }
    } else {
      itemsToUpload = baseItems.filter((p) => selectedPhotos.includes(p.id));
    }

    try {
      const res = await fetch(apiUrl('/api/batches/upload'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierName: supplierName.trim() || 'Radhe Krishna Tex',
          source: 'ios_share_extension',
          images: itemsToUpload,
        }),
      });

      const batch = await res.json();
      setIsUploading(false);
      setUploadSuccess(true);
      setShowShareSheet(false);

      setTimeout(() => {
        onBatchCreated(batch.id);
      }, 800);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Introduction Card */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 mb-6 text-stone-900 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-600 text-white rounded-xl shadow-xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              Instant WhatsApp Batch Import
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Select an entire batch of design photos in WhatsApp and share straight into the catalogue.
              Images are automatically organized with Rate, Fabric, and Design Code without taking up iPhone storage.
            </p>
          </div>
        </div>
      </div>

      {/* iPhone Mockup Frame */}
      <div className="relative mx-auto max-w-sm sm:max-w-md bg-stone-900 rounded-[44px] p-3 sm:p-4 shadow-2xl border-4 border-stone-800">
        
        {/* Notch / Dynamic Island */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30" />

        {/* Screen Container */}
        <div className="relative bg-[#efeae2] rounded-[34px] overflow-hidden min-h-[580px] flex flex-col justify-between border border-stone-300">
          
          {/* WhatsApp Chat Header */}
          <div className="bg-[#075e54] text-white pt-9 pb-3 px-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs border border-white/20">
                RK
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Radhe Krishna Tex (Surat)</p>
                <p className="text-[11px] text-emerald-200">Online • Millennium Market G-104</p>
              </div>
            </div>

            {/* Batch mode selector */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setBatchMultiplier50(!batchMultiplier50)}
                className={`text-[11px] px-2 py-1 rounded-full font-bold transition cursor-pointer ${
                  batchMultiplier50 ? 'bg-amber-400 text-stone-900' : 'bg-emerald-800 text-white'
                }`}
              >
                {batchMultiplier50 ? '50 Batch' : 'Single Grid'}
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            
            {/* Supplier message balloon */}
            <div className="bg-white rounded-xl p-2.5 max-w-[85%] text-xs shadow-xs space-y-1">
              <p className="font-semibold text-emerald-800 text-[11px]">Radhe Krishna Tex</p>
              <p className="text-stone-800">
                Prashant ji, please check today's new Dola Silk &amp; Rayon catalogue batch ({effectiveCount} designs). Rates and quality stamped on each photo.
              </p>
              <span className="text-[10px] text-stone-400 block text-right">10:42 AM</span>
            </div>

            {/* Batch Photos Grid */}
            <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-bold text-stone-700">
                  {batchMultiplier50 ? 'Batch of 50 Saree Photos' : `${selectedPhotos.length} Photos Selected`}
                </span>
                <span className="text-[11px] text-amber-700 font-semibold">
                  Tap to multi-select
                </span>
              </div>

              {/* Grid of sample WhatsApp images */}
              <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto p-0.5">
                {WHATSAPP_CHAT_PHOTOS.map((photo) => {
                  const isSelected = batchMultiplier50 || selectedPhotos.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => !batchMultiplier50 && togglePhoto(photo.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        isSelected
                          ? 'border-amber-500 scale-98 shadow-xs'
                          : 'border-transparent opacity-60'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.code}
                        className="w-full h-full object-cover"
                      />
                      {/* Checkmark overlay */}
                      <div className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        isSelected ? 'bg-amber-500 text-white font-bold' : 'bg-black/40 text-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>

                      {/* Text stamp hint */}
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs px-1 py-0.5 text-[9px] text-white truncate font-mono">
                        {photo.code}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* WhatsApp Bottom Bar with Native Share Action */}
          <div className="bg-white/95 border-t border-stone-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                {effectiveCount}
              </span>
              <span className="text-xs text-stone-600 font-medium">
                {effectiveCount} designs selected
              </span>
            </div>

            {/* The Critical iOS Share Button */}
            <button
              id="btn-whatsapp-share-sheet"
              onClick={handleShareClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#128c7e] hover:bg-[#075e54] text-white transition shadow-sm cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share ({effectiveCount})</span>
            </button>
          </div>

          {/* --- Native iOS Share Sheet Overlay --- */}
          {showShareSheet && (
            <div className="absolute inset-0 z-40 bg-black/50 flex flex-col justify-end backdrop-blur-xs transition-all">
              
              <div className="bg-stone-50 rounded-t-[28px] p-4 shadow-2xl border-t border-stone-300 space-y-4 max-h-[85%] overflow-y-auto">
                
                {/* Pull down handle */}
                <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto" />

                {/* Native Share Sheet Apps Header */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold text-xs">
                      ST
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">
                        Surat Textile Catalogue
                      </p>
                      <p className="text-[11px] text-stone-500">
                        iOS Share Extension Active
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowShareSheet(false)}
                    className="text-xs text-stone-500 hover:text-stone-800 font-medium"
                  >
                    Cancel
                  </button>
                </div>

                {/* SwiftUI ShareView Content */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">
                      Batch Summary:
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                      {effectiveCount} Photos Selected
                    </span>
                  </div>

                  {/* Supplier Input Prompt */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Supplier / Mill Name:
                    </label>
                    <input
                      id="sim-input-supplier"
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="e.g. Radhe Krishna Tex"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />

                    {/* Quick Pick Pills */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {availableSuppliers.slice(0, 6).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSupplierName(s)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                            supplierName === s
                              ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                              : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fast Processing Notice */}
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Direct upload — all {effectiveCount} designs will be added to your catalogue with Rate, Fabric &amp; Design Code ready for buyers.
                    </span>
                  </div>

                  {/* Submit Action Button */}
                  <button
                    id="btn-sim-send-catalogue"
                    onClick={handleExecuteUpload}
                    disabled={isUploading}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <UploadCloud className="w-4 h-4 animate-bounce" />
                        <span>Adding Designs to Catalogue...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Import {effectiveCount} Designs to Catalogue</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
