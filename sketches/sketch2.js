const START_SCENE_ID = "treeSpan";

let sk2PirogueX = 0;
let sk2FacingRight = true;

function displaySk2(pg) {
  const SC = 0.5;
  const targetX =
    poseState.bodies.length > 0 ? poseState.bodies[0].bodyCenter.x : mouseX;

  const prevX = sk2PirogueX;
  sk2PirogueX = pg.lerp(sk2PirogueX, targetX, 0.04);

  if (pg.abs(sk2PirogueX - prevX) > 0.1) {
    sk2FacingRight = sk2PirogueX > prevX;
  }

  pirogue.update(pg);

  pg.push();
  pg.imageMode(pg.CENTER);
  // pin to bottom: pirogue imgs are resized to h=500, so half-height at SC
  pg.translate(sk2PirogueX, pg.height - (500 * SC) / 2);
  if (!sk2FacingRight) pg.scale(-1, 1);
  pg.scale(SC);
  if (pirogue.imgs[pirogue.imgIndex]) {
    pg.image(pirogue.imgs[pirogue.imgIndex], 0, 0);
  }
  pg.pop();
}

// Scene IDs and durations must match sketch1 for sync to work
const scenes = [
  { id: "treeSpan",         durationSeconds: 30, draw: displaySk2 },
  { id: "birdBigTree1",     durationSeconds: 15, draw: displaySk2 },
  { id: "pirogue",          durationSeconds: 25, draw: displaySk2 },
  { id: "lotus",            durationSeconds: 20, draw: displaySk2 },
  { id: "duckweed",         durationSeconds: 30, draw: displaySk2 },
  { id: "moss",             durationSeconds: 30, draw: displaySk2 },
  { id: "pirogueScene",     durationSeconds: 30, draw: displaySk2 },
  { id: "bigTreeQuestions",  durationSeconds: 8,  draw: displaySk2 },
  { id: "bigTreeQuestions2", durationSeconds: 8,  draw: displaySk2 },
  { id: "bigTreeQuestions3", durationSeconds: 4,  draw: displaySk2 },
  { id: "treesAndPirogue",  durationSeconds: 20, draw: displaySk2 },
];
