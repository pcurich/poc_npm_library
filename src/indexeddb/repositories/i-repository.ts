export interface IRepository<T> {
    create(entity: T): Promise<T>;
    read(id: string): Promise<T | null>;
    update(entity: T): Promise<T>;
    delete(id: string): Promise<void>;
    findAll(): Promise<T[]>;
}
