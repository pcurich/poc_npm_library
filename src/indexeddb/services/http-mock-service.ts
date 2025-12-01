import { DbContext } from "../context/db-context";
import { HttpMockEntity } from "../entities/http-mock-entity";
import { HttpMockRepository } from "../repositories/http-mock-repository";
import { IHttpMockService } from "./i-http-mock-service";
import { getDbConfig } from "../config";

export class HttpMockService implements IHttpMockService {
  private repos = new Map<string, HttpMockRepository>();
  private defaultStore: string;
  private dbContext: DbContext;

  constructor(dbContext: DbContext, storeName?: string, keyPath?: string) {
    this.dbContext = dbContext;
    const cfg = getDbConfig();

    // if caller provided a specific store, use only that; otherwise register all configured stores
    if (storeName) {
      this.defaultStore = storeName;
      const storeCfg = cfg.stores.find(s => s.name === storeName);
      const kp = keyPath ?? storeCfg?.keyPath;
      this.repos.set(storeName, new HttpMockRepository(this.dbContext, storeName, kp));
    } else {
      this.defaultStore = cfg.stores[0].name;
      for (const s of cfg.stores) {
        const kp = s.keyPath;
        this.repos.set(s.name, new HttpMockRepository(dbContext, s.name, kp));
      }
    }
  }

  private getRepo(storeName?: string): HttpMockRepository {
    const name = storeName ?? this.defaultStore;
    const repo = this.repos.get(name);
    if (!repo) throw new Error(`HttpMockService: repository for store "${name}" is not registered`);
    return repo;
  }

  async createMock(data: Partial<HttpMockEntity>, storeName?: string): Promise<HttpMockEntity> {
    const repo = this.getRepo(storeName);
    const entity = { ...(data as Partial<HttpMockEntity>) } as HttpMockEntity;
    return await repo.create(entity);
  }

  async getMockById(id: IDBValidKey, storeName?: string): Promise<HttpMockEntity | null> {
    return await this.getRepo(storeName).read(id);
  }

  async updateMock(entity: HttpMockEntity, storeName?: string): Promise<HttpMockEntity> {
    const repo = this.getRepo(storeName);

    const candidateKeys = ['_id', 'id'];
    let id: IDBValidKey | undefined;

    for (const k of candidateKeys) {
      if ((entity as any)[k] !== undefined) {
        id = (entity as any)[k] as IDBValidKey;
        break;
      }
    }

    if (id === undefined) {
      throw new Error('Cannot update mock: primary key not found on the entity');
    }

    const existing = await repo.read(id);
    if (existing === null || existing === undefined) {
      throw new Error('Mock not found');
    }

    try {
      entity.updateTimestamp();
    } catch {}

    return await repo.update(entity);
  }

  async deleteMock(id: IDBValidKey, storeName?: string): Promise<boolean> {
    const repo = this.getRepo(storeName);
    const existing = await repo.read(id);
    if (existing === null || existing === undefined) return false;
    await repo.delete(id);
    return true;
  }

  async getAllMocks(storeName?: string): Promise<HttpMockEntity[]> {
    if (storeName) {
      const repo = this.repos.get(storeName);
      if (!repo) return [];
      return await repo.findAll();
    }
    // aggregate from all repos
    const all: HttpMockEntity[] = [];
    for (const repo of this.repos.values()) {
      const items = await repo.findAll();
      all.push(...items);
    }
    return all;
  }

  private getIndexNameForKeyPathForStore(storeName: string, preferredKey: string, fallbackName?: string) {
    const cfg = getDbConfig();
    const storeCfg = cfg.stores.find(s => s.name === storeName);
    if (!storeCfg || !storeCfg.indexes) return fallbackName ?? preferredKey;
    const idx = storeCfg.indexes.find(i => {
      if (typeof i.keyPath === 'string') return i.keyPath === preferredKey;
      if (Array.isArray(i.keyPath)) return i.keyPath.includes(preferredKey);
      return false;
    });
    return idx?.name ?? (storeCfg.indexes[0]?.name ?? (fallbackName ?? preferredKey));
  }

  async findByUrl(url: string, indexName?: string, expectedKeyPath: string | string[] = 'url', storeName?: string): Promise<HttpMockEntity[]> {
    const target = storeName ?? this.defaultStore;
    const idx = indexName ?? this.getIndexNameForKeyPathForStore(target, 'url', 'url');
    return await this.getRepo(target).findByIndex(IDBKeyRange.only(url), idx, expectedKeyPath);
  }

  async findByServiceCode(serviceCode: string, indexName?: string, expectedKeyPath: string | string[] = 'serviceCode', storeName?: string): Promise<HttpMockEntity[]> {
    const target = storeName ?? this.defaultStore;
    const idx = indexName ?? this.getIndexNameForKeyPathForStore(target, 'serviceCode', 'serviceCode');
    return await this.getRepo(target).findByIndex(IDBKeyRange.only(serviceCode), idx, expectedKeyPath);
  }

  async findByIndex(value: IDBValidKey | IDBKeyRange, indexName?: string, expectedKeyPath?: string | string[], storeName?: string): Promise<HttpMockEntity[]> {
    const target = storeName ?? this.defaultStore;
    if (Array.isArray(value)) {
      return await this.getRepo(target).findByIndex(IDBKeyRange.only(value as unknown as IDBValidKey), indexName ?? undefined, expectedKeyPath);
    }
    return await this.getRepo(target).findByIndex(value, indexName ?? undefined, expectedKeyPath);
  }

  async getResponseBodyAs<T>(id: IDBValidKey, storeName?: string): Promise<T | null> {
    const repo = this.getRepo(storeName);
    const entity = await repo.read(id);
    if (!entity) return null;

    const raw = (entity as any).responseBody;
    if (raw === undefined || raw === null) return null;

    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    }

    return raw as unknown as T;
  }
}