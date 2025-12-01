import 'fake-indexeddb/auto';
import { DbContext } from './db-context';

function uniqueName(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function cleanupDB(dbName: string) {
  return new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(dbName);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

describe('DbContext', () => {
  it('#Should open database and create store', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    const db = await ctx.open();
    expect(db.objectStoreNames.contains(STORE_NAME)).toBe(true);
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should resolve immediately if open called twice', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    const db1 = await ctx.open();
    const db2 = await ctx.open();
    expect(db2.name).toBe(DB_NAME);
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should reject if migration throws in open', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      () => { throw new Error('migration error'); }
    ]);
    await expect(ctx.open()).rejects.toThrow('migration error');
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should reject if open fails (onerror)', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const originalOpen = indexedDB.open;
    (indexedDB as any).open = () => {
      const req = Object.assign(new EventTarget(), {
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        result: {},
        error: new Error('open failed')
      }) as IDBOpenDBRequest;
      setTimeout(() => {
        if (typeof req.onerror === 'function') req.onerror({ target: req } as any);
      }, 0);
      return req;
    };
    const ctx = new DbContext('failDB', 1, []);
    await expect(ctx.open()).rejects.toThrow('open failed');
    (indexedDB as any).open = originalOpen;
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should close database', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    await ctx.open();
    await ctx.close();
    expect((ctx as any).dbInstance).toBe(null);
    await cleanupDB(DB_NAME);
  });

  it('#Should getDB after open', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    await ctx.open();
    const db = await ctx.getDB();
    expect(db.name).toBe(DB_NAME);
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should call open from getDB if not opened', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    const db = await ctx.getDB();
    expect(db.name).toBe(DB_NAME);
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should return db from dbPromise as fallback in getDB', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    await ctx.open();
    (ctx as any).dbInstance = null;
    const db = await ctx.getDB();
    expect(db.objectStoreNames.contains(STORE_NAME)).toBe(true);
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should throw if dbPromise resolves to undefined in getDB', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, []);
    (ctx as any).dbPromise = Promise.resolve(undefined);
    await expect(ctx.getDB()).rejects.toThrow('Failed to open IndexedDB database.');
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should runTransaction and add/get record', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    await ctx.open();
    const record = { id: 1, value: 'foo' };
    await ctx.runTransaction(STORE_NAME, 'readwrite', store => store.add(record));
    const result = await ctx.runTransaction(STORE_NAME, 'readonly', store => store.get(1));
    expect(result).toEqual(record);
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should reject transaction on error', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    await ctx.open();
    await expect(
      ctx.runTransaction('notExist', 'readonly', store => store.get(1))
    ).rejects.toThrow();
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should reject runTransaction if request fails', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    await ctx.open();
    // Insert a record with id: 1
    await ctx.runTransaction(STORE_NAME, 'readwrite', store => store.add({ id: 1, value: 'foo' }));
    // Try to add the same id again, but catch only the request error (not the transaction error)
    await expect(
      ctx.runTransaction(STORE_NAME, 'readwrite', store => {
        // This will cause a ConstraintError on the request
        return store.add({ id: 1, value: 'bar' });
      })
    ).rejects.toThrow(/constraint was not satisfied|ConstraintError/i);
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should reject runTransaction if transaction aborts', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    await ctx.open();
    await expect(
      ctx.runTransaction(STORE_NAME, 'readwrite', store => {
        (store as any).transaction.abort();
      })
    ).rejects.toThrow('Transaction aborted');
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should reject runTransaction if transaction errors', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    await ctx.open();
    await ctx.runTransaction(STORE_NAME, 'readwrite', store => store.add({ id: 1, value: 'foo' }));
    await expect(
      ctx.runTransaction(STORE_NAME, 'readwrite', store => store.add({ id: 1, value: 'bar' }))
    ).rejects.toThrow(/constraint was not satisfied|ConstraintError/i);
    await ctx.close();
    await cleanupDB(DB_NAME);
  });
  it('#Should resolve runTransaction with promise and tx', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    await ctx.open();
    const result = await ctx.runTransaction(STORE_NAME, 'readwrite', store => {
      return store.add({ id: 2, value: 'bar' });
    });
    expect(result).toEqual(2);
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should resolve runTransaction with undefined if fn returns nothing', async () => {
    const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    await ctx.open();
    const result = await ctx.runTransaction(STORE_NAME, 'readwrite', store => { });
    expect(result).toBeUndefined();
    await ctx.close();
    await cleanupDB(DB_NAME);
  });

  it('#Should resolve runTransaction when fn returns a Promise (lines 80-81)', async () => {
     const DB_NAME = uniqueName('testDbContextDB');
    const STORE_NAME = uniqueName('testStore');
    await cleanupDB(DB_NAME);
    const ctx = new DbContext(DB_NAME, 1, [
      db => {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    ]);
    await ctx.open();
    const result = await ctx.runTransaction(STORE_NAME, 'readwrite', (store) => {
      return new Promise((resolve) => {
        const req = store.add({ id: 1, value: 'foo' });
        req.onsuccess = () => resolve('done');
      });
    });
    expect(result).toBe('done');
  });
});