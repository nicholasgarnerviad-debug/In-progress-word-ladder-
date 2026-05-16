// src/lib/puzzleLibrary/db.ts

import type { Puzzle, Category, LibraryProgress } from './types';

const DB_NAME = 'PuzzleLibrary';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export async function initializeDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // For testing: close existing instance before opening new one
    if (dbInstance && !dbInstance.objectStoreNames) {
      dbInstance = null;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      const err = request.error?.message || 'Unknown error';
      reject(new Error(`Failed to open IndexedDB: ${err}`));
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create stores
      if (!db.objectStoreNames.contains('puzzles')) {
        const puzzleStore = db.createObjectStore('puzzles', { keyPath: 'id' });
        puzzleStore.createIndex('category', 'category', { unique: false });
        puzzleStore.createIndex('completed', 'completed', { unique: false });
      }

      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'wordLength' });
      }

      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'id' });
      }

      // Get the transaction from the request
      const transaction = (event.target as IDBOpenDBRequest).transaction;
      if (!transaction) return;

      // Initialize categories (3-7 letters)
      try {
        const categoryStore = transaction.objectStore('categories');
        for (let len = 3; len <= 7; len++) {
          const category: Category = {
            wordLength: len,
            totalPuzzles: 10,
            completedCount: 0,
            lastPlayedIndex: 0,
          };
          categoryStore.put(category);
        }

        // Initialize progress
        const progressStore = transaction.objectStore('progress');
        const progress: LibraryProgress = {
          id: 'global',
          currentWordLength: 3,
          totalCompleted: 0,
          lastPlayedAt: Date.now(),
        };
        progressStore.put(progress);
      } catch (e) {
        // Silently ignore errors in initialization
        console.error('Error during database initialization:', e);
      }
    };
  });
}

export async function getDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  return initializeDatabase();
}

// For testing: reset the database instance
export function resetDatabaseInstance(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
