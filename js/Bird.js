const BIRD_FRAME_MS = 1000 / 8; // 8fps animation

const bird = {
  imgs: [],
  imgIndex: 0,
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

  displayBackward: function (pg) {
    pg.push();
    pg.scale(-1, 1);
    pg.translate(-this.x - this.imgs[this.imgIndex].width, this.y);
    if (this.imgs[this.imgIndex]) {
      pg.image(this.imgs[this.imgIndex], 0, 0);
    }
    pg.pop();
  },

  update: function () {
    // wrap around screen
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
      this.move(4);
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
