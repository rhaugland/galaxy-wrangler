import { SaveData } from '@/models/types';

export interface StorageBackend {
  get(): Promise<SaveData | null>;
  set(data: SaveData): Promise<void>;
  clear(): Promise<void>;
}

export class IDBBackend implements StorageBackend {
  private dbName = 'galaxy-wrangler';
  private storeName = 'save';

  private async getDb() {
    const { openDB } = await import('idb');
    return openDB(this.dbName, 1, {
      upgrade(db) { db.createObjectStore('save'); },
    });
  }

  async get(): Promise<SaveData | null> {
    const db = await this.getDb();
    return (await db.get(this.storeName, 'player')) ?? null;
  }

  async set(data: SaveData): Promise<void> {
    const db = await this.getDb();
    await db.put(this.storeName, data, 'player');
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    await db.delete(this.storeName, 'player');
  }
}

export class SaveManager {
  constructor(private backend: StorageBackend) {}
  async save(data: SaveData): Promise<void> { await this.backend.set(data); }
  async load(): Promise<SaveData | null> { return this.backend.get(); }
  async clear(): Promise<void> { await this.backend.clear(); }
}
