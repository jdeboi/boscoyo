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

  display(xPosition, sc = 1) {
    this.pg.push();

    // move to this tree's base point
    this.pg.translate(this.x + xPosition, this.y);

    this.pg.scale(sc);
    this.pg.push();

    // scale the whole tree (and moss)
    this.pg.scale(this.treeImgScale, this.treeImgScale);

    // draw tree at original size so scale() does all the work
    this.pg.image(this.img, 0, 0);
    this.pg.pop();

    const updatePhysics = frameCount % 2 === 0;
    this.mossBushes.forEach((mossBush) => {
      this.pg.push();
      this.pg.translate(mossBush.localX, mossBush.localY);
      mossBush.display();
      this.pg.pop();

      if (updatePhysics) mossBush.update(0.5);
    });

    this.pg.pop();
  }

  getWidth() {
    return this.img.width * this.treeImgScale;
  }
}
