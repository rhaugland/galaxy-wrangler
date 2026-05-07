import Phaser from 'phaser';

export class Obstacle extends Phaser.GameObjects.GameObject {
  private graphics: Phaser.GameObjects.Graphics;
  private body!: Phaser.Physics.Arcade.Body;
  private size: number;
  private speed: number;
  private scene: Phaser.Scene;
  public damage: number;

  constructor(scene: Phaser.Scene, x: number, y: number, size: number) {
    super(scene, 'Obstacle');
    this.scene = scene;
    this.size = Math.max(0.5, Math.min(2.0, size));
    this.damage = this.size * 15;
    this.speed = 60 + Math.random() * 40;

    this.graphics = scene.add.graphics();
    this.drawAsteroid(x, y);

    scene.physics.world.enable(this.graphics);
    this.body = this.graphics.body as Phaser.Physics.Arcade.Body;
    this.body.setVelocity(0, this.speed);

    const radius = 20 * this.size;
    this.body.setSize(radius * 2, radius * 2);
    this.body.setOffset(-radius, -radius);

    scene.add.existing(this);
  }

  private drawAsteroid(x: number, y: number) {
    const radius = 20 * this.size;
    const points = 10;
    const jaggedness = 0.35;

    this.graphics.clear();
    this.graphics.fillStyle(0x888888, 1);
    this.graphics.lineStyle(1, 0xaaaaaa, 0.8);

    this.graphics.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = radius * (1 - jaggedness + Math.random() * jaggedness * 2);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) {
        this.graphics.moveTo(px, py);
      } else {
        this.graphics.lineTo(px, py);
      }
    }
    this.graphics.closePath();
    this.graphics.fillPath();
    this.graphics.strokePath();

    this.graphics.x = x;
    this.graphics.y = y;
  }

  getGraphics(): Phaser.GameObjects.Graphics {
    return this.graphics;
  }

  getBody(): Phaser.Physics.Arcade.Body {
    return this.body;
  }

  getSize(): number {
    return this.size;
  }

  update() {
    if (!this.active) return;

    const cam = this.scene.cameras.main;
    if (this.graphics.y > cam.scrollY + cam.height + 100) {
      this.destroySelf();
    }
  }

  destroySelf() {
    this.setActive(false);
    this.graphics.destroy();
    this.destroy();
  }
}
