/**
 * Offline sync queue — client-side IndexedDB layer.
 *
 * When the mobile app is offline, mutations are queued here instead of
 * being sent to the server. When connectivity returns, the service worker's
 * background sync (or the manual retry button) replays the queue.
 *
 * The server also has a parallel OfflineSyncQueue table for server-side
 * audit + retry tracking, but the source of truth for "what needs to be
 * replayed" is this IndexedDB queue (it survives page reloads).
 */

const DB_NAME = "qbit-offline-queue";
const DB_VERSION = 1;
const STORE_NAME = "queue";

/** Opens (or creates) the IndexedDB queue store. */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface QueueItem {
  id: string;
  method: "PATCH" | "POST" | "PUT" | "DELETE";
  url: string;
  body: string;
  headers: Record<string, string>;
  status: "pending" | "syncing" | "synced" | "failed";
  attempts: number;
  lastError?: string;
  createdAt: number;
  syncedAt?: number;
  /** Optional: description for UI display */
  description?: string;
  /** Optional: work order ID for grouping */
  workOrderId?: string;
}

/** Generates a unique client-side queue ID. */
function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Adds a mutation to the offline queue. */
export async function enqueue(item: Omit<QueueItem, "id" | "status" | "attempts" | "createdAt">): Promise<QueueItem> {
  const db = await openDB();
  const fullItem: QueueItem = {
    ...item,
    id: generateId(),
    status: "pending",
    attempts: 0,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(fullItem);
    tx.oncomplete = () => {
      // Trigger background sync if supported
      void triggerBackgroundSync();
      resolve(fullItem);
    };
    tx.onerror = () => reject(tx.error);
  });
}

/** Returns all pending queue items (oldest first). */
export async function getPendingQueue(): Promise<QueueItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const items = (req.result as QueueItem[]) ?? [];
      // Filter to pending, sort by createdAt ascending
      items
        .filter((i) => i.status === "pending" || i.status === "failed")
        .sort((a, b) => a.createdAt - b.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Returns all queue items (for admin/debug display). */
export async function getAllQueue(): Promise<QueueItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const items = (req.result as QueueItem[]) ?? [];
      items.sort((a, b) => b.createdAt - a.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Updates a queue item. */
export async function updateQueueItem(id: string, patch: Partial<QueueItem>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result as QueueItem | undefined;
      if (item) {
        Object.assign(item, patch);
        store.put(item);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Removes a queue item after successful sync. */
export async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Clears all synced items (cleanup). */
export async function clearSyncedItems(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result as QueueItem[]) ?? [];
      for (const item of items) {
        if (item.status === "synced") {
          store.delete(item.id);
        }
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Returns queue stats for UI display. */
export async function getQueueStats(): Promise<{
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  total: number;
}> {
  const all = await getAllQueue();
  return {
    pending: all.filter((i) => i.status === "pending").length,
    syncing: all.filter((i) => i.status === "syncing").length,
    synced: all.filter((i) => i.status === "synced").length,
    failed: all.filter((i) => i.status === "failed").length,
    total: all.length,
  };
}

/** Triggers background sync if the browser supports it. */
export async function triggerBackgroundSync(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    if ("sync" in reg) {
      await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register("offline-sync");
      return true;
    }
  } catch {
    // Background sync not supported — manual retry will handle it
  }
  return false;
}

/**
 * Manually replays the offline queue.
 * Called when user clicks "Sync Now" button or when online event fires.
 */
export async function replayQueue(
  onProgress?: (item: QueueItem, success: boolean) => void,
): Promise<{ replayed: number; succeeded: number; failed: number }> {
  const pending = await getPendingQueue();
  let succeeded = 0;
  let failed = 0;

  for (const item of pending) {
    await updateQueueItem(item.id, { status: "syncing" });
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json", ...item.headers },
        body: item.body,
      });

      if (response.ok) {
        await updateQueueItem(item.id, { status: "synced", syncedAt: Date.now() });
        succeeded++;
        onProgress?.(item, true);
        // Remove after a short delay (so UI can show "synced" state)
        setTimeout(() => void removeFromQueue(item.id), 5000);
      } else {
        await updateQueueItem(item.id, {
          status: "failed",
          attempts: item.attempts + 1,
          lastError: `HTTP ${response.status}`,
        });
        failed++;
        onProgress?.(item, false);
      }
    } catch (err) {
      await updateQueueItem(item.id, {
        status: "failed",
        attempts: item.attempts + 1,
        lastError: err instanceof Error ? err.message : String(err),
      });
      failed++;
      onProgress?.(item, false);
    }
  }

  return { replayed: pending.length, succeeded, failed };
}
