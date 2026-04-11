class Gator {
  constructor() {
    this.x = null;
    this.y = null;
    this.backX = null;
    this.tailX = null; // third segment — lags even more
    this.facingRight = true;
  }

  update(targetX, targetY) {
    if (this.x === null) {
      this.x = targetX;
      this.y = targetY;
      this.backX = targetX;
      this.tailX = targetX;
    }

    const prevX = this.x;
    this.x = lerp(this.x, targetX, 0.06);
    this.y = lerp(this.y, targetY, 0.06);

    if (abs(this.x - prevX) > 0.05) {
      this.facingRight = this.x > prevX;
    }

    // Back lags behind the head in world space — slower lerp = more snake-like flop
    const flip = this.facingRight ? 1 : -1;
    const backTargetX = this.x + (-50 + -30) * flip;
    this.backX = lerp(this.backX, backTargetX, 0.03);

    // Constrain: back can't be more than maxDist from head
    const maxDist = 10;
    const dx = this.backX - this.x;
    if (abs(dx) > maxDist) {
      this.backX = this.x + maxDist * (dx > 0 ? 1 : -1);
    }

    // Tail lags behind back, same constraint chained from backX
    const tailTargetX = this.backX + (-50 + -30) * flip;
    this.tailX = lerp(this.tailX, tailTargetX, 0.02);
    const dxTail = this.tailX - this.backX;
    if (abs(dxTail) > maxDist) {
      this.tailX = this.backX + maxDist * (dxTail > 0 ? 1 : -1);
    }
  }

  display(pg) {
    const t = millis() * 0.001;
    const SC = 0.4;

    // Both parts bob vertically together
    const bob = sin(t * 1.5) * 5;

    // Back swings left/right relative to head — swimming undulation
    const swing = sin(t * 2.5) * 12 - 50;

    // Back sits above (further into scene) and slightly smaller
    const backOffsetY = -80;

    pg.imageMode(pg.CENTER);

    const flip = 1; //this.facingRight ? 1 : -1;

    // Tail — furthest back, smallest, phase-shifted swing
    const tailSwing = sin(t * 2.5 + (PI / 2) * 0.5) * 12 - 100;
    pg.push();
    pg.translate(this.tailX + tailSwing * flip, this.y + backOffsetY * 1.8 + bob);
    const tailSc = SC * 0.6;
    pg.scale(flip * tailSc, tailSc);
    pg.image(gatorBackImg, 0, 0);
    pg.pop();

    // Back segment
    pg.push();
    pg.translate(this.backX + swing * flip, this.y + backOffsetY + bob);
    const backSc = SC * 1;
    pg.scale(flip * backSc, backSc);
    pg.image(gatorBackImg, 0, 0);
    pg.pop();

    // Head on top
    pg.push();
    pg.translate(this.x, this.y + bob);
    pg.scale(flip * SC, SC);
    pg.image(gatorHeadImg, 0, 0);
    pg.pop();
  }

  reset() {
    this.x = null;
    this.y = null;
    this.backX = null;
    this.tailX = null;
  }
}
