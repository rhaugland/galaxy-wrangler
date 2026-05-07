import { levelForXp, xpToNextLevel } from '@/config/balance';

describe('levelForXp', () => {
  it('returns 0 for 0 xp', () => { expect(levelForXp(0)).toBe(0); });
  it('returns 1 at 100 xp', () => { expect(levelForXp(100)).toBe(1); });
  it('stays at 1 at 249 xp', () => { expect(levelForXp(249)).toBe(1); });
  it('returns 2 at 250 xp', () => { expect(levelForXp(250)).toBe(2); });
});

describe('xpToNextLevel', () => {
  it('shows progress within level', () => {
    const r = xpToNextLevel(150);
    expect(r.current).toBe(50);
    expect(r.needed).toBe(150);
  });
});
