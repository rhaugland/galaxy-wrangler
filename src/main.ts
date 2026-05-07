import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { WorldSelectScene } from './scenes/WorldSelectScene';
import { CaptainSelectScene } from './scenes/CaptainSelectScene';
import { ShopScene } from './scenes/ShopScene';
import { SettingsScene } from './scenes/SettingsScene';
import { TravelScene } from './scenes/TravelScene';
import { BossScene } from './scenes/BossScene';
import { SpaceScene } from './scenes/SpaceScene';
import { MissionScene } from './scenes/MissionScene';
import { UniverseScene } from './scenes/UniverseScene';
import { GalaxyViewScene } from './scenes/GalaxyViewScene';
import { PlanetViewScene } from './scenes/PlanetViewScene';
import { HUD } from './ui/hud';

// Make all Phaser Text objects render at native device resolution for crisp text
const dpr = window.devicePixelRatio || 1;
const origText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (
  ...args: Parameters<typeof origText>
) {
  const t = origText.apply(this, args) as Phaser.GameObjects.Text;
  t.setResolution(dpr);
  return t;
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  parent: 'game',
  backgroundColor: '#000000',
  antialias: true,
  roundPixels: false,
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    MainMenuScene,
    WorldSelectScene,
    CaptainSelectScene,
    ShopScene,
    SettingsScene,
    TravelScene,
    BossScene,
    SpaceScene,
    MissionScene,
    UniverseScene,
    GalaxyViewScene,
    PlanetViewScene,
    HUD,
  ],
};

new Phaser.Game(config);
