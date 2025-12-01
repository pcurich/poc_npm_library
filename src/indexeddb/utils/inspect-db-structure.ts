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

export type DBInitOptions = {
  dbName: string;
  version: number;
  stores: StoreConfig[];
};

export async function inspectDbStructure(): Promise<DBInitOptions> {
  // indexedDB.databases() no está soportado en todos los navegadores, pero sí en entornos modernos y fake-indexeddb
  const dbs = await (indexedDB.databases ? indexedDB.databases() : Promise.reject(new Error('indexedDB.databases() not supported')));
  if (!dbs || dbs.length === 0) throw new Error('No IndexedDB databases found.');
  const dbName = dbs[0].name;
  if (!dbName) throw new Error('Database name not found.');

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onsuccess = () => {
      const db = req.result;
      if (db.objectStoreNames.length === 0) {
        db.close();
        return reject(new Error('No object stores found in the database.'));
      }
      // Solo una colección por ahora
      const storeName = db.objectStoreNames[0];
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);

      // Extraer keyPath y autoIncrement
      let keyPath: string | undefined;
      if (typeof store.keyPath === 'string') {
        keyPath = store.keyPath;
      }
      const autoIncrement = store.autoIncrement ?? undefined;

      // Extraer índices
      const indexes: IndexConfig[] = [];
      for (let i = 0; i < store.indexNames.length; i++) {
        const idxName = store.indexNames[i];
        const idx = store.index(idxName);
        indexes.push({
          name: idx.name,
          keyPath: idx.keyPath,
          options: {
            unique: idx.unique,
            multiEntry: idx.multiEntry
          }
        });
      }

      const storeConfig: StoreConfig = {
        name: storeName,
        keyPath,
        autoIncrement,
        indexes
      };

      const result: DBInitOptions = {
        dbName,
        version: db.version,
        stores: [storeConfig]
      };

      db.close();
      resolve(result);
    };
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
}