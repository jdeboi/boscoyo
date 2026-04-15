let cypressId = 0;

class Cypress {
  constructor(x, img, treeScale, mossLocations, pg = scene2D) {
    this.id = cypressId++;
    this.pg = pg;
    this.img = img;
    this.x = x;
    this.startX = x;
    this.y = 0;
    this.treeImgScale = treeScale;
    // ----- Moss -----
    this.mossBushes = [];
    this.mossLocations = mossLocations;

    this.initMoss(mossLocations);
  }

  reset() {
    this.x = this.startX;
    this.initMoss(this.mossLocations);
  }

  initMoss(mossLocations) {
    this.mossBushes = [];
    for (const loc of mossLocations) {
      this.mossBushes.push(
        new MossBush(loc.x, loc.y, loc.numSegments, loc.mossScale, this.pg),
      );
    }
  }

  // x, y: canvas coordinates of the tree's top-left corner
  // sc: additional scale on top of treeImgScale
  display(x, y = this.y, sc = 1) {
    if (y === undefined || y === null) y = this.y;
    this.pg.push();
    this.pg.translate(x, y);
    this.pg.scale(sc);

    this.pg.push();
    this.pg.scale(this.treeImgScale, this.treeImgScale);
    this.pg.image(this.img, 0, 0);
    this.pg.pop();

    const updatePhysics = frameCount % 2 === 0;
    this.mossBushes.forEach((mossBush) => {
      this.pg.push();
      mossBush.display();
      this.pg.pop();
      if (updatePhysics) mossBush.update(0.5);
    });

    this.pg.pop();
  }

  getWidth(sc = 1) {
    return this.img.width * this.treeImgScale * sc;
  }
}
