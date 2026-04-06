const START_SCENE_ID = "duckweed";

let treeY = 0;

const scenes = [
  {
    id: "treeSpan",
    durationSeconds: 30,
    draw: displayTreeSpan,
  },
  {
    id: "birdBigTree1",
    durationSeconds: 15,
    draw: displayBirdBigTree1,
    onEnter: () => {
      bird.x = 0;
    },
  },
  {
    id: "pirogue",
    durationSeconds: 25,
    draw: displayPirogueBig,
    onEnter: () => {
      xPosition = 0;
      pirogue.x = -400;
    },
  },
  {
    id: "lotus",
    durationSeconds: 20,
    draw: displayLotus,
  },
  {
    id: "duckweed",
    durationSeconds: 30,
    draw: displayDuckweed,
  },
  {
    id: "moss",
    durationSeconds: 30,
    draw: displayMossScene,
  },
  {
    id: "pirogueScene",
    durationSeconds: 30,
    draw: displayPirogueScene,
  },
  {
    id: "bigTreeQuestions",
    durationSeconds: 8,
    draw: displayBigTreeQuestionsNo,
    onEnter: (pg) => {
      bird.x = pg.width - 500;
      bird.y = pg.height / 2;
    },
  },
  {
    id: "bigTreeQuestions2",
    durationSeconds: 8,
    draw: displayBigTreeQuestionsNo,
  },
  {
    id: "bigTreeQuestions3",
    durationSeconds: 4,
    draw: displayBigTreeQuestionsNo,
    onExit: (pg) => {
      bird.x = 0;
      bird.y = pg.height - 180;
    },
  },
  {
    id: "treesAndPirogue",
    durationSeconds: 20,
    draw: displayPirogue,
    onEnter: () => {
      xPosition = 0;
      pirogue.x = 0;
    },
    onExit: () => {
      resetAnimation();
    },
  },
];

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

  pg.push();
  pg.scale(1.4);
  bird.displayBackward(pg);
  bird.update(pg);
  bird.move(-1);
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
  pg.scale(1.2);
  pirogue.display(pg);
  pirogue.update(pg);

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
  pg.scale(1.5);
  pirogue.display(pg);
  pirogue.update(pg);
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

  pg.push();
  bird.display(pg);
  bird.update(pg);
  pg.pop();
}
