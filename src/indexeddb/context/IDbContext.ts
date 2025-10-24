export interface IDbContext {
    open(): Promise<void>;
    getDB(): Promise<IDBDatabase>;
    runTransaction<T>(
        storeName: string,
        mode: IDBTransactionMode,
        fn: (store: IDBObjectStore) => IDBRequest | Promise<any> | void
    ): Promise<T>;
}