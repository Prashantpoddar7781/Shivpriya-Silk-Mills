import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Smartphone, 
  ExternalLink 
} from 'lucide-react';

const SWIFT_FILES = [
  {
    name: 'ShareViewController.swift',
    desc: 'Extracts WhatsApp image attachments without Photos save & runs background upload',
    code: `import UIKit
import Social
import UniformTypeIdentifiers
import SwiftUI

/**
 * ShareViewController.swift
 * Native iOS Share Extension View Controller.
 * Intercepts WhatsApp multi-image sharing directly from iOS Share Sheet:
 * WhatsApp -> Select 50 Saree/Suit photos -> Share -> Surat Textile Catalogue.
 */
class ShareViewController: UIViewController {
    
    private var sharedImagesData: [Data] = []
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        extractWhatsAppBatchAttachments()
    }
    
    private func extractWhatsAppBatchAttachments() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            completeExtension()
            return
        }
        
        var imageProviders: [NSItemProvider] = []
        for item in extensionItems {
            if let attachments = item.attachments {
                for provider in attachments {
                    if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                        imageProviders.append(provider)
                    }
                }
            }
        }
        
        guard !imageProviders.isEmpty else {
            completeExtension()
            return
        }
        
        // Present SwiftUI ShareView
        let shareView = ShareView(
            totalCount: imageProviders.count,
            onUpload: { [weak self] supplierName, category in
                self?.processAndUpload(providers: imageProviders, supplier: supplierName, category: category)
            },
            onCancel: { [weak self] in
                self?.completeExtension()
            }
        )
        
        let hostingController = UIHostingController(rootView: shareView)
        addChild(hostingController)
        hostingController.view.frame = view.bounds
        hostingController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(hostingController.view)
        hostingController.didMove(toParent: self)
    }
    
    private func processAndUpload(providers: [NSItemProvider], supplier: String, category: String) {
        let dispatchGroup = DispatchGroup()
        var compressedPayloads: [[String: Any]] = []
        let lock = NSLock()
        
        for (index, provider) in providers.enumerated() {
            dispatchGroup.enter()
            provider.loadItem(forTypeIdentifier: UTType.image.identifier, options: nil) { [weak self] (item, error) in
                defer { dispatchGroup.leave() }
                
                var image: UIImage? = nil
                if let url = item as? URL, let data = try? Data(contentsOf: url) {
                    image = UIImage(data: data)
                } else if let img = item as? UIImage {
                    image = img
                } else if let data = item as? Data {
                    image = UIImage(data: data)
                }
                
                guard let validImage = image,
                      let compressedBase64 = self?.compressAndResize(image: validImage) else { return }
                
                lock.lock()
                compressedPayloads.append([
                    "id": "ios_img_\\(index + 1)",
                    "imageUrl": "data:image/jpeg;base64,\\(compressedBase64)",
                    "category": category
                ])
                lock.unlock()
            }
        }
        
        dispatchGroup.notify(queue: .main) { [weak self] in
            guard let self = self else { return }
            TextileAPIService.shared.uploadBatch(supplierName: supplier, items: compressedPayloads) { _ in
                DispatchQueue.main.async {
                    self.completeExtension()
                }
            }
        }
    }
    
    private func compressAndResize(image: UIImage, maxDimension: CGFloat = 1200) -> String? {
        var newSize = image.size
        if image.size.width > maxDimension || image.size.height > maxDimension {
            let aspect = image.size.width / image.size.height
            if aspect > 1 {
                newSize = CGSize(width: maxDimension, height: maxDimension / aspect)
            } else {
                newSize = CGSize(width: maxDimension * aspect, height: maxDimension)
            }
        }
        
        UIGraphicsBeginImageContextWithOptions(newSize, false, 1.0)
        image.draw(in: CGRect(origin: .zero, size: newSize))
        let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        guard let finalImg = resizedImage,
              let jpegData = finalImg.jpegData(compressionQuality: 0.8) else { return nil }
        return jpegData.base64EncodedString()
    }
    
    private func completeExtension() {
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}`
  },
  {
    name: 'ShareView.swift',
    desc: 'SwiftUI sheet asking for Supplier Name & 1-tap Send to Catalogue',
    code: `import SwiftUI

struct ShareView: View {
    let totalCount: Int
    let onUpload: (_ supplierName: String, _ category: String) -> Void
    let onCancel: () -> Void
    
    @State private var supplierName: String = ""
    @State private var selectedCategory: String = "Sarees"
    
    let quickSuppliers = ["Radhe Krishna Tex", "Mahalaxmi Saree", "Shree Balaji", "Om Silk"]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                HStack {
                    Image(systemName: "photo.stack.fill")
                        .foregroundColor(.orange)
                    Text("\\(totalCount) Designs Selected from WhatsApp")
                        .font(.headline)
                    Spacer()
                }
                .padding()
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Supplier Name:")
                        .font(.subheadline)
                    TextField("Enter supplier name...", text: $supplierName)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    HStack {
                        ForEach(quickSuppliers, id: \\.self) { s in
                            Button(s) { supplierName = s }
                                .font(.caption)
                                .padding(6)
                                .background(supplierName == s ? Color.orange : Color(.systemGray6))
                                .foregroundColor(supplierName == s ? .white : .primary)
                                .cornerRadius(8)
                        }
                    }
                }
                .padding()
                
                Spacer()
                
                Button(action: {
                    onUpload(supplierName.isEmpty ? "Direct Supplier" : supplierName, selectedCategory)
                }) {
                    Text("Send \\(totalCount) Items to Catalogue")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .padding()
            }
            .navigationTitle("Share to Catalogue")
            .navigationBarItems(leading: Button("Cancel") { onCancel() })
        }
    }
}`
  },
  {
    name: 'Info.plist',
    desc: 'Activation rule supporting WhatsApp batch image selections (1 to 100 images)',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDisplayName</key>
	<string>Surat Textile Catalogue</string>
	<key>NSExtension</key>
	<dict>
		<key>NSExtensionAttributes</key>
		<dict>
			<key>NSExtensionActivationRule</key>
			<string>SUBQUERY (
				extensionItems,
				$extensionItem,
				SUBQUERY (
					$extensionItem.attachments,
					$attachment,
					ANY $attachment.registeredTypeIdentifiers UTI-CONFORMS-TO "public.image"
				).@count >= 1
			).@count >= 1</string>
		</dict>
		<key>NSExtensionPointIdentifier</key>
		<string>com.apple.share-services</string>
		<key>NSExtensionPrincipalClass</key>
		<string>$(PRODUCT_MODULE_NAME).ShareViewController</string>
	</dict>
</dict>
</plist>`
  },
  {
    name: 'TextileAPIService.swift',
    desc: 'Background URLSession networking uploading batches to Surat Textile Cloud API',
    code: `import Foundation

class TextileAPIService: NSObject {
    static let shared = TextileAPIService()
    var apiBaseURL: String = "https://your-app-url.run.app/api"
    
    func uploadBatch(supplierName: String, items: [[String: Any]], completion: @escaping (Result<String, Error>) -> Void) {
        guard let url = URL(string: "\\(apiBaseURL)/batches/upload") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload: [String: Any] = [
            "supplierName": supplierName,
            "source": "ios_share_extension",
            "images": items
        ]
        
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        URLSession.shared.dataTask(with: req) { data, _, err in
            if let err = err { completion(.failure(err)); return }
            completion(.success("batch_uploaded"))
        }.resume()
    }
}`
  }
];

export const IosCodeViewer: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile = SWIFT_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-4">
      {/* Header Info Banner */}
      <div className="bg-stone-900 text-white rounded-2xl p-5 border border-stone-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Smartphone className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold">
                Native iOS Share Extension Project Code
              </h2>
            </div>
            <p className="text-xs text-stone-400">
              Ready-to-copy Swift &amp; SwiftUI files located in <code className="text-amber-300">/ios/ShareExtension/</code>.
              Add to Xcode to allow your father to share batches directly from WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied File' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>

      {/* File Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SWIFT_FILES.map((file, idx) => (
          <button
            key={file.name}
            onClick={() => setSelectedFileIndex(idx)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
              selectedFileIndex === idx
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{file.name}</span>
          </button>
        ))}
      </div>

      {/* Code Editor Container */}
      <div className="bg-stone-950 rounded-2xl overflow-hidden border border-stone-800 shadow-xl">
        <div className="px-4 py-2.5 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>{currentFile.desc}</span>
          <span className="font-mono text-stone-500">{currentFile.name}</span>
        </div>

        <pre className="p-4 text-xs font-mono text-stone-200 overflow-x-auto leading-relaxed max-h-[500px]">
          <code>{currentFile.code}</code>
        </pre>
      </div>
    </div>
  );
};
