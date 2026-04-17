const BIRD_FRAME_MS = 1000 / 8; // 8fps animation

class Bird {
  constructor({
    x = 0,
    y = 0,
    speed = 1,
    scale = 1,
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
    this._followDir = 1;
    this._followLastTargetX = null;
  }

  display(pg, dir = 1, sc = 1) {
    const img = this.imgs[this.imgIndex];
    if (!img) return;
    pg.push();
    pg.imageMode(pg.CORNER);
    pg.translate(this.x, this.y);
    pg.scale(this.scale * sc);
    if (dir < 0) {
      pg.scale(-1, 1);
      pg.translate(-img.width, 0);
    }
    pg.image(img, 0, 0);
    pg.pop();
  }

  setHeightFromBottom(disFromBottom, pg, sc = 1) {
    this.y = pg.height - disFromBottom - this.getHeight(sc);
    console.log("setHeightFromBottom", this.y);
  }

  getHeight(sc = 1) {
    const img = this.imgs[0];
    return img ? img.height * this.scale * sc : 0;
  }

  // Move in the same direction as targetX is moving. Call instead of update().
  updateFollowing(targetX) {
    if (this._followLastTargetX === null) this._followLastTargetX = targetX;
    const dx = targetX - this._followLastTargetX;
    if (abs(dx) > 2) this._followDir = dx > 0 ? 1 : -1;
    this._followLastTargetX = targetX;
    this.update(this._followDir);
    return this._followDir;
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
const bird = new Bird({ speed: 1.5, scale: 1, wrapBuffer: 80 });
const flyBird = new Bird({ speed: 3, scale: 1, isFlying: true });
