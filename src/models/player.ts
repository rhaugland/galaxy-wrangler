import { SaveData, ShipStats } from './types';
import { CAPTAINS } from '@/config/worlds';

export function createDefaultPlayer(): SaveData {
  return {
    xp: 0, level: 0, coins: 0, currentCaptainId: 'base',
    worldProgress: {}, unlockedCreatures: [],
    ownedItems: [], equippedWeapon: null, equippedDefense: null,
    equippedCosmetic: null, statBoosts: {}, checkpoint: null,
  };
}

export function getEffectiveStats(save: SaveData): ShipStats {
  const captain = CAPTAINS[save.currentCaptainId];
  return {
    hp: captain.stats.hp + (save.statBoosts.hp ?? 0),
    damage: captain.stats.damage + (save.statBoosts.damage ?? 0),
    speed: captain.stats.speed + (save.statBoosts.speed ?? 0),
    shield: captain.stats.shield + (save.statBoosts.shield ?? 0),
  };
}
