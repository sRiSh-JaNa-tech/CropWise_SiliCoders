export const DB_NAME = 'SmartFarmingPlannerDB';
export const EVENTS_STORE = 'events';

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(EVENTS_STORE)) {
                db.createObjectStore(EVENTS_STORE, { keyPath: 'id' });
            }
        };
    });
};

export const saveEventsOffline = async (events: any[]) => {
    try {
        const db = await initDB();
        const tx = db.transaction(EVENTS_STORE, 'readwrite');
        const store = tx.objectStore(EVENTS_STORE);
        events.forEach(event => store.put(event));
        return tx.oncomplete;
    } catch (err) {
        console.error('Offline save failed', err);
    }
};

export const getOfflineEvents = async (): Promise<any[]> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(EVENTS_STORE, 'readonly');
            const store = tx.objectStore(EVENTS_STORE);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('Offline fetch failed', err);
        return [];
    }
};
