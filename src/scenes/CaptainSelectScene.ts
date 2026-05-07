import { Button } from '@/ui/button';
import { CAPTAINS } from '@/config/worlds';
import { SaveData, Captain } from '@/models/types';
import { SaveManager } from '@/systems/save-system';

const W = 390;
const CARD_W = 340;
const CARD_H = 460;
const CARD_GAP = 30;
const CARD_X = W / 2;

// Theme colors per captain
const THEMES: Record<string, { primary: number; accent: number; bg: number }> = {
  base:           { primary: 0x00ffff, accent: 0xff69b4, bg: 0x0a0a1a },
  nebula_jelly:   { primary: 0xcc44ff, accent: 0xff69b4, bg: 0x0f0520 },
  nebula_wisp:    { primary: 0xaa88ff, accent: 0x44ffcc, bg: 0x0a0520 },
  nebula_titan:   { primary: 0x8844cc, accent: 0xff44aa, bg: 0x0a0318 },
  ice_shard:      { primary: 0x44eeff, accent: 0xffffff, bg: 0x020a14 },
  ice_prism:      { primary: 0x88ddff, accent: 0xccffee, bg: 0x030810 },
  ice_golem:      { primary: 0x2299bb, accent: 0x88ffff, bg: 0x020810 },
  flame_sprite:   { primary: 0xff8844, accent: 0xffdd00, bg: 0x140800 },
  flame_drake:    { primary: 0xff5522, accent: 0xff8800, bg: 0x120500 },
  flame_colossus: { primary: 0xdd2200, accent: 0xffaa00, bg: 0x100400 },
};

export class CaptainSelectScene extends Phaser.Scene {
  private save!: SaveData;
  private saveManager!: SaveManager;
  private scrollContainer!: Phaser.GameObjects.Container;
  private cardStates: Map<string, { side: 'creature' | 'ship'; flipped: boolean }> = new Map();
  private scrollY = 0;
  private targetScrollY = 0;
  private maxScroll = 0;
  private isDragging = false;
  private dragStartY = 0;
  private dragStartScroll = 0;
  private velocity = 0;

  constructor() { super('CaptainSelect'); }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.save = this.registry.get('save') ?? this.defaultSave();
    this.saveManager = this.registry.get('saveManager');

    // Title bar (fixed)
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x000000, 0.9);
    titleBg.fillRect(0, 0, W, 70);
    titleBg.setDepth(10);

    this.add.text(W / 2, 36, 'FLEET', {
      fontSize: '28px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
      color: '#ff69b4', stroke: '#330022', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);

    // Back button (fixed)
    const backBtn = new Button(this, W / 2, 810, 'BACK', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenu'));
    }, 140, 44);
    backBtn.setDepth(10);

    // Bottom bar
    const bottomBg = this.add.graphics();
    bottomBg.fillStyle(0x000000, 0.9);
    bottomBg.fillRect(0, 780, W, 64);
    bottomBg.setDepth(10);

    // Scrollable container
    this.scrollContainer = this.add.container(0, 0);
    const captainIds = Object.keys(CAPTAINS);

    captainIds.forEach((id, i) => {
      this.cardStates.set(id, { side: 'creature', flipped: false });
      const cardY = 90 + i * (CARD_H + CARD_GAP);
      this.drawCard(id, CARD_X, cardY);
    });

    this.maxScroll = Math.max(0, captainIds.length * (CARD_H + CARD_GAP) - 660);

    // Scroll input
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y < 70 || p.y > 780) return;
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

    // Mask the scroll area
    const mask = this.add.graphics();
    mask.fillStyle(0xffffff);
    mask.fillRect(0, 70, W, 710);
    this.scrollContainer.setMask(mask.createGeometryMask());
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

  private drawCard(id: string, cx: number, cy: number) {
    const captain = CAPTAINS[id];
    const isUnlocked = id === 'base' || this.save.unlockedCreatures.includes(id);
    const isEquipped = this.save.currentCaptainId === id;
    const theme = THEMES[id] ?? THEMES.base;
    const state = this.cardStates.get(id)!;

    const card = this.add.container(cx, cy);
    this.scrollContainer.add(card);

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(theme.bg, 0.95);
    bg.fillRoundedRect(-CARD_W / 2, 0, CARD_W, CARD_H, 12);
    bg.lineStyle(1.5, theme.primary, isUnlocked ? 0.6 : 0.2);
    bg.strokeRoundedRect(-CARD_W / 2, 0, CARD_W, CARD_H, 12);
    card.add(bg);

    if (isEquipped) {
      const eqBadge = this.add.graphics();
      eqBadge.fillStyle(theme.primary, 0.15);
      eqBadge.fillRoundedRect(-CARD_W / 2, 0, CARD_W, CARD_H, 12);
      eqBadge.lineStyle(2, 0x00ffff, 0.8);
      eqBadge.strokeRoundedRect(-CARD_W / 2, 0, CARD_W, CARD_H, 12);
      card.add(eqBadge);
    }

    // Lock overlay
    if (!isUnlocked) {
      const overlay = this.add.graphics();
      overlay.fillStyle(0x000000, 0.6);
      overlay.fillRoundedRect(-CARD_W / 2, 0, CARD_W, CARD_H, 12);
      card.add(overlay);
    }

    if (!state.flipped) {
      // === FRONT SIDE ===
      // Captain name at top
      card.add(this.add.text(0, 16, captain.name.toUpperCase(), {
        fontSize: '18px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
        color: isUnlocked ? `#${theme.primary.toString(16).padStart(6, '0')}` : '#444444',
      }).setOrigin(0.5));

      // Creature/Ship display area
      const displayG = this.add.graphics();
      if (state.side === 'creature') {
        this.drawCreature(displayG, id, 0, 190, isUnlocked);
      } else {
        this.drawShipArt(displayG, id, 0, 190, isUnlocked);
      }
      card.add(displayG);

      // Swipe dots
      const dotG = this.add.graphics();
      dotG.fillStyle(state.side === 'creature' ? 0xffffff : 0x555555, 1);
      dotG.fillCircle(-8, 370, 4);
      dotG.fillStyle(state.side === 'ship' ? 0xffffff : 0x555555, 1);
      dotG.fillCircle(8, 370, 4);
      card.add(dotG);

      // Swipe label
      card.add(this.add.text(0, 388, state.side === 'creature' ? 'CREATURE' : 'SHIP', {
        fontSize: '10px', fontFamily: '"Courier New", monospace',
        color: '#666688',
      }).setOrigin(0.5));

      // Ability badge
      if (isUnlocked && captain.abilityName !== 'None') {
        card.add(this.add.text(0, 410, `\u26A1 ${captain.abilityName}`, {
          fontSize: '12px', fontFamily: '"Courier New", monospace',
          color: `#${theme.accent.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5));
      }

      // Lock icon for locked
      if (!isUnlocked) {
        const lockG = this.add.graphics();
        lockG.fillStyle(0x444444, 1);
        lockG.fillRect(-12, 180, 24, 20);
        lockG.lineStyle(3, 0x666666, 1);
        lockG.beginPath();
        lockG.arc(0, 178, 12, Math.PI, 0, false);
        lockG.strokePath();
        card.add(lockG);
        card.add(this.add.text(0, 220, 'LOCKED', {
          fontSize: '16px', fontFamily: '"Courier New", monospace', fontStyle: 'bold', color: '#555555',
        }).setOrigin(0.5));
      }

      // Tap to flip hint
      if (isUnlocked) {
        card.add(this.add.text(0, 440, 'TAP FOR STATS', {
          fontSize: '9px', fontFamily: '"Courier New", monospace', color: '#333355',
        }).setOrigin(0.5));
      }
    } else {
      // === BACK SIDE (STATS) ===
      this.drawStatsBack(card, captain, id, theme, isUnlocked, isEquipped);
    }

    // Interaction
    const hitZone = this.add.zone(0, CARD_H / 2, CARD_W, CARD_H).setInteractive();
    card.add(hitZone);

    let pointerDownX = 0;
    let pointerDownY = 0;
    hitZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      pointerDownX = p.x;
      pointerDownY = p.y;
    });
    hitZone.on('pointerup', (p: Phaser.Input.Pointer) => {
      const dx = p.x - pointerDownX;
      const dy = p.y - pointerDownY;
      if (Math.abs(dy) > 30) return; // was scrolling

      if (Math.abs(dx) > 40 && !state.flipped) {
        // Swipe left/right — toggle creature/ship
        state.side = state.side === 'creature' ? 'ship' : 'creature';
        this.rebuildCard(id, cx, cy, card);
      } else if (Math.abs(dx) < 20 && isUnlocked) {
        // Tap — flip card
        state.flipped = !state.flipped;
        this.rebuildCard(id, cx, cy, card);
      }
    });
  }

  private rebuildCard(id: string, cx: number, cy: number, oldCard: Phaser.GameObjects.Container) {
    const idx = this.scrollContainer.getIndex(oldCard);
    oldCard.removeAll(true);
    oldCard.destroy();
    const newCard = this.add.container(cx, cy);
    // Re-insert at same position
    this.scrollContainer.addAt(newCard, idx);
    // Rebuild into the new container by calling drawCard logic
    // We need to temporarily swap - let's just rebuild the whole card content
    this.drawCardContent(id, newCard);
  }

  private drawCardContent(id: string, card: Phaser.GameObjects.Container) {
    const captain = CAPTAINS[id];
    const isUnlocked = id === 'base' || this.save.unlockedCreatures.includes(id);
    const isEquipped = this.save.currentCaptainId === id;
    const theme = THEMES[id] ?? THEMES.base;
    const state = this.cardStates.get(id)!;

    const bg = this.add.graphics();
    bg.fillStyle(theme.bg, 0.95);
    bg.fillRoundedRect(-CARD_W / 2, 0, CARD_W, CARD_H, 12);
    bg.lineStyle(1.5, theme.primary, isUnlocked ? 0.6 : 0.2);
    bg.strokeRoundedRect(-CARD_W / 2, 0, CARD_W, CARD_H, 12);
    card.add(bg);

    if (isEquipped) {
      const eqG = this.add.graphics();
      eqG.fillStyle(theme.primary, 0.15);
      eqG.fillRoundedRect(-CARD_W / 2, 0, CARD_W, CARD_H, 12);
      eqG.lineStyle(2, 0x00ffff, 0.8);
      eqG.strokeRoundedRect(-CARD_W / 2, 0, CARD_W, CARD_H, 12);
      card.add(eqG);
    }

    if (!isUnlocked) {
      const overlay = this.add.graphics();
      overlay.fillStyle(0x000000, 0.6);
      overlay.fillRoundedRect(-CARD_W / 2, 0, CARD_W, CARD_H, 12);
      card.add(overlay);
    }

    if (!state.flipped) {
      card.add(this.add.text(0, 16, captain.name.toUpperCase(), {
        fontSize: '18px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
        color: isUnlocked ? `#${theme.primary.toString(16).padStart(6, '0')}` : '#444444',
      }).setOrigin(0.5));

      const displayG = this.add.graphics();
      if (state.side === 'creature') {
        this.drawCreature(displayG, id, 0, 190, isUnlocked);
      } else {
        this.drawShipArt(displayG, id, 0, 190, isUnlocked);
      }
      card.add(displayG);

      const dotG = this.add.graphics();
      dotG.fillStyle(state.side === 'creature' ? 0xffffff : 0x555555, 1);
      dotG.fillCircle(-8, 370, 4);
      dotG.fillStyle(state.side === 'ship' ? 0xffffff : 0x555555, 1);
      dotG.fillCircle(8, 370, 4);
      card.add(dotG);

      card.add(this.add.text(0, 388, state.side === 'creature' ? 'CREATURE' : 'SHIP', {
        fontSize: '10px', fontFamily: '"Courier New", monospace', color: '#666688',
      }).setOrigin(0.5));

      if (isUnlocked && captain.abilityName !== 'None') {
        card.add(this.add.text(0, 410, `\u26A1 ${captain.abilityName}`, {
          fontSize: '12px', fontFamily: '"Courier New", monospace',
          color: `#${theme.accent.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5));
      }

      if (!isUnlocked) {
        const lockG = this.add.graphics();
        lockG.fillStyle(0x444444, 1);
        lockG.fillRect(-12, 180, 24, 20);
        lockG.lineStyle(3, 0x666666, 1);
        lockG.beginPath();
        lockG.arc(0, 178, 12, Math.PI, 0, false);
        lockG.strokePath();
        card.add(lockG);
        card.add(this.add.text(0, 220, 'LOCKED', {
          fontSize: '16px', fontFamily: '"Courier New", monospace', fontStyle: 'bold', color: '#555555',
        }).setOrigin(0.5));
      }

      if (isUnlocked) {
        card.add(this.add.text(0, 440, 'TAP FOR STATS', {
          fontSize: '9px', fontFamily: '"Courier New", monospace', color: '#333355',
        }).setOrigin(0.5));
      }
    } else {
      this.drawStatsBack(card, captain, id, theme, isUnlocked, isEquipped);
    }

    const hitZone = this.add.zone(0, CARD_H / 2, CARD_W, CARD_H).setInteractive();
    card.add(hitZone);

    let px = 0, py = 0;
    hitZone.on('pointerdown', (p: Phaser.Input.Pointer) => { px = p.x; py = p.y; });
    hitZone.on('pointerup', (p: Phaser.Input.Pointer) => {
      const dx = p.x - px;
      const dy = p.y - py;
      if (Math.abs(dy) > 30) return;
      if (Math.abs(dx) > 40 && !state.flipped) {
        state.side = state.side === 'creature' ? 'ship' : 'creature';
        this.rebuildInPlace(id, card);
      } else if (Math.abs(dx) < 20 && isUnlocked) {
        state.flipped = !state.flipped;
        this.rebuildInPlace(id, card);
      }
    });
  }

  private rebuildInPlace(id: string, card: Phaser.GameObjects.Container) {
    const { x, y } = card;
    const idx = this.scrollContainer.getIndex(card);
    card.removeAll(true);
    card.destroy();
    const newCard = this.add.container(x, y);
    this.scrollContainer.addAt(newCard, idx);
    this.drawCardContent(id, newCard);
  }

  private drawStatsBack(
    card: Phaser.GameObjects.Container, captain: Captain, id: string,
    theme: { primary: number; accent: number }, isUnlocked: boolean, isEquipped: boolean
  ) {
    card.add(this.add.text(0, 20, captain.name.toUpperCase(), {
      fontSize: '20px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
      color: `#${theme.primary.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5));

    // Divider
    const divG = this.add.graphics();
    divG.lineStyle(1, theme.primary, 0.3);
    divG.lineBetween(-CARD_W / 2 + 20, 44, CARD_W / 2 - 20, 44);
    card.add(divG);

    // Stats
    const stats = [
      { label: 'HP', val: captain.stats.hp, max: 200, color: 0x44ff44 },
      { label: 'DAMAGE', val: captain.stats.damage, max: 30, color: 0xff4444 },
      { label: 'SPEED', val: captain.stats.speed, max: 10, color: 0x44aaff },
      { label: 'SHIELD', val: captain.stats.shield, max: 25, color: 0xffaa44 },
    ];

    stats.forEach((s, i) => {
      const sy = 70 + i * 52;
      card.add(this.add.text(-CARD_W / 2 + 24, sy, s.label, {
        fontSize: '11px', fontFamily: '"Courier New", monospace', fontStyle: 'bold', color: '#888899',
      }));
      card.add(this.add.text(CARD_W / 2 - 24, sy, String(s.val), {
        fontSize: '14px', fontFamily: '"Courier New", monospace', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(1, 0));

      const barG = this.add.graphics();
      const barW = CARD_W - 50;
      const fill = Math.min(s.val / s.max, 1) * barW;
      barG.fillStyle(0x111122, 1);
      barG.fillRoundedRect(-CARD_W / 2 + 24, sy + 18, barW, 10, 3);
      barG.fillStyle(s.color, 0.8);
      barG.fillRoundedRect(-CARD_W / 2 + 24, sy + 18, fill, 10, 3);
      // Glow on bar
      barG.fillStyle(s.color, 0.2);
      barG.fillRoundedRect(-CARD_W / 2 + 24, sy + 16, fill, 14, 4);
      card.add(barG);
    });

    // Ability section
    const abilY = 290;
    const abDivG = this.add.graphics();
    abDivG.lineStyle(1, theme.primary, 0.2);
    abDivG.lineBetween(-CARD_W / 2 + 20, abilY, CARD_W / 2 - 20, abilY);
    card.add(abDivG);

    card.add(this.add.text(0, abilY + 16, `\u26A1 ${captain.abilityName.toUpperCase()}`, {
      fontSize: '14px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
      color: `#${theme.accent.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5));

    card.add(this.add.text(0, abilY + 40, captain.abilityDescription, {
      fontSize: '11px', fontFamily: '"Courier New", monospace', color: '#aaaaaa',
      wordWrap: { width: CARD_W - 50 }, align: 'center',
    }).setOrigin(0.5, 0));

    if (captain.abilityCooldown > 0) {
      card.add(this.add.text(0, abilY + 80, `Cooldown: ${captain.abilityCooldown}s  |  Duration: ${captain.abilityDuration > 0 ? captain.abilityDuration + 's' : 'Instant'}`, {
        fontSize: '10px', fontFamily: '"Courier New", monospace', color: '#666688',
      }).setOrigin(0.5));
    }

    // Select/Equipped button
    if (isUnlocked) {
      const btn = new Button(this, 0, 410, isEquipped ? 'EQUIPPED' : 'SELECT', async () => {
        if (isEquipped) return;
        this.save = { ...this.save, currentCaptainId: id };
        this.registry.set('save', this.save);
        if (this.saveManager) await this.saveManager.save(this.save);
        this.scene.restart();
      }, 160, 44);
      card.add(btn);
    }

    // Tap to flip back
    card.add(this.add.text(0, 445, 'TAP TO FLIP', {
      fontSize: '9px', fontFamily: '"Courier New", monospace', color: '#333355',
    }).setOrigin(0.5));
  }

  // ============================================================
  // CREATURE DRAWINGS — detailed, unique per captain
  // ============================================================
  private drawCreature(g: Phaser.GameObjects.Graphics, id: string, cx: number, cy: number, unlocked: boolean) {
    const alpha = unlocked ? 1 : 0.25;
    switch (id) {
      case 'base': this.drawCommander(g, cx, cy, alpha); break;
      case 'nebula_jelly': this.drawJellyfish(g, cx, cy, alpha); break;
      case 'nebula_wisp': this.drawWisp(g, cx, cy, alpha); break;
      case 'nebula_titan': this.drawTitan(g, cx, cy, alpha); break;
      case 'ice_shard': this.drawIceShard(g, cx, cy, alpha); break;
      case 'ice_prism': this.drawIcePrism(g, cx, cy, alpha); break;
      case 'ice_golem': this.drawIceGolem(g, cx, cy, alpha); break;
      case 'flame_sprite': this.drawFlameSprite(g, cx, cy, alpha); break;
      case 'flame_drake': this.drawFlameDrake(g, cx, cy, alpha); break;
      case 'flame_colossus': this.drawFlameColossus(g, cx, cy, alpha); break;
    }
  }

  private drawCommander(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Helmet
    g.fillStyle(0x2a2a4e, a);
    g.fillCircle(cx, cy - 40, 30);
    g.fillStyle(0x00ffff, a * 0.7);
    g.fillEllipse(cx, cy - 40, 40, 28);
    // Visor
    g.fillStyle(0x00ffff, a * 0.4);
    g.fillEllipse(cx, cy - 42, 30, 14);
    g.fillStyle(0x88ffff, a * 0.3);
    g.fillEllipse(cx - 4, cy - 44, 10, 6);
    // Body/suit
    g.fillStyle(0x1a1a3e, a);
    g.fillTriangle(cx, cy - 12, cx - 28, cy + 50, cx + 28, cy + 50);
    // Suit detail
    g.lineStyle(1, 0x00ffff, a * 0.3);
    g.lineBetween(cx, cy - 10, cx, cy + 45);
    g.lineBetween(cx - 14, cy + 20, cx + 14, cy + 20);
    // Shoulders
    g.fillStyle(0x333366, a);
    g.fillCircle(cx - 22, cy, 8);
    g.fillCircle(cx + 22, cy, 8);
    // Star badge
    g.fillStyle(0xffdd44, a);
    g.fillStar(cx, cy + 8, 5, 8, 4);
  }

  private drawJellyfish(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Glow aura
    g.fillStyle(0xcc44ff, a * 0.08);
    g.fillCircle(cx, cy - 10, 65);
    // Bell/dome
    g.fillStyle(0xcc44ff, a * 0.6);
    g.fillEllipse(cx, cy - 30, 70, 50);
    g.fillStyle(0xee66ff, a * 0.4);
    g.fillEllipse(cx, cy - 34, 50, 32);
    g.fillStyle(0xff88ff, a * 0.3);
    g.fillEllipse(cx, cy - 36, 26, 18);
    // Inner glow spots
    g.fillStyle(0xffffff, a * 0.3);
    g.fillCircle(cx - 10, cy - 38, 4);
    g.fillCircle(cx + 8, cy - 32, 3);
    // Tentacles
    const tentacleColors = [0xcc44ff, 0xaa22dd, 0xff66ee, 0x8833cc];
    for (let i = 0; i < 7; i++) {
      const tx = cx - 24 + i * 8;
      const col = tentacleColors[i % tentacleColors.length];
      g.lineStyle(2, col, a * 0.7);
      g.beginPath();
      g.moveTo(tx, cy - 8);
      const waveAmp = 6 + (i % 3) * 3;
      const len = 50 + (i % 2) * 15;
      for (let j = 0; j < len; j += 4) {
        g.lineTo(tx + Math.sin(j * 0.15 + i) * waveAmp, cy - 8 + j);
      }
      g.strokePath();
    }
    // Eyes
    g.fillStyle(0xffffff, a * 0.8);
    g.fillCircle(cx - 10, cy - 30, 5);
    g.fillCircle(cx + 10, cy - 30, 5);
    g.fillStyle(0x220044, a);
    g.fillCircle(cx - 10, cy - 30, 2.5);
    g.fillCircle(cx + 10, cy - 30, 2.5);
  }

  private drawWisp(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Outer glow
    g.fillStyle(0xaa88ff, a * 0.06);
    g.fillCircle(cx, cy, 60);
    g.fillStyle(0xaa88ff, a * 0.1);
    g.fillCircle(cx, cy, 40);
    // Core body — ethereal
    g.fillStyle(0xaa88ff, a * 0.5);
    g.fillCircle(cx, cy - 10, 28);
    g.fillStyle(0xccaaff, a * 0.4);
    g.fillCircle(cx, cy - 14, 18);
    g.fillStyle(0xeeccff, a * 0.3);
    g.fillCircle(cx, cy - 16, 10);
    // Wispy trails
    g.lineStyle(3, 0xaa88ff, a * 0.4);
    g.beginPath();
    g.moveTo(cx - 20, cy + 10);
    g.bezierCurveTo(cx - 30, cy + 35, cx - 10, cy + 50, cx - 25, cy + 65);
    g.strokePath();
    g.lineStyle(2, 0xccaaff, a * 0.3);
    g.beginPath();
    g.moveTo(cx + 15, cy + 10);
    g.bezierCurveTo(cx + 25, cy + 40, cx + 5, cy + 55, cx + 20, cy + 65);
    g.strokePath();
    g.lineStyle(2, 0x8866dd, a * 0.3);
    g.beginPath();
    g.moveTo(cx, cy + 15);
    g.bezierCurveTo(cx - 5, cy + 40, cx + 5, cy + 55, cx, cy + 70);
    g.strokePath();
    // Eyes — bright dots
    g.fillStyle(0xffffff, a * 0.9);
    g.fillCircle(cx - 8, cy - 14, 4);
    g.fillCircle(cx + 8, cy - 14, 4);
    g.fillStyle(0x4400aa, a);
    g.fillCircle(cx - 8, cy - 14, 2);
    g.fillCircle(cx + 8, cy - 14, 2);
    // Sparkles around
    g.fillStyle(0xffffff, a * 0.6);
    [[-30, -25], [28, -20], [-22, 20], [25, 30], [0, -45]].forEach(([ox, oy]) => {
      g.fillStar(cx + ox, cy + oy, 3, 1.5, 4);
    });
  }

  private drawTitan(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Aura
    g.fillStyle(0x8844cc, a * 0.08);
    g.fillCircle(cx, cy, 65);
    // Massive body
    g.fillStyle(0x4422aa, a * 0.8);
    g.fillTriangle(cx, cy - 55, cx - 40, cy + 50, cx + 40, cy + 50);
    g.fillStyle(0x5533bb, a * 0.6);
    g.fillTriangle(cx, cy - 45, cx - 32, cy + 40, cx + 32, cy + 40);
    // Armor plates
    g.fillStyle(0x6644cc, a * 0.7);
    g.fillTriangle(cx - 30, cy, cx - 48, cy + 30, cx - 20, cy + 30);
    g.fillTriangle(cx + 30, cy, cx + 48, cy + 30, cx + 20, cy + 30);
    // Helmet/head
    g.fillStyle(0x7755dd, a * 0.8);
    g.fillCircle(cx, cy - 35, 20);
    g.fillStyle(0x3322aa, a);
    g.fillCircle(cx, cy - 35, 14);
    // Glowing eye visor
    g.fillStyle(0xff44aa, a * 0.9);
    g.fillEllipse(cx, cy - 36, 20, 6);
    g.fillStyle(0xff88cc, a * 0.5);
    g.fillEllipse(cx, cy - 36, 12, 4);
    // Shoulder spikes
    g.fillStyle(0x9966ee, a);
    g.fillTriangle(cx - 38, cy - 5, cx - 52, cy - 20, cx - 30, cy - 15);
    g.fillTriangle(cx + 38, cy - 5, cx + 52, cy - 20, cx + 30, cy - 15);
    // Core crystal
    g.fillStyle(0xff44aa, a * 0.6);
    g.fillStar(cx, cy + 10, 8, 14, 4);
  }

  private drawIceShard(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Frost aura
    g.fillStyle(0x44eeff, a * 0.06);
    g.fillCircle(cx, cy, 60);
    // Main crystal body
    g.fillStyle(0x44eeff, a * 0.5);
    g.fillTriangle(cx, cy - 55, cx - 18, cy + 10, cx + 18, cy + 10);
    g.fillStyle(0x88ffff, a * 0.3);
    g.fillTriangle(cx, cy - 50, cx - 10, cy + 5, cx + 4, cy + 5);
    // Side crystals
    g.fillStyle(0x22ccdd, a * 0.6);
    g.fillTriangle(cx - 20, cy - 20, cx - 40, cy + 15, cx - 14, cy + 5);
    g.fillTriangle(cx + 20, cy - 20, cx + 40, cy + 15, cx + 14, cy + 5);
    // Small crystals
    g.fillStyle(0x66ddee, a * 0.5);
    g.fillTriangle(cx - 30, cy + 5, cx - 38, cy + 30, cx - 22, cy + 25);
    g.fillTriangle(cx + 30, cy + 5, cx + 38, cy + 30, cx + 22, cy + 25);
    // Base
    g.fillStyle(0x115566, a * 0.7);
    g.fillEllipse(cx, cy + 20, 50, 20);
    // Inner glow
    g.fillStyle(0xffffff, a * 0.2);
    g.fillTriangle(cx, cy - 40, cx - 6, cy - 5, cx + 2, cy - 5);
    // Face
    g.fillStyle(0xffffff, a * 0.8);
    g.fillCircle(cx - 6, cy - 20, 3);
    g.fillCircle(cx + 6, cy - 20, 3);
    g.fillStyle(0x004455, a);
    g.fillCircle(cx - 6, cy - 20, 1.5);
    g.fillCircle(cx + 6, cy - 20, 1.5);
    // Frost particles
    g.fillStyle(0xffffff, a * 0.5);
    [[-25, -35], [30, -30], [-35, 0], [35, 5], [0, 40], [-15, 35]].forEach(([ox, oy]) => {
      g.fillStar(cx + ox, cy + oy, 2, 1, 6);
    });
  }

  private drawIcePrism(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Rainbow refraction glow
    g.fillStyle(0x88ddff, a * 0.05);
    g.fillCircle(cx, cy, 60);
    // Main prism — hexagonal
    const sides = 6;
    const r = 36;
    g.fillStyle(0x88ddff, a * 0.4);
    g.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    // Inner facets
    g.fillStyle(0xaaeeff, a * 0.3);
    g.fillTriangle(cx, cy - 36, cx - 16, cy, cx + 16, cy);
    g.fillStyle(0xccffee, a * 0.25);
    g.fillTriangle(cx, cy + 36, cx - 16, cy, cx + 16, cy);
    // Refraction beams
    g.lineStyle(2, 0xff4488, a * 0.3);
    g.lineBetween(cx + 30, cy - 10, cx + 55, cy - 30);
    g.lineStyle(2, 0x44ff88, a * 0.3);
    g.lineBetween(cx + 28, cy + 5, cx + 55, cy + 10);
    g.lineStyle(2, 0x4488ff, a * 0.3);
    g.lineBetween(cx + 25, cy + 18, cx + 50, cy + 35);
    // Eye in center
    g.fillStyle(0xffffff, a * 0.9);
    g.fillCircle(cx, cy, 8);
    g.fillStyle(0x004466, a);
    g.fillCircle(cx, cy, 4);
    g.fillStyle(0xffffff, a * 0.6);
    g.fillCircle(cx - 1, cy - 2, 1.5);
    // Edge glow
    g.lineStyle(1.5, 0x88ddff, a * 0.5);
    g.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.strokePath();
  }

  private drawIceGolem(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Frost aura
    g.fillStyle(0x2299bb, a * 0.06);
    g.fillCircle(cx, cy, 65);
    // Massive blocky body
    g.fillStyle(0x1a4455, a * 0.8);
    g.fillRect(cx - 30, cy - 20, 60, 65);
    // Head
    g.fillStyle(0x226677, a * 0.8);
    g.fillRect(cx - 20, cy - 50, 40, 35);
    // Ice crystal crown
    g.fillStyle(0x88ffff, a * 0.6);
    g.fillTriangle(cx - 18, cy - 50, cx - 12, cy - 68, cx - 6, cy - 50);
    g.fillTriangle(cx - 4, cy - 50, cx, cy - 72, cx + 4, cy - 50);
    g.fillTriangle(cx + 6, cy - 50, cx + 12, cy - 65, cx + 18, cy - 50);
    // Arms
    g.fillStyle(0x1a4455, a * 0.7);
    g.fillRect(cx - 48, cy - 15, 20, 50);
    g.fillRect(cx + 28, cy - 15, 20, 50);
    // Fists
    g.fillStyle(0x226677, a * 0.8);
    g.fillCircle(cx - 38, cy + 38, 12);
    g.fillCircle(cx + 38, cy + 38, 12);
    // Eyes
    g.fillStyle(0x88ffff, a * 0.9);
    g.fillRect(cx - 14, cy - 42, 8, 5);
    g.fillRect(cx + 6, cy - 42, 8, 5);
    // Chest rune
    g.lineStyle(2, 0x88ffff, a * 0.5);
    g.strokeCircle(cx, cy + 10, 12);
    g.fillStyle(0x88ffff, a * 0.3);
    g.fillCircle(cx, cy + 10, 6);
    // Ice cracks
    g.lineStyle(1, 0x88ffff, a * 0.2);
    g.lineBetween(cx - 15, cy - 10, cx - 25, cy + 20);
    g.lineBetween(cx + 10, cy - 5, cx + 22, cy + 25);
  }

  private drawFlameSprite(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Heat glow
    g.fillStyle(0xff8844, a * 0.08);
    g.fillCircle(cx, cy, 55);
    g.fillStyle(0xff4400, a * 0.06);
    g.fillCircle(cx, cy - 10, 40);
    // Flame body — teardrop
    g.fillStyle(0xff6600, a * 0.7);
    g.fillCircle(cx, cy + 10, 24);
    g.fillTriangle(cx, cy - 45, cx - 20, cy + 5, cx + 20, cy + 5);
    g.fillStyle(0xff8844, a * 0.5);
    g.fillCircle(cx, cy + 6, 16);
    g.fillTriangle(cx, cy - 35, cx - 12, cy + 2, cx + 12, cy + 2);
    g.fillStyle(0xffdd00, a * 0.4);
    g.fillCircle(cx, cy + 4, 10);
    // Flickering flame tips
    g.fillStyle(0xff4400, a * 0.6);
    g.fillTriangle(cx - 8, cy - 30, cx - 18, cy - 48, cx, cy - 30);
    g.fillTriangle(cx + 5, cy - 32, cx + 15, cy - 50, cx + 12, cy - 32);
    g.fillTriangle(cx, cy - 35, cx - 5, cy - 55, cx + 5, cy - 35);
    // Eyes
    g.fillStyle(0xffffff, a * 0.9);
    g.fillCircle(cx - 7, cy, 5);
    g.fillCircle(cx + 7, cy, 5);
    g.fillStyle(0x440000, a);
    g.fillCircle(cx - 7, cy, 2.5);
    g.fillCircle(cx + 7, cy, 2.5);
    // Mouth
    g.lineStyle(1.5, 0x440000, a * 0.8);
    g.beginPath();
    g.arc(cx, cy + 12, 6, 0.2, Math.PI - 0.2);
    g.strokePath();
    // Ember particles
    g.fillStyle(0xffaa00, a * 0.5);
    [[-20, -15], [22, -10], [-15, 30], [18, 35], [0, -50]].forEach(([ox, oy]) => {
      g.fillCircle(cx + ox, cy + oy, 2);
    });
  }

  private drawFlameDrake(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Heat haze
    g.fillStyle(0xff5522, a * 0.06);
    g.fillCircle(cx, cy, 65);
    // Wings
    g.fillStyle(0xaa2200, a * 0.7);
    g.fillTriangle(cx - 20, cy - 10, cx - 60, cy - 50, cx - 45, cy + 10);
    g.fillTriangle(cx + 20, cy - 10, cx + 60, cy - 50, cx + 45, cy + 10);
    g.fillStyle(0xcc3300, a * 0.5);
    g.fillTriangle(cx - 18, cy - 5, cx - 50, cy - 40, cx - 38, cy + 5);
    g.fillTriangle(cx + 18, cy - 5, cx + 50, cy - 40, cx + 38, cy + 5);
    // Wing membrane lines
    g.lineStyle(1, 0xff6600, a * 0.3);
    g.lineBetween(cx - 20, cy - 8, cx - 55, cy - 45);
    g.lineBetween(cx - 18, cy, cx - 48, cy - 30);
    g.lineBetween(cx + 20, cy - 8, cx + 55, cy - 45);
    g.lineBetween(cx + 18, cy, cx + 48, cy - 30);
    // Body
    g.fillStyle(0xcc3300, a * 0.8);
    g.fillEllipse(cx, cy + 5, 36, 48);
    g.fillStyle(0xdd4400, a * 0.6);
    g.fillEllipse(cx, cy + 5, 24, 36);
    // Head
    g.fillStyle(0xcc3300, a * 0.9);
    g.fillCircle(cx, cy - 30, 16);
    // Horns
    g.fillStyle(0x881100, a);
    g.fillTriangle(cx - 12, cy - 38, cx - 20, cy - 55, cx - 6, cy - 38);
    g.fillTriangle(cx + 12, cy - 38, cx + 20, cy - 55, cx + 6, cy - 38);
    // Eyes — fierce
    g.fillStyle(0xffdd00, a * 0.9);
    g.fillEllipse(cx - 6, cy - 32, 8, 5);
    g.fillEllipse(cx + 6, cy - 32, 8, 5);
    g.fillStyle(0x220000, a);
    g.fillEllipse(cx - 6, cy - 32, 3, 5);
    g.fillEllipse(cx + 6, cy - 32, 3, 5);
    // Snout
    g.fillStyle(0xbb2200, a * 0.8);
    g.fillTriangle(cx, cy - 22, cx - 6, cy - 18, cx + 6, cy - 18);
    // Tail
    g.lineStyle(4, 0xcc3300, a * 0.7);
    g.beginPath();
    g.moveTo(cx, cy + 28);
    g.bezierCurveTo(cx + 15, cy + 45, cx + 30, cy + 50, cx + 20, cy + 60);
    g.strokePath();
    g.fillStyle(0xff6600, a * 0.8);
    g.fillTriangle(cx + 20, cy + 58, cx + 14, cy + 68, cx + 28, cy + 65);
    // Belly scales
    g.fillStyle(0xff8844, a * 0.3);
    for (let i = 0; i < 4; i++) {
      g.fillEllipse(cx, cy - 5 + i * 10, 16, 6);
    }
  }

  private drawFlameColossus(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Massive heat glow
    g.fillStyle(0xdd2200, a * 0.08);
    g.fillCircle(cx, cy, 70);
    g.fillStyle(0xff4400, a * 0.05);
    g.fillCircle(cx, cy, 55);
    // Massive body
    g.fillStyle(0x661100, a * 0.8);
    g.fillRect(cx - 36, cy - 25, 72, 75);
    g.fillStyle(0x882200, a * 0.6);
    g.fillRect(cx - 28, cy - 18, 56, 60);
    // Head
    g.fillStyle(0x881100, a * 0.9);
    g.fillCircle(cx, cy - 40, 24);
    // Molten cracks in head
    g.lineStyle(2, 0xff6600, a * 0.6);
    g.lineBetween(cx - 12, cy - 50, cx - 8, cy - 30);
    g.lineBetween(cx + 8, cy - 48, cx + 12, cy - 32);
    g.lineStyle(1, 0xffaa00, a * 0.4);
    g.lineBetween(cx, cy - 52, cx + 2, cy - 28);
    // Eyes — burning
    g.fillStyle(0xffaa00, a);
    g.fillEllipse(cx - 10, cy - 42, 10, 6);
    g.fillEllipse(cx + 10, cy - 42, 10, 6);
    g.fillStyle(0xffffff, a * 0.5);
    g.fillCircle(cx - 10, cy - 42, 2);
    g.fillCircle(cx + 10, cy - 42, 2);
    // Massive arms
    g.fillStyle(0x661100, a * 0.8);
    g.fillRect(cx - 56, cy - 20, 24, 55);
    g.fillRect(cx + 32, cy - 20, 24, 55);
    // Lava cracks in body
    g.lineStyle(2, 0xff4400, a * 0.5);
    g.lineBetween(cx - 20, cy - 10, cx - 25, cy + 30);
    g.lineBetween(cx + 15, cy - 5, cx + 20, cy + 35);
    g.lineStyle(1.5, 0xffaa00, a * 0.4);
    g.lineBetween(cx - 5, cy, cx - 10, cy + 40);
    g.lineBetween(cx + 8, cy + 5, cx + 5, cy + 45);
    // Core
    g.fillStyle(0xff4400, a * 0.6);
    g.fillCircle(cx, cy + 10, 14);
    g.fillStyle(0xffaa00, a * 0.4);
    g.fillCircle(cx, cy + 10, 8);
    g.fillStyle(0xffffff, a * 0.2);
    g.fillCircle(cx, cy + 10, 4);
    // Fists
    g.fillStyle(0x882200, a * 0.9);
    g.fillCircle(cx - 44, cy + 38, 14);
    g.fillCircle(cx + 44, cy + 38, 14);
    // Ground fire
    g.fillStyle(0xff4400, a * 0.3);
    g.fillEllipse(cx, cy + 55, 80, 16);
    g.fillStyle(0xff8800, a * 0.2);
    g.fillEllipse(cx, cy + 52, 50, 10);
  }

  // ============================================================
  // SHIP DRAWINGS — unique per captain
  // ============================================================
  private drawShipArt(g: Phaser.GameObjects.Graphics, id: string, cx: number, cy: number, unlocked: boolean) {
    const a = unlocked ? 1 : 0.25;
    switch (id) {
      case 'base': this.drawBaseShip(g, cx, cy, a); break;
      case 'nebula_jelly': this.drawJellyShip(g, cx, cy, a); break;
      case 'nebula_wisp': this.drawWispShip(g, cx, cy, a); break;
      case 'nebula_titan': this.drawTitanShip(g, cx, cy, a); break;
      case 'ice_shard': this.drawIceShardShip(g, cx, cy, a); break;
      case 'ice_prism': this.drawPrismShip(g, cx, cy, a); break;
      case 'ice_golem': this.drawGolemShip(g, cx, cy, a); break;
      case 'flame_sprite': this.drawSpriteShip(g, cx, cy, a); break;
      case 'flame_drake': this.drawDrakeShip(g, cx, cy, a); break;
      case 'flame_colossus': this.drawColossusShip(g, cx, cy, a); break;
    }
  }

  private drawBaseShip(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    g.fillStyle(0x1a1a2e, a); g.fillTriangle(cx, cy - 50, cx - 26, cy + 35, cx + 26, cy + 35);
    g.fillStyle(0x2a2a4e, a * 0.8); g.fillTriangle(cx, cy - 45, cx - 20, cy + 30, cx, cy + 30);
    g.fillStyle(0x3a3a6e, a * 0.8); g.fillTriangle(cx, cy - 45, cx, cy + 30, cx + 20, cy + 30);
    g.fillStyle(0x4400aa, a); g.fillTriangle(cx - 26, cy + 25, cx - 50, cy + 42, cx - 16, cy + 12);
    g.fillTriangle(cx + 26, cy + 25, cx + 50, cy + 42, cx + 16, cy + 12);
    g.fillStyle(0xff1493, a * 0.8); g.fillCircle(cx - 48, cy + 41, 3); g.fillCircle(cx + 48, cy + 41, 3);
    g.fillStyle(0x00ffff, a * 0.6); g.fillTriangle(cx, cy - 35, cx - 6, cy, cx + 6, cy);
    g.fillStyle(0xff6600, a * 0.7); g.fillRect(cx - 8, cy + 35, 6, 10); g.fillRect(cx + 2, cy + 35, 6, 10);
    g.lineStyle(1, 0xff69b4, a * 0.3); g.strokeTriangle(cx, cy - 50, cx - 26, cy + 35, cx + 26, cy + 35);
  }

  private drawJellyShip(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Organic dome ship
    g.fillStyle(0xcc44ff, a * 0.1); g.fillCircle(cx, cy, 55);
    g.fillStyle(0x330044, a * 0.8); g.fillEllipse(cx, cy - 10, 70, 50);
    g.fillStyle(0x550066, a * 0.6); g.fillEllipse(cx, cy - 14, 50, 34);
    g.fillStyle(0xcc44ff, a * 0.3); g.fillEllipse(cx, cy - 16, 30, 20);
    // Trailing tendrils as engines
    g.lineStyle(3, 0xcc44ff, a * 0.5);
    [[-20, 8], [-8, 12], [8, 12], [20, 8]].forEach(([ox, oy]) => {
      g.beginPath(); g.moveTo(cx + ox, cy + oy);
      g.lineTo(cx + ox + (ox > 0 ? 3 : -3), cy + oy + 35);
      g.strokePath();
    });
    g.fillStyle(0xff66ff, a * 0.6); g.fillCircle(cx, cy - 12, 8);
  }

  private drawWispShip(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Ethereal energy ship
    g.fillStyle(0xaa88ff, a * 0.08); g.fillCircle(cx, cy, 50);
    g.fillStyle(0x220044, a * 0.7); g.fillTriangle(cx, cy - 45, cx - 30, cy + 20, cx + 30, cy + 20);
    g.fillStyle(0xaa88ff, a * 0.3); g.fillTriangle(cx, cy - 35, cx - 18, cy + 15, cx + 18, cy + 15);
    // Energy wings
    g.lineStyle(2, 0xaa88ff, a * 0.5);
    g.beginPath(); g.moveTo(cx - 25, cy + 5); g.bezierCurveTo(cx - 50, cy - 20, cx - 55, cy + 10, cx - 35, cy + 25); g.strokePath();
    g.beginPath(); g.moveTo(cx + 25, cy + 5); g.bezierCurveTo(cx + 50, cy - 20, cx + 55, cy + 10, cx + 35, cy + 25); g.strokePath();
    g.fillStyle(0xccaaff, a * 0.5); g.fillCircle(cx, cy - 10, 8);
    g.fillStyle(0xffffff, a * 0.5);
    [[-18, -20], [20, -18], [0, -35]].forEach(([ox, oy]) => g.fillStar(cx + ox, cy + oy, 2, 1, 4));
  }

  private drawTitanShip(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Heavy battlecruiser
    g.fillStyle(0x3322aa, a * 0.8); g.fillRect(cx - 20, cy - 45, 40, 80);
    g.fillStyle(0x4422bb, a * 0.6); g.fillTriangle(cx, cy - 55, cx - 20, cy - 45, cx + 20, cy - 45);
    // Heavy armor plates
    g.fillStyle(0x5533cc, a * 0.7);
    g.fillRect(cx - 40, cy - 20, 22, 50); g.fillRect(cx + 18, cy - 20, 22, 50);
    // Cannon mounts
    g.fillStyle(0x6644dd, a * 0.8);
    g.fillRect(cx - 48, cy - 25, 10, 20); g.fillRect(cx + 38, cy - 25, 10, 20);
    // Core engine
    g.fillStyle(0xff44aa, a * 0.5); g.fillCircle(cx, cy, 10);
    g.fillStyle(0xff44aa, a * 0.7); g.fillRect(cx - 8, cy + 35, 16, 12);
    g.lineStyle(1, 0xff44aa, a * 0.3); g.strokeRect(cx - 20, cy - 45, 40, 80);
  }

  private drawIceShardShip(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Crystal dart
    g.fillStyle(0x44eeff, a * 0.06); g.fillCircle(cx, cy, 50);
    g.fillStyle(0x113344, a * 0.8); g.fillTriangle(cx, cy - 55, cx - 22, cy + 30, cx + 22, cy + 30);
    g.fillStyle(0x44eeff, a * 0.3); g.fillTriangle(cx, cy - 45, cx - 12, cy + 20, cx + 12, cy + 20);
    // Crystal wings
    g.fillStyle(0x22ccdd, a * 0.6);
    g.fillTriangle(cx - 22, cy + 10, cx - 45, cy + 35, cx - 15, cy + 25);
    g.fillTriangle(cx + 22, cy + 10, cx + 45, cy + 35, cx + 15, cy + 25);
    g.fillStyle(0xffffff, a * 0.15); g.fillTriangle(cx - 2, cy - 40, cx - 8, cy, cx + 2, cy);
    g.fillStyle(0x88ffff, a * 0.6); g.fillCircle(cx - 43, cy + 34, 2); g.fillCircle(cx + 43, cy + 34, 2);
    g.fillStyle(0xff6600, a * 0.5); g.fillRect(cx - 5, cy + 30, 4, 8); g.fillRect(cx + 1, cy + 30, 4, 8);
  }

  private drawPrismShip(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Hexagonal scout
    const r = 32;
    g.fillStyle(0x224455, a * 0.8);
    g.beginPath();
    for (let i = 0; i < 6; i++) { const ang = (i / 6) * Math.PI * 2 - Math.PI / 2; g.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r); }
    g.closePath(); g.fillPath();
    g.fillStyle(0x88ddff, a * 0.2);
    g.beginPath();
    for (let i = 0; i < 6; i++) { const ang = (i / 6) * Math.PI * 2 - Math.PI / 2; g.lineTo(cx + Math.cos(ang) * (r - 8), cy + Math.sin(ang) * (r - 8)); }
    g.closePath(); g.fillPath();
    // Refraction beams from front
    g.lineStyle(1.5, 0xff4488, a * 0.4); g.lineBetween(cx, cy - 32, cx - 15, cy - 55);
    g.lineStyle(1.5, 0x44ff88, a * 0.4); g.lineBetween(cx, cy - 32, cx, cy - 58);
    g.lineStyle(1.5, 0x4488ff, a * 0.4); g.lineBetween(cx, cy - 32, cx + 15, cy - 55);
    g.fillStyle(0xffffff, a * 0.6); g.fillCircle(cx, cy, 6);
    g.lineStyle(1, 0x88ddff, a * 0.5);
    g.beginPath();
    for (let i = 0; i < 6; i++) { const ang = (i / 6) * Math.PI * 2 - Math.PI / 2; g.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r); }
    g.closePath(); g.strokePath();
  }

  private drawGolemShip(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Heavy ice fortress
    g.fillStyle(0x1a4455, a * 0.8); g.fillRect(cx - 28, cy - 35, 56, 70);
    g.fillStyle(0x226677, a * 0.6); g.fillTriangle(cx, cy - 50, cx - 28, cy - 35, cx + 28, cy - 35);
    // Ice turrets
    g.fillStyle(0x226677, a * 0.8);
    g.fillRect(cx - 44, cy - 25, 18, 40); g.fillRect(cx + 26, cy - 25, 18, 40);
    g.fillStyle(0x88ffff, a * 0.5);
    g.fillTriangle(cx - 44, cy - 25, cx - 35, cy - 40, cx - 26, cy - 25);
    g.fillTriangle(cx + 26, cy - 25, cx + 35, cy - 40, cx + 44, cy - 25);
    // Core
    g.fillStyle(0x88ffff, a * 0.4); g.fillCircle(cx, cy - 5, 10);
    g.lineStyle(1, 0x88ffff, a * 0.3); g.strokeRect(cx - 28, cy - 35, 56, 70);
    g.fillStyle(0x44ccdd, a * 0.5); g.fillRect(cx - 6, cy + 35, 12, 10);
  }

  private drawSpriteShip(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Sleek flame racer
    g.fillStyle(0xff8844, a * 0.08); g.fillCircle(cx, cy, 50);
    g.fillStyle(0x331100, a * 0.8); g.fillTriangle(cx, cy - 50, cx - 20, cy + 30, cx + 20, cy + 30);
    g.fillStyle(0xff6600, a * 0.4); g.fillTriangle(cx, cy - 40, cx - 12, cy + 20, cx + 12, cy + 20);
    // Flame wings
    g.fillStyle(0xcc3300, a * 0.7);
    g.fillTriangle(cx - 20, cy + 15, cx - 45, cy + 35, cx - 12, cy + 5);
    g.fillTriangle(cx + 20, cy + 15, cx + 45, cy + 35, cx + 12, cy + 5);
    g.fillStyle(0xffdd00, a * 0.5); g.fillCircle(cx, cy - 15, 6);
    // Massive engine flames
    g.fillStyle(0xff4400, a * 0.7); g.fillTriangle(cx - 8, cy + 30, cx, cy + 55, cx + 8, cy + 30);
    g.fillStyle(0xffaa00, a * 0.5); g.fillTriangle(cx - 4, cy + 30, cx, cy + 48, cx + 4, cy + 30);
  }

  private drawDrakeShip(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Dragon-shaped warship
    g.fillStyle(0x661100, a * 0.8); g.fillTriangle(cx, cy - 50, cx - 30, cy + 25, cx + 30, cy + 25);
    g.fillStyle(0x882200, a * 0.6); g.fillTriangle(cx, cy - 40, cx - 20, cy + 18, cx + 20, cy + 18);
    // Dragon wings
    g.fillStyle(0xaa2200, a * 0.7);
    g.fillTriangle(cx - 28, cy, cx - 60, cy - 35, cx - 50, cy + 15);
    g.fillTriangle(cx + 28, cy, cx + 60, cy - 35, cx + 50, cy + 15);
    g.lineStyle(1, 0xff6600, a * 0.3);
    g.lineBetween(cx - 30, cy, cx - 55, cy - 30);
    g.lineBetween(cx + 30, cy, cx + 55, cy - 30);
    // Head cannon
    g.fillStyle(0xffdd00, a * 0.6); g.fillCircle(cx, cy - 35, 5);
    // Dual engines
    g.fillStyle(0xff4400, a * 0.7);
    g.fillRect(cx - 14, cy + 25, 8, 14); g.fillRect(cx + 6, cy + 25, 8, 14);
    g.fillStyle(0xffaa00, a * 0.5);
    g.fillRect(cx - 12, cy + 30, 4, 10); g.fillRect(cx + 8, cy + 30, 4, 10);
  }

  private drawColossusShip(g: Phaser.GameObjects.Graphics, cx: number, cy: number, a: number) {
    // Massive dreadnought
    g.fillStyle(0xdd2200, a * 0.06); g.fillCircle(cx, cy, 60);
    g.fillStyle(0x440800, a * 0.8); g.fillRect(cx - 30, cy - 40, 60, 80);
    g.fillStyle(0x661100, a * 0.7); g.fillTriangle(cx, cy - 55, cx - 30, cy - 40, cx + 30, cy - 40);
    // Heavy side batteries
    g.fillStyle(0x551000, a * 0.8);
    g.fillRect(cx - 50, cy - 30, 22, 55); g.fillRect(cx + 28, cy - 30, 22, 55);
    // Lava core visible
    g.fillStyle(0xff4400, a * 0.5); g.fillCircle(cx, cy, 12);
    g.fillStyle(0xffaa00, a * 0.3); g.fillCircle(cx, cy, 7);
    // Lava cracks
    g.lineStyle(1.5, 0xff4400, a * 0.4);
    g.lineBetween(cx - 15, cy - 20, cx - 20, cy + 20);
    g.lineBetween(cx + 12, cy - 15, cx + 18, cy + 25);
    // Triple engines
    g.fillStyle(0xff4400, a * 0.7);
    g.fillRect(cx - 18, cy + 40, 8, 14); g.fillRect(cx - 4, cy + 40, 8, 14); g.fillRect(cx + 10, cy + 40, 8, 14);
    g.lineStyle(1, 0xff4400, a * 0.3); g.strokeRect(cx - 30, cy - 40, 60, 80);
  }

  private defaultSave(): SaveData {
    return {
      xp: 0, level: 1, coins: 0, currentCaptainId: 'base',
      worldProgress: {}, unlockedCreatures: [], ownedItems: ['laser'],
      equippedWeapon: 'laser', equippedDefense: null, equippedCosmetic: null,
      statBoosts: {}, checkpoint: null,
    };
  }
}
