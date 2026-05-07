import { Button } from '@/ui/button';
import { UNIVERSES } from '@/config/worlds';
import type { GalaxyDef, PlanetDef, SaveData } from '@/models/types';

const W = 390;
const H = 844;

const PLANET_COLORS: Record<string, { primary: number; accent: number }> = {
  nebula:   { primary: 0xcc44ff, accent: 0xff69b4 },
  ice:      { primary: 0x44eeff, accent: 0x88ffff },
  inferno:  { primary: 0xff6622, accent: 0xffaa00 },
  land:     { primary: 0x88aa44, accent: 0xddaa44 },
  electric: { primary: 0x44aaff, accent: 0xffee44 },
};

export class GalaxyViewScene extends Phaser.Scene {
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private targetScrollY = 0;
  private maxScroll = 0;
  private isDragging = false;
  private dragStartY = 0;
  private dragStartScroll = 0;
  private velocity = 0;

  constructor() { super('GalaxyView'); }

  create(data: { galaxyId: string }) {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const cx = W / 2;

    const galaxy = this.findGalaxy(data.galaxyId);
    if (!galaxy) return;

    const save: SaveData = this.registry.get('save');

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x050510, 1);
    bg.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      bg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.15, 0.6));
      bg.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.FloatBetween(0.5, 1.2));
    }

    // Title bar
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x000000, 0.9);
    titleBg.fillRect(0, 0, W, 70);
    titleBg.setDepth(10);

    this.add.text(cx, 36, galaxy.name.toUpperCase(), {
      fontSize: '24px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
      color: '#ff69b4', stroke: '#330022', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);

    // Bottom bar
    const bottomBg = this.add.graphics();
    bottomBg.fillStyle(0x000000, 0.9);
    bottomBg.fillRect(0, H - 64, W, 64);
    bottomBg.setDepth(10);

    new Button(this, cx, H - 38, 'BACK', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Universe'));
    }, 140, 44).setDepth(10);

    // Scrollable planet list
    this.scrollContainer = this.add.container(0, 0);
    const CARD_H = 200;
    const CARD_GAP = 20;

    galaxy.planets.forEach((planet, pi) => {
      const cardY = 90 + pi * (CARD_H + CARD_GAP);
      const colors = PLANET_COLORS[planet.theme] ?? { primary: 0x666666, accent: 0x999999 };
      const prog = save?.worldProgress[planet.id] ?? [];
      const cleared = prog.filter(Boolean).length;

      const cardContainer = this.add.container(0, cardY);
      this.scrollContainer.add(cardContainer);

      // Card bg
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x0a0a1e, 0.95);
      cardBg.fillRoundedRect(16, 0, W - 32, CARD_H, 12);
      cardBg.lineStyle(1.5, colors.primary, 0.5);
      cardBg.strokeRoundedRect(16, 0, W - 32, CARD_H, 12);
      cardContainer.add(cardBg);

      // Planet icon (colored circle with glow)
      const iconG = this.add.graphics();
      iconG.fillStyle(colors.primary, 0.15);
      iconG.fillCircle(60, 50, 28);
      iconG.fillStyle(colors.primary, 0.6);
      iconG.fillCircle(60, 50, 18);
      iconG.fillStyle(colors.accent, 0.3);
      iconG.fillCircle(56, 44, 8);
      cardContainer.add(iconG);

      // Planet name
      cardContainer.add(this.add.text(110, 14, planet.name.toUpperCase(), {
        fontSize: '16px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
        color: `#${colors.primary.toString(16).padStart(6, '0')}`,
      }));

      // Description
      cardContainer.add(this.add.text(110, 38, planet.description, {
        fontSize: '9px', fontFamily: '"Courier New", monospace',
        color: '#777788', wordWrap: { width: W - 140 },
      }));

      // Progress
      cardContainer.add(this.add.text(110, 80, `${cleared}/3 CLAIMED`, {
        fontSize: '11px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
        color: cleared === 3 ? '#44ff44' : '#888899',
      }));

      // Tier dots
      const tierIcons = ['star', 'constellation', 'galaxy'];
      tierIcons.forEach((_, ti) => {
        const dotX = 112 + ti * 22;
        const done = prog[ti] === true;
        const dotG = this.add.graphics();
        dotG.fillStyle(done ? 0x44ff44 : 0x333344, done ? 0.9 : 0.5);
        dotG.fillCircle(dotX, 102, 5);
        if (done) {
          dotG.fillStyle(0x44ff44, 0.2);
          dotG.fillCircle(dotX, 102, 9);
        }
        cardContainer.add(dotG);
      });

      // Explore button
      const btn = new Button(this, cx, 155, 'EXPLORE', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('PlanetView', { galaxyId: galaxy.id, planetId: planet.id });
        });
      }, 160, 40);
      cardContainer.add(btn);
    });

    this.maxScroll = Math.max(0, galaxy.planets.length * (CARD_H + CARD_GAP) - (H - 160));

    // Scroll mask
    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, 70, W, H - 134);
    this.scrollContainer.setMask(maskShape.createGeometryMask());

    // Scroll input
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y < 70 || p.y > H - 64) return;
      this.isDragging = true;
      this.dragStartY = p.y;
      this.dragStartScroll = this.scrollY;
      this.velocity = 0;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const dy = this.dragStartY - p.y;
      this.targetScrollY = Phaser.Math.Clamp(this.dragStartScroll + dy, 0, this.maxScroll);
      this.velocity = p.velocity.y;
    });
    this.input.on('pointerup', () => {
      if (this.isDragging) {
        this.targetScrollY = Phaser.Math.Clamp(this.targetScrollY - this.velocity * 0.3, 0, this.maxScroll);
      }
      this.isDragging = false;
    });
  }

  update(_t: number, delta: number) {
    const dt = delta * 0.001;
    if (!this.isDragging) {
      this.scrollY += (this.targetScrollY - this.scrollY) * Math.min(1, dt * 12);
    } else {
      this.scrollY = this.targetScrollY;
    }
    this.scrollContainer.y = -this.scrollY;
  }

  private findGalaxy(galaxyId: string): GalaxyDef | undefined {
    for (const u of UNIVERSES) {
      const g = u.galaxies.find(g => g.id === galaxyId);
      if (g) return g;
    }
    return undefined;
  }
}
