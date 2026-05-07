import { SaveData } from '@/models/types';
import { levelForXp } from '@/config/balance';

export function awardXp(save: SaveData, amount: number): SaveData {
  const xp = save.xp + amount;
  return { ...save, xp, level: levelForXp(xp) };
}

export function awardCoins(save: SaveData, amount: number): SaveData {
  return { ...save, coins: save.coins + amount };
}

export function canAfford(save: SaveData, cost: number): boolean {
  return save.coins >= cost;
}

export function spend(save: SaveData, cost: number): SaveData {
  if (!canAfford(save, cost)) throw new Error('Insufficient coins');
  return { ...save, coins: save.coins - cost };
}
