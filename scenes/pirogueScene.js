let pirogueFollowerX = 0;
let pirogueFollowerY = 0;
let pirogueFollowerFacingRight = true;
let pirogueWind = 0;

const pirogueReedsBack = []; // drawn before pirogue
const pirogueReedsFront = []; // drawn after pirogue

const PIROGUE_MAX_SPEED = 3.5; // px per frame cap

// ── Reed ──────────────────────────────────────────────────────────────────────
class Reed {
  constructor(x, baseY, canvasH) {
    this.x = x;
    this.baseY = baseY;
    this.noiseOff = random(1000);

    // Height and thickness scale with y (further back = shorter/thinner)
    const t = map(baseY, canvasH * 0.4, canvasH * 0.88, 0, 1, true);
    this.height = map(t, 0, 1, 40, 260);
    this.thickness = map(t, 0, 1, 0.6, 5.5);

    // Greenish-gray hue, like Spanish moss, varied brightness per reed
    const bright = random(200, 255);
    this.r = bright * random(0.78, 0.92);
    this.g = bright;
    this.b = bright * random(0.83, 0.95);
  }

  display(pg, boatX) {
    // Ambient perlin sway
    const sway = pg.map(
      pg.noise(frameCount * 0.007 + this.noiseOff),
      0,
      1,
      -1,
      1,
    );

    // Wind tilt
    const windBend = pirogueWind * this.height * 0.35;

    // Boat proximity — smooth arc, no hard flip, reduced max bend
    const RADIUS = 280;
    const normDist = (this.x - boatX) / RADIUS;
    const boatBend =
      abs(normDist) < 1 ? sin(normDist * PI) * this.height * 0.38 : 0;

    const tipOffX = windBend + boatBend + sway * 5;
    const tipX = this.x + tipOffX;
    const tipY = this.baseY - this.height;
    const cpX = this.x + tipOffX * 0.4;
    const cpY = this.baseY - this.height * 0.55;

    // Tangent direction at bezier tip (from control point → tip)
    const tanX = tipX - cpX; // tipOffX * 0.6
    const tanY = tipY - cpY; // -this.height * 0.45

    pg.push();
    pg.stroke(this.r, this.g, this.b);
    pg.strokeWeight(this.thickness);
    pg.noFill();
    pg.beginShape();
    pg.vertex(this.x, this.baseY);
    pg.quadraticVertex(cpX, cpY, tipX, tipY);
    pg.endShape();

    // Elongated seed head — aligned to stem tangent at tip
    pg.noStroke();
    pg.fill(this.r, this.g, this.b);
    pg.push();
    pg.translate(tipX, tipY);
    pg.rotate(atan2(tanX, -tanY)); // angle of stem direction at tip
    pg.ellipse(
      0,
      -this.thickness * 3.5,
      this.thickness * 1.6,
      this.thickness * 9,
    );
    pg.pop();

    pg.pop();
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────
function setupPirogueScene(pg) {
  pirogueFollowerX = pg.width / 2;
  pirogueFollowerY = pg.height / 2;

  const W = pg.width || 1200;
  const H = pg.height || 800;
  const midY = H * 0.66;

  randomSeed(7);

  const NUM_ROWS = 11;
  for (let row = 0; row < NUM_ROWS; row++) {
    const yFrac = map(row, 0, NUM_ROWS - 1, 0.28, 0.88);
    const baseY = H * yFrac;
    const count = floor(
      map(abs(row - (NUM_ROWS - 1) * 0.5), 0, (NUM_ROWS - 1) * 0.5, 28, 10),
    );

    for (let i = 0; i < count; i++) {
      const x = random(-30, W + 30);
      const reed = new Reed(x, baseY, H);
      if (baseY < midY) {
        pirogueReedsBack.push(reed);
      } else {
        pirogueReedsFront.push(reed);
      }
    }
  }
}

// ── Display ───────────────────────────────────────────────────────────────────
function displayPirogueScene(pg) {
  pg.background(0);

  const target =
    poseState.bodies.length > 0
      ? poseState.bodies[0].bodyCenter
      : { x: mouseX, y: mouseY };

  // Move toward target with a max speed cap
  const prevX = pirogueFollowerX;
  const desiredX = pg.lerp(pirogueFollowerX, target.x, 0.018);
  const desiredY = pg.lerp(pirogueFollowerY, target.y, 0.018);
  const dx = desiredX - pirogueFollowerX;
  const dy = desiredY - pirogueFollowerY;
  const spd = sqrt(dx * dx + dy * dy);
  if (spd > PIROGUE_MAX_SPEED) {
    pirogueFollowerX += (dx / spd) * PIROGUE_MAX_SPEED;
    pirogueFollowerY += (dy / spd) * PIROGUE_MAX_SPEED;
  } else {
    pirogueFollowerX = desiredX;
    pirogueFollowerY = desiredY;
  }

  // Clamp boat so image stays fully on screen.
  // Y is clamped using the max scale (3.0) so the bottom margin is fixed —
  // no circular dependency between scale and position.
  // Y: fixed fraction bounds — image is too large at max scale to use img dims
  pirogueFollowerY = constrain(pirogueFollowerY, pg.height * 0.5, pg.height * 0.92);
  // X: use actual scale from stable Y to keep boat horizontally on screen
  const img = pirogue.imgs[pirogue.imgIndex];
  if (img) {
    const boatScale = pg.map(pirogueFollowerY, pg.height * 0.5, pg.height, 0.5, 1.0);
    const hw = img.width * boatScale * 0.5;
    pirogueFollowerX = constrain(pirogueFollowerX, hw, pg.width - hw);
  }

  if (pg.abs(pirogueFollowerX - prevX) > 0.1) {
    pirogueFollowerFacingRight = pirogueFollowerX > prevX;
  }

  // Wind tracks boat x
  const windTarget = pg.map(pirogueFollowerX, 0, pg.width, -0.2, 0.2);
  pirogueWind = pg.lerp(pirogueWind, windTarget, 0.04);

  pirogue.update();

  pg.push();
  // pg.translate(0, -100);
  // Back reeds
  for (const r of pirogueReedsBack) r.display(pg, pirogueFollowerX);

  // Front reeds
  for (const r of pirogueReedsFront) r.display(pg, pirogueFollowerX);
  pg.pop();
  // Pirogue on top of everything
  pg.push();
  pg.imageMode(CENTER);
  pg.translate(pirogueFollowerX, pirogueFollowerY);
  if (!pirogueFollowerFacingRight) pg.scale(-1, 1);
  // Perspective scale: bigger near bottom, smaller near top
  const boatScale = pg.map(
    pirogueFollowerY,
    pg.height * 0.5,
    pg.height,
    0.5,
    1.5,
  );
  pg.scale(boatScale);
  if (pirogue.imgs[pirogue.imgIndex]) {
    pg.image(pirogue.imgs[pirogue.imgIndex], 0, 0);
  }
  pg.pop();
}
