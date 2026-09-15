import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Check, 
  Zap, 
  Store, 
  Tag 
} from 'lucide-react';
import { apiUrl } from '../services/api.js';

interface WebUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (batchId: string) => void;
}

export const WebUploadModal: React.FC<WebUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  if (!isOpen) return null;

  const [supplierName, setSupplierName] = useState<string>('');
  const [category, setCategory] = useState<'Sarees' | 'Suits' | 'Dress Material' | 'Kurtis'>('Sarees');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setSelectedFiles(fileList);

    // Generate previews
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
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);
    setUploadProgress(10);

    try {
      const compressedItems = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const base64 = await compressImage(selectedFiles[i]);
        compressedItems.push({
          id: `web_img_${i + 1}`,
          imageUrl: base64,
          category,
          textHint: selectedFiles[i].name, // filename often contains code or rate hint
        });
        setUploadProgress(10 + Math.round(((i + 1) / selectedFiles.length) * 50));
      }

      setUploadProgress(70);

      const res = await fetch(apiUrl('/api/batches/upload'), {
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

      setUploadProgress(100);
      const batch = await res.json();
      setIsProcessing(false);
      onUploadSuccess(batch.id);
      onClose();
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 p-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-lg font-bold text-stone-900">
              Upload Wholesale Batch
            </h3>
            <p className="text-xs text-stone-500">
              Select multiple saree/suit images (up to 50 designs)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-3.5">
          
          {/* Supplier Name Input (Required requirement from prompt) */}
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
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-6 text-center cursor-pointer bg-stone-50/50 hover:bg-amber-50/30 transition group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            <UploadCloud className="w-8 h-8 text-stone-400 group-hover:text-amber-600 mx-auto mb-2 transition" />
            <p className="text-xs font-semibold text-stone-700">
              Click or drag &amp; drop batch of saree/suit images
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              Select 10 to 50 photos at once. Auto-resized to 1200px.
            </p>
          </div>

          {/* Previews */}
          {selectedFiles.length > 0 && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
                <span>{selectedFiles.length} Images Selected</span>
                <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                  <Zap className="w-3 h-3" /> Client-side compressed (WebP/JPEG)
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
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-600 font-medium">
                <span>Compressing &amp; uploading batch...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-stone-100">
          <button
            id="btn-confirm-upload"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isProcessing}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Processing Batch...'
                : `Upload ${selectedFiles.length || ''} Images to Catalogue`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
