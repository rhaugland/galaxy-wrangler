import { Button } from '@/ui/button';
import { SHOP_ITEMS } from '@/config/items';
import { SaveData, ShopItem } from '@/models/types';
import { SaveManager } from '@/systems/save-system';
import { purchaseItem, equipWeapon, equipDefense, equipCosmetic } from '@/models/inventory';
import { FONT } from '@/ui/theme';

type TabKey = 'weapon' | 'defense' | 'stat_boost' | 'cosmetic';
const TABS: Array<{ label: string; key: TabKey }> = [
  { label: 'Weapons', key: 'weapon' },
  { label: 'Defense', key: 'defense' },
  { label: 'Boosts', key: 'stat_boost' },
  { label: 'Cosmetics', key: 'cosmetic' },
];

export class ShopScene extends Phaser.Scene {
  private save!: SaveData;
  private saveManager!: SaveManager;
  private activeTab: TabKey = 'weapon';
  private itemsContainer!: Phaser.GameObjects.Container;
  private coinText!: Phaser.GameObjects.Text;

  constructor() { super('Shop'); }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const W = 390;
    const cx = W / 2;

    this.save = this.registry.get('save') ?? this.defaultSave();
    this.saveManager = this.registry.get('saveManager');

    // Title
    this.add.text(cx, 44, 'Shop', {
      fontSize: '30px',
      fontFamily: FONT,
      color: '#ffffff',
      stroke: '#4444cc',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Coin counter
    this.coinText = this.add.text(W - 16, 44, `\u25cf ${this.save.coins}`, {
      fontSize: '18px',
      fontFamily: FONT,
      color: '#ffdd44',
    }).setOrigin(1, 0.5);

    // Tab buttons
    const tabW = 90;
    TABS.forEach((tab, i) => {
      const tx = 12 + i * (tabW + 4) + tabW / 2;
      new Button(this, tx, 96, tab.label, () => {
        this.activeTab = tab.key;
        this.refreshItems();
      }, tabW, 36);
    });

    // Items container (scrollable area)
    this.itemsContainer = this.add.container(0, 0);
    this.refreshItems();

    // Back button
    new Button(this, cx, 800, 'Back', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
      });
    }, 140, 44);
  }

  private refreshItems() {
    this.itemsContainer.removeAll(true);

    const W = 390;
    const cx = W / 2;
    const items = SHOP_ITEMS.filter(it => it.category === this.activeTab);

    items.forEach((item, i) => {
      const cardY = 150 + i * 128;
      this.drawItemCard(item, cx, cardY);
    });
  }

  private drawItemCard(item: ShopItem, cx: number, cardY: number) {
    const owned = this.save.ownedItems.includes(item.id);
    const canAfford = this.save.coins >= item.cost;

    const isEquipped =
      this.save.equippedWeapon === item.id ||
      this.save.equippedDefense === item.id ||
      this.save.equippedCosmetic === item.id;

    const cardH = 110;
    const bg = this.add.graphics();
    bg.lineStyle(2, owned ? 0x44aa44 : 0x333366, 1);
    bg.fillStyle(0x111133, 0.9);
    bg.strokeRoundedRect(cx - 165, cardY - cardH / 2, 330, cardH, 10);
    bg.fillRoundedRect(cx - 165, cardY - cardH / 2, 330, cardH, 10);
    this.itemsContainer.add(bg);

    const nameT = this.add.text(cx - 148, cardY - 38, item.name, {
      fontSize: '17px', fontFamily: FONT, color: '#ffffff',
    });
    this.itemsContainer.add(nameT);

    const descT = this.add.text(cx - 148, cardY - 14, item.description, {
      fontSize: '12px', fontFamily: FONT, color: '#aaaaaa',
      wordWrap: { width: 200 },
    });
    this.itemsContainer.add(descT);

    if (!owned) {
      const costT = this.add.text(cx + 80, cardY - 14, `${item.cost} coins`, {
        fontSize: '13px', fontFamily: FONT,
        color: canAfford ? '#ffdd44' : '#aa5500',
      }).setOrigin(0, 0);
      this.itemsContainer.add(costT);
    }

    // Action button
    let btnLabel = 'Buy';
    let btnCallback: () => void = () => {};

    if (isEquipped) {
      btnLabel = 'Equipped';
      btnCallback = () => {};
    } else if (owned) {
      btnLabel = 'Equip';
      btnCallback = () => this.handleEquip(item);
    } else if (canAfford) {
      btnLabel = 'Buy';
      btnCallback = () => this.handleBuy(item);
    } else {
      btnLabel = 'Buy';
      btnCallback = () => {};
    }

    const btn = new Button(this, cx + 110, cardY + 26, btnLabel, btnCallback, 100, 38);
    if (isEquipped || (!owned && !canAfford)) {
      btn.setAlpha(0.45);
    }
    this.itemsContainer.add(btn);
  }

  private async handleBuy(item: ShopItem) {
    try {
      this.save = purchaseItem(this.save, item);
      this.registry.set('save', this.save);
      if (this.saveManager) await this.saveManager.save(this.save);
      this.coinText.setText(`\u25cf ${this.save.coins}`);
      this.refreshItems();
    } catch {
      // can't afford or already owned — no-op
    }
  }

  private async handleEquip(item: ShopItem) {
    try {
      if (item.category === 'weapon') {
        this.save = equipWeapon(this.save, item.id as any);
      } else if (item.category === 'defense') {
        this.save = equipDefense(this.save, item.id as any);
      } else if (item.category === 'cosmetic') {
        this.save = equipCosmetic(this.save, item.id as any);
      }
      this.registry.set('save', this.save);
      if (this.saveManager) await this.saveManager.save(this.save);
      this.refreshItems();
    } catch {
      // not owned — no-op
    }
  }

  private defaultSave(): SaveData {
    return {
      xp: 0, level: 1, coins: 0,
      currentCaptainId: 'base',
      worldProgress: {},
      unlockedCreatures: [],
      ownedItems: ['laser'],
      equippedWeapon: 'laser',
      equippedDefense: null,
      equippedCosmetic: null,
      statBoosts: {},
      checkpoint: null,
    };
  }
}
