import 'fake-indexeddb/auto';
import { inspectDbStructure } from './inspect-db-structure';

const DB_NAME = 'testInspectDB';
const STORE_NAME = 'testStore';

describe('inspectDbStructure', () => {
    beforeEach(async () => {
        await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(DB_NAME);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
        });
        await new Promise<void>((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('by_name', 'name', { unique: false });
            };
            req.onsuccess = () => {
                req.result.close();
                resolve();
            };
            req.onerror = () => reject(req.error);
        });
    });

    afterEach(async () => {
        await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(DB_NAME);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
        });
    });

    it('#Should return correct dbName', async () => {
        const meta = await inspectDbStructure();
        expect(meta.dbName).toBe(DB_NAME);
    });

    it('#Should return correct version', async () => {
        const meta = await inspectDbStructure();
        expect(meta.version).toBe(1);
    });

    it('#Should return correct store name', async () => {
        const meta = await inspectDbStructure();
        expect(meta.stores[0].name).toBe(STORE_NAME);
    });

    it('#Should return correct keyPath', async () => {
        const meta = await inspectDbStructure();
        expect(meta.stores[0].keyPath).toBe('id');
    });

    it('#Should return correct index name', async () => {
        const meta = await inspectDbStructure();
        expect(meta.stores[0].indexes?.[0].name).toBe('by_name');
    });

    it('#Should throw if indexedDB.databases is not supported', async () => {
        const original = indexedDB.databases;
        // @ts-ignore
        indexedDB.databases = undefined;
        await expect(inspectDbStructure()).rejects.toThrow('indexedDB.databases() not supported');
        // @ts-ignore
        indexedDB.databases = original;
    });

    it('#Should throw if database name is not found', async () => {
        const original = indexedDB.databases;
        // @ts-ignore
        indexedDB.databases = async () => [{ name: undefined }];
        await expect(inspectDbStructure()).rejects.toThrow('Database name not found.');
        // @ts-ignore
        indexedDB.databases = original;
    });

    it('#Should inspect structure and return correct DBInitOptions (lines 42-78)', async () => {
        const result = await inspectDbStructure();
        expect(result.dbName).toBe(DB_NAME);
        expect(result.version).toBe(1);
        expect(result.stores.length).toBe(1);
        const store = result.stores[0];
        expect(store.name).toBe(STORE_NAME);
        expect(store.keyPath).toBe('id');
        expect(store.autoIncrement).toBe(true);
        expect(store.indexes?.length).toBe(1);
        expect(store.indexes?.[0].name).toBe('by_name');
        expect(store.indexes?.[0].keyPath).toBe('name');
    });

    it('#Should throw if no object stores found in the database', async () => {
    // Crea una base de datos sin stores
    await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
    });
    await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            // No crear ningún store
        };
        req.onsuccess = () => {
            req.result.close();
            resolve();
        };
        req.onerror = () => reject(req.error);
    });
    await expect(inspectDbStructure()).rejects.toThrow('No object stores found in the database.');
});

it('#Should throw if failed to open IndexedDB', async () => {
    // Simula un error en open
    const originalOpen = indexedDB.open;
    // @ts-ignore
    indexedDB.open = () => {
        const req = {} as IDBOpenDBRequest;
        setTimeout(() => {
            if (req.onerror) req.onerror(new Event('error'));
        }, 0);
        return req;
    };
    await expect(inspectDbStructure()).rejects.toThrow('Failed to open IndexedDB');
    // @ts-ignore
    indexedDB.open = originalOpen;
});

});