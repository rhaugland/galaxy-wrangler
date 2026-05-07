# Galaxy Wrangler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a PWA mobile game where players tilt-steer a spaceship through 3 worlds, fight bosses, collect creature captains, and grind missions for XP/coins.

**Architecture:** Phaser 3 game engine with Vite bundler, TypeScript throughout. Game state persisted to IndexedDB with localStorage fallback. PWA shell with service worker for offline play. Portrait-only orientation.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest, IndexedDB (via idb), PWA (Workbox)

---

## File Structure

```
galaxy-wrangler/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── manifest.json
├── public/icons/
├── src/
│   ├── main.ts                      # Phaser boot
│   ├── config/
│   │   ├── worlds.ts                # World/level/boss/creature definitions
│   │   ├── items.ts                 # Weapons, defense, cosmetics, stat boosts
│   │   ├── missions.ts              # Mission templates
│   │   └── balance.ts               # XP thresholds, costs, scaling constants
│   ├── models/
│   │   ├── types.ts                 # Shared type definitions
│   │   ├── player.ts                # Player state logic
│   │   └── inventory.ts             # Inventory management
│   ├── systems/
│   │   ├── save-system.ts           # IndexedDB persistence
│   │   ├── input-system.ts          # Tilt + tap handling
│   │   ├── economy.ts               # XP/coin/level-up logic
│   │   └── mission-generator.ts     # Mission board generation
│   ├── scenes/
│   │   ├── BootScene.ts             # Asset preload
│   │   ├── MainMenuScene.ts
│   │   ├── WorldSelectScene.ts
│   │   ├── TravelScene.ts           # Vertical scroller
│   │   ├── BossScene.ts             # Horizontal boss fight
│   │   ├── SpaceScene.ts            # Mission hub
│   │   ├── MissionScene.ts          # Mission gameplay
│   │   ├── ShopScene.ts
│   │   ├── CaptainSelectScene.ts
│   │   └── SettingsScene.ts
│   ├── entities/
│   │   ├── player-ship.ts           # Ship sprite + physics
│   │   ├── enemy.ts                 # Enemy base + variants
│   │   ├── boss.ts                  # Boss base + variants
│   │   ├── obstacle.ts              # Asteroids/debris
│   │   ├── projectile.ts            # Bullets/missiles
│   │   └── pickup.ts                # Collectibles
│   └── ui/
│       ├── hud.ts                   # In-game HUD
│       ├── button.ts                # Reusable button
│       ├── hp-bar.ts                # HP bar
│       ├── dialog.ts                # Retry/Return prompt
│       └── cooldown-ring.ts         # Ability cooldown
├── tests/
│   ├── models/player.test.ts
│   ├── models/inventory.test.ts
│   ├── systems/economy.test.ts
│   ├── systems/save-system.test.ts
│   ├── systems/mission-generator.test.ts
│   └── config/balance.test.ts
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`

- [ ] **Step 1: Initialize project**

```bash
cd /Users/ryanhaugland/galaxy-wrangler
npm init -y
npm install phaser
npm install -D typescript vite vitest @types/node
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { globals: true, environment: 'node' },
});
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Galaxy Wrangler</title>
  <style>body { margin: 0; background: #000; overflow: hidden; }</style>
</head>
<body>
  <div id="game"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: Create src/main.ts with Phaser boot**

```ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';

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
  scene: [BootScene, MainMenuScene],
};

new Phaser.Game(config);
```

- [ ] **Step 6: Create placeholder BootScene and MainMenuScene**

`src/scenes/BootScene.ts`:
```ts
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() { /* asset loading later */ }
  create() { this.scene.start('MainMenu'); }
}
```

`src/scenes/MainMenuScene.ts`:
```ts
export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }
  create() {
    this.add.text(195, 400, 'Galaxy Wrangler', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
  }
}
```

- [ ] **Step 7: Verify dev server runs**

Run: `npx vite`
Expected: Game canvas shows "Galaxy Wrangler" text on dark background.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: scaffold project with Phaser 3, Vite, TypeScript"
```

---

### Task 2: Types & Game Config

**Files:**
- Create: `src/models/types.ts`, `src/config/balance.ts`, `src/config/worlds.ts`, `src/config/items.ts`, `src/config/missions.ts`
- Test: `tests/config/balance.test.ts`

- [ ] **Step 1: Create src/models/types.ts**

```ts
export interface ShipStats { hp: number; damage: number; speed: number; shield: number; }

export interface Captain {
  id: string; name: string; stats: ShipStats;
  abilityName: string; abilityDescription: string;
  abilityCooldown: number; abilityDuration: number;
}

export type WeaponId = 'laser' | 'spread' | 'missiles' | 'beam';
export type DefenseId = 'shield_gen' | 'armor' | 'evasion';
export type CosmeticId = string;

export interface ShopItem {
  id: string; name: string; description: string; cost: number;
  category: 'weapon' | 'defense' | 'stat_boost' | 'cosmetic';
  stat?: keyof ShipStats; value?: number;
}

export interface MissionTemplate {
  type: 'destroy' | 'survive' | 'collect' | 'distance' | 'escort';
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number; coinReward: number;
  target: number; timeLimitSec?: number;
  minLevel: number;
}

export interface WorldDef {
  id: string; name: string; theme: string;
  levels: LevelDef[];
}

export interface LevelDef {
  tier: 'star' | 'constellation' | 'galaxy';
  travelDistance: number; obstacleDensity: number;
  boss: BossDef; creatureReward: Captain;
}

export interface BossDef {
  name: string; hp: number;
  style: 'auto_dodge' | 'tap_shoot' | 'ram_retreat';
  coinBonus: number; replayCoinBonus: number;
}

export interface SaveData {
  xp: number; level: number; coins: number;
  currentCaptainId: string;
  worldProgress: Record<string, boolean[]>;
  unlockedCreatures: string[];
  ownedItems: string[];
  equippedWeapon: WeaponId | null;
  equippedDefense: DefenseId | null;
  equippedCosmetic: CosmeticId | null;
  statBoosts: Partial<ShipStats>;
  checkpoint: CheckpointData | null;
}

export interface CheckpointData {
  worldId: string; levelIndex: number;
  distanceTraveled: number; hpRemaining: number;
}
```

- [ ] **Step 2: Create src/config/balance.ts**

```ts
export const XP_PER_LEVEL = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];

export function levelForXp(xp: number): number {
  let lvl = 0;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (xp >= XP_PER_LEVEL[i]) lvl = i; else break;
  }
  return lvl;
}

export function xpToNextLevel(xp: number): { current: number; needed: number } {
  const lvl = levelForXp(xp);
  if (lvl >= XP_PER_LEVEL.length - 1) return { current: 0, needed: 0 };
  return { current: xp - XP_PER_LEVEL[lvl], needed: XP_PER_LEVEL[lvl + 1] - XP_PER_LEVEL[lvl] };
}
```

- [ ] **Step 3: Write balance tests**

```ts
// tests/config/balance.test.ts
import { levelForXp, xpToNextLevel } from '@/config/balance';

describe('levelForXp', () => {
  it('returns 0 for 0 xp', () => { expect(levelForXp(0)).toBe(0); });
  it('returns 1 at 100 xp', () => { expect(levelForXp(100)).toBe(1); });
  it('stays at 1 at 249 xp', () => { expect(levelForXp(249)).toBe(1); });
  it('returns 2 at 250 xp', () => { expect(levelForXp(250)).toBe(2); });
});

describe('xpToNextLevel', () => {
  it('shows progress within level', () => {
    const r = xpToNextLevel(150);
    expect(r.current).toBe(50);
    expect(r.needed).toBe(150);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 5: Create worlds, items, missions configs**

Create `src/config/worlds.ts` with full world/level/boss/creature definitions for all 3 worlds (9 levels total). Create `src/config/items.ts` with all shop items. Create `src/config/missions.ts` with mission templates for each type/difficulty combo.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add type definitions and game config data"
```

---

### Task 3: Player Model & Economy

**Files:**
- Create: `src/models/player.ts`, `src/systems/economy.ts`
- Test: `tests/models/player.test.ts`, `tests/systems/economy.test.ts`

- [ ] **Step 1: Write player tests**

```ts
// tests/models/player.test.ts
import { createDefaultPlayer, getEffectiveStats } from '@/models/player';

describe('createDefaultPlayer', () => {
  it('starts at level 0 with 0 xp and 0 coins', () => {
    const p = createDefaultPlayer();
    expect(p.xp).toBe(0); expect(p.level).toBe(0); expect(p.coins).toBe(0);
  });
});

describe('getEffectiveStats', () => {
  it('applies stat boosts to base captain stats', () => {
    const p = createDefaultPlayer();
    p.statBoosts = { damage: 5 };
    const stats = getEffectiveStats(p);
    expect(stats.damage).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

- [ ] **Step 3: Implement src/models/player.ts**

```ts
import { SaveData, ShipStats } from './types';
import { CAPTAINS } from '@/config/worlds';

export function createDefaultPlayer(): SaveData {
  return {
    xp: 0, level: 0, coins: 0, currentCaptainId: 'base',
    worldProgress: {}, unlockedCreatures: [],
    ownedItems: [], equippedWeapon: null, equippedDefense: null,
    equippedCosmetic: null, statBoosts: {}, checkpoint: null,
  };
}

export function getEffectiveStats(save: SaveData): ShipStats {
  const captain = CAPTAINS[save.currentCaptainId];
  return {
    hp: captain.stats.hp + (save.statBoosts.hp ?? 0),
    damage: captain.stats.damage + (save.statBoosts.damage ?? 0),
    speed: captain.stats.speed + (save.statBoosts.speed ?? 0),
    shield: captain.stats.shield + (save.statBoosts.shield ?? 0),
  };
}
```

- [ ] **Step 4: Write economy tests**

```ts
// tests/systems/economy.test.ts
import { awardXp, awardCoins, canAfford, spend } from '@/systems/economy';
import { createDefaultPlayer } from '@/models/player';

describe('awardXp', () => {
  it('adds xp and levels up when threshold crossed', () => {
    const p = createDefaultPlayer();
    const result = awardXp(p, 100);
    expect(result.xp).toBe(100);
    expect(result.level).toBe(1);
  });
});

describe('spend', () => {
  it('deducts coins if affordable', () => {
    const p = createDefaultPlayer(); p.coins = 50;
    const result = spend(p, 30);
    expect(result.coins).toBe(20);
  });
  it('throws if not affordable', () => {
    const p = createDefaultPlayer();
    expect(() => spend(p, 100)).toThrow();
  });
});
```

- [ ] **Step 5: Implement src/systems/economy.ts**

```ts
import { SaveData } from '@/models/types';
import { levelForXp } from '@/config/balance';

export function awardXp(save: SaveData, amount: number): SaveData {
  const xp = save.xp + amount;
  return { ...save, xp, level: levelForXp(xp) };
}

export function awardCoins(save: SaveData, amount: number): SaveData {
  return { ...save, coins: save.coins + amount };
}

export function canAfford(save: SaveData, cost: number): boolean {
  return save.coins >= cost;
}

export function spend(save: SaveData, cost: number): SaveData {
  if (!canAfford(save, cost)) throw new Error('Insufficient coins');
  return { ...save, coins: save.coins - cost };
}
```

- [ ] **Step 6: Run tests, verify pass**

Run: `npx vitest run`

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add player model and economy system"
```

---

### Task 4: Save System

**Files:**
- Create: `src/systems/save-system.ts`
- Test: `tests/systems/save-system.test.ts`

- [ ] **Step 1: Install idb library**

```bash
npm install idb
```

- [ ] **Step 2: Write save system tests**

```ts
// tests/systems/save-system.test.ts
import { SaveManager } from '@/systems/save-system';
import { createDefaultPlayer } from '@/models/player';

// Use in-memory mock for unit tests since IndexedDB isn't available in Node
describe('SaveManager', () => {
  it('saves and loads player data', async () => {
    const mgr = new SaveManager(new MockStorage());
    const player = createDefaultPlayer();
    player.coins = 42;
    await mgr.save(player);
    const loaded = await mgr.load();
    expect(loaded?.coins).toBe(42);
  });

  it('returns default player when no save exists', async () => {
    const mgr = new SaveManager(new MockStorage());
    const loaded = await mgr.load();
    expect(loaded).toBeNull();
  });
});

class MockStorage {
  private data: string | null = null;
  async get() { return this.data ? JSON.parse(this.data) : null; }
  async set(val: any) { this.data = JSON.stringify(val); }
  async clear() { this.data = null; }
}
```

- [ ] **Step 3: Run tests, verify they fail**

- [ ] **Step 4: Implement src/systems/save-system.ts**

```ts
import { SaveData } from '@/models/types';

export interface StorageBackend {
  get(): Promise<SaveData | null>;
  set(data: SaveData): Promise<void>;
  clear(): Promise<void>;
}

export class IDBBackend implements StorageBackend {
  private dbName = 'galaxy-wrangler';
  private storeName = 'save';

  private async getDb() {
    const { openDB } = await import('idb');
    return openDB(this.dbName, 1, {
      upgrade(db) { db.createObjectStore('save'); },
    });
  }

  async get(): Promise<SaveData | null> {
    const db = await this.getDb();
    return (await db.get(this.storeName, 'player')) ?? null;
  }

  async set(data: SaveData): Promise<void> {
    const db = await this.getDb();
    await db.put(this.storeName, data, 'player');
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    await db.delete(this.storeName, 'player');
  }
}

export class SaveManager {
  constructor(private backend: StorageBackend) {}
  async save(data: SaveData): Promise<void> { await this.backend.set(data); }
  async load(): Promise<SaveData | null> { return this.backend.get(); }
  async clear(): Promise<void> { await this.backend.clear(); }
}
```

- [ ] **Step 5: Run tests, verify pass**

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add save system with IndexedDB backend"
```

---

### Task 5: Input System

**Files:**
- Create: `src/systems/input-system.ts`

- [ ] **Step 1: Implement tilt + tap input**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add tilt input system with calibration"
```

---

### Task 6: UI Components

**Files:**
- Create: `src/ui/button.ts`, `src/ui/hp-bar.ts`, `src/ui/cooldown-ring.ts`, `src/ui/dialog.ts`, `src/ui/hud.ts`

- [ ] **Step 1: Create button component**

A reusable Phaser container with a rounded rectangle background and centered text. Constructor takes `(scene, x, y, text, callback)`. Minimum 44px touch target. Pointer-over scale effect.

- [ ] **Step 2: Create hp-bar component**

A Phaser Graphics-based bar. Constructor takes `(scene, x, y, width, height, color)`. Method `setPercent(0-1)` redraws the fill. Used for both player HP and boss HP.

- [ ] **Step 3: Create cooldown-ring component**

A circular arc drawn with Phaser Graphics. `setCooldown(remaining, total)` draws partial ring. Shows ability icon in center when ready.

- [ ] **Step 4: Create dialog component**

Modal overlay container. Takes `(scene, title, options: {label, callback}[])`. Draws a semi-transparent backdrop, title text, and button per option. Used for boss defeat "Retry / Return to Space" prompt.

- [ ] **Step 5: Create HUD**

Phaser Scene running in parallel (overlay). Renders: HP bar (top-left), score/distance (top-right), ability button + cooldown ring (bottom-left), pause button (bottom-right). Boss mode adds boss HP bar across top. Methods: `updateHP()`, `updateScore()`, `updateBossHP()`, `showBossBar()`, `hideBossBar()`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add UI components (button, hp-bar, cooldown, dialog, hud)"
```

---

### Task 7: Player Ship & Entities

**Files:**
- Create: `src/entities/player-ship.ts`, `src/entities/enemy.ts`, `src/entities/obstacle.ts`, `src/entities/projectile.ts`, `src/entities/pickup.ts`

- [ ] **Step 1: Create player ship**

Phaser Physics Sprite. Draws a simple vector ship using Graphics (triangle shape). Takes captain stats to set speed/HP. Methods: `moveByTilt(tiltState)`, `fireWeapon()`, `takeDamage(amount)`, `useAbility()`. Auto-fires based on equipped weapon's fire rate. Emits events on death.

- [ ] **Step 2: Create enemy entity**

Base enemy class extending Phaser Physics Sprite. Properties: `hp`, `damage`, `speed`, `behavior` (drift, chase, patrol). Factory function `createEnemy(scene, type, x, y)` for each variant (mine, drone, ice_shard, frost_drone, fire_proj, exploding_asteroid). Each type has preset stats and behavior.

- [ ] **Step 3: Create obstacle entity**

Simple physics sprite. Floats downward (travel mode) or leftward (boss mode). Randomly sized. Collision deals damage to player based on size.

- [ ] **Step 4: Create projectile entity**

Fired by player ship or enemies/bosses. Properties: `damage`, `speed`, `direction`. Self-destroys when off-screen. Weapon type determines sprite shape and behavior (laser=single fast, spread=3-way, missiles=slow+homing, beam=continuous line).

- [ ] **Step 5: Create pickup entity**

Coin and collectible item sprites. Float toward player when nearby (magnet effect). On overlap, trigger economy award.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add game entities (ship, enemies, obstacles, projectiles, pickups)"
```

---

### Task 8: TravelScene (Vertical Scroller)

**Files:**
- Create: `src/scenes/TravelScene.ts`

- [ ] **Step 1: Implement TravelScene**

Receives `worldId` and `levelIndex` via scene data. Scrolls vertically (background tiles move downward). Spawns obstacles and enemies based on world config + obstacle density. Player ship controlled by tilt (left/right). Distance counter increments, triggers checkpoint save at 25/50/75%. When distance target reached, transition to BossScene.

Key implementation:
- `create()`: Initialize background, spawn player ship, start HUD scene, load checkpoint if exists
- `update()`: Move background, spawn enemies/obstacles on timer, check distance progress, handle collisions
- Collision groups: player vs enemies, player vs obstacles, projectiles vs enemies, player vs pickups
- On player death: show dialog "Retry from checkpoint" / "Return to Space"

- [ ] **Step 2: Add checkpoint save integration**

At 25% intervals, call `saveManager.save()` with current checkpoint data. On scene start, check for existing checkpoint and offer resume.

- [ ] **Step 3: Test manually**

Run dev server, navigate to TravelScene. Verify: background scrolls, ship responds to tilt (or mouse on desktop for dev), obstacles spawn, collisions work, distance counter advances.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add TravelScene vertical scroller with checkpoints"
```

---

### Task 9: BossScene (Horizontal Fight)

**Files:**
- Create: `src/entities/boss.ts`, `src/scenes/BossScene.ts`

- [ ] **Step 1: Create boss entity**

Phaser Physics Sprite positioned on right side of screen. Properties from BossDef: `hp`, `style`, `attackPatterns`. Three combat style implementations:

- `auto_dodge`: Boss fires projectiles in patterns, player auto-attacks, player tilts up/down to dodge
- `tap_shoot`: Boss fires, player must tap to shoot back while tilting to dodge
- `ram_retreat`: Player must fly into boss to deal damage, then dodge counterattack

Boss has phase changes at 66% and 33% HP (attacks get faster/more complex).

- [ ] **Step 2: Implement BossScene**

Horizontal layout within portrait mode. Player on left, boss on right. Player tilts up/down to move vertically. HUD shows boss HP bar. On boss death: award creature + coins, show victory screen, mark level complete. On player death: Dialog with "Retry" / "Return to Space".

- [ ] **Step 3: Test manually**

Navigate to BossScene with test data. Verify each combat style works, HP bars update, defeat/victory flows trigger correctly.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add BossScene with 3 combat styles"
```

---

### Task 10: Menu Scenes

**Files:**
- Modify: `src/scenes/MainMenuScene.ts`
- Create: `src/scenes/WorldSelectScene.ts`, `src/scenes/CaptainSelectScene.ts`, `src/scenes/ShopScene.ts`, `src/scenes/SettingsScene.ts`

- [ ] **Step 1: Flesh out MainMenuScene**

Title text + vector ship graphic. Three buttons: "Play" (-> WorldSelect), "Shop" (-> Shop), "Captains" (-> CaptainSelect). Settings gear icon in corner. Load save data on create, show player level + coins.

- [ ] **Step 2: Create WorldSelectScene**

Show 3 world cards (name, theme preview, progress indicator). Locked worlds show lock icon. Tapping unlocked world shows level select (Star/Constellation/Galaxy) with cleared/uncleared state. Selecting a level starts TravelScene.

- [ ] **Step 3: Create CaptainSelectScene**

Grid of captain portraits (base + unlocked creatures). Selected captain highlighted. Show stats comparison. Equip button switches current captain. Save on switch.

- [ ] **Step 4: Create ShopScene**

Tabbed layout: Weapons | Defense | Stat Boosts | Cosmetics. Each tab shows items with cost, owned state, equip button. Uses economy.spend() on purchase. Save after purchase.

- [ ] **Step 5: Create SettingsScene**

Tilt sensitivity slider, music/SFX volume sliders, invert tilt toggle, recalibrate button. Saves settings to localStorage.

- [ ] **Step 6: Register all scenes in main.ts**

Update the Phaser config scene array to include all scenes.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add menu scenes (world select, captain, shop, settings)"
```

---

### Task 11: Mission System

**Files:**
- Create: `src/systems/mission-generator.ts`, `src/scenes/SpaceScene.ts`, `src/scenes/MissionScene.ts`
- Test: `tests/systems/mission-generator.test.ts`

- [ ] **Step 1: Write mission generator tests**

```ts
import { generateMissionBoard } from '@/systems/mission-generator';

describe('generateMissionBoard', () => {
  it('generates 5 missions', () => {
    const board = generateMissionBoard(1);
    expect(board).toHaveLength(5);
  });
  it('filters by player level', () => {
    const board = generateMissionBoard(0);
    expect(board.every(m => m.minLevel === 0)).toBe(true);
  });
  it('includes variety of types', () => {
    const board = generateMissionBoard(5);
    const types = new Set(board.map(m => m.type));
    expect(types.size).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Implement mission generator**

```ts
import { MissionTemplate } from '@/models/types';
import { MISSION_TEMPLATES } from '@/config/missions';

export function generateMissionBoard(playerLevel: number): MissionTemplate[] {
  const eligible = MISSION_TEMPLATES.filter(m => m.minLevel <= playerLevel);
  const shuffled = eligible.sort(() => Math.random() - 0.5);
  const board: MissionTemplate[] = [];
  const usedTypes = new Set<string>();
  for (const m of shuffled) {
    if (board.length >= 5) break;
    if (usedTypes.size < 3 || !usedTypes.has(m.type)) {
      board.push(m);
      usedTypes.add(m.type);
    }
  }
  return board.length < 5 ? shuffled.slice(0, 5) : board;
}
```

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Create SpaceScene**

Mission board UI. Shows 5 mission cards with type icon, description, difficulty badge, rewards. Tapping a mission starts MissionScene with that mission's config. "Back" button returns to MainMenu.

- [ ] **Step 5: Create MissionScene**

Reuses TravelScene's vertical scroller engine but with mission objectives overlaid:
- **Destroy**: Enemy kill counter, timer
- **Survive**: Countdown timer, wave spawner
- **Collect**: Item counter, pickup spawner
- **Distance**: Distance counter (no boss at end)
- **Escort**: Cargo pod NPC that follows player, HP bar for cargo

On completion: award XP + coins via economy system, save, return to SpaceScene. On failure: "Retry" / "Return to Space".

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add mission system with generator and gameplay"
```

---

### Task 12: Inventory System

**Files:**
- Create: `src/models/inventory.ts`
- Test: `tests/models/inventory.test.ts`

- [ ] **Step 1: Write inventory tests**

```ts
import { purchaseItem, equipWeapon, equipDefense } from '@/models/inventory';
import { createDefaultPlayer } from '@/models/player';

describe('purchaseItem', () => {
  it('adds item to ownedItems and deducts coins', () => {
    const p = createDefaultPlayer(); p.coins = 100;
    const result = purchaseItem(p, { id: 'spread', cost: 50, category: 'weapon', name: 'Spread Shot', description: '' });
    expect(result.ownedItems).toContain('spread');
    expect(result.coins).toBe(50);
  });
  it('rejects duplicate purchase', () => {
    const p = createDefaultPlayer(); p.coins = 100; p.ownedItems = ['spread'];
    expect(() => purchaseItem(p, { id: 'spread', cost: 50, category: 'weapon', name: '', description: '' })).toThrow();
  });
});

describe('equipWeapon', () => {
  it('equips an owned weapon', () => {
    const p = createDefaultPlayer(); p.ownedItems = ['spread'];
    const result = equipWeapon(p, 'spread');
    expect(result.equippedWeapon).toBe('spread');
  });
});
```

- [ ] **Step 2: Implement src/models/inventory.ts**

```ts
import { SaveData, ShopItem, WeaponId, DefenseId, CosmeticId } from './types';
import { spend } from '@/systems/economy';

export function purchaseItem(save: SaveData, item: ShopItem): SaveData {
  if (save.ownedItems.includes(item.id)) throw new Error('Already owned');
  const afterSpend = spend(save, item.cost);
  const updated = { ...afterSpend, ownedItems: [...afterSpend.ownedItems, item.id] };
  if (item.category === 'stat_boost' && item.stat && item.value) {
    updated.statBoosts = { ...updated.statBoosts, [item.stat]: (updated.statBoosts[item.stat] ?? 0) + item.value };
  }
  return updated;
}

export function equipWeapon(save: SaveData, id: WeaponId): SaveData {
  if (!save.ownedItems.includes(id)) throw new Error('Not owned');
  return { ...save, equippedWeapon: id };
}

export function equipDefense(save: SaveData, id: DefenseId): SaveData {
  if (!save.ownedItems.includes(id)) throw new Error('Not owned');
  return { ...save, equippedDefense: id };
}

export function equipCosmetic(save: SaveData, id: CosmeticId): SaveData {
  if (!save.ownedItems.includes(id)) throw new Error('Not owned');
  return { ...save, equippedCosmetic: id };
}
```

- [ ] **Step 3: Run tests, verify pass**

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add inventory system with purchase and equip"
```

---

### Task 13: World Content & Scene Wiring

**Files:**
- Modify: `src/config/worlds.ts`, `src/main.ts`

- [ ] **Step 1: Define all 9 creature captains in worlds.ts**

Complete the CAPTAINS map with all 9 creatures (3 per world) including unique stats and ability definitions. Ensure the 3 named abilities from the spec are included (phase-through, freeze, fire burst) plus 6 new ones:

World 1 creatures: Nebula Jelly (phase-through), Nebula Wisp (speed burst), Nebula Titan (damage aura)
World 2 creatures: Ice Shard (freeze), Ice Prism (reflect projectiles), Ice Golem (temp armor)
World 3 creatures: Flame Sprite (fire burst AOE), Flame Drake (homing fireballs), Flame Colossus (shockwave)

- [ ] **Step 2: Wire all scenes together in main.ts**

Ensure scene transitions work end-to-end: MainMenu -> WorldSelect -> Travel -> Boss -> (victory/defeat) -> back. MainMenu -> Space -> Mission -> (complete/fail) -> Space. All scenes registered in Phaser config.

- [ ] **Step 3: Full integration test**

Manual playthrough: Start game, do a mission, buy an item, select a world, travel, fight boss, earn creature, switch captain. Verify save persists across refresh.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: wire all scenes and define world content"
```

---

### Task 14: PWA Setup

**Files:**
- Create: `manifest.json`, `src/sw.ts`, `public/icons/icon-192.png`, `public/icons/icon-512.png`
- Modify: `index.html`, `vite.config.ts`

- [ ] **Step 1: Install Workbox plugin**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Create manifest.json**

```json
{
  "name": "Galaxy Wrangler",
  "short_name": "Galaxy Wrangler",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a2e",
  "theme_color": "#0a0a2e",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Update vite.config.ts with PWA plugin**

```ts
import { VitePWA } from 'vite-plugin-pwa';

// Add to plugins array:
VitePWA({
  registerType: 'autoUpdate',
  workbox: { globPatterns: ['**/*.{js,css,html,png,svg,json}'] },
  manifest: false, // use our manifest.json
})
```

- [ ] **Step 4: Add manifest link and meta tags to index.html**

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0a0a2e" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

- [ ] **Step 5: Generate placeholder icons**

Create simple vector icons using Phaser's Graphics in a build script, or create minimal PNG placeholders (colored square with "GW" text).

- [ ] **Step 6: Build and verify PWA**

```bash
npx vite build && npx vite preview
```

Open in Chrome, verify: installable prompt appears, Lighthouse PWA audit passes, works offline after first load.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add PWA manifest, service worker, offline support"
```

---

### Task 15: Polish & Final Integration

**Files:**
- Modify: various scene files

- [ ] **Step 1: Add scene transitions**

Implement fade-in/fade-out between all scene changes using Phaser's camera fade effect. ~300ms duration.

- [ ] **Step 2: Add tilt calibration flow**

On first launch (no save data), show calibration scene before MainMenu. Store calibration in localStorage.

- [ ] **Step 3: Add audio stubs**

Create audio manager with play/stop methods for BGM and SFX. Use empty audio files as placeholders. Volume controlled by settings. Audio can be added later without code changes.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 5: Final manual smoke test**

Full playthrough on mobile device (or Chrome DevTools mobile emulation with sensors for tilt). Verify: tilt controls, missions, shop, boss fights, creature unlock, captain switch, checkpoint save/load, PWA install.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add transitions, calibration flow, audio stubs"
```
