export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() { /* asset loading later */ }
  create() { this.scene.start('MainMenu'); }
}
