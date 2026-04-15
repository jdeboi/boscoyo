# Boscoyo (Cypress Knees)

An interactive projection-mapped art installation about the cypress forests of Louisiana's swamps. Up to four networked computers each drive a projector. One computer runs live pose detection and acts as the sync leader; the others follow automatically.

## Installation Setup

### 1. Start the server (on every machine)
```bash
cd boscoyo
npm install
node server.js
```

### 3. Find the leader's IP address
```bash
ipconfig getifaddr en0
```

### 4. Open a browser on each machine

| Machine | URL | Role |
|---------|-----|------|
| Leader | `http://localhost:8080/?role=leader` | Camera + scene control |
| Computer 2 | `http://localhost:8080/sketch2?role=follower&sync=<leader-ip>` | Follower |
| Computer 3 | `http://localhost:8080/sketchOverlay?role=follower&sync=<leader-ip>` | Follower |
| Computer 4 | `http://localhost:8080/sketchSplit?role=follower&sync=<leader-ip>` | Follower |

### 4. On the leader
- Press `t` for **showtime mode** — starts camera, exits preview, switches to pose mode, flips canvas, hides debug, and enters fullscreen in one keystroke
- Press `c` to enter projection calibration, drag corners, then `s` to save

## Key Controls (all machines)

| Key | Action |
|-----|--------|
| `t` | **Showtime** — camera on, exit preview, pose mode, flip canvas, hide debug, fullscreen |
| `←` / `→` | Previous / next scene (leader only — followers sync automatically) |
| `k` | Toggle camera on/off (leader only) |
| `p` | Toggle preview mode (bypass projection mapper) |
| `c` | Toggle projection mapper calibration |
| `s` | Save projection map |
| `l` | Reload projection map from file |
| `f` | Toggle fullscreen |
| `d` | Toggle debug overlay (FPS, scene name, pose landmarks) |
| `m` | Toggle mouse mode (use mouse instead of pose) |
| `i` | Flip canvas horizontally |

## Fallback / Resilience

**If WiFi drops mid-show:** followers keep running on the last received scene and reconnect automatically when WiFi returns.

**If the leader machine dies:** reload any follower with `?role=leader` appended, press `k` to start camera. Use `←` / `→` to advance scenes manually.

**Solo mode (one machine only):**
```
http://localhost:8080/sketch1Only?role=leader
```

## Project Structure

```
boscoyo.js          — shared core (setup, draw, pose, sync)
server.js           — HTTP server + WebSocket relay
sketches/
  sketch1.js        — scene functions for computer 1 (2 surfaces)
  sketch2.js        — scene functions for computer 2 (2 surfaces)
  sketchOverlay.js  — scene functions for overlay computer (1 surface)
  sketchSplit.js    — scene functions for split computer (4 surfaces)
  sketch1Only.js    — solo mode (all scenes on one machine)
scenes/
  SceneCoordinator.js — scene registry (scene IDs, draw functions, timing)
  duckweed.js       — duckweed + gator scene
  lotus.js          — lotus / lily pad scene
  moss.js           — hanging moss scene
  pirogueScene.js   — pirogue + reeds scene
js/
  Cypress.js / TreeInit.js — cypress tree rendering
  Bird.js / Gator.js / Pirogue.js / MossChain.js / Star.js
lib/                — local copies of p5.js and ml5.js (no CDN needed)
assets/             — images and fonts
maps/map.json       — saved projection calibration (per machine)
```
