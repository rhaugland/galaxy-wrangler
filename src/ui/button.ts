export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private btnWidth: number;
  private btnHeight: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    labelText: string,
    callback: () => void,
    width = 160,
    height = 44
  ) {
    super(scene, x, y);

    // Enforce minimum 44px touch target
    this.btnWidth = Math.max(width, 44);
    this.btnHeight = Math.max(height, 44);

    this.bg = scene.add.graphics();
    this.drawBg(0x1a1a4e, 0x4444cc);

    this.label = scene.add.text(0, 0, labelText, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5, 0.5);

    this.add([this.bg, this.label]);

    this.setSize(this.btnWidth, this.btnHeight);
    this.setInteractive();

    this.on('pointerover', () => {
      this.setScale(1.05);
      this.drawBg(0x2a2a6e, 0x6666ff);
    });

    this.on('pointerout', () => {
      this.setScale(1.0);
      this.drawBg(0x1a1a4e, 0x4444cc);
    });

    this.on('pointerdown', () => {
      this.setScale(0.97);
      this.drawBg(0x111133, 0x3333aa);
    });

    this.on('pointerup', () => {
      this.setScale(1.05);
      this.drawBg(0x2a2a6e, 0x6666ff);
      callback();
    });

    scene.add.existing(this);
  }

  private drawBg(fillColor: number, strokeColor: number): void {
    this.bg.clear();
    this.bg.fillStyle(fillColor, 1);
    this.bg.lineStyle(2, strokeColor, 1);
    const hw = this.btnWidth / 2;
    const hh = this.btnHeight / 2;
    const r = 8;
    this.bg.strokeRoundedRect(-hw, -hh, this.btnWidth, this.btnHeight, r);
    this.bg.fillRoundedRect(-hw, -hh, this.btnWidth, this.btnHeight, r);
  }

  setLabel(text: string): void {
    this.label.setText(text);
  }
}
