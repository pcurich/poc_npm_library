import { Migration, DbContext } from '../context/DbContext';
import { HttpMockService } from '../services/HttpMockService';
import { UserService } from '../services/UserService';
import { setDbConfig, getDbConfig, DBInitOptions } from '../config';


/**
 * Crea e inicializa los servicios sobre IndexedDB según configuración.
 * La configuración es obligatoria: el llamador debe proveer dbName, version y stores.
 */
export async function createIndexedDbServices(opts: DBInitOptions) {
  setDbConfig(opts);
  const cfg = getDbConfig();

  const { dbName, version, stores, httpOnly = true, clearDatabase = false } = cfg;

// clearDatabase behavior (dev) - only if window/indexedDB is available
   if (clearDatabase && typeof indexedDB !== 'undefined') {
    await new Promise<void>((res) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => res();
      req.onerror = () => res();
      req.onblocked = () => res();
    });
  }

  const migrations: Migration = (db: IDBDatabase) => {
    for (const s of stores) {
      if (!db.objectStoreNames.contains(s.name)) {
        const store = db.createObjectStore(s.name, { keyPath: s.keyPath, autoIncrement: !!s.autoIncrement });
        if (s.indexes) {
          for (const idx of s.indexes) {
            if (!store.indexNames.contains(idx.name)) {
              store.createIndex(idx.name, idx.keyPath as any, idx.options ?? {});
            }
          }
        }
      }
    }
  };

  const ctx = new DbContext(dbName, version, [migrations]);
  console.log(`Opening IndexedDB database "${dbName}" (version ${version})...`);
  await ctx.open();

  const httpMockService = new HttpMockService(ctx);
  let userService: UserService | undefined;

   if (!httpOnly) {
    const hasUsers = stores.some((s) => s.name === 'users');
    if (hasUsers) userService = new UserService(ctx);
  }
  // Return services + ctx (cfg is globally accessible via getDbConfig())
  return { dbContext: ctx, httpMockService, userService };
}