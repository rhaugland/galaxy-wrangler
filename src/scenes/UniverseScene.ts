import { Button } from '@/ui/button';
import { FONT } from '@/ui/theme';
import { UNIVERSES } from '@/config/worlds';
import type { PlanetDef, TierDef, SaveData } from '@/models/types';

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

  // Detail overlay
  private overlay!: Phaser.GameObjects.Container;
  private overlayVisible = false;

  constructor() { super('Universe'); }

  preload() {
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
    const HEADER_H = 80;
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x06060f, 1);
    headerBg.fillRect(0, 0, W, HEADER_H + 4);
    headerBg.setDepth(15);

    // Universe dropdown pill
    const dropdownBg = this.add.graphics();
    dropdownBg.fillStyle(0x111122, 0.95);
    dropdownBg.fillRoundedRect(80, 12, W - 160, 32, 16);
    dropdownBg.lineStyle(1, 0xff69b4, 0.3);
    dropdownBg.strokeRoundedRect(80, 12, W - 160, 32, 16);
    dropdownBg.setDepth(15);

    this.add.text(cx, 28, `${universe.name.toUpperCase()}  \u25BE`, {
      fontSize: '11px', fontFamily: FONT, fontStyle: 'bold',
      color: '#ff69b4',
    }).setOrigin(0.5).setDepth(15);

    // Galaxy name
    this.add.text(cx, 58, galaxy.name.toUpperCase(), {
      fontSize: '20px', fontFamily: FONT, fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(15);

    // ── Fixed footer ──
    const FOOTER_H = 64;
    const footerBg = this.add.graphics();
    footerBg.fillStyle(0x06060f, 1);
    footerBg.fillRect(0, H - FOOTER_H, W, FOOTER_H + 10);
    footerBg.setDepth(15);

    new Button(this, cx, H - 36, 'BACK', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenu'));
    }, 140, 40).setDepth(15);

    // ── Scrollable content ──
    this.scrollContainer = this.add.container(0, 0);
    let yOffset = HEADER_H + 10;

    galaxy.planets.forEach((planet) => {
      const colors = PLANET_COLORS[planet.theme] ?? { primary: 0x666666, accent: 0x999999 };
      const prog = save?.worldProgress[planet.id] ?? [];
      const cleared = prog.filter(Boolean).length;
      const primaryHex = `#${colors.primary.toString(16).padStart(6, '0')}`;
      const accentHex = `#${colors.accent.toString(16).padStart(6, '0')}`;

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

      // Tier rows — tappable museum entries
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

        // Tier name (what they guard)
        rowContainer.add(this.add.text(80, 48, `Guards: ${tier.name}`, {
          fontSize: '10px', fontFamily: FONT,
          color: isLocked ? '#222233' : accentHex,
        }));

        // Status indicator on right
        if (isCleared) {
          rowContainer.add(this.add.text(W - 36, 16, '\u2713', {
            fontSize: '18px', fontFamily: FONT, fontStyle: 'bold',
            color: '#44ff44',
          }).setOrigin(0.5));
        } else if (isLocked) {
          rowContainer.add(this.add.text(W - 36, 16, '\uD83D\uDD12', {
            fontSize: '14px', fontFamily: FONT,
            color: '#333344',
          }).setOrigin(0.5));
        }

        // "View" chevron
        if (!isLocked) {
          rowContainer.add(this.add.text(W - 36, 46, '\u203A', {
            fontSize: '22px', fontFamily: FONT,
            color: '#555566',
          }).setOrigin(0.5));
        }

        // Make the row tappable — open detail overlay
        const hitZone = this.add.zone(W / 2, TIER_ROW_H / 2, W - 32, TIER_ROW_H).setInteractive();
        rowContainer.add(hitZone);

        let pDownX = 0, pDownY = 0;
        hitZone.on('pointerdown', (p: Phaser.Input.Pointer) => { pDownX = p.x; pDownY = p.y; });
        hitZone.on('pointerup', (p: Phaser.Input.Pointer) => {
          if (Math.abs(p.y - pDownY) > 20) return; // was scrolling
          if (Math.abs(p.x - pDownX) > 20) return;
          this.showDetail(planet, tier, ti, isCleared, isLocked, colors);
        });

        // Lock overlay
        if (isLocked) {
          const lockOverlay = this.add.graphics();
          lockOverlay.fillStyle(0x000000, 0.35);
          lockOverlay.fillRoundedRect(16, 0, W - 32, TIER_ROW_H - 2,
            isLast ? { tl: 0, tr: 0, bl: 10, br: 10 } : 0);
          rowContainer.add(lockOverlay);
        }
      });

      const sectionHeight = 56 + 3 * TIER_ROW_H + 20;
      yOffset += sectionHeight;
    });

    this.maxScroll = Math.max(0, yOffset - (H - HEADER_H - FOOTER_H));

    // Scroll mask — clip content between header and footer
    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, HEADER_H, W, H - HEADER_H - FOOTER_H);
    this.scrollContainer.setMask(maskShape.createGeometryMask());

    // Scroll input
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.overlayVisible) return;
      if (p.y < HEADER_H || p.y > H - FOOTER_H) return;
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

    // Prepare overlay container (hidden)
    this.overlay = this.add.container(0, 0).setDepth(20).setVisible(false);
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

  private showDetail(
    planet: PlanetDef,
    tier: TierDef,
    _tierIndex: number,
    isCleared: boolean,
    isLocked: boolean,
    colors: { primary: number; accent: number },
  ) {
    this.overlay.removeAll(true);
    this.overlayVisible = true;
    this.overlay.setVisible(true);

    const cx = W / 2;
    const primaryHex = `#${colors.primary.toString(16).padStart(6, '0')}`;
    const accentHex = `#${colors.accent.toString(16).padStart(6, '0')}`;

    // Dimmed backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.85);
    backdrop.fillRect(0, 0, W, H);
    this.overlay.add(backdrop);

    // Make backdrop dismiss the overlay
    const backdropZone = this.add.zone(W / 2, H / 2, W, H).setInteractive();
    this.overlay.add(backdropZone);
    backdropZone.on('pointerup', () => this.hideDetail());

    // Card
    const cardX = 20;
    const cardY = 60;
    const cardW = W - 40;
    const cardH = H - 120;
    const cardContainer = this.add.container(0, 0);
    this.overlay.add(cardContainer);

    // Card background
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x0a0a1e, 0.98);
    cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 16);
    cardBg.lineStyle(1.5, colors.primary, 0.4);
    cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 16);
    cardContainer.add(cardBg);

    // Stop clicks on card from dismissing
    const cardZone = this.add.zone(cx, H / 2, cardW, cardH).setInteractive();
    cardContainer.add(cardZone);

    // Close button
    const closeBtn = new Button(this, W - 48, cardY + 28, '\u2715', () => this.hideDetail(), 36, 36);
    cardContainer.add(closeBtn);

    // ── Header section ──
    // Tier label
    const tierLabel = TIER_LABELS[tier.tier] ?? tier.tier;
    cardContainer.add(this.add.text(cx - 10, cardY + 20, tierLabel, {
      fontSize: '11px', fontFamily: FONT,
      color: '#888899',
    }).setOrigin(0.5));

    // Tier name (what is being guarded)
    cardContainer.add(this.add.text(cx - 10, cardY + 42, tier.name.toUpperCase(), {
      fontSize: '18px', fontFamily: FONT, fontStyle: 'bold',
      color: primaryHex,
    }).setOrigin(0.5));

    // Planet context
    cardContainer.add(this.add.text(cx, cardY + 66, planet.name, {
      fontSize: '11px', fontFamily: FONT,
      color: '#555566',
    }).setOrigin(0.5));

    // Divider
    const div1 = this.add.graphics();
    div1.lineStyle(1, colors.primary, 0.2);
    div1.lineBetween(cardX + 20, cardY + 84, cardX + cardW - 20, cardY + 84);
    cardContainer.add(div1);

    // ── Tier lore ──
    cardContainer.add(this.add.text(cx, cardY + 96, tier.lore, {
      fontSize: '12px', fontFamily: FONT,
      color: '#aaaabb', lineSpacing: 4,
      wordWrap: { width: cardW - 50 }, align: 'center',
    }).setOrigin(0.5, 0));

    // ── Guardian section ──
    const guardianY = cardY + 200;

    const div2 = this.add.graphics();
    div2.lineStyle(1, colors.primary, 0.15);
    div2.lineBetween(cardX + 20, guardianY - 10, cardX + cardW - 20, guardianY - 10);
    cardContainer.add(div2);

    cardContainer.add(this.add.text(cx, guardianY + 4, 'GUARDIAN', {
      fontSize: '10px', fontFamily: FONT,
      color: '#555566', letterSpacing: 3,
    }).setOrigin(0.5));

    cardContainer.add(this.add.text(cx, guardianY + 24, tier.guardian.name.toUpperCase(), {
      fontSize: '20px', fontFamily: FONT, fontStyle: 'bold',
      color: accentHex,
    }).setOrigin(0.5));

    // Creature image
    const creatureId = tier.creatureReward.id;
    const textureKey = `creature_${creatureId}`;
    if (this.textures.exists(textureKey)) {
      const img = this.add.image(cx, guardianY + 130, textureKey).setDisplaySize(200, 200);
      if (isLocked) img.setAlpha(0.2);
      cardContainer.add(img);
    }

    // Guardian lore
    cardContainer.add(this.add.text(cx, guardianY + 246, tier.guardian.lore, {
      fontSize: '11px', fontFamily: FONT,
      color: '#999aaa', lineSpacing: 3,
      wordWrap: { width: cardW - 50 }, align: 'center',
    }).setOrigin(0.5, 0));

    // ── Footer section ──
    const footerY = cardY + cardH - 60;

    const div3 = this.add.graphics();
    div3.lineStyle(1, colors.primary, 0.15);
    div3.lineBetween(cardX + 20, footerY - 16, cardX + cardW - 20, footerY - 16);
    cardContainer.add(div3);

    // Stats row
    cardContainer.add(this.add.text(cx, footerY, `HP ${tier.guardian.hp}  \u2022  ${tier.guardian.coinBonus} CREDITS`, {
      fontSize: '11px', fontFamily: FONT,
      color: '#666677',
    }).setOrigin(0.5));

    // Status
    if (isCleared) {
      cardContainer.add(this.add.text(cx, footerY + 24, '\u2713 CLAIMED', {
        fontSize: '14px', fontFamily: FONT, fontStyle: 'bold',
        color: '#44ff44',
      }).setOrigin(0.5));
    } else if (isLocked) {
      cardContainer.add(this.add.text(cx, footerY + 24, 'CLEAR PREVIOUS TIER FIRST', {
        fontSize: '11px', fontFamily: FONT,
        color: '#444455',
      }).setOrigin(0.5));
    } else {
      cardContainer.add(this.add.text(cx, footerY + 24, 'AVAILABLE TO CHALLENGE', {
        fontSize: '11px', fontFamily: FONT, fontStyle: 'bold',
        color: primaryHex,
      }).setOrigin(0.5));
    }
  }

  private hideDetail() {
    this.overlay.setVisible(false);
    this.overlay.removeAll(true);
    this.overlayVisible = false;
  }
}
