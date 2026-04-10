const BIRD_FRAME_MS = 1000 / 8; // 8fps animation

const bird = {
  imgs: [],
  flyImgs: [],
  imgIndex: 0,
  flyImgIndex: 0,
  isPaused: false,
  pauseTime: 2000, // ms
  lastPauseTime: 0, // ms
  lastFrameTime: 0, // ms
  x: 0,
  y: 0,

  display: function (pg) {
    if (this.imgs[this.imgIndex]) {
      pg.image(this.imgs[this.imgIndex], this.x, this.y);
    }
  },

  displayFly: function (pg, dir = 1) {
    pg.push();
    pg.scale(0.5);
    if (dir < 0) {
      this.displayBackwardFly(pg);
    } else {
      if (this.flyImgs[this.flyImgIndex]) {
        pg.image(this.flyImgs[this.flyImgIndex], this.x, this.y);
      }
    }
    pg.pop();
  },

  displayBackwardFly: function (pg) {
    pg.push();
    pg.scale(-1, 1);
    pg.translate(-this.x - this.flyImgs[this.flyImgIndex].width, this.y);
    if (this.flyImgs[this.flyImgIndex]) {
      pg.image(this.flyImgs[this.flyImgIndex], 0, 0);
    }
    pg.pop();
  },

  displayBackward: function (pg) {
    pg.push();
    pg.scale(-1, 1);
    pg.translate(-this.x - this.imgs[this.imgIndex].width, this.y);
    if (this.imgs[this.imgIndex]) {
      pg.image(this.imgs[this.imgIndex], 0, 0);
    }
    pg.pop();
  },

  update: function (dir = 1) {
    // wrap around screen
    this.move(dir);

    if (this.x < 0) {
      this.x = width;
    } else if (this.x > width * 2) {
      this.x = -500;
    }

    const now = millis();
    if (this.isPaused) {
      if (now - this.lastPauseTime > this.pauseTime) {
        this.isPaused = false;
      }
      return;
    }

    if (now - this.lastFrameTime > BIRD_FRAME_MS) {
      this.moveFrame(1);
      this.lastFrameTime = now;
    }
  },

  moveFrame: function (dir) {
    this.imgIndex += dir;
    this.flyImgIndex += dir;
    if (this.imgIndex < 0) {
      this.imgIndex = this.imgs.length - 1;
    } else if (this.imgIndex > this.imgs.length - 1) {
      this.imgIndex = 0;
    }
    if (this.flyImgIndex < 0) {
      this.flyImgIndex = this.flyImgs.length - 1;
    } else if (this.flyImgIndex > this.flyImgs.length - 1) {
      this.flyImgIndex = 0;
    }
  },

  move: function (dir) {
    this.x += dir;
  },
};
