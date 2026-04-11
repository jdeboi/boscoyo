class Gator {
  constructor() {
    this.x = null;
    this.y = null;
    this.backX = null;
    this.tailX = null;
    this.facingRight = true;
    this._noiseOffset = Math.random() * 1000;
  }

  // --- public API ---

  update(targetX, targetY) {
    if (this.x === null) this._init(targetX, targetY);
    this._moveHead(targetX, targetY);
    this._moveSegments();
  }

  display(pg) {
    const t = millis() * 0.001;
    const bob = sin(t * 1.5) * 5;
    const flip = 1;
    pg.imageMode(pg.CENTER);
    this._drawTail(pg, t, bob, flip);
    this._drawBack(pg, t, bob, flip);
    this._drawHead(pg, bob, flip);
  }

  // Returns noise-driven wander target when no pose is present
  autoTarget(pg) {
    const t = millis() * 0.00008;
    return {
      x: map(
        noise(t + this._noiseOffset, 0),
        0,
        1,
        pg.width * 0.15,
        pg.width * 0.85,
      ),
      y: map(
        noise(t + this._noiseOffset + 500, 0),
        0,
        1,
        pg.height * 0.2,
        pg.height * 0.8,
      ),
    };
  }

  // Midpoint between head and back — used for duckweed repulsion
  repelCenter() {
    const bx = this.backX ?? this.x;
    const by = (this.y ?? 0) - 40; // halfway between head y and back y (-80 offset)
    return { x: (this.x + bx) / 2, y: (this.y + by) / 2 };
  }

  reset() {
    this.x = null;
    this.y = null;
    this.backX = null;
    this.tailX = null;
  }

  // --- private ---

  _init(x, y) {
    this.x = x;
    this.y = y;
    this.backX = x;
    this.tailX = x;
  }

  _moveHead(targetX, targetY) {
    const prevX = this.x;
    this.x = lerp(this.x, targetX, 0.06);
    this.y = lerp(this.y, targetY, 0.06);
    if (abs(this.x - prevX) > 0.05) this.facingRight = this.x > prevX;
  }

  _moveSegments() {
    const maxLen = 30; // rope segment length — back/tail can't exceed this from parent
    this.backX = this._chaseAndClamp(this.backX, this.x, 0.03, maxLen);
    this.tailX = this._chaseAndClamp(this.tailX, this.backX, 0.02, maxLen);
  }

  _chaseAndClamp(current, target, speed, maxDist) {
    let next = lerp(current, target, speed);
    const d = next - target;
    if (abs(d) > maxDist) next = target + maxDist * (d > 0 ? 1 : -1);
    return next;
  }

  _drawHead(pg, bob, flip) {
    const SC = 0.4;
    pg.push();
    pg.translate(this.x, this.y + bob);
    pg.scale(flip * SC, SC);
    pg.image(gatorHeadImg, 0, 0);
    pg.pop();
  }

  _drawBack(pg, t, bob, flip) {
    const SC = 0.4;
    const swing = sin(t * 2.5) * 12 - 50;
    pg.push();
    pg.translate(this.backX + swing * flip, this.y - 80 + bob);
    pg.scale(flip * SC, SC);
    pg.image(gatorBackImg, 0, 0);
    pg.pop();
  }

  _drawTail(pg, t, bob, flip) {
    const SC = 0.4;
    const tailSwing = sin(t * 2.5 + (PI / 2) * 0.5) * 12 - 100;
    pg.push();
    pg.translate(this.tailX + tailSwing * flip, this.y - 134 + bob);
    pg.scale(flip * SC * 0.6, SC * 0.6);
    pg.image(gatorBackImg, 0, 0);
    pg.pop();
  }
}
