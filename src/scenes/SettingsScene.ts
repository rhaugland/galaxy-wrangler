import { Button } from '@/ui/button';
import { InputSystem } from '@/systems/input-system';

interface Settings {
  tiltSensitivity: number;
  musicVolume: number;
  sfxVolume: number;
  invertTilt: boolean;
}

const STORAGE_KEY = 'galaxy-wrangler-settings';
const DEFAULT_SETTINGS: Settings = {
  tiltSensitivity: 1.0,
  musicVolume: 80,
  sfxVolume: 80,
  invertTilt: false,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: Settings): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export class SettingsScene extends Phaser.Scene {
  private settings!: Settings;
  private inputSystem!: InputSystem;

  constructor() { super('Settings'); }

  create() {
    const W = 390;
    const cx = W / 2;

    this.settings = loadSettings();

    // Get or create InputSystem from registry
    let inputSys = this.registry.get('inputSystem') as InputSystem | undefined;
    if (!inputSys) {
      inputSys = new InputSystem();
      this.registry.set('inputSystem', inputSys);
    }
    this.inputSystem = inputSys;

    // Apply loaded settings
    this.inputSystem.setSensitivity(this.settings.tiltSensitivity);
    this.inputSystem.setInverted(this.settings.invertTilt);

    // Title
    this.add.text(cx, 48, 'Settings', {
      fontSize: '30px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      stroke: '#4444cc',
      strokeThickness: 3,
    }).setOrigin(0.5);

    let rowY = 130;

    // Tilt Sensitivity slider (0.5 - 2.0)
    rowY = this.addSlider(
      cx, rowY,
      'Tilt Sensitivity',
      this.settings.tiltSensitivity,
      0.5, 2.0,
      (val) => {
        this.settings.tiltSensitivity = val;
        this.inputSystem.setSensitivity(val);
        saveSettings(this.settings);
      }
    );

    rowY += 20;

    // Music Volume slider (0-100)
    rowY = this.addSlider(
      cx, rowY,
      'Music Volume',
      this.settings.musicVolume,
      0, 100,
      (val) => {
        this.settings.musicVolume = val;
        saveSettings(this.settings);
      }
    );

    rowY += 20;

    // SFX Volume slider (0-100)
    rowY = this.addSlider(
      cx, rowY,
      'SFX Volume',
      this.settings.sfxVolume,
      0, 100,
      (val) => {
        this.settings.sfxVolume = val;
        saveSettings(this.settings);
      }
    );

    rowY += 40;

    // Invert Tilt toggle
    this.addToggle(cx, rowY, 'Invert Tilt', this.settings.invertTilt, (val) => {
      this.settings.invertTilt = val;
      this.inputSystem.setInverted(val);
      saveSettings(this.settings);
    });

    rowY += 70;

    // Recalibrate button
    new Button(this, cx, rowY, 'Recalibrate Tilt', async () => {
      await this.inputSystem.calibrate();
    }, 200, 48);

    rowY += 70;

    // Back button
    new Button(this, cx, rowY, 'Back', () => this.scene.start('MainMenu'), 140, 44);
  }

  private addSlider(
    cx: number,
    y: number,
    label: string,
    initialValue: number,
    min: number,
    max: number,
    onChange: (val: number) => void
  ): number {
    const W = 280;
    const trackX = cx - W / 2;
    const trackY = y + 36;
    const trackH = 8;

    this.add.text(cx, y, label, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ccccff',
    }).setOrigin(0.5);

    // Track background
    const trackBg = this.add.graphics();
    trackBg.fillStyle(0x333355, 1);
    trackBg.fillRoundedRect(trackX, trackY - trackH / 2, W, trackH, 4);

    // Fill
    const fillGfx = this.add.graphics();
    const valueText = this.add.text(cx + W / 2 + 12, trackY, '', {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#aaffaa',
    }).setOrigin(0, 0.5);

    const drawFill = (val: number) => {
      const t = (val - min) / (max - min);
      fillGfx.clear();
      fillGfx.fillStyle(0x4488ff, 1);
      fillGfx.fillRoundedRect(trackX, trackY - trackH / 2, W * t, trackH, 4);
      // Indicator knob
      fillGfx.fillStyle(0xffffff, 1);
      fillGfx.fillCircle(trackX + W * t, trackY, 10);
      valueText.setText(Number(val.toFixed(1)).toString());
    };

    drawFill(initialValue);

    // Interactive hit zone for tapping to set value
    const hitZone = this.add.zone(cx, trackY, W + 20, 36).setInteractive();
    hitZone.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      const t = Phaser.Math.Clamp((ptr.x - trackX) / W, 0, 1);
      const val = min + t * (max - min);
      const rounded = Math.round(val * 10) / 10;
      drawFill(rounded);
      onChange(rounded);
    });
    hitZone.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!ptr.isDown) return;
      const t = Phaser.Math.Clamp((ptr.x - trackX) / W, 0, 1);
      const val = min + t * (max - min);
      const rounded = Math.round(val * 10) / 10;
      drawFill(rounded);
      onChange(rounded);
    });

    return trackY + 28;
  }

  private addToggle(
    cx: number,
    y: number,
    label: string,
    initialValue: boolean,
    onChange: (val: boolean) => void
  ) {
    this.add.text(cx - 60, y, label, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ccccff',
    }).setOrigin(1, 0.5);

    let current = initialValue;

    const toggleGfx = this.add.graphics();
    const drawToggle = (on: boolean) => {
      toggleGfx.clear();
      toggleGfx.fillStyle(on ? 0x4488ff : 0x333355, 1);
      toggleGfx.fillRoundedRect(cx - 40, y - 16, 80, 32, 16);
      toggleGfx.fillStyle(0xffffff, 1);
      toggleGfx.fillCircle(on ? cx + 20 : cx - 20, y, 13);
    };

    drawToggle(current);

    const zone = this.add.zone(cx, y, 80, 32).setInteractive();
    zone.on('pointerup', () => {
      current = !current;
      drawToggle(current);
      onChange(current);
    });
  }
}
