// Central scene registry — single source of truth for scene IDs and durations.
// Each sketch key (sketch1/sketch2/sketchOverlay/sketchSplit) can have { draw, onEnter, onExit }.
// Set to null to show a black screen on that sketch for that scene.
//
// IMPORTANT: sketch-specific draw functions must be wrapped in arrow functions
// so the name is resolved lazily at call time, not at file load time.
// Functions from shared scenes/ files (displayDuckweed etc.) can be referenced directly.

const START_SCENE_ID = "pirogueScene";
const DURATION = 1000;

const sceneCoordinator = [
  {
    id: "treeSpan",
    durationSeconds: DURATION,
    sketch1: { draw: (pg) => displayTreeSpan(pg) },
    sketch2: { draw: (pg) => displaySk2(pg) },
    sketchOverlay: null,
    sketchSplit: null,
  },
  {
    id: "birdBigTree1",
    durationSeconds: DURATION,
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
    sketchOverlay: null,
    sketchSplit: null,
  },
  {
    id: "pirogue",
    durationSeconds: DURATION,
    sketch1: {
      draw: (pg) => displayPirogueBig(pg),
      onEnter: () => {
        xPosition = 0;
        pirogue.x = -400;
      },
    },
    sketch2: null,
    sketchOverlay: null,
    sketchSplit: null,
  },
  {
    id: "lotus",
    durationSeconds: DURATION,
    sketch1: { draw: displayLotus },
    sketch2: null,
    sketchOverlay: null,
    sketchSplit: null,
  },
  {
    id: "duckweed",
    durationSeconds: DURATION,
    sketch1: { draw: displayDuckweedParticles },
    sketch2: { draw: displayDuckweedParticles },
    sketchOverlay: { draw: displayGatorOnly },
    sketchSplit: null,
  },
  {
    id: "moss",
    durationSeconds: DURATION,
    sketch1: { draw: displayMossScene },
    sketch2: { draw: displayMossScene },
    sketchOverlay: null,
    sketchSplit: null,
  },
  {
    id: "pirogueScene",
    durationSeconds: DURATION,
    sketch1: { draw: displayPirogueScene },
    sketch2: null,
    sketchOverlay: null,
    sketchSplit: null,
  },
  {
    id: "bigTreeQuestions",
    durationSeconds: DURATION,
    sketch1: {
      draw: (pg) => displayBigTreeQuestionsNo(pg),
      onEnter: (pg) => {
        bird.x = pg.width - 500;
        bird.y = pg.height / 2;
      },
    },
    sketch2: null,
    sketchOverlay: null,
    sketchSplit: null,
  },
  {
    id: "treesAndPirogue",
    durationSeconds: DURATION,
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
    sketchOverlay: null,
    sketchSplit: null,
  },
];
