import UIKit
import Social
import UniformTypeIdentifiers
import SwiftUI

/**
 * ShareViewController.swift
 * Native iOS Share Extension View Controller.
 *
 * Intercepts WhatsApp batch image sharing directly from the iOS Share Sheet:
 * WhatsApp -> Select 50 Saree/Suit photos -> Share -> Surat Textile Catalogue.
 *
 * Bypasses the Photos library entirely: images are streamed directly from
 * WhatsApp temporary attachment URLs to the background upload service.
 */
class ShareViewController: UIViewController {
    
    private var sharedImagesData: [Data] = []
    private var isProcessing = false
    
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
            showNoImagesAlert()
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
                      let compressedBase64 = self?.compressAndResize(image: validImage) else {
                    return
                }
                
                lock.lock()
                compressedPayloads.append([
                    "id": "ios_img_\(index + 1)",
                    "imageUrl": "data:image/jpeg;base64,\(compressedBase64)",
                    "category": category
                ])
                lock.unlock()
            }
        }
        
        dispatchGroup.notify(queue: .main) { [weak self] in
            guard let self = self else { return }
            
            // Send payload to Textile API via background URLSession
            TextileAPIService.shared.uploadBatch(
                supplierName: supplier,
                items: compressedPayloads
            ) { result in
                DispatchQueue.main.async {
                    switch result {
                    case .success(let batchId):
                        print("Successfully initiated batch upload: \(batchId)")
                    case .failure(let error):
                        print("Upload error: \(error.localizedDescription)")
                    }
                    // Immediately dismiss share sheet so the father can continue WhatsApp chat
                    self.completeExtension()
                }
            }
        }
    }
    
    /**
     * Downscale images to max 1200px width/height and 0.8 JPEG compression.
     * Reduces 50 WhatsApp images from ~150MB to < 18MB, saving 85% bandwidth & storage.
     */
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
              let jpegData = finalImg.jpegData(compressionQuality: 0.8) else {
            return nil
        }
        
        return jpegData.base64EncodedString()
    }
    
    private func completeExtension() {
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
    
    private func showNoImagesAlert() {
        let alert = UIAlertController(
            title: "No Images Found",
            message: "Please select images in WhatsApp before opening the Share Sheet.",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
            self?.completeExtension()
        })
        present(alert, animated: true)
    }
}
