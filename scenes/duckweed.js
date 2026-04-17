const duckweedParticles = [];
let lastGatorPoseTime = 0;
class DuckweedParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.ox = x;
    this.oy = y;
    this.vx = 0;
    this.vy = 0;
    this.rot = random(TWO_PI);
    this.sc = random(0.2, 0.5);
    this.imgId = floor(random(duckweedImgs.length));
    this.img = null; // set after construction in setupDuckweed
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

function getColor() {
  const colors = [color(127, 141, 127), color(255)];
  const col = lerpColor(colors[0], colors[1], random(0, 1));
  return color(red(col), green(col), blue(col), 255);
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
      const p = new DuckweedParticle(x, y);
      const src = duckweedImgs[p.imgId];
      const t = random(1);
      const col = getColor();
      const r = red(col);
      const g = green(col);
      const b = blue(col);
      const g2 = createGraphics(src.width, src.height);
      g2.tint(r, g, b);
      g2.image(src, 0, 0);
      p.img = g2;
      duckweedParticles.push(p);
    }
  }
}

function _updateGator(pg) {
  let targetX, targetY;
  if (getIsAutoMove()) {
    const auto = gator.autoTarget(pg);
    targetX = auto.x;
    targetY = auto.y;
  } else {
    const rawTarget = { x: getPoseX(), y: getPoseY() };
    const margin = 80;
    targetX = constrain(rawTarget.x, margin, pg.width - margin);
    targetY = constrain(rawTarget.y, margin, pg.height - margin);
  }

  gator.update(targetX, targetY);
}

function displayDuckweedParticles(pg = scene2D) {
  pg.background(0);

  _updateGator(pg);

  // Repel particles from gator body
  const rc = gator.x !== null ? gator.repelCenter() : { x: mouseX, y: mouseY };
  const repellers = [{ x: rc.x, y: rc.y, radius: 500, strength: 3 }];

  for (const p of duckweedParticles) {
    p.update(repellers);
  }

  pg.noStroke();
  for (const p of duckweedParticles) {
    pg.push();
    pg.translate(p.x, p.y);
    pg.rotate(p.rot);
    pg.scale(p.sc);
    pg.image(p.img, 0, 0);
    pg.pop();
  }
}

function displayGatorOnly(pg = scene2D) {
  pg.background(0);
  _updateGator(pg);
  gator.display(pg);
}

function displayDuckweedSplit(pg = scene2D) {
  pg.background(0);

  const t = millis() * 0.001;
  const targetX = pg.width * 0.5;
  const targetY = pg.height * 0.5 + sin(t * 0.7) * pg.height * 0.28;
  gator.update(targetX, targetY);

  const rc = gator.repelCenter();
  const repellers = [{ x: rc.x, y: rc.y, radius: 500, strength: 2 }];
  for (const p of duckweedParticles) p.update(repellers);

  pg.noStroke();
  for (const p of duckweedParticles) {
    pg.push();
    pg.translate(p.x, p.y);
    pg.rotate(p.rot);
    pg.scale(p.sc);
    pg.image(p.img, 0, 0);
    pg.pop();
  }

  gator.display(pg);
}

function displayDuckweed(pg = scene2D) {
  displayDuckweedParticles(pg);
  gator.display(pg);
}
