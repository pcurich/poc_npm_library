// ...existing code...
import 'fake-indexeddb/auto'; // polyfill IndexedDB para Node
import { Migration, DbContext } from '../src/indexeddb/context/DbContext';
import { UserService } from '../src/indexeddb/services/UserService';
import { UserEntity } from '../src/indexeddb/entities/UserEntity';

const initial: Migration = (db: IDBDatabase) => {
    if (!db.objectStoreNames.contains('users')) {
        const s = db.createObjectStore('users', { keyPath: '_id', autoIncrement: true });
        s.createIndex('by_email', 'email', { unique: true });
    }
};

async function simulateWebApp() {
    const ctx = new DbContext('poc_npm_library', 1, [initial]);
    await ctx.open();
    const userService = new UserService(ctx);

    console.log('--- Simulación: crear usuario ---');
    const created = await userService.createUser({ name: 'Pedro', email: 'pedro@example.com' } as Partial<UserEntity>);
    console.log('Creado:', created);

    const id = (created as any)._id ?? (created as any).id;
    console.log('ID generado:', id);

    console.log('--- Simulación: leer usuario por id ---');
    const fetched = id !== undefined ? await userService.getUserById(id) : null;
    console.log('Leído:', fetched);

    console.log('--- Simulación: actualizar usuario ---');
    if (fetched) {
        fetched.name = 'Pedro Updated';
        const updated = await userService.updateUser(fetched);
        console.log('Actualizado:', updated);
    }

    console.log('--- Simulación: buscar por email ---');
    const byEmail = await userService.findByEmail('pedro@example.com');
    console.log('Resultados por email:', byEmail);

    console.log('--- Simulación: eliminar usuario ---');
    if (id !== undefined) {
        const deleted = await userService.deleteUser(id);
        console.log('Eliminado:', deleted);
    }

    console.log('--- Estado final: todos los usuarios ---');
    const all = await userService.getAllUsers();
    console.log('Todos:', all);
}

simulateWebApp().catch(err => {
    console.error('Error en la simulación:', err);
    process.exit(1);
});
// ...existing code...