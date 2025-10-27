import 'fake-indexeddb/auto'; // polyfill IndexedDB para Node
import { Migration, DbContext } from '../src/indexeddb/context/DbContext';
import { HttpMockService } from '../src/indexeddb/services/HttpMockService';
import { HttpMockEntity } from '../src/indexeddb/entities/HttpMockEntity';

/**
 * Migration para crear store de mocks HTTP
 */
const initial: Migration = (db: IDBDatabase) => {
    if (!db.objectStoreNames.contains('http_mocks')) {
        const s = db.createObjectStore('http_mocks', { keyPath: '_id', autoIncrement: true });
        s.createIndex('by_url', 'url', { unique: false });
        // índice compuesto url + method
        s.createIndex('by_url_method', ['url', 'method'], { unique: false });
    }
};

async function simulateHttpMockFlow() {
    const ctx = new DbContext('poc_npm_library', 1, [initial]);
    await ctx.open();
    const svc = new HttpMockService(ctx);

    console.log('--- Crear mock ---');
    const created = await svc.createMock({
        name: 'Get user mock',
        url: '/api/users/123',
        method: 'GET',
        status: 200,
        responseBody: JSON.stringify({ id: 123, name: 'Pedro' }),
        headers: { 'content-type': 'application/json' },
        delayMs: 0,
        active: true
    } as Partial<HttpMockEntity>);
    console.log('Creado:', created);

    const id = (created as any)._id ?? (created as any).id;
    console.log('ID generado:', id);

    console.log('--- Leer mock por id ---');
    const fetched = id !== undefined ? await svc.getMockById(id) : null;
    console.log('Leído:', fetched);

    console.log('--- Actualizar mock ---');
    if (fetched) {
        fetched.responseBody = JSON.stringify({ id: 123, name: 'Pedro Updated' });
        const updated = await svc.updateMock(fetched);
        console.log('Actualizado:', updated);
    }

    console.log('--- Buscar por URL ---');
    const byUrl = await svc.findByUrl('/api/users/123', 'by_url', 'url');
    console.log('Resultados por URL:', byUrl);

    console.log('--- Buscar por URL+METHOD (índice compuesto) ---');
    const byUrlMethod = await svc.findByIndex(
        IDBKeyRange.only(['/api/users/123', 'GET']),
        'by_url_method',
        ['url', 'method']
    );
    console.log('Resultados por URL+METHOD:', byUrlMethod);

    console.log('--- Eliminar mock ---');
    if (id !== undefined) {
        const deleted = await svc.deleteMock(id);
        console.log('Eliminado:', deleted);
    }

    console.log('--- Estado final: todos los mocks ---');
    const all = await svc.getAllMocks();
    console.log('Todos:', all);
}

simulateHttpMockFlow().catch(err => {
    console.error('Error en la simulación HTTP mock:', err);
    process.exit(1);
});