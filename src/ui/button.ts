import { FONT } from './theme';

export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private btnWidth: number;
  private btnHeight: number;
  private glowGraphics: Phaser.GameObjects.Graphics;

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

    this.btnWidth = Math.max(width, 44);
    this.btnHeight = Math.max(height, 44);

    // Glow layer (behind button)
    this.glowGraphics = scene.add.graphics();
    this.drawGlow(0xff1493, 0.08);

    this.bg = scene.add.graphics();
    this.drawBg(0x0a0a0a, 0xff1493, 0.8);

    this.label = scene.add.text(0, 0, labelText, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: FONT,
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5, 0.5);

    this.add([this.glowGraphics, this.bg, this.label]);

    this.setSize(this.btnWidth, this.btnHeight);
    this.setInteractive();

    this.on('pointerover', () => {
      this.setScale(1.05);
      this.drawBg(0x1a0a1a, 0x00ffff, 1);
      this.drawGlow(0x00ffff, 0.15);
      this.label.setColor('#00ffff');
    });

    this.on('pointerout', () => {
      this.setScale(1.0);
      this.drawBg(0x0a0a0a, 0xff1493, 0.8);
      this.drawGlow(0xff1493, 0.08);
      this.label.setColor('#ffffff');
    });

    this.on('pointerdown', () => {
      this.setScale(0.95);
      this.drawBg(0x000000, 0xff69b4, 1);
      this.drawGlow(0xff69b4, 0.2);
    });

    this.on('pointerup', () => {
      this.setScale(1.05);
      this.drawBg(0x1a0a1a, 0x00ffff, 1);
      this.drawGlow(0x00ffff, 0.15);
      callback();
    });

    scene.add.existing(this);
  }

  private drawBg(fillColor: number, strokeColor: number, strokeAlpha: number): void {
    this.bg.clear();
    const hw = this.btnWidth / 2;
    const hh = this.btnHeight / 2;
    const r = 4;

    // Dark fill
    this.bg.fillStyle(fillColor, 0.85);
    this.bg.fillRoundedRect(-hw, -hh, this.btnWidth, this.btnHeight, r);

    // Neon border
    this.bg.lineStyle(1.5, strokeColor, strokeAlpha);
    this.bg.strokeRoundedRect(-hw, -hh, this.btnWidth, this.btnHeight, r);

    // Inner highlight line at top
    this.bg.lineStyle(1, 0xffffff, 0.05);
    this.bg.lineBetween(-hw + r, -hh + 1, hw - r, -hh + 1);
  }

  private drawGlow(color: number, alpha: number): void {
    this.glowGraphics.clear();
    const hw = this.btnWidth / 2;
    const hh = this.btnHeight / 2;
    // Soft glow behind button
    this.glowGraphics.fillStyle(color, alpha);
    this.glowGraphics.fillRoundedRect(-hw - 4, -hh - 4, this.btnWidth + 8, this.btnHeight + 8, 8);
    this.glowGraphics.fillStyle(color, alpha * 0.5);
    this.glowGraphics.fillRoundedRect(-hw - 8, -hh - 8, this.btnWidth + 16, this.btnHeight + 16, 12);
  }

  setLabel(text: string): void {
    this.label.setText(text);
  }
}
