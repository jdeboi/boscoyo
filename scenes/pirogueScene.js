let pirogueFollowerX = 0;
let pirogueFollowerY = 0;
let pirogueFollowerFacingRight = true;

function setupPirogueScene() {
  pirogueFollowerX = width / 2;
  pirogueFollowerY = height / 2;
}

function displayPirogueScene() {
  background(10, 20, 35);

  const target = poseState.bodies.length > 0
    ? poseState.bodies[0].bodyCenter
    : { x: mouseX, y: mouseY };

  const prevX = pirogueFollowerX;
  pirogueFollowerX = lerp(pirogueFollowerX, target.x, 0.04);
  pirogueFollowerY = lerp(pirogueFollowerY, target.y, 0.04);

  if (abs(pirogueFollowerX - prevX) > 0.1) {
    pirogueFollowerFacingRight = pirogueFollowerX > prevX;
  }

  pirogue.update();

  push();
  imageMode(CENTER);
  translate(pirogueFollowerX, pirogueFollowerY);
  if (!pirogueFollowerFacingRight) scale(-1, 1);
  scale(0.25);
  if (pirogue.imgs[pirogue.imgIndex]) {
    image(pirogue.imgs[pirogue.imgIndex], 0, 0);
  }
  pop();
}
