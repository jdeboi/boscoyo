const duckweedParticles = [];
let gatorFacingRight = true;
let prevGatorX = null;

class DuckweedParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.ox = x;
    this.oy = y;
    this.vx = 0;
    this.vy = 0;
    this.w = random(8, 18);
    this.h = this.w * random(0.5, 0.8);
  }

  update(repellers) {
    const damping = 0.78;
    const spring = 0.008;

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

  const repellers = [{ x: mouseX, y: mouseY, radius: 220, strength: 1.5 }];
  for (const body of poseState.bodies) {
    repellers.push({
      x: body.bodyCenter.x,
      y: body.bodyCenter.y,
      radius: 220,
      strength: 1.5,
    });
  }

  for (const p of duckweedParticles) {
    p.update(repellers);
  }

  pg.fill(52, 120, 48);
  pg.noStroke();
  for (const p of duckweedParticles) {
    pg.rect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
  }

  // draw one gator per interaction point
  const gatorPoints =
    poseState.bodies.length > 0
      ? poseState.bodies.map((b) => b.bodyCenter)
      : [{ x: mouseX, y: mouseY }];

  if (prevGatorX !== null && gatorPoints[0].x !== prevGatorX) {
    gatorFacingRight = gatorPoints[0].x > prevGatorX;
  }
  prevGatorX = gatorPoints[0].x;

  pg.imageMode(pg.CENTER);
  for (const pt of gatorPoints) {
    pg.push();
    pg.translate(pt.x, pt.y);
    if (!gatorFacingRight) pg.scale(-1, 1);
    pg.image(gatorImg, 0, 0, 120, 80);
    pg.pop();
  }
}
