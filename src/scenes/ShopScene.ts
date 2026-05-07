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

const W = 390;
const H = 844;
const BAR_Y = 560; // where the bar counter sits

export class ShopScene extends Phaser.Scene {
  private save!: SaveData;
  private saveManager!: SaveManager;
  private activeTab: TabKey = 'weapon';
  private itemsContainer!: Phaser.GameObjects.Container;
  private coinText!: Phaser.GameObjects.Text;
  private bartenderEyeT = 0;
  private bartenderG!: Phaser.GameObjects.Graphics;
  private neonFlickerT = 0;
  private neonSign!: Phaser.GameObjects.Graphics;

  constructor() { super('Shop'); }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const cx = W / 2;

    this.save = this.registry.get('save') ?? this.defaultSave();
    this.saveManager = this.registry.get('saveManager');

    // === CANTINA BACKGROUND ===
    const bg = this.add.graphics();
    // Dark ceiling
    bg.fillStyle(0x080810, 1);
    bg.fillRect(0, 0, W, H);

    // Back wall — dark with subtle panels
    bg.fillStyle(0x0c0c1a, 1);
    bg.fillRect(0, 60, W, BAR_Y - 60);

    // Wall panel lines
    bg.lineStyle(1, 0x1a1a2e, 0.4);
    for (let x = 0; x < W; x += 65) {
      bg.lineBetween(x, 60, x, BAR_Y);
    }

    // Ambient neon glow on wall
    bg.fillStyle(0xff1493, 0.03);
    bg.fillCircle(80, 300, 120);
    bg.fillStyle(0x00ffff, 0.03);
    bg.fillCircle(310, 250, 100);
    bg.fillStyle(0xff69b4, 0.02);
    bg.fillCircle(195, 200, 150);

    // === SHELF behind bartender ===
    const shelf = this.add.graphics();
    // Shelf boards
    shelf.fillStyle(0x1a1420, 1);
    shelf.fillRect(30, 380, W - 60, 6);
    shelf.fillRect(30, 440, W - 60, 6);
    shelf.lineStyle(1, 0x2a2035, 0.5);
    shelf.strokeRect(30, 380, W - 60, 6);
    shelf.strokeRect(30, 440, W - 60, 6);

    // Bottles on shelves
    const bottleColors = [0xff1493, 0x00ffff, 0x44ff44, 0xffaa00, 0x8844ff, 0xff4444, 0x44aaff, 0xffdd00];
    for (let i = 0; i < 8; i++) {
      const bx = 55 + i * 40;
      const by = i < 4 ? 378 : 438;
      const bi = i < 4 ? i : i - 4;
      const bxActual = 55 + bi * 80 + Phaser.Math.Between(-10, 10);
      const color = bottleColors[i];
      // Bottle body
      shelf.fillStyle(0x111118, 0.9);
      shelf.fillRect(bxActual - 5, by - 28, 10, 28);
      // Bottle neck
      shelf.fillRect(bxActual - 3, by - 36, 6, 10);
      // Liquid glow
      shelf.fillStyle(color, 0.4);
      shelf.fillRect(bxActual - 4, by - 24, 8, 20);
      // Glow
      shelf.fillStyle(color, 0.06);
      shelf.fillCircle(bxActual, by - 20, 14);
    }

    // === NEON SIGN — "COSMO CANTINA" ===
    this.neonSign = this.add.graphics();
    this.drawNeonSign(1);

    this.add.text(cx, 88, 'COSMO CANTINA', {
      fontSize: '24px', fontFamily: FONT, fontStyle: 'bold',
      color: '#ff69b4', stroke: '#330022', strokeThickness: 1,
    }).setOrigin(0.5);

    this.add.text(cx, 114, 'What can I get ya, pilot?', {
      fontSize: '11px', fontFamily: FONT,
      color: '#887799',
    }).setOrigin(0.5);

    // === BAR COUNTER ===
    const bar = this.add.graphics();
    // Counter top
    bar.fillStyle(0x2a1a2e, 1);
    bar.fillRect(0, BAR_Y, W, 14);
    // Neon edge on counter
    bar.lineStyle(2, 0xff1493, 0.6);
    bar.lineBetween(0, BAR_Y, W, BAR_Y);
    bar.lineStyle(1, 0xff1493, 0.15);
    bar.lineBetween(0, BAR_Y + 14, W, BAR_Y + 14);
    // Counter front panel
    bar.fillStyle(0x12101a, 1);
    bar.fillRect(0, BAR_Y + 14, W, H - BAR_Y - 14);
    // Panel detail lines
    bar.lineStyle(1, 0x1e1a28, 0.5);
    for (let x = 50; x < W; x += 78) {
      bar.lineBetween(x, BAR_Y + 20, x, H);
    }
    // Neon accent strip on front
    bar.lineStyle(1, 0x00ffff, 0.15);
    bar.lineBetween(20, BAR_Y + 50, W - 20, BAR_Y + 50);

    // === BARTENDER ===
    this.bartenderG = this.add.graphics();
    this.drawBartender(0);

    // === CREDITS (on bar counter) ===
    // Credits display - looks like a counter-top sign
    const creditsBg = this.add.graphics();
    creditsBg.fillStyle(0x0a0a14, 0.9);
    creditsBg.fillRoundedRect(W - 130, BAR_Y + 20, 115, 36, 6);
    creditsBg.lineStyle(1, 0xffdd44, 0.3);
    creditsBg.strokeRoundedRect(W - 130, BAR_Y + 20, 115, 36, 6);

    this.coinText = this.add.text(W - 72, BAR_Y + 38, `${this.save.coins} CR`, {
      fontSize: '16px', fontFamily: FONT, fontStyle: 'bold',
      color: '#ffdd44',
    }).setOrigin(0.5);

    // === TAB BUTTONS (menu categories above bartender) ===
    const tabW = 82;
    const tabY = 144;
    TABS.forEach((tab, i) => {
      const tx = 12 + i * (tabW + 4) + tabW / 2;
      new Button(this, tx, tabY, tab.label, () => {
        this.activeTab = tab.key;
        this.refreshItems();
      }, tabW, 32);
    });

    // === ITEMS AREA (menu board) ===
    this.itemsContainer = this.add.container(0, 0);
    this.refreshItems();

    // === BACK BUTTON (on the bar counter) ===
    new Button(this, 70, BAR_Y + 38, 'BACK', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
      });
    }, 100, 36);
  }

  update(_time: number, delta: number) {
    const dt = delta * 0.001;
    this.bartenderEyeT += dt;
    this.neonFlickerT += dt;

    // Redraw bartender with animated eyes
    this.drawBartender(this.bartenderEyeT);

    // Neon sign flicker
    const flicker = 0.85 + 0.15 * Math.sin(this.neonFlickerT * 3);
    this.drawNeonSign(flicker);
  }

  private drawNeonSign(intensity: number) {
    const g = this.neonSign;
    g.clear();
    const cx = W / 2;
    // Glow behind sign
    g.fillStyle(0xff1493, 0.04 * intensity);
    g.fillCircle(cx, 88, 100);
    g.fillStyle(0xff1493, 0.06 * intensity);
    g.fillCircle(cx, 88, 60);
    // Sign border
    g.lineStyle(1.5, 0xff1493, 0.3 * intensity);
    g.strokeRoundedRect(cx - 130, 68, 260, 40, 6);
  }

  private drawBartender(t: number) {
    const g = this.bartenderG;
    g.clear();
    const bx = W / 2;
    const by = BAR_Y - 10;

    // Body — behind counter
    g.fillStyle(0x1a1028, 1);
    g.fillRect(bx - 30, by - 60, 60, 72);
    // Shoulders
    g.fillStyle(0x1a1028, 1);
    g.fillTriangle(bx - 30, by - 60, bx - 50, by - 30, bx - 30, by - 30);
    g.fillTriangle(bx + 30, by - 60, bx + 50, by - 30, bx + 30, by - 30);

    // Apron
    g.fillStyle(0x2a1838, 1);
    g.fillRect(bx - 22, by - 40, 44, 52);
    g.lineStyle(1, 0x3a2848, 0.6);
    g.strokeRect(bx - 22, by - 40, 44, 52);

    // Neck
    g.fillStyle(0x6644aa, 0.8);
    g.fillRect(bx - 8, by - 80, 16, 22);

    // Head — round alien
    g.fillStyle(0x7755bb, 1);
    g.fillCircle(bx, by - 100, 26);
    // Head highlight
    g.fillStyle(0x9977dd, 0.3);
    g.fillCircle(bx - 6, by - 108, 12);

    // Eyes — blink occasionally
    const blinkCycle = t % 4;
    const isBlinking = blinkCycle > 3.85;
    const eyeH = isBlinking ? 1 : 5;
    const eyeY = by - 102;

    // Left eye
    g.fillStyle(0x00ffcc, 0.9);
    g.fillRect(bx - 12, eyeY - eyeH / 2, 8, eyeH);
    if (!isBlinking) {
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(bx - 11, eyeY - 1, 3, 2);
    }

    // Right eye
    g.fillStyle(0x00ffcc, 0.9);
    g.fillRect(bx + 4, eyeY - eyeH / 2, 8, eyeH);
    if (!isBlinking) {
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(bx + 5, eyeY - 1, 3, 2);
    }

    // Eye glow
    if (!isBlinking) {
      g.fillStyle(0x00ffcc, 0.08);
      g.fillCircle(bx - 8, eyeY, 14);
      g.fillCircle(bx + 8, eyeY, 14);
    }

    // Mouth — slight smile
    g.lineStyle(1.5, 0x5533aa, 0.6);
    g.beginPath();
    g.arc(bx, by - 88, 8, 0.2, Math.PI - 0.2, false);
    g.strokePath();

    // Antennae
    const antennaWave = Math.sin(t * 2) * 3;
    g.lineStyle(2, 0x7755bb, 0.8);
    g.lineBetween(bx - 10, by - 124, bx - 16 + antennaWave, by - 145);
    g.lineBetween(bx + 10, by - 124, bx + 16 - antennaWave, by - 145);
    // Antenna tips
    g.fillStyle(0xff69b4, 0.8);
    g.fillCircle(bx - 16 + antennaWave, by - 145, 3);
    g.fillCircle(bx + 16 - antennaWave, by - 145, 3);
    g.fillStyle(0xff69b4, 0.2);
    g.fillCircle(bx - 16 + antennaWave, by - 145, 6);
    g.fillCircle(bx + 16 - antennaWave, by - 145, 6);

    // Arms — one holding a glass
    // Left arm (resting on counter)
    g.fillStyle(0x6644aa, 0.8);
    g.fillRect(bx - 50, by - 35, 22, 10);
    g.fillCircle(bx - 52, by - 30, 6);

    // Right arm (holding/polishing glass)
    const armBob = Math.sin(t * 1.5) * 3;
    g.fillStyle(0x6644aa, 0.8);
    g.fillRect(bx + 28, by - 38 + armBob, 22, 10);
    g.fillCircle(bx + 52, by - 33 + armBob, 6);

    // Glass in right hand
    const glassY = by - 48 + armBob;
    g.lineStyle(1.5, 0x88ffff, 0.5);
    g.lineBetween(bx + 46, glassY, bx + 42, glassY + 16);
    g.lineBetween(bx + 58, glassY, bx + 62, glassY + 16);
    g.lineBetween(bx + 42, glassY + 16, bx + 62, glassY + 16);
    // Liquid in glass
    g.fillStyle(0x00ffcc, 0.25);
    g.fillTriangle(bx + 44, glassY + 6, bx + 60, glassY + 6, bx + 52, glassY + 16);
  }

  private refreshItems() {
    this.itemsContainer.removeAll(true);

    const cx = W / 2;
    const items = SHOP_ITEMS.filter(it => it.category === this.activeTab);
    const MENU_TOP = 172;
    const CARD_H = 90;
    const CARD_GAP = 6;

    // Menu board background
    const boardBg = this.add.graphics();
    const boardH = Math.min(items.length * (CARD_H + CARD_GAP) + 16, BAR_Y - MENU_TOP - 80);
    boardBg.fillStyle(0x0a0a18, 0.85);
    boardBg.fillRoundedRect(14, MENU_TOP - 8, W - 28, boardH, 8);
    boardBg.lineStyle(1, 0xff1493, 0.15);
    boardBg.strokeRoundedRect(14, MENU_TOP - 8, W - 28, boardH, 8);
    this.itemsContainer.add(boardBg);

    items.forEach((item, i) => {
      const cardY = MENU_TOP + i * (CARD_H + CARD_GAP);
      if (cardY + CARD_H > BAR_Y - 80) return; // don't overlap bartender
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

    const CARD_H = 84;

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(owned ? 0x0a1a0a : 0x0e0e1e, 0.9);
    bg.fillRoundedRect(20, cardY, W - 40, CARD_H, 6);
    bg.lineStyle(1, owned ? 0x44aa44 : 0x222244, 0.5);
    bg.strokeRoundedRect(20, cardY, W - 40, CARD_H, 6);
    this.itemsContainer.add(bg);

    // Item name
    const nameT = this.add.text(32, cardY + 10, item.name, {
      fontSize: '15px', fontFamily: FONT, fontStyle: 'bold',
      color: owned ? '#88cc88' : '#ffffff',
    });
    this.itemsContainer.add(nameT);

    // Description
    const descT = this.add.text(32, cardY + 32, item.description, {
      fontSize: '10px', fontFamily: FONT,
      color: '#777788', wordWrap: { width: 210 },
    });
    this.itemsContainer.add(descT);

    // Cost
    if (!owned) {
      const costT = this.add.text(W - 32, cardY + 12, `${item.cost} CR`, {
        fontSize: '13px', fontFamily: FONT, fontStyle: 'bold',
        color: canAfford ? '#ffdd44' : '#554422',
      }).setOrigin(1, 0);
      this.itemsContainer.add(costT);
    }

    // Action button
    let btnLabel = 'BUY';
    let btnCallback: () => void = () => {};

    if (isEquipped) {
      btnLabel = 'EQUIPPED';
      btnCallback = () => {};
    } else if (owned) {
      btnLabel = 'EQUIP';
      btnCallback = () => this.handleEquip(item);
    } else if (canAfford) {
      btnLabel = 'BUY';
      btnCallback = () => this.handleBuy(item);
    }

    const btn = new Button(this, W - 80, cardY + 60, btnLabel, btnCallback, 90, 30);
    if (isEquipped || (!owned && !canAfford)) {
      btn.setAlpha(0.4);
    }
    this.itemsContainer.add(btn);
  }

  private async handleBuy(item: ShopItem) {
    try {
      this.save = purchaseItem(this.save, item);
      this.registry.set('save', this.save);
      if (this.saveManager) await this.saveManager.save(this.save);
      this.coinText.setText(`${this.save.coins} CR`);
      this.refreshItems();
    } catch {
      // can't afford or already owned
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
      // not owned
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
