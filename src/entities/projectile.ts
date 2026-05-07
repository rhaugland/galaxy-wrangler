import Phaser from 'phaser';
import { WeaponId } from '@/models/types';

export class Projectile extends Phaser.GameObjects.GameObject {
  private graphics: Phaser.GameObjects.Graphics;
  private body!: Phaser.Physics.Arcade.Body;
  private damage: number;
  private type: string;
  public x: number;
  public y: number;
  private vx: number;
  private vy: number;
  private scene: Phaser.Scene;
  private nearestEnemy: (() => Phaser.GameObjects.GameObject | null) | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    damage: number,
    speed: number,
    direction: { x: number; y: number },
    type: string
  ) {
    super(scene, 'Projectile');
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.type = type;

    const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y) || 1;
    this.vx = (direction.x / len) * speed;
    this.vy = (direction.y / len) * speed;

    this.graphics = scene.add.graphics();
    this.drawShape();

    scene.physics.world.enable(this.graphics);
    this.body = this.graphics.body as Phaser.Physics.Arcade.Body;
    this.body.setVelocity(this.vx, this.vy);
    this.body.setSize(8, 8);

    scene.add.existing(this);
  }

  private drawShape() {
    this.graphics.clear();
    switch (this.type) {
      case 'laser':
        this.graphics.lineStyle(2, 0xffff00, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(0, -12);
        this.graphics.lineTo(0, 0);
        this.graphics.strokePath();
        break;
      case 'spread':
        this.graphics.fillStyle(0x00ffff, 1);
        this.graphics.fillCircle(0, 0, 4);
        break;
      case 'missiles':
        this.graphics.fillStyle(0xff8800, 1);
        this.graphics.fillTriangle(0, -8, -3, 4, 3, 4);
        break;
      case 'beam':
        this.graphics.lineStyle(3, 0xff00ff, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(0, -16);
        this.graphics.lineTo(0, 0);
        this.graphics.strokePath();
        break;
      case 'enemy':
        this.graphics.fillStyle(0xff3333, 1);
        this.graphics.fillCircle(0, 0, 5);
        break;
      default:
        this.graphics.fillStyle(0xffffff, 1);
        this.graphics.fillCircle(0, 0, 4);
    }
    this.graphics.x = this.x;
    this.graphics.y = this.y;
  }

  setNearestEnemyFn(fn: () => Phaser.GameObjects.GameObject | null) {
    this.nearestEnemy = fn;
  }

  getDamage(): number {
    return this.damage;
  }

  getType(): string {
    return this.type;
  }

  getGraphics(): Phaser.GameObjects.Graphics {
    return this.graphics;
  }

  getBody(): Phaser.Physics.Arcade.Body {
    return this.body;
  }

  update(delta: number) {
    if (!this.active) return;

    // Homing for missiles
    if (this.type === 'missiles' && this.nearestEnemy) {
      const target = this.nearestEnemy();
      if (target) {
        const tx = (target as any).x ?? 0;
        const ty = (target as any).y ?? 0;
        const dx = tx - this.graphics.x;
        const dy = ty - this.graphics.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const homingStrength = 0.05;
        this.vx += (dx / len) * 300 * homingStrength;
        this.vy += (dy / len) * 300 * homingStrength;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = 300;
        if (speed > maxSpeed) {
          this.vx = (this.vx / speed) * maxSpeed;
          this.vy = (this.vy / speed) * maxSpeed;
        }
        this.body.setVelocity(this.vx, this.vy);
      }
    }

    this.graphics.x = this.body.x + this.body.width / 2;
    this.graphics.y = this.body.y + this.body.height / 2;

    const cam = this.scene.cameras.main;
    const bounds = 50;
    if (
      this.graphics.x < cam.scrollX - bounds ||
      this.graphics.x > cam.scrollX + cam.width + bounds ||
      this.graphics.y < cam.scrollY - bounds ||
      this.graphics.y > cam.scrollY + cam.height + bounds
    ) {
      this.destroySelf();
    }
  }

  destroySelf() {
    this.setActive(false);
    this.graphics.destroy();
    this.destroy();
  }
}

export function fireWeaponProjectiles(
  scene: Phaser.Scene,
  x: number,
  y: number,
  damage: number,
  weaponId: WeaponId | null,
  direction: { x: number; y: number }
): Projectile[] {
  const projectiles: Projectile[] = [];

  switch (weaponId) {
    case 'laser': {
      projectiles.push(new Projectile(scene, x, y, damage, 500, direction, 'laser'));
      break;
    }
    case 'spread': {
      const angles = [-15, 0, 15];
      for (const angleDeg of angles) {
        const rad = (angleDeg * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const dx = direction.x * cos - direction.y * sin;
        const dy = direction.x * sin + direction.y * cos;
        projectiles.push(new Projectile(scene, x, y, damage, 400, { x: dx, y: dy }, 'spread'));
      }
      break;
    }
    case 'missiles': {
      projectiles.push(new Projectile(scene, x, y, damage * 1.5, 300, direction, 'missiles'));
      break;
    }
    case 'beam': {
      projectiles.push(new Projectile(scene, x, y, damage * 0.5, 600, direction, 'beam'));
      break;
    }
    default: {
      // No weapon equipped: fire a basic shot
      projectiles.push(new Projectile(scene, x, y, damage, 450, direction, 'laser'));
      break;
    }
  }

  return projectiles;
}
