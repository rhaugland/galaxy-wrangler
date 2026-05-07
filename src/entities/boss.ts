import Phaser from 'phaser';
import { BossDef } from '@/models/types';
import { Projectile } from './projectile';

const CANVAS_W = 390;
const CANVAS_H = 844;

export class Boss extends Phaser.GameObjects.Container {
  private graphics: Phaser.GameObjects.Graphics;
  private body!: Phaser.Physics.Arcade.Body;

  private name: string;
  private hp: number;
  private maxHp: number;
  private style: BossDef['style'];
  public coinBonus: number;
  public replayCoinBonus: number;

  private phase: 1 | 2 | 3 = 1;
  private projectiles: Projectile[] = [];

  // Timers
  private lastFireTime = 0;
  private lastChargeTime = 0;
  private isCharging = false;
  private chargeEndTime = 0;

  // Movement state for tap_shoot
  private moveDirY = 1;
  private moveSpeed = 60;

  // ram_retreat trail
  private trailProjectiles: Projectile[] = [];

  // Pulse animation
  private pulseTime = 0;

  // Beam sweep state for auto_dodge phase 3
  private beamActive = false;
  private beamEndTime = 0;
  private beamGraphics: Phaser.GameObjects.Graphics | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bossDef: BossDef
  ) {
    super(scene, x, y);

    this.name = bossDef.name;
    this.hp = bossDef.hp;
    this.maxHp = bossDef.hp;
    this.style = bossDef.style;
    this.coinBonus = bossDef.coinBonus;
    this.replayCoinBonus = bossDef.replayCoinBonus;

    this.graphics = scene.add.graphics();
    this.drawBoss();
    this.add(this.graphics);

    // Enable arcade physics on container via the graphics child
    scene.physics.world.enable(this);
    this.body = (this as any).body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.body.setSize(64, 64);
    this.body.setOffset(-32, -32);
    this.body.setImmovable(true);

    scene.add.existing(this);
  }

  private drawBoss() {
    this.graphics.clear();

    switch (this.style) {
      case 'auto_dodge':
        this.drawNebulaBoss();
        break;
      case 'tap_shoot':
        this.drawIceBoss();
        break;
      case 'ram_retreat':
        this.drawInfernoBoss();
        break;
    }
  }

  private drawNebulaBoss() {
    // Large pulsing circle — nebula/purple/pink
    const pulse = 1 + Math.sin(this.pulseTime * 3) * 0.08;
    const r = 38 * pulse;

    // Outer glow
    this.graphics.fillStyle(0x9900cc, 0.3);
    this.graphics.fillCircle(0, 0, r + 14);

    // Mid ring
    this.graphics.fillStyle(0xcc44ff, 0.55);
    this.graphics.fillCircle(0, 0, r + 6);

    // Core
    this.graphics.fillStyle(0xff66ff, 1);
    this.graphics.fillCircle(0, 0, r);

    // Inner highlight
    this.graphics.fillStyle(0xffffff, 0.35);
    this.graphics.fillCircle(-10, -10, r * 0.35);

    // Orbiting dot accents
    for (let i = 0; i < 4; i++) {
      const angle = this.pulseTime * 1.5 + (i * Math.PI) / 2;
      const ox = Math.cos(angle) * (r + 20);
      const oy = Math.sin(angle) * (r + 20);
      this.graphics.fillStyle(0xdd88ff, 0.9);
      this.graphics.fillCircle(ox, oy, 5);
    }
  }

  private drawIceBoss() {
    // Angular crystalline — ice/cyan/white
    const spikes = 8;
    const outerR = 42;
    const innerR = 22;

    // Outer glow
    this.graphics.fillStyle(0x00ccff, 0.2);
    this.graphics.fillCircle(0, 0, outerR + 12);

    // Crystal body (star polygon)
    this.graphics.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) {
        this.graphics.moveTo(px, py);
      } else {
        this.graphics.lineTo(px, py);
      }
    }
    this.graphics.closePath();
    this.graphics.fillStyle(0x88eeff, 1);
    this.graphics.fillPath();

    // Inner crystal
    this.graphics.fillStyle(0xeeffff, 0.85);
    this.graphics.fillTriangle(0, -20, -18, 18, 18, 18);
    this.graphics.fillTriangle(0, 20, -18, -18, 18, -18);

    // Edge outline
    this.graphics.lineStyle(2, 0xffffff, 0.8);
    this.graphics.strokeCircle(0, 0, outerR);
  }

  private drawInfernoBoss() {
    // Fiery jagged shape — inferno/orange/red
    const spikes = 10;
    const outerR = 44;
    const innerR = 24;

    // Outer fire glow
    this.graphics.fillStyle(0xff4400, 0.25);
    this.graphics.fillCircle(0, 0, outerR + 16);

    this.graphics.fillStyle(0xff6600, 0.45);
    this.graphics.fillCircle(0, 0, outerR + 8);

    // Jagged fire body
    this.graphics.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const jitter = i % 2 === 0 ? outerR + Phaser.Math.FloatBetween(-4, 4) : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2 + this.pulseTime * 0.5;
      const px = Math.cos(angle) * jitter;
      const py = Math.sin(angle) * jitter;
      if (i === 0) {
        this.graphics.moveTo(px, py);
      } else {
        this.graphics.lineTo(px, py);
      }
    }
    this.graphics.closePath();
    this.graphics.fillStyle(0xff3300, 1);
    this.graphics.fillPath();

    // Inner hot core
    this.graphics.fillStyle(0xffcc00, 0.9);
    this.graphics.fillCircle(0, 0, 18);

    this.graphics.fillStyle(0xffffff, 0.6);
    this.graphics.fillCircle(0, 0, 9);
  }

  private checkPhaseChange() {
    const pct = this.hp / this.maxHp;
    if (pct <= 0.33 && this.phase < 3) {
      this.phase = 3;
      this.onPhaseChange(3);
    } else if (pct <= 0.66 && this.phase < 2) {
      this.phase = 2;
      this.onPhaseChange(2);
    }
  }

  private onPhaseChange(newPhase: 2 | 3) {
    // Visual flash on phase change
    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0.2,
      duration: 80,
      yoyo: true,
      repeat: 5,
      onComplete: () => { this.graphics.alpha = 1; },
    });

    // Speed up movement for tap_shoot
    if (this.style === 'tap_shoot') {
      this.moveSpeed = newPhase === 2 ? 110 : 175;
    }
  }

  // ---- Attack pattern dispatchers ----

  update(time: number, delta: number, playerY: number) {
    if (!this.active || this.hp <= 0) return;

    this.pulseTime += delta / 1000;

    // Redraw animated boss shapes every frame
    if (this.style === 'auto_dodge' || this.style === 'ram_retreat') {
      this.drawBoss();
    }

    this.checkPhaseChange();
    this.cleanProjectiles();

    switch (this.style) {
      case 'auto_dodge':
        this.updateAutoDodge(time, delta, playerY);
        break;
      case 'tap_shoot':
        this.updateTapShoot(time, delta, playerY);
        break;
      case 'ram_retreat':
        this.updateRamRetreat(time, delta, playerY);
        break;
    }
  }

  // ---- auto_dodge patterns ----

  private updateAutoDodge(time: number, _delta: number, playerY: number) {
    // Phase 1: single shot every 2s
    // Phase 2: 3-spread every 1.5s
    // Phase 3: 5-fan + beam every 1s
    const cooldowns = [2000, 1500, 1000];
    const cd = cooldowns[this.phase - 1];

    if (time - this.lastFireTime > cd) {
      this.lastFireTime = time;
      this.fireAutoDodgePattern(playerY);
    }

    // Beam overlay update
    if (this.beamActive && time > this.beamEndTime) {
      this.beamActive = false;
      if (this.beamGraphics) {
        this.beamGraphics.destroy();
        this.beamGraphics = null;
      }
    }
  }

  private fireAutoDodgePattern(playerY: number) {
    const ox = this.x;
    const oy = this.y;
    const dx = -1; // fires left toward player
    const dy = playerY - oy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ndx = dx / len;
    const ndy = dy / len;

    if (this.phase === 1) {
      this.spawnBossProjectile(ox - 30, oy, ndx, ndy, 220);
    } else if (this.phase === 2) {
      const angles = [-18, 0, 18];
      for (const a of angles) {
        const rad = (a * Math.PI) / 180;
        const rx = ndx * Math.cos(rad) - ndy * Math.sin(rad);
        const ry = ndx * Math.sin(rad) + ndy * Math.cos(rad);
        this.spawnBossProjectile(ox - 30, oy, rx, ry, 240);
      }
    } else {
      // 5-fan
      const angles = [-30, -15, 0, 15, 30];
      for (const a of angles) {
        const rad = (a * Math.PI) / 180;
        const rx = ndx * Math.cos(rad) - ndy * Math.sin(rad);
        const ry = ndx * Math.sin(rad) + ndy * Math.cos(rad);
        this.spawnBossProjectile(ox - 30, oy, rx, ry, 260);
      }
      // Sweeping beam visual
      this.fireBeam();
    }
  }

  private fireBeam() {
    if (this.beamGraphics) this.beamGraphics.destroy();
    this.beamGraphics = this.scene.add.graphics();
    this.beamGraphics.lineStyle(6, 0xff00ff, 0.85);
    this.beamGraphics.beginPath();
    this.beamGraphics.moveTo(this.x - 30, this.y);
    this.beamGraphics.lineTo(0, this.y);
    this.beamGraphics.strokePath();
    this.beamGraphics.setDepth(5);
    this.beamActive = true;
    this.beamEndTime = this.scene.time.now + 600;

    // Tween beam across vertical range
    this.scene.tweens.add({
      targets: this.beamGraphics,
      y: { from: -80, to: 80 },
      duration: 600,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.beamGraphics) {
          this.beamGraphics.destroy();
          this.beamGraphics = null;
        }
      },
    });

    // Spawn beam-path projectiles as dots along the beam
    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 60, () => {
        if (!this.active || this.hp <= 0) return;
        this.spawnBossProjectile(this.x - 30, this.y + Phaser.Math.Between(-80, 80), -1, 0, 200);
      });
    }
  }

  // ---- tap_shoot patterns ----

  private updateTapShoot(time: number, delta: number, playerY: number) {
    // Boss oscillates up/down
    const dt = delta / 1000;

    if (this.style === 'tap_shoot') {
      this.y += this.moveDirY * this.moveSpeed * dt;

      // Phase 3 zigzag: also add slight x oscillation
      if (this.phase === 3) {
        this.x = 310 + Math.sin(this.pulseTime * 4) * 25;
      }

      // Bounce off vertical bounds (keep inside playfield)
      const margin = 80;
      if (this.y > CANVAS_H - margin) {
        this.y = CANVAS_H - margin;
        this.moveDirY = -1;
      } else if (this.y < margin) {
        this.y = margin;
        this.moveDirY = 1;
      }

      // Sync physics body
      this.body.reset(this.x, this.y);
    }

    const cooldowns = [2500, 2000, 1500];
    const cd = cooldowns[this.phase - 1];

    if (time - this.lastFireTime > cd) {
      this.lastFireTime = time;
      this.fireTapShootPattern(playerY);
    }
  }

  private fireTapShootPattern(playerY: number) {
    const ox = this.x;
    const oy = this.y;
    const dx = -1;
    const dy = playerY - oy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ndx = dx / len;
    const ndy = dy / len;

    if (this.phase === 1) {
      this.spawnBossProjectile(ox - 30, oy, ndx, ndy, 200);
    } else if (this.phase === 2) {
      this.spawnBossProjectile(ox - 30, oy - 10, ndx, ndy, 220);
      this.spawnBossProjectile(ox - 30, oy + 10, ndx, ndy, 220);
    } else {
      // 3 aimed shots
      const offsets = [-12, 0, 12];
      for (const off of offsets) {
        this.spawnBossProjectile(ox - 30, oy + off, ndx, ndy, 240);
      }
      // Radial burst (8 directions)
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        this.spawnBossProjectile(ox, oy, Math.cos(angle), Math.sin(angle), 160);
      }
    }
  }

  // ---- ram_retreat patterns ----

  private updateRamRetreat(time: number, delta: number, _playerY: number) {
    const dt = delta / 1000;

    if (this.isCharging) {
      // Move left during charge
      const chargeSpeed = this.phase === 3 ? 320 : 220;
      this.x -= chargeSpeed * dt;

      // Leave fire trail in phase 2+
      if (this.phase >= 2 && Math.random() < 0.15) {
        this.spawnTrailProjectile();
      }
      // Spawn fire projectiles during charge in phase 3
      if (this.phase === 3 && Math.random() < 0.08) {
        this.spawnBossProjectile(
          this.x,
          this.y + Phaser.Math.Between(-30, 30),
          -1 + Math.random() * 0.4,
          (Math.random() - 0.5) * 0.8,
          180
        );
      }

      if (time > this.chargeEndTime) {
        this.isCharging = false;
        // Retreat back to home position
        this.retreatToHome();
      }

      this.body.reset(this.x, this.y);
    } else {
      // Determine sit/charge window
      const sitWindow = this.phase === 1 ? 3000 : this.phase === 2 ? 2000 : 1200;
      if (time - this.lastChargeTime > sitWindow) {
        this.lastChargeTime = time;
        this.isCharging = true;
        const chargeDuration = this.phase === 3 ? 500 + Math.random() * 400 : 600;
        this.chargeEndTime = time + chargeDuration;
      }
    }
  }

  private retreatToHome() {
    const homeX = 310;
    this.scene.tweens.add({
      targets: this,
      x: homeX,
      duration: 500,
      ease: 'Back.easeOut',
      onUpdate: () => {
        if (this.body) this.body.reset(this.x, this.y);
      },
    });
  }

  private spawnTrailProjectile() {
    const proj = new Projectile(
      this.scene,
      this.x,
      this.y + Phaser.Math.Between(-20, 20),
      8,
      0,
      { x: 0, y: 0 },
      'enemy'
    );
    // Trail stays in place briefly then fades
    this.scene.time.delayedCall(1200, () => {
      if (proj.active) proj.destroySelf();
    });
    this.trailProjectiles.push(proj);
  }

  // ---- Shared helpers ----

  private spawnBossProjectile(
    x: number,
    y: number,
    dx: number,
    dy: number,
    speed: number
  ): Projectile {
    const proj = new Projectile(this.scene, x, y, 10, speed, { x: dx, y: dy }, 'enemy');
    this.projectiles.push(proj);
    return proj;
  }

  private cleanProjectiles() {
    this.projectiles = this.projectiles.filter((p) => p.active);
    this.trailProjectiles = this.trailProjectiles.filter((p) => p.active);
  }

  takeDamage(amount: number) {
    if (this.hp <= 0) return;
    this.hp = Math.max(0, this.hp - amount);

    // Flash white
    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0.3,
      duration: 60,
      yoyo: true,
      repeat: 1,
      onComplete: () => { this.graphics.alpha = 1; },
    });

    this.checkPhaseChange();
  }

  getHP(): number { return this.hp; }
  getMaxHP(): number { return this.maxHp; }
  isDefeated(): boolean { return this.hp <= 0; }
  getProjectiles(): Projectile[] { return this.projectiles; }
  getTrailProjectiles(): Projectile[] { return this.trailProjectiles; }

  getBody(): Phaser.Physics.Arcade.Body { return this.body; }
  getGraphics(): Phaser.GameObjects.Graphics { return this.graphics; }

  stopAll() {
    this.setActive(false);
    this.body.setVelocity(0, 0);
    this.body.setImmovable(true);
    if (this.beamGraphics) {
      this.beamGraphics.destroy();
      this.beamGraphics = null;
    }
  }

  destroySelf() {
    this.stopAll();
    for (const p of this.projectiles) { if (p.active) p.destroySelf(); }
    for (const p of this.trailProjectiles) { if (p.active) p.destroySelf(); }
    this.projectiles = [];
    this.trailProjectiles = [];
    this.destroy();
  }
}
