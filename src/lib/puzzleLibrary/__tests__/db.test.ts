// src/lib/puzzleLibrary/__tests__/db.test.ts

import { initializeDatabase, getDatabase, resetDatabaseInstance } from '../db';

describe('PuzzleLibrary Database', () => {
  let db: IDBDatabase | null = null;

  beforeEach(async () => {
    resetDatabaseInstance();
    // Clean up database before each test
    await new Promise((resolve) => {
      const deleteRequest = indexedDB.deleteDatabase('PuzzleLibrary');
      deleteRequest.onsuccess = () => resolve(undefined);
      deleteRequest.onerror = () => resolve(undefined);
      deleteRequest.onblocked = () => resolve(undefined);
    });
  });

  afterEach(async () => {
    resetDatabaseInstance();
    if (db) {
      db.close();
      db = null;
    }
  });

  it('should initialize database with correct stores', async () => {
    db = await initializeDatabase();
    expect(db.objectStoreNames).toContain('puzzles');
    expect(db.objectStoreNames).toContain('categories');
    expect(db.objectStoreNames).toContain('progress');
  });

  it('should create category entries on first init', async () => {
    db = await initializeDatabase();
    const tx = db.transaction('categories', 'readonly');
    const store = tx.objectStore('categories');
    const allCategories = await new Promise<any[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    expect(allCategories.length).toBe(5); // 3, 4, 5, 6, 7 letter
  });
});
