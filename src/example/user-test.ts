// ...existing code...
import 'fake-indexeddb/auto'; // polyfill IndexedDB para Node
import { Migration, DbContext } from '../indexeddb/context/db-context';
import { HttpMockService } from '../indexeddb/services/http-mock-service';

const initial: Migration = (db: IDBDatabase) => {
    if (!db.objectStoreNames.contains('users')) {
        const s = db.createObjectStore('users', { keyPath: '_id', autoIncrement: true });
        s.createIndex('by_email', 'email', { unique: true });
    }
};

async function simulateWebApp() {
    const ctx = new DbContext('poc_npm_library', 1, [initial]);
    await ctx.open();
    const mockService = new HttpMockService(ctx);

    console.log('--- Simulación: crear mock HTTP ---');
    const created = await mockService.createMock({
        serviceCode: 'USER_LOGIN',
        url: '/login',
        method: 'POST',
        responseBody: JSON.stringify({ token: 'abc123' }),
        httpCodeResponseValue: 200
    });
    console.log('Mock creado:', created);

    const id = (created as any)._id ?? (created as any).id;
    console.log('ID generado:', id);

    console.log('--- Simulación: leer mock por id ---');
    const fetched = id !== undefined ? await mockService.getMockById(id) : null;
    console.log('Mock leído:', fetched);

    console.log('--- Simulación: actualizar mock ---');
    if (fetched) {
        fetched.responseBody = JSON.stringify({ token: 'xyz789' });
        const updated = await mockService.updateMock(fetched);
        console.log('Mock actualizado:', updated);
    }

    console.log('--- Simulación: buscar por serviceCode ---');
    const byServiceCode = await mockService.findByServiceCode('USER_LOGIN');
    console.log('Resultados por serviceCode:', byServiceCode);

    console.log('--- Simulación: eliminar mock ---');
    if (id !== undefined) {
        await mockService.deleteMock(id);
        console.log('Mock eliminado:', id);
    }

    console.log('--- Estado final: todos los mocks ---');
    const all = await mockService.getAllMocks();
    console.log('Todos los mocks:', all);

    // Cierra la conexión al finalizar
    await ctx.close();
}

simulateWebApp().catch(err => {
    console.error('Error en la simulación:', err);
    process.exit(1);
});
// ...existing code...