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

    // Suspicious behavior state
    this._suspState = "walking"; // 'walking' | 'paused'
    this._suspDir = 1;
    this._afterPauseDir = 1;
    this._pauseUntil = 0;
    this._lastTargetX = null;
    this._targetLastMoved = 0;
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

  // Returns the direction (1 or -1) to pass to display().
  updateSuspicious(targetX) {
    const MOVE_THRESHOLD = 10; // px movement to count as "target moved"
    const STILL_TIMEOUT = 400; // ms — target counts as "moving" within this window
    const PAUSE_DURATION = 1000; // ms bird freezes when disturbed
    const PAUSE_RADIUS = 200; // px — only pause if bird is this close to target
    const now = millis();

    // Seed on first call: start walking toward target
    if (this._lastTargetX === null) {
      this._lastTargetX = targetX;
      this._suspDir = this.x < targetX ? 1 : -1;
    }

    // Detect target motion
    if (abs(targetX - this._lastTargetX) > MOVE_THRESHOLD) {
      this._targetLastMoved = now;
    }
    this._lastTargetX = targetX;
    const targetMoving = now - this._targetLastMoved < STILL_TIMEOUT;

    // Trigger pause when target moves while walking and bird is close enough
    if (
      this._suspState === "walking" &&
      targetMoving &&
      abs(this.x - targetX) < PAUSE_RADIUS
    ) {
      const headingToward =
        (this._suspDir > 0 && this.x < targetX) ||
        (this._suspDir < 0 && this.x > targetX);
      // If heading toward → reverse after pause. If heading away → keep going.
      this._afterPauseDir = headingToward ? -this._suspDir : this._suspDir;
      this._suspState = "paused";
      this._pauseUntil = now + PAUSE_DURATION;
    }

    // End pause
    if (this._suspState === "paused" && now >= this._pauseUntil) {
      this._suspDir = this._afterPauseDir;
      this._suspState = "walking";
    }

    if (this._suspState === "walking") {
      this.x += this._suspDir * this.speed;

      // Wrapping
      const buf = this.wrapBuffer;
      if (this.x > width + buf) this.x = -buf;
      else if (this.x < -buf) this.x = width + buf;

      // Advance animation frame
      if (now - this.lastFrameTime > BIRD_FRAME_MS) {
        this.imgIndex = (this.imgIndex + 1) % this.imgs.length;
        this.lastFrameTime = now;
      }
    }

    return this._suspDir;
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
