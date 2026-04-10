const history1 = [
  "For thousands of years, cypress forests filled the Louisiana swamps,",
  "and were among the largest forest ecosystems in North America.",
  "Some trees reached more than a thousand years in age,",
  "standing as big and magnificent as the redwoods.",
];

const history2 = [
  "By the 1920s, most of these ancient trees had been logged,",
  "leaving only scattered remnants and submerged stumps.",
  "The memory of those original forests has largely been forgotten",
  "making it difficult to fully grasp what the swamp once was,",
  "and what it could be.",
];

const questions = [
  "What responsibility do we have to understand the losses we inherited?",
  "What does it mean to care for a landscape we only partially remember?",
  "What futures become imaginable when our forgotten history resurfaces?",
];

function displayTitle(pg) {
  pg.textAlign(CENTER, CENTER);
  pg.fill(255);
  pg.noStroke();
  pg.textSize(180);
  pg.text("Boscoyo", width / 2, height / 2 - 40);

  pg.textSize(44);
  pg.fill(200);
  pg.text("(Cypress Knees)", width / 2, height / 2 + 120);
}

function displayBigTreeQuestions1(pg) {
  displayQuestion(questions[1], pg);
}

function displayBigTreeQuestions2(pg) {
  displayQuestion(questions[2], pg);
}

function displayBigTreeQuestionsNo(pg) {
  displayQuestion("", pg);
}

const scenes = [
  {
    id: "intro",
    durationSeconds: 4,
    draw: displayTitle,
    onEnter: (pg) => {
      pg.textFont(font);
    },
  },
  {
    id: "treeSpan",
    durationSeconds: 30,
    textCuesDelaySeconds: 4,

    draw: displayTreeSpan,
    textCues: history1,
  },
  {
    id: "birdBigTree1",
    durationSeconds: 15,
    draw: displayBirdBigTree1,
    onEnter: (pg) => {
      bird.x = 0;
    },

    textCues: [],
  },
  {
    id: "pirogue",
    durationSeconds: 25,
    textCueDelaySeconds: 2,
    draw: displayPirogueBig,
    onEnter: (pg) => {
      xPosition = 0;
      pirogue.x = -400;
    },
    textCues: history2,
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
    draw: displayBigTreeQuestions1,
    onEnter: (pg) => {
      bird.x = pg.width - 500;
      bird.y = pg.height / 2;
    },
  },
  {
    id: "bigTreeQuestions2",
    durationSeconds: 8,
    draw: displayBigTreeQuestions2,
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
    textCues: [],
    onEnter: (pg) => {
      xPosition = 0;
      pirogue.x = 0;
    },
    onExit: () => {
      resetAnimation();
    },
  },
];
