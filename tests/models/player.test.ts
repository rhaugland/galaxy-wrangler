import { createDefaultPlayer, getEffectiveStats } from '@/models/player';

describe('createDefaultPlayer', () => {
  it('starts at level 0 with 0 xp and 0 coins', () => {
    const p = createDefaultPlayer();
    expect(p.xp).toBe(0); expect(p.level).toBe(0); expect(p.coins).toBe(0);
  });
});

describe('getEffectiveStats', () => {
  it('applies stat boosts to base captain stats', () => {
    const p = createDefaultPlayer();
    p.statBoosts = { damage: 5 };
    const stats = getEffectiveStats(p);
    expect(stats.damage).toBeGreaterThan(0);
  });
});
