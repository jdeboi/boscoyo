var SKETCH_ID = "sketch1";
var NUM_PROJECTION_SURFACES = 1;

let treeY = 0;
let lastTreePoseTime = 0;
let sk1PirogueX = 0;
let sk1FacingRight = true;
const TREE_AUTO_TIMEOUT = 10000;

function displayQuestion(question, pg) {
  xPosition--;
  pg.textFont("monospace");

  pg.push();
  pg.fill(255);
  pg.textAlign(pg.LEFT, pg.CENTER);
  pg.textSize(54);
  pg.text(question, pg.width / 2 + 50, 0, 550, 800);
  pg.pop();

  trees[1].display((trees[1].x - 1000) * 1.8, -360, 1.8);
}

function displayBigTreeQuestionsNo(pg) {
  displayQuestion("", pg);
}

function displayTreesSplit(pg) {
  for (const tree of trees) {
    tree.display(tree.x, 0);
  }
}

function displayTreesMoving(pg) {
  if (getIsAutoMove()) {
    xPosition += 0.5; // slow auto-scroll right
  } else {
    const bodyX = getPoseX();
    const normalized = (bodyX / pg.width) * 2 - 1; // -1 (left) to +1 (right)
    const deadzone = 0.1;
    const maxSpeed = 1.5;
    if (abs(normalized) > deadzone) {
      xPosition -= normalized * maxSpeed;
    }
  }

  const totalW = trees.reduce((sum, t) => sum + t.getWidth() + TREE_GAP, 0);
  for (const tree of trees) {
    const treeW = tree.getWidth();
    const px =
      ((((tree.x + xPosition + treeW) % totalW) + totalW) % totalW) - treeW;
    tree.display(px, 0);
  }
}

function displayPirogue(pg) {
  xPosition--;

  pg.push();
  pirogue.display(pg);
  pirogue.update();

  for (const tree of trees) {
    tree.display(tree.x + xPosition, 0);
  }
  pg.pop();
}

function displayTreeBasePirogue(pg) {
  displayTreeBase(pg);
  displayPirogueBottom(pg);
}

function displayPirogueBottom(pg) {
  const bodyX = getPoseX();
  const img = pirogue.imgs[pirogue.imgIndex];
  const SC = 1;
  const halfW = img ? (img.width * SC) / 2 : 0;

  const prevX = sk1PirogueX;
  sk1PirogueX = pg.constrain(
    pg.lerp(sk1PirogueX, bodyX, 0.04),
    halfW,
    pg.width - halfW,
  );
  if (pg.abs(sk1PirogueX - prevX) > 0.1) {
    sk1FacingRight = sk1PirogueX > prevX;
  }

  pirogue.update();

  pg.push();
  pg.imageMode(pg.CENTER);
  pg.translate(sk1PirogueX, pg.height - pirogue.getHeight(SC) / 2 - 10);
  if (!sk1FacingRight) pg.scale(-1, 1);
  pg.scale(SC);
  if (img) pg.image(img, 0, 0);
  pg.pop();
}

function displayTreeBase() {
  fullTree.display(100, -1000, 2);
}

function displayTreeBaseSplit() {
  fullTree.display((trees[1].x - 600) * 2, -1000, 2);
}

function displayBigTree(pg) {
  //   let fullTree;
  // let croppedTreeTall;
  // let leaningTree;
  // let fullBaldTree;

  pg.push();
  leaningTree.display(0, null, 0.8);
  fullBaldTree.display(pg.width - fullBaldTree.getWidth(0.8), null, 0.8);
  pg.pop();
}

function displayBirdBigTree(pg) {
  displayBigTree(pg);
  // const hasPose = poseState.bodies.length > 0;
  // const targetX =
  //   mouseMode || !hasPose ? mouseX : poseState.bodies[0].bodyCenter.x;
  // const dir = bird.updateSuspicious(targetX);
  const dir = 0.5;
  bird.display(pg, dir);
  bird.update(dir);
}

function displayBirdSplit(pg) {
  bird.display(pg, 1);
  bird.update(1);
}

function displayFlyingSplit(pg) {
  flyBird.display(pg, 1);
  flyBird.update(1);
}

function displayTreeTop(pg) {
  pg.push();
  // fullBaldTree.display(0, 100, 1.3);
  // let fullTree;
  // let croppedTreeTall;
  // let leaningTree;
  treeArm.display(pg.width - treeArm.getWidth());
  pg.pop();
}

function displayTreeTopFlying(pg) {
  displayTreeTop(pg);
  flyBird.display(pg, 1);
  flyBird.update(1);
}
