const startX = 50;

const PIROGUE_FPS = 4;

const pirogue = {
  imgs: [],
  imgIndex: 0,
  isPaused: false,
  pauseTime: 2000, // ms
  lastPauseTime: 0, // ms
  lastFrameTime: 0, // ms
  x: startX,
  y: 0,

  reset: function () {
    this.x = startX;
  },
  display: function (pg) {
    if (this.imgs[this.imgIndex]) {
      pg.image(this.imgs[this.imgIndex], this.x, this.y);
    }
  },

  update: function (pg) {
    const now = pg.millis();

    // if currently paused, check if pause is over
    if (this.isPaused) {
      if (now - this.lastPauseTime > this.pauseTime) {
        this.isPaused = false;
      }
      return; // don’t animate while paused
    }

    // time-based animation
    if (now - this.lastFrameTime > 1000 / PIROGUE_FPS) {
      this.moveFrame(1);
      this.lastFrameTime = now;
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
