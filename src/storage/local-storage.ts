import { StoreInterface } from '../interface/store.interface';

export class LocalStorage implements StoreInterface {       
    getItem(key: string): string | null {   
        return window.localStorage.getItem(key);
    }
    setItem(key: string, value: string): void {
        window.localStorage.setItem(key, value);
    }       
    removeItem(key: string): void {
        window.localStorage.removeItem(key);
    }
    clear(): void {
        window.localStorage.clear();
    }
}