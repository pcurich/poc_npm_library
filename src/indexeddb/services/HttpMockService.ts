import { DbContext } from "../context/DbContext";
import { HttpMockEntity } from "../entities/HttpMockEntity";
import { HttpMockRepository } from "../repositories/HttpMockRepository";
import { IHttpMockService } from "./IHttpMockService";

/**
 * HttpMockService
 *
 * Servicio que orquesta la persistencia y lógica ligera para mocks HTTP.
 * Inyecta DbContext (DIP) y delega la persistencia a HttpMockRepository.
 */
export class HttpMockService implements IHttpMockService {
    private repo: HttpMockRepository;

    constructor(dbContext: DbContext) {
        this.repo = new HttpMockRepository(dbContext);
    }

    /**
     * Crea un nuevo mock HTTP.
     * Devuelve la entidad creada (con _id/id asignado si aplica).
     */
    async createMock(data: Partial<HttpMockEntity>): Promise<HttpMockEntity> {
        debugger;
        const entity = { ...(data as Partial<HttpMockEntity>) } as HttpMockEntity;
        
        return await this.repo.create(entity);
    }

    /**
     * Obtiene un mock por su id.
     */
    async getMockById(id: IDBValidKey): Promise<HttpMockEntity | null> {
        return await this.repo.read(id);
    }

    /**
     * Actualiza un mock existente.
     * Intenta extraer la clave primaria (_id | id | repo.keyPath). Valida existencia antes de actualizar.
     */
    async updateMock(entity: HttpMockEntity): Promise<HttpMockEntity> {
        const candidateKeys = ['_id', 'id'];
        let id: IDBValidKey | undefined;

        for (const k of candidateKeys) {
            if ((entity as any)[k] !== undefined) {
                id = (entity as any)[k] as IDBValidKey;
                break;
            }
        }

        if (id === undefined) {
            const repoKeyPath = (this.repo as any).keyPath as (string | undefined);
            if (repoKeyPath && (entity as any)[repoKeyPath] !== undefined) {
                id = (entity as any)[repoKeyPath] as IDBValidKey;
            }
        }

        if (id === undefined) {
            throw new Error('Cannot update mock: primary key not found on the entity');
        }

        const existing = await this.repo.read(id);
        if (existing === null || existing === undefined) {
            throw new Error('Mock not found');
        }

        try {
            entity.updateTimestamp();
        } catch {
        }

        return await this.repo.update(entity);
    }

    /**
     * Elimina un mock por id. Devuelve true si fue eliminado, false si no existía.
     */
    async deleteMock(id: IDBValidKey): Promise<boolean> {
        const existing = await this.repo.read(id);
        if (existing === null || existing === undefined) return false;
        await this.repo.delete(id);
        return true;
    }

    /**
     * Obtiene todos los mocks.
     */
    async getAllMocks(): Promise<HttpMockEntity[]> {
        return await this.repo.findAll();
    }

    /**
     * Busca mocks por URL usando un índice configurable.
     * Por defecto indexName = 'url' y expectedKeyPath = 'url'.
     */
    async findByUrl(url: string, indexName = 'url', expectedKeyPath: string | string[] = 'url'): Promise<HttpMockEntity[]> {
        return await this.repo.findByIndex(IDBKeyRange.only(url), indexName, expectedKeyPath);
    }

    /**
     * Busca mocks por serviceCode usando un índice configurable.
     *
     * Por defecto intenta usar indexName = 'serviceCode' y expectedKeyPath = 'serviceCode'.
     *
     * @param serviceCode Valor del serviceCode a buscar.
     * @param indexName Nombre del índice en el objectStore (por defecto 'serviceCode').
     * @param expectedKeyPath KeyPath esperado del índice (por defecto 'serviceCode').
     */
    async findByServiceCode(
        serviceCode: string,
        indexName = 'serviceCode',
        expectedKeyPath: string | string[] = 'serviceCode'
    ): Promise<HttpMockEntity[]> {
        return await this.repo.findByIndex(IDBKeyRange.only(serviceCode), indexName, expectedKeyPath);
    }

    /**
     * Método genérico que delega a HttpMockRepository.findByIndex.
     * Acepta:
     * - value: IDBValidKey | IDBKeyRange (ej: IDBKeyRange.only(['/api', 'GET']) o una clave simple)
     * - indexName: nombre del índice (ej: 'by_url_method')
     * - expectedKeyPath: keyPath esperado para validación (ej: ['url','method'])
     *
     * Permite buscar usando índices compuestos pasando un array como clave dentro de IDBKeyRange.only(...)
     */
    async findByIndex(
        value: IDBValidKey | IDBKeyRange,
        indexName = 'by_url',
        expectedKeyPath?: string | string[]
    ): Promise<HttpMockEntity[]> {
        // Si el usuario pasó una clave compuesta como array (no envuelta en IDBKeyRange),
        // podemos aceptar también array directo y envolverlo en IDBKeyRange.only.
        if (Array.isArray(value)) {
            return await this.repo.findByIndex(IDBKeyRange.only(value as unknown as IDBValidKey), indexName, expectedKeyPath);
        }

        // Delega en el repositorio; el repo valida existencia del índice y keyPath si se pasa expectedKeyPath.
        return await this.repo.findByIndex(value, indexName, expectedKeyPath);
    }

    /**
     * Obtiene el responseBody de un HttpMockEntity por id y lo devuelve casteado al tipo genérico T.
     *
     * Comportamiento:
     * - Busca la entidad por id.
     * - Si responseBody es string intenta parsearlo como JSON.
     * - Si el parse falla o responseBody no es string, lo retorna casteado a T.
     *
     * @param id Id del mock.
     * @returns El responseBody casteado a T, o null si no existe la entidad o el responseBody es null/undefined.
     */
    async getResponseBodyAs<T>(id: IDBValidKey): Promise<T | null> {
        const entity = await this.repo.read(id);
        if (!entity) return null;

        const raw = (entity as any).responseBody;
        if (raw === undefined || raw === null) return null;

        if (typeof raw === 'string') {
            try {
                return JSON.parse(raw) as T;
            } catch {
                // si no es JSON válido, devolver el string como T
                return raw as unknown as T;
            }
        }

        // si no es string (ya es objeto), devolver casteado
        return raw as unknown as T;
    }

}