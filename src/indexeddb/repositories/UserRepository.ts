import { DbContext } from '../context/DbContext';
import { UserEntity } from '../entities/UserEntity';
import BaseRepository from './BaseRepository';
import { IRepository } from './IRepository';

export class UserRepository extends BaseRepository<UserEntity> implements IRepository<UserEntity> {
    constructor(db: DbContext) {
        super(db, 'users', '_id');
    }

    /**
     * Buscar usuarios por un índice configurable.
     * @param value valor o keyRange para la búsqueda (ej: email o IDBKeyRange)
     * @param indexName nombre del índice definido en la migration (por defecto 'email')
     * @param expectedKeyPath opcional: keyPath esperado para el índice (ej: 'email' o ['a','b'])
     */
    async findByIndex(
        value: IDBValidKey | IDBKeyRange,
        indexName = 'email',
        expectedKeyPath?: string | string[]
    ): Promise<UserEntity[]> {
        return this.dbContext.runTransaction<UserEntity[]>(this.storeName, 'readonly', (store) => {
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