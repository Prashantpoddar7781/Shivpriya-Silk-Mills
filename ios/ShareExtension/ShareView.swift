import SwiftUI

/**
 * ShareView.swift
 * Native SwiftUI sheet presented inside the iOS Share Sheet when triggered from WhatsApp.
 * Designed for fast 1-tap operation for the textile agent father:
 * 1. Shows "50 images selected"
 * 2. Asks for Supplier Name (with 1-tap quick buttons for frequent Surat markets)
 * 3. Taps "Upload Batch" -> streams in background -> dismisses instantly.
 */
struct ShareView: View {
    let totalCount: Int
    let onUpload: (_ supplierName: String, _ category: String) -> Void
    let onCancel: () -> Void
    
    @State private var supplierName: String = ""
    @State private var selectedCategory: String = "Sarees"
    @State private var isUploading: Bool = false
    
    let quickSuppliers = [
        "Radhe Krishna Tex",
        "Mahalaxmi Saree Kendra",
        "Shree Balaji Creation",
        "Om Silk Mills",
        "Kavita Fashion"
    ]
    
    let categories = ["Sarees", "Suits", "Dress Material", "Kurtis"]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header badge
                HStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.orange.opacity(0.15))
                            .frame(width: 52, height: 52)
                        Image(systemName: "photo.stack.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.orange)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(totalCount) Designs Selected")
                            .font(.system(size: 18, weight: .bold))
                        Text("WhatsApp → Surat B2B Catalogue")
                            .font(.system(size: 13))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                .padding(.horizontal)
                .padding(.top, 8)
                
                Divider()
                
                // Supplier Input
                VStack(alignment: .leading, spacing: 10) {
                    Text("Supplier / Mill Name")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    TextField("Enter supplier or mill name...", text: $supplierName)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .padding(.vertical, 4)
                    
                    // Quick-pick pills
                    Text("Frequent Surat Suppliers:")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(quickSuppliers, id: \.self) { supplier in
                                Button(action: {
                                    supplierName = supplier
                                }) {
                                    Text(supplier)
                                        .font(.system(size: 13, weight: .medium))
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(supplierName == supplier ? Color.orange : Color(.systemGray6))
                                        .foregroundColor(supplierName == supplier ? .white : .primary)
                                        .cornerRadius(16)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal)
                
                // Category Picker
                VStack(alignment: .leading, spacing: 8) {
                    Text("Category")
                        .font(.system(size: 14, weight: .semibold))
                    
                    Picker("Category", selection: $selectedCategory) {
                        ForEach(categories, id: \.self) { cat in
                            Text(cat).tag(cat)
                        }
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
                .padding(.horizontal)
                
                Spacer()
                
                // Action Buttons
                VStack(spacing: 12) {
                    Button(action: {
                        let finalSupplier = supplierName.trimmingCharacters(in: .whitespacesAndNewlines)
                        let targetSupplier = finalSupplier.isEmpty ? "Direct WhatsApp Supplier" : finalSupplier
                        isUploading = true
                        onUpload(targetSupplier, selectedCategory)
                    }) {
                        HStack {
                            if isUploading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .padding(.trailing, 8)
                            } else {
                                Image(systemName: "arrow.up.circle.fill")
                                    .font(.system(size: 18))
                            }
                            Text(isUploading ? "Uploading Batch..." : "Send \(totalCount) Items to Catalogue")
                                .font(.system(size: 16, weight: .semibold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isUploading)
                    
                    Text("2-tier OCR (Rate/Fabric/Code) runs automatically in the cloud.")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal)
                .padding(.bottom, 16)
            }
            .navigationBarTitle("Share to Catalogue", displayMode: .inline)
            .navigationBarItems(leading: Button("Cancel") {
                onCancel()
            })
        }
    }
}
