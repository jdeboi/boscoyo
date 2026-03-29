const bird = {
  imgs: [],
  imgIndex: 0,
  isPaused: false,
  pauseTime: 2000, // ms
  lastPauseTime: 0, // ms
  x: 0,
  y: 0,

  display: function (pg) {
    if (this.imgs[this.imgIndex]) {
      pg.image(this.imgs[this.imgIndex], this.x, this.y);
    }
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

  update: function (pg) {
    // wrap around screen
    if (this.x < 0) {
      this.x = pg.width;
    } else if (this.x > pg.width * 2) {
      this.x = -500;
    }

    const now = pg.millis();
    // if currently paused, check if pause is over
    if (this.isPaused) {
      if (now - this.lastPauseTime > this.pauseTime) {
        this.isPaused = false;
      }
      return; // don’t animate while paused
    }

    // normal animation
    if (pg.frameCount % 8 === 0) {
      this.moveFrame(1);
      this.move(4);
    }
  },

  moveFrame: function (dir) {
    this.imgIndex += dir;
    if (this.imgIndex < 0) {
      this.imgIndex = this.imgs.length - 1;
    } else if (this.imgIndex > this.imgs.length - 1) {
      this.imgIndex = 0;
    }
  },

  move: function (dir) {
    this.x += dir;
  },
};
