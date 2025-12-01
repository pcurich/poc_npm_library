import { DBInitOptions }  from './utils/inspect-db-structure';
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
  _dbConfig = { ...opts };
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