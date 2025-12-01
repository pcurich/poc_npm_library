import 'fake-indexeddb/auto';
import { createIndexedDbServices } from '../indexeddb/init/indexeddb-init';
import { HttpMockEntity } from '../indexeddb/entities/http-mock-entity';

/**
 * Ejemplo actualizado que usa createIndexedDbServices(...) y la configuración
 * global obligatoria. Permite probar los cambios en HttpMockService/Repository.
 */
async function simulateHttpMockFlow() {
  // Configuración requerida por la librería (obligatoria)
  const cfg = {
    dbName: 'poc_npm_library',
    version: 1,
    stores: [
      {
        name: 'http_mocks',
        keyPath: '_id',
        autoIncrement: true,
        indexes: [
          { name: 'by_url', keyPath: 'url' },
          { name: 'by_url_method', keyPath: ['url', 'method'] }
        ]
      }
    ],
    httpOnly: false,
    clearDatabase: true // para pruebas, borra DB al iniciar
  };

  // IMPORTANT: call createIndexedDbServices so setDbConfig(opts) runs before services are created
  const { dbContext, httpMockService } = await createIndexedDbServices(cfg);

  console.log('--- Crear mock ---');
  const created = await httpMockService.createMock({
    name: 'Get user mock',
    url: '/api/users/123',
    method: 'GET',
    httpCodeResponseValue: 200,
    responseBody: JSON.stringify({ id: 123, name: 'Pedro' }),
    headers: { 'content-type': 'application/json' },
    delayMs: 0,
    active: true
  } as Partial<HttpMockEntity>);
  console.log('Creado:', created);

  const id = (created as any)._id ?? (created as any).id;
  console.log('ID generado:', id);

  console.log('--- Leer mock por id ---');
  const fetched = id !== undefined ? await httpMockService.getMockById(id) : null;
  console.log('Leído:', fetched);

  console.log('--- Estado final: todos los mocks ---');
  const all = await httpMockService.getAllMocks();
  console.log('Todos:', all);

  // Cierra contexto si tu DbContext expone close (opcional)
  try {
    await (dbContext as any).close?.();
  } catch {}
}

simulateHttpMockFlow().catch(err => {
  console.error('Error en la simulación HTTP mock:', err);
  process.exit(1);
});