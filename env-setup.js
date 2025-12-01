const Environment = require('jest-environment-jsdom').default;
module.exports = class CustomTestEnvironment extends Environment {          
    async setup() {
        await super.setup();
        // Configurar el entorno de IndexedDB simulado
        const { indexedDB, IDBKeyRange } = require('fake-indexeddb');
        this.global.indexedDB = indexedDB;
        this.global.IDBKeyRange = IDBKeyRange;
        this.global.TextDecoder = TextDecoder;
        this.global.TextEncoder = TextEncoder;
        this.global.Request = Request;
        this.global.Response = Response;
    }
}