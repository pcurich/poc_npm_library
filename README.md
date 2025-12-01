# @pcurich/client-storage-indexeddb

Librería NPM que abstrae el almacenamiento en IndexedDB con un enfoque tipo ORM, compatible con Node (usando fake-indexeddb) y navegadores modernos.

## Resumen

- Abstracción de acceso a IndexedDB (`DbContext`, `IDbContext`).
- Repositorios genéricos y específicos (`BaseRepository`, `HttpMockRepository`).
- Servicios de negocio (`HttpMockService`).
- Inicializador configurable (`createIndexedDbServices`).
- Utilidades para inspección y migración de estructura.
- Ejemplos y tests con `fake-indexeddb`.

## Instalación

```sh
npm install @pcurich/client-storage-indexeddb
```

## Uso rápido

```ts
import 'fake-indexeddb/auto'; // Solo en Node/testing
import { createIndexedDbServices } from '@pcurich/client-storage-indexeddb';

const { httpMockService } = await createIndexedDbServices({
  dbName: 'app',
  version: 2,
  stores: [
    {
      name: 'httpMocks',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'by_url', keyPath: 'url', options: { unique: false } },
        { name: 'by_url_method', keyPath: ['url', 'method'], options: { unique: false } },
        { name: 'serviceCode', keyPath: 'serviceCode', options: { unique: false } }
      ]
    }
  ]
});

await httpMockService.createMock({
  serviceCode: 'SVC1',
  url: '/api/test',
  method: 'GET',
  httpCodeResponseValue: 200,
  responseBody: JSON.stringify({ ok: true }),
  delayMs: 0
});
```

## API principal

### Inicialización

```ts
import { createIndexedDbServices } from '@pcurich/client-storage-indexeddb';

const { dbContext, httpMockService } = await createIndexedDbServices({
  dbName: 'mydb',
  version: 1,
  stores: [
    {
      name: 'httpMocks',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'by_url', keyPath: 'url', options: { unique: false } }
      ]
    }
  ]
});
```

### Tipos de configuración

```ts
type IndexConfig = { name: string; keyPath: string | string[]; options?: IDBIndexParameters; };
type StoreConfig = { name: string; keyPath?: string; autoIncrement?: boolean; indexes?: IndexConfig[]; };
type DBInitOptions = { dbName: string; version: number; stores: StoreConfig[]; };
```

### Métodos y servicios

- `createIndexedDbServices(cfg?: DBInitOptions)`: Inicializa la base y servicios.
- `createDefaultIndexedDb(cfg?: DBInitOptions)`: Solo inicializa la base.
- `getIndexedDbConfig()`: Inspecciona la estructura actual.
- `HttpMockService`: CRUD y búsquedas por índice.

## Ejemplo de test con fake-indexeddb

```ts
import 'fake-indexeddb/auto';
import { createIndexedDbServices } from '@pcurich/client-storage-indexeddb';

describe('httpMockService', () => {
  it('Should create and get a mock', async () => {
    const { httpMockService } = await createIndexedDbServices({
      dbName: 'testdb',
      version: 1,
      stores: [
        {
          name: 'httpMocks',
          keyPath: 'id',
          autoIncrement: true,
          indexes: [{ name: 'by_url', keyPath: 'url', options: { unique: false } }]
        }
      ]
    });
    const created = await httpMockService.createMock({ url: '/api', method: 'GET', serviceCode: 'S1' });
    const found = await httpMockService.getMockById(created.id);
    expect(found?.url).toBe('/api');
  });
});
```

## Buenas prácticas

- Usa `clearDatabase: true` en desarrollo para evitar conflictos de versiones.
- Versiona tu base de datos al cambiar stores o índices.
- Publica los tipos `.d.ts` para mejor DX en TypeScript.
- Usa `npm run pack:tgz` para probar localmente antes de publicar.

## Scripts útiles

- `npm run build`: Compila la librería.
- `npm run test`: Ejecuta los tests con cobertura.
- `npm run pack:tgz`: Genera un `.tgz` instalable localmente.
- `npm publish --access public`: Publica en npm.

## Cambios recientes

- Estructura modular y cobertura de tests >90%.
- Soporte para múltiples stores e índices.
- Ejemplos y tests con fake-indexeddb.
- Exportación de tipos y configuración flexible.

---

Para detalles avanzados, revisa los archivos en `src/indexeddb/` y los ejemplos en `src/example/`.
