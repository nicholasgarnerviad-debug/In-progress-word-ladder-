import { renderHook, act } from '@testing-library/react';
import { useGameResult } from '../useGameResult';
import { FirebaseLeaderboardAdapter } from '../../lib/leaderboard/sync/FirebaseLeaderboardAdapter';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: () => ({
      toMillis: () => Date.now(),
    }),
  },
}));

jest.mock('../../lib/firebase', () => ({
  firestore: {},
}));

jest.mock('../../lib/leaderboard/sync/FirebaseLeaderboardAdapter');

describe('useGameResult', () => {
  const mockRecordResult = jest.fn();
  const mockCheckAchievements = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (FirebaseLeaderboardAdapter as jest.Mock).mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      recordGameResult: mockRecordResult,
      checkAndGrantAchievements: mockCheckAchievements,
    }));
  });

  it('records game result with correct structure', async () => {
    const { result } = renderHook(() => useGameResult('user123'));

    mockRecordResult.mockResolvedValue(undefined);
    mockCheckAchievements.mockResolvedValue([]);

    await act(async () => {
      await result.current.recordResult('classic', 100, true, 1, 60000, 'easy', 5);
    });

    expect(mockRecordResult).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        userId: 'user123',
        mode: 'classic',
        score: 100,
        solved: true,
        wrong: 1,
        duration: 60000,
        difficulty: 'easy',
        wordLength: 5,
      })
    );
  });

  it('evaluates achievements after recording', async () => {
    const { result } = renderHook(() => useGameResult('user123'));

    mockRecordResult.mockResolvedValue(undefined);
    mockCheckAchievements.mockResolvedValue(['achievement1']);

    const returnValue = await act(async () => {
      return await result.current.recordResult('classic', 100, true, 1, 60000, 'easy');
    });

    expect(mockCheckAchievements).toHaveBeenCalledWith('user123');
    expect(returnValue.newAchievements).toEqual(['achievement1']);
  });
});
