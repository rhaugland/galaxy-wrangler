import { Button } from '@/ui/button';
import { WORLDS } from '@/config/worlds';
import { SaveData } from '@/models/types';

const THEME_COLORS: Record<string, number> = {
  nebula: 0x9944cc,
  ice: 0x44ccee,
  inferno: 0xff6622,
};

export class WorldSelectScene extends Phaser.Scene {
  constructor() { super('WorldSelect'); }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const W = 390;
    const cx = W / 2;
    const save: SaveData = this.registry.get('save') ?? {
      worldProgress: {},
      unlockedCreatures: [],
      ownedItems: [],
      equippedWeapon: null,
      equippedDefense: null,
      equippedCosmetic: null,
      statBoosts: {},
      checkpoint: null,
      xp: 0, level: 1, coins: 0,
      currentCaptainId: 'base',
    };

    this.add.text(cx, 50, 'Select World', {
      fontSize: '30px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#4444cc',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Determine world unlock status
    const worldComplete = (worldIndex: number): boolean => {
      const w = WORLDS[worldIndex];
      const prog = save.worldProgress[w.id] ?? [];
      return prog.length === w.levels.length && prog.every(Boolean);
    };

    const isWorldUnlocked = (worldIndex: number): boolean => {
      if (worldIndex === 0) return true;
      return worldComplete(worldIndex - 1);
    };

    WORLDS.forEach((world, wi) => {
      const cardY = 150 + wi * 200;
      const unlocked = isWorldUnlocked(wi);
      const prog = save.worldProgress[world.id] ?? [];
      const cleared = prog.filter(Boolean).length;
      const themeColor = THEME_COLORS[world.theme] ?? 0x666666;

      // Card background
      const card = this.add.graphics();
      card.lineStyle(2, unlocked ? themeColor : 0x444444, 1);
      card.fillStyle(unlocked ? 0x111133 : 0x0a0a1a, 0.9);
      card.strokeRoundedRect(cx - 155, cardY - 70, 310, 140, 12);
      card.fillRoundedRect(cx - 155, cardY - 70, 310, 140, 12);

      // World name
      this.add.text(cx, cardY - 42, world.name, {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: unlocked ? '#' + themeColor.toString(16).padStart(6, '0') : '#666666',
      }).setOrigin(0.5);

      // Progress indicator
      this.add.text(cx, cardY - 14, `${cleared}/${world.levels.length} levels cleared`, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      if (!unlocked) {
        // Lock overlay
        this.add.text(cx, cardY + 30, '\uD83D\uDD12 Locked', {
          fontSize: '20px',
          fontFamily: 'Arial, sans-serif',
          color: '#666666',
        }).setOrigin(0.5);
      } else {
        // Level buttons: Star / Constellation / Galaxy
        const tiers = ['Star', 'Constellation', 'Galaxy'];
        const tierKeys = ['star', 'constellation', 'galaxy'];
        const spacing = 95;
        const startX = cx - spacing;

        tiers.forEach((tierName, li) => {
          const bx = startX + li * spacing;
          const levelCleared = prog[li] === true;
          const indicator = levelCleared ? '\u2713' : '\u25cb';
          const label = `${indicator} ${tierName}`;

          const btn = new Button(
            this,
            bx,
            cardY + 38,
            label,
            () => {
              this.cameras.main.fadeOut(300, 0, 0, 0);
              this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('Travel', { worldId: world.id, levelIndex: li });
              });
            },
            86,
            40
          );
          void btn;
        });
      }
    });

    new Button(this, cx, 780, 'Back', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
      });
    }, 140, 44);
  }
}
