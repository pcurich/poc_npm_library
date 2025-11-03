import { IDbContext } from "../context/IDbContext";
import { IRepository } from "./IRepository";

/**
 * BaseRepository<T>
 *
 * Repositorio genérico para operaciones CRUD sobre un objectStore de IndexedDB.
 *
 * Responsabilidades:
 * - Ejecutar operaciones usando la abstracción IDbContext (inyección por constructor).
 * - Gestionar la asignación de la clave generada por store.add / store.put al entity
 *   usando keyPath proporcionado en el constructor o inferido ('id' | '_id').
 *
 * Diseño:
 * - SRP: solo manipula un store concreto.
 * - DIP: depende de IDbContext (no de IDBDatabase directamente).
 * - OCP: métodos pueden ser usados/extendidos por repositorios específicos.
 *
 * Notas:
 * - La resolución/normalización de errores y la promisificación de IDBRequest la debe manejar IDbContext.
 *
 * @template T Tipo de la entidad almacenada en el objectStore.
 */
export default abstract class BaseRepository<T> implements IRepository<T> {
    protected keyPath?: string;

    constructor(protected dbContext: IDbContext, protected storeName: string, keyPath?: string) {
        this.keyPath = keyPath;
    }

    /**
     * Crea una nueva entidad en el store.
     *
     * Comportamiento:
     * - Ejecuta store.add(entity) dentro de una transacción 'readwrite'.
     * - Si IndexedDB devuelve una clave (IDBValidKey), intenta asignarla a la entidad
     *   usando this.keyPath o inferiendo 'id'|'_id'.
     *
     * @param {T} entity Entidad a crear.
     * @returns {Promise<T>} La entidad creada (con clave asignada si aplica).
     * @throws Rechaza la promesa si la transacción o la request falla.
     */
    async create(entity: T): Promise<T> {
        const key = await this.dbContext.runTransaction<IDBValidKey>(this.storeName, 'readwrite', (store) => store.add(entity));
        if (key !== undefined && key !== null) {
            const kp = this.keyPath ?? ((entity as any).id !== undefined ? 'id' : '_id');
            try {
                (entity as any)[kp] = key;
            } catch {
                // no interrumpir si no es asignable; el usuario recibirá el entity original
            }
        }
        return entity;
    }

    /**
     * Lee una entidad por su id.
     *
     * @param {IDBValidKey} id Clave primaria a buscar.
     * @returns {Promise<T|null>} La entidad encontrada o null si no existe.
     * @throws Rechaza la promesa si la transacción o la request falla.
     */
    async read(id: IDBValidKey): Promise<T | null> {
        return this.dbContext.runTransaction<T | null>(this.storeName, 'readonly', (store) => store.get(id));
    }

    /**
     * Actualiza (o inserta) una entidad en el store.
     *
     * Comportamiento:
     * - Ejecuta store.put(entity) dentro de una transacción 'readwrite'.
     * - Si IndexedDB devuelve una clave (IDBValidKey), intenta asignarla a la entidad
     *   usando this.keyPath o inferido ('id'|'_id').
     *
     * @param {T} entity Entidad a actualizar.
     * @returns {Promise<T>} La entidad actualizada (con clave asignada si aplica).
     * @throws Rechaza la promesa si la transacción o la request falla.
     */
    async update(entity: T): Promise<T> {
        const key = await this.dbContext.runTransaction<IDBValidKey>(this.storeName, 'readwrite', (store) => store.put(entity));

        if (key !== undefined && key !== null) {
            const kp = this.keyPath ?? ((entity as any).id !== undefined ? 'id' : '_id');
            try {
                (entity as any)[kp] = key;
            } catch(_err) {
                window.console.warn(_err);
                // no interrumpir si no es asignable
            }
        }

        return entity;
    }

    /**
     * Elimina una entidad por su id.
     *
     * @param {IDBValidKey} id Clave primaria a eliminar.
     * @returns {Promise<void>}
     * @throws Rechaza la promesa si la transacción o la request falla.
     */
    async delete(id: IDBValidKey): Promise<void> {
        return this.dbContext.runTransaction<void>(this.storeName, 'readwrite', (store) => store.delete(id));
    }

    /**
     * Obtiene todas las entidades del store.
     *
     * @returns {Promise<T[]>} Array con todas las entidades (vacío si no hay registros).
     * @throws Rechaza la promesa si la transacción o la request falla.
     */
    async findAll(): Promise<T[]> {
        return this.dbContext.runTransaction<T[]>(this.storeName, 'readonly', (store) => store.getAll());
    }
}