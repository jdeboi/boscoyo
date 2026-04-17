let lotusWind = 0; // smoothed wind angle, updated each frame

const lotusFlowerImgs = [];
const lotusFlowerScales = [0.5, 0.5, 0.5, 0.5, 0.5];
const lillyPadImgs = [];
const lillyPadScales = [0.5, 0.35, 0.5, 0.5, 0.4];

const budImgs = [];
const budScales = [0.8, 1, 1];
const budOffsets = [
  { x: 30, y: -210 }, // stage 0: bud0 113×276
  { x: -15, y: -190 }, // stage 1: bud1 171×195
  { x: -65, y: -200 }, // stage 2: bud2 296×277
];

const podImgs = [];
const podScales = [1, 0.9];
const podOffsets = [
  { x: 20, y: -130 }, // stage 0: pod0 106×183 — tune to align with stem tip
  { x: -120, y: -90 }, // stage 1: pod1 232×174 — tune to align with stem tip
];

// Render order: layer 0 → lily pads → layer 1 → layer 2
const lotusLayers = [[], [], []];
const lotusPads = [];
const lotusOverlayPads = [];

// Perspective: y maps linearly to a scale multiplier.
// Tune Y_FAR/Y_NEAR to match your canvas, and SCALE_FAR/SCALE_NEAR for the depth feel.
const PERSP_Y_FAR = 250; // highest plant y on canvas (furthest back)
const PERSP_Y_NEAR = 400; // lowest plant y on canvas  (closest)
const PERSP_SCALE_FAR = 0.25;
const PERSP_SCALE_NEAR = 0.9;

const duckweedImgs = [];

// Convert a logical (x, z) coordinate into canvas position + scale.
// z: 0 = furthest back, 100 = closest front
// Returns { x, y, scale } ready to pass to a flower constructor.
function get2DPosition(x, z) {
  const y = map(z, 0, 100, PERSP_Y_FAR, PERSP_Y_NEAR);
  const scale = map(
    y,
    PERSP_Y_FAR,
    PERSP_Y_NEAR,
    PERSP_SCALE_FAR,
    PERSP_SCALE_NEAR,
  );
  const layer = z < 33 ? 0 : z < 67 ? 1 : 2;
  return { x, y, scale, layer };
}

function loadLotusImgs() {
  for (let i = 0; i < 3; i++) {
    budImgs[i] = loadImage(`./assets/lotus/buds/${i}_invert.png`);
  }
  for (let i = 0; i < 2; i++) {
    podImgs[i] = loadImage(`./assets/lotus/buds/pod${i}.png`);
  }
  for (let i = 0; i < 5; i++) {
    lotusFlowerImgs[i] = loadImage(`./assets/lotus/lotusflower/${i}.png`);
  }
  for (let i = 0; i < 5; i++) {
    lillyPadImgs[i] = loadImage(`./assets/lotus/lillypad/${i}.png`);
  }
  for (let i = 5; i < 11; i++) {
    duckweedImgs[i - 5] = loadImage(`./assets/duckweed/${i}.png`);
  }
}

function setupLotus() {
  // scale buds
  for (let i = 0; i < budImgs.length; i++) {
    budImgs[i].resize(
      budImgs[i].width * budScales[i],
      budImgs[i].height * budScales[i],
    );
  }
  // scale pods
  for (let i = 0; i < podImgs.length; i++) {
    podImgs[i].resize(
      podImgs[i].width * podScales[i],
      podImgs[i].height * podScales[i],
    );
  }
  // scale lily pads
  for (let i = 0; i < lillyPadImgs.length; i++) {
    lillyPadImgs[i].resize(
      lillyPadImgs[i].width * lillyPadScales[i],
      lillyPadImgs[i].height * lillyPadScales[i],
    );
  }

  // Negative timeOffset pre-ages a flower so it starts the scene mid-cycle.
  // Cycle order: stem_grow(3000) → bloom(13500) → hold(10000) → pause(5000)
  //   -17000 → starts in HOLD (fully open)
  //   -9500  → starts showing bud 1 at full size
  //
  // type: 'lotus' | 'pod'
  // x, z: 0–100 logical space; z=0 far back, z=100 close front
  //       z < 33 → layer 0 (behind pads), 33–66 → layer 1, 67+ → layer 2
  const flowerDefs = [
    {
      type: "lotus",
      x: 30,
      z: 100,
      timeOffset: -17000,
      isFlipped: true,
      stemLen: 90,
    },
    { type: "pod", x: 55, z: 20, timeOffset: -4200, isFlipped: true },
    {
      type: "lotus",
      x: 75,
      z: 50,
      timeOffset: 2000,
      isFlipped: false,
      stemLen: 30,
    },
    { type: "pod", x: 100, z: 30, timeOffset: -370, stemLen: 40 },
  ];

  for (const {
    type,
    x,
    z,
    isFlipped = false,
    timeOffset = 0,
    stemLen = 50,
  } of flowerDefs) {
    const { y: tipY, scale, layer } = get2DPosition(x, z);
    // Fix the stem BASE at the same canvas position for any stemLen at this z.
    // Tip floats upward as stemLen increases.
    const stemH = map(stemLen, 0, 100, 200, 650);
    const baseY = tipY + LotusFlower.STEM_H * scale; // base at default stemLen=50
    const y = baseY - stemH * scale;
    const xPos = map(x, 0, 100, 100, (scene2D.width || 1200) - 200);
    const plant =
      type === "pod"
        ? new LotusPod(xPos, y, scale, timeOffset, isFlipped, stemLen)
        : new LotusFlower(xPos, y, scale, timeOffset, isFlipped, stemLen);
    lotusLayers[layer].push(plant);
  }

  // Lily pads — x: 0–100 logical, z: 0–100 (far→near)
  // Pads sit lower on screen than flowers, so z maps to y 350–620.
  const lillyPadDefs = [
    { index: 0, x: 0, z: 100 },
    { index: 1, x: 55, z: 90 },
    { index: 4, x: 100, z: 85, isFlipped: true },

    { index: 4, x: 0, z: 50, sc: 0.9 },
    { index: 2, x: 28, z: 40, isFlipped: true },
    { index: 0, x: 60, z: 50, isFlipped: true },
    { index: 3, x: 90, z: 30 },

    // { index: 1, x: 0, z: 0, isFlipped: true },

    // { index: 3, x: 10, z: 20 },
    // { index: 0, x: 30, z: 0 },
    // { index: 4, x: 50, z: 10 },
    // { index: 1, x: 65, z: 2 },
    // { index: 2, x: 80, z: 10 },
    // { index: 0, x: 100, z: 0 },
  ];

  for (let i = 0; i < lillyPadDefs.length; i++) {
    const { index, x, z, sc = 1, isFlipped = false } = lillyPadDefs[i];
    // Use the same perspective as flowers so pads sit at the flower stem base
    const { y: stemTipY, scale } = get2DPosition(x, z * 0.6); // pad z maps to 0–80 so they don't go too far back and under the water
    const y = stemTipY + LotusFlower.STEM_H * scale;
    const perspS = sc * scale * 2.4; // pads are wider than flower stems need boosting
    const xPos = map(
      x,
      0,
      100,
      30,
      (scene2D.width || 1200) - lillyPadImgs[index].width * perspS - 30,
    );
    const pad = new LillyPad(
      lillyPadImgs[index],
      i,
      xPos,
      y,
      perspS,
      "lillypad",
      isFlipped,
    );
    lotusPads.push(pad);
    if (z >= 85) lotusOverlayPads.push(pad);
  }

  // Sort each group by y so further-back items (smaller y) are drawn first
  lotusLayers.forEach((layer) => layer.sort((a, b) => a.y - b.y));
  lotusPads.sort((a, b) => a.y - b.y);

  // Three blooming front-row flowers for sketchSplit
  const splitDefs = [
    { x: 20, z: 90, timeOffset: -17000, isFlipped: false, stemLen: 80 },
    { x: 50, z: 100, timeOffset: -17000, isFlipped: true, stemLen: 90 },
    { x: 80, z: 85, timeOffset: -17000, isFlipped: false, stemLen: 75 },
  ];
  for (const { x, z, timeOffset, isFlipped, stemLen } of splitDefs) {
    const { y: tipY, scale } = get2DPosition(x, z);
    const stemH = map(stemLen, 0, 100, 200, 650);
    const baseY = tipY + LotusFlower.STEM_H * scale;
    const y = baseY - stemH * scale;
    const xPos = map(x, 0, 100, 100, (scene2D.width || 1200) - 200);
    lotusSplitFlowers.push(
      new LotusFlower(xPos, y, scale, timeOffset, isFlipped, stemLen),
    );
  }
  lotusSplitFlowers.sort((a, b) => a.y - b.y);
}

const lotusSplitFlowers = [];

function displayLotusSplit(pg = scene2D) {
  const ix = getPoseX();

  const windTarget = pg.map(ix, 0, pg.width, -0.2, 0.2);
  lotusWind = pg.lerp(lotusWind, windTarget, 0.05);

  pg.background(0);
  drawWaterBand(300, 0, pg);

  for (const p of lotusPads) {
    p.display(pg);
    p.update();
  }
  for (const p of lotusSplitFlowers) {
    p.display(pg);
    p.update();
  }
}

function displayLotusOverlay(pg = scene2D) {
  const ix = getPoseX();
  const windTarget = pg.map(ix, 0, pg.width, -0.2, 0.2);
  lotusWind = pg.lerp(lotusWind, windTarget, 0.05);

  pg.background(0);
  drawWaterBand(300, 0, pg);
  for (const p of lotusOverlayPads) {
    p.display(pg);
    p.update();
  }
  displayFrontLotus(pg);
}

function displayFrontLotus(pg = scene2D) {
  const arr = lotusLayers[2];
  for (const p of arr) {
    p.display(pg);
    p.update();
  }
}

function displayLotus(pg = scene2D) {
  displayLotusNoFront(pg);
  displayFrontLotus(pg);
}

function displayLotusNoFront(pg = scene2D) {
  const ix = getPoseX();
  const windTarget = pg.map(ix, 0, pg.width, -0.2, 0.2);
  lotusWind = pg.lerp(lotusWind, windTarget, 0.05);

  // pg.push();
  // fullBaldTree.display(100, -100, 0.6);
  // pg.pop();

  drawWaterBand(400, 0, pg);

  const tick = (arr) => {
    for (const p of arr) {
      p.display(pg);
      p.update();
    }
  };
  tick(lotusLayers[0]);
  tick(lotusPads);
  tick(lotusLayers[1]);
  // tick(lotusLayers[2]);
}

class Plant {
  constructor(img, id, x, y, scale, type, isFlipped = false, pg = scene2D) {
    this.img = img;
    this.pg = pg;
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.type = type;
    this.rot = 0;
    this.id = id;
    this.isFlipped = isFlipped;
  }

  display() {
    this.pg.push();
    this.pg.translate(this.x, this.y);
    this.pg.rotate(this.rot);
    this.pg.scale(this.scale);
    if (this.isFlipped) {
      this.pg.scale(-1, 1);
      this.pg.translate(-this.img.width, 0);
    }
    this.pg.image(this.img, 0, 0);
    this.pg.pop();
  }

  update() {
    const sway = map(noise(frameCount * 0.01 + this.x), 0, 1, -0.05, 0.05);
    this.rot = lotusWind + sway;
  }
}

class Flower extends Plant {
  constructor(img, id, x, y, scale, type, isFlipped = false, pg = scene2D) {
    super(img, id, x, y, scale, type, isFlipped, pg);

    this.pivot = {
      x: img.width * 0.5,
      y: img.height,
    };
  }

  display() {
    this.pg.push();
    this.pg.translate(this.x, this.y);
    this.pg.scale(this.scale);
    if (this.isFlipped) {
      this.pg.scale(-1, 1);
      this.pg.translate(-this.img.width, 0);
    }
    this.pg.translate(this.pivot.x, this.pivot.y);
    this.pg.rotate(this.rot);
    this.pg.translate(-this.pivot.x, -this.pivot.y);
    this.pg.image(this.img, 0, 0);
    this.pg.pop();
  }

  update() {
    const sway = this.pg.map(
      this.pg.noise(frameCount * 0.01 + this.x),
      0,
      1,
      -0.06,
      0.06,
    );
    this.rot = lotusWind + sway;
  }
}

class LillyPad extends Plant {
  // update different - make them bob on a sine wave
  update() {
    this.y += this.pg.sin(frameCount * 0.05 + this.x) * 0.2;
  }
}

class LotusFlower extends Plant {
  // Lifecycle timings (ms)
  static BUD_GROW = 1500; // each bud scales 0→full
  static BUD_HOLD = 3000; // each bud stays at full size before next
  static HOLD = 10000; // hold at fully open after all buds
  static PAUSE = 5000; // invisible, pick new x
  static STEM_GROW = 3000; // stem grows before bud appears

  // Drawn-stem geometry (local px, before scale)
  static STEM_H = 463; // total stem height
  static STEM_CX = 85; // horizontal center (matches bud layout)
  static STEM_CURVE = 14; // bezier control-point offset for gentle S

  constructor(
    x,
    y,
    scale,
    timeOffset = 0,
    isFlipped = false,
    stemLen = 50,
    pg = scene2D,
  ) {
    super(budImgs[0], null, x, y, scale, "lotusflower", isFlipped, pg);
    this._imgs = budImgs;
    this._offsets = budOffsets;
    this.timeOffset = timeOffset;
    this.birthTime = millis();
    this.displayX = x;
    this._prevPhase = null;
    this._stemH = map(stemLen, 0, 100, 200, 650);
  }

  _getState() {
    const { BUD_GROW, BUD_HOLD, HOLD, PAUSE, STEM_GROW } = LotusFlower;
    const BUD_CYCLE = BUD_GROW + BUD_HOLD;
    const BLOOM = this._imgs.length * BUD_CYCLE;
    // Cycle order: stem_grow → bloom → hold → pause
    const CYCLE = STEM_GROW + BLOOM + HOLD + PAUSE;

    const age = millis() - this.birthTime - this.timeOffset;
    if (age < 0) return { phase: "pre", budIdx: -1, budScale: 0, stemT: 0 };

    const c = age % CYCLE;

    if (c < STEM_GROW) {
      return {
        phase: "stem_grow",
        budIdx: -1,
        budScale: 0,
        stemT: c / STEM_GROW,
      };
    }
    const c1 = c - STEM_GROW;
    if (c1 < BLOOM) {
      const budIdx = min(floor(c1 / BUD_CYCLE), this._imgs.length - 1);
      const budAge = c1 % BUD_CYCLE;
      const budScale =
        budIdx === 0 && budAge < BUD_GROW ? budAge / BUD_GROW : 1;
      return { phase: "bloom", budIdx, budScale, stemT: 1 };
    }
    const c2 = c1 - BLOOM;
    if (c2 < HOLD) {
      return {
        phase: "hold",
        budIdx: this._imgs.length - 1,
        budScale: 1,
        stemT: 1,
      };
    }
    const c3 = c2 - HOLD;
    if (c3 < PAUSE) {
      return { phase: "pause", budIdx: -1, budScale: 0, stemT: 0 };
    }
    return { phase: "pre", budIdx: -1, budScale: 0, stemT: 0 };
  }

  // Draw a curved stem, revealing from the bottom up as stemT goes 0→1.
  _drawStem(stemT, alpha) {
    const STEM_H = this._stemH;
    const { STEM_CX, STEM_CURVE } = LotusFlower;
    const N = 40;
    const endN = floor(N * stemT);
    if (endN < 1) return;

    this.pg.push();
    this.pg.noFill();
    this.pg.strokeWeight(20);
    this.pg.stroke(0, alpha); // black centre
    this._bezierStrip(STEM_H, STEM_CX, STEM_CURVE, endN, N);
    this.pg.strokeWeight(9);
    this.pg.stroke(255, alpha); // white outline
    this._bezierStrip(STEM_H, STEM_CX, STEM_CURVE, endN, N);
    this.pg.pop();
  }

  _bezierStrip(stemH, cx, curve, endN, N) {
    this.pg.beginShape();
    for (let i = 0; i <= endN; i++) {
      const t = i / N; // 0 = bottom, 1 = top (flower end)
      // quadratic bezier: (cx,stemH) → (cx+curve, stemH/2) → (cx, 0)
      const x =
        (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * (cx + curve) + t * t * cx;
      const y =
        (1 - t) * (1 - t) * stemH + 2 * (1 - t) * t * (stemH * 0.5) + t * t * 0;
      this.pg.vertex(x, y);
    }
    this.pg.endShape();
  }

  display() {
    const state = this._getState();
    if (state.phase === "pause" || state.phase === "pre") return;

    const STEM_H = this._stemH;
    const { STEM_CX } = LotusFlower;

    this.pg.push();
    this.pg.translate(this.displayX, this.y);
    this.pg.scale(this.scale);
    if (this.isFlipped) this.pg.scale(-1, 1);

    // Rotated stem + bud
    this.pg.push();
    // Rotate around the base of the stem.
    // Negate rot for flipped flowers so wind sways them the same visual direction.
    this.pg.translate(STEM_CX, STEM_H);
    this.pg.rotate(this.isFlipped ? -this.rot : this.rot);
    this.pg.translate(-STEM_CX, -STEM_H);

    this._drawStem(state.stemT, 255);

    if (state.budIdx >= 0 && state.budScale > 0) {
      const budImg = this._imgs[state.budIdx];
      const offset = this._offsets[state.budIdx];
      // Scale from the stem tip (STEM_CX, 0) so the image always grows
      // out of the correct point regardless of image dimensions or offsets.
      this.pg.translate(STEM_CX, 0);
      this.pg.scale(state.budScale);
      this.pg.translate(-STEM_CX, 0);
      this.pg.image(budImg, offset.x, offset.y);
    }
    this.pg.pop();

    this.displayWater();
    this.pg.pop();
  }

  displayWater() {
    const STEM_H = this._stemH;
    const { STEM_CX } = LotusFlower;

    const waterRise = this.pg.map(
      this.pg.sin(frameCount * 0.05 + this.displayX),
      -1,
      1,
      0,
      20,
    );
    this.pg.noStroke();
    this.pg.fill(0);
    this.pg.rectMode(this.pg.CORNERS);
    const stemW = 34 * this.scale; // match strokeWeight of stem
    this.pg.rect(
      STEM_CX - stemW / 2,
      STEM_H - waterRise,
      STEM_CX + stemW / 2,
      STEM_H + 10,
    );
    this.pg.rectMode(this.pg.CORNER);
  }

  update() {
    const state = this._getState();

    this._prevPhase = state.phase;

    const sway = this.pg.map(
      this.pg.noise(frameCount * 0.01 + this.displayX),
      0,
      1,
      -0.05,
      0.05,
    );
    this.rot = lotusWind + sway;
  }
}

class LotusPod extends LotusFlower {
  constructor(
    x,
    y,
    scale,
    timeOffset = 0,
    isFlipped = false,
    stemLen = 50,
    pg = scene2D,
  ) {
    super(x, y, scale, timeOffset, isFlipped, stemLen, pg);
    this._imgs = podImgs;
    this._offsets = podOffsets;
  }
}
