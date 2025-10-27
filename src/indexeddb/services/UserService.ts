import { IUserService } from './IUserService';
import { DbContext } from '../context/DbContext';
import { UserRepository } from '../repositories/UserRepository';
import { UserEntity } from '../entities/UserEntity';

/**
 * UserService
 *
 * Servicio de alto nivel que encapsula la lógica de negocio para usuarios
 * y delega la persistencia al UserRepository.
 *
 * Responsabilidades:
 * - Orquestar operaciones CRUD sobre usuarios.
 * - Realizar validaciones mínimas y normalizaciones antes de persistir.
 * - Inyecta el DbContext para cumplir DIP y facilitar testing.
 */
export class UserService implements IUserService {
    private userRepository: UserRepository;

    /**
     * Crea una instancia del servicio.
     * @param dbContext Contexto de base de datos inyectado (abre DB / maneja transacciones).
     */
    constructor(dbContext: DbContext) {
        this.userRepository = new UserRepository(dbContext);
    }

    /**
     * Crea un nuevo usuario.
     *
     * Comportamiento:
     * - Normaliza datos mínimos.
     * - Llama a userRepository.create y devuelve la entidad creada (con clave asignada).
     *
     * @param userData Datos parciales del usuario.
     * @returns Usuario creado (con _id o id si aplica).
     * @throws Rechaza si la operación de persistencia falla.
     */
    async createUser(userData: Partial<UserEntity>): Promise<UserEntity> {
        const user = {
            ...(userData as Partial<UserEntity>)
        } as UserEntity;

        return await this.userRepository.create(user);
    }

    /**
     * Obtiene un usuario por su id.
     *
     * @param id Clave primaria del usuario.
     * @returns Usuario encontrado o null si no existe.
     * @throws Rechaza si la operación de lectura falla.
     */
    async getUserById(id: IDBValidKey): Promise<UserEntity | null> {
        return await this.userRepository.read(id);
    }

    /**
     * Actualiza un usuario existente.
     *
     * Comportamiento:
     * - Extrae la clave primaria de la entidad intentando: '_id', 'id' o el keyPath del repo.
     * - Si no encuentra la clave lanza error.
     * - Verifica existencia antes de actualizar y lanza error si no existe.
     *
     * @param user Entidad de usuario a actualizar (debe contener la clave primaria).
     * @returns Entidad actualizada.
     * @throws Error si no encuentra la clave primaria o si el usuario no existe.
     */
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

    /**
     * Elimina un usuario por id.
     *
     * Comportamiento:
     * - Comprueba existencia antes de eliminar.
     *
     * @param id Clave primaria a eliminar.
     * @returns True si se eliminó, false si no existía.
     * @throws Rechaza si la operación de persistencia falla.
     */
    async deleteUser(id: IDBValidKey): Promise<boolean> {
        const existing = await this.userRepository.read(id);
        if (existing === null || existing === undefined)
            return false;
        await this.userRepository.delete(id);
        return true;
    }

    /**
     * Devuelve todos los usuarios del store.
     *
     * @returns Lista de usuarios (vacía si no hay registros).
     * @throws Rechaza si la operación de lectura falla.
     */
    async getAllUsers(): Promise<UserEntity[]> {
        return await this.userRepository.findAll();
    }

    /**
     * Busca usuarios por email usando un índice configurable.
     *
     * Delegado a userRepository.findByIndex. Por defecto usa indexName = 'email' y
     * expectedKeyPath = 'email'.
     *
     * @param email Email a buscar.
     * @param indexName Nombre del índice a usar (por defecto 'email').
     * @param expectedKeyPath KeyPath esperado del índice (por defecto 'email').
     * @returns Lista de usuarios que coinciden.
     * @throws Error si el índice no existe o si la keyPath no coincide.
     */
    async findByEmail(email: string, indexName = 'email', expectedKeyPath = 'email'): Promise<UserEntity[]> {
        return await this.userRepository.findByIndex(IDBKeyRange.only(email), indexName, expectedKeyPath);
    }
}