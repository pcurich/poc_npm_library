import { StoreInterface } from "../interface/store.interface";

export class MemoryStorage implements StoreInterface {
    private storage: { [key: string]: string } = {};
    
    getItem(key: string): string | null {
        return this.storage.hasOwnProperty(key) ? this.storage[key] : null;
    }
    setItem(key: string, value: string): void {
        this.storage[key] = value;
    }
    removeItem(key: string): void {
        delete this.storage[key];
    }
    clear(): void {
        this.storage = {};
    }
}