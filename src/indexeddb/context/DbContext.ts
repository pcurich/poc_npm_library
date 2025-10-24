
import { IDbContext } from "./IDbContext";

export type Migration = (db: IDBDatabase) => void;

export class DbContext implements IDbContext {
    private dbPromise: Promise<void> | null = null;
    private dbInstance: IDBDatabase | null = null;

    constructor(private name: string, private version = 1, private migrations: Migration[] = []) {}

    async open(): Promise<void> {
        if (this.dbPromise) return Promise.resolve();
        this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            const req = indexedDB.open(this.name, this.version);
            req.onupgradeneeded = (ev: IDBVersionChangeEvent) => {
                const db = (ev.target as IDBOpenDBRequest).result;
                try {
                    for (const m of this.migrations) m(db);
                } catch (err) {
                    reject(err);
                }
            };
            req.onsuccess = () => {
                this.dbInstance = req.result;
                // close DB on page unload to avoid locked DB during tests/updates
                this.dbInstance.onversionchange = () => this.dbInstance?.close();
                resolve(this.dbInstance);
            };
            req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
        }).then(() => Promise.resolve());
        return this.dbPromise as Promise<void>;
    }

     async getDB(): Promise<IDBDatabase> {
        if (!this.dbPromise) await this.open();
        if (this.dbInstance) return this.dbInstance;
        // should not happen but guard
        return (await this.dbPromise as unknown) as IDBDatabase;
    }

    async runTransaction<T>(
        storeName: string,
        mode: IDBTransactionMode,
        fn: (store: IDBObjectStore) => IDBRequest | Promise<any> | void
    ): Promise<T> {
        const db = await this.getDB();
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);

        const maybe = fn(store);

        const promiseFromRequest = (req: IDBRequest) =>
            new Promise<any>((resolve, reject) => {
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
            });

        const promiseFromTx = (transaction: IDBTransaction) =>
            new Promise<void>((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onabort = () => reject(transaction.error ?? new Error('Transaction aborted'));
                transaction.onerror = () => reject(transaction.error ?? new Error('Transaction error'));
            });

        if (maybe instanceof IDBRequest || (maybe && typeof (maybe as unknown as IDBRequest).onsuccess === 'function')) {
            return promiseFromRequest(maybe as IDBRequest) as Promise<T>;
        }

        if (maybe instanceof Promise) {
            // wait both the promise and tx completion to ensure durability
            const p = maybe as Promise<any>;
            return Promise.all([p, promiseFromTx(tx)]).then(([res]) => res as T);
        }

        await promiseFromTx(tx);
        return undefined as unknown as T;
    }
}       