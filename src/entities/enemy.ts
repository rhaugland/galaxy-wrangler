import Phaser from 'phaser';

type EnemyBehavior = 'drift' | 'chase' | 'patrol';

interface EnemyConfig {
  hp: number;
  damage: number;
  speed: number;
  behavior: EnemyBehavior;
  color: number;
  shape: 'circle' | 'diamond' | 'triangle' | 'hexagon' | 'small_circle' | 'jagged_circle';
  radius: number;
}

const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  mine: {
    hp: 1, damage: 20, speed: 50, behavior: 'drift',
    color: 0xff4444, shape: 'circle', radius: 12,
  },
  drone: {
    hp: 30, damage: 10, speed: 80, behavior: 'chase',
    color: 0x44aaff, shape: 'diamond', radius: 12,
  },
  ice_shard: {
    hp: 1, damage: 15, speed: 120, behavior: 'drift',
    color: 0xaaddff, shape: 'triangle', radius: 10,
  },
  frost_drone: {
    hp: 40, damage: 15, speed: 70, behavior: 'chase',
    color: 0x88ccff, shape: 'hexagon', radius: 14,
  },
  fire_proj: {
    hp: 1, damage: 25, speed: 100, behavior: 'drift',
    color: 0xff6600, shape: 'small_circle', radius: 7,
  },
  exploding_asteroid: {
    hp: 50, damage: 30, speed: 40, behavior: 'drift',
    color: 0xcc6633, shape: 'jagged_circle', radius: 18,
  },
};

export class Enemy extends Phaser.GameObjects.Container {
  private graphics: Phaser.GameObjects.Graphics;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  behavior: EnemyBehavior;
  private config: EnemyConfig;
  private patrolOffset: number;
  private patrolTime: number = 0;
  private patrolAmplitude: number = 60;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    super(scene, x, y);
    this.config = config;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.damage = config.damage;
    this.speed = config.speed;
    this.behavior = config.behavior;
    this.patrolOffset = Math.random() * Math.PI * 2;

    this.graphics = scene.add.graphics();
    this.drawShape();
    this.add(this.graphics);

    scene.physics.world.enable(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(config.radius * 2, config.radius * 2);
    body.setOffset(-config.radius, -config.radius);

    scene.add.existing(this);
  }

  private drawShape() {
    const { color, shape, radius } = this.config;
    this.graphics.clear();
    this.graphics.fillStyle(color, 1);
    this.graphics.lineStyle(1, 0xffffff, 0.5);

    switch (shape) {
      case 'circle':
        this.graphics.fillCircle(0, 0, radius);
        this.graphics.strokeCircle(0, 0, radius);
        break;

      case 'small_circle':
        this.graphics.fillCircle(0, 0, radius);
        this.graphics.strokeCircle(0, 0, radius);
        break;

      case 'diamond': {
        const r = radius;
        this.graphics.fillTriangle(0, -r, r, 0, 0, r);
        this.graphics.fillTriangle(0, -r, -r, 0, 0, r);
        break;
      }

      case 'triangle': {
        const r = radius;
        this.graphics.fillTriangle(0, -r, r, r, -r, r);
        break;
      }

      case 'hexagon': {
        const pts: number[] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
          pts.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        this.graphics.fillPoints(
          pts.reduce<Phaser.Geom.Point[]>((acc, _, i, arr) => {
            if (i % 2 === 0) acc.push(new Phaser.Geom.Point(arr[i], arr[i + 1]));
            return acc;
          }, []),
          true
        );
        break;
      }

      case 'jagged_circle': {
        const points = 12;
        const jaggedness = 0.3;
        this.graphics.beginPath();
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const r = radius * (1 - jaggedness + Math.random() * jaggedness * 2);
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) this.graphics.moveTo(px, py);
          else this.graphics.lineTo(px, py);
        }
        this.graphics.closePath();
        this.graphics.fillPath();
        this.graphics.strokePath();
        break;
      }
    }
  }

  update(delta: number, playerX: number, playerY: number, horizontal: boolean = false) {
    if (!this.active) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dt = delta / 1000;

    switch (this.behavior) {
      case 'drift': {
        if (horizontal) {
          body.setVelocity(-this.speed, 0);
        } else {
          body.setVelocity(0, this.speed);
        }
        break;
      }

      case 'chase': {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        body.setVelocity((dx / len) * this.speed, (dy / len) * this.speed);
        break;
      }

      case 'patrol': {
        this.patrolTime += dt;
        const sineVal = Math.sin(this.patrolTime * 2 + this.patrolOffset) * this.patrolAmplitude;
        if (horizontal) {
          body.setVelocity(-this.speed, sineVal);
        } else {
          body.setVelocity(sineVal, this.speed);
        }
        break;
      }
    }

    // Off-screen cleanup
    const cam = this.scene.cameras.main;
    const margin = 100;
    if (
      this.x < cam.scrollX - margin ||
      this.x > cam.scrollX + cam.width + margin ||
      this.y > cam.scrollY + cam.height + margin
    ) {
      this.destroySelf();
    }
  }

  takeDamage(amount: number) {
    this.hp -= amount;

    // Flash white on hit
    this.graphics.setAlpha(0.3);
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.graphics.setAlpha(1);
    });

    if (this.hp <= 0) {
      this.scene.events.emit('enemy-killed', { x: this.x, y: this.y, enemy: this });
      this.destroySelf();
    }
  }

  getDamage(): number {
    return this.damage;
  }

  destroySelf() {
    this.setActive(false);
    this.setVisible(false);
    this.destroy();
  }
}

export function createEnemy(scene: Phaser.Scene, type: string, x: number, y: number): Enemy {
  const config = ENEMY_CONFIGS[type] ?? ENEMY_CONFIGS['mine'];
  return new Enemy(scene, x, y, config);
}
