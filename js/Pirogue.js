const startX = 50;

const pirogue = {
  imgs: [],
  imgIndex: 0,
  isPaused: false,
  pauseTime: 2000, // ms
  lastPauseTime: 0, // ms
  x: startX,
  y: 0,

  reset: function () {
    this.x = startX;
  },
  display: function () {
    if (this.imgs[this.imgIndex]) {
      image(this.imgs[this.imgIndex], this.x, this.y);
    }
    // fill(255);
    // noStroke();
    // textSize(24);
    // text(this.imgIndex, this.x + 10, this.y + 30);
  },

  update: function () {
    // wrap around screen
    // if (this.x < 0) {
    //   this.x = width;
    // } else if (this.x > width * 2) {
    //   this.x = -500;
    // }

    const now = millis();

    // if currently paused, check if pause is over
    if (this.isPaused) {
      if (now - this.lastPauseTime > this.pauseTime) {
        this.isPaused = false;
      }
      return; // don’t animate while paused
    }

    // chance to start a pause
    // if (random() < 0.0005) {
    //   // 0.5% per frame, not 50%
    //   this.isPaused = true;
    //   this.pauseTime = random(1000); // 1–3 seconds
    //   this.lastPauseTime = now;
    //   return;
    // }

    // normal animation
    if (frameCount % 20 === 0) {
      this.moveFrame(1);
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
