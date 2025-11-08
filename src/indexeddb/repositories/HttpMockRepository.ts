import { DbContext } from "../context/DbContext";
import { HttpMockEntity } from "../entities/HttpMockEntity";
import BaseRepository from "./BaseRepository";
import { IRepository } from "./IRepository";
import { getDbConfig } from "../config";

export class HttpMockRepository extends BaseRepository<HttpMockEntity> implements IRepository<HttpMockEntity> {
    private storeCfg?: { name: string; keyPath?: string; indexes?: Array<{ name: string; keyPath: string | string[] }> };

    constructor(db: DbContext, storeName?: string, keyPath?: string) {
        // Resolve store and keyPath from global configuration (fail-fast)
        const cfg = getDbConfig();
        const resolvedStore = storeName ?? cfg.stores[0]?.name;
        if (!resolvedStore) {
            throw new Error('HttpMockRepository: no storeName provided and no stores configured');
        }

        const found = cfg.stores.find(s => s.name === resolvedStore) ?? cfg.stores[0];

        const resolvedKeyPath = keyPath ?? found?.keyPath;
        if (!resolvedKeyPath) {
            throw new Error(`HttpMockRepository: keyPath not defined for store "${resolvedStore}". Provide keyPath or configure it in DBInitOptions.`);
        }

        super(db, resolvedStore, resolvedKeyPath);
        this.storeCfg = found;
    }

    private resolveIndexName(indexName?: string, expectedKeyPath?: string | string[]) {
        if (indexName) return indexName;

        const indexes = this.storeCfg?.indexes;
        if (!indexes || indexes.length === 0) {
            throw new Error(`HttpMockRepository: no index specified and no indexes configured for store "${this.storeName}"`);
        }

        if (expectedKeyPath !== undefined) {
            const normalize = (kp: any) => (Array.isArray(kp) ? kp : kp);
            const expectedJson = JSON.stringify(Array.isArray(expectedKeyPath) ? expectedKeyPath : expectedKeyPath);
            const match = indexes.find(i => {
                const actual = normalize(i.keyPath);
                return JSON.stringify(actual) === expectedJson;
            });
            if (match) return match.name;
        }

        // fallback to first configured index name
        return indexes[0].name;
    }

    /**
     * Buscar codigo del servicio por un índice configurable.
     * @param value valor o keyRange para la búsqueda (ej: serviceCode o IDBKeyRange)
     * @param indexName nombre del índice (opcional — se resuelve desde la configuración)
     * @param expectedKeyPath opcional: keyPath esperado para el índice (ej: 'serviceCode' o ['a','b'])
     */
    async findByIndex(
        value: IDBValidKey | IDBKeyRange,
        indexName?: string,
        expectedKeyPath?: string | string[]
    ): Promise<HttpMockEntity[]> {
        const idxName = this.resolveIndexName(indexName, expectedKeyPath);

        return this.dbContext.runTransaction<HttpMockEntity[]>(this.storeName, 'readonly', (store) => {
            if (!store.indexNames.contains(idxName)) {
                throw new Error(`Índice "${idxName}" no existe en el store "${this.storeName}"`);
            }

            const idx = store.index(idxName);

            if (expectedKeyPath !== undefined) {
                const actual = idx.keyPath;
                const normalize = (kp: any) => (Array.isArray(kp) ? kp : kp);
                const actualJson = JSON.stringify(normalize(actual));
                const expectedJson = JSON.stringify(Array.isArray(expectedKeyPath) ? expectedKeyPath : expectedKeyPath);
                if (actualJson !== expectedJson) {
                    throw new Error(
                        `KeyPath del índice "${idxName}" no coincide. Esperado: ${expectedJson}, actual: ${actualJson}`
                    );
                }
            }

            return idx.getAll(value as any);
        });
    }
}