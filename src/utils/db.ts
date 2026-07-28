import { TranscriptionRecord } from '../types';

const DB_NAME = 'VoiceToTextDB';
const DB_VERSION = 1;
const STORE_RECORDS = 'records';
const STORE_AUDIO = 'audioBlobs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        db.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save audio Blob to IndexedDB
export async function saveAudioBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    const store = tx.objectStore(STORE_AUDIO);
    store.put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get audio Blob from IndexedDB
export async function getAudioBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readonly');
    const store = tx.objectStore(STORE_AUDIO);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Delete audio Blob
export async function deleteAudioBlob(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_AUDIO, 'readwrite');
    const store = tx.objectStore(STORE_AUDIO);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Save all records to IndexedDB
export async function saveAllRecords(records: TranscriptionRecord[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, 'readwrite');
    const store = tx.objectStore(STORE_RECORDS);
    store.clear();
    for (const rec of records) {
      // Don't save large blob URLs directly in records store, save metadata
      const cleanRec = { ...rec };
      delete cleanRec.audioBlobUrl;
      store.put(cleanRec);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Load all records from IndexedDB and attach audio blob URLs if stored
export async function getAllRecords(): Promise<TranscriptionRecord[]> {
  const db = await openDB();
  const records: TranscriptionRecord[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, 'readonly');
    const store = tx.objectStore(STORE_RECORDS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  // Attach audio blob URLs from IndexedDB audio store
  for (const rec of records) {
    try {
      const blob = await getAudioBlob(rec.id);
      if (blob) {
        rec.audioBlobUrl = URL.createObjectURL(blob);
      }
    } catch (err) {
      console.warn('Could not restore audio blob for record', rec.id, err);
    }
  }

  // Sort newest first
  records.sort((a, b) => b.createdAt - a.createdAt);
  return records;
}

// Clear all records and audio
export async function clearAllDatabase(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_RECORDS, STORE_AUDIO], 'readwrite');
    tx.objectStore(STORE_RECORDS).clear();
    tx.objectStore(STORE_AUDIO).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
