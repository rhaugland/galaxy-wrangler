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
import { HUD } from './ui/hud';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  parent: 'game',
  backgroundColor: '#0a0a2e',
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
    HUD,
  ],
};

new Phaser.Game(config);
