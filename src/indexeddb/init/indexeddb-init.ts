import { setDbConfig } from '../config';
import { Migration, DbContext } from '../context/db-context';
import { HttpMockService } from '../services/http-mock-service';
import { DBInitOptions, inspectDbStructure, StoreConfig } from '../utils/inspect-db-structure';

/**
 * Genera una función de migración a partir de la configuración de stores.
 */
function makeMigration(stores: DBInitOptions['stores']): Migration {
  return (db: IDBDatabase) => {
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
}

/**
 * Obtiene la configuración real de la base de datos (metadata).
 */
export async function getIndexedDbConfig() {
  return inspectDbStructure();
}

/**
 * Crea la base de datos IndexedDB usando una configuración inicial o el valor por defecto.
 * @param cfg Configuración inicial opcional (DBInitOptions)
 * @returns Instancia de DbContext ya abierta
 */
export async function createIndexedDbServices(cfg?: DBInitOptions) {
  let resolvedCfg: DBInitOptions | undefined = cfg;

  if (!resolvedCfg) {
    // Intenta obtener la configuración real de la base de datos existente
    try {
      resolvedCfg = await getIndexedDbConfig();
    } catch {
      // Si no existe, usa la configuración por defecto
      resolvedCfg = DEFAULT_DB_INIT_OPTIONS;
    }
  }

  setDbConfig(resolvedCfg);

  // Crea (o abre) la base de datos con la configuración resuelta
  const ctx = await createDefaultIndexedDb(resolvedCfg);

  const httpMockService = new HttpMockService(ctx);
  return { dbContext: ctx, httpMockService };
}

/**
 * Crea la base de datos IndexedDB usando una configuración inicial o el valor por defecto.
 * @param cfg Configuración inicial opcional (DBInitOptions)
 * @returns Instancia de DbContext ya abierta
 */
export async function createDefaultIndexedDb(cfg?: DBInitOptions) {
  const config: DBInitOptions = cfg ?? DEFAULT_DB_INIT_OPTIONS;
  const migrations = makeMigration(config.stores);
  const ctx = new DbContext(config.dbName, config.version, [migrations]);
  await ctx.open();
  return ctx;
}

const DEFAULT_HTTP_STORE_OPTIONS: StoreConfig = {
  name: 'httpMocks',
  keyPath: 'id',
  autoIncrement: true,
  indexes: [
    { name: 'by_url', keyPath: 'url', options: { unique: false } },
    { name: 'by_url_method', keyPath: ['url', 'method'], options: { unique: false } },
    { name: 'serviceCode', keyPath: 'serviceCode', options: { unique: false } }
  ]
};

const DEFAULT_DB_INIT_OPTIONS: DBInitOptions = {
  dbName: 'httpMocksDB',
  version: 1,
  stores: [DEFAULT_HTTP_STORE_OPTIONS]

}