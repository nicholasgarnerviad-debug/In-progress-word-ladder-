import { useEffect, useState, useCallback } from 'react';
import * as queries from './queries';
import type { Puzzle, Category, LibraryProgress } from './types';

export function useLibraryProgress() {
  const [progress, setProgress] = useState<LibraryProgress | null>(null);
  const [categories, setCategories] = useState<Map<number, Category>>(new Map());
  const [puzzles, setPuzzles] = useState<Map<string, Puzzle>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize library on mount
  useEffect(() => {
    const init = async () => {
      try {
        const prog = await queries.getProgress();
        if (prog) setProgress(prog);

        // Load all categories and their puzzles
        const cats = new Map();
        const allPuzzles = new Map();
        for (let len = 3; len <= 7; len++) {
          const cat = await queries.getCategory(len);
          if (cat) cats.set(len, cat);

          // Load all puzzles for this category
          const categoryPuzzles = await queries.getPuzzlesInCategory(len);
          categoryPuzzles.forEach(puzzle => {
            allPuzzles.set(puzzle.id, puzzle);
          });
        }
        setCategories(cats);
        setPuzzles(allPuzzles);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load library');
        setLoading(false);
      }
    };

    init();
  }, []);

  const savePuzzle = useCallback(async (puzzle: Puzzle) => {
    try {
      await queries.savePuzzle(puzzle);
      // Update local state
      const newPuzzles = new Map(puzzles);
      newPuzzles.set(puzzle.id, puzzle);
      setPuzzles(newPuzzles);

      // Update category progress if completed
      if (puzzle.completed) {
        const category = categories.get(puzzle.wordLength);
        if (category) {
          const allInCategory = Array.from(newPuzzles.values()).filter(
            p => p.wordLength === puzzle.wordLength
          );
          const completedCount = allInCategory.filter(p => p.completed).length;
          const updated = { ...category, completedCount };
          await queries.updateCategoryProgress(puzzle.wordLength, updated);
          const newCats = new Map(categories);
          newCats.set(puzzle.wordLength, updated);
          setCategories(newCats);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save puzzle');
    }
  }, [puzzles, categories]);

  const updateProgress = useCallback(async (updates: Partial<LibraryProgress>) => {
    try {
      await queries.updateProgress(updates);
      if (progress) {
        setProgress({ ...progress, ...updates });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update progress');
    }
  }, [progress]);

  return {
    progress,
    categories,
    puzzles,
    loading,
    error,
    savePuzzle,
    updateProgress,
  };
}
