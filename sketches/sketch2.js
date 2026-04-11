const SKETCH_ID = "sketch2";

let sk2PirogueX = 0;
let sk2FacingRight = true;

function displaySk2(pg) {
  const SC = 1;
  const bodyX =
    poseState.bodies.length > 0 ? poseState.bodies[0].bodyCenter.x : mouseX;
  const scaledX = (bodyX - pg.width / 2) * 2 + pg.width / 2; // 2x amplification around center
  const targetX = pg.width - scaledX; // counteract shouldInvert transform applied by SceneDirector

  const img = pirogue.imgs[pirogue.imgIndex];
  const halfW = img ? (img.width * SC) / 2 : 0;

  const prevX = sk2PirogueX;
  sk2PirogueX = pg.constrain(
    pg.lerp(sk2PirogueX, targetX, 0.04),
    halfW,
    pg.width - halfW,
  );

  if (pg.abs(sk2PirogueX - prevX) > 0.1) {
    sk2FacingRight = sk2PirogueX > prevX;
  }

  pirogue.update();

  pg.push();
  pg.imageMode(pg.CENTER);
  pg.translate(sk2PirogueX, pg.height - (500 * SC) / 2 + 50);
  if (!sk2FacingRight) pg.scale(-1, 1);
  pg.scale(SC);
  if (pirogue.imgs[pirogue.imgIndex]) {
    pg.image(pirogue.imgs[pirogue.imgIndex], 0, 0);
  }
  pg.pop();
}

function displaySk2Bird(pg) {
  bird.display(pg, 1);
  bird.update(1);

  flyBird.display(pg, 4);
  flyBird.update(4);
}
