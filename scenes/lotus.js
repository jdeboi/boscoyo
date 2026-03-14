const lotusLeafImgs = [];
const lotusLeafScales = [0.7, 0.9, 0.8];
const lotusFlowerImgs = [];
const lotusFlowerScales = [0.5, 0.5, 0.5, 0.5, 0.5];
const lillyPadImgs = [];
const lillyPadScales = [1, 1, 1, 0.6, 0.6];

const budImgs = [];
const budScales = [0.8, 1, 1];

const lotusPlantsFront = [];
const lotusPlantsBack = [];

function loadLotusImgs() {
  for (let i = 0; i < 3; i++) {
    lotusLeafImgs[i] = loadImage(`../assets/lotus/lotusleaf/${i}.png`);
    budImgs[i] = loadImage(`../assets/lotus/buds/${i}.png`);
  }
  for (let i = 0; i < 5; i++) {
    lotusFlowerImgs[i] = loadImage(`../assets/lotus/lotusflower/${i}.png`);
  }
  for (let i = 0; i < 5; i++) {
    lillyPadImgs[i] = loadImage(`../assets/lotus/lillypad/${i}.png`);
  }
}

function setupLotus() {
  // scale buds
  for (let i = 0; i < budImgs.length; i++) {
    const img = budImgs[i];
    const sc = budScales[i];
    img.resize(img.width * sc, img.height * sc);
  }

  const lotusFlowersBack = [
    { id: 3, index: 3, x: 100, y: 100, isFlipped: false, sc: 0.8 },
  ];
  const lotusFlowers = [
    { id: 0, index: 0, x: 200, y: 400, isFlipped: false, sc: 0.8 },
    { id: 1, index: 1, x: 500, y: 200, isFlipped: false, sc: 2 },
    { id: 2, index: 2, x: 400, y: 340, isFlipped: false, sc: 0.8 },

    {
      id: 4,
      index: 4,
      x: 50,
      y: 420,
      sc: 0.5,
      isFlipped: true,
    },
    {
      id: 4,
      index: 4,
      x: 1090,
      y: 420,
      sc: 0.52,
    },
  ];

  const lillyPadsFront = [
    { id: 0, index: 0, x: 520, y: 600, isFlipped: false, sc: 0.8 },
    { id: 1, index: 2, x: 50, y: 580, isFlipped: false, sc: 0.8 },
    { id: 2, index: 3, x: 850, y: 480, isFlipped: false, sc: 1 },
    { id: 3, index: 4, x: 400, y: 520, isFlipped: false, sc: 0.55 },

    // { index: 3, x: 800, y: 600, isFlipped: false, sc: 1 },
    // { index: 4, x: 500, y: 500, isFlipped: false, sc: 0.5 },
  ];

  const lillyPadsBack = [
    { id: 0, index: 0, x: 50, y: 460, isFlipped: false, sc: 0.45 },
    { id: 1, index: 1, x: 200, y: 400, isFlipped: false, sc: 0.36 },
    { id: 2, index: 2, x: 300, y: 440, isFlipped: false, sc: 0.36 },

    { id: 4, index: 1, x: 550, y: 420, isFlipped: false, sc: 0.45 },
    { id: 5, index: 3, x: 700, y: 480, isFlipped: false, sc: 0.4 },
    { id: 6, index: 0, x: 750, y: 400, isFlipped: false, sc: 0.35 },
    // { id: 7, index: 4, x: 850, y: 480, isFlipped: false, sc: 0.55 },
  ];

  const lotusLeaves = [
    { id: 0, index: 0, x: 30, y: 280, isFlipped: true, sc: 0.5 },
    { id: 1, index: 1, x: 880, y: 220, isFlipped: false, sc: 0.7 },
    { id: 2, index: 2, x: 200, y: 240, isFlipped: true, sc: 0.5 },
  ];

  for (let i = 0; i < lotusFlowers.length; i++) {
    const { id, index, x, y, isFlipped, sc } = lotusFlowers[i];
    const img = lotusFlowerImgs[index];
    const scFl = lotusFlowerScales[index];
    lotusPlantsFront.push(
      new Flower(img, id, x, y, sc * scFl, "flower", isFlipped),
    );
  }

  for (let i = 0; i < lotusFlowersBack.length; i++) {
    const { id, index, x, y, isFlipped, sc } = lotusFlowersBack[i];
    const img = lotusFlowerImgs[index];
    const scFl = lotusFlowerScales[index];
    lotusPlantsBack.push(
      new Flower(img, id, x, y, sc * scFl, "flower", isFlipped),
    );
  }

  for (let i = 0; i < lillyPadsFront.length; i++) {
    const { id, index, x, y, isFlipped, sc } = lillyPadsFront[i];
    const img = lillyPadImgs[index];
    const scFl = lillyPadScales[index];
    lotusPlantsFront.push(
      new LillyPad(img, i, x, y, sc * scFl, "lillypad", isFlipped),
    );
  }
  for (let i = 0; i < lotusLeaves.length; i++) {
    const { id, index, x, y, isFlipped, sc } = lotusLeaves[i];
    const img = lotusLeafImgs[index];
    const scFl = lotusLeafScales[index];
    lotusPlantsBack.push(
      new Flower(img, id, x, y, sc * scFl, "flower", isFlipped),
    );
  }

  for (let i = 0; i < lillyPadsBack.length; i++) {
    const { id, index, x, y, isFlipped, sc } = lillyPadsBack[i];
    const img = lillyPadImgs[index];
    const scFl = lillyPadScales[index];
    lotusPlantsBack.push(
      new LillyPad(img, id, x, y, sc * scFl, "lillypad", isFlipped),
    );
  }

  //   lotusPlantsFront.push(
  //     new FlowerWithBud(
  //       lotusFlowerImgs[3],
  //       budImgs,
  //       100,
  //       width / 2,
  //       350,
  //       1.2,
  //       "flower",
  //       false
  //     )
  //   );
}

function displayLotus() {
  push();
  scale(0.56);
  //   trees[0].display(1600);
  trees[1].display(500);
  pop();
  //   drawWaterBand(height * 0.54, xPosition, { hasOutline: false });

  //   for (const plant of lotusPlantsBack) {
  //     plant.display();
  //     plant.update();
  //   }

  //   drawWaterBand(height * 0.73, xPosition, { hasOutline: false });

  for (const plant of lotusPlantsFront) {
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
  constructor(img, id, x, y, scale, type, isFlipped = false) {
    super(img, id, x, y, scale, type, isFlipped);

    // 🔑 pivot in IMAGE space (before scaling)
    this.pivot = {
      x: img.width * 0.5,
      y: img.height,
    };

    this.swayAmp = 0.15;
    this.swaySpeed = 0.01;
  }
  display() {
    push();

    // world position
    translate(this.x, this.y);

    // scale first so pivot math is clean
    scale(this.scale);
    if (this.isFlipped) {
      scale(-1, 1);
      translate(-this.img.width, 0);
    } else {
    }

    // move origin to pivot
    translate(this.pivot.x, this.pivot.y);

    // rotate around pivot
    rotate(this.rot);

    // move origin back
    translate(-this.pivot.x, -this.pivot.y);

    // draw image
    image(this.img, 0, 0);

    pop();
  }

  update() {
    // gentle wind sway
    this.rot = map(noise(frameCount * 0.01 + this.x), 0, 1, -0.15, 0.15);
  }
}

class LillyPad extends Plant {
  // update different - make them bob on a sine wave
  update() {
    this.y += sin(frameCount * 0.05 + this.x) * 0.2;
  }
}

class LotusLeaf extends Plant {
  // update different - make them bob on a sine wave
  update() {}
}

class FlowerWithBud extends Flower {
  constructor(img, budImgs, id, x, y, scale, type, isFlipped = false) {
    super(img, id, x, y, scale, type, isFlipped);
    this.budImgs = budImgs;
    this.budIndex = 0;
  }

  display() {
    push();
    translate(this.x, this.y);
    scale(this.scale);
    if (this.isFlipped) {
      scale(-1, 1);
      translate(-this.img.width, 0);
    }
    image(this.img, 0, 0);
    image(this.budImgs[this.budIndex], 0, 0);
    fill(255);
    noStroke();
    textSize(24);
    text(this.id, 10, 20);
    pop();
  }

  update() {
    super.update();
    if (frameCount % 60 === 0) {
      this.budIndex = (this.budIndex + 1) % this.budImgs.length;
    }
  }
}
