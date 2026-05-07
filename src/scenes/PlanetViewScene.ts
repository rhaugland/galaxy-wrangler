import { Button } from '@/ui/button';
import { UNIVERSES } from '@/config/worlds';
import type { PlanetDef, TierDef, SaveData } from '@/models/types';
import { FONT } from '@/ui/theme';

const W = 390;
const H = 844;

const TIER_ICONS: Record<string, string> = {
  star: '\u2605',
  constellation: '\u2734',
  galaxy: '\u273F',
};

const PLANET_COLORS: Record<string, { primary: number; accent: number }> = {
  nebula:   { primary: 0xcc44ff, accent: 0xff69b4 },
  ice:      { primary: 0x44eeff, accent: 0x88ffff },
  inferno:  { primary: 0xff6622, accent: 0xffaa00 },
  land:     { primary: 0x88aa44, accent: 0xddaa44 },
  electric: { primary: 0x44aaff, accent: 0xffee44 },
};

export class PlanetViewScene extends Phaser.Scene {
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private targetScrollY = 0;
  private maxScroll = 0;
  private isDragging = false;
  private dragStartY = 0;
  private dragStartScroll = 0;
  private velocity = 0;
  private galaxyId = '';

  constructor() { super('PlanetView'); }

  preload() {
    // Preload guardian creature images for this planet
    const data = this.scene.settings.data as { planetId: string };
    const planet = this.findPlanet(data?.planetId ?? '');
    if (planet) {
      for (const tier of planet.tiers) {
        const creatureId = tier.creatureReward.id;
        if (!this.textures.exists(`creature_${creatureId}`)) {
          this.load.image(`creature_${creatureId}`, `/art/creature_${creatureId}.png`);
        }
      }
    }
  }

  create(data: { galaxyId: string; planetId: string }) {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.galaxyId = data.galaxyId;
    const cx = W / 2;

    const planet = this.findPlanet(data.planetId);
    if (!planet) return;

    const save: SaveData = this.registry.get('save');
    const prog = save?.worldProgress[planet.id] ?? [];
    const colors = PLANET_COLORS[planet.theme] ?? { primary: 0x666666, accent: 0x999999 };
    const primaryHex = `#${colors.primary.toString(16).padStart(6, '0')}`;
    const accentHex = `#${colors.accent.toString(16).padStart(6, '0')}`;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x050510, 1);
    bg.fillRect(0, 0, W, H);
    for (let i = 0; i < 50; i++) {
      bg.fillStyle(colors.primary, Phaser.Math.FloatBetween(0.03, 0.08));
      bg.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.Between(20, 60));
    }
    for (let i = 0; i < 40; i++) {
      bg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.15, 0.5));
      bg.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.FloatBetween(0.5, 1));
    }

    // Title bar
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x000000, 0.9);
    titleBg.fillRect(0, 0, W, 90);
    titleBg.setDepth(10);

    this.add.text(cx, 30, planet.name.toUpperCase(), {
      fontSize: '22px', fontFamily: FONT, fontStyle: 'bold',
      color: primaryHex, stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(cx, 58, planet.description, {
      fontSize: '9px', fontFamily: FONT,
      color: '#777788', wordWrap: { width: W - 40 }, align: 'center',
    }).setOrigin(0.5, 0).setDepth(10);

    // Bottom bar
    const bottomBg = this.add.graphics();
    bottomBg.fillStyle(0x000000, 0.9);
    bottomBg.fillRect(0, H - 64, W, 64);
    bottomBg.setDepth(10);

    new Button(this, cx, H - 38, 'BACK', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GalaxyView', { galaxyId: this.galaxyId });
      });
    }, 140, 44).setDepth(10);

    // Scrollable tier cards
    this.scrollContainer = this.add.container(0, 0);
    const CARD_H = 520;
    const CARD_GAP = 24;

    planet.tiers.forEach((tier, ti) => {
      const cardY = 110 + ti * (CARD_H + CARD_GAP);
      const isCleared = prog[ti] === true;
      const isLocked = ti > 0 && prog[ti - 1] !== true;

      const card = this.add.container(0, cardY);
      this.scrollContainer.add(card);

      // Card bg
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x0a0a1e, 0.95);
      cardBg.fillRoundedRect(16, 0, W - 32, CARD_H, 12);
      cardBg.lineStyle(1.5, isCleared ? 0x44ff44 : colors.primary, isLocked ? 0.2 : 0.5);
      cardBg.strokeRoundedRect(16, 0, W - 32, CARD_H, 12);
      card.add(cardBg);

      // Tier icon + name
      const tierIcon = TIER_ICONS[tier.tier] ?? '';
      card.add(this.add.text(cx, 20, `${tierIcon} ${tier.name.toUpperCase()}`, {
        fontSize: '16px', fontFamily: FONT, fontStyle: 'bold',
        color: isLocked ? '#444444' : primaryHex,
      }).setOrigin(0.5));

      // Tier label
      card.add(this.add.text(cx, 42, tier.tier.toUpperCase(), {
        fontSize: '10px', fontFamily: FONT,
        color: isLocked ? '#333333' : '#666688',
      }).setOrigin(0.5));

      // Tier lore
      card.add(this.add.text(cx, 60, tier.lore, {
        fontSize: '10px', fontFamily: FONT,
        color: isLocked ? '#333344' : '#888899',
        wordWrap: { width: W - 80 }, align: 'center',
      }).setOrigin(0.5, 0));

      // Divider
      const divG = this.add.graphics();
      divG.lineStyle(1, colors.primary, isLocked ? 0.1 : 0.25);
      divG.lineBetween(40, 130, W - 40, 130);
      card.add(divG);

      // Guardian section
      card.add(this.add.text(cx, 142, 'GUARDIAN', {
        fontSize: '10px', fontFamily: FONT,
        color: isLocked ? '#333333' : '#666666',
      }).setOrigin(0.5));

      card.add(this.add.text(cx, 158, tier.guardian.name.toUpperCase(), {
        fontSize: '18px', fontFamily: FONT, fontStyle: 'bold',
        color: isLocked ? '#444444' : accentHex,
      }).setOrigin(0.5));

      // Guardian creature image
      const creatureId = tier.creatureReward.id;
      const textureKey = `creature_${creatureId}`;
      if (this.textures.exists(textureKey)) {
        const img = this.add.image(cx, 260, textureKey).setDisplaySize(150, 150);
        if (isLocked) img.setAlpha(0.15);
        else if (!isCleared) img.setAlpha(0.7);
        card.add(img);
      }

      // Guardian lore
      card.add(this.add.text(cx, 348, tier.guardian.lore, {
        fontSize: '9px', fontFamily: FONT,
        color: isLocked ? '#222233' : '#777788',
        wordWrap: { width: W - 80 }, align: 'center',
      }).setOrigin(0.5, 0));

      // Status / action
      if (isCleared) {
        card.add(this.add.text(cx, 440, '\u2713 CLAIMED', {
          fontSize: '14px', fontFamily: FONT, fontStyle: 'bold',
          color: '#44ff44',
        }).setOrigin(0.5));

        // Replay button
        const replayBtn = new Button(this, cx, 478, 'REPLAY', () => {
          this.launchTier(planet, ti);
        }, 140, 36);
        card.add(replayBtn);
      } else if (isLocked) {
        card.add(this.add.text(cx, 460, 'CLEAR PREVIOUS TIER FIRST', {
          fontSize: '10px', fontFamily: FONT,
          color: '#444444',
        }).setOrigin(0.5));
      } else {
        // HP indicator
        card.add(this.add.text(cx, 432, `HP: ${tier.guardian.hp}  |  ${tier.guardian.coinBonus} CREDITS`, {
          fontSize: '10px', fontFamily: FONT,
          color: '#888899',
        }).setOrigin(0.5));

        const fightBtn = new Button(this, cx, 475, 'CHALLENGE', () => {
          this.launchTier(planet, ti);
        }, 180, 44);
        card.add(fightBtn);
      }

      // Lock overlay
      if (isLocked) {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.5);
        overlay.fillRoundedRect(16, 0, W - 32, CARD_H, 12);
        card.add(overlay);
      }
    });

    this.maxScroll = Math.max(0, planet.tiers.length * (CARD_H + CARD_GAP) - (H - 180));

    // Scroll mask
    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, 90, W, H - 154);
    this.scrollContainer.setMask(maskShape.createGeometryMask());

    // Scroll input
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y < 90 || p.y > H - 64) return;
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

  private findPlanet(planetId: string): PlanetDef | undefined {
    for (const u of UNIVERSES) {
      for (const g of u.galaxies) {
        const p = g.planets.find(p => p.id === planetId);
        if (p) return p;
      }
    }
    return undefined;
  }
}
