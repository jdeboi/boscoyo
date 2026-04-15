let fullTree;
let croppedTreeTall;
let leaningTree;
let fullBaldTree;
let treeArm;

function getTreeArm(pg) {
  treeScale = 1;
  const mossLocations = [
    { x: 110, y: 80, numSegments: 6, mossScale: 0.6 },
    { x: 310, y: 280, numSegments: 5, mossScale: 0.75 },
  ];
  treeArm = new Cypress(0, treeArmImg, treeScale, mossLocations, pg);
  return treeArm;
}

function getFullTree(x, pg) {
  const treeScale = 0.5;
  const mossLocations = [
    { x: 90, y: 390, numSegments: 5, mossScale: 0.65 },
    { x: 210, y: 120, numSegments: 4, mossScale: 0.5 },
    { x: 450, y: 320, numSegments: 5, mossScale: 0.7 },
  ];
  fullTree = new Cypress(x, fullTreeImg, treeScale, mossLocations, pg);
  return fullTree;
}

function getCroppedTreeFull(x, pg) {
  const treeScale = 1;
  const mossLocations = [
    { x: 100, y: 90, numSegments: 5, mossScale: 0.8 },
    { x: 600, y: 200, numSegments: 4, mossScale: 0.8 },
    { x: 450, y: 410, numSegments: 5, mossScale: 0.6 },
  ];
  croppedTreeTall = new Cypress(
    x,
    croppedTreeTallImg,
    treeScale,
    mossLocations,
    pg,
  );
  return croppedTreeTall;
}

function getLeaningTree(x, pg) {
  const treeScale = 1;
  const mossLocations = [
    { x: 162, y: 125, numSegments: 5, mossScale: 0.65 },
    { x: 420, y: 215, numSegments: 4, mossScale: 0.75 },
    { x: 200, y: 330, numSegments: 5, mossScale: 0.65 },
    { x: 50, y: 470, numSegments: 5, mossScale: 0.5 },
  ];
  leaningTree = new Cypress(x, leaningTreeImg, treeScale, mossLocations, pg);
  return leaningTree;
}

function getFullBaldTree(x, pg) {
  const treeScale = 1;
  const mossLocations = [
    { x: 110, y: 140, numSegments: 5, mossScale: 0.6 },
    { x: 50, y: 320, numSegments: 4, mossScale: 0.72 },
    { x: 350, y: 300, numSegments: 5, mossScale: 0.5 },
    { x: 400, y: 450, numSegments: 5, mossScale: 0.65 },
  ];
  fullBaldTree = new Cypress(x, fullBaldTreeImg, treeScale, mossLocations, pg);
  return fullBaldTree;
}

const TREE_GAP = 300;

function initTrees(pg = scene2D) {
  const treeSz = 1;
  // resize tree images to ~2x their display size for perf (scale * 2 + buffer)
  fullTreeImg.resize(0, Math.round(fullTreeImg.height * (0.22 * 2) * treeSz));
  croppedTreeTallImg.resize(
    0,
    Math.round(croppedTreeTallImg.height * 0.47 * treeSz),
  );
  leaningTreeImg.resize(0, Math.round(leaningTreeImg.height * 0.45 * treeSz));
  fullBaldTreeImg.resize(0, Math.round(fullBaldTreeImg.height * 0.25 * treeSz));

  treeArmImg.resize(0, pg.height);

  treeArm = getTreeArm(pg);

  let x = 0;
  const factories = [
    getCroppedTreeFull,
    getFullTree,
    getLeaningTree,
    getFullBaldTree,
  ];
  for (const factory of factories) {
    const tree = factory(x, pg);
    trees.push(tree);
    x += tree.getWidth() + TREE_GAP;
  }
}
