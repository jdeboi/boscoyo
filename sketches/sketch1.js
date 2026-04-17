var SKETCH_ID = "sketch1";
var NUM_PROJECTION_SURFACES = 1;

let treeY = 0;
let lastTreePoseTime = 0;
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
    xPosition += 1.5; // slow auto-scroll right
  } else {
    const bodyX = getPoseX();
    const normalized = (bodyX / pg.width) * 2 - 1; // -1 (left) to +1 (right)
    const deadzone = 0.05;
    const maxSpeed = 5;
    if (abs(normalized) > deadzone) {
      xPosition -= normalized * maxSpeed;
    }
  }
  // drawWaterBand(pg.height * 0.8, 0, pg, {
  //   amp: 18,
  //   hasOutline: false,
  //   hasRipples: false,
  // });
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
  drawWaterBand(200, 0, pg, {
    amp: 18,
    hasOutline: false,
    hasRipples: false,
  });
  displayTreeBase(pg);
  displayPirogueBottom(pg);
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
  const hasPose = poseState.bodies.length > 0;
  const targetX =
    mouseMode || !hasPose ? mouseX : poseState.bodies[0].bodyCenter.x;
  const dir = flyBird.updateFollowing(targetX);
  flyBird.display(pg, dir);
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
  const hasPose = poseState.bodies.length > 0;
  const targetX =
    mouseMode || !hasPose ? mouseX : poseState.bodies[0].bodyCenter.x;
  const dir = flyBird.updateFollowing(targetX);
  flyBird.display(pg, dir);
}
