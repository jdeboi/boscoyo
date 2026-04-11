const SKETCH_ID = "sketch1";

let treeY = 0;

function displayQuestion(question, pg) {
  xPosition--;
  pg.textFont("monospace");

  pg.push();
  pg.fill(255);
  pg.textAlign(pg.LEFT, pg.CENTER);
  pg.textSize(54);
  pg.text(question, pg.width / 2 + 50, 0, 550, 800);
  pg.pop();

  pg.push();
  pg.scale(1.8);
  pg.translate(0, -200);
  trees[1].display(-1000);
  pg.pop();
}

function displayBigTreeQuestionsNo(pg) {
  displayQuestion("", pg);
}

function displayTreeSpan(pg) {
  pg.textFont("monospace");
  xPosition -= 0.5;

  for (const tree of trees) {
    tree.display(xPosition);
  }
}

function displayPirogue(pg) {
  pg.textFont("monospace");
  xPosition--;

  pg.push();
  pg.scale(0.5);
  pirogue.display(pg);
  pirogue.update();

  for (const tree of trees) {
    tree.display(xPosition);
  }
  pg.pop();
}

function displayPirogueBig(pg) {
  pg.textFont("monospace");
  xPosition -= 0.5;
  pirogue.y = 100;

  pg.push();
  pg.scale(2);
  pg.translate(0, -500);
  trees[1].display(-600);
  pg.pop();

  pg.push();
  pg.scale(0.5);
  pirogue.display(pg);
  pirogue.update();
  pirogue.move(1);
  pg.pop();
}

function displayBirdBigTree1(pg) {
  pg.textFont("monospace");
  pg.push();
  pg.scale(1.6);
  pg.translate(0, -180);
  trees[2].display(-pg.width * 0.9);
  pg.pop();
}
