// Service Worker for Shivpriya Silk Mills PWA
// Handles Web Share Target API: intercepts POST /share-target from WhatsApp on Android,
// saves shared images to IndexedDB, and redirects to the React app with HTTP 303 (GET).

const DB_NAME = 'shivpriya_share_db';
const DB_VERSION = 1;
const STORE_NAME = 'shared_images';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function openShareDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeSharedFiles(files) {
  const db = await openShareDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    // Clear any previous unhandled files
    store.clear();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      store.add({
        name: file.name || `whatsapp_design_${i + 1}.jpg`,
        type: file.type || 'image/jpeg',
        size: file.size,
        lastModified: file.lastModified || Date.now(),
        fileBlob: file,
        receivedAt: Date.now(),
      });
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept Web Share Target POST request from WhatsApp / Android Share Sheet
  if (event.request.method === 'POST' && (url.pathname === '/share-target' || url.pathname === '/')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const files = [];

          for (const [key, value] of formData.entries()) {
            if (value && typeof value === 'object' && ('size' in value || 'stream' in value)) {
              files.push(value);
            }
          }

          if (files.length > 0) {
            await storeSharedFiles(files);
          }
        } catch (err) {
          console.error('[ServiceWorker] Failed to process shared files:', err);
        }

        // HTTP 303 (See Other) instructs the browser to redirect using a GET request
        // This completely prevents "HTTP ERROR 405 Method Not Allowed"
        return Response.redirect('/?shared=1', 303);
      })()
    );
  }
});
