import 'fake-indexeddb/auto';
import { DbContext } from "../context/db-context";
import { clearDbConfig, setDbConfig } from "../config";
import { HttpMockService } from "./http-mock-service";

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

describe('HttpMockService', () => {
    let ctx: DbContext;
    let service: HttpMockService;

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
        service = new HttpMockService(ctx, STORE_NAME, 'id');
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

    it('#Should create a mock', async () => {
        const created = await service.createMock({ url: '/api/test', method: 'GET', serviceCode: 'S1' });
        expect(created.id).toBeDefined();
    });

    it('#Should get a mock by id', async () => {
        const created = await service.createMock({ url: '/api/test2', method: 'POST', serviceCode: 'S2' });
        const found = await service.getMockById(created.id);
        expect(found?.url).toBe('/api/test2');
    });

    it('#Should update a mock', async () => {
        const created = await service.createMock({ url: '/api/test3', method: 'PUT', serviceCode: 'S3' });
        created.url = '/api/updated';
        const updated = await service.updateMock(created);
        expect(updated.url).toBe('/api/updated');
    });

    it('#Should delete a mock', async () => {
        const created = await service.createMock({ url: '/api/test4', method: 'PATCH', serviceCode: 'S4' });
        const deleted = await service.deleteMock(created.id);
        expect(deleted).toBe(true);
    });

    it('#Should get all mocks', async () => {
        await service.createMock({ url: '/api/test5', method: 'GET', serviceCode: 'S5' });
        await service.createMock({ url: '/api/test6', method: 'POST', serviceCode: 'S6' });
        const all = await service.getAllMocks();
        expect(all.length).toBe(2);
    });

    it('#Should find by url', async () => {
        await service.createMock({ url: '/api/test7', method: 'GET', serviceCode: 'S7' });
        const found = await service.findByUrl('/api/test7');
        expect(found.length).toBe(1);
    });

    it('#Should find by serviceCode', async () => {
        await service.createMock({ url: '/api/test8', method: 'GET', serviceCode: 'S8' });
        const found = await service.findByServiceCode('S8');
        expect(found.length).toBe(1);
    });

    it('#Should get response body as object', async () => {
        const created = await service.createMock({
            url: '/api/test9',
            method: 'GET',
            serviceCode: 'S9',
            responseBody: JSON.stringify({ foo: 'bar' })
        });
        const body = await service.getResponseBodyAs<{ foo: string }>(created.id);
        expect(body?.foo).toBe('bar');
    });

    it('#Should throw if no stores configured', () => {
        expect(() => setDbConfig({ dbName: DB_NAME, version: 1, stores: [] }))
            .toThrow('stores is required and must be a non-empty array');
    });

    it('#Should throw if repository for store is not registered', () => {
        setDbConfig({
            dbName: DB_NAME,
            version: 1,
            stores: [{ name: 'store1', keyPath: 'id' }]
        });
        const ctx = new DbContext(DB_NAME, 1, [
            db => {
                if (!db.objectStoreNames.contains('store1')) {
                    db.createObjectStore('store1', { keyPath: 'id' });
                }
            }
        ]);
        const service = new HttpMockService(ctx, 'store1');
        expect(() => (service as any).getRepo('notRegistered')).toThrow('HttpMockService: repository for store "notRegistered" is not registered');
    });

    it('#Should throw if primary key not found on entity when updating', async () => {
        setDbConfig({
            dbName: DB_NAME,
            version: 1,
            stores: [{ name: 'store2', keyPath: 'id' }]
        });
        const ctx = new DbContext(DB_NAME, 1, [
            db => {
                if (!db.objectStoreNames.contains('store2')) {
                    db.createObjectStore('store2', { keyPath: 'id' });
                }
            }
        ]);
        await ctx.open();
        const service = new HttpMockService(ctx, 'store2');
        await expect(service.updateMock({} as any, 'store2')).rejects.toThrow('Cannot update mock: primary key not found on the entity');
    });

    it('#Should throw if entity to update does not exist', async () => {
        await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(DB_NAME);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
        });
        setDbConfig({
            dbName: DB_NAME,
            version: 1,
            stores: [{ name: 'store3', keyPath: 'id' }]
        });
        const ctx = new DbContext(DB_NAME, 1, [
            db => {
                if (!db.objectStoreNames.contains('store3')) {
                    db.createObjectStore('store3', { keyPath: 'id' });
                }
            }
        ]);
        await ctx.open();
        const service = new HttpMockService(ctx, 'store3');
        await expect(service.updateMock({ id: 'notfound' } as any, 'store3')).rejects.toThrow('Mock not found');
    });

    it('#Should return empty array if store not configured in getAllMocks', async () => {
        setDbConfig({
            dbName: DB_NAME,
            version: 1,
            stores: [{ name: 'store4', keyPath: 'id' }]
        });
        const ctx = new DbContext(DB_NAME, 1, [
            db => {
                if (!db.objectStoreNames.contains('store4')) {
                    db.createObjectStore('store4', { keyPath: 'id' });
                }
            }
        ]);
        await ctx.open();
        const service = new HttpMockService(ctx, 'store4');
        const result = await service.getAllMocks('notExistingStore');
        expect(result).toEqual([]);
    });

    it('#Should fallback to preferredKey if no storeCfg or indexes in getIndexNameForKeyPathForStore', () => {
        setDbConfig({
            dbName: DB_NAME,
            version: 1,
            stores: [{ name: 'store5', keyPath: 'id' }]
        });
        const ctx = new DbContext(DB_NAME, 1, [
            db => {
                if (!db.objectStoreNames.contains('store5')) {
                    db.createObjectStore('store5', { keyPath: 'id' });
                }
            }
        ]);
        const service = new HttpMockService(ctx, 'store5');
        const idx = (service as any).getIndexNameForKeyPathForStore('store5', 'url', 'fallback');
        expect(idx).toBe('fallback');
    });

    it('#Should find by index with simple value', async () => {
        await service.createMock({ url: '/api/simple', method: 'GET', serviceCode: 'S13' });
        const found = await service.findByIndex('/api/simple', 'by_url', 'url');
        expect(found.length).toBe(1);
    });

    it('#Should find by index with array value (composite key)', async () => {
        await service.createMock({ url: '/api/composite', method: 'POST', serviceCode: 'S12' });
        const found = await service.findByIndex(['/api/composite', 'POST'], 'by_url_method', ['url', 'method']);
        expect(found.length).toBe(1);
    });

    it('#Should throw if repository for store is not registered (line 68)', () => {
        expect(() => (service as any).getRepo('notRegistered')).toThrow('HttpMockService: repository for store "notRegistered" is not registered');
    });

    it('#Should throw if cannot update mock: primary key not found on the entity (line 100)', async () => {
        await expect(service.updateMock({} as any, STORE_NAME)).rejects.toThrow('Cannot update mock: primary key not found on the entity');
    });

    it('#Should return [] if repo for storeName does not exist in getAllMocks (line 118)', async () => {
        const result = await service.getAllMocks('notExistingStore');
        expect(result).toEqual([]);
    });

    it('#Should return null if responseBody is undefined or null in getResponseBodyAs (lines 155-159)', async () => {
        const created = await service.createMock({ url: '/api/respnull', method: 'GET', serviceCode: 'Snull' });
        // Simula responseBody undefined
        const repo = (service as any).repos.get(STORE_NAME);
        await repo.update({ ...created, responseBody: undefined });
        const result1 = await service.getResponseBodyAs<any>(created.id, STORE_NAME);
        expect(result1).toBeNull();

        // Simula responseBody null
        await repo.update({ ...created, responseBody: null });
        const result2 = await service.getResponseBodyAs<any>(created.id, STORE_NAME);
        expect(result2).toBeNull();
    });

    it('#Should throw if repo for storeName does not exist in getAllMocks (line 64)', async () => {
        const result = await service.getAllMocks('notExistingStore');
        expect(result).toEqual([]);
    });

    it('#Should throw if entity to update does not exist (line 96)', async () => {
        await expect(service.updateMock({ id: 9999, url: 'nope' } as any, STORE_NAME)).rejects.toThrow('Mock not found');
    });

    it('#Should aggregate all mocks from all repos (line 114)', async () => {
        await service.createMock({ url: '/api/agg1', method: 'GET', serviceCode: 'S1' });
        await service.createMock({ url: '/api/agg2', method: 'POST', serviceCode: 'S2' });
        const all = await service.getAllMocks();
        expect(all.length).toBe(2);
    });

    it('#Should return raw string if responseBody is invalid JSON (lines 151-155)', async () => {
        const created = await service.createMock({
            url: '/api/invalidjson',
            method: 'GET',
            serviceCode: 'Sraw',
            responseBody: 'not-a-json'
        });
        const result = await service.getResponseBodyAs<any>(created.id, STORE_NAME);
        expect(result).toBe('not-a-json');
    });

});