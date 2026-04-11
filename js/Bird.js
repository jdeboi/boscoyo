const BIRD_FRAME_MS = 1000 / 8; // 8fps animation

class Bird {
  constructor({
    x = 0,
    y = 0,
    speed = 1,
    scale = 0.5,
    pauseTime = 0,
    wrapBuffer = 500,
    isFlying = false,
  } = {}) {
    this.imgs = [];
    this.imgIndex = 0;
    this.isPaused = false;
    this.pauseTime = pauseTime;
    this.lastPauseTime = 0;
    this.lastFrameTime = 0;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.scale = scale;
    this.wrapBuffer = wrapBuffer;
  }

  display(pg, dir = 1) {
    const img = this.imgs[this.imgIndex];
    if (!img) return;
    pg.push();
    pg.scale(this.scale);
    if (dir < 0) {
      pg.scale(-1, 1);
      pg.translate(-this.x - img.width, this.y);
    }
    pg.image(img, this.x, this.y);
    pg.pop();
  }

  update(dir = 1) {
    if (this.isFlying) {
      this.x += dir * this.speed;
    }

    const buf = this.wrapBuffer;
    if (this.x > width + buf) this.x = -buf;
    else if (this.x < -buf) this.x = width + buf;

    const now = millis();
    if (this.isPaused) {
      if (now - this.lastPauseTime > this.pauseTime) this.isPaused = false;
      return;
    }
    if (now - this.lastFrameTime > BIRD_FRAME_MS) {
      this.imgIndex = (this.imgIndex + 1) % this.imgs.length;
      this.lastFrameTime = now;
    }
    if (!this.isFlying) {
      this.x += dir * this.speed;
    }
  }
}

// default singletons
const bird = new Bird({ speed: 1, scale: 1 });
const flyBird = new Bird({ speed: 3, scale: 0.5, isFlying: true });
