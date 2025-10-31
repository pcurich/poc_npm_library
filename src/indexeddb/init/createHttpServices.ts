import { Migration, DbContext } from '../context/DbContext';
import { HttpMockService } from '../services/HttpMockService';
import { UserService } from '../services/UserService';

export type IndexConfig = {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
};

export type StoreConfig = {
  name: string;
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: IndexConfig[];
};

/**
 * Configuración unificada para inicializar la DB y los servicios.
 */
export type DBInitOptions = {
  dbName?: string;              // nombre de la base de datos (IndexedDB)
  version?: number;             // versión de la DB (upgrades)
  stores?: StoreConfig[];       // definición de objectStores e índices
  httpOnly?: boolean;           // si true sólo devuelve HttpMockService
  clearDatabase?: boolean;      // dev: eliminar DB antes de abrir
};

/**
 * Crea e inicializa los servicios sobre IndexedDB según configuración.
 * Devuelve únicamente los servicios que manejan persistencia (no expone DbContext).
 */
export async function createIndexedDbServices(opts: DBInitOptions = {}) {
  const {
    dbName = ' httpMocks',
    version = 1,
    stores = [],
    httpOnly = false,
    clearDatabase = false
  } = opts;

  // store por defecto para mocks HTTP si no se pasa configuración
  const defaultHttpStore: StoreConfig = {
    name: 'httpMocks',
    keyPath: '_id',
    autoIncrement: true,
    indexes: [
      { name: 'by_url', keyPath: 'url', options: { unique: false } },
      { name: 'by_url_method', keyPath: ['url', 'method'], options: { unique: false } },
      { name: 'serviceCode', keyPath: 'serviceCode', options: { unique: false } }
    ]
  };

  const effectiveStores = stores.length > 0 ? stores : [defaultHttpStore];

  if (clearDatabase && typeof indexedDB !== 'undefined') {
    await new Promise<void>((res) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => res();
      req.onerror = () => res();
      req.onblocked = () => res();
    });
  }

  const migration: Migration = (db: IDBDatabase) => {
    for (const s of effectiveStores) {
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

  const ctx = new DbContext(dbName, version, [migration]);
  await ctx.open();

  const httpMockService = new HttpMockService(ctx);
  let userService: UserService | undefined;

  if (!httpOnly) {
    const hasUsers = effectiveStores.some((s) => s.name === 'users');
    if (hasUsers) userService = new UserService(ctx);
  }

  return { dbContext: ctx, httpMockService, userService };
}