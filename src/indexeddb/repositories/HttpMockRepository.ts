import { DbContext } from "../context/DbContext";
import { HttpMockEntity } from "../entities/HttpMockEntity";
import BaseRepository from "./BaseRepository";
import { IRepository } from "./IRepository";

export class HttpMockRepository extends BaseRepository<HttpMockEntity> implements IRepository<HttpMockEntity> {
    constructor(db: DbContext) {
        super(db, 'httpMocks', '_id');
    }

    /**
     * Buscar codigo del servicio por un índice configurable.
     * @param value valor o keyRange para la búsqueda (ej: serviceCode o IDBKeyRange)
     * @param indexName nombre del índice definido en la migration (por defecto 'serviceCode')
     * @param expectedKeyPath opcional: keyPath esperado para el índice (ej: 'serviceCode' o ['a','b'])
     */
    async findByIndex(
        value: IDBValidKey | IDBKeyRange,
        indexName = 'serviceCode',
        expectedKeyPath?: string | string[]
    ): Promise<HttpMockEntity[]> {
        return this.dbContext.runTransaction<HttpMockEntity[]>(this.storeName, 'readonly', (store) => {
            if (!store.indexNames.contains(indexName)) {
                throw new Error(`Índice "${indexName}" no existe en el store "${this.storeName}"`);
            }

            const idx = store.index(indexName);

            if (expectedKeyPath !== undefined) {
                const actual = idx.keyPath;
                const normalize = (kp: any) => (Array.isArray(kp) ? kp : kp);
                const actualJson = JSON.stringify(normalize(actual));
                const expectedJson = JSON.stringify(Array.isArray(expectedKeyPath) ? expectedKeyPath : expectedKeyPath);
                if (actualJson !== expectedJson) {
                    throw new Error(
                        `KeyPath del índice "${indexName}" no coincide. Esperado: ${expectedJson}, actual: ${actualJson}`
                    );
                }
            }

            return idx.getAll(value as any);
        });
    }
}