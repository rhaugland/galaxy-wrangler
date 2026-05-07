import Phaser from 'phaser';
import { WORLDS } from '@/config/worlds';
import { PlayerShip } from '@/entities/player-ship';
import { Boss } from '@/entities/boss';
import { InputSystem } from '@/systems/input-system';
import { SaveManager, IDBBackend } from '@/systems/save-system';
import { getEffectiveStats } from '@/models/player';
import { Dialog } from '@/ui/dialog';
import { Projectile } from '@/entities/projectile';
import { awardCoins } from '@/systems/economy';
import { FONT } from '@/ui/theme';

const CANVAS_W = 390;
const CANVAS_H = 844;

// Horizontal boss mode: player left side, boss right side
const PLAYER_START_X = 80;
const PLAYER_START_Y = 422;
const BOSS_START_X = 310;
const BOSS_START_Y = 422;

// Ram/retreat contact cooldown to prevent spam damage
const RAM_DAMAGE_COOLDOWN_MS = 600;

export class BossScene extends Phaser.Scene {
  private worldId!: string;
  private levelIndex!: number;

  private player!: PlayerShip;
  private boss!: Boss;
  private tiltInput!: InputSystem;

  // Background stars
  private bgGraphics!: Phaser.GameObjects.Graphics;

  // HUD (inline — no separate HUD scene to keep portal simple)
  private playerHpText!: Phaser.GameObjects.Text;
  private bossHpText!: Phaser.GameObjects.Text;
  private bossHpBg!: Phaser.GameObjects.Graphics;
  private bossHpFill!: Phaser.GameObjects.Graphics;
  private playerHpBg!: Phaser.GameObjects.Graphics;
  private playerHpFill!: Phaser.GameObjects.Graphics;
  private bossNameText!: Phaser.GameObjects.Text;

  // Tap-to-fire (tap_shoot style)
  private tapFireEnabled = false;
  private lastTapFireTime = 0;
  private tapFireCooldown = 300; // ms

  // Ram cooldown
  private lastRamHitTime = 0;

  // Outcome flags
  private battleOver = false;
  private dialogShown = false;

  constructor() {
    super({ key: 'Boss' });
  }

  init(data: { worldId: string; levelIndex: number }) {
    this.worldId = data.worldId ?? 'nebula_fields';
    this.levelIndex = data.levelIndex ?? 0;
    this.battleOver = false;
    this.dialogShown = false;
    this.lastRamHitTime = 0;
    this.lastTapFireTime = 0;
    this.tapFireEnabled = false;
  }

  async create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // --- Look up world + level config ---
    const world = WORLDS.find((w) => w.id === this.worldId);
    if (!world) {
      console.error(`BossScene: unknown worldId "${this.worldId}"`);
      this.scene.start('Space');
      return;
    }
    const levelDef = world.levels[this.levelIndex];
    if (!levelDef) {
      console.error(`BossScene: levelIndex ${this.levelIndex} out of range`);
      this.scene.start('Space');
      return;
    }
    const bossDef = levelDef.boss;

    // --- Background ---
    this.drawBackground(world.theme);

    // --- Load save for player stats ---
    let saveData = null;
    try {
      const manager = new SaveManager(new IDBBackend());
      saveData = await manager.load();
    } catch (_) {
      // non-fatal
    }

    const stats = saveData
      ? getEffectiveStats(saveData)
      : { hp: 100, damage: 10, speed: 5, shield: 0 };

    const equippedWeapon = saveData?.equippedWeapon ?? null;

    // --- Player ship ---
    this.player = new PlayerShip(this, PLAYER_START_X, PLAYER_START_Y, stats, equippedWeapon);
    this.player.setHorizontalMode(true);

    // --- Boss ---
    this.boss = new Boss(this, BOSS_START_X, BOSS_START_Y, bossDef);

    // --- Input ---
    this.tiltInput = new InputSystem();

    // --- Combat setup per style ---
    if (bossDef.style === 'auto_dodge') {
      this.player.startAutoFire();
    } else if (bossDef.style === 'tap_shoot') {
      this.tapFireEnabled = true;
    }
    // ram_retreat: no auto-fire, no tap fire — player rams boss

    // --- HUD ---
    this.buildHUD(bossDef.name);

    // --- Touch/pointer tap fire for tap_shoot ---
    if (bossDef.style === 'tap_shoot') {
      this.input.on('pointerdown', () => this.handlePlayerTapFire());
    }

    // --- Events ---
    this.events.on('player-death', this.handleDefeat, this);
  }

  update(time: number, delta: number) {
    if (this.battleOver) return;

    // --- Tilt movement ---
    const tilt = this.tiltInput.getTilt();
    this.player.moveByTilt(tilt);
    this.player.update(delta);

    // --- Boss update ---
    const playerY = this.player.getGraphics().y;
    this.boss.update(time, delta, playerY);

    // --- Collisions: player projectiles vs boss ---
    this.checkPlayerProjectilesVsBoss();

    // --- Collisions: boss projectiles vs player ---
    this.checkBossProjectilesVsPlayer(time);

    // --- ram_retreat: player body overlaps boss ---
    if ((this.boss as any).style === 'ram_retreat') {
      this.checkRamOverlap(time);
    }

    // --- HUD update ---
    this.updateHUD();

    // --- Check victory ---
    if (this.boss.isDefeated() && !this.battleOver) {
      this.handleVictory();
    }
  }

  // ---- Collision helpers ----

  private checkPlayerProjectilesVsBoss() {
    const bossGfx = this.boss.getGraphics();
    const bossX = this.boss.x;
    const bossY = this.boss.y;
    const hitRadius = 44;

    for (const proj of this.player.getProjectiles()) {
      if (!proj.active) continue;
      const gfx = proj.getGraphics();
      const dx = gfx.x - bossX;
      const dy = gfx.y - bossY;
      if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
        this.boss.takeDamage(proj.getDamage());
        proj.destroySelf();

        // Hit flash on boss
        this.scene.scene.get(this.scene.key)?.cameras?.main?.flash(40, 255, 200, 200);
      }
    }
  }

  private checkBossProjectilesVsPlayer(time: number) {
    const playerGfx = this.player.getGraphics();
    const px = playerGfx.x;
    const py = playerGfx.y;
    const hitRadius = 16;

    const allBossProjs = [
      ...this.boss.getProjectiles(),
      ...this.boss.getTrailProjectiles(),
    ];

    for (const proj of allBossProjs) {
      if (!proj.active) continue;
      const gfx = proj.getGraphics();
      const dx = gfx.x - px;
      const dy = gfx.y - py;
      if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
        this.player.takeDamage(proj.getDamage());
        proj.destroySelf();
      }
    }
  }

  private checkRamOverlap(time: number) {
    if (time - this.lastRamHitTime < RAM_DAMAGE_COOLDOWN_MS) return;

    const playerGfx = this.player.getGraphics();
    const px = playerGfx.x;
    const py = playerGfx.y;
    const bossX = this.boss.x;
    const bossY = this.boss.y;
    const dx = px - bossX;
    const dy = py - bossY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 52) {
      // Player deals full damage to boss, boss deals half damage to player
      const playerDamage = (this.player as any).damage as number ?? 10;
      this.boss.takeDamage(playerDamage);
      this.player.takeDamage(8); // boss ram contact damage
      this.lastRamHitTime = time;

      // Knockback visual — nudge player away
      const nx = dx / dist;
      const ny = dy / dist;
      this.player.getBody().setVelocity(nx * 250, ny * 250);
    }
  }

  private handlePlayerTapFire() {
    if (this.battleOver || !this.tapFireEnabled) return;
    const now = this.time.now;
    if (now - this.lastTapFireTime < this.tapFireCooldown) return;
    this.lastTapFireTime = now;
    this.player.fireWeapon();
  }

  // ---- Background ----

  private drawBackground(theme: string) {
    this.bgGraphics = this.add.graphics();

    // Base space color by theme
    const bgColor = theme === 'nebula' ? 0x0d0020
      : theme === 'ice' ? 0x001830
      : 0x1a0500;

    this.bgGraphics.fillStyle(bgColor, 1);
    this.bgGraphics.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    this.bgGraphics.fillStyle(0xffffff, 0.7);
    for (let i = 0; i < 80; i++) {
      const sx = Math.random() * CANVAS_W;
      const sy = Math.random() * CANVAS_H;
      const r = Math.random() * 1.5 + 0.3;
      this.bgGraphics.fillCircle(sx, sy, r);
    }

    // Subtle theme nebula cloud
    if (theme === 'nebula') {
      this.bgGraphics.fillStyle(0x660088, 0.12);
      this.bgGraphics.fillEllipse(CANVAS_W * 0.6, CANVAS_H * 0.4, 280, 220);
    } else if (theme === 'ice') {
      this.bgGraphics.fillStyle(0x003366, 0.15);
      this.bgGraphics.fillEllipse(CANVAS_W * 0.6, CANVAS_H * 0.5, 260, 200);
    } else if (theme === 'inferno') {
      this.bgGraphics.fillStyle(0x880022, 0.15);
      this.bgGraphics.fillEllipse(CANVAS_W * 0.65, CANVAS_H * 0.45, 300, 240);
    }

    // Horizontal divider hint (player side vs boss side)
    this.bgGraphics.lineStyle(1, 0x334455, 0.4);
    this.bgGraphics.beginPath();
    this.bgGraphics.moveTo(CANVAS_W / 2, 60);
    this.bgGraphics.lineTo(CANVAS_W / 2, CANVAS_H - 60);
    this.bgGraphics.strokePath();
  }

  // ---- HUD ----

  private buildHUD(bossName: string) {
    const hudDepth = 20;
    const barY = 22;

    // Player HP bar (left)
    this.playerHpBg = this.add.graphics().setDepth(hudDepth);
    this.playerHpFill = this.add.graphics().setDepth(hudDepth);
    this.drawHpBar(this.playerHpBg, this.playerHpFill, 12, barY, 110, 14, 0x22dd44, 1);

    this.playerHpText = this.add.text(12, barY - 13, 'HP', {
      fontSize: '10px',
      color: '#aaffaa',
      fontFamily: FONT,
    }).setDepth(hudDepth);

    // Boss name (top center)
    this.bossNameText = this.add.text(CANVAS_W / 2, barY - 13, bossName, {
      fontSize: '11px',
      color: '#ffaaaa',
      fontFamily: FONT,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(hudDepth);

    // Boss HP bar (center-wide)
    const bossBarW = 220;
    const bossBarX = (CANVAS_W - bossBarW) / 2;
    this.bossHpBg = this.add.graphics().setDepth(hudDepth);
    this.bossHpFill = this.add.graphics().setDepth(hudDepth);
    this.drawHpBar(this.bossHpBg, this.bossHpFill, bossBarX, barY, bossBarW, 14, 0xdd2222, 1);

    // Style hint label (bottom)
    const styleLabels: Record<string, string> = {
      auto_dodge: 'DODGE the shots',
      tap_shoot: 'TAP to fire',
      ram_retreat: 'RAM the boss',
    };
    const bossStyle: string = (this.boss as any).style;
    this.add.text(CANVAS_W / 2, CANVAS_H - 22, styleLabels[bossStyle] ?? '', {
      fontSize: '12px',
      color: '#88aacc',
      fontFamily: FONT,
      align: 'center',
    }).setOrigin(0.5, 1).setDepth(hudDepth);
  }

  private drawHpBar(
    bg: Phaser.GameObjects.Graphics,
    fill: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    pct: number
  ) {
    bg.clear();
    fill.clear();
    bg.fillStyle(0x222222, 0.85);
    bg.fillRoundedRect(x, y, w, h, 4);
    const fw = Math.max(0, Math.floor(w * pct));
    if (fw > 0) {
      fill.fillStyle(color, 1);
      fill.fillRoundedRect(x, y, fw, h, 4);
    }
  }

  private updateHUD() {
    const playerPct = this.player.getHP() / this.player.getMaxHP();
    const bossPct = this.boss.getHP() / this.boss.getMaxHP();
    const bossBarW = 220;
    const bossBarX = (CANVAS_W - bossBarW) / 2;
    const barY = 22;

    this.drawHpBar(this.playerHpBg, this.playerHpFill, 12, barY, 110, 14, 0x22dd44, playerPct);

    const bossColor = bossPct > 0.66 ? 0xdd2222 : bossPct > 0.33 ? 0xff8800 : 0xff3388;
    this.drawHpBar(this.bossHpBg, this.bossHpFill, bossBarX, barY, bossBarW, 14, bossColor, bossPct);
  }

  // ---- Victory / Defeat flows ----

  private async handleVictory() {
    if (this.battleOver || this.dialogShown) return;
    this.battleOver = true;
    this.dialogShown = true;

    this.boss.stopAll();
    this.player.stopAutoFire();

    // Victory animation: boss flash + fade out
    this.tweens.add({
      targets: this.boss,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
    });
    this.cameras.main.flash(300, 255, 255, 200);

    // Award creature, coins, mark level complete
    let creatureName = 'Creature';
    try {
      const world = WORLDS.find((w) => w.id === this.worldId);
      const levelDef = world?.levels[this.levelIndex];
      const creature = levelDef?.creatureReward;
      if (creature) creatureName = creature.name;

      const manager = new SaveManager(new IDBBackend());
      const save = await manager.load();

      if (save && levelDef) {
        // Award coins
        const worldProgress = save.worldProgress ?? {};
        const cleared = worldProgress[this.worldId] ?? [];
        const isFirstClear = !cleared[this.levelIndex];
        const coins = isFirstClear ? levelDef.boss.coinBonus : levelDef.boss.replayCoinBonus;
        let updated = awardCoins(save, coins);

        // Unlock creature
        if (creature && !updated.unlockedCreatures.includes(creature.id)) {
          updated = { ...updated, unlockedCreatures: [...updated.unlockedCreatures, creature.id] };
        }

        // Mark level cleared
        const newCleared = [...cleared];
        newCleared[this.levelIndex] = true;
        updated = {
          ...updated,
          worldProgress: { ...worldProgress, [this.worldId]: newCleared },
        };

        await manager.save(updated);
      }
    } catch (_) {
      // non-fatal
    }

    // Show victory dialog after brief animation delay
    this.time.delayedCall(700, () => {
      new Dialog(
        this,
        `Victory!\nUnlocked ${creatureName}`,
        [
          {
            label: 'Continue',
            callback: () => {
              this.scene.start('WorldSelect');
            },
          },
        ]
      );
    });
  }

  private handleDefeat() {
    if (this.battleOver || this.dialogShown) return;
    this.battleOver = true;
    this.dialogShown = true;

    this.player.stopAutoFire();
    this.boss.stopAll();

    this.cameras.main.shake(300, 0.012);

    this.time.delayedCall(400, () => {
      new Dialog(
        this,
        'Defeated...',
        [
          {
            label: 'Retry',
            callback: () => {
              this.scene.start('Boss', { worldId: this.worldId, levelIndex: this.levelIndex });
            },
          },
          {
            label: 'Return to Space',
            callback: () => {
              this.scene.start('Space');
            },
          },
        ]
      );
    });
  }
}
