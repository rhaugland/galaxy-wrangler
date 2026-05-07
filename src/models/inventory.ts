import { SaveData, ShopItem, WeaponId, DefenseId, CosmeticId } from './types';
import { spend } from '@/systems/economy';

export function purchaseItem(save: SaveData, item: ShopItem): SaveData {
  if (save.ownedItems.includes(item.id)) throw new Error('Already owned');
  const afterSpend = spend(save, item.cost);
  const updated = { ...afterSpend, ownedItems: [...afterSpend.ownedItems, item.id] };
  if (item.category === 'stat_boost' && item.stat && item.value) {
    updated.statBoosts = { ...updated.statBoosts, [item.stat]: (updated.statBoosts[item.stat] ?? 0) + item.value };
  }
  return updated;
}

export function equipWeapon(save: SaveData, id: WeaponId): SaveData {
  if (!save.ownedItems.includes(id)) throw new Error('Not owned');
  return { ...save, equippedWeapon: id };
}

export function equipDefense(save: SaveData, id: DefenseId): SaveData {
  if (!save.ownedItems.includes(id)) throw new Error('Not owned');
  return { ...save, equippedDefense: id };
}

export function equipCosmetic(save: SaveData, id: CosmeticId): SaveData {
  if (!save.ownedItems.includes(id)) throw new Error('Not owned');
  return { ...save, equippedCosmetic: id };
}
