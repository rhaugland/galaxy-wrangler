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
  private shipFloatT = 0;
  private stars: { x: number; y: number; size: number; speed: number; baseAlpha: number; twinkleSpeed: number }[] = [];
  private starGraphics!: Phaser.GameObjects.Graphics;
  private engineParticles: { x: number; y: number; alpha: number; vy: number; life: number }[] = [];
  private particleGraphics!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private titleGlowT = 0;
  private nebulae: { x: number; y: number; radius: number; color: number; alpha: number }[] = [];
  private nebulaGraphics!: Phaser.GameObjects.Graphics;

  constructor() { super('MainMenu'); }

  async create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const W = 390;
    const H = 844;
    const cx = W / 2;

    // === NEBULA CLOUDS (background atmosphere) ===
    this.nebulaGraphics = this.add.graphics();
    this.nebulae = [];
    const nebulaColors = [0xff1493, 0x8b00ff, 0x00ffff, 0xff6ec7, 0x4400aa];
    for (let i = 0; i < 6; i++) {
      this.nebulae.push({
        x: Phaser.Math.Between(20, W - 20),
        y: Phaser.Math.Between(40, H - 40),
        radius: Phaser.Math.Between(60, 140),
        color: nebulaColors[i % nebulaColors.length],
        alpha: Phaser.Math.FloatBetween(0.03, 0.07),
      });
    }
    this.drawNebulae();

    // === STARS — pink, magenta, cyan, white mix ===
    this.starGraphics = this.add.graphics();
    this.stars = [];
    const starColors = [0xff69b4, 0xff1493, 0xff00ff, 0x00ffff, 0xffffff, 0xff88cc, 0xcc44ff];
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Phaser.Math.Between(0, W),
        y: Phaser.Math.Between(0, H),
        size: Phaser.Math.FloatBetween(0.5, 2.5),
        speed: Phaser.Math.FloatBetween(0.1, 0.5),
        baseAlpha: Phaser.Math.FloatBetween(0.3, 1),
        twinkleSpeed: Phaser.Math.FloatBetween(1.5, 4),
      });
    }

    // === TITLE with glow ===
    // Shadow/glow layer
    this.add.text(cx, 105, 'GALAXY', {
      fontSize: '52px',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold',
      color: '#ff1493',
    }).setOrigin(0.5).setAlpha(0.3).setScale(1.02);

    this.add.text(cx, 105, 'GALAXY', {
      fontSize: '52px',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold',
      color: '#ff69b4',
      stroke: '#ff1493',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.titleText = this.add.text(cx, 165, 'WRANGLER', {
      fontSize: '36px',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold',
      color: '#00ffff',
      stroke: '#004444',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Subtitle line
    this.add.text(cx, 200, '_ _ _ _ _ _ _ _ _ _ _ _ _ _', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ff69b4',
    }).setOrigin(0.5).setAlpha(0.5);

    // === DETAILED SPACESHIP ===
    this.ship = this.add.graphics();
    this.particleGraphics = this.add.graphics();
    this.drawDetailedShip(cx, 310, 0);

    // === NEON BUTTONS ===
    const btnW = 240;
    const btnH = 56;
    new Button(this, cx, 460, 'PLAY', () => this.transitionTo('WorldSelect'), btnW, btnH);
    new Button(this, cx, 530, 'COSMO CANTINA', () => this.transitionTo('Shop'), btnW, btnH);
    new Button(this, cx, 600, 'FLEET', () => this.transitionTo('CaptainSelect'), btnW, btnH);

    // Settings gear in top-right
    new Button(this, W - 36, 36, '\u2699', () => this.transitionTo('Settings'), 44, 44);

    // Load save
    const mgr = new SaveManager(new IDBBackend());
    let save = await mgr.load();
    if (!save) save = { ...DEFAULT_SAVE };

    this.registry.set('save', save);
    this.registry.set('saveManager', mgr);

    // Player info at bottom — retro styled
    this.add.text(cx, H - 80, `\u2605 LEVEL ${save.level} \u2605`, {
      fontSize: '16px',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold',
      color: '#ff69b4',
    }).setOrigin(0.5);

    this.add.text(cx, H - 52, `${save.coins} CREDITS`, {
      fontSize: '20px',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold',
      color: '#00ffff',
    }).setOrigin(0.5);

    // Version tag
    this.add.text(cx, H - 20, 'v1.0', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#333366',
    }).setOrigin(0.5);
  }

  private transitionTo(sceneKey: string, data?: object) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey, data);
    });
  }

  private drawNebulae() {
    this.nebulaGraphics.clear();
    for (const n of this.nebulae) {
      for (let r = n.radius; r > 0; r -= 8) {
        this.nebulaGraphics.fillStyle(n.color, n.alpha * (r / n.radius));
        this.nebulaGraphics.fillCircle(n.x, n.y, r);
      }
    }
  }

  private drawDetailedShip(x: number, y: number, bobOffset: number) {
    const g = this.ship;
    g.clear();
    g.x = x;
    g.y = y + bobOffset;

    // Engine exhaust glow (behind ship)
    g.fillStyle(0xff1493, 0.15);
    g.fillCircle(0, 42, 20);
    g.fillStyle(0xff6600, 0.2);
    g.fillCircle(0, 38, 12);

    // Main hull — elongated with curves
    g.fillStyle(0x1a1a2e, 1);
    g.fillTriangle(0, -40, -22, 28, 22, 28);

    // Hull panels
    g.fillStyle(0x2a2a4e, 1);
    g.fillTriangle(0, -36, -18, 24, 0, 24);
    g.fillStyle(0x3a3a6e, 1);
    g.fillTriangle(0, -36, 0, 24, 18, 24);

    // Left wing — swept back
    g.fillStyle(0x4400aa, 1);
    g.fillTriangle(-22, 20, -42, 34, -14, 10);
    g.fillStyle(0x5500cc, 0.8);
    g.fillTriangle(-22, 20, -38, 32, -18, 14);

    // Right wing
    g.fillStyle(0x4400aa, 1);
    g.fillTriangle(22, 20, 42, 34, 14, 10);
    g.fillStyle(0x5500cc, 0.8);
    g.fillTriangle(22, 20, 38, 32, 18, 14);

    // Wing tips — neon accent
    g.fillStyle(0xff1493, 0.9);
    g.fillCircle(-40, 33, 2.5);
    g.fillCircle(40, 33, 2.5);
    g.fillStyle(0xff1493, 0.3);
    g.fillCircle(-40, 33, 5);
    g.fillCircle(40, 33, 5);

    // Cockpit — glowing cyan canopy
    g.fillStyle(0x001122, 1);
    g.fillTriangle(0, -28, -8, 2, 8, 2);
    g.fillStyle(0x00ffff, 0.7);
    g.fillTriangle(0, -24, -5, -2, 5, -2);
    g.fillStyle(0x88ffff, 0.4);
    g.fillTriangle(0, -20, -3, -4, 3, -4);

    // Cockpit reflection streak
    g.lineStyle(1, 0xffffff, 0.3);
    g.lineBetween(-2, -18, 2, -8);

    // Hull detail lines
    g.lineStyle(1, 0x00ffff, 0.2);
    g.lineBetween(0, -30, 0, 20);
    g.lineStyle(1, 0xff1493, 0.15);
    g.lineBetween(-10, 0, -20, 22);
    g.lineBetween(10, 0, 20, 22);

    // Engine block
    g.fillStyle(0x111111, 1);
    g.fillRect(-10, 24, 20, 8);

    // Engine nozzles
    g.fillStyle(0x333333, 1);
    g.fillRect(-8, 28, 6, 6);
    g.fillRect(2, 28, 6, 6);

    // Engine flames (animated via particles, but base glow here)
    const flameIntensity = 0.6 + Math.sin(this.shipFloatT * 8) * 0.3;
    g.fillStyle(0xff6600, flameIntensity);
    g.fillRect(-6, 34, 4, 8 + Math.sin(this.shipFloatT * 12) * 3);
    g.fillRect(2, 34, 4, 8 + Math.cos(this.shipFloatT * 12) * 3);
    g.fillStyle(0xffaa00, flameIntensity * 0.8);
    g.fillRect(-5, 34, 2, 6);
    g.fillRect(3, 34, 2, 6);
    g.fillStyle(0xffffff, flameIntensity * 0.4);
    g.fillRect(-4, 34, 1, 4);
    g.fillRect(4, 34, 1, 4);

    // Hull edge glow
    g.lineStyle(1, 0xff69b4, 0.25);
    g.strokeTriangle(0, -40, -22, 28, 22, 28);
  }

  update(time: number, delta: number) {
    const dt = delta * 0.001;
    this.shipFloatT += dt;
    this.titleGlowT += dt;

    const W = 390;

    // === Animate stars ===
    this.starGraphics.clear();
    const starColors = [0xff69b4, 0xff1493, 0xff00ff, 0x00ffff, 0xffffff, 0xff88cc, 0xcc44ff];
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s.y += s.speed * dt * 30;
      if (s.y > 844) {
        s.y = -2;
        s.x = Phaser.Math.Between(0, W);
      }
      const twinkle = s.baseAlpha * (0.5 + 0.5 * Math.sin(this.shipFloatT * s.twinkleSpeed + i));
      const color = starColors[i % starColors.length];
      this.starGraphics.fillStyle(color, twinkle);
      this.starGraphics.fillCircle(s.x, s.y, s.size);
      // Star glow for bigger stars
      if (s.size > 1.5) {
        this.starGraphics.fillStyle(color, twinkle * 0.2);
        this.starGraphics.fillCircle(s.x, s.y, s.size * 2.5);
      }
    }

    // === Animate ship bob ===
    const bobY = Math.sin(this.shipFloatT * 1.2) * 10;
    this.drawDetailedShip(390 / 2, 310, bobY);

    // === Engine particles ===
    this.particleGraphics.clear();
    // Spawn new particles
    if (Math.random() < 0.6) {
      this.engineParticles.push({
        x: 390 / 2 + Phaser.Math.Between(-6, 6),
        y: 310 + bobY + 42,
        alpha: 1,
        vy: Phaser.Math.FloatBetween(1, 3),
        life: 1,
      });
    }
    // Update & draw particles
    for (let i = this.engineParticles.length - 1; i >= 0; i--) {
      const p = this.engineParticles[i];
      p.y += p.vy;
      p.life -= dt * 2;
      p.alpha = p.life;
      if (p.life <= 0) {
        this.engineParticles.splice(i, 1);
        continue;
      }
      const pColor = p.life > 0.5 ? 0xff6600 : 0xff1493;
      this.particleGraphics.fillStyle(pColor, p.alpha * 0.6);
      this.particleGraphics.fillCircle(p.x, p.y, 1.5 + (1 - p.life) * 2);
    }

    // === Title glow pulse ===
    const glowAlpha = 0.7 + 0.3 * Math.sin(this.titleGlowT * 2);
    this.titleText.setAlpha(glowAlpha);
  }
}
