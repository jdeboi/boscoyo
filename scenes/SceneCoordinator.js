// Central scene registry — single source of truth for scene IDs and durations.
// Each sketch key (sketch1/sketch2/sketchOverlay/sketchSplit/sketch1Only) can have { draw, onEnter, onExit }.
// Set to null to show a black screen on that sketch for that scene.
//
// Functions from scenes/ files are safe to reference directly (loaded by all HTML files).
// Functions from sketches/ files MUST use arrow wrappers: (pg) => fn(pg)
// so the name is resolved lazily at call time, not at SceneCoordinator parse time.

const START_SCENE_ID = "moss";
const DURATION = 30;

const sceneCoordinator = [
  {
    id: "moss",
    durationSeconds: DURATION,
    sketch1: { draw: displayMossScene },
    sketch2: { draw: displayMossScene },
    sketchOverlay: null,
    sketchSplit: { draw: displayMossScene },
    sketch1Only: { draw: displayMossScene },
  },
  {
    id: "treesMoving1",
    durationSeconds: DURATION,
    sketch1: { draw: (pg) => displayTreesMoving(pg) },
    sketch2: { draw: (pg) => displayTreesMoving(pg) },
    sketchOverlay: null,
    sketchSplit: { draw: (pg) => displayTreesSplit(pg) },
    sketch1Only: { draw: (pg) => displayTreesMoving(pg) },
  },

  {
    id: "duckweed",
    durationSeconds: DURATION,
    sketch1: { draw: (pg) => displayDuckweedParticles(pg) },
    sketch2: { draw: (pg) => displayDuckweedParticles(pg) },
    sketchOverlay: { draw: (pg) => displayGatorOnly(pg) },
    sketchSplit: { draw: (pg) => displayDuckweedSplit(pg) },
    sketch1Only: { draw: (pg) => displayDuckweed(pg) },
  },
  {
    id: "flyingBird",
    durationSeconds: DURATION,
    sketch1: { draw: (pg) => displayTreeTop(pg) },
    sketch2: { draw: (pg) => displayTreeTop(pg) },
    sketchOverlay: { draw: (pg) => displayFlyingBirdOverlay(pg) },
    sketchSplit: { draw: (pg) => displayFlyingSplit(pg) },
    sketch1Only: {
      draw: (pg) => displayTreeTopFlying(pg),
      onEnter: (pg) => {
        flyBird.x = -100;
        flyBird.y = pg.height / 2;
      },
    },
  },
  // {
  //   id: "birdTree",
  //   durationSeconds: DURATION,
  //   sketch1: { draw: (pg) => displayBigTree(pg) },
  //   sketch2: { draw: (pg) => displayBigTree(pg) },
  //   sketchOverlay: {
  //     draw: (pg) => displayBirdOverlay(pg),
  //     onEnter: (pg) => {
  //       bird.x = 0;
  //       bird.scale = 1;
  //       bird.setHeightFromBottom(50, pg);
  //     },
  //   },
  //   sketchSplit: {
  //     draw: (pg) => displayBirdSplit(pg),
  //     onEnter: (pg) => {
  //       bird.x = 0;
  //       bird.scale = 1;
  //       bird.setHeightFromBottom(50, pg);
  //     },
  //   },
  //   sketch1Only: {
  //     draw: (pg) => displayBirdBigTree(pg),
  //     onEnter: (pg) => {
  //       bird.x = 0;
  //       bird.scale = 0.8;
  //       bird.setHeightFromBottom(0, pg);
  //     },
  //   },
  // },
  {
    id: "treeBase",
    durationSeconds: DURATION,
    sketch1: { draw: (pg) => displayTreeBase(pg) },
    sketch2: { draw: (pg) => displayTreeBase(pg) },
    sketchOverlay: {
      draw: (pg) => displayPirogueBottom(pg),
      onEnter: (pg) => {
        pirogue.setHeightFromBottom(0, pg);
        pirogue.x = 0;
        pirogue.scale = 1;
      },
    },
    sketchSplit: { draw: (pg) => displayTreeBaseSplit(pg) },
    sketch1Only: {
      draw: (pg) => displayTreeBasePirogue(pg),
      onEnter: (pg) => {
        pirogue.x = -400;
        pirogue.scale = 1;
        pirogue.setHeightFromBottom(0, pg);
      },
    },
  },
  {
    id: "lotus",
    durationSeconds: DURATION,
    sketch1: { draw: displayLotusNoFront },
    sketch2: { draw: displayLotusNoFront },
    sketchOverlay: { draw: displayLotusOverlay },
    sketchSplit: { draw: displayLotusSplit },
    sketch1Only: { draw: displayLotus },
  },
  {
    id: "treesMoving2",
    durationSeconds: DURATION,
    sketch1: { draw: (pg) => displayTreesMoving(pg) },
    sketch2: { draw: (pg) => displayTreesMoving(pg) },
    sketchOverlay: null,
    sketchSplit: { draw: (pg) => displayTreesSplit(pg) },
    sketch1Only: { draw: (pg) => displayTreesMoving(pg) },
  },

  {
    id: "reeds",
    durationSeconds: DURATION,
    sketch1: { draw: displayPirogueReeds },
    sketch2: null,
    sketchOverlay: null,
    sketchSplit: { draw: (pg) => displayTreesSplit(pg) },
    sketch1Only: {
      draw: (pg) => {
        displayPirogueScene(pg);
      },
      // onEnter: (pg) => {
      //   pirogue.setHeightFromBottom(0, pg);
      //   pirogue.x = 0;
      //   pirogue.scale = 1;
      // },
      onEnter: (pg) => {
        bird.x = 0;
        bird.scale = 1;
        bird.setHeightFromBottom(30, pg);
      },
    },
  },
];
