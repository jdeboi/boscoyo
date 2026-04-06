let pirogueFollowerX = 0;
let pirogueFollowerY = 0;
let pirogueFollowerFacingRight = true;

function setupPirogueScene(pg) {
  pirogueFollowerX = pg.width / 2;
  pirogueFollowerY = pg.height / 2;
}

function displayPirogueScene(pg) {
  pg.background(0);

  const target =
    poseState.bodies.length > 0
      ? poseState.bodies[0].bodyCenter
      : { x: mouseX, y: mouseY };

  const prevX = pirogueFollowerX;
  pirogueFollowerX = pg.lerp(pirogueFollowerX, target.x, 0.04);
  pirogueFollowerY = pg.lerp(pirogueFollowerY, target.y, 0.04);

  if (pg.abs(pirogueFollowerX - prevX) > 0.1) {
    pirogueFollowerFacingRight = pirogueFollowerX > prevX;
  }

  pirogue.update(pg);

  pg.push();
  pg.imageMode(CENTER);
  pg.translate(pirogueFollowerX, pirogueFollowerY);
  if (!pirogueFollowerFacingRight) pg.scale(-1, 1);
  pg.scale(0.25);
  if (pirogue.imgs[pirogue.imgIndex]) {
    pg.image(pirogue.imgs[pirogue.imgIndex], 0, 0);
  }
  pg.pop();
}
