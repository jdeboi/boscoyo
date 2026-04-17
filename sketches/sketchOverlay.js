var SKETCH_ID = "sketchOverlay";
var NUM_PROJECTION_SURFACES = 1;

function displayBirdOverlay(pg) {
  const targetX =
    poseState.bodies.length > 0 ? poseState.bodies[0].bodyCenter.x : mouseX;
  const dir = bird.updateSuspicious(targetX);
  bird.display(pg, dir);
}

function displayFlyingBirdOverlay(pg) {
  // Position bird near bottom; account for outer 4x scale + flyBird.scale (0.5)
  flyBird.y = pg.height - flyBird.getHeight(1) - 50;
  const dir = flyBird.updateFollowing(getPoseX());
  pg.push();
  flyBird.display(pg, dir);
  pg.pop();
}
