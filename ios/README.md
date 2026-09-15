# iOS Share Extension Setup Guide for Surat Textile Agent App

This iOS Share Extension allows your father to share batches of 50+ saree/suit photos **directly from WhatsApp** into the catalogue with **zero need to save photos to his iPhone camera roll**.

---

## 📲 Workflow Summary

```
WhatsApp Chat with Supplier
       ↓
Select batch (e.g. 50 photos)
       ↓
Tap Share Sheet icon (↑)
       ↓
Select "Surat Textile Catalogue"
       ↓
Pick or enter Supplier Name (e.g. "Radhe Krishna Tex")
       ↓
Tap "Send to Catalogue"
       ↓
Photos compress to 1200px / WebP & stream to cloud
       ↓
2-Tier OCR extracts Rate (₹450), Fabric (Rayon), Code (R182)
       ↓
Father reviews: "47 ready · 3 need review"
```

---

## 🛠️ Step-by-Step Xcode Setup

### Step 1: Add a Share Extension Target to your Xcode Project
1. Open your project in Xcode.
2. Select **File > New > Target...**
3. Choose **iOS > Application Extension > Share Extension** and click **Next**.
4. Name the target: `SuratTextileShareExtension`.
5. Language: **Swift**. Click **Finish**.

### Step 2: Copy the Provided Files into the Extension Target
Copy these files from `/ios/ShareExtension/` into your new target:
- `ShareViewController.swift`
- `ShareView.swift`
- `TextileAPIService.swift`
- Replace the target's `Info.plist` with the provided `Info.plist`.

### Step 3: Configure Activation Rule for WhatsApp Multi-Selection
The provided `Info.plist` already includes the custom predicate:
```xml
<key>NSExtensionActivationRule</key>
<string>SUBQUERY (
    extensionItems,
    $extensionItem,
    SUBQUERY (
        $extensionItem.attachments,
        $attachment,
        ANY $attachment.registeredTypeIdentifiers UTI-CONFORMS-TO "public.image"
    ).@count &gt;= 1
).@count &gt;= 1</string>
```
This ensures WhatsApp recognizes your app when multiple images (1 to 100) are selected simultaneously.

### Step 4: Configure the Server Endpoint
In `TextileAPIService.swift`, update `apiBaseURL` with your deployed Cloud Run URL:
```swift
var apiBaseURL: String = "https://shivpriya-silk-mills-production.up.railway.app/api"
```

### Step 5: Run on iPhone
1. Connect your father's iPhone.
2. Build and run the app.
3. Open WhatsApp, go to any textile supplier chat, select multiple saree photos, tap Share, and select **Surat Textile Catalogue**!
