import { IUserService } from './IUserService';
import { DbContext } from '../context/DbContext';
import { UserRepository } from '../repositories/UserRepository';
import { UserEntity } from '../entities/UserEntity';

export class UserService implements IUserService {
    private userRepository: UserRepository;

    // Inyectar el contexto de DB para facilitar testing y cumplimiento DIP
    constructor(dbContext: DbContext) {
        this.userRepository = new UserRepository(dbContext);
    }

    async createUser(userData: Partial<UserEntity>): Promise<UserEntity> {
        const user = {
            // mapear propiedades mínimas; ajusta según la forma real de UserEntity
            ...(userData as Partial<UserEntity>)
        } as UserEntity;

        // crea y devuelve la entidad resultante
        return await this.userRepository.create(user);
    }

    async getUserById(id: IDBValidKey): Promise<UserEntity | null> {
        return await this.userRepository.read(id);
    }

    async updateUser(user: UserEntity): Promise<UserEntity> {
        const candidateKeys = ['_id', 'id'];
        let id: IDBValidKey | undefined;

        for (const k of candidateKeys) {
            if ((user as any)[k] !== undefined) {
                id = (user as any)[k] as IDBValidKey;
                break;
            }
        }

        // si no está en los nombres comunes, intentar leer keyPath del repositorio (acceso via any)
        if (id === undefined) {
            const repoKeyPath = (this.userRepository as any).keyPath as (string | number | undefined);
            if (repoKeyPath && (user as any)[repoKeyPath] !== undefined) {
                id = (user as any)[repoKeyPath] as IDBValidKey;
            }
        }

        if (id === undefined) {
            throw new Error('Cannot update user: primary key not found on the entity');
        }

        const existing = await this.userRepository.read(id);
        if (existing === null || existing === undefined) {
            throw new Error('User not found');
        }

        return await this.userRepository.update(user);
    }

    async deleteUser(id: IDBValidKey): Promise<boolean> {
        const existing = await this.userRepository.read(id);
        if (existing === null || existing === undefined)
            return false;
        await this.userRepository.delete(id);
        return true;
    }

    async getAllUsers(): Promise<UserEntity[]> {
        return await this.userRepository.findAll();
    }

    async findByEmail(email: string): Promise<UserEntity[]> {
        return await this.userRepository.findByEmail(email);
    }
}