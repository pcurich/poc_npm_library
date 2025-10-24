import { DbContext } from '../context/DbContext';
import { UserEntity } from '../entities/UserEntity';
import BaseRepository from './BaseRepository';
import { IRepository } from './IRepository';

export class UserRepository extends BaseRepository<UserEntity> implements IRepository<UserEntity> {
    constructor(db: DbContext) {
        super(db, 'users', '_id');
    }

    async findByEmail(email: string): Promise<UserEntity[]> {
        return this.dbContext.runTransaction<UserEntity[]>(this.storeName, 'readonly', (store) => {
            // verifica existencia del índice para evitar excepción si no existe
            if (!store.indexNames.contains('email')) {
                throw new Error(`Índice "email" no existe en el store "${this.storeName}"`);
            }
            return store.index('email').getAll(IDBKeyRange.only(email));
        });
    }
}