export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }
  create() {
    this.add.text(195, 400, 'Galaxy Wrangler', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
  }
}
