// IndexedDB-backed recent-files store shared by rtdt/trv's File System Access
// API integration. Each app gets its own database (by name) so hero/leader
// recents never mix, but the schema and trim/dedupe logic are identical.

export function createRecentsStore({ dbName, maxRecents = 5 }) {
  const STORE_NAME = "recents";

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function loadRecents() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const entries = req.result || [];
          entries.sort((a, b) => b.savedAt - a.savedAt);
          resolve(entries);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  // `entryFields` holds the caller's app-specific metadata (e.g. heroName/
  // virtueCount or leaderName/slotCount) merged into the stored entry.
  async function addToRecents(fileHandle, entryFields) {
    try {
      const db = await openDB();
      const existing = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      // Deduplicate by file name
      const dupes = existing.filter((r) => r.fileName === fileHandle.name);

      const entry = {
        id: crypto.randomUUID?.() || String(Date.now()),
        fileName: fileHandle.name,
        savedAt: Date.now(),
        handle: fileHandle,
        ...entryFields,
      };

      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const d of dupes) store.delete(d.id);
      store.put(entry);

      // Trim to maxRecents (keep newest)
      const remaining = existing
        .filter((r) => r.fileName !== fileHandle.name)
        .sort((a, b) => b.savedAt - a.savedAt);
      const toRemove = remaining.slice(maxRecents - 1);
      for (const r of toRemove) store.delete(r.id);

      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });

      return loadRecents();
    } catch {
      return loadRecents();
    }
  }

  async function removeFromRecents(id) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* ignore */
    }
    return loadRecents();
  }

  async function clearAllRecents() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* ignore */
    }
    return [];
  }

  return { loadRecents, addToRecents, removeFromRecents, clearAllRecents };
}
