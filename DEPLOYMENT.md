# Deployment Guide: Vercel (Frontend) & Railway (Backend)

The repository has been pushed to GitHub:
👉 **[https://github.com/Prashantpoddar7781/Shivpriya-Silk-Mills](https://github.com/Prashantpoddar7781/Shivpriya-Silk-Mills)**

Both configuration files are already committed:
- **Vercel**: [`vercel.json`](./vercel.json)
- **Railway**: [`railway.json`](./railway.json) & [`Dockerfile`](./Dockerfile)

---

## Part 1: Deploy Backend on Railway (Step-by-Step)

Railway will host the Node.js server, local Tesseract OCR engine, disk storage for uploads, and the REST API.

1. Go to **[Railway.app](https://railway.com)** and log in with GitHub.
2. Click **"+ New Project"** → **"Deploy from GitHub repo"**.
3. Select repository: **`Prashantpoddar7781/Shivpriya-Silk-Mills`**.
4. Railway will automatically detect the [`Dockerfile`](./Dockerfile) and [`railway.json`](./railway.json).
5. **Configure Environment Variables**:
   - Go to your service's **Variables** tab.
   - Add:
     - `PORT` = `3000` (or leave default, Railway assigns dynamically)
     - `NODE_ENV` = `production`
     - `GEMINI_API_KEY` = *your Google Gemini API key* (used for Tier-2 fallback on unclear stamps)
6. **(Recommended) Persistent Volume for Uploads**:
   - In Railway, click **"+ New"** → **"Volume"** (or in service settings → Volumes).
   - Mount path: `/app/data`
   - *This ensures uploaded images in `data/uploads/` and catalogue records in `data/catalogue.json` persist permanently across redeployments.*
7. **Generate Public Domain**:
   - Go to **Settings** → **Networking** → Click **"Generate Domain"**.
   - You will receive a URL like:
     `https://shivpriya-silk-mills-production.up.railway.app`
   - Test it in your browser:
     `https://shivpriya-silk-mills-production.up.railway.app/api/health` → `{"status":"ok"}`

---

## Part 2: Deploy Frontend on Vercel (Step-by-Step)

Vercel will host the React SPA with global edge CDN caching and instant loading for buyers.

1. Go to **[Vercel.com](https://vercel.com)** and log in with GitHub.
2. Click **"Add New..."** → **"Project"**.
3. Under **Import Git Repository**, choose **`Prashantpoddar7781/Shivpriya-Silk-Mills`**.
4. **Project Settings**:
   - **Framework Preset**: `Vite` (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
5. **Environment Variables**:
   - Add:
     - `VITE_API_BASE_URL` = *your Railway backend URL from Part 1*
       (e.g. `https://shivpriya-silk-mills-production.up.railway.app`)
6. Click **"Deploy"**.
7. Vercel will build and launch your site at:
   `https://shivpriya-silk-mills.vercel.app`

---

## Part 3: Connect iPhone WhatsApp Share Extension

Once your Railway backend URL is live:

1. Open `/ios/ShareExtension/TextileAPIService.swift`.
2. Update line 13 with your Railway backend domain:
   ```swift
   var apiBaseURL: String = "https://shivpriya-silk-mills-production.up.railway.app/api"
   ```
3. Build the Xcode target onto your father's iPhone.
4. Now, whenever your father selects 50 saree photos in WhatsApp and taps Share → **Surat Textile Catalogue**, they will stream directly into your Railway backend and appear instantly on your Vercel catalogue!
