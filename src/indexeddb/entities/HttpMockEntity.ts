import { BaseEntity } from "./BaseEntity";

export class HttpMockEntity extends BaseEntity {
    serviceCode: string;
    name?: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string;
    status: number;

    delayMs: number;
    headers?: Record<string, string>;
    responseBody: string;

    constructor(id: string, serviceCode: string, url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string, status: number, delayMs: number, headers?: Record<string, string>, responseBody?: string) {
        super(id);
        this.serviceCode = serviceCode;
        this.url = url;
        this.method = method;
        this.status = status;
        this.delayMs = delayMs;
        this.headers = headers;
        this.responseBody = responseBody || '';
    }
}   