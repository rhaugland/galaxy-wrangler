export interface ShipStats { hp: number; damage: number; speed: number; shield: number; }

export interface Captain {
  id: string; name: string; stats: ShipStats;
  abilityName: string; abilityDescription: string;
  abilityCooldown: number; abilityDuration: number;
}

export type WeaponId = 'laser' | 'spread' | 'missiles' | 'beam';
export type DefenseId = 'shield_gen' | 'armor' | 'evasion';
export type CosmeticId = string;

export interface ShopItem {
  id: string; name: string; description: string; cost: number;
  category: 'weapon' | 'defense' | 'stat_boost' | 'cosmetic';
  stat?: keyof ShipStats; value?: number;
}

export interface MissionTemplate {
  type: 'destroy' | 'survive' | 'collect' | 'distance' | 'escort';
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number; coinReward: number;
  target: number; timeLimitSec?: number;
  minLevel: number;
}

export interface WorldDef {
  id: string; name: string; theme: string;
  levels: LevelDef[];
}

export interface LevelDef {
  tier: 'star' | 'constellation' | 'galaxy';
  travelDistance: number; obstacleDensity: number;
  boss: BossDef; creatureReward: Captain;
}

export interface BossDef {
  name: string; hp: number;
  style: 'auto_dodge' | 'tap_shoot' | 'ram_retreat';
  coinBonus: number; replayCoinBonus: number;
}

export interface SaveData {
  xp: number; level: number; coins: number;
  currentCaptainId: string;
  worldProgress: Record<string, boolean[]>;
  unlockedCreatures: string[];
  ownedItems: string[];
  equippedWeapon: WeaponId | null;
  equippedDefense: DefenseId | null;
  equippedCosmetic: CosmeticId | null;
  statBoosts: Partial<ShipStats>;
  checkpoint: CheckpointData | null;
}

export interface CheckpointData {
  worldId: string; levelIndex: number;
  distanceTraveled: number; hpRemaining: number;
}
