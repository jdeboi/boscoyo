const lotusLeaves = [];
const lotusFlowers = [];
const lillyPads = [];
const lotusPlants = [];

// ✅ tweak these two numbers to taste
const PERSPECTIVE_Y_NEAR = () => height * 0.75; // closer/bigger
const PERSPECTIVE_Y_FAR = () => height * 0.2; // farther/smaller
const SCALE_NEAR = 1.25;
const SCALE_FAR = 0.55;

function perspectiveScaleFromY(y) {
  // y near -> SCALE_NEAR, y far -> SCALE_FAR
  const t = constrain(
    map(y, PERSPECTIVE_Y_FAR(), PERSPECTIVE_Y_NEAR(), 0, 1),
    0,
    1
  );
  return lerp(SCALE_FAR, SCALE_NEAR, t);
}

function loadLotusImgs() {
  for (let i = 0; i < 3; i++) {
    lotusLeaves[i] = loadImage(`../shared/assets/lotus/lotusleaf/${i}.png`);
  }
  for (let i = 0; i < 5; i++) {
    lotusFlowers[i] = loadImage(`../shared/assets/lotus/lotusflower/${i}.png`);
  }
  for (let i = 0; i < 5; i++) {
    lillyPads[i] = loadImage(`../shared/assets/lotus/lillypad/${i}.png`);
  }
}

function setupLotus() {
  for (let i = 0; i < lotusLeaves.length; i++) {
    const locs = [
      { x: width * 0.6, y: height * 0.3, sc: 0.7, isFlipped: false },
      { x: width / 8, y: height * 0.3, sc: 0.9, isFlipped: true },
      { x: (width * 3) / 4, y: height / 2 + 100, sc: 0.8, isFlipped: true },
    ];

    const { x, y, sc, isFlipped } = locs[i];
    const scDist = perspectiveScaleFromY(y);
    lotusPlants.push(
      new LillyPad(lotusLeaves[i], i, x, y, scDist, "leaf", isFlipped)
    );
  }
  for (let i = 0; i < lotusFlowers.length; i++) {
    const x = random(width);
    const y = random(300);
    const scale = random(0.5, 1.5);
    const scDist = perspectiveScaleFromY(y);
    lotusPlants.push(new Flower(lotusFlowers[i], i, x, y, scDist, "flower"));
  }

  for (let i = 0; i < 10; i++) {
    const scales = [0.9, 1, 0.8, 0.5, 0.6];

    for (let z = 0; z < 3; z++) {
      // 0 = far away
      const plantIndex = floor(random(lillyPads.length));
      const x = map(i, 0, 10, 100, width - 100) + random(-50, 50);
      const y = map(z, 0, 2, height / 2 - 300, height - 300);
      const zSc = map(z, 0, 2, 0.5, 1.2);
      const randSc = random(0.9, 1);
      const scDist = scales[plantIndex] * zSc * randSc;
      lotusPlants.push(
        new LillyPad(lillyPads[plantIndex], i, x, y, scDist, "lillypad")
      );
    }
  }
}

function displayLotus() {
  for (const plant of lotusPlants) {
    plant.display();
    plant.update();
  }
}

class Plant {
  constructor(img, id, x, y, scale, type, isFlipped = false) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.type = type;
    this.rot = 0;
    this.id = id;
    this.isFlipped = isFlipped;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.rot);
    scale(this.scale);
    if (this.isFlipped) {
      scale(-1, 1);
      translate(-this.img.width, 0);
    }
    image(this.img, 0, 0);
    fill(255);
    noStroke();
    textSize(24);
    text(this.id, 10, 20);
    pop();
  }

  update() {
    // use noise to create gentle swaying motion
    this.rot = map(noise(frameCount * 0.01 + this.x), 0, 1, -0.1, 0.1);
  }
}

class Flower extends Plant {
  // new display method for flower
  // make it rotate from the base of the image
  display() {
    push();
    translate(this.x, this.y);
    rotate(this.rot);
    scale(this.scale);
    // translate to base of flower
    translate(0, this.img.height * this.scale);
    image(this.img, 0, 0);
    pop();
  }

  update() {}
}

class LillyPad extends Plant {
  // update different - make them bob on a sine wave
  update() {
    this.y += sin(frameCount * 0.05 + this.x) * 0.5;
    // this.x += sin(frameCount * 0.03 + this.x) * 0.1;
  }
}
