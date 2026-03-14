let cypressId = 0;

class Cypress {
  constructor(x, img, treeScale, mossLocations) {
    this.id = cypressId++;

    this.img = img;
    this.x = x;
    this.startX = x;
    this.y = 0;
    this.treeScale = treeScale;
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
        new MossBush(loc.x, loc.y, loc.numSegments, loc.mossScale)
      );
    }
  }

  display(xPosition) {
    push();

    // move to this tree's base point
    translate(this.x + xPosition, this.y);

    // scale the whole tree (and moss)
    scale(this.treeScale, this.treeScale);

    // draw tree at original size so scale() does all the work
    image(this.img, 0, 0);

    this.mossBushes.forEach((mossBush) => {
      push();
      translate(mossBush.localX, mossBush.localY);
      mossBush.display();
      pop();

      mossBush.update(0.5);
    });

    pop();
  }
}
