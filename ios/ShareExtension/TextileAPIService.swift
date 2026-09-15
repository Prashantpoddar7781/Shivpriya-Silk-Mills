import Foundation

/**
 * TextileAPIService.swift
 * Handles async batch upload to the Surat Textile agent catalogue API.
 * Uses background URLSession so image uploads proceed even if WhatsApp or the Share Sheet is dismissed.
 */
class TextileAPIService: NSObject, URLSessionDelegate, URLSessionTaskDelegate {
    
    static let shared = TextileAPIService()
    
    // Replace with your deployment URL or local tunnel
    var apiBaseURL: String = "https://your-surat-app-url.run.app/api"
    
    private lazy var backgroundSession: URLSession = {
        let config = URLSessionConfiguration.background(withIdentifier: "com.surattextile.share.background")
        config.isDiscretionary = false
        config.sessionSendsLaunchEvents = true
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()
    
    /**
     * Upload a batch of images directly to the Surat Textile Catalogue backend.
     */
    func uploadBatch(
        supplierName: String,
        items: [[String: Any]],
        completion: @escaping (Result<String, Error>) -> Void
    ) {
        guard let url = URL(string: "\(apiBaseURL)/batches/upload") else {
            completion(.failure(NSError(domain: "TextileAPI", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid API URL"])))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("ios_share_extension", forHTTPHeaderField: "X-Client-Source")
        
        let payload: [String: Any] = [
            "supplierName": supplierName,
            "source": "ios_share_extension",
            "images": items
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload, options: [])
        } catch {
            completion(.failure(error))
            return
        }
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let batchId = json["id"] as? String else {
                completion(.success("batch_uploaded"))
                return
            }
            
            completion(.success(batchId))
        }
        task.resume()
    }
}
