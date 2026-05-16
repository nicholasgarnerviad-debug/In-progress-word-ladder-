// src/lib/puzzleLibrary/__tests__/queries.test.ts

import { initializeDatabase, getDatabase } from '../db';
import {
  savePuzzle,
  getPuzzlesInCategory,
  getUnsolvedInCategory,
  getCategory,
  updateCategoryProgress
} from '../queries';
import type { Puzzle, Category } from '../types';

describe('Puzzle Library Queries', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterEach(async () => {
    const db = await getDatabase();
    // Clear stores
    ['puzzles', 'categories', 'progress'].forEach(store => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
    });
  });

  beforeEach(async () => {
    // Reinitialize categories and progress after clearing
    const db = await getDatabase();
    return new Promise<void>((resolve) => {
      const tx = db.transaction(['categories', 'progress'], 'readwrite');
      const categoryStore = tx.objectStore('categories');
      const progressStore = tx.objectStore('progress');

      for (let len = 3; len <= 7; len++) {
        categoryStore.put({
          wordLength: len,
          totalPuzzles: 10,
          completedCount: 0,
          lastPlayedIndex: 0,
        });
      }

      progressStore.put({
        id: 'global',
        currentWordLength: 3,
        totalCompleted: 0,
        lastPlayedAt: Date.now(),
      });

      tx.oncomplete = () => resolve();
    });
  });

  it('should save and retrieve a puzzle', async () => {
    const puzzle: Puzzle = {
      id: 'cat_dog',
      wordLength: 3,
      startWord: 'cat',
      endWord: 'dog',
      category: 0,
      completed: false,
    };
    await savePuzzle(puzzle);
    const puzzles = await getPuzzlesInCategory(3);
    expect(puzzles).toHaveLength(1);
    expect(puzzles[0].startWord).toBe('cat');
  });

  it('should get unsolved puzzles only', async () => {
    const puzzle1: Puzzle = {
      id: 'cat_dog',
      wordLength: 3,
      startWord: 'cat',
      endWord: 'dog',
      category: 0,
      completed: false,
    };
    const puzzle2: Puzzle = {
      id: 'cat_bat',
      wordLength: 3,
      startWord: 'cat',
      endWord: 'bat',
      category: 0,
      completed: true,
    };
    await savePuzzle(puzzle1);
    await savePuzzle(puzzle2);
    const unsolved = await getUnsolvedInCategory(3);
    expect(unsolved).toHaveLength(1);
    expect(unsolved[0].id).toBe('cat_dog');
  });

  it('should update category progress', async () => {
    await updateCategoryProgress(3, { completedCount: 5 });
    const category = await getCategory(3);
    expect(category?.completedCount).toBe(5);
  });
});
