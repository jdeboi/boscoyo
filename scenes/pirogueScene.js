let pirogueFollowerX = 0;
let sk1PirogueX = 0;
let sk1FacingRight = true;
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

    const t = map(baseY, canvasH * 0.4, canvasH * 0.88, 0, 1, true);
    this.t = t;
    this.height = map(t, 0, 1, 60, 320);
    this.stemW = map(t, 0, 1, 1, 5);
    this.colorTOffset = random(-0.4, 0); // per-reed brightness variation to break up overlap

    this.hasCattail = random() > 0.35;
    this.cattailFrac = random(0.55, 0.72);
    this.hasPlume = random() > 0.5; // feathery tops

    // Wide arching leaf blades
    const nLeaves = floor(random(2, 7));
    this.leaves = [];
    for (let i = 0; i < nLeaves; i++) {
      this.leaves.push({
        side: random() > 0.45 ? 1 : -1,
        originFrac: random(0.0, 0.18), // where on stem leaf starts
        archH: random(0.45, 0.92), // how high the arc rises
        archW: random(0.28, 1.0), // how far sideways
        w: map(t, 0, 1, 2, 12) * random(0.7, 1.4), // blade width at base
      });
    }

    // Pre-compute feathery plume fronds (relative to tip, computed at display time)
    this.fronds = [];
    if (this.hasPlume) {
      const nFronds = floor(random(9, 20));
      for (let i = 0; i < nFronds; i++) {
        // Fan upward: angle range centered on straight-up (-HALF_PI)
        const fa = random(-PI * 0.55, PI * 0.55) - HALF_PI;
        const fl = this.height * random(0.1, 0.3);
        this.fronds.push({ angle: fa, len: fl });
      }
    }
  }

  // Quadratic bezier point helper
  _qt(p0, cp, p1, t) {
    return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * cp + t * t * p1;
  }

  display(pg, boatX) {
    const sway = pg.map(
      pg.noise(frameCount * 0.007 + this.noiseOff),
      0,
      1,
      -1,
      1,
    );
    const windBend = pirogueWind * this.height * 0.35;
    const normDist = (this.x - boatX) / 280;
    const boatBend =
      abs(normDist) < 1 ? sin(normDist * PI) * this.height * 0.38 : 0;
    const tilt = windBend + boatBend + sway * 5;

    const tipX = this.x + tilt;
    const tipY = this.baseY - this.height;
    const cpX = this.x + tilt * 0.4;
    const cpY = this.baseY - this.height * 0.55;

    const colorT = constrain(this.t + this.colorTOffset, 0, 1);
    const c = pg.lerpColor(pg.color(90, 110, 90), pg.color(255), colorT);

    pg.push();
    pg.translate(0, -200);

    // --- Leaf blades (behind stem) ---
    pg.noStroke();
    pg.fill(c);
    for (const leaf of this.leaves) {
      const oy = this.baseY - this.height * leaf.originFrac;
      const reach = leaf.archW * this.height * 0.6;
      const rise = leaf.archH * this.height;
      const ltx = this.x + leaf.side * reach + tilt * 0.55;
      const lty = oy - rise;
      const lcpX = this.x + leaf.side * reach * 0.6;
      const lcpY = oy - rise * 0.55;
      const hw = leaf.w * 0.5;

      // Filled blade: left bezier edge to tip, right bezier edge back to base
      pg.beginShape();
      pg.vertex(this.x - hw, oy);
      pg.quadraticVertex(lcpX - hw * 0.3, lcpY, ltx, lty); // left edge → tip
      pg.quadraticVertex(lcpX + hw * 0.3, lcpY, this.x + hw, oy); // tip → right edge
      pg.endShape(CLOSE); // straight line closes the base
    }

    // --- Main stem ---
    pg.stroke(c);
    pg.strokeWeight(this.stemW);
    pg.noFill();
    pg.beginShape();
    pg.vertex(this.x, this.baseY);
    pg.quadraticVertex(cpX, cpY, tipX, tipY);
    pg.endShape();

    // --- Cattail head (prominent cylindrical seed pod) ---
    if (this.hasCattail) {
      const f = this.cattailFrac;
      const hx = this._qt(this.x, cpX, tipX, f);
      const hy = this._qt(this.baseY, cpY, tipY, f);
      // Align to stem tangent
      const f2 = min(f + 0.05, 1),
        f1 = max(f - 0.05, 0);
      const tx =
        this._qt(this.x, cpX, tipX, f2) - this._qt(this.x, cpX, tipX, f1);
      const ty =
        this._qt(this.baseY, cpY, tipY, f2) -
        this._qt(this.baseY, cpY, tipY, f1);

      pg.noStroke();
      pg.fill(c);
      pg.push();
      pg.translate(hx, hy);
      pg.rotate(atan2(tx, -ty));
      pg.ellipse(0, 0, this.stemW * 4, this.height * 0.22);
      pg.pop();
    }

    // --- Feathery plume at tip ---
    if (this.hasPlume) {
      const stemTilt = atan2(tilt, this.height); // angle stem has rotated from vertical
      pg.stroke(c);
      pg.strokeWeight(max(0.4, this.stemW * 0.3));
      pg.noFill();
      for (const frond of this.fronds) {
        const a = frond.angle + stemTilt;
        const cpx = tipX + cos(a) * frond.len * 0.4;
        const cpy = tipY + sin(a) * frond.len * 0.4;
        pg.beginShape();
        pg.vertex(tipX, tipY);
        pg.quadraticVertex(
          cpx,
          cpy,
          tipX + cos(a) * frond.len,
          tipY + sin(a) * frond.len,
        );
        pg.endShape();
      }
    }

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

  const NUM_ROWS = 5;
  for (let row = 0; row < NUM_ROWS; row++) {
    const yFrac = map(row, 0, NUM_ROWS - 1, 0.6, 0.88);
    const baseY = H * yFrac;
    // const count = floor(
    //   map(abs(row - (NUM_ROWS - 1) * 0.5), 0, (NUM_ROWS - 1) * 0.5, 10, 5),
    // );
    const count = 10;

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
function _updatePirogue(pg) {
  const target =
    poseState.bodies.length > 0
      ? poseState.bodies[0].bodyCenter
      : { x: mouseX, y: mouseY };

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

  pirogueFollowerY = constrain(
    pirogueFollowerY,
    pg.height * 0.5,
    pg.height * 0.92,
  );
  const img = pirogue.imgs[pirogue.imgIndex];
  if (img) {
    const boatScale = pg.map(
      pirogueFollowerY,
      pg.height * 0.5,
      pg.height,
      0.5,
      1.0,
    );
    const hw = img.width * boatScale * 0.5;
    pirogueFollowerX = constrain(pirogueFollowerX, hw, pg.width - hw);
  }

  if (pg.abs(pirogueFollowerX - prevX) > 0.1) {
    pirogueFollowerFacingRight = pirogueFollowerX > prevX;
  }

  const windTarget = pg.map(pirogueFollowerX, 0, pg.width, -0.2, 0.2);
  pirogueWind = pg.lerp(pirogueWind, windTarget, 0.04);

  pirogue.update();
}

function _drawReeds(pg) {
  pg.push();
  for (const r of pirogueReedsBack) r.display(pg, pirogueFollowerX);
  for (const r of pirogueReedsFront) r.display(pg, pirogueFollowerX);
  pg.pop();
}

function _drawBoatOld(pg) {
  pg.push();
  pg.imageMode(CENTER);
  pg.translate(pirogueFollowerX, pirogueFollowerY);
  if (!pirogueFollowerFacingRight) pg.scale(-1, 1);
  const boatScale = pg.map(
    pirogueFollowerY,
    pg.height * 0.5,
    pg.height,
    0.5,
    1.5,
  );
  pg.scale(boatScale);
  if (pirogue.imgs[pirogue.imgIndex])
    pg.image(pirogue.imgs[pirogue.imgIndex], 0, 0);
  pg.pop();
}

function displayPirogueReeds(pg) {
  pg.background(0);
  _updatePirogue(pg);
  _drawReeds(pg);
}

function displayPirogueBoat(pg) {
  pg.background(0);
  _updatePirogue(pg);
  _drawBoat(pg);
}

function displayPirogueBottom(pg) {
  const bodyX = getPoseX();
  const img = pirogue.imgs[pirogue.imgIndex];
  const SC = 1;
  const halfW = img ? (img.width * SC) / 2 : 0;

  const prevX = sk1PirogueX;
  sk1PirogueX = pg.constrain(
    pg.lerp(sk1PirogueX, bodyX, 0.04),
    halfW,
    pg.width - halfW,
  );
  if (pg.abs(sk1PirogueX - prevX) > 0.1) {
    sk1FacingRight = sk1PirogueX > prevX;
  }

  pirogue.update();

  pg.push();
  pg.imageMode(pg.CENTER);
  pg.translate(sk1PirogueX, pg.height - pirogue.getHeight(SC) / 2 - 10);
  if (!sk1FacingRight) pg.scale(-1, 1);
  pg.scale(SC);
  if (img) pg.image(img, 0, 0);
  pg.pop();
}

function displayPirogueScene(pg) {
  pg.background(0);
  _updatePirogue(pg);
  _drawReeds(pg);
  displayPirogueBottom(pg);
}
