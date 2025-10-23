import { StoreInterface } from "../interface/store.interface";

export class SessionStorage implements StoreInterface {
    getItem(key: string): string | null {
        return window.sessionStorage.getItem(key);
    }
    setItem(key: string, value: string): void {
        window.sessionStorage.setItem(key, value);
    }
    removeItem(key: string): void {
        window.sessionStorage.removeItem(key);
    }
    clear(): void {
        window.sessionStorage.clear();
    }
}