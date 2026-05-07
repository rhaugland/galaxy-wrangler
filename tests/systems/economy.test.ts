import { awardXp, awardCoins, canAfford, spend } from '@/systems/economy';
import { createDefaultPlayer } from '@/models/player';

describe('awardXp', () => {
  it('adds xp and levels up when threshold crossed', () => {
    const p = createDefaultPlayer();
    const result = awardXp(p, 100);
    expect(result.xp).toBe(100);
    expect(result.level).toBe(1);
  });
});

describe('spend', () => {
  it('deducts coins if affordable', () => {
    const p = createDefaultPlayer(); p.coins = 50;
    const result = spend(p, 30);
    expect(result.coins).toBe(20);
  });
  it('throws if not affordable', () => {
    const p = createDefaultPlayer();
    expect(() => spend(p, 100)).toThrow();
  });
});
