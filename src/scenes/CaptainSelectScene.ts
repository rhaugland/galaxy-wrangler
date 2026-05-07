import { Button } from '@/ui/button';
import { CAPTAINS } from '@/config/worlds';
import { SaveData, Captain } from '@/models/types';
import { SaveManager } from '@/systems/save-system';
import { FONT } from '@/ui/theme';

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
  land_beetle:    { primary: 0x88aa44, accent: 0xddaa44, bg: 0x0a0c04 },
  land_wyrm:      { primary: 0x66884a, accent: 0xcc8833, bg: 0x080a03 },
  land_colossus:  { primary: 0x448833, accent: 0x44dd66, bg: 0x060a02 },
  electric_mote:  { primary: 0x44aaff, accent: 0xffee44, bg: 0x040810 },
  electric_serpent: { primary: 0x6644ff, accent: 0xffdd00, bg: 0x060414 },
  electric_titan: { primary: 0x8844ff, accent: 0x44eeff, bg: 0x080418 },
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

  preload() {
    const ids = Object.keys(CAPTAINS);
    for (const id of ids) {
      if (!this.textures.exists(`creature_${id}`)) {
        this.load.image(`creature_${id}`, `/art/creature_${id}.png`);
      }
      if (!this.textures.exists(`ship_${id}`)) {
        this.load.image(`ship_${id}`, `/art/ship_${id}.png`);
      }
    }
  }

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
      fontSize: '28px', fontFamily: FONT, fontStyle: 'bold',
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
    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, 70, W, 710);
    this.scrollContainer.setMask(maskShape.createGeometryMask());
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
        fontSize: '18px', fontFamily: FONT, fontStyle: 'bold',
        color: isUnlocked ? `#${theme.primary.toString(16).padStart(6, '0')}` : '#444444',
      }).setOrigin(0.5));

      // Creature/Ship display area — use preloaded images
      const textureKey = state.side === 'creature' ? `creature_${id}` : `ship_${id}`;
      const img = this.add.image(0, 190, textureKey).setDisplaySize(260, 260);
      if (!isUnlocked) img.setAlpha(0.25);
      card.add(img);

      // Swipe dots
      const dotG = this.add.graphics();
      dotG.fillStyle(state.side === 'creature' ? 0xffffff : 0x555555, 1);
      dotG.fillCircle(-8, 370, 4);
      dotG.fillStyle(state.side === 'ship' ? 0xffffff : 0x555555, 1);
      dotG.fillCircle(8, 370, 4);
      card.add(dotG);

      // Swipe label
      card.add(this.add.text(0, 388, state.side === 'creature' ? 'CREATURE' : 'SHIP', {
        fontSize: '10px', fontFamily: FONT,
        color: '#666688',
      }).setOrigin(0.5));

      // Ability badge
      if (isUnlocked && captain.abilityName !== 'None') {
        card.add(this.add.text(0, 410, `\u26A1 ${captain.abilityName}`, {
          fontSize: '12px', fontFamily: FONT,
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
          fontSize: '16px', fontFamily: FONT, fontStyle: 'bold', color: '#555555',
        }).setOrigin(0.5));
      }

      // Tap to flip hint
      if (isUnlocked) {
        card.add(this.add.text(0, 440, 'TAP FOR STATS', {
          fontSize: '9px', fontFamily: FONT, color: '#333355',
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
        fontSize: '18px', fontFamily: FONT, fontStyle: 'bold',
        color: isUnlocked ? `#${theme.primary.toString(16).padStart(6, '0')}` : '#444444',
      }).setOrigin(0.5));

      const textureKey = state.side === 'creature' ? `creature_${id}` : `ship_${id}`;
      const img = this.add.image(0, 190, textureKey).setDisplaySize(260, 260);
      if (!isUnlocked) img.setAlpha(0.25);
      card.add(img);

      const dotG = this.add.graphics();
      dotG.fillStyle(state.side === 'creature' ? 0xffffff : 0x555555, 1);
      dotG.fillCircle(-8, 370, 4);
      dotG.fillStyle(state.side === 'ship' ? 0xffffff : 0x555555, 1);
      dotG.fillCircle(8, 370, 4);
      card.add(dotG);

      card.add(this.add.text(0, 388, state.side === 'creature' ? 'CREATURE' : 'SHIP', {
        fontSize: '10px', fontFamily: FONT, color: '#666688',
      }).setOrigin(0.5));

      if (isUnlocked && captain.abilityName !== 'None') {
        card.add(this.add.text(0, 410, `\u26A1 ${captain.abilityName}`, {
          fontSize: '12px', fontFamily: FONT,
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
          fontSize: '16px', fontFamily: FONT, fontStyle: 'bold', color: '#555555',
        }).setOrigin(0.5));
      }

      if (isUnlocked) {
        card.add(this.add.text(0, 440, 'TAP FOR STATS', {
          fontSize: '9px', fontFamily: FONT, color: '#333355',
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
      fontSize: '20px', fontFamily: FONT, fontStyle: 'bold',
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
        fontSize: '11px', fontFamily: FONT, fontStyle: 'bold', color: '#888899',
      }));
      card.add(this.add.text(CARD_W / 2 - 24, sy, String(s.val), {
        fontSize: '14px', fontFamily: FONT, fontStyle: 'bold', color: '#ffffff',
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
      fontSize: '14px', fontFamily: FONT, fontStyle: 'bold',
      color: `#${theme.accent.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5));

    card.add(this.add.text(0, abilY + 40, captain.abilityDescription, {
      fontSize: '11px', fontFamily: FONT, color: '#aaaaaa',
      wordWrap: { width: CARD_W - 50 }, align: 'center',
    }).setOrigin(0.5, 0));

    if (captain.abilityCooldown > 0) {
      card.add(this.add.text(0, abilY + 80, `Cooldown: ${captain.abilityCooldown}s  |  Duration: ${captain.abilityDuration > 0 ? captain.abilityDuration + 's' : 'Instant'}`, {
        fontSize: '10px', fontFamily: FONT, color: '#666688',
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
      fontSize: '9px', fontFamily: FONT, color: '#333355',
    }).setOrigin(0.5));
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
