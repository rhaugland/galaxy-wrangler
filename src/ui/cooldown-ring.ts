export class CooldownRing extends Phaser.GameObjects.Graphics {
  private ringRadius: number;

  constructor(scene: Phaser.Scene, x: number, y: number, radius: number) {
    super(scene, { x, y });

    this.ringRadius = radius;
    this.drawReady();

    scene.add.existing(this);
  }

  setCooldown(remaining: number, total: number): void {
    this.clear();

    if (total <= 0 || remaining <= 0) {
      this.drawReady();
      return;
    }

    const progress = Math.max(0, Math.min(1, remaining / total));

    // Dark ring background
    this.lineStyle(4, 0x333333, 0.6);
    this.strokeCircle(0, 0, this.ringRadius);

    // Gray partial arc showing cooldown progress (how much has elapsed)
    const elapsed = 1 - progress;
    if (elapsed > 0) {
      const startAngle = -Math.PI / 2; // top
      const endAngle = startAngle + elapsed * Math.PI * 2;
      this.lineStyle(4, 0x888888, 0.9);
      this.beginPath();
      this.arc(0, 0, this.ringRadius, startAngle, endAngle, false);
      this.strokePath();
    }

    // Small dot at center to indicate on cooldown
    this.fillStyle(0x555555, 0.8);
    this.fillCircle(0, 0, 4);
  }

  private drawReady(): void {
    this.clear();

    // Bright ring when ready
    this.lineStyle(4, 0x00ffff, 1);
    this.strokeCircle(0, 0, this.ringRadius);

    // Bright center dot
    this.fillStyle(0x00ffff, 1);
    this.fillCircle(0, 0, 5);

    // Subtle glow ring
    this.lineStyle(2, 0x00ffff, 0.3);
    this.strokeCircle(0, 0, this.ringRadius + 4);
  }
}
