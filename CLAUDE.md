# Boscoyo

Interactive projection-mapped art installation about Louisiana cypress swamps. Three networked p5.js sketches run on three separate computers, each driving its own projector. One computer runs the camera + MoveNet pose detection and acts as the sync leader.

## Running the project

```bash
npm install
node server.js
```

Then open a browser on each computer:

| Computer | URL | Role |
|----------|-----|------|
| 1 (leader) | `http://<leader-ip>:8080/?role=leader` | Runs camera, drives scene timing |
| 2 | `http://<leader-ip>:8080/sketch2?role=follower` | Receives sync from leader |
| 3 | `http://<leader-ip>:8080/sketch3?role=follower` | Receives sync from leader |

`node server.js` only needs to run on the leader machine. All other computers just need a browser.

To find the leader machine's IP:
```bash
ipconfig getifaddr en0
```

## Key controls (all computers)

| Key | Action |
|-----|--------|
| `←` / `→` | Previous / next scene (leader only — followers sync automatically) |
| `p` | Toggle preview mode (bypass projection mapper, fill browser window) |
| `d` | Toggle debug overlay (FPS, pose landmarks) |
| `c` | Toggle projection mapper calibration |
| `i` | Flip canvas horizontally |
| `l` | Reload projection map from `maps/map.json` |
| `s` | Save current projection map to `map.json` |
| `f` | Toggle fullscreen |

## Project structure

```
boscoyo.js          — shared core (setup, draw, pose system, sync client)
server.js           — HTTP static server + WebSocket sync relay
sketches/
  sketch1.js        — scene list + display functions for computer 1
  sketch2.js        — scene list for computer 2 (add draw functions here)
  sketch3.js        — scene list for computer 3 (add draw functions here)
scenes/
  duckweed.js       — duckweed + gator scene
  lotus.js          — lotus / lily pad scene
  moss.js           — hanging moss scene
  pirogueScene.js   — pirogue follower scene
js/
  SceneDirector.js  — scene sequencer class (shared, do not add scene defs here)
  Bird.js / Cypress.js / MossChain.js / Pirogue.js / Star.js
assets/             — images and fonts
maps/map.json       — saved projection mapper calibration
```

## Adding scenes to sketch 2 or 3

1. Write a draw function in `sketches/sketch2.js` (receives `pg` — a p5.Graphics buffer)
2. Replace the `draw: (pg) => { pg.background(0); }` stub for that scene ID
3. If the scene needs new asset files, add `<script>` tags to `sketch2.html`

Scene IDs must match across all three sketch files — that's how sync knows which scene to jump to on followers.

## Networking / sync

- Leader sends scene changes and pose data over WebSocket whenever they occur
- Followers receive and apply both automatically — no camera needed on follower machines
- Pose coordinates are in canvas pixel space (already scaled and smoothed)
- The WebSocket server is a simple relay — it has no state of its own

## Projection mapping

Each sketch drives two projection surfaces (`mappedSurface1`, `mappedSurface2`), each showing one half of the scene canvas. Calibration is saved per-computer in `maps/map.json`. Press `c` to enter calibration mode, drag the corner handles, then `s` to save.
