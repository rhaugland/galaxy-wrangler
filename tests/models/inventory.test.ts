import { purchaseItem, equipWeapon, equipDefense } from '@/models/inventory';
import { createDefaultPlayer } from '@/models/player';

describe('purchaseItem', () => {
  it('adds item to ownedItems and deducts coins', () => {
    const p = createDefaultPlayer(); p.coins = 100;
    const result = purchaseItem(p, { id: 'spread', cost: 50, category: 'weapon', name: 'Spread Shot', description: '' });
    expect(result.ownedItems).toContain('spread');
    expect(result.coins).toBe(50);
  });
  it('rejects duplicate purchase', () => {
    const p = createDefaultPlayer(); p.coins = 100; p.ownedItems = ['spread'];
    expect(() => purchaseItem(p, { id: 'spread', cost: 50, category: 'weapon', name: '', description: '' })).toThrow();
  });
});

describe('equipWeapon', () => {
  it('equips an owned weapon', () => {
    const p = createDefaultPlayer(); p.ownedItems = ['spread'];
    const result = equipWeapon(p, 'spread');
    expect(result.equippedWeapon).toBe('spread');
  });
});
