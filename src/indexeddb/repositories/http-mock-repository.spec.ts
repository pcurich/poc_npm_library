import 'fake-indexeddb/auto';
import { DbContext } from "../context/db-context";
import { getDbConfig, setDbConfig } from "../config";
import { HttpMockRepository } from "./http-mock-repository";
import { HttpMockEntity } from "../entities/http-mock-entity";

const DB_NAME = 'testHttpMockDB';
const STORE_NAME = 'httpMocks';

const config = {
    dbName: DB_NAME,
    version: 1,
    stores: [
        {
            name: STORE_NAME,
            keyPath: 'id',
            autoIncrement: true,
            indexes: [
                { name: 'by_url', keyPath: 'url', options: { unique: false } },
                { name: 'by_url_method', keyPath: ['url', 'method'], options: { unique: false } },
                { name: 'serviceCode', keyPath: 'serviceCode', options: { unique: false } }
            ]
        }
    ]
};

describe('HttpMockRepository', () => {
    let ctx: DbContext;
    let repo: HttpMockRepository;

    beforeEach(async () => {
        await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(DB_NAME);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
        });
        setDbConfig(config);
        ctx = new DbContext(DB_NAME, 1, [
            db => {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('by_url', 'url', { unique: false });
                    store.createIndex('by_url_method', ['url', 'method'], { unique: false });
                    store.createIndex('serviceCode', 'serviceCode', { unique: false });
                }
            }
        ]);
        await ctx.open();
        repo = new HttpMockRepository(ctx, STORE_NAME, 'id');
    });

    afterEach(async () => {
        if (ctx) ctx.close();
        await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(DB_NAME);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
        });
    });

    it('#Should create and find by index (simple key)', async () => {
        const entity: HttpMockEntity = { id: '1', url: '/api/test', method: 'GET', serviceCode: 'S1' } as any;
        await repo.create(entity);
        const found = await repo.findByIndex('/api/test', 'by_url');
        expect(found.length).toBe(1);
    });

    it('#Should create and find by index (composite key)', async () => {
        const entity: HttpMockEntity = { id: '1', url: '/api/test2', method: 'POST', serviceCode: 'S2' } as any;
        await repo.create(entity);
        const found = await repo.findByIndex(['/api/test2', 'POST'], 'by_url_method', ['url', 'method']);
        expect(found.length).toBe(1);
    });

    it('#Should throw if index does not exist', async () => {
        const entity: HttpMockEntity = { id: '1', url: '/api/test3', method: 'PUT', serviceCode: 'S3' } as any;
        await repo.create(entity);
        await expect(repo.findByIndex('notfound', 'no_index')).rejects.toThrow();
    });

    it('#Should resolve index name by keyPath if not provided', async () => {
        const entity: HttpMockEntity = { id: '1', url: '/api/test4', method: 'PATCH', serviceCode: 'S4' } as any;
        await repo.create(entity);
        const found = await repo.findByIndex('S4', 'serviceCode', 'serviceCode');
        expect(found.length).toBe(1);
    });

    it('#Should fallback to first index if no indexName and no keyPath', async () => {
        const entity: HttpMockEntity = { id: '1', url: '/api/test5', method: 'DELETE', serviceCode: 'S5' } as any;
        await repo.create(entity);
        const found = await repo.findByIndex('/api/test5');
        expect(found.length).toBe(1);
    });

    it('#Should throw if stores is empty in config', () => {
        expect(() => setDbConfig({ dbName: DB_NAME, version: 1, stores: [] }))
            .toThrow('stores is required and must be a non-empty array');
    });

    it('#Should throw if keyPath not defined for store', async () => {
        setDbConfig({
            dbName: DB_NAME,
            version: 1,
            stores: [{ name: 'noKeyPathStore' }]
        });
        const ctx = new DbContext(DB_NAME, 1, [
            db => {
                if (!db.objectStoreNames.contains('noKeyPathStore')) {
                    db.createObjectStore('noKeyPathStore');
                }
            }
        ]);
        await ctx.open();
        expect(() => new HttpMockRepository(ctx, 'noKeyPathStore')).toThrow(
            'HttpMockRepository: keyPath not defined for store "noKeyPathStore". Provide keyPath or configure it in DBInitOptions.'
        );
    });

    it('#Should throw if no index specified and no indexes configured', async () => {
        setDbConfig({
            dbName: DB_NAME,
            version: 1,
            stores: [{ name: 'noIndexStore', keyPath: 'id', autoIncrement: true }]
        });
        const ctx = new DbContext(DB_NAME, 1, [
            db => {
                if (!db.objectStoreNames.contains('noIndexStore')) {
                    db.createObjectStore('noIndexStore', { keyPath: 'id', autoIncrement: true });
                }
            }
        ]);
        await ctx.open();
        const repo = new HttpMockRepository(ctx, 'noIndexStore', 'id');
        await expect(repo.findByIndex('foo')).rejects.toThrow(
            'HttpMockRepository: no index specified and no indexes configured for store "noIndexStore"'
        );
    });

    it('#Should throw if keyPath of index does not match expected', async () => {
        const DB_NAME_UNIQUE = 'storeWithIndexTestDB';
        setDbConfig({
            dbName: DB_NAME_UNIQUE,
            version: 1,
            stores: [{
                name: 'storeWithIndex',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [{ name: 'by_url', keyPath: 'url', options: { unique: false } }]
            }]
        });
        await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(DB_NAME_UNIQUE);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
        });
        const ctx = new DbContext(DB_NAME_UNIQUE, 1, [
            db => {
                if (!db.objectStoreNames.contains('storeWithIndex')) {
                    const store = db.createObjectStore('storeWithIndex', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('by_url', 'url', { unique: false });
                }
            }
        ]);
        await ctx.open();
        const repo = new HttpMockRepository(ctx, 'storeWithIndex', 'id');
        await expect(repo.findByIndex('foo', 'by_url', 'not_url')).rejects.toThrow(/KeyPath del índice "by_url" no coincide/);
    });

    it('#Should resolve index name by expectedKeyPath', async () => {
        await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(DB_NAME);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
        });
        setDbConfig({
            dbName: DB_NAME,
            version: 1,
            stores: [{
                name: 'multiIndexStore',
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'by_url', keyPath: 'url', options: { unique: false } },
                    { name: 'by_method', keyPath: 'method', options: { unique: false } },
                    { name: 'by_url_method', keyPath: ['url', 'method'], options: { unique: false } }
                ]
            }]
        });
        const ctx = new DbContext(DB_NAME, 1, [
            db => {
                if (!db.objectStoreNames.contains('multiIndexStore')) {
                    const store = db.createObjectStore('multiIndexStore', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('by_url', 'url', { unique: false });
                    store.createIndex('by_method', 'method', { unique: false });
                    store.createIndex('by_url_method', ['url', 'method'], { unique: false });
                }
            }
        ]);
        await ctx.open();
        const repo = new HttpMockRepository(ctx, 'multiIndexStore', 'id');
        await repo.create({ url: '/api/cover', method: 'GET', serviceCode: 'COVER' } as any);
        const found = await repo.findByIndex(['/api/cover', 'GET'], undefined, ['url', 'method']);
        expect(found.length).toBe(1);
        ctx.close();
        await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(DB_NAME);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
        });
    });

});