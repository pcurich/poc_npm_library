# poc_npm_library

POC de una pequeña librería/ORM sobre IndexedDB. Esta documentación explica la arquitectura, conceptos clave de IndexedDB, la configuración y el uso de los componentes expuestos.

## Resumen

La librería provee:

- Abstracción de acceso a IndexedDB (DbContext / IDbContext).
- Repositorios genéricos y específicos (BaseRepository, UserRepository, HttpMockRepository).
- Servicios de negocio (UserService, HttpMockService).
- Inicializador configurable (createIndexedDbServices).
- Utilidades (env, errores) y ejemplos para pruebas con fake-indexeddb.

## Conceptos clave de IndexedDB

- Base de datos (DB): contenedor con nombre y versión.
- ObjectStore (store): equivalente conceptual a una tabla/colección; tiene `name`, `keyPath` y `autoIncrement`.
- Índices: secundarios creados con `createIndex(name, keyPath, options)` — pueden ser simples o compuestos (array). Opciones: `unique`, `multiEntry`.
- Migraciones: cambios en stores/índices se hacen en `onupgradeneeded`; para aplicar cambios hay que incrementar la versión o borrar la DB en desarrollo.

## Estructura propuesta (principal)

``` tpl
src/
  index.ts
  indexeddb/
    context/         # IDbContext, DbContext
    init/            # createIndexedDbServices.ts (inicializador configurable)
    migrations/      # migrations opcionales
    entities/        # BaseEntity, UserEntity, HttpMockEntity
    repositories/    # BaseRepository, HttpMockRepository, UserRepository
    services/        # HttpMockService, UserService + interfaces
  utils/             # env.ts, errors.ts, validators.ts
  example/           # user-test.ts, http-mock-test.ts, print-env.ts
rollup.config.js
tsconfig.json
package.json
README.md
```

## Componentes y responsabilidades

- DbContext / IDbContext: abrir DB, ejecutar transacciones promisificadas y aplicar migrations.
- BaseRepository`<T>`: CRUD genérico; asigna claves generadas (`add`/`put`) a la entidad.
- Repositorios concretos: queries por índices (`findByIndex`).
- Servicios (UserService / HttpMockService): lógica de negocio, validaciones ligeras, actualización de `updatedAt` antes de `update`, métodos de alto nivel (create/get/update/delete/findByIndex/getResponseBodyAs`<T>`).
- createIndexedDbServices(opts): función pública que recibe configuración unificada (dbName, version, stores[], httpOnly, clearDatabase) y devuelve los servicios inicializados.

## Interfaz de inicialización (DBInitOptions)

Pasa un único objeto con la configuración de la DB y los stores:

```ts
type IndexConfig = { name: string; keyPath: string | string[]; options?: IDBIndexParameters; };
type StoreConfig = { name: string; keyPath?: string; autoIncrement?: boolean; indexes?: IndexConfig[]; };

const opts = {
  dbName: 'poc_test_db',
  version: 1,
  clearDatabase: true,
  httpOnly: true, // solo se expone el servicio HttpMockService
  stores: [
    {
      name: 'httpMocks',
      keyPath: '_id',
      autoIncrement: true,
      indexes: [
        { name: 'by_url', keyPath: 'url', options: { unique: false }},
        { name: 'by_url_method', keyPath: ['url','method'], options: { unique: false }},
        { name: 'serviceCode', keyPath: 'serviceCode', options: { unique: false }}
      ]
    }
  ]
};
```

Uso:

```ts
const { httpMockService } = await createIndexedDbServices(opts);
```

## Ejemplo rápido (Node + fake-indexeddb)

```ts
import 'fake-indexeddb/auto';
import { createIndexedDbServices } from './indexeddb/init/createServices';

const { httpMockService } = await createIndexedDbServices({ dbName: 'app', version: 2, httpOnly: true });

await httpMockService.createMock({
  serviceCode: 'SVC1',
  url: '/api/test',
  method: 'GET',
  httpCodeResponseValue: 200,
  responseBody: JSON.stringify({ ok: true }),
  delayMs: 0
});
```

## Tipos TypeScript

- Generar y publicar `.d.ts` recomendado.
- Si el consumidor ve `TS7016`, habilitar `declaration` en tsconfig y publicar `lib/types`, o usar un stub `declare module`.

## Errores comunes y soluciones

- NotFoundError: store not found — verificar migration y versión, o usar `clearDatabase: true` en dev para eliminar DB antigua antes de iniciar.
- Unknown file extension ".ts": usar `ts-node` para ejecutar .ts o compilar con `tsc` antes de `node`.

## Convenciones recomendadas

- Nombres de stores: coherentes (`httpMocks`, `users`).
- KeyPath por defecto: `_id` (autoIncrement true). Soportar `id` como alias.
- Índices: prefijar `by_` para búsquedas (`by_url`, `by_email`).
- Migrations: versionar y documentar cambios.

## Buenas prácticas de uso

- Mantener repositorios y servicios responsables de validación y shape de entidades.
- Evitar exponer secretos en variables de entorno para código cliente.
- Incrementar versión DB para aplicar migrations; en desarrollo usar `clearDatabase: true` si se requiere reset.

---

Para cambios en stores/índices, editar `src/indexeddb/init/createServices.ts` (o pasar `stores` en la configuración) y aumentar la versión o borrar la DB en desarrollo.
