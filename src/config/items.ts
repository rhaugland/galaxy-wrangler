import type { ShopItem } from '../models/types';

export const SHOP_ITEMS: ShopItem[] = [
  // Weapons
  {
    id: 'laser',
    name: 'Laser',
    description: 'Standard single-shot laser. Default weapon.',
    cost: 0,
    category: 'weapon',
  },
  {
    id: 'spread',
    name: 'Spread Shot',
    description: 'Fires three projectiles in a spread pattern.',
    cost: 200,
    category: 'weapon',
  },
  {
    id: 'missiles',
    name: 'Missiles',
    description: 'Launches homing missiles that track enemies.',
    cost: 400,
    category: 'weapon',
  },
  {
    id: 'beam',
    name: 'Beam Cannon',
    description: 'Fires a continuous high-damage energy beam.',
    cost: 600,
    category: 'weapon',
  },

  // Defense
  {
    id: 'shield_gen',
    name: 'Shield Generator',
    description: 'Generates an energy shield that absorbs incoming damage.',
    cost: 150,
    category: 'defense',
  },
  {
    id: 'armor',
    name: 'Heavy Armor',
    description: 'Plated hull reduces damage taken.',
    cost: 300,
    category: 'defense',
  },
  {
    id: 'evasion',
    name: 'Evasion System',
    description: 'Advanced maneuver thrusters grant a chance to dodge attacks.',
    cost: 500,
    category: 'defense',
  },

  // Stat boosts (stackable)
  {
    id: 'boost_hp',
    name: 'Hull Reinforcement',
    description: 'Increases max HP by 10.',
    cost: 50,
    category: 'stat_boost',
    stat: 'hp',
    value: 10,
  },
  {
    id: 'boost_damage',
    name: 'Weapons Upgrade',
    description: 'Increases damage by 3.',
    cost: 75,
    category: 'stat_boost',
    stat: 'damage',
    value: 3,
  },
  {
    id: 'boost_speed',
    name: 'Engine Tune',
    description: 'Increases speed by 1.',
    cost: 60,
    category: 'stat_boost',
    stat: 'speed',
    value: 1,
  },
  {
    id: 'boost_shield',
    name: 'Shield Capacitor',
    description: 'Increases shield by 2.',
    cost: 80,
    category: 'stat_boost',
    stat: 'shield',
    value: 2,
  },

  // Cosmetics
  {
    id: 'skin_crimson',
    name: 'Crimson Hull',
    description: 'A fierce red paint job for your ship.',
    cost: 100,
    category: 'cosmetic',
  },
  {
    id: 'skin_void',
    name: 'Void Cloak',
    description: 'Dark stealth finish with subtle shimmer.',
    cost: 150,
    category: 'cosmetic',
  },
  {
    id: 'skin_aurora',
    name: 'Aurora Skin',
    description: 'Iridescent hull that shifts colors as you fly.',
    cost: 200,
    category: 'cosmetic',
  },
  {
    id: 'skin_gold',
    name: 'Gold Plating',
    description: 'Gleaming gold finish for elite pilots.',
    cost: 300,
    category: 'cosmetic',
  },
];
