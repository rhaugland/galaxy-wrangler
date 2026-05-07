import { Button } from '@/ui/button';
import { CAPTAINS } from '@/config/worlds';
import { SaveData, Captain } from '@/models/types';
import { SaveManager } from '@/systems/save-system';

const CAPTAIN_COLORS: Record<string, number> = {
  base: 0x6699ff,
  nebula_jelly: 0xcc44ff,
  nebula_wisp: 0xaa88ff,
  nebula_titan: 0x8844cc,
  ice_shard: 0x44eeff,
  ice_prism: 0x88ddff,
  ice_golem: 0x2299bb,
  flame_sprite: 0xff8844,
  flame_drake: 0xff5522,
  flame_colossus: 0xdd2200,
};

export class CaptainSelectScene extends Phaser.Scene {
  private save!: SaveData;
  private saveManager!: SaveManager;
  private selectedId!: string;
  private statsContainer!: Phaser.GameObjects.Container;

  constructor() { super('CaptainSelect'); }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const W = 390;
    const cx = W / 2;

    this.save = this.registry.get('save') ?? this.defaultSave();
    this.saveManager = this.registry.get('saveManager');
    this.selectedId = this.save.currentCaptainId;

    this.add.text(cx, 48, 'Select Captain', {
      fontSize: '30px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#4444cc',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const captainIds = Object.keys(CAPTAINS);
    const cols = 4;
    const cellW = 88;
    const cellH = 100;
    const gridX = cx - (cols * cellW) / 2 + cellW / 2;
    const gridStartY = 140;

    captainIds.forEach((id, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const px = gridX + col * cellW;
      const py = gridStartY + row * cellH;
      this.drawPortrait(id, px, py);
    });

    // Stats panel container (drawn on selection)
    this.statsContainer = this.add.container(0, 0);
    this.drawStatsPanel();

    new Button(this, cx, 800, 'Back', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
      });
    }, 140, 44);
  }

  private drawPortrait(id: string, x: number, y: number) {
    const captain = CAPTAINS[id];
    const isUnlocked = id === 'base' || this.save.unlockedCreatures.includes(id);
    const isSelected = id === this.selectedId;
    const color = CAPTAIN_COLORS[id] ?? 0x888888;

    const gfx = this.add.graphics();

    // Border highlight if selected
    if (isSelected) {
      gfx.lineStyle(3, 0xffdd44, 1);
      gfx.strokeRoundedRect(x - 34, y - 42, 68, 84, 8);
    } else {
      gfx.lineStyle(1, 0x444466, 1);
      gfx.strokeRoundedRect(x - 34, y - 42, 68, 84, 8);
    }

    gfx.fillStyle(0x111133, 0.9);
    gfx.fillRoundedRect(x - 34, y - 42, 68, 84, 8);

    if (isUnlocked) {
      // Draw captain icon shape
      gfx.fillStyle(color, 1);
      gfx.fillTriangle(x, y - 28, x - 14, y - 4, x + 14, y - 4);
      gfx.fillStyle(color, 0.6);
      gfx.fillCircle(x, y - 4, 8);
    } else {
      // Lock icon
      gfx.fillStyle(0x555555, 1);
      gfx.fillRect(x - 8, y - 22, 16, 14);
      gfx.lineStyle(2, 0x888888, 1);
      gfx.strokeCircle(x, y - 26, 8);
    }

    // Name label
    this.add.text(x, y + 28, captain.name.split(' ')[0], {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: isUnlocked ? '#ddddff' : '#555555',
    }).setOrigin(0.5);

    // Make portrait interactive
    const hitZone = this.add.zone(x, y - 2, 68, 84).setInteractive();
    hitZone.on('pointerup', () => {
      if (!isUnlocked) return;
      this.selectedId = id;
      this.scene.restart();
    });
  }

  private drawStatsPanel() {
    this.statsContainer.removeAll(true);

    const captain = CAPTAINS[this.selectedId];
    if (!captain) return;

    const W = 390;
    const cx = W / 2;
    const panelY = 460;
    const panelH = 250;

    const bg = this.add.graphics();
    bg.lineStyle(2, 0x4444cc, 1);
    bg.fillStyle(0x0a0a22, 0.95);
    bg.strokeRoundedRect(cx - 160, panelY, 320, panelH, 12);
    bg.fillRoundedRect(cx - 160, panelY, 320, panelH, 12);
    this.statsContainer.add(bg);

    // Captain name
    const nameText = this.add.text(cx, panelY + 22, captain.name, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.statsContainer.add(nameText);

    // Stat bars
    const stats: Array<{ label: string; val: number; max: number }> = [
      { label: 'HP', val: captain.stats.hp, max: 200 },
      { label: 'DMG', val: captain.stats.damage, max: 30 },
      { label: 'SPD', val: captain.stats.speed, max: 10 },
      { label: 'SHD', val: captain.stats.shield, max: 12 },
    ];

    stats.forEach((s, i) => {
      const sy = panelY + 52 + i * 28;
      const labelT = this.add.text(cx - 145, sy, s.label, {
        fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#aaaaff',
      }).setOrigin(0, 0.5);
      this.statsContainer.add(labelT);

      const barW = 180;
      const fill = Math.min(s.val / s.max, 1) * barW;
      const barGfx = this.add.graphics();
      barGfx.fillStyle(0x222244, 1);
      barGfx.fillRoundedRect(cx - 100, sy - 7, barW, 14, 4);
      barGfx.fillStyle(0x4488ff, 1);
      barGfx.fillRoundedRect(cx - 100, sy - 7, fill, 14, 4);
      this.statsContainer.add(barGfx);

      const valT = this.add.text(cx + 90, sy, String(s.val), {
        fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#ffffff',
      }).setOrigin(0, 0.5);
      this.statsContainer.add(valT);
    });

    // Ability
    const abilityT = this.add.text(cx, panelY + 170, `Ability: ${captain.abilityName}`, {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#ffdd44',
    }).setOrigin(0.5);
    this.statsContainer.add(abilityT);

    const descT = this.add.text(cx, panelY + 192, captain.abilityDescription, {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#bbbbbb',
      wordWrap: { width: 290 },
    }).setOrigin(0.5);
    this.statsContainer.add(descT);

    // Select button
    const isAlreadySelected = this.save.currentCaptainId === this.selectedId;
    const selectBtn = new Button(
      this,
      cx,
      panelY + 228,
      isAlreadySelected ? 'Equipped' : 'Select',
      async () => {
        if (isAlreadySelected) return;
        this.save = { ...this.save, currentCaptainId: this.selectedId };
        this.registry.set('save', this.save);
        if (this.saveManager) await this.saveManager.save(this.save);
        this.scene.restart();
      },
      140,
      40
    );
    this.statsContainer.add(selectBtn);
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
