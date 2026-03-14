# Boscoyo (Cypress Knees)

An interactive web-based visual experience about the cypress forests of Louisiana's swamps — what they were, what was lost, and what remains.

The piece uses live webcam pose detection to create an embodied connection between the viewer and the landscape. Animated scenes move through narrative text, cypress trees with hanging moss, birds, pirogues, and lotus flowers.

## Running the Project

Serve from a local HTTP server (opening `index.html` via `file://` blocks camera access):

```bash
npx http-server -p 8000
# or
python3 -m http.server 8000
```

Then open `http://localhost:8000`, click **Start Camera**, and grant webcam access.

## Controls

| Key | Action |
|-----|--------|
| `d` | Toggle pose debug overlay (labeled landmark dots) |
| `i` | Mirror the canvas horizontally |
| `f` | Toggle fullscreen |

## Performance

Pose detection (MediaPipe) is the main performance cost. Two things keep it from killing the frame rate:

**Web Worker** — MediaPipe runs on a separate thread. JavaScript is normally single-threaded, so any heavy computation freezes rendering. By moving inference into a `Worker`, the render loop runs freely at 60fps while pose results arrive in the background whenever the worker finishes.

**Throttled physics** — The moss chain physics (particle simulation + noise per node) runs every other frame instead of every frame, halving the cost with no visible difference.
