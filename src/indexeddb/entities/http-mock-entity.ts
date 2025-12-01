import { BaseEntity } from "./base-entity";

export class HttpMockEntity extends BaseEntity {
    name: string;
    serviceCode: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE' | string;
    httpCodeResponseValue: number;
    delayMs: number;
    headers?: Record<string, string>;
    responseBody: string;

    /**
     * Crea una nueva instancia a partir de un objeto de inicialización parcial.
     * Se asignan valores por defecto cuando faltan propiedades en el objeto.
     */
    constructor(init: Partial<HttpMockEntity> = {}) {
        // BaseEntity puede aceptar id o _id; intentar ambos
        // usamos (init as any) para no depender de la forma exacta de BaseEntity
        super((init as any).id ?? (init as any)._id ?? undefined);
        this.name = init.name ?? '';
        this.serviceCode = init.serviceCode ?? '';
        this.url = init.url ?? '';
        this.method = init.method ?? 'GET';
        this.httpCodeResponseValue = init.httpCodeResponseValue ?? 200;
        this.delayMs = init.delayMs ?? 0;
        this.headers = init.headers;
        this.responseBody = init.responseBody ?? '';
    }
}   