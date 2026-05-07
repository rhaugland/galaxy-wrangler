import Phaser from 'phaser';

export class Pickup extends Phaser.GameObjects.GameObject {
  private graphics: Phaser.GameObjects.Graphics;
  private body!: Phaser.Physics.Arcade.Body;
  private type: 'coin' | 'collect';
  private value: number;
  private scene: Phaser.Scene;
  private tweenAngle: number = 0;
  private magnetRadius: number = 80;
  private speed: number = 40;
  private collected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: 'coin' | 'collect') {
    super(scene, 'Pickup');
    this.scene = scene;
    this.type = type;
    this.value = type === 'coin' ? Math.floor(Math.random() * 5) + 1 : 1;

    this.graphics = scene.add.graphics();
    this.drawShape(x, y);

    scene.physics.world.enable(this.graphics);
    this.body = this.graphics.body as Phaser.Physics.Arcade.Body;
    this.body.setVelocity(0, this.speed);
    this.body.setSize(16, 16);
    this.body.setOffset(-8, -8);

    scene.add.existing(this);
  }

  private drawShape(x: number, y: number) {
    this.graphics.clear();

    if (this.type === 'coin') {
      this.graphics.fillStyle(0xffdd00, 1);
      this.graphics.lineStyle(1, 0xffaa00, 1);
      this.graphics.fillCircle(0, 0, 7);
      this.graphics.strokeCircle(0, 0, 7);
      // Inner ring
      this.graphics.lineStyle(1, 0xffaa00, 0.6);
      this.graphics.strokeCircle(0, 0, 4);
    } else {
      // Green diamond for collectible
      this.graphics.fillStyle(0x00ff88, 1);
      this.graphics.lineStyle(1, 0x00cc66, 1);
      this.graphics.fillTriangle(0, -9, 7, 0, 0, 9);
      this.graphics.fillTriangle(0, -9, -7, 0, 0, 9);
      this.graphics.strokePath();
    }

    this.graphics.x = x;
    this.graphics.y = y;
  }

  getGraphics(): Phaser.GameObjects.Graphics {
    return this.graphics;
  }

  getBody(): Phaser.Physics.Arcade.Body {
    return this.body;
  }

  getType(): 'coin' | 'collect' {
    return this.type;
  }

  getValue(): number {
    return this.value;
  }

  update(delta: number, playerX: number, playerY: number) {
    if (!this.active || this.collected) return;

    // Animate spin
    this.tweenAngle += delta * 0.003;
    if (this.type === 'coin') {
      const scaleX = Math.abs(Math.cos(this.tweenAngle));
      this.graphics.setScale(scaleX, 1);
    } else {
      this.graphics.setRotation(this.tweenAngle);
    }

    // Magnet effect
    const dx = playerX - this.graphics.x;
    const dy = playerY - this.graphics.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.magnetRadius) {
      const magnetSpeed = 200 * (1 - dist / this.magnetRadius) + 80;
      const len = dist || 1;
      this.body.setVelocity((dx / len) * magnetSpeed, (dy / len) * magnetSpeed);
    } else {
      this.body.setVelocity(0, this.speed);
    }

    this.graphics.x = this.body.x + this.body.width / 2;
    this.graphics.y = this.body.y + this.body.height / 2;

    // Off-screen cleanup
    const cam = this.scene.cameras.main;
    if (this.graphics.y > cam.scrollY + cam.height + 60) {
      this.destroySelf();
    }

    // Overlap check with player
    if (dist < 20) {
      this.collect();
    }
  }

  private collect() {
    if (this.collected) return;
    this.collected = true;
    this.scene.events.emit('pickup-collected', { type: this.type, value: this.value });
    this.destroySelf();
  }

  destroySelf() {
    this.setActive(false);
    this.graphics.destroy();
    this.destroy();
  }
}
