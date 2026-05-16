// src/lib/puzzleLibrary/queries.ts

import { getDatabase } from './db';
import type { Puzzle, Category, LibraryProgress } from './types';

// Puzzle queries
export async function savePuzzle(puzzle: Puzzle): Promise<void> {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('puzzles', 'readwrite');
    const store = tx.objectStore('puzzles');
    const req = store.put(puzzle);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve();
  });
}

export async function getPuzzle(id: string): Promise<Puzzle | undefined> {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('puzzles', 'readonly');
    const store = tx.objectStore('puzzles');
    const req = store.get(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export async function getPuzzlesInCategory(wordLength: number): Promise<Puzzle[]> {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('puzzles', 'readonly');
    const store = tx.objectStore('puzzles');
    const index = store.index('category');
    const category = wordLength - 3; // 3→0, 4→1, etc
    const req = index.getAll(category);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export async function getUnsolvedInCategory(wordLength: number): Promise<Puzzle[]> {
  const puzzles = await getPuzzlesInCategory(wordLength);
  return puzzles.filter(p => !p.completed);
}

// Category queries
export async function getCategory(wordLength: number): Promise<Category | undefined> {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readonly');
    const store = tx.objectStore('categories');
    const req = store.get(wordLength);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export async function updateCategoryProgress(
  wordLength: number,
  updates: Partial<Category>
): Promise<void> {
  const category = await getCategory(wordLength);
  if (!category) throw new Error(`Category ${wordLength} not found`);

  const updated = { ...category, ...updates };
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');
    const req = store.put(updated);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve();
  });
}

// Progress queries
export async function getProgress(): Promise<LibraryProgress | undefined> {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progress', 'readonly');
    const store = tx.objectStore('progress');
    const req = store.get('global');
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export async function updateProgress(updates: Partial<LibraryProgress>): Promise<void> {
  const progress = await getProgress();
  if (!progress) throw new Error('Progress not found');

  const updated = { ...progress, ...updates };
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progress', 'readwrite');
    const store = tx.objectStore('progress');
    const req = store.put(updated);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve();
  });
}
