import { setDbConfig, getDbConfig, isDbConfigInitialized, clearDbConfig } from './config';
import { DBInitOptions } from './utils/inspect-db-structure';

describe('config', () => {
  const validConfig: DBInitOptions = {
    dbName: 'test-db',
    version: 1,
    stores: [{ name: 'store1' }]
  };

  afterEach(() => {
    clearDbConfig();
  });

  it('#Should setDbConfig initialize config with valid options', () => {
    setDbConfig(validConfig);
    expect(isDbConfigInitialized()).toBe(true);
  });

  it('#Should setDbConfig throw if options is not provided', () => {
    expect(() => setDbConfig(undefined as any)).toThrow('DB init options are required');
  });

  it('#Should setDbConfig throw if dbName is missing', () => {
    const config = { ...validConfig, dbName: undefined } as any;
    expect(() => setDbConfig(config)).toThrow('dbName is required and must be a string');
  });

  it('#Should setDbConfig throw if dbName is not a string', () => {
    const config = { ...validConfig, dbName: 123 } as any;
    expect(() => setDbConfig(config)).toThrow('dbName is required and must be a string');
  });

  it('#Should setDbConfig throw if version is missing', () => {
    const config = { ...validConfig, version: undefined } as any;
    expect(() => setDbConfig(config)).toThrow('version is required and must be a positive integer');
  });

  it('#Should setDbConfig throw if version is not a positive integer', () => {
    const config = { ...validConfig, version: 0 };
    expect(() => setDbConfig(config)).toThrow('version is required and must be a positive integer');
  });

  it('#Should setDbConfig throw if stores is missing', () => {
    const config = { ...validConfig, stores: undefined } as any;
    expect(() => setDbConfig(config)).toThrow('stores is required and must be a non-empty array');
  });

  it('#Should setDbConfig throw if stores is empty', () => {
    const config = { ...validConfig, stores: [] };
    expect(() => setDbConfig(config)).toThrow('stores is required and must be a non-empty array');
  });

  it('#Should getDbConfig return config after setDbConfig', () => {
    setDbConfig(validConfig);
    expect(getDbConfig()).toEqual(validConfig);
  });

  it('#Should getDbConfig throw if config not initialized', () => {
    expect(() => getDbConfig()).toThrow('Database configuration not initialized. Call setDbConfig(...) first.');
  });

  it('#Should isDbConfigInitialized return false if not initialized', () => {
    expect(isDbConfigInitialized()).toBe(false);
  });

  it('#Should clearDbConfig set config to null', () => {
    setDbConfig(validConfig);
    clearDbConfig();
    expect(isDbConfigInitialized()).toBe(false);
  });
});