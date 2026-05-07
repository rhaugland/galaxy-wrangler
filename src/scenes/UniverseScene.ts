import { Button } from '@/ui/button';
import { FONT } from '@/ui/theme';
import { UNIVERSES } from '@/config/worlds';
import type { PlanetDef, SaveData } from '@/models/types';

const W = 390;
const H = 844;

const PLANET_COLORS: Record<string, { primary: number; accent: number }> = {
  nebula:   { primary: 0xcc44ff, accent: 0xff69b4 },
  ice:      { primary: 0x44eeff, accent: 0x88ffff },
  inferno:  { primary: 0xff6622, accent: 0xffaa00 },
  land:     { primary: 0x88aa44, accent: 0xddaa44 },
  electric: { primary: 0x44aaff, accent: 0xffee44 },
};

const TIER_LABELS: Record<string, string> = {
  star: '\u2605 Star',
  constellation: '\u2734 Constellation',
  galaxy: '\u273F Galaxy',
};

export class UniverseScene extends Phaser.Scene {
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private targetScrollY = 0;
  private maxScroll = 0;
  private isDragging = false;
  private dragStartY = 0;
  private dragStartScroll = 0;
  private velocity = 0;
  private universeIndex = 0;

  constructor() { super('Universe'); }

  preload() {
    // Preload all guardian creature images
    const universe = UNIVERSES[this.universeIndex];
    for (const galaxy of universe.galaxies) {
      for (const planet of galaxy.planets) {
        for (const tier of planet.tiers) {
          const creatureId = tier.creatureReward.id;
          if (!this.textures.exists(`creature_${creatureId}`)) {
            this.load.image(`creature_${creatureId}`, `/art/creature_${creatureId}.png`);
          }
        }
      }
    }
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const cx = W / 2;
    const save: SaveData = this.registry.get('save');

    const universe = UNIVERSES[this.universeIndex];
    const galaxy = universe.galaxies[0];

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x06060f, 1);
    bg.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      bg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.4));
      bg.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.FloatBetween(0.3, 1));
    }

    // ── Fixed header ──
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x06060f, 1);
    headerBg.fillRect(0, 0, W, 120);
    headerBg.setDepth(10);

    // Universe dropdown button
    const dropdownBg = this.add.graphics();
    dropdownBg.fillStyle(0x111122, 0.95);
    dropdownBg.fillRoundedRect(24, 14, W - 48, 40, 8);
    dropdownBg.lineStyle(1, 0xff69b4, 0.3);
    dropdownBg.strokeRoundedRect(24, 14, W - 48, 40, 8);
    dropdownBg.setDepth(10);

    this.add.text(cx, 34, `${universe.name.toUpperCase()}  \u25BE`, {
      fontSize: '13px', fontFamily: FONT, fontStyle: 'bold',
      color: '#ff69b4',
    }).setOrigin(0.5).setDepth(10);

    // Galaxy name
    this.add.text(cx, 72, galaxy.name.toUpperCase(), {
      fontSize: '22px', fontFamily: FONT, fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(10);

    // Galaxy description
    this.add.text(cx, 98, galaxy.description.slice(0, 80) + '...', {
      fontSize: '10px', fontFamily: FONT,
      color: '#666677',
    }).setOrigin(0.5).setDepth(10);

    // Header fade edge
    const headerFade = this.add.graphics();
    headerFade.fillStyle(0x06060f, 0.6);
    headerFade.fillRect(0, 120, W, 8);
    headerFade.setDepth(10);

    // ── Fixed footer ──
    const footerBg = this.add.graphics();
    footerBg.fillStyle(0x06060f, 1);
    footerBg.fillRect(0, H - 60, W, 60);
    footerBg.setDepth(10);

    new Button(this, cx, H - 34, 'BACK', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenu'));
    }, 140, 40).setDepth(10);

    // ── Scrollable content ──
    this.scrollContainer = this.add.container(0, 0);
    let yOffset = 136;

    galaxy.planets.forEach((planet) => {
      const colors = PLANET_COLORS[planet.theme] ?? { primary: 0x666666, accent: 0x999999 };
      const prog = save?.worldProgress[planet.id] ?? [];
      const cleared = prog.filter(Boolean).length;
      const primaryHex = `#${colors.primary.toString(16).padStart(6, '0')}`;

      // Planet section header
      const sectionContainer = this.add.container(0, yOffset);
      this.scrollContainer.add(sectionContainer);

      // Planet header bar
      const headerG = this.add.graphics();
      headerG.fillStyle(colors.primary, 0.08);
      headerG.fillRoundedRect(16, 0, W - 32, 52, { tl: 10, tr: 10, bl: 0, br: 0 });
      headerG.lineStyle(1, colors.primary, 0.25);
      headerG.lineBetween(16, 52, W - 16, 52);
      sectionContainer.add(headerG);

      // Planet color dot
      const dotG = this.add.graphics();
      dotG.fillStyle(colors.primary, 0.2);
      dotG.fillCircle(40, 26, 14);
      dotG.fillStyle(colors.primary, 0.7);
      dotG.fillCircle(40, 26, 8);
      dotG.fillStyle(colors.accent, 0.4);
      dotG.fillCircle(37, 22, 4);
      sectionContainer.add(dotG);

      // Planet name
      sectionContainer.add(this.add.text(60, 12, planet.name.toUpperCase(), {
        fontSize: '15px', fontFamily: FONT, fontStyle: 'bold',
        color: primaryHex,
      }));

      // Progress
      sectionContainer.add(this.add.text(60, 32, `${cleared}/3 CLEARED`, {
        fontSize: '11px', fontFamily: FONT,
        color: cleared === 3 ? '#44ff44' : '#666677',
      }));

      // Progress dots
      for (let ti = 0; ti < 3; ti++) {
        const done = prog[ti] === true;
        const pdG = this.add.graphics();
        pdG.fillStyle(done ? 0x44ff44 : 0x333344, done ? 0.9 : 0.4);
        pdG.fillCircle(W - 64 + ti * 18, 26, 5);
        if (done) {
          pdG.fillStyle(0x44ff44, 0.15);
          pdG.fillCircle(W - 64 + ti * 18, 26, 9);
        }
        sectionContainer.add(pdG);
      }

      // Tier rows
      const TIER_ROW_H = 72;
      planet.tiers.forEach((tier, ti) => {
        const rowY = 56 + ti * TIER_ROW_H;
        const isCleared = prog[ti] === true;
        const isLocked = ti > 0 && prog[ti - 1] !== true;

        const rowContainer = this.add.container(0, rowY);
        sectionContainer.add(rowContainer);

        // Row background
        const rowBg = this.add.graphics();
        const isLast = ti === 2;
        rowBg.fillStyle(0x0a0a1a, 0.95);
        rowBg.fillRoundedRect(16, 0, W - 32, TIER_ROW_H - 2,
          isLast ? { tl: 0, tr: 0, bl: 10, br: 10 } : 0);
        if (!isLast) {
          rowBg.lineStyle(1, 0x1a1a2e, 0.6);
          rowBg.lineBetween(32, TIER_ROW_H - 2, W - 32, TIER_ROW_H - 2);
        }
        rowContainer.add(rowBg);

        // Creature image (small)
        const creatureId = tier.creatureReward.id;
        const textureKey = `creature_${creatureId}`;
        if (this.textures.exists(textureKey)) {
          const img = this.add.image(52, TIER_ROW_H / 2, textureKey).setDisplaySize(40, 40);
          if (isLocked) img.setAlpha(0.15);
          else if (!isCleared) img.setAlpha(0.6);
          rowContainer.add(img);
        }

        // Tier label
        const tierLabel = TIER_LABELS[tier.tier] ?? tier.tier;
        rowContainer.add(this.add.text(80, 10, tierLabel, {
          fontSize: '10px', fontFamily: FONT,
          color: isLocked ? '#333344' : '#888899',
        }));

        // Guardian name
        rowContainer.add(this.add.text(80, 28, tier.guardian.name.toUpperCase(), {
          fontSize: '14px', fontFamily: FONT, fontStyle: 'bold',
          color: isLocked ? '#333344' : (isCleared ? '#44ff44' : '#ffffff'),
        }));

        // HP + credits
        rowContainer.add(this.add.text(80, 48, `HP ${tier.guardian.hp}  \u2022  ${tier.guardian.coinBonus} CR`, {
          fontSize: '10px', fontFamily: FONT,
          color: isLocked ? '#222233' : '#555566',
        }));

        // Status / action button
        if (isCleared) {
          rowContainer.add(this.add.text(W - 36, 18, '\u2713', {
            fontSize: '20px', fontFamily: FONT, fontStyle: 'bold',
            color: '#44ff44',
          }).setOrigin(0.5));

          const replayBtn = new Button(this, W - 52, 48, 'REPLAY', () => {
            this.launchTier(planet, ti);
          }, 72, 26);
          rowContainer.add(replayBtn);
        } else if (isLocked) {
          rowContainer.add(this.add.text(W - 52, TIER_ROW_H / 2, '\uD83D\uDD12', {
            fontSize: '16px', fontFamily: FONT,
            color: '#333344',
          }).setOrigin(0.5));
        } else {
          const fightBtn = new Button(this, W - 52, TIER_ROW_H / 2, 'FIGHT', () => {
            this.launchTier(planet, ti);
          }, 80, 32);
          rowContainer.add(fightBtn);
        }

        // Lock overlay
        if (isLocked) {
          const lockOverlay = this.add.graphics();
          lockOverlay.fillStyle(0x000000, 0.35);
          lockOverlay.fillRoundedRect(16, 0, W - 32, TIER_ROW_H - 2,
            isLast ? { tl: 0, tr: 0, bl: 10, br: 10 } : 0);
          rowContainer.add(lockOverlay);
        }
      });

      const sectionHeight = 56 + 3 * TIER_ROW_H + 20; // header + 3 rows + gap
      yOffset += sectionHeight;
    });

    this.maxScroll = Math.max(0, yOffset - (H - 80));

    // Scroll mask
    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, 120, W, H - 180);
    this.scrollContainer.setMask(maskShape.createGeometryMask());

    // Scroll input
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y < 120 || p.y > H - 60) return;
      this.isDragging = true;
      this.dragStartY = p.y;
      this.dragStartScroll = this.scrollY;
      this.velocity = 0;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      this.targetScrollY = Phaser.Math.Clamp(this.dragStartScroll + (this.dragStartY - p.y), 0, this.maxScroll);
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

  private launchTier(planet: PlanetDef, tierIndex: number) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Travel', { worldId: planet.id, levelIndex: tierIndex });
    });
  }
}
