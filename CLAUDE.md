# Boscoyo

Interactive projection-mapped art installation about Louisiana cypress swamps. Up to four networked p5.js sketches run on separate computers, each driving its own projector. One computer runs the camera + MoveNet pose detection and acts as the sync leader.

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
| 3 | `http://<leader-ip>:8080/sketchOverlay?role=follower` | Receives sync from leader |
| 4 | `http://<leader-ip>:8080/sketchSplit?role=follower` | Receives sync from leader |

**The sketch ID and role are fully independent.** Any sketch can be the leader — just pass `?role=leader`. For example, if computer 2 needs to be the leader running sketch2:

```
http://<computer2-ip>:8080/sketch2?role=leader
```

Then press `k` to start the camera on that machine. Followers point their `sync` param at computer 2's IP.

`node server.js` only needs to run on the leader machine. All other computers just need a browser.

### WiFi-resilient fallback (followers with local server)

Each follower can run its own `node server.js` and load from localhost. Use the `sync` param to point WebSocket at the leader:

| Computer | URL |
|----------|-----|
| 2 (local) | `http://localhost:8080/sketch2?role=follower&sync=<leader-ip>` |
| 3 (local) | `http://localhost:8080/sketchOverlay?role=follower&sync=<leader-ip>` |
| 4 (local) | `http://localhost:8080/sketchSplit?role=follower&sync=<leader-ip>` |

This way the page loads from local disk even if WiFi is down, and reconnects to the leader WebSocket automatically when WiFi comes back.

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
| `k` | Toggle camera on/off (leader only) |
| `m` | Toggle mouse mode (use mouse instead of pose) |
| `l` | Reload projection map from `maps/map.json` |
| `s` | Save current projection map to `map.json` |
| `f` | Toggle fullscreen |

## Project structure

```
boscoyo.js          — shared core (setup, draw, pose system, sync client)
server.js           — HTTP static server + WebSocket sync relay
sketches/
  sketch1.js        — scene list + display functions for computer 1 (2 surfaces)
  sketch2.js        — scene list for computer 2 (2 surfaces)
  sketchOverlay.js  — scene list for overlay computer (1 surface)
  sketchSplit.js    — scene list for split computer (4 surfaces)
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

## Adding scenes to a sketch

1. Write a draw function in the relevant sketch file (receives `pg` — a p5.Graphics buffer)
2. Replace the `draw: (pg) => { pg.background(0); }` stub for that scene ID
3. If the scene needs new asset files, add `<script>` tags to the corresponding HTML file

Scene IDs must match across all sketch files — that's how sync knows which scene to jump to on followers.

## Networking / sync

- Leader sends scene changes and pose data over WebSocket whenever they occur
- Followers receive and apply both automatically — no camera needed on follower machines
- Pose coordinates are in canvas pixel space (already scaled and smoothed)
- The WebSocket server is a simple relay — it has no state of its own

## Projection mapping

Each sketch defines `NUM_PROJECTION_SURFACES` (1, 2, or 4), creating that many equal-width mapped surfaces across the canvas. Calibration is saved per-computer in `maps/map.json`. Press `c` to enter calibration mode, drag the corner handles, then `s` to save.
