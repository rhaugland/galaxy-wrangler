export const XP_PER_LEVEL = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];

export function levelForXp(xp: number): number {
  let lvl = 0;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (xp >= XP_PER_LEVEL[i]) lvl = i; else break;
  }
  return lvl;
}

export function xpToNextLevel(xp: number): { current: number; needed: number } {
  const lvl = levelForXp(xp);
  if (lvl >= XP_PER_LEVEL.length - 1) return { current: 0, needed: 0 };
  return { current: xp - XP_PER_LEVEL[lvl], needed: XP_PER_LEVEL[lvl + 1] - XP_PER_LEVEL[lvl] };
}
