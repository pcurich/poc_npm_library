import { BaseEntity } from "./BaseEntity";

export class HttpMockEntity extends BaseEntity {
    name?: string;
    serviceCode: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string;
    httpCodeResponseValue: number;

    delayMs: number;
    headers?: Record<string, string>;
    responseBody: string;

    constructor(id: string, serviceCode: string, url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string, httpCodeResponseValue: number, delayMs: number, headers?: Record<string, string>, responseBody?: string) {
        super(id);
        this.serviceCode = serviceCode;
        this.url = url;
        this.method = method;
        this.httpCodeResponseValue = httpCodeResponseValue;
        this.delayMs = delayMs;
        this.headers = headers;
        this.responseBody = responseBody || '';
    }
}   