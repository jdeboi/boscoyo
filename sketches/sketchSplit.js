var SKETCH_ID = "sketchSplit";
var NUM_PROJECTION_SURFACES = 2;

function displaySplitOutline(pg) {
  // 6" bar + 58" screen + 3" bar + 26" screen + 3" bar + 58" screen + 6" bar
  // = 160"
  const totalWidth = 160;
  const scale = pg.width / totalWidth;
  const bigBarWidth = 6 * scale;
  const littleBarWidth = 3 * scale;
  const screen1Width = 58 * scale;
  const screen2Width = 26 * scale;

  let x = 0;
  pg.push();
  pg.noStroke();
  pg.fill(255, 100);
  // Left bar
  pg.rect(0, 0, bigBarWidth, pg.height);
  x += bigBarWidth;
  // screen 1
  x += screen1Width;
  // first little bar
  pg.rect(x, 0, littleBarWidth, pg.height);
  x += littleBarWidth;
  // Screen 2
  x += screen2Width;
  // second little bar
  pg.rect(x, 0, littleBarWidth, pg.height);
  x += littleBarWidth;
  // screen 3
  x += screen1Width;
  // right big bar
  pg.rect(x, 0, bigBarWidth, pg.height);
  pg.pop();
}
