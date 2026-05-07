import { HpBar } from './hp-bar';
import { Button } from './button';
import { CooldownRing } from './cooldown-ring';
import { FONT } from '@/ui/theme';

const GAME_WIDTH = 390;
const GAME_HEIGHT = 844;
const EDGE = 50;

export class HUD extends Phaser.Scene {
  private playerHpBar!: HpBar;
  private bossHpBar!: HpBar;
  private scoreText!: Phaser.GameObjects.Text;
  private abilityButton!: Button;
  private pauseButton!: Button;
  private cooldownRing!: CooldownRing;
  private bossBarGroup!: Phaser.GameObjects.Group;

  private abilityCallback: (() => void) | null = null;
  private pauseCallback: (() => void) | null = null;

  constructor() {
    super({ key: 'HUD', active: false });
  }

  create(): void {
    // --- Player HP bar (top-left) ---
    const hpPadX = 16;
    const hpPadY = 14;
    this.playerHpBar = new HpBar(this, hpPadX, hpPadY, 120, 16, 0x22dd44);

    const hpLabel = this.add.text(hpPadX, hpPadY - 12, 'HP', {
      fontSize: '10px',
      color: '#aaffaa',
      fontFamily: FONT,
    });
    hpLabel.setDepth(10);

    // --- Score / distance text (top-right) ---
    this.scoreText = this.add.text(GAME_WIDTH - 16, hpPadY + 8, '0', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: FONT,
      align: 'right',
    }).setOrigin(1, 0.5);
    this.scoreText.setDepth(10);

    // --- Boss HP bar (top-center, hidden by default) ---
    const bossBarWidth = 300;
    const bossBarX = (GAME_WIDTH - bossBarWidth) / 2;
    this.bossHpBar = new HpBar(this, bossBarX, hpPadY, bossBarWidth, 20, 0xdd2222);
    this.bossHpBar.setDepth(10);

    const bossLabel = this.add.text(GAME_WIDTH / 2, hpPadY - 12, 'BOSS', {
      fontSize: '10px',
      color: '#ffaaaa',
      fontFamily: FONT,
      align: 'center',
    }).setOrigin(0.5, 0);
    bossLabel.setDepth(10);

    this.bossBarGroup = this.add.group([this.bossHpBar, bossLabel]);
    this.hideBossBar();

    // --- Ability button + cooldown ring (bottom-left) ---
    const abilityX = EDGE;
    const abilityY = GAME_HEIGHT - EDGE;

    this.abilityButton = new Button(
      this,
      abilityX,
      abilityY,
      'ABL',
      () => {
        if (this.abilityCallback) this.abilityCallback();
      },
      52,
      52
    );
    this.abilityButton.setDepth(10);

    // Cooldown ring sits slightly larger around the button
    this.cooldownRing = new CooldownRing(this, abilityX, abilityY, 34);
    this.cooldownRing.setDepth(11);

    // --- Pause button (bottom-right) ---
    const pauseX = GAME_WIDTH - EDGE;
    const pauseY = GAME_HEIGHT - EDGE;

    this.pauseButton = new Button(
      this,
      pauseX,
      pauseY,
      '||',
      () => {
        if (this.pauseCallback) this.pauseCallback();
      },
      52,
      52
    );
    this.pauseButton.setDepth(10);

    // Set all HUD elements to high depth so they render over gameplay
    this.playerHpBar.setDepth(10);
    hpLabel.setDepth(10);
    this.scoreText.setDepth(10);
    this.abilityButton.setDepth(10);
    this.pauseButton.setDepth(10);
  }

  // --- Public API ---

  updateHP(pct: number): void {
    this.playerHpBar.setPercent(pct);
  }

  updateScore(val: number | string): void {
    this.scoreText.setText(String(val));
  }

  updateBossHP(pct: number): void {
    this.bossHpBar.setPercent(pct);
  }

  showBossBar(): void {
    this.bossBarGroup.setVisible(true);
  }

  hideBossBar(): void {
    this.bossBarGroup.setVisible(false);
  }

  /**
   * Update the cooldown ring display.
   * Call each frame from the gameplay scene.
   */
  updateCooldown(remaining: number, total: number): void {
    this.cooldownRing.setCooldown(remaining, total);
  }

  onAbilityTap(callback: () => void): void {
    this.abilityCallback = callback;
  }

  onPauseTap(callback: () => void): void {
    this.pauseCallback = callback;
  }
}
