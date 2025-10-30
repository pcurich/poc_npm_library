import { HttpMockEntity } from "../entities/HttpMockEntity";

/**
 * IHttpMockService
 *
 * Interfaz mínima para el servicio de mocks HTTP.
 */
export interface IHttpMockService {
    createMock(data: Partial<HttpMockEntity>): Promise<HttpMockEntity>;
    getMockById(id: IDBValidKey): Promise<HttpMockEntity | null>;
    updateMock(entity: HttpMockEntity): Promise<HttpMockEntity>;
    deleteMock(id: IDBValidKey): Promise<boolean>;
    getAllMocks(): Promise<HttpMockEntity[]>;
    findByUrl(url: string, indexName?: string, expectedKeyPath?: string | string[]): Promise<HttpMockEntity[]>;
    findByServiceCode(serviceCode: string, indexName?: string, expectedKeyPath?: string | string[]): Promise<HttpMockEntity[]>;
    findByIndex(value: IDBValidKey | IDBKeyRange, indexName?: string, expectedKeyPath?: string | string[]): Promise<HttpMockEntity[]>;
    getResponseBodyAs<T>(id: IDBValidKey): Promise<T | null>;
}

