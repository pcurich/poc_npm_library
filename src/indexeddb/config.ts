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
  httpOnly?: boolean;
  clearDatabase?: boolean;
};

let _dbConfig: DBInitOptions | null = null;

export function setDbConfig(opts: DBInitOptions) {
  if (!opts || typeof opts !== 'object') {
    throw new Error('DB init options are required');
  }
  if (!opts.dbName || typeof opts.dbName !== 'string') {
    throw new Error('dbName is required and must be a string');
  }
  if (!Number.isInteger(opts.version) || opts.version <= 0) {
    throw new Error('version is required and must be a positive integer');
  }
  if (!Array.isArray(opts.stores) || opts.stores.length === 0) {
    throw new Error('stores is required and must be a non-empty array');
  }
  _dbConfig = { ...opts, httpOnly: !!opts.httpOnly, clearDatabase: !!opts.clearDatabase };
}

export function getDbConfig(): DBInitOptions {
  if (!_dbConfig) throw new Error('Database configuration not initialized. Call setDbConfig(...) first.');
  return _dbConfig;
}

export function isDbConfigInitialized(): boolean {
  return _dbConfig !== null;
}

export function clearDbConfig() {
  _dbConfig = null;
}

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