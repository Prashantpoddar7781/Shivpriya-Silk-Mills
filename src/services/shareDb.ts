/**
 * Helper to retrieve shared images saved by the Service Worker during Web Share Target from WhatsApp.
 */

const DB_NAME = 'shivpriya_share_db';
const DB_VERSION = 1;
const STORE_NAME = 'shared_images';

function openShareDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAndClearSharedFiles(): Promise<File[]> {
  try {
    const db = await openShareDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getAllReq = store.getAll();

      getAllReq.onsuccess = () => {
        const records = getAllReq.result || [];
        const files: File[] = [];

        for (const item of records) {
          if (item.fileBlob instanceof File) {
            files.push(item.fileBlob);
          } else if (item.fileBlob instanceof Blob) {
            const file = new File([item.fileBlob], item.name || 'whatsapp_image.jpg', {
              type: item.type || 'image/jpeg',
              lastModified: item.lastModified || Date.now(),
            });
            files.push(file);
          }
        }

        // Clear store after reading
        store.clear();
        resolve(files);
      };

      getAllReq.onerror = () => reject(getAllReq.error);
    });
  } catch (err) {
    console.error('Error reading shared files from IndexedDB:', err);
    return [];
  }
}
