// Central scene registry — single source of truth for scene IDs and durations.
// Each sketch key (sketch1/sketch2/sketch3) can have { draw, onEnter, onExit }.
// Set to null to show a black screen on that sketch for that scene.
//
// IMPORTANT: sketch-specific draw functions must be wrapped in arrow functions
// so the name is resolved lazily at call time, not at file load time.
// Functions from shared scenes/ files (displayDuckweed etc.) can be referenced directly.

const START_SCENE_ID = "treeSpan";

const sceneCoordinator = [
  {
    id: "treeSpan",
    durationSeconds: 90,
    sketch1: { draw: (pg) => displayTreeSpan(pg) },
    sketch2: { draw: (pg) => displaySk2(pg) },
    sketch3: null,
  },
  {
    id: "birdBigTree1",
    durationSeconds: 15,
    sketch1: {
      draw: (pg) => displayBirdBigTree1(pg),
      onEnter: () => {
        bird.x = 0;
      },
    },
    sketch2: {
      draw: (pg) => displaySk2Bird(pg),
      onEnter: () => {
        bird.x = 0;
        bird.y = scene2D.height - 180;
      },
    },
    sketch3: null,
  },
  {
    id: "pirogue",
    durationSeconds: 25,
    sketch1: {
      draw: (pg) => displayPirogueBig(pg),
      onEnter: () => {
        xPosition = 0;
        pirogue.x = -400;
      },
    },
    sketch2: null,
    sketch3: null,
  },
  {
    id: "lotus",
    durationSeconds: 20,
    sketch1: { draw: displayLotus },
    sketch2: null,
    sketch3: null,
  },
  {
    id: "duckweed",
    durationSeconds: 30,
    sketch1: { draw: displayDuckweed },
    sketch2: { draw: displayDuckweed },
    sketch3: null,
  },
  {
    id: "moss",
    durationSeconds: 30,
    sketch1: { draw: displayMossScene },
    sketch2: { draw: displayMossScene },
    sketch3: null,
  },
  {
    id: "pirogueScene",
    durationSeconds: 30,
    sketch1: { draw: displayPirogueScene },
    sketch2: null,
    sketch3: null,
  },
  {
    id: "bigTreeQuestions",
    durationSeconds: 8,
    sketch1: {
      draw: (pg) => displayBigTreeQuestionsNo(pg),
      onEnter: (pg) => {
        bird.x = pg.width - 500;
        bird.y = pg.height / 2;
      },
    },
    sketch2: null,
    sketch3: null,
  },
  {
    id: "bigTreeQuestions2",
    durationSeconds: 8,
    sketch1: { draw: (pg) => displayBigTreeQuestionsNo(pg) },
    sketch2: null,
    sketch3: null,
  },
  {
    id: "bigTreeQuestions3",
    durationSeconds: 4,
    sketch1: {
      draw: (pg) => displayBigTreeQuestionsNo(pg),
      onExit: (pg) => {
        bird.x = 0;
        bird.y = pg.height - 180;
      },
    },
    sketch2: null,
    sketch3: null,
  },
  {
    id: "treesAndPirogue",
    durationSeconds: 20,
    sketch1: {
      draw: (pg) => displayPirogue(pg),
      onEnter: () => {
        xPosition = 0;
        pirogue.x = 0;
      },
      onExit: () => {
        resetAnimation();
      },
    },
    sketch2: null,
    sketch3: null,
  },
];
