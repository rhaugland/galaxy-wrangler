import Phaser from 'phaser';
import { generateMissionBoard } from '@/systems/mission-generator';
import { MissionTemplate } from '@/models/types';

const CANVAS_W = 390;
const CANVAS_H = 844;
const CARD_H = 120;
const CARD_MARGIN = 12;
const CARD_START_Y = 80;

const DIFFICULTY_COLORS: Record<string, number> = {
  easy: 0x00cc55,
  medium: 0xffaa00,
  hard: 0xff3344,
};

const TYPE_ICONS: Record<string, string> = {
  destroy: '💥',
  survive: '🛡',
  collect: '⭐',
  distance: '🚀',
  escort: '🤝',
};

export class SpaceScene extends Phaser.Scene {
  constructor() {
    super('Space');
  }

  create() {
    const playerLevel: number = this.registry.get('playerLevel') ?? 0;
    const missions = generateMissionBoard(playerLevel);

    // Background
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x0a0a1a);

    // Title
    this.add.text(CANVAS_W / 2, 36, 'Mission Board', {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // Mission cards
    missions.forEach((mission, i) => {
      this.createMissionCard(mission, i);
    });

    // Back button
    const backY = CARD_START_Y + missions.length * (CARD_H + CARD_MARGIN) + 36;
    const backBg = this.add.rectangle(CANVAS_W / 2, backY, 160, 44, 0x334466)
      .setInteractive({ useHandCursor: true });
    this.add.text(CANVAS_W / 2, backY, 'Back', {
      fontSize: '18px',
      color: '#aaccff',
    }).setOrigin(0.5, 0.5);
    backBg.on('pointerup', () => this.scene.start('MainMenu'));
    backBg.on('pointerover', () => backBg.setFillStyle(0x556688));
    backBg.on('pointerout', () => backBg.setFillStyle(0x334466));
  }

  private createMissionCard(mission: MissionTemplate, index: number) {
    const cardX = CANVAS_W / 2;
    const cardY = CARD_START_Y + index * (CARD_H + CARD_MARGIN) + CARD_H / 2;
    const cardW = CANVAS_W - 32;

    // Card background
    const cardBg = this.add.rectangle(cardX, cardY, cardW, CARD_H, 0x1a1a2e)
      .setStrokeStyle(1, 0x334466)
      .setInteractive({ useHandCursor: true });

    // Type icon + label
    const icon = TYPE_ICONS[mission.type] ?? '?';
    this.add.text(cardX - cardW / 2 + 16, cardY - 30, `${icon} ${mission.type.toUpperCase()}`, {
      fontSize: '13px',
      color: '#aaaacc',
    }).setOrigin(0, 0.5);

    // Description
    this.add.text(cardX - cardW / 2 + 16, cardY - 6, mission.description, {
      fontSize: '15px',
      color: '#ffffff',
      wordWrap: { width: cardW - 130 },
    }).setOrigin(0, 0.5);

    // Difficulty badge
    const diffColor = DIFFICULTY_COLORS[mission.difficulty] ?? 0x888888;
    this.add.rectangle(cardX + cardW / 2 - 56, cardY - 22, 80, 22, diffColor, 0.25)
      .setStrokeStyle(1, diffColor);
    this.add.text(cardX + cardW / 2 - 56, cardY - 22, mission.difficulty.toUpperCase(), {
      fontSize: '11px',
      color: '#' + diffColor.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // XP + Coin reward
    this.add.text(cardX + cardW / 2 - 16, cardY + 12, `+${mission.xpReward} XP`, {
      fontSize: '13px',
      color: '#66ddff',
    }).setOrigin(1, 0.5);
    this.add.text(cardX + cardW / 2 - 16, cardY + 30, `+${mission.coinReward} coins`, {
      fontSize: '13px',
      color: '#ffdd44',
    }).setOrigin(1, 0.5);

    // Tap to start
    cardBg.on('pointerup', () => {
      this.scene.start('Mission', { mission });
    });
    cardBg.on('pointerover', () => cardBg.setFillStyle(0x242440));
    cardBg.on('pointerout', () => cardBg.setFillStyle(0x1a1a2e));
  }
}
