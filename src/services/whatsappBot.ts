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

const logger = pino({ level: 'silent' });

export class WhatsAppBotService {
  private sock: any = null;
  private connectionState: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' = 'disconnected';
  private qrCodeDataUrl: string | null = null;
  private connectedUser: string | null = null;
  private lastError: string | null = null;
  private activeSupplier: string = 'WhatsApp Supplier';

  // Burst buffer for multi-photo forwarded batches
  private bufferedImages: Array<{
    buffer: Buffer;
    caption?: string;
    senderJid?: string;
  }> = [];
  private burstTimer: NodeJS.Timeout | null = null;
  private currentBatchChatJid: string | null = null;

  constructor(private dataStore: DataStore) {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  public getStatus() {
    return {
      state: this.connectionState,
      isConnected: this.connectionState === 'connected',
      connectedUser: this.connectedUser,
      qrCodeDataUrl: this.qrCodeDataUrl,
      activeSupplier: this.activeSupplier,
      bufferedCount: this.bufferedImages.length,
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

      this.sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
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

    // NEVER process or reply to WhatsApp Groups (to protect family/business groups)
    if (fromJid.endsWith('@g.us')) return;

    // 1. Text commands (only explicit supplier setting, NO greetings or unsolicited auto-replies)
    const text = (
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      ''
    ).trim();

    if (text) {
      const lower = text.toLowerCase();

      // Check if user is setting supplier name
      if (lower.startsWith('supplier:') || lower.startsWith('mill:') || lower.startsWith('set supplier:')) {
        const parts = text.split(':');
        const newSupplier = parts.length > 1 ? parts.slice(1).join(':').trim() : '';
        if (newSupplier) {
          this.activeSupplier = newSupplier;
          return;
        }
      }
    }

    // 2. Image messages (forwarded or sent directly, including ephemeral & view-once containers)
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
          this.bufferedImages.push({
            buffer,
            caption,
            senderJid: fromJid,
          });

          this.currentBatchChatJid = fromJid;

          // Check if caption contains supplier hint
          if (caption && caption.length < 50 && !caption.includes('/-')) {
            if (caption.toLowerCase().includes('text') || caption.toLowerCase().includes('saree') || caption.toLowerCase().includes('mill')) {
              this.activeSupplier = caption.trim();
            }
          }

          // Debounce burst: Wait 5 seconds after the last forwarded image arrives
          if (this.burstTimer) {
            clearTimeout(this.burstTimer);
          }

          this.burstTimer = setTimeout(() => {
            this.processBufferedBatch();
          }, 5000);
        }
      } catch (err: any) {
        console.error('[WhatsApp Bot] Error downloading image message:', err);
      }
    }
  }

  /**
   * Process all photos collected during the burst into a single batch
   */
  private async processBufferedBatch() {
    const imagesToProcess = [...this.bufferedImages];
    const supplier = this.activeSupplier;

    this.bufferedImages = [];
    this.currentBatchChatJid = null;
    this.burstTimer = null;

    if (imagesToProcess.length === 0) return;

    const count = imagesToProcess.length;
    console.log(`[WhatsApp Bot] Processing burst of ${count} forwarded images for "${supplier}"...`);

    try {
      const batchItems = imagesToProcess.map((item, index) => {
        const hash = crypto.createHash('md5').update(item.buffer).digest('hex');
        const filename = `wa_${Date.now()}_${index + 1}_${hash.slice(0, 8)}.jpg`;
        const filePath = path.join(UPLOADS_DIR, filename);
        
        fs.writeFileSync(filePath, item.buffer);

        return {
          id: `wa_prod_${Date.now()}_${index + 1}`,
          imageUrl: `/uploads/${filename}`,
          textHint: item.caption || undefined,
          hash,
        };
      });

      // Call the real DataStore batch ingestion pipeline (runs Gemini Vision OCR)
      const batch = await this.dataStore.createAndProcessBatch(
        supplier,
        batchItems,
        'ios_share_extension' // High-priority automated WhatsApp ingestion
      );

      console.log(`[WhatsApp Bot] Successfully initiated batch ${batch.id} with ${batchItems.length} designs for "${supplier}"`);
    } catch (err: any) {
      console.error('[WhatsApp Bot] Failed to create batch from WhatsApp photos:', err);
    }
  }

  private async sendReply(_jid: string, _text: string) {
    // Completely silenced to never send unsolicited messages from any WhatsApp account
    return;
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
