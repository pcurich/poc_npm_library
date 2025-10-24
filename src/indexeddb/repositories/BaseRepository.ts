import { IDbContext } from "../context/IDbContext";
import { IRepository } from "./IRepository";

export default abstract class BaseRepository<T> implements IRepository<T> {
    protected keyPath?: string;

    constructor(protected dbContext: IDbContext, protected storeName: string, keyPath?: string) {
        this.keyPath = keyPath;
    }

    async create(entity: T): Promise<T> {
        return this.dbContext.runTransaction<T>(this.storeName, 'readwrite', (store) => store.add(entity));
    }

    async read(id: IDBValidKey): Promise<T | null> {
        return this.dbContext.runTransaction<T | null>(this.storeName, 'readonly', (store) => store.get(id));
    }

    async update(entity: T): Promise<T> {
        return this.dbContext.runTransaction<T>(this.storeName, 'readwrite', (store) => store.put(entity));
    }

    async delete(id: IDBValidKey): Promise<void> {
        return this.dbContext.runTransaction<void>(this.storeName, 'readwrite', (store) => store.delete(id));
    }

    async findAll(): Promise<T[]> {
        return this.dbContext.runTransaction<T[]>(this.storeName, 'readonly', (store) => store.getAll());
    }
}
