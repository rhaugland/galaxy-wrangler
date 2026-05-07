# Galaxy Wrangler - Game Design Spec

## Overview

Galaxy Wrangler is a PWA mobile game where players pilot a spaceship through different worlds, each containing three escalating levels (Star, Constellation, Galaxy). Players travel through vertical-scrolling space to reach each level's boss, then face the boss in a horizontal locked-in fight. Defeating a boss earns a creature that becomes a playable captain with a unique ship. Between world attempts, players grind XP and coins through structured missions in open "Space" mode.

## Core Design Principles

- Quick mobile sessions (5 minutes) with checkpoint saves
- Tilt-to-steer controls via device gyroscope
- RPG-lite progression: XP leveling + coin economy
- Clean vector/stylized art (not pixel art, not doodle)
- PWA: installable, offline-capable, add-to-homescreen

## Tech Stack

- **Game Engine:** Phaser 3 (WebGL rendering, physics, scene management, input handling)
- **PWA Shell:** Service worker for offline caching, web app manifest for installability
- **Storage:** IndexedDB (primary), localStorage (fallback for simple state)
- **Controls:** Device Orientation API (tilt), touch events (tap)
- **Build:** Standard web toolchain (Vite or similar bundler)

## Game Scenes

| Scene | Purpose |
|---|---|
| **MainMenuScene** | Title screen. Play, Shop, Captains buttons. |
| **WorldSelectScene** | Pick from 3 worlds (locked/unlocked state). |
| **TravelScene** | Vertical scroller. Tilt left/right to dodge obstacles/enemies while ascending toward the level target. Checkpoint auto-saves at ~25% intervals. |
| **BossScene** | Horizontal locked-in fight. Boss has HP pool, player deals damage. Combat style varies by boss. Win = earn creature. Lose = "Retry" or "Return to Space" prompt. |
| **SpaceScene** | Mission select hub. Pick a mission from the board, earn XP + coins. |
| **MissionScene** | Actual mission gameplay. Vertical scroller with mission objectives. |
| **ShopScene** | Buy stat boosts, weapons, defense, cosmetics with coins. |
| **CaptainSelectScene** | Switch between base captain or unlocked creature captains. |

## World Design (3 Worlds, V1)

Each world has a unique visual theme, enemy set, and boss combat style. 3 levels per world with escalating difficulty.

### Level Scaling

| | Star (Level 1) | Constellation (Level 2) | Galaxy (Level 3) |
|---|---|---|---|
| **Travel distance** | Short | Medium | Long |
| **Boss HP** | Low | Medium | High |
| **Creature reward** | Common | Rare | Legendary |
| **Obstacle density** | Sparse | Moderate | Dense |

### World 1: Nebula Fields

- **Theme:** Colorful gas clouds, asteroids, space dust
- **Enemies:** Drifting mines, small drones
- **Boss style:** Auto-attack + dodge (intro-friendly)
- **Creatures:** Gas-based beings (jellyfish-like)

### World 2: Ice Frontier

- **Theme:** Frozen asteroids, crystal formations, comet trails
- **Enemies:** Ice shards, homing frost drones, freezing zones that slow you
- **Boss style:** Tap to shoot + dodge (more demanding)
- **Creatures:** Crystalline creatures (geometric, angular)

### World 3: Inferno Core

- **Theme:** Lava flows, solar flares, volcanic debris
- **Enemies:** Fire projectiles, exploding asteroids, heat waves
- **Boss style:** Ram & retreat (high risk/reward, endgame difficulty)
- **Creatures:** Molten/flame creatures (phoenix-like)

Worlds unlock sequentially. Clear all 3 levels of World 1 to unlock World 2, etc.

## Captain & Ship System

### Base Captain

Default character. Balanced stats, no special ability. Always available.

### Creature Captains

Each of the 9 creatures unlocked from bosses becomes a playable captain with a unique ship.

**Ship Stats:**

| Stat | Description |
|---|---|
| **HP** | How much damage the ship can take |
| **Damage** | Base attack power |
| **Speed** | Movement responsiveness to tilt |
| **Shield** | Damage reduction percentage |

**Signature Abilities** (one per creature, activated via tap on cooldown):

- Nebula jellyfish: temporary phase-through (invincibility)
- Ice crystal: freeze all enemies on screen for 2 seconds
- Inferno phoenix: fire burst AOE damage
- (Remaining 6 creatures: abilities designed per creature during implementation)

### Ship Attachments (purchased in shop)

- **Weapons:** Laser, spread shot, missiles, beam. One equipped at a time.
- **Defense:** Shield generator, armor plating, evasion module. One equipped at a time.
- **Stat boosts:** Permanent incremental upgrades to HP, damage, speed, shield. Stackable.
- **Cosmetics:** Ship skins, trail effects, explosion colors. No gameplay effect.

Attachments are global across all captains — not tied to a specific creature.

## Space Practice & Missions

### Mission Types

| Type | Description | Reward Focus |
|---|---|---|
| **Destroy** | Kill X enemies within a time limit | XP heavy |
| **Survive** | Stay alive for X seconds in escalating waves | Coins heavy |
| **Collect** | Gather X items while dodging obstacles | Balanced |
| **Distance** | Travel X distance in one run | XP heavy |
| **Escort** | Protect a cargo pod from enemies | Coins heavy |

### Mission Difficulty

- Easy / Medium / Hard tiers available
- Harder missions require minimum XP level to unlock
- Rewards scale with difficulty
- Mission board refreshes on app reopen

## Economy

### XP

- Accumulates globally (not per captain)
- Level thresholds unlock: new mission tiers, shop items, stat ceilings
- Leveling up restores full HP

### Coins

- Earned from missions and boss fights
- Spent in shop on weapons, defense, stat boosts, cosmetics
- Bosses drop a coin bonus on first clear, smaller amount on replays

## Boss Fights

- **Locked-in screen** — no dodging past or skipping the boss
- Boss has an HP pool; player's ship deals damage based on stats + equipped weapon
- Combat style varies per world (auto-attack+dodge, tap-to-shoot+dodge, ram+retreat)
- On defeat: prompt with "Retry" or "Return to Space"
- Star bosses have the least HP, Constellation mid-range, Galaxy the most
- Each boss has unique attack patterns within their combat style

## Save System & Checkpoints

### Auto-Save Triggers

- After every mission completion (XP + coins banked immediately)
- During travel runs: checkpoint every ~25% of travel distance
- Before boss fight entry (losing returns to this save)
- On shop purchases (instant)
- On captain switch (instant)

### Storage

- **IndexedDB** as primary storage for structured game data
- **localStorage** fallback for simple key-value state (current captain, last scene, settings)
- No cloud sync for V1 — purely local on-device

### Save Data Structure

- Player profile: XP level, coins, current captain
- World progress: levels cleared, boss states
- Inventory: owned weapons, defense, cosmetics, stat boosts
- Creature collection: unlocked captains + their stats
- Active loadout: equipped weapon, defense, cosmetic
- Travel checkpoint: world, level, distance reached, HP remaining
- Mission board state

## Controls

### Input

- **Tilt:** Primary movement via Device Orientation API. Left/right during vertical travel, up/down during horizontal boss fights.
- **Tap:** Fire weapon (manual shooting modes)
- **Tap special button:** Activate creature captain's signature ability
- **Tap to interact:** All menus, shop, mission select, captain select

### Tilt Calibration

- First launch: calibration screen ("Hold your phone how you'll play, then tap")
- Sets neutral/resting position
- Recalibrate available in settings

## HUD

- **Top left:** HP bar
- **Top right:** Score/distance counter
- **Bottom left:** Special ability button + cooldown ring
- **Bottom right:** Pause button
- **Boss fights add:** Boss HP bar across the top

## UI Design

- Clean vector aesthetic matching game art style
- Large tap targets (minimum 44px) for mobile
- Minimal text, icon-driven where possible
- Smooth scene transitions (fade/slide)

## Settings

- Tilt sensitivity slider
- Music/SFX volume
- Recalibrate tilt
- Invert tilt toggle

## PWA

- Service worker caches all game assets on first load
- Fully playable offline after install
- Web app manifest with icons for add-to-homescreen
- Portrait orientation only. Horizontal boss fight scrolling happens within portrait mode (ship flies left-to-right across the screen width, not requiring landscape rotation).

## Out of Scope (V1)

- Cloud save / cross-device sync
- Multiplayer
- In-app purchases / real money
- More than 3 worlds
- Leaderboards
- Social features
- Landscape-only mode
