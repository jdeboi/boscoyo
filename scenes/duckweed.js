const duckweedParticles = [];
let gatorFacingRight = true;
let prevGatorX = null;
let gatorSmoothX = null;
let gatorSmoothY = null;

class DuckweedParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.ox = x;
    this.oy = y;
    this.vx = 0;
    this.vy = 0;
    this.rot = random(this.TWO_PI);
    this.sc = random(0.2, 0.5);
    this.imgId = floor(random(duckweedImgs.length));
  }

  update(repellers) {
    const damping = 0.78;
    const spring = 0.008;

    // gentle wave drift
    const t = millis() * 0.0006;
    this.vx += sin(t + this.oy * 0.018) * 0.04;
    this.vy += sin(t * 0.7 + this.ox * 0.015) * 0.025;

    // spring back to origin
    this.vx += (this.ox - this.x) * spring;
    this.vy += (this.oy - this.y) * spring;

    for (const r of repellers) {
      const dx = this.x - r.x;
      const dy = this.y - r.y;
      const dSq = dx * dx + dy * dy;
      const rSq = r.radius * r.radius;
      if (dSq < rSq && dSq > 0) {
        const d = sqrt(dSq);
        const force = r.strength * (1 - d / r.radius);
        this.vx += (dx / d) * force;
        this.vy += (dy / d) * force;
      }
    }

    this.vx *= damping;
    this.vy *= damping;
    this.x += this.vx;
    this.y += this.vy;
  }
}

function setupDuckweed() {
  duckweedParticles.length = 0;
  const cols = 35;
  const rows = 25;
  const sx = width / cols;
  const sy = height / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = (i + 0.5) * sx + random(-sx * 0.45, sx * 0.45);
      const y = (j + 0.5) * sy + random(-sy * 0.45, sy * 0.45);
      duckweedParticles.push(new DuckweedParticle(x, y));
    }
  }
}

function displayDuckweed(pg = scene2D) {
  pg.background(0);
  const radius = 400;
  const repellers = [{ x: mouseX, y: mouseY, radius: radius, strength: 1.5 }];
  for (const body of poseState.bodies) {
    repellers.push({
      x: body.bodyCenter.x,
      y: body.bodyCenter.y,
      radius: radius,
      strength: 1.5,
    });
  }

  for (const p of duckweedParticles) {
    p.update(repellers);
  }

  pg.fill(52, 120, 48);
  pg.noStroke();
  for (const p of duckweedParticles) {
    pg.push();
    pg.translate(p.x, p.y);
    pg.rotate(p.rot);
    pg.scale(p.sc);
    pg.image(duckweedImgs[p.imgId], 0, 0);
    pg.pop();
  }

  // smooth gator toward target (single gator, first body or mouse)
  const rawTarget =
    poseState.bodies.length > 0
      ? poseState.bodies[0].bodyCenter
      : { x: mouseX, y: mouseY };

  const gatorW = gatorImg ? gatorImg.width / 2 : 60;
  const gatorH = gatorImg ? gatorImg.height / 2 : 40;
  const targetX = constrain(rawTarget.x, gatorW, pg.width - gatorW);
  const targetY = constrain(rawTarget.y, gatorH, pg.height - gatorH);

  if (gatorSmoothX === null) {
    gatorSmoothX = targetX;
    gatorSmoothY = targetY;
  }

  const lerpAmt = 0.06;
  const prevSmoothedX = gatorSmoothX;
  gatorSmoothX = lerp(gatorSmoothX, targetX, lerpAmt);
  gatorSmoothY = lerp(gatorSmoothY, targetY, lerpAmt);

  if (prevGatorX !== null && abs(gatorSmoothX - prevSmoothedX) > 0.05) {
    gatorFacingRight = gatorSmoothX > prevSmoothedX;
  }
  prevGatorX = gatorSmoothX;

  const gatorBob = sin(millis() * 0.0015) * 5;

  pg.imageMode(pg.CENTER);
  pg.push();
  pg.translate(gatorSmoothX, gatorSmoothY + gatorBob);
  if (!gatorFacingRight) pg.scale(-1, 1);
  pg.scale(0.5);
  pg.image(gatorImg, 0, 0);
  pg.pop();
}
