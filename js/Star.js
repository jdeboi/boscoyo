class Star {
  constructor(depth = 1, pg) {
    this.depth = depth; // 1 = nearest, 3 = farthest
    this.pg = pg;

    this.x = random(width);
    this.y = random(height);
    this.size = random(3, 5);

    this.baseAlpha = random(120, 200); // average brightness
    this.twinkleAmp = random(40, 80); // how much it brightens/dims
    this.twinkleSpeed = random(0.5, 2); // how fast it twinkles
    this.phase = random(TWO_PI); // so they’re not in sync
  }

  update() {
    // use time in seconds for smoother behavior
    const t = this.pg.millis() / 1000;
    const a =
      this.baseAlpha +
      this.twinkleAmp * this.pg.sin(this.twinkleSpeed * t + this.phase);
    this.alpha = this.pg.constrain(a, 0, 255);
  }

  display(xOffset) {
    let parallaxX = this.x - xOffset / this.depth;
    let px = ((parallaxX % width) + width) % width; // wrap around
    this.pg.fill(255, this.alpha);
    this.pg.noStroke();
    this.pg.circle(px, this.y, this.size);
  }
}
