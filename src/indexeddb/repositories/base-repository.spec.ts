import 'fake-indexeddb/auto';
import { IDbContext } from '../context/i-db-context';
import BaseRepository from './base-repository';


class TestRepository extends BaseRepository<any> { }

class FakeDbContext implements IDbContext {
	private db: IDBDatabase | null = null;
	constructor(private storeName: string) { }

	close(): Promise<void> {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
		return Promise.resolve();
	}

	async open(): Promise<IDBDatabase> {
		if (this.db) return this.db;
		const req = indexedDB.open('testdb', 1);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(this.storeName)) {
				req.result.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
			}
		};
		this.db = await new Promise<IDBDatabase>((resolve, reject) => {
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
		return this.db;
	}

	async getDB(): Promise<IDBDatabase> {
		if (!this.db) await this.open();
		return this.db!;
	}

	async runTransaction<T>(
		storeName: string,
		mode: IDBTransactionMode,
		fn: (store: IDBObjectStore) => IDBRequest | Promise<any> | void
	): Promise<T> {
		const db = await this.getDB();
		const tx = db.transaction(storeName, mode);
		const store = tx.objectStore(storeName);
		const result = fn(store);
		if (result instanceof IDBRequest) {
			return await new Promise<T>((resolve, reject) => {
				result.onsuccess = () => resolve(result.result);
				result.onerror = () => reject(result.error);
			});
		}
		return result as T;
	}
}

describe('BaseRepository', () => {
	let repo: TestRepository;
	let ctx: FakeDbContext;

	beforeEach(async () => {
		await new Promise<void>((resolve) => {
			const req = indexedDB.deleteDatabase('testdb');
			req.onsuccess = () => resolve();
			req.onerror = () => resolve();
			req.onblocked = () => resolve();
		});
		ctx = new FakeDbContext('testStore');
		await ctx.open();
		repo = new TestRepository(ctx, 'testStore', 'id');
	});

	afterEach(async () => {
		if (ctx) await ctx.close();

		await new Promise<void>((resolve) => {
			const req = indexedDB.deleteDatabase('testdb');
			req.onsuccess = () => resolve();
			req.onerror = () => resolve();
			req.onblocked = () => resolve();
		});
	});

	it('#Should create an entity and assign id', async () => {
		// Arrange
		const entity = { name: 'A' };

		// Act
		const created = await repo.create(entity);

		// Assert
		expect(created.id).toBeDefined();
	});

	it('#Should read an entity by id', async () => {
		// Arrange
		const entity = await repo.create({ name: 'B' });

		// Act
		const found = await repo.read(entity.id);

		// Assert
		expect(found?.name).toBe('B');
	});

	it('#Should update an entity', async () => {
		// Arrange
		const entity = await repo.create({ name: 'C' });
		entity.name = 'C2';

		// Act
		const updated = await repo.update(entity);

		// Assert
		expect(updated.name).toBe('C2');
	});

	it('#Should delete an entity', async () => {
		// Arrange
		const entity = await repo.create({ name: 'D' });

		// Act
		await repo.delete(entity.id);
		const found = await repo.read(entity.id);

		// Assert
		expect(found).toBeNull();
	});

	it('#Should find all entities', async () => {
		// Arrange
		await repo.create({ name: 'E1' });
		await repo.create({ name: 'E2' });

		// Act
		const all = await repo.findAll();

		// Assert
		expect(all.length).toBe(2);
	});
});