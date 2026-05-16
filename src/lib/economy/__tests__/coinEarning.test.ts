import { calculateClassicCoins, calculateTimeAttackCoins, calculateBlitzCoins } from '../coinEarning';

describe('coinEarning', () => {
  describe('calculateClassicCoins', () => {
    it('returns 5 coins for easy puzzle', () => {
      expect(calculateClassicCoins('easy')).toBe(5);
    });

    it('returns 10 coins for medium puzzle', () => {
      expect(calculateClassicCoins('medium')).toBe(10);
    });

    it('returns 15 coins for hard puzzle', () => {
      expect(calculateClassicCoins('hard')).toBe(15);
    });

    it('throws error for invalid difficulty', () => {
      expect(() => calculateClassicCoins('invalid' as any)).toThrow();
    });
  });

  describe('calculateTimeAttackCoins', () => {
    it('returns 0 coins for 0 puzzles solved', () => {
      expect(calculateTimeAttackCoins(0)).toBe(0);
    });

    it('returns 8 coins for 1 puzzle solved', () => {
      expect(calculateTimeAttackCoins(1)).toBe(8);
    });

    it('returns 40 coins for 5 puzzles solved', () => {
      expect(calculateTimeAttackCoins(5)).toBe(40);
    });

    it('returns correct value for large puzzle count', () => {
      expect(calculateTimeAttackCoins(50)).toBe(400);
    });

    it('throws error for negative puzzle count', () => {
      expect(() => calculateTimeAttackCoins(-1)).toThrow();
    });
  });

  describe('calculateBlitzCoins', () => {
    it('returns 50 coins for 1st place', () => {
      expect(calculateBlitzCoins(1)).toBe(50);
    });

    it('returns 40 coins for 2nd place', () => {
      expect(calculateBlitzCoins(2)).toBe(40);
    });

    it('returns 25 coins for 3rd place', () => {
      expect(calculateBlitzCoins(3)).toBe(25);
    });

    it('returns 10 coins for 4th place', () => {
      expect(calculateBlitzCoins(4)).toBe(10);
    });

    it('throws error for 5th place or invalid placement', () => {
      expect(() => calculateBlitzCoins(5)).toThrow();
    });

    it('throws error for 0 or negative placement', () => {
      expect(() => calculateBlitzCoins(0)).toThrow();
      expect(() => calculateBlitzCoins(-1)).toThrow();
    });
  });
});
