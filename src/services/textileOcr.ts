import { GoogleGenAI, Type } from '@google/genai';
import { createWorker } from 'tesseract.js';
import { ExtractedProductData } from '../types.js';

// Common Surat textile wholesale fabrics
const SURAT_FABRICS = [
  'Rayon',
  'Heavy Rayon',
  'Georgette',
  'Pure Georgette',
  'Dola Silk',
  'Dola',
  'Cotton',
  'Pure Cotton',
  'Cotton Silk',
  'Chanderi',
  'Chanderi Cotton',
  'Organza',
  'Organza Silk',
  'Chiffon',
  'Bandhani Silk',
  'Bandhani',
  'Bandhej',
  'Crepe',
  'Pure Crepe',
  'Jam Silk',
  'Roman Silk',
  'Linen',
  'Pure Linen',
  'Tissue',
  'Tissue Silk',
  'Satin Silk',
  'Satin',
  'Muslin',
  'Banarasi Silk',
  'Banarasi',
  'Soft Silk',
  'Kanjivaram Silk',
  'Kanjivaram',
  'Tussar Silk',
  'Jacquard',
  'Georgette Foil',
  'Modal Silk',
  'Modal',
  'Kota Doria',
  'Viscose',
  'Lycra',
  'Net',
  'Brocade',
  'Silk'
];

/**
 * Tier 1: Zero-cost instant regex parser for Surat textile wholesale text stamps.
 * WhatsApp product photos typically have stamps like:
 * "₹450 | Rayon | R182", "Rate 350/- D.No. 1024 Pure Cotton", "D-998 Price: 620 Quality: Georgette"
 */
export function parseSuratTextileRegex(text: string): {
  data: ExtractedProductData;
  isComplete: boolean;
  missingFields: string[];
} {
  if (!text || typeof text !== 'string') {
    return {
      data: { price: null, fabric: null, code: null },
      isComplete: false,
      missingFields: ['price', 'fabric', 'code'],
    };
  }

  // Normalize separators and clean whitespace
  const clean = text
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let price: number | null = null;
  let fabric: string | null = null;
  let code: string | null = null;

  // 1. Fabric extraction
  // Match known Surat fabrics (longest match first for multi-word like "Chanderi Cotton")
  const sortedFabrics = [...SURAT_FABRICS].sort((a, b) => b.length - a.length);
  for (const f of sortedFabrics) {
    const fabRegex = new RegExp(`\\b${f.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (fabRegex.test(clean)) {
      fabric = f;
      break;
    }
  }

  // If not in pre-defined list, search for "Quality: XYZ" or "Fabric: XYZ"
  if (!fabric) {
    const fabMatch = clean.match(/(?:quality|fabric|qly|fab|kapda)[:\s\-]+([A-Za-z\s]{3,25})/i);
    if (fabMatch && fabMatch[1]) {
      const candidate = fabMatch[1].trim();
      if (
        !candidate.toLowerCase().includes('rate') &&
        !candidate.toLowerCase().includes('price') &&
        !candidate.toLowerCase().includes('design') &&
        !candidate.toLowerCase().includes('code')
      ) {
        fabric = candidate;
      }
    }
  }

  // 2. Product code extraction
  // Matches: R182, D.No. 1024, D-998, SK-401, RG, Design No: 884, No. 551, CAT-12, K-90, DES-104
  const codeBlacklist = new Set([
    'BLURRED', 'TORN', 'MISSING', 'UNCLEAR', 'UNKNOWN', 'NONE', 'NULL',
    'RATE', 'PRICE', 'QUALITY', 'SPECIAL', 'FABRIC', 'PHOTO', 'CATALOGUE', 'NEW',
    'JPG', 'JPEG', 'PNG', 'WEBP',
    'SUIT', 'SUITS', 'SAREE', 'SAREES', 'DRESS', 'KURTI', 'KURTIS',
    'TEXTILE', 'MATERIAL', 'COTTON', 'SILK', 'MILL', 'MILLS',
    'CREATION', 'CREATIONS', 'FASHION', 'SYNTHETICS', 'WHOLESALE'
  ]);

  const codeMatches = [
    /(?:d\.?\s*no\.?|design(?:\s*no\.?)?|art(?:\s*no\.?)?|code|item|d-)\s*[:#\-]?\s*([A-Za-z0-9\-_]{2,14})/i,
    /\b([A-Z]{1,4}[-_]?\d{2,6}[A-Z]?)\b/,
    /(?:^|[|\s])#?([A-Za-z0-9]{3,8})(?:[|\s]|$)/,
    // Brand/Supplier acronyms printed on fabric (e.g. RG, SK, MK)
    /\b([A-Z]{2,4})\b/
  ];

  for (const regex of codeMatches) {
    const match = clean.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim().toUpperCase();
      // Ignore WhatsApp file prefixes like WA0016 or IMG-
      if (
        !codeBlacklist.has(candidate) &&
        !/^WA\d+$/i.test(candidate) &&
        !/^IMG/i.test(candidate) &&
        (!fabric || !fabric.toUpperCase().includes(candidate))
      ) {
        code = candidate;
        break;
      }
    }
  }

  // 3. Price extraction
  // Matches: ₹450, 450/-, Rate: 450, Rs. 450, Price: 450, Rt-450, 450rs, 450 net, 375
  const priceMatches = [
    /(?:₹|rs\.?|inr|rate[:\s\-]*|price[:\s\-]*|rt[:\s\-]*)\s*(\d{3,5})(?:\s*\/\-|\b)/i,
    /(?<![A-Za-z0-9\-_])(\d{3,5})\s*\/\-/,
    /(?:^|[|\s,])(\d{3,5})(?:\s*net|\s*fixed)?(?:[|\s,]|$)/i,
    // Pure standalone 3 to 4 digit numbers (standard wholesale prices between 150 and 9999)
    /\b([1-9]\d{2,3})\b/
  ];

  for (const regex of priceMatches) {
    const match = clean.match(regex);
    if (match && match[1]) {
      const p = parseInt(match[1], 10);
      const strP = String(p);
      // Ensure the matched price is not actually the product code (e.g. SK-401)
      if (code && (code === strP || code.includes(`-${strP}`) || code.includes(strP))) {
        continue;
      }
      // Reasonable wholesale saree/suit range in Surat (₹150 to ₹15,000)
      if (p >= 150 && p <= 15000) {
        price = p;
        break;
      }
    }
  }

  const missingFields: string[] = [];
  if (price === null) missingFields.push('price');
  if (fabric === null) missingFields.push('fabric');
  if (code === null) missingFields.push('code');

  // In wholesale trading, price is the only essential field for buyers
  const isComplete = price !== null;

  return {
    data: { price, fabric, code },
    isComplete,
    missingFields,
  };
}

// Reusable singleton Tesseract OCR worker for free local processing
let tesseractWorkerPromise: Promise<any> | null = null;

async function getTesseractWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = (async () => {
      const worker = await createWorker('eng');
      return worker;
    })();
  }
  return tesseractWorkerPromise;
}

/**
 * Detects and extracts WhatsApp digital white text overlay (e.g. 396, 375, 400).
 * Saree and suit photos sent via WhatsApp almost universally have the wholesale rate
 * typed across the center using WhatsApp's digital text tool in bold white characters.
 * Because metallic zari embroidery has specular glitter noise that breaks standard Otsu binarization,
 * this function isolates font-stroke white connected components, cleans the background to pure white,
 * and feeds crystal-clear black-on-white digits to Tesseract.
 */
export async function extractDigitalWholesaleRate(
  imageSource: Buffer | string
): Promise<number | null> {
  try {
    let rawBuffer: Buffer;
    if (Buffer.isBuffer(imageSource)) {
      rawBuffer = imageSource;
    } else if (typeof imageSource === 'string') {
      if (imageSource.startsWith('data:image')) {
        const base64Data = imageSource.split(',')[1] || imageSource;
        rawBuffer = Buffer.from(base64Data, 'base64');
      } else if (imageSource.startsWith('/') || imageSource.includes(':\\')) {
        const fs = await import('fs');
        const path = await import('path');
        let resolved = imageSource;
        if (imageSource.startsWith('/uploads')) {
          resolved = path.join(process.cwd(), 'data', imageSource);
        } else if (imageSource.startsWith('/')) {
          resolved = path.join(process.cwd(), imageSource.replace(/^\//, ''));
        }
        if (fs.existsSync(resolved)) {
          rawBuffer = fs.readFileSync(resolved);
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }

    const jpegMod: any = await import('jpeg-js');
    const decodeFn = jpegMod.decode || jpegMod.default?.decode;
    const encodeFn = jpegMod.encode || jpegMod.default?.encode;
    if (!decodeFn || !encodeFn) return null;

    let decoded;
    try {
      decoded = decodeFn(rawBuffer, { useTArray: true });
    } catch {
      return null;
    }

    const w = decoded.width;
    const h = decoded.height;
    if (w < 100 || h < 100) return null;

    // Center region where WhatsApp wholesale rates are placed (15% to 85% width, 18% to 82% height)
    const xStart = Math.floor(w * 0.15);
    const xEnd = Math.floor(w * 0.85);
    const yStart = Math.floor(h * 0.18);
    const yEnd = Math.floor(h * 0.82);
    const cropW = xEnd - xStart;
    const cropH = yEnd - yStart;

    const isTextPixel = new Uint8Array(cropW * cropH);
    for (let y = yStart; y < yEnd; y++) {
      for (let x = xStart; x < xEnd; x++) {
        const srcIdx = (y * w + x) * 4;
        const r = decoded.data[srcIdx];
        const g = decoded.data[srcIdx + 1];
        const b = decoded.data[srcIdx + 2];
        const dstIdx = (y - yStart) * cropW + (x - xStart);

        const maxVal = Math.max(r, g, b);
        const minVal = Math.min(r, g, b);
        const diff = maxVal - minVal;

        // WhatsApp white font overlay: bright pixels with low color saturation
        if (r > 195 && g > 195 && b > 195 && diff < 35) {
          isTextPixel[dstIdx] = 1;
        }
      }
    }

    // Connected components to isolate large font strokes from tiny embroidery speckles
    const visited = new Uint8Array(cropW * cropH);
    const clusters: number[][] = [];
    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const idx = y * cropW + x;
        if (isTextPixel[idx] && !visited[idx]) {
          const queue = [idx];
          visited[idx] = 1;
          const comp: number[] = [];
          while (queue.length > 0) {
            const curr = queue.pop()!;
            comp.push(curr);
            const cy = Math.floor(curr / cropW);
            const cx = curr % cropW;
            const neighbors = [
              cy > 0 ? (cy - 1) * cropW + cx : -1,
              cy < cropH - 1 ? (cy + 1) * cropW + cx : -1,
              cx > 0 ? cy * cropW + (cx - 1) : -1,
              cx < cropW - 1 ? cy * cropW + (cx + 1) : -1,
            ];
            for (const n of neighbors) {
              if (n >= 0 && isTextPixel[n] && !visited[n]) {
                visited[n] = 1;
                queue.push(n);
              }
            }
          }
          // WhatsApp digital font strokes have > 160 connected pixels
          if (comp.length > 160) {
            clusters.push(comp);
          }
        }
      }
    }

    if (clusters.length === 0) return null;

    // Render clean black text on white canvas
    const cleanBuf = Buffer.alloc(cropW * cropH * 4);
    cleanBuf.fill(255);
    for (const comp of clusters) {
      for (const idx of comp) {
        cleanBuf[idx * 4] = 0;
        cleanBuf[idx * 4 + 1] = 0;
        cleanBuf[idx * 4 + 2] = 0;
        cleanBuf[idx * 4 + 3] = 255;
      }
    }

    const encoded = encodeFn({ data: cleanBuf, width: cropW, height: cropH }, 90);
    const worker = await getTesseractWorker();
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_char_whitelist: '0123456789',
    });

    const res = await worker.recognize(encoded.data);
    const text = res.data?.text?.trim() || '';
    const match = text.match(/\b([1-9]\d{2,3})\b/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 150 && num <= 15000) {
        return num;
      }
    }
    return null;
  } catch (err) {
    console.warn('extractDigitalWholesaleRate error:', err);
    return null;
  }
}

/**
 * Runs local Tesseract OCR on an image buffer or base64 data.
 * Zero-cost: runs completely in Node.js on the server ($0.00).
 */
export async function runLocalOcr(
  imageSource: Buffer | string
): Promise<string> {
  try {
    const worker = await getTesseractWorker();
    await worker.setParameters({
      tessedit_pageseg_mode: '3',
      tessedit_char_whitelist: '',
    });
    const ret = await worker.recognize(imageSource);
    return ret.data?.text || '';
  } catch (err) {
    console.warn('Local Tesseract OCR attempt failed, proceeding without OCR text:', err);
    return '';
  }
}

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

/**
 * Tier 2: Gemini Vision fallback.
 * Strictly called only when Tier 1 free local OCR cannot extract all 3 fields.
 * Follows zero-hallucination policy: returns null for any missing field.
 */
export async function parseWithGeminiVision(
  imageBase64OrDataUrl: string,
  textHint?: string,
  partialData?: ExtractedProductData
): Promise<{ data: ExtractedProductData; missingFields: string[] }> {
  const ai = getGeminiClient();
  if (!ai) {
    // If no API key configured, return Tier 1 regex results safely
    const fallback = parseSuratTextileRegex(textHint || '');
    return { data: fallback.data, missingFields: fallback.missingFields };
  }

  try {
    let base64Data = imageBase64OrDataUrl;
    let mimeType = 'image/jpeg';

    if (imageBase64OrDataUrl.startsWith('data:')) {
      const match = imageBase64OrDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const prompt = `You are a strict OCR extractor for Surat wholesale textile product images (sarees, suits, dress materials).
The image contains wholesale product details stamped or printed on the fabric or paper tag.
Extract ONLY the physical printed text on the image for these 3 fields:
- "price": Wholesale price/rate in INR as an integer (e.g. 450). Return null if not written.
- "fabric": Fabric/quality name (e.g. "Rayon", "Pure Georgette", "Dola Silk", "Cotton"). Return null if not written.
- "code": Design code / Product number / D.No. (e.g. "R182", "D-104", "1024"). Return null if not written.

RULES:
- Maximum 3 fields: price, fabric, code.
- Do NOT guess or infer additional product details.
- If a field is not physically visible or is missing, return null. Never hallucinate.
${partialData?.price ? `Known Price: ₹${partialData.price}` : ''}
${partialData?.fabric ? `Known Fabric: "${partialData.fabric}"` : ''}
${partialData?.code ? `Known Code: "${partialData.code}"` : ''}
${textHint ? `OCR Text Detected: "${textHint}"` : ''}`;

    const parts: any[] = [{ text: prompt }];

    // If valid base64 payload provided
    if (base64Data && base64Data.length > 100 && !base64Data.startsWith('http')) {
      parts.unshift({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            price: {
              type: Type.INTEGER,
              description: 'Wholesale price in INR or null if missing',
            },
            fabric: {
              type: Type.STRING,
              description: 'Fabric quality or null if missing',
            },
            code: {
              type: Type.STRING,
              description: 'Product design code or null if missing',
            },
          },
        },
        systemInstruction:
          'You are a strict OCR extractor for Surat wholesale textile stamps. Never hallucinate. If a field is absent, return null.',
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Empty response from model');
    }

    const parsed = JSON.parse(text);
    const data: ExtractedProductData = {
      price: typeof parsed.price === 'number' ? parsed.price : (partialData?.price ?? null),
      fabric: typeof parsed.fabric === 'string' && parsed.fabric.trim() ? parsed.fabric.trim() : (partialData?.fabric ?? null),
      code: typeof parsed.code === 'string' && parsed.code.trim() ? parsed.code.trim() : (partialData?.code ?? null),
    };

    const missingFields: string[] = [];
    if (data.price === null) missingFields.push('price');
    if (data.fabric === null) missingFields.push('fabric');
    if (data.code === null) missingFields.push('code');

    return { data, missingFields };
  } catch (err) {
    console.error('Gemini vision fallback error:', err);
    // Graceful fallback to regex
    const fallback = parseSuratTextileRegex(textHint || '');
    return { data: fallback.data, missingFields: fallback.missingFields };
  }
}
