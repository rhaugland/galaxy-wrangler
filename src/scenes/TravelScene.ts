import Phaser from 'phaser';
import { WORLDS } from '@/config/worlds';
import { PlayerShip } from '@/entities/player-ship';
import { createEnemy, Enemy } from '@/entities/enemy';
import { Obstacle } from '@/entities/obstacle';
import { Pickup } from '@/entities/pickup';
import { InputSystem } from '@/systems/input-system';
import { SaveManager, IDBBackend } from '@/systems/save-system';
import { getEffectiveStats } from '@/models/player';
import { Dialog } from '@/ui/dialog';
import { CheckpointData, SaveData, LevelDef, WorldDef } from '@/models/types';

const CANVAS_W = 390;
const CANVAS_H = 844;

// Enemy types per world
const WORLD_ENEMY_TYPES: Record<string, string[]> = {
  nebula_fields: ['mine', 'drone'],
  ice_frontier: ['ice_shard', 'frost_drone'],
  inferno_core: ['fire_proj', 'exploding_asteroid'],
};

// Obstacle density -> spawn interval (ms)
function densityToInterval(density: number): number {
  // density 0.0–1.0 maps to 3000ms–1000ms
  return Math.round(3000 - density * 2000);
}

interface TravelSceneData {
  worldId: string;
  levelIndex: number;
  checkpoint?: CheckpointData;
}

export class TravelScene extends Phaser.Scene {
  // Scene data
  private worldId!: string;
  private levelIndex!: number;
  private world!: WorldDef;
  private level!: LevelDef;
  private checkpoint?: CheckpointData;

  // Game objects
  private playerShip!: PlayerShip;
  private enemies: Enemy[] = [];
  private obstacles: Obstacle[] = [];
  private pickups: Pickup[] = [];

  // Star background
  private stars: Phaser.GameObjects.Graphics[] = [];
  private starData: Array<{ gfx: Phaser.GameObjects.Graphics; speed: number }> = [];

  // Systems
  private inputSystem!: InputSystem;
  private saveManager!: SaveManager;
  private saveData!: SaveData;

  // Distance / progress tracking
  private distance: number = 0;
  private checkpointsPassed: Set<number> = new Set();
  private levelComplete: boolean = false;
  private playerDead: boolean = false;

  // Timers
  private enemySpawnTimer!: Phaser.Time.TimerEvent;
  private obstacleSpawnTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'Travel' });
  }

  init(data: TravelSceneData) {
    this.worldId = data.worldId;
    this.levelIndex = data.levelIndex;
    this.checkpoint = data.checkpoint;

    // Reset state on every init (handles retries)
    this.enemies = [];
    this.obstacles = [];
    this.pickups = [];
    this.starData = [];
    this.checkpointsPassed = new Set();
    this.levelComplete = false;
    this.playerDead = false;
    this.distance = this.checkpoint?.distanceTraveled ?? 0;
  }

  async create() {
    // --- Look up world / level ---
    const world = WORLDS.find((w) => w.id === this.worldId);
    if (!world) {
      console.error(`TravelScene: unknown worldId "${this.worldId}"`);
      this.scene.start('Space');
      return;
    }
    this.world = world;
    this.level = world.levels[this.levelIndex];
    if (!this.level) {
      console.error(`TravelScene: levelIndex ${this.levelIndex} out of range`);
      this.scene.start('Space');
      return;
    }

    // --- Save data ---
    this.saveManager = new SaveManager(new IDBBackend());
    const loaded = this.registry.get('saveData') as SaveData | undefined;
    if (loaded) {
      this.saveData = loaded;
    } else {
      const fromDb = await this.saveManager.load();
      if (fromDb) {
        this.saveData = fromDb;
        this.registry.set('saveData', fromDb);
      } else {
        // Fallback: create minimal save so the scene still runs
        const { createDefaultPlayer } = await import('@/models/player');
        this.saveData = createDefaultPlayer();
      }
    }

    // --- Input system ---
    const existingInput = this.registry.get('inputSystem') as InputSystem | undefined;
    this.inputSystem = existingInput ?? new InputSystem();

    // --- Background stars ---
    this.createStarBackground();

    // --- Player ship ---
    const stats = getEffectiveStats(this.saveData);
    // If resuming from checkpoint, restore saved HP ratio
    if (this.checkpoint) {
      stats.hp = this.checkpoint.hpRemaining;
    }
    this.playerShip = new PlayerShip(
      this,
      CANVAS_W / 2,
      700,
      stats,
      this.saveData.equippedWeapon
    );
    this.playerShip.startAutoFire();

    // --- HUD ---
    this.scene.launch('HUD');
    this.scene.bringToTop('HUD');

    // --- Mark checkpoints already passed if resuming ---
    const thresholds = [0.25, 0.5, 0.75];
    thresholds.forEach((t) => {
      if (this.distance >= t * this.level.travelDistance) {
        this.checkpointsPassed.add(t);
      }
    });

    // --- Spawn timers ---
    const spawnInterval = densityToInterval(this.level.obstacleDensity);

    this.enemySpawnTimer = this.time.addEvent({
      delay: spawnInterval,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });

    this.obstacleSpawnTimer = this.time.addEvent({
      delay: spawnInterval * 1.5,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true,
    });

    // --- Listen for player death ---
    this.events.on('player-death', this.onPlayerDeath, this);

    // --- Listen for pickup collection ---
    this.events.on('pickup-collected', this.onPickupCollected, this);

    // --- Listen for enemy kills (drop coins) ---
    this.events.on('enemy-killed', this.onEnemyKilled, this);
  }

  update(_time: number, delta: number) {
    if (this.levelComplete || this.playerDead) return;

    // --- Scroll stars ---
    this.updateStars(delta);

    // --- Player movement via tilt ---
    const tilt = this.inputSystem.getTilt();
    this.playerShip.moveByTilt(tilt);
    this.playerShip.update(delta);

    // --- Advance distance ---
    const distancePerMs = 0.1; // 100 units/second
    this.distance += delta * distancePerMs;

    // --- Update HUD ---
    this.updateHUD();

    // --- Check checkpoint thresholds ---
    this.checkCheckpoints();

    // --- Update enemies ---
    const playerX = this.playerShip.getGraphics().x;
    const playerY = this.playerShip.getGraphics().y;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.active) {
        this.enemies.splice(i, 1);
        continue;
      }
      enemy.update(delta, playerX, playerY, false);
    }

    // --- Update obstacles ---
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (!obs.active) {
        this.obstacles.splice(i, 1);
        continue;
      }
      obs.update();
    }

    // --- Update pickups ---
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      if (!pickup.active) {
        this.pickups.splice(i, 1);
        continue;
      }
      pickup.update(delta, playerX, playerY);
    }

    // --- Collisions ---
    this.handleCollisions();

    // --- Check level complete ---
    if (this.distance >= this.level.travelDistance) {
      this.onLevelComplete();
    }
  }

  // ---------------------------------------------------------------------------
  // Star background
  // ---------------------------------------------------------------------------

  private createStarBackground() {
    const starCount = 60;
    for (let i = 0; i < starCount; i++) {
      const gfx = this.add.graphics();
      const x = Phaser.Math.Between(0, CANVAS_W);
      const y = Phaser.Math.Between(0, CANVAS_H);
      const radius = Phaser.Math.FloatBetween(0.5, 2.0);
      const alpha = Phaser.Math.FloatBetween(0.4, 1.0);
      const speed = Phaser.Math.FloatBetween(40, 120);

      gfx.fillStyle(0xffffff, alpha);
      gfx.fillCircle(0, 0, radius);
      gfx.x = x;
      gfx.y = y;
      gfx.setDepth(-1);

      this.starData.push({ gfx, speed });
    }
  }

  private updateStars(delta: number) {
    const dt = delta / 1000;
    for (const star of this.starData) {
      star.gfx.y += star.speed * dt;
      if (star.gfx.y > CANVAS_H + 4) {
        star.gfx.y = -4;
        star.gfx.x = Phaser.Math.Between(0, CANVAS_W);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // HUD update
  // ---------------------------------------------------------------------------

  private updateHUD() {
    const hud = this.scene.get('HUD') as any;
    if (!hud || !hud.sys.isActive()) return;

    const hpPct = this.playerShip.getHP() / this.playerShip.getMaxHP();
    hud.updateHP(hpPct);

    const distPct = Math.min(this.distance / this.level.travelDistance, 1);
    hud.updateScore(`${Math.floor(distPct * 100)}%`);
  }

  // ---------------------------------------------------------------------------
  // Checkpoint handling
  // ---------------------------------------------------------------------------

  private checkCheckpoints() {
    const thresholds = [0.25, 0.5, 0.75];
    for (const t of thresholds) {
      if (!this.checkpointsPassed.has(t) && this.distance >= t * this.level.travelDistance) {
        this.checkpointsPassed.add(t);
        this.saveCheckpoint();
      }
    }
  }

  private async saveCheckpoint() {
    const checkpointData: CheckpointData = {
      worldId: this.worldId,
      levelIndex: this.levelIndex,
      distanceTraveled: this.distance,
      hpRemaining: this.playerShip.getHP(),
    };

    this.saveData.checkpoint = checkpointData;
    this.registry.set('saveData', this.saveData);

    try {
      await this.saveManager.save(this.saveData);
    } catch (e) {
      console.warn('TravelScene: checkpoint save failed', e);
    }
  }

  // ---------------------------------------------------------------------------
  // Enemy / obstacle spawning
  // ---------------------------------------------------------------------------

  private spawnEnemy() {
    if (this.levelComplete || this.playerDead) return;

    const enemyTypes = WORLD_ENEMY_TYPES[this.worldId] ?? ['mine', 'drone'];
    const type = enemyTypes[Phaser.Math.Between(0, enemyTypes.length - 1)];
    const x = Phaser.Math.Between(20, CANVAS_W - 20);
    const y = -30;

    const enemy = createEnemy(this, type, x, y);
    this.enemies.push(enemy);
  }

  private spawnObstacle() {
    if (this.levelComplete || this.playerDead) return;

    const x = Phaser.Math.Between(20, CANVAS_W - 20);
    const y = -40;
    const size = Phaser.Math.FloatBetween(0.5, 2.0);

    const obs = new Obstacle(this, x, y, size);
    this.obstacles.push(obs);
  }

  private spawnCoinPickup(x: number, y: number) {
    const pickup = new Pickup(this, x, y, 'coin');
    this.pickups.push(pickup);
  }

  // ---------------------------------------------------------------------------
  // Collisions
  // ---------------------------------------------------------------------------

  private handleCollisions() {
    const playerGfx = this.playerShip.getGraphics();
    const playerBody = this.playerShip.getBody();
    const playerBounds = new Phaser.Geom.Rectangle(
      playerBody.x,
      playerBody.y,
      playerBody.width,
      playerBody.height
    );

    // Player vs enemies
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
      const enemyBounds = new Phaser.Geom.Rectangle(
        enemyBody.x,
        enemyBody.y,
        enemyBody.width,
        enemyBody.height
      );
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, enemyBounds)) {
        this.playerShip.takeDamage(enemy.getDamage());
        enemy.takeDamage(enemy.hp); // destroy on contact
      }
    }

    // Player vs obstacles
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      const obsBody = obs.getBody();
      const obsBounds = new Phaser.Geom.Rectangle(
        obsBody.x,
        obsBody.y,
        obsBody.width,
        obsBody.height
      );
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, obsBounds)) {
        this.playerShip.takeDamage(obs.damage);
        obs.destroySelf();
      }
    }

    // Player projectiles vs enemies
    const projectiles = this.playerShip.getProjectiles();
    for (const proj of projectiles) {
      if (!proj.active) continue;
      const projBody = proj.getBody();
      const projBounds = new Phaser.Geom.Rectangle(
        projBody.x,
        projBody.y,
        projBody.width,
        projBody.height
      );

      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
        const enemyBounds = new Phaser.Geom.Rectangle(
          enemyBody.x,
          enemyBody.y,
          enemyBody.width,
          enemyBody.height
        );
        if (Phaser.Geom.Rectangle.Overlaps(projBounds, enemyBounds)) {
          enemy.takeDamage(proj.getDamage());
          proj.destroySelf();
          break;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private onEnemyKilled(data: { x: number; y: number }) {
    // Random 40% chance to drop a coin
    if (Math.random() < 0.4) {
      this.spawnCoinPickup(data.x, data.y);
    }
  }

  private onPickupCollected(data: { type: string; value: number }) {
    if (data.type === 'coin') {
      this.saveData.coins = (this.saveData.coins ?? 0) + data.value;
      this.registry.set('saveData', this.saveData);
    }
  }

  // ---------------------------------------------------------------------------
  // Level complete
  // ---------------------------------------------------------------------------

  private onLevelComplete() {
    if (this.levelComplete) return;
    this.levelComplete = true;

    this.enemySpawnTimer.remove();
    this.obstacleSpawnTimer.remove();
    this.playerShip.stopAutoFire();

    // Clear checkpoint now that we've finished the travel segment
    this.saveData.checkpoint = null;
    this.saveManager.save(this.saveData).catch(() => {});

    this.scene.stop('HUD');
    this.scene.start('Boss', { worldId: this.worldId, levelIndex: this.levelIndex });
  }

  // ---------------------------------------------------------------------------
  // Player death
  // ---------------------------------------------------------------------------

  private onPlayerDeath() {
    if (this.playerDead) return;
    this.playerDead = true;

    this.enemySpawnTimer.remove();
    this.obstacleSpawnTimer.remove();
    this.playerShip.stopAutoFire();

    // Grab the last saved checkpoint from saveData (may be null)
    const lastCheckpoint = this.saveData.checkpoint ?? undefined;

    new Dialog(this, 'Ship Destroyed', [
      {
        label: 'Retry from Checkpoint',
        callback: () => {
          this.scene.stop('HUD');
          this.scene.start('Travel', {
            worldId: this.worldId,
            levelIndex: this.levelIndex,
            checkpoint: lastCheckpoint,
          } as TravelSceneData);
        },
      },
      {
        label: 'Return to Space',
        callback: () => {
          this.scene.stop('HUD');
          this.scene.start('Space');
        },
      },
    ]);
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  shutdown() {
    this.events.off('player-death', this.onPlayerDeath, this);
    this.events.off('pickup-collected', this.onPickupCollected, this);
    this.events.off('enemy-killed', this.onEnemyKilled, this);

    if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
    if (this.obstacleSpawnTimer) this.obstacleSpawnTimer.remove();
  }
}
