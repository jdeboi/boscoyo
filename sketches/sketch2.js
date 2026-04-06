const START_SCENE_ID = "pirogueOnly";

let sk2PirogueX = 0;
let sk2FacingRight = true;

function displaySk2(pg) {
  const SC = 2;
  const bodyX = poseState.bodies.length > 0 ? poseState.bodies[0].bodyCenter.x : mouseX;
  const scaledX = (bodyX - pg.width / 2) * 2 + pg.width / 2; // 2x amplification around center
  const targetX = pg.width - scaledX; // counteract shouldInvert transform applied by SceneDirector

  const prevX = sk2PirogueX;
  sk2PirogueX = pg.lerp(sk2PirogueX, targetX, 0.04);

  if (pg.abs(sk2PirogueX - prevX) > 0.1) {
    sk2FacingRight = sk2PirogueX > prevX;
  }

  pirogue.update();

  pg.push();
  pg.imageMode(pg.CENTER);
  // pin to bottom: pirogue imgs are resized to h=500, so half-height at SC
  pg.translate(sk2PirogueX, pg.height - (500 * SC) / 2 + 50);
  if (!sk2FacingRight) pg.scale(-1, 1);
  pg.scale(SC);
  if (pirogue.imgs[pirogue.imgIndex]) {
    pg.image(pirogue.imgs[pirogue.imgIndex], 0, 0);
  }
  pg.pop();
}

// Scene IDs and durations must match sketch1 for sync to work
const scenes = [{ id: "pirogueOnly", durationSeconds: 20, draw: displaySk2 }];
