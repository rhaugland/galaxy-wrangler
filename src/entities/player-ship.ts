import Phaser from 'phaser';
import { ShipStats, WeaponId } from '@/models/types';
import { TiltState } from '@/systems/input-system';
import { Projectile, fireWeaponProjectiles } from './projectile';

export class PlayerShip extends Phaser.GameObjects.GameObject {
  private graphics: Phaser.GameObjects.Graphics;
  private body!: Phaser.Physics.Arcade.Body;
  private scene: Phaser.Scene;

  private stats: ShipStats;
  private weaponId: WeaponId | null;

  private hp: number;
  private maxHp: number;
  private shield: number;
  private speed: number;
  private damage: number;

  private autoFireTimer: Phaser.Time.TimerEvent | null = null;
  private fireDirection: { x: number; y: number } = { x: 0, y: -1 };
  private isHorizontalMode: boolean = false;

  private projectiles: Projectile[] = [];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    stats: ShipStats,
    weaponId: WeaponId | null
  ) {
    super(scene, 'PlayerShip');
    this.scene = scene;
    this.stats = stats;
    this.weaponId = weaponId;

    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.shield = stats.shield;
    this.speed = stats.speed;
    this.damage = stats.damage;

    this.graphics = scene.add.graphics();
    this.drawShip();
    this.graphics.x = x;
    this.graphics.y = y;

    scene.physics.world.enable(this.graphics);
    this.body = this.graphics.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(this.speed * 200, this.speed * 200);
    this.body.setSize(28, 32);
    this.body.setOffset(-14, -16);

    scene.add.existing(this);
  }

  private drawShip() {
    this.graphics.clear();

    // Main hull — triangle/arrow vector shape
    this.graphics.fillStyle(0x00ccff, 1);
    this.graphics.fillTriangle(0, -20, -14, 14, 14, 14);

    // Center accent
    this.graphics.fillStyle(0xffffff, 0.9);
    this.graphics.fillTriangle(0, -14, -6, 8, 6, 8);

    // Engine glow
    this.graphics.fillStyle(0xff6600, 0.8);
    this.graphics.fillRect(-8, 10, 6, 8);
    this.graphics.fillRect(2, 10, 6, 8);

    // Wing details
    this.graphics.lineStyle(1, 0x0088cc, 1);
    this.graphics.strokeTriangle(0, -20, -14, 14, 14, 14);
  }

  setHorizontalMode(horizontal: boolean) {
    this.isHorizontalMode = horizontal;
    this.fireDirection = horizontal ? { x: 1, y: 0 } : { x: 0, y: -1 };
    if (horizontal) {
      this.graphics.setRotation(Math.PI / 2);
    } else {
      this.graphics.setRotation(0);
    }
  }

  moveByTilt(tiltState: TiltState) {
    const baseSpeed = this.speed * 180;

    if (this.isHorizontalMode) {
      // Horizontal boss mode: tilt.y controls vertical, ship moves horizontally
      this.body.setVelocity(0, tiltState.y * baseSpeed);
    } else {
      // Vertical travel: tilt.x controls horizontal, ship stays vertically centered
      this.body.setVelocity(tiltState.x * baseSpeed, 0);
    }

    this.graphics.x = this.body.x + this.body.width / 2;
    this.graphics.y = this.body.y + this.body.height / 2;
  }

  fireWeapon() {
    const newProjectiles = fireWeaponProjectiles(
      this.scene,
      this.graphics.x,
      this.graphics.y - 10,
      this.damage,
      this.weaponId,
      this.fireDirection
    );
    this.projectiles.push(...newProjectiles);
  }

  startAutoFire() {
    if (this.autoFireTimer) return;

    const fireRate = this.getFireRate();
    this.autoFireTimer = this.scene.time.addEvent({
      delay: fireRate,
      callback: this.fireWeapon,
      callbackScope: this,
      loop: true,
    });
  }

  stopAutoFire() {
    if (this.autoFireTimer) {
      this.autoFireTimer.remove();
      this.autoFireTimer = null;
    }
  }

  private getFireRate(): number {
    switch (this.weaponId) {
      case 'laser': return 250;
      case 'spread': return 400;
      case 'missiles': return 600;
      case 'beam': return 100;
      default: return 300;
    }
  }

  takeDamage(amount: number) {
    const reduced = amount * (1 - this.shield / 100);
    this.hp -= reduced;

    // Flash red
    this.graphics.setTint(0xff0000);
    this.scene.time.delayedCall(120, () => {
      if (this.active) this.graphics.clearTint();
    });

    if (this.hp <= 0) {
      this.hp = 0;
      this.scene.events.emit('player-death');
    }
  }

  useAbility() {
    this.scene.events.emit('ability-used');
  }

  getHP(): number {
    return this.hp;
  }

  getMaxHP(): number {
    return this.maxHp;
  }

  getGraphics(): Phaser.GameObjects.Graphics {
    return this.graphics;
  }

  getBody(): Phaser.Physics.Arcade.Body {
    return this.body;
  }

  getProjectiles(): Projectile[] {
    return this.projectiles;
  }

  clearDeadProjectiles() {
    this.projectiles = this.projectiles.filter((p) => p.active);
  }

  setWeapon(weaponId: WeaponId | null) {
    this.weaponId = weaponId;
    const wasAutoFiring = this.autoFireTimer !== null;
    this.stopAutoFire();
    if (wasAutoFiring) this.startAutoFire();
  }

  update(delta: number) {
    if (!this.active) return;

    // Sync graphics position with physics body
    this.graphics.x = this.body.x + this.body.width / 2;
    this.graphics.y = this.body.y + this.body.height / 2;

    // Update all live projectiles
    for (const proj of this.projectiles) {
      if (proj.active) {
        proj.update(delta);
      }
    }
    this.clearDeadProjectiles();
  }

  destroySelf() {
    this.stopAutoFire();
    this.setActive(false);
    this.graphics.destroy();
    this.destroy();
  }
}
