export class HpBar extends Phaser.GameObjects.Graphics {
  private barWidth: number;
  private barHeight: number;
  private fillColor: number;
  private currentPct: number = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ) {
    super(scene, { x, y });

    this.barWidth = width;
    this.barHeight = height;
    this.fillColor = color;

    this.draw(1);

    scene.add.existing(this);
  }

  setPercent(pct: number): void {
    this.currentPct = Math.max(0, Math.min(1, pct));
    this.draw(this.currentPct);
  }

  private draw(pct: number): void {
    this.clear();

    // Dark background
    this.fillStyle(0x111111, 0.85);
    this.fillRect(0, 0, this.barWidth, this.barHeight);

    // Thin border
    this.lineStyle(1, 0x333333, 1);
    this.strokeRect(0, 0, this.barWidth, this.barHeight);

    // Colored fill
    if (pct > 0) {
      this.fillStyle(this.fillColor, 1);
      this.fillRect(0, 0, Math.floor(this.barWidth * pct), this.barHeight);
    }
  }
}
