import 'fake-indexeddb/auto';
import { createDefaultIndexedDb, createIndexedDbServices, getIndexedDbConfig } from './indexeddb-init';
import { DBInitOptions } from '../utils/inspect-db-structure';

const DB_NAME = 'testInitDB';
const STORE_NAME = 'testStore';

const customConfig: DBInitOptions = {
  dbName: DB_NAME,
  version: 1,
  stores: [
    {
      name: STORE_NAME,
      keyPath: 'id',
      autoIncrement: true,
      indexes: [{ name: 'by_name', keyPath: 'name', options: { unique: false } }]
    }
  ]
};

describe('indexeddb-init', () => {
  afterEach(async () => {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });

  it('#Should create and open DbContext with custom config', async () => {
    const ctx = await createDefaultIndexedDb(customConfig);
    expect(ctx).toBeDefined();
    await ctx.close();
  });

  it('#Should create and open DbContext with default config', async () => {
    const ctx = await createDefaultIndexedDb();
    expect(ctx).toBeDefined();
    await ctx.close();
  });

  it('#Should create services with custom config', async () => {
    const { dbContext, httpMockService } = await createIndexedDbServices(customConfig);
    expect(dbContext).toBeDefined();
    await dbContext.close();
    expect(httpMockService).toBeDefined();
  });

  it('#Should create services with detected config', async () => {
    await createDefaultIndexedDb(customConfig);
    const { dbContext, httpMockService } = await createIndexedDbServices();
    expect(dbContext).toBeDefined();
    await dbContext.close();
    expect(httpMockService).toBeDefined();
  });

  it('#Should fallback to default config if getIndexedDbConfig fails', async () => {
    const original = require('../utils/inspect-db-structure');
    jest.spyOn(original, 'inspectDbStructure').mockImplementation(() => Promise.reject(new Error('fail')));
    const { dbContext, httpMockService } = await createIndexedDbServices();
    expect(dbContext).toBeDefined();
    await dbContext.close();
    expect(httpMockService).toBeDefined();
    jest.restoreAllMocks();
  });

  it('#Should getIndexedDbConfig returns structure', async () => {
    // Borra la base de datos por defecto para evitar interferencia
    await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('httpMocksDB');
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
    });
    await createDefaultIndexedDb(customConfig);
    const meta = await getIndexedDbConfig();
    expect(meta.dbName).toBe(DB_NAME);
});

  it('#Should makeMigration not create store if already exists', async () => {
    await createDefaultIndexedDb(customConfig);
    const ctx = await createDefaultIndexedDb(customConfig);
    expect(ctx).toBeDefined();
    await ctx.close();
  });
});