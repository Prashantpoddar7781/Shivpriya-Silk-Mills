import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import QRCode from 'qrcode';
import pino from 'pino';
import { 
  makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason, 
  downloadMediaMessage,
  proto
} from '@whiskeysockets/baileys';
import { DataStore } from './dataStore.js';

const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), 'data');
const AUTH_DIR = path.join(DATA_DIR, 'baileys_auth');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const PENDING_FILE = path.join(DATA_DIR, 'pending_whatsapp_batches.json');

const logger = pino({ level: 'silent' });

export interface PendingBatchItem {
  id: string;
  imageUrl: string;
  textHint?: string;
  hash: string;
}

export interface PendingBatch {
  items: PendingBatchItem[];
  chatJid: string;
  timestamp: number;
}

export class WhatsAppBotService {
  private sock: any = null;
  private connectionState: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' = 'disconnected';
  private qrCodeDataUrl: string | null = null;
  private connectedUser: string | null = null;
  private lastError: string | null = null;
  private activeSupplier: string = 'WhatsApp Supplier';

  // Active photo bursts currently arriving (keyed by chatJid)
  private burstQueues: Map<string, {
    items: PendingBatchItem[];
    timer: NodeJS.Timeout | null;
  }> = new Map();

  // Batches of photos that have fully arrived and are awaiting the user's supplier name reply
  private pendingBatches: Map<string, PendingBatch> = new Map();

  constructor(private dataStore: DataStore) {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    this.loadPendingBatches();
  }

  private loadPendingBatches() {
    try {
      if (fs.existsSync(PENDING_FILE)) {
        const raw = fs.readFileSync(PENDING_FILE, 'utf-8');
        const entries: Array<[string, PendingBatch]> = JSON.parse(raw);
        this.pendingBatches = new Map(entries);
        console.log(`[WhatsApp Bot] Restored ${this.pendingBatches.size} pending batches awaiting supplier name`);
      }
    } catch (err) {
      console.warn('[WhatsApp Bot] Could not load pending batches:', err);
    }
  }

  private persistPendingBatches() {
    try {
      const data = Array.from(this.pendingBatches.entries());
      fs.writeFileSync(PENDING_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('[WhatsApp Bot] Failed to persist pending batches:', err);
    }
  }

  public getStatus() {
    let pendingCount = 0;
    for (const batch of this.pendingBatches.values()) {
      pendingCount += batch.items.length;
    }
    for (const queue of this.burstQueues.values()) {
      pendingCount += queue.items.length;
    }

    return {
      state: this.connectionState,
      isConnected: this.connectionState === 'connected',
      connectedUser: this.connectedUser,
      qrCodeDataUrl: this.qrCodeDataUrl,
      activeSupplier: this.activeSupplier,
      bufferedCount: pendingCount,
      lastError: this.lastError,
    };
  }

  public setSupplier(supplierName: string) {
    if (supplierName && supplierName.trim()) {
      this.activeSupplier = supplierName.trim();
    }
    return this.activeSupplier;
  }

  public async start(): Promise<void> {
    if (this.sock && (this.connectionState === 'connected' || this.connectionState === 'connecting')) {
      return;
    }

    try {
      this.connectionState = 'connecting';
      this.lastError = null;

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

      this.sock = makeWASocket({
        auth: state,
        logger,
        printQRInTerminal: false,
        browser: ['Shivpriya Silk Mills', 'Chrome', '1.0.0'],
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
            this.connectionState = 'qr_ready';
            console.log('[WhatsApp Bot] New QR code generated for linking device');
          } catch (err: any) {
            console.error('[WhatsApp Bot] Failed to generate QR data URL:', err);
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          this.connectionState = 'disconnected';
          this.connectedUser = null;
          this.qrCodeDataUrl = null;
          this.lastError = lastDisconnect?.error?.message || 'Connection closed';

          console.log(`[WhatsApp Bot] Connection closed. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`);

          if (shouldReconnect) {
            setTimeout(() => this.start(), 3000);
          } else {
            // Logged out: remove session files
            if (fs.existsSync(AUTH_DIR)) {
              fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            }
          }
        } else if (connection === 'open') {
          this.connectionState = 'connected';
          this.qrCodeDataUrl = null;
          const userJid = this.sock.user?.id || '';
          this.connectedUser = userJid.split(':')[0] || userJid;
          console.log(`[WhatsApp Bot] Successfully connected as: ${this.connectedUser}`);
        }
      });

      this.sock.ev.on('messages.upsert', async ({ messages }: any) => {
        if (!messages || messages.length === 0) return;

        for (const msg of messages) {
          await this.handleIncomingMessage(msg);
        }
      });

    } catch (err: any) {
      console.error('[WhatsApp Bot] Initialization error:', err);
      this.connectionState = 'disconnected';
      this.lastError = err.message || 'Failed to start WhatsApp bot';
    }
  }

  private async handleIncomingMessage(msg: proto.IWebMessageInfo) {
    if (!msg.message) return;

    const fromJid = msg.key.remoteJid;
    if (!fromJid || fromJid === 'status@broadcast') return;

    // STRICT PRIVACY: NEVER process or reply to WhatsApp Groups
    if (fromJid.endsWith('@g.us')) return;

    // Extract text from text messages or captions
    const text = (
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''
    ).trim();

    // 1. Check if user is replying with a Supplier Name for a pending batch
    if (text) {
      const pending = this.pendingBatches.get(fromJid);
      if (pending && pending.items.length > 0) {
        const reply = text.trim();

        if (reply.toLowerCase() === 'cancel') {
          this.pendingBatches.delete(fromJid);
          this.persistPendingBatches();
          await this.sendReply(fromJid, '❌ Pending batch cancelled. Photos were discarded.');
          return;
        }

        const supplierName = reply.replace(/^(supplier|mill|set supplier)\s*:\s*/i, '').trim();
        const itemsToProcess = [...pending.items];
        this.pendingBatches.delete(fromJid);
        this.persistPendingBatches();

        console.log(`[WhatsApp Bot] User named supplier "${supplierName}" for ${itemsToProcess.length} pending photos from ${fromJid}`);

        await this.sendReply(
          fromJid,
          `⏳ Saving *${itemsToProcess.length} photos* under *${supplierName}*...\n\nGemini Vision OCR is reading prices (₹) and fabrics in the background.`
        );

        try {
          const batch = await this.dataStore.createAndProcessBatch(
            supplierName,
            itemsToProcess,
            'ios_share_extension'
          );

          console.log(`[WhatsApp Bot] Successfully initiated batch ${batch.id} with ${itemsToProcess.length} designs for "${supplierName}"`);

          await this.sendReply(
            fromJid,
            `✅ *Successfully added ${itemsToProcess.length} designs under ${supplierName}!* 🎉\n\nView them in your catalogue:\nhttps://shivpriyasilkmills.vercel.app`
          );
        } catch (err: any) {
          console.error('[WhatsApp Bot] Failed to process batch:', err);
          await this.sendReply(
            fromJid,
            `⚠️ Error saving batch: ${err.message || 'Unknown error'}. Please try again.`
          );
        }
        return;
      }

      // If user is explicitly setting default supplier without pending photos:
      const lower = text.toLowerCase();
      if (lower.startsWith('supplier:') || lower.startsWith('mill:') || lower.startsWith('set supplier:')) {
        const parts = text.split(':');
        const newSupplier = parts.length > 1 ? parts.slice(1).join(':').trim() : '';
        if (newSupplier) {
          this.activeSupplier = newSupplier;
          await this.sendReply(fromJid, `👍 Default supplier set to *${newSupplier}*.\n\nYou can now forward saree photos!`);
          return;
        }
      }

      // NOTE: Any other text (like "hi" or general chat) when NO photos are pending is intentionally ignored
      // to keep WhatsApp completely silent and prevent unsolicited automated replies!
    }

    // 2. Image messages (forwarded or direct photos, including ephemeral & view-once wrappers)
    const messageContent =
      msg.message?.ephemeralMessage?.message ||
      msg.message?.viewOnceMessage?.message ||
      msg.message?.viewOnceMessageV2?.message ||
      msg.message;
    const imageMessage = messageContent?.imageMessage;

    if (imageMessage) {
      try {
        const buffer = await downloadMediaMessage(
          msg,
          'buffer',
          {},
          {
            logger,
            reuploadRequest: this.sock?.updateMediaMessage,
          }
        );

        if (buffer && buffer.length > 0) {
          const caption = imageMessage.caption || '';
          
          if (!this.burstQueues.has(fromJid)) {
            this.burstQueues.set(fromJid, { items: [], timer: null });
          }
          const queue = this.burstQueues.get(fromJid)!;

          // Save photo safely to persistent Railway Volume immediately
          const hash = crypto.createHash('md5').update(buffer).digest('hex');
          const filename = `wa_${Date.now()}_${queue.items.length + 1}_${hash.slice(0, 8)}.jpg`;
          const filePath = path.join(UPLOADS_DIR, filename);
          fs.writeFileSync(filePath, buffer);

          queue.items.push({
            id: `wa_prod_${Date.now()}_${queue.items.length + 1}`,
            imageUrl: `/uploads/${filename}`,
            textHint: caption || undefined,
            hash,
          });

          // Debounce burst: wait 5 seconds after the LAST forwarded photo arrives
          if (queue.timer) {
            clearTimeout(queue.timer);
          }

          queue.timer = setTimeout(() => {
            this.finishBurstAndAskSupplier(fromJid);
          }, 5000);
        }
      } catch (err: any) {
        console.error('[WhatsApp Bot] Error downloading image message:', err);
      }
    }
  }

  /**
   * Called 5 seconds after the last photo in a forwarded burst arrives.
   * Asks the user via WhatsApp for the Supplier / Mill Name.
   */
  private async finishBurstAndAskSupplier(fromJid: string) {
    const queue = this.burstQueues.get(fromJid);
    if (!queue || queue.items.length === 0) return;

    const newItems = [...queue.items];
    this.burstQueues.delete(fromJid);

    // Merge into pendingBatches for this user
    let existing = this.pendingBatches.get(fromJid);
    if (existing) {
      existing.items.push(...newItems);
      existing.timestamp = Date.now();
    } else {
      existing = {
        items: newItems,
        chatJid: fromJid,
        timestamp: Date.now(),
      };
      this.pendingBatches.set(fromJid, existing);
    }

    this.persistPendingBatches();

    const count = existing.items.length;
    console.log(`[WhatsApp Bot] Burst complete for ${fromJid}. ${count} photos awaiting supplier name.`);

    // Ask user for supplier name directly in WhatsApp!
    await this.sendReply(
      fromJid,
      `📸 *Received ${count} photos!*\n\nPlease reply with the *Supplier / Mill Name* (e.g. _Radhe Krishna Tex_) to add this batch to your catalogue.`
    );
  }

  /**
   * Sends a WhatsApp text reply directly to the sender (never to groups).
   */
  private async sendReply(jid: string, text: string) {
    try {
      if (this.sock && jid && !jid.endsWith('@g.us')) {
        await this.sock.sendMessage(jid, { text });
      }
    } catch (err: any) {
      console.error('[WhatsApp Bot] Failed to send WhatsApp reply to', jid, err);
    }
  }

  public async logout(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout();
      }
    } catch {}
    this.connectionState = 'disconnected';
    this.connectedUser = null;
    this.qrCodeDataUrl = null;
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  }
}
