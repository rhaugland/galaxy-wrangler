import Phaser from 'phaser';
import { MissionTemplate } from '@/models/types';
import { awardXp, awardCoins } from '@/systems/economy';
import { SaveManager, IDBBackend } from '@/systems/save-system';

const CANVAS_W = 390;
const CANVAS_H = 844;
const SCROLL_SPEED = 120; // px/sec
const ENEMY_SPAWN_INTERVAL = 1500; // ms
const PICKUP_SPAWN_INTERVAL = 1200; // ms
const WAVE_INTERVAL = 8000; // ms

// Placeholder ship size
const SHIP_W = 32;
const SHIP_H = 48;

interface Enemy {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  alive: boolean;
}

interface Pickup {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  alive: boolean;
}

interface Bullet {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  alive: boolean;
}

export class MissionScene extends Phaser.Scene {
  private mission!: MissionTemplate;
  private bgStars: Phaser.GameObjects.Graphics[] = [];
  private bgScrollY = 0;
  private ship!: Phaser.GameObjects.Graphics;
  private shipX = CANVAS_W / 2;
  private shipY = CANVAS_H - 120;
  private shipHp = 5;
  private shipMaxHp = 5;

  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];
  private bullets: Bullet[] = [];

  // Escort
  private cargoPod?: Phaser.GameObjects.Graphics;
  private cargoPodHp = 5;
  private cargoPodMaxHp = 5;
  private cargoHpBar?: Phaser.GameObjects.Graphics;

  // HUD
  private hudText!: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private hpBarBg!: Phaser.GameObjects.Graphics;
  private hpBarFill!: Phaser.GameObjects.Graphics;
  private objectiveLabel!: Phaser.GameObjects.Text;

  // Mission state
  private objectiveCount = 0;
  private timeElapsed = 0;
  private missionComplete = false;
  private missionFailed = false;
  private dialogShown = false;

  // Timers / counters
  private lastEnemySpawn = 0;
  private lastPickupSpawn = 0;
  private lastWave = 0;
  private lastShot = 0;
  private shotInterval = 400; // ms
  private distanceTraveled = 0;

  // Input
  private pointer!: Phaser.Input.Pointer;

  constructor() {
    super('Mission');
  }

  init(data: { mission?: MissionTemplate }) {
    this.mission = data.mission ?? {
      type: 'survive',
      description: 'Survive for 30 seconds.',
      difficulty: 'easy',
      xpReward: 10,
      coinReward: 20,
      target: 30,
      timeLimitSec: 30,
      minLevel: 0,
    };
    // Reset state
    this.enemies = [];
    this.pickups = [];
    this.bullets = [];
    this.bgStars = [];
    this.objectiveCount = 0;
    this.timeElapsed = 0;
    this.missionComplete = false;
    this.missionFailed = false;
    this.dialogShown = false;
    this.lastEnemySpawn = 0;
    this.lastPickupSpawn = 0;
    this.lastWave = 0;
    this.lastShot = 0;
    this.distanceTraveled = 0;
    this.shipHp = 5;
    this.cargoPodHp = 5;
    this.bgScrollY = 0;
  }

  create() {
    // Scrolling background — draw star layer
    const starGfx = this.add.graphics();
    this.drawStars(starGfx);
    this.bgStars.push(starGfx);

    const starGfx2 = this.add.graphics();
    this.drawStars(starGfx2);
    starGfx2.y = -CANVAS_H;
    this.bgStars.push(starGfx2);

    // Player ship (placeholder colored triangle via Graphics)
    this.ship = this.add.graphics();
    this.drawShip(this.ship, 0x44aaff);

    // Escort: cargo pod
    if (this.mission.type === 'escort') {
      this.cargoPod = this.add.graphics();
      this.drawCargoPod(this.cargoPod);
    }

    // HUD background strip
    this.add.rectangle(CANVAS_W / 2, 24, CANVAS_W, 48, 0x000000, 0.6);

    // HP bar
    this.hpBarBg = this.add.graphics();
    this.hpBarFill = this.add.graphics();
    this.drawHpBar();

    // Cargo HP bar (escort)
    if (this.mission.type === 'escort') {
      this.cargoHpBar = this.add.graphics();
    }

    // Objective label
    this.objectiveLabel = this.add.text(CANVAS_W / 2, 14, '', {
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    // Timer text (right side)
    if (this.mission.timeLimitSec) {
      this.timerText = this.add.text(CANVAS_W - 12, 14, '', {
        fontSize: '13px',
        color: '#ffdd44',
      }).setOrigin(1, 0.5);
    }

    // HUD main
    this.hudText = this.add.text(12, 14, '', {
      fontSize: '13px',
      color: '#aaaacc',
    }).setOrigin(0, 0.5);

    this.updateHud();

    this.pointer = this.input.activePointer;

    // Auto-fire via time event
    this.time.addEvent({
      delay: this.shotInterval,
      loop: true,
      callback: this.fireBullet,
      callbackScope: this,
    });
  }

  update(time: number, delta: number) {
    if (this.missionComplete || this.missionFailed) return;

    const dt = delta / 1000;
    this.timeElapsed += dt;

    // Scroll background
    this.bgScrollY += SCROLL_SPEED * dt;
    if (this.bgScrollY >= CANVAS_H) this.bgScrollY -= CANVAS_H;
    this.bgStars[0].y = this.bgScrollY;
    this.bgStars[1].y = this.bgScrollY - CANVAS_H;

    // Move ship toward pointer
    if (this.input.activePointer.isDown) {
      const tx = this.input.activePointer.x;
      const ty = this.input.activePointer.y;
      const dx = tx - this.shipX;
      const dy = ty - this.shipY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = 220;
      if (dist > 4) {
        this.shipX += (dx / dist) * speed * dt;
        this.shipY += (dy / dist) * speed * dt;
      }
    }
    // Clamp ship to canvas
    this.shipX = Phaser.Math.Clamp(this.shipX, SHIP_W / 2, CANVAS_W - SHIP_W / 2);
    this.shipY = Phaser.Math.Clamp(this.shipY, 60 + SHIP_H / 2, CANVAS_H - SHIP_H / 2);

    this.ship.x = this.shipX;
    this.ship.y = this.shipY;

    // Cargo pod follows ship (offset below)
    if (this.cargoPod) {
      this.cargoPod.x = this.shipX;
      this.cargoPod.y = this.shipY + 60;
    }

    // Distance tracking
    if (this.mission.type === 'distance') {
      this.distanceTraveled += SCROLL_SPEED * dt;
    }

    // Spawn enemies
    if (time - this.lastEnemySpawn > ENEMY_SPAWN_INTERVAL) {
      this.spawnEnemy();
      this.lastEnemySpawn = time;
    }

    // Wave spawner for survive / escort
    if (
      (this.mission.type === 'survive' || this.mission.type === 'escort') &&
      time - this.lastWave > WAVE_INTERVAL
    ) {
      for (let i = 0; i < 3; i++) this.spawnEnemy();
      this.lastWave = time;
    }

    // Spawn pickups for collect
    if (this.mission.type === 'collect' && time - this.lastPickupSpawn > PICKUP_SPAWN_INTERVAL) {
      this.spawnPickup();
      this.lastPickupSpawn = time;
    }

    // Move bullets up
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.y -= 500 * dt;
      b.graphics.y = b.y;
      if (b.y < -20) {
        b.alive = false;
        b.graphics.destroy();
      }
    }

    // Move enemies down
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.graphics.x = e.x;
      e.graphics.y = e.y;
      // Off-screen cleanup
      if (e.y > CANVAS_H + 40 || e.x < -40 || e.x > CANVAS_W + 40) {
        e.alive = false;
        e.graphics.destroy();
      }
    }

    // Move pickups down
    for (const p of this.pickups) {
      if (!p.alive) continue;
      p.y += 80 * dt;
      p.graphics.y = p.y;
      if (p.y > CANVAS_H + 20) {
        p.alive = false;
        p.graphics.destroy();
      }
    }

    // Bullet vs enemy collisions
    for (const b of this.bullets) {
      if (!b.alive) continue;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 20) {
          b.alive = false;
          b.graphics.destroy();
          e.hp--;
          if (e.hp <= 0) {
            e.alive = false;
            e.graphics.destroy();
            if (this.mission.type === 'destroy') {
              this.objectiveCount++;
            }
          }
          break;
        }
      }
    }

    // Player ship vs enemy collisions
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (Math.abs(this.shipX - e.x) < 24 && Math.abs(this.shipY - e.y) < 28) {
        e.alive = false;
        e.graphics.destroy();
        this.shipHp--;
        this.drawHpBar();
        if (this.shipHp <= 0) {
          this.handleFailure();
          return;
        }
      }
    }

    // Player ship vs pickup collisions
    for (const p of this.pickups) {
      if (!p.alive) continue;
      if (Math.abs(this.shipX - p.x) < 24 && Math.abs(this.shipY - p.y) < 24) {
        p.alive = false;
        p.graphics.destroy();
        if (this.mission.type === 'collect') {
          this.objectiveCount++;
        }
      }
    }

    // Enemies vs cargo pod
    if (this.cargoPod) {
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const podX = this.cargoPod.x;
        const podY = this.cargoPod.y;
        if (Math.abs(podX - e.x) < 28 && Math.abs(podY - e.y) < 28) {
          e.alive = false;
          e.graphics.destroy();
          this.cargoPodHp--;
          this.drawCargoHpBar();
          if (this.cargoPodHp <= 0) {
            this.handleFailure();
            return;
          }
        }
      }
    }

    // Check time limit (survive, escort, destroy with timer)
    if (this.mission.timeLimitSec) {
      const remaining = this.mission.timeLimitSec - this.timeElapsed;
      if (this.timerText) {
        this.timerText.setText(`${Math.max(0, Math.ceil(remaining))}s`);
      }
      // Survive/escort: success = outlast timer
      if (this.mission.type === 'survive' || this.mission.type === 'escort') {
        if (remaining <= 0) {
          this.handleSuccess();
          return;
        }
      }
      // destroy/collect: fail if timer runs out before objective
      if (
        (this.mission.type === 'destroy' || this.mission.type === 'collect') &&
        remaining <= 0 &&
        this.objectiveCount < this.mission.target
      ) {
        this.handleFailure();
        return;
      }
    }

    // Check objective completion
    if (this.mission.type === 'destroy' && this.objectiveCount >= this.mission.target) {
      this.handleSuccess();
      return;
    }
    if (this.mission.type === 'collect' && this.objectiveCount >= this.mission.target) {
      this.handleSuccess();
      return;
    }
    if (this.mission.type === 'distance' && this.distanceTraveled >= this.mission.target) {
      this.handleSuccess();
      return;
    }

    this.updateHud();
  }

  // ----- Drawing helpers -----

  private drawShip(gfx: Phaser.GameObjects.Graphics, color: number) {
    gfx.clear();
    gfx.fillStyle(color, 1);
    gfx.fillTriangle(0, -SHIP_H / 2, -SHIP_W / 2, SHIP_H / 2, SHIP_W / 2, SHIP_H / 2);
    gfx.fillStyle(0xffffff, 0.3);
    gfx.fillRect(-4, -SHIP_H / 4, 8, SHIP_H / 3);
  }

  private drawCargoPod(gfx: Phaser.GameObjects.Graphics) {
    gfx.clear();
    gfx.fillStyle(0xffaa33, 1);
    gfx.fillRect(-16, -12, 32, 24);
    gfx.strokeRect(-16, -12, 32, 24);
  }

  private drawStars(gfx: Phaser.GameObjects.Graphics) {
    gfx.clear();
    gfx.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 60; i++) {
      const sx = Math.random() * CANVAS_W;
      const sy = Math.random() * CANVAS_H;
      const r = Math.random() * 1.5 + 0.3;
      gfx.fillCircle(sx, sy, r);
    }
  }

  private drawHpBar() {
    this.hpBarBg.clear();
    this.hpBarFill.clear();
    const bx = 12;
    const by = CANVAS_H - 24;
    const bw = 100;
    const bh = 12;
    this.hpBarBg.fillStyle(0x333333);
    this.hpBarBg.fillRect(bx, by, bw, bh);
    const ratio = Math.max(0, this.shipHp / this.shipMaxHp);
    this.hpBarFill.fillStyle(ratio > 0.5 ? 0x44dd44 : ratio > 0.25 ? 0xffaa00 : 0xff3344);
    this.hpBarFill.fillRect(bx, by, Math.floor(bw * ratio), bh);
  }

  private drawCargoHpBar() {
    if (!this.cargoHpBar) return;
    this.cargoHpBar.clear();
    const bx = CANVAS_W - 112;
    const by = CANVAS_H - 24;
    const bw = 100;
    const bh = 12;
    this.cargoHpBar.fillStyle(0x333333);
    this.cargoHpBar.fillRect(bx, by, bw, bh);
    const ratio = Math.max(0, this.cargoPodHp / this.cargoPodMaxHp);
    this.cargoHpBar.fillStyle(0xffaa33);
    this.cargoHpBar.fillRect(bx, by, Math.floor(bw * ratio), bh);
  }

  private updateHud() {
    let objective = '';
    switch (this.mission.type) {
      case 'destroy':
        objective = `Kills: ${this.objectiveCount}/${this.mission.target}`;
        break;
      case 'survive':
        objective = `Survive: ${Math.ceil(this.timeElapsed)}s`;
        break;
      case 'collect':
        objective = `Collected: ${this.objectiveCount}/${this.mission.target}`;
        break;
      case 'distance':
        objective = `Distance: ${Math.floor(this.distanceTraveled)}/${this.mission.target}`;
        break;
      case 'escort':
        objective = `Cargo HP: ${this.cargoPodHp}/${this.cargoPodMaxHp}`;
        break;
    }
    this.objectiveLabel?.setText(objective);
    this.hudText?.setText(`HP: ${this.shipHp}`);
  }

  private spawnEnemy() {
    const x = Phaser.Math.Between(20, CANVAS_W - 20);
    const gfx = this.add.graphics();
    gfx.fillStyle(0xff4444, 1);
    gfx.fillTriangle(0, 18, -14, -18, 14, -18);
    gfx.x = x;
    gfx.y = -20;
    const vx = Phaser.Math.FloatBetween(-30, 30);
    this.enemies.push({ graphics: gfx, x, y: -20, vx, vy: 80, hp: 1, alive: true });
  }

  private spawnPickup() {
    const x = Phaser.Math.Between(20, CANVAS_W - 20);
    const gfx = this.add.graphics();
    gfx.fillStyle(0xffee44, 1);
    gfx.fillStar(0, 0, 5, 8, 4);
    gfx.x = x;
    gfx.y = -20;
    this.pickups.push({ graphics: gfx, x, y: -20, alive: true });
  }

  private fireBullet() {
    if (this.missionComplete || this.missionFailed) return;
    const gfx = this.add.graphics();
    gfx.fillStyle(0x88ddff, 1);
    gfx.fillRect(-3, -8, 6, 16);
    gfx.x = this.shipX;
    gfx.y = this.shipY - SHIP_H / 2;
    this.bullets.push({ graphics: gfx, x: this.shipX, y: this.shipY - SHIP_H / 2, alive: true });
  }

  // ----- Mission outcome -----

  private async handleSuccess() {
    if (this.missionComplete || this.missionFailed || this.dialogShown) return;
    this.missionComplete = true;
    this.dialogShown = true;

    // Award XP + coins, save
    try {
      const manager = new SaveManager(new IDBBackend());
      const save = await manager.load();
      if (save) {
        const updated = awardCoins(awardXp(save, this.mission.xpReward), this.mission.coinReward);
        await manager.save(updated);
        this.registry.set('playerLevel', updated.level);
      }
    } catch (_) {
      // Non-fatal — save not critical in gameplay
    }

    this.showResultDialog(true);
  }

  private handleFailure() {
    if (this.missionComplete || this.missionFailed || this.dialogShown) return;
    this.missionFailed = true;
    this.dialogShown = true;
    this.showResultDialog(false);
  }

  private showResultDialog(success: boolean) {
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;

    // Dim overlay
    this.add.rectangle(cx, cy, CANVAS_W, CANVAS_H, 0x000000, 0.65);

    // Dialog box
    this.add.rectangle(cx, cy, 280, 200, 0x1a1a2e).setStrokeStyle(2, 0x334466);

    const title = success ? 'Mission Complete!' : 'Mission Failed';
    const titleColor = success ? '#44ff88' : '#ff4444';
    this.add.text(cx, cy - 72, title, {
      fontSize: '22px',
      color: titleColor,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    if (success) {
      this.add.text(cx, cy - 36, `+${this.mission.xpReward} XP  +${this.mission.coinReward} coins`, {
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0.5, 0.5);

      // Return to Space button
      const btn = this.add.rectangle(cx, cy + 40, 200, 44, 0x226644)
        .setInteractive({ useHandCursor: true });
      this.add.text(cx, cy + 40, 'Return to Space', {
        fontSize: '16px',
        color: '#aaffcc',
      }).setOrigin(0.5, 0.5);
      btn.on('pointerup', () => this.scene.start('Space'));
      btn.on('pointerover', () => btn.setFillStyle(0x338855));
      btn.on('pointerout', () => btn.setFillStyle(0x226644));
    } else {
      // Retry button
      const retryBtn = this.add.rectangle(cx - 76, cy + 40, 130, 44, 0x664422)
        .setInteractive({ useHandCursor: true });
      this.add.text(cx - 76, cy + 40, 'Retry', {
        fontSize: '16px',
        color: '#ffccaa',
      }).setOrigin(0.5, 0.5);
      retryBtn.on('pointerup', () => this.scene.restart({ mission: this.mission }));
      retryBtn.on('pointerover', () => retryBtn.setFillStyle(0x885533));
      retryBtn.on('pointerout', () => retryBtn.setFillStyle(0x664422));

      // Return to Space button
      const spaceBtn = this.add.rectangle(cx + 76, cy + 40, 130, 44, 0x334466)
        .setInteractive({ useHandCursor: true });
      this.add.text(cx + 76, cy + 40, 'Return to Space', {
        fontSize: '14px',
        color: '#aaccff',
      }).setOrigin(0.5, 0.5);
      spaceBtn.on('pointerup', () => this.scene.start('Space'));
      spaceBtn.on('pointerover', () => spaceBtn.setFillStyle(0x556688));
      spaceBtn.on('pointerout', () => spaceBtn.setFillStyle(0x334466));
    }
  }
}
