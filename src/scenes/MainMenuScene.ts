import { Button } from '@/ui/button';
import { SaveManager, IDBBackend } from '@/systems/save-system';
import { SaveData } from '@/models/types';

const DEFAULT_SAVE: SaveData = {
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

export class MainMenuScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Graphics;
  private shipAngle = 0;
  private shipFloatT = 0;

  constructor() { super('MainMenu'); }

  async create() {
    const W = 390;
    const H = 844;
    const cx = W / 2;

    // Background stars
    const bg = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(0, H);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.9);
      bg.fillStyle(0xffffff, alpha);
      bg.fillCircle(sx, sy, Phaser.Math.FloatBetween(0.5, 1.5));
    }

    // Title
    this.add.text(cx, 90, 'Galaxy Wrangler', {
      fontSize: '38px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#4444cc',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Animated ship
    this.ship = this.add.graphics();
    this.drawShip(cx, 220, 0);

    // Main buttons
    const btnW = 220;
    const btnH = 56;
    new Button(this, cx, 360, 'Play', () => this.scene.start('WorldSelect'), btnW, btnH);
    new Button(this, cx, 430, 'Shop', () => this.scene.start('Shop'), btnW, btnH);
    new Button(this, cx, 500, 'Captains', () => this.scene.start('CaptainSelect'), btnW, btnH);

    // Settings gear in top-right
    new Button(this, W - 36, 36, '\u2699', () => this.scene.start('Settings'), 44, 44);

    // Load save and show player info at bottom
    const mgr = new SaveManager(new IDBBackend());
    let save = await mgr.load();
    if (!save) save = { ...DEFAULT_SAVE };

    // Store in registry for other scenes
    this.registry.set('save', save);
    this.registry.set('saveManager', mgr);

    this.add.text(cx, H - 60, `Level ${save.level}`, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaff',
    }).setOrigin(0.5);

    this.add.text(cx, H - 32, `\u25cf ${save.coins} coins`, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffdd44',
    }).setOrigin(0.5);
  }

  private drawShip(x: number, y: number, angle: number) {
    this.ship.clear();
    this.ship.x = x;
    this.ship.y = y;

    // Body
    this.ship.fillStyle(0x6699ff, 1);
    this.ship.fillTriangle(0, -30, -18, 20, 18, 20);

    // Cockpit
    this.ship.fillStyle(0xaaddff, 1);
    this.ship.fillTriangle(0, -18, -7, 6, 7, 6);

    // Left wing
    this.ship.fillStyle(0x4477dd, 1);
    this.ship.fillTriangle(-18, 20, -32, 30, -10, 16);

    // Right wing
    this.ship.fillStyle(0x4477dd, 1);
    this.ship.fillTriangle(18, 20, 32, 30, 10, 16);

    // Engine glow
    this.ship.fillStyle(0xff6600, 0.8);
    this.ship.fillRect(-6, 20, 12, 8);

    this.ship.setRotation(angle);
  }

  update(time: number, delta: number) {
    this.shipFloatT += delta * 0.001;
    this.shipAngle = Math.sin(this.shipFloatT * 0.8) * 0.12;
    const floatY = 220 + Math.sin(this.shipFloatT) * 8;
    this.drawShip(390 / 2, floatY, this.shipAngle);
  }
}
