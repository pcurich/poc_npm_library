import 'fake-indexeddb/auto';
import {
  createIndexedDbServices,
  getIndexedDbConfig,
  createDefaultIndexedDb
} from '../indexeddb/init/indexeddb-init';
import { DBInitOptions } from '../indexeddb/utils/inspect-db-structure';

async function escenarioInicializacionPorDefecto() {
  console.log('--- Escenario 1: Inicialización por defecto ---');
  const { dbContext, httpMockService } = await createIndexedDbServices();
  console.log('DbContext:', dbContext ? 'OK' : 'FAIL');
  console.log('HttpMockService:', httpMockService ? 'OK' : 'FAIL');
  await dbContext.close();
}

async function escenarioInicializacionPersonalizada() {
  console.log('\n--- Escenario 2: Inicialización con configuración personalizada ---');
  const customConfig: DBInitOptions = {
    dbName: 'customDB',
    version: 2,
    stores: [
      {
        name: 'customStore',
        keyPath: 'customId',
        autoIncrement: true,
        indexes: [{ name: 'by_custom', keyPath: 'customField', options: { unique: false } }]
      }
    ]
  };
  const { dbContext: customCtx } = await createIndexedDbServices(customConfig);
  console.log('Custom DbContext:', customCtx ? 'OK' : 'FAIL');
  await customCtx.close();
}

async function escenarioConsultarConfigReal() {
  console.log('\n--- Escenario 3: Consultar configuración real de la base de datos ---');
  const realConfig = await getIndexedDbConfig();
  console.log('Config real:', realConfig);
}

async function main() {
  await escenarioInicializacionPorDefecto();
  await escenarioInicializacionPersonalizada();
  await escenarioConsultarConfigReal();
}

main().catch(err => {
  console.error('Error en el ejemplo:', err);
  process.exit(1);
});