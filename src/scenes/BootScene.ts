import { InputSystem } from '@/systems/input-system';
import { Button } from '@/ui/button';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() { /* asset loading later */ }

  create() {
    const alreadyCalibrated = localStorage.getItem('calibrated') === 'true';

    if (alreadyCalibrated) {
      this.cameras.main.fadeIn(300, 0, 0, 0);
      this.scene.start('MainMenu');
      return;
    }

    // First launch: show calibration UI
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const W = 390;
    const H = 844;
    const cx = W / 2;

    this.add.rectangle(cx, H / 2, W, H, 0x0a0a1a);

    this.add.text(cx, H / 2 - 80, 'Hold your phone how you\'ll play', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 300 },
    }).setOrigin(0.5);

    const inputSystem = new InputSystem();
    this.registry.set('inputSystem', inputSystem);

    new Button(this, cx, H / 2 + 40, 'Calibrate', async () => {
      await inputSystem.requestPermission();
      await inputSystem.calibrate();
      localStorage.setItem('calibrated', 'true');
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
      });
    }, 200, 56);
  }
}
