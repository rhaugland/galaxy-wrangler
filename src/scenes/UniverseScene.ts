import { Button } from '@/ui/button';
import { UNIVERSES } from '@/config/worlds';

const W = 390;
const H = 844;

export class UniverseScene extends Phaser.Scene {
  constructor() { super('Universe'); }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const cx = W / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x050510, 1);
    bg.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 80; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(0, H);
      const sa = Phaser.Math.FloatBetween(0.2, 0.8);
      bg.fillStyle(0xffffff, sa);
      bg.fillCircle(sx, sy, Phaser.Math.FloatBetween(0.5, 1.5));
    }

    // Title
    this.add.text(cx, 50, 'UNIVERSES', {
      fontSize: '28px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
      color: '#ff69b4', stroke: '#330022', strokeThickness: 2,
    }).setOrigin(0.5);

    const universe = UNIVERSES[0]; // Prime Universe

    // Universe card
    this.add.text(cx, 110, universe.name.toUpperCase(), {
      fontSize: '18px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
      color: '#00ffff',
    }).setOrigin(0.5);

    // Galaxy cards
    universe.galaxies.forEach((galaxy, gi) => {
      const cardY = 200 + gi * 300;

      const card = this.add.graphics();
      card.fillStyle(0x0a0a2a, 0.9);
      card.fillRoundedRect(20, cardY - 60, W - 40, 220, 12);
      card.lineStyle(1.5, 0xff69b4, 0.4);
      card.strokeRoundedRect(20, cardY - 60, W - 40, 220, 12);

      // Galaxy name
      this.add.text(cx, cardY - 35, galaxy.name.toUpperCase(), {
        fontSize: '22px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
        color: '#ff69b4',
      }).setOrigin(0.5);

      // Description
      this.add.text(cx, cardY + 5, galaxy.description, {
        fontSize: '11px', fontFamily: '"Courier New", monospace',
        color: '#888899', wordWrap: { width: W - 80 }, align: 'center',
      }).setOrigin(0.5, 0);

      // Planet count
      this.add.text(cx, cardY + 75, `${galaxy.planets.length} PLANETS`, {
        fontSize: '12px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
        color: '#00ffff',
      }).setOrigin(0.5);

      // Explore button
      new Button(this, cx, cardY + 120, 'EXPLORE', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GalaxyView', { galaxyId: galaxy.id });
        });
      }, 180, 48);

      // Element icons row
      const planetColors: Record<string, number> = {
        nebula: 0xcc44ff, ice: 0x44eeff, inferno: 0xff6622, land: 0x88aa44, electric: 0x44aaff,
      };
      const dotStartX = cx - (galaxy.planets.length - 1) * 18;
      galaxy.planets.forEach((planet, pi) => {
        const dx = dotStartX + pi * 36;
        const g = this.add.graphics();
        g.fillStyle(planetColors[planet.theme] ?? 0x666666, 0.8);
        g.fillCircle(dx, cardY + 90, 6);
        g.fillStyle(planetColors[planet.theme] ?? 0x666666, 0.2);
        g.fillCircle(dx, cardY + 90, 10);
      });
    });

    // Back button
    new Button(this, cx, H - 40, 'BACK', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenu'));
    }, 140, 44);
  }
}
