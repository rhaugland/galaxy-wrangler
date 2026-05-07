import { Button } from './button';

const GAME_WIDTH = 390;
const GAME_HEIGHT = 844;

export class Dialog extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    title: string,
    options: Array<{ label: string; callback: () => void }>
  ) {
    super(scene, 0, 0);

    // Semi-transparent full-screen backdrop
    const backdrop = scene.add.graphics();
    backdrop.fillStyle(0x000000, 0.75);
    backdrop.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.add(backdrop);

    // Dialog panel
    const panelWidth = 300;
    const panelHeight = 80 + options.length * 60 + 40;
    const panelX = (GAME_WIDTH - panelWidth) / 2;
    const panelY = GAME_HEIGHT / 3 - 40;

    const panel = scene.add.graphics();
    panel.fillStyle(0x0d0d3a, 0.97);
    panel.lineStyle(2, 0x4444cc, 1);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    this.add(panel);

    // Title text
    const titleText = scene.add.text(
      GAME_WIDTH / 2,
      panelY + 36,
      title,
      {
        fontSize: '22px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: panelWidth - 32 },
      }
    ).setOrigin(0.5, 0.5);
    this.add(titleText);

    // Buttons stacked vertically
    const buttonStartY = panelY + 80;
    options.forEach((opt, i) => {
      const btn = new Button(
        scene,
        GAME_WIDTH / 2,
        buttonStartY + i * 56,
        opt.label,
        () => {
          this.destroy();
          opt.callback();
        },
        220,
        44
      );
      this.add(btn);
    });

    // Bring to top of display list
    scene.add.existing(this);
    this.setDepth(100);
  }

  destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
  }
}
