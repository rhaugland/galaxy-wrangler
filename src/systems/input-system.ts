export interface TiltState { x: number; y: number; }

export class InputSystem {
  private baseGamma = 0;
  private baseBeta = 0;
  private sensitivity = 1;
  private inverted = false;
  private tilt: TiltState = { x: 0, y: 0 };
  private calibrated = false;

  constructor() {
    window.addEventListener('deviceorientation', (e) => this.onOrientation(e));
  }

  private onOrientation(e: DeviceOrientationEvent) {
    if (!this.calibrated) return;
    const rawX = ((e.gamma ?? 0) - this.baseGamma) * this.sensitivity * (this.inverted ? -1 : 1);
    const rawY = ((e.beta ?? 0) - this.baseBeta) * this.sensitivity * (this.inverted ? -1 : 1);
    this.tilt = { x: clamp(rawX / 30, -1, 1), y: clamp(rawY / 30, -1, 1) };
  }

  calibrate() {
    return new Promise<void>((resolve) => {
      const handler = (e: DeviceOrientationEvent) => {
        this.baseGamma = e.gamma ?? 0;
        this.baseBeta = e.beta ?? 0;
        this.calibrated = true;
        window.removeEventListener('deviceorientation', handler);
        resolve();
      };
      window.addEventListener('deviceorientation', handler);
    });
  }

  getTilt(): TiltState { return this.tilt; }
  setSensitivity(val: number) { this.sensitivity = val; }
  setInverted(val: boolean) { this.inverted = val; }

  async requestPermission(): Promise<boolean> {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      const perm = await (DeviceOrientationEvent as any).requestPermission();
      return perm === 'granted';
    }
    return true;
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
