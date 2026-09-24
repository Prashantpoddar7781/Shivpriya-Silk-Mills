import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Check, 
  Zap, 
  Store, 
  Tag,
  AlertCircle
} from 'lucide-react';
import { apiUrl } from '../services/api.js';

interface WebUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (batchId: string) => void;
  initialFiles?: File[];
  onOpenGuide?: () => void;
}

export const WebUploadModal: React.FC<WebUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  initialFiles,
  onOpenGuide,
}) => {
  if (!isOpen) return null;

  const [supplierName, setSupplierName] = useState<string>('');
  const [category, setCategory] = useState<'Sarees' | 'Suits' | 'Dress Material' | 'Kurtis'>('Sarees');
  const [rateOverride, setRateOverride] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processingStatusText, setProcessingStatusText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
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

  React.useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setSelectedFiles(initialFiles);
      setUploadError(null);
      const newPreviews: string[] = [];
      initialFiles.slice(0, 9).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPreviews.push(e.target.result as string);
            if (newPreviews.length === Math.min(initialFiles.length, 9)) {
              setPreviews([...newPreviews]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }, [initialFiles]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setSelectedFiles(fileList);
    setUploadError(null);

    // Generate previews (first 9 for fast mobile preview)
    const newPreviews: string[] = [];
    fileList.slice(0, 9).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === Math.min(fileList.length, 9)) {
            setPreviews([...newPreviews]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  /**
   * Downscale images client-side to max 1200px and compress to JPEG 0.8
   * Matches the exact iOS Share Extension compression logic!
   */
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressed);
        };
        img.onerror = () => {
          resolve((e.target?.result as string) || '');
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    if (!supplierName.trim()) {
      setUploadError('Supplier / Mill Name is compulsory. Please enter or select a supplier.');
      return;
    }
    setIsProcessing(true);
    setUploadError(null);
    setUploadProgress(5);
    setProcessingStatusText(`Preparing ${selectedFiles.length} photos...`);

    try {
      const compressedItems = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        setProcessingStatusText(`Compressing photo ${i + 1} of ${selectedFiles.length}...`);
        const base64 = await compressImage(selectedFiles[i]);
        if (!base64) {
          throw new Error(`Failed to read file: ${selectedFiles[i].name || 'unknown image'}`);
        }
        const parsedRate = rateOverride.trim() ? parseInt(rateOverride.trim(), 10) : undefined;
        const hints = [selectedFiles[i].name, supplierName, parsedRate ? `Rate: ₹${parsedRate}` : ''].filter(Boolean).join(' ');

        compressedItems.push({
          id: `web_img_${Date.now()}_${i + 1}`,
          imageUrl: base64,
          category,
          price: parsedRate && !isNaN(parsedRate) ? parsedRate : undefined,
          textHint: hints,
        });
        setUploadProgress(5 + Math.round(((i + 1) / selectedFiles.length) * 60));
      }

      setUploadProgress(70);
      setProcessingStatusText(`Uploading ${compressedItems.length} photos to catalogue...`);

      const targetUrl = apiUrl('/api/batches/upload');
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierName: supplierName.trim() || 'Surat Supplier',
          source: 'web_upload',
          images: compressedItems,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMsg = `Server returned status ${res.status}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error) errorMsg = parsed.error;
        } catch {}
        throw new Error(errorMsg);
      }

      setUploadProgress(100);
      setProcessingStatusText('Batch uploaded successfully!');
      const batch = await res.json();
      setIsProcessing(false);
      onUploadSuccess(batch.id);
      onClose();
    } catch (err: any) {
      console.error('[Batch Upload Error]', err);
      setUploadError(err.message || 'Failed to upload batch to server');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200">
        
        {/* Header (Sticky) */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/80">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
              Upload Wholesale Batch
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500">
              Unlimited batch size &bull; 50, 100, 200+ designs at once
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5">

          {/* WhatsApp Direct Tip */}
          {onOpenGuide && (
            <div 
              onClick={onOpenGuide}
              className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900 cursor-pointer hover:bg-emerald-100/70 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">📲</span>
                <div>
                  <span className="font-bold">Direct WhatsApp Share:</span>
                  <span className="text-emerald-800 ml-1">Send batch without saving to Gallery</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 shrink-0 hover:underline">
                View Guide &rarr;
              </span>
            </div>
          )}

          {/* Error Notice */}
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Upload Error</p>
                <p className="text-[11px] text-rose-700">{uploadError}</p>
              </div>
            </div>
          )}
          
          {/* Supplier Name Input (Compulsory) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              Supplier / Mill Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-web-supplier"
              type="text"
              placeholder="e.g. Radhe Krishna Tex, Mahalaxmi Saree Kendra"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {availableSuppliers.slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSupplierName(s)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                    supplierName === s
                      ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                      : 'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              Product Category
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Sarees', 'Suits', 'Dress Material', 'Kurtis'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 text-xs font-medium rounded-lg border text-center transition cursor-pointer ${
                    category === cat
                      ? 'bg-amber-600 text-white border-amber-600 font-bold'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Wholesale Rate (₹) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="font-bold text-amber-600">₹</span>
                Wholesale Rate / Price (Optional)
              </span>
              <span className="text-[10px] text-stone-400 font-normal">Auto-detected by OCR if blank</span>
            </label>
            <input
              id="input-web-rate"
              type="number"
              placeholder="e.g. 375, 450, 620"
              value={rateOverride}
              onChange={(e) => setRateOverride(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-5 sm:p-6 text-center cursor-pointer bg-stone-50/50 hover:bg-amber-50/30 transition group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,*/*"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            <UploadCloud className="w-8 h-8 text-stone-400 group-hover:text-amber-600 mx-auto mb-2 transition" />
            <p className="text-xs sm:text-sm font-semibold text-stone-800">
              Click or drag &amp; drop wholesale batch photos
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              Select 10, 50, 100, or 200+ photos. No batch limit.
            </p>
          </div>

          {/* Visibility Tip for Android */}
          <p className="text-[10px] text-stone-400 px-1 text-center">
            💡 <em>Photos not showing in picker?</em> If WhatsApp Media Visibility is OFF, turn it back ON in WhatsApp (Chat &rarr; Media visibility &rarr; Yes) to make them selectable.
          </p>

          {/* Previews */}
          {selectedFiles.length > 0 && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
                <span>{selectedFiles.length} Photos Selected</span>
                <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                  <Zap className="w-3 h-3" /> Auto-compressed to 1200px
                </span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {previews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Preview ${i}`}
                    className="w-12 h-12 rounded object-cover border border-stone-200 shrink-0"
                  />
                ))}
                {selectedFiles.length > 9 && (
                  <div className="w-12 h-12 rounded bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold shrink-0">
                    +{selectedFiles.length - 9}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {isProcessing && (
            <div className="space-y-1.5 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
              <div className="flex justify-between text-xs text-amber-950 font-medium">
                <span>{processingStatusText || 'Compressing & uploading batch...'}</span>
                <span className="font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-amber-200/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer (Sticky) */}
        <div className="p-3 sm:p-4 border-t border-stone-100 bg-stone-50/80 shrink-0 space-y-1.5">
          <button
            id="btn-confirm-upload"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isProcessing || !supplierName.trim()}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
          >
            <UploadCloud className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Processing Batch...'
                : !supplierName.trim()
                ? 'Enter Supplier Name to Upload'
                : `Upload ${selectedFiles.length} Photos to Catalogue`}
            </span>
          </button>
          {!supplierName.trim() && (
            <p className="text-[11px] text-amber-700 font-medium text-center">
              * Supplier / Mill Name is mandatory for B2B cataloguing
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
