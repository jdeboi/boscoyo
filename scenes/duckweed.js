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

function displayDuckweed() {
  background(8, 18, 12);

  const repellers = [{ x: mouseX, y: mouseY, radius: 220, strength: 1.5 }];
  if (poseState.active && poseState.bodyCenter) {
    repellers.push({
      x: poseState.bodyCenter.x,
      y: poseState.bodyCenter.y,
      radius: 220,
      strength: 1.5,
    });
  }

  for (const p of duckweedParticles) {
    p.update(repellers);
  }

  fill(52, 120, 48);
  noStroke();
  for (const p of duckweedParticles) {
    rect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
  }

  // draw gator at interaction point (body center if pose active, else mouse)
  const gator = (poseState.active && poseState.bodyCenter)
    ? poseState.bodyCenter
    : { x: mouseX, y: mouseY };

  if (prevGatorX !== null && gator.x !== prevGatorX) {
    gatorFacingRight = gator.x > prevGatorX;
  }
  prevGatorX = gator.x;

  push();
  imageMode(CENTER);
  translate(gator.x, gator.y);
  if (!gatorFacingRight) scale(-1, 1);
  image(gatorImg, 0, 0, 120, 80);
  pop();
}
