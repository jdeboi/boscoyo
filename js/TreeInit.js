function getFullTree(x, pg) {
  const treeScale = 1;
  const mossLocations = [
    { x: 90, y: 390, numSegments: 5, mossScale: 0.65 },
    { x: 210, y: 120, numSegments: 4, mossScale: 0.5 },
    { x: 450, y: 320, numSegments: 5, mossScale: 0.7 },
  ];
  return new Cypress(x, fullTreeImg, treeScale, mossLocations, pg);
}

function getCroppedTreeFull(x, pg) {
  const treeScale = 1;
  const mossLocations = [
    { x: 100, y: 70, numSegments: 5, mossScale: 0.8 },
    { x: 600, y: 190, numSegments: 4, mossScale: 0.8 },
    { x: 450, y: 360, numSegments: 5, mossScale: 0.6 },
  ];
  return new Cypress(x, croppedTreeTallImg, treeScale, mossLocations, pg);
}

function getLeaningTree(x, pg) {
  const treeScale = 1;
  const mossLocations = [
    { x: 162, y: 115, numSegments: 5, mossScale: 0.65 },
    { x: 420, y: 195, numSegments: 4, mossScale: 0.75 },
    { x: 200, y: 280, numSegments: 5, mossScale: 0.65 },
    { x: 50, y: 420, numSegments: 5, mossScale: 0.5 },
  ];
  return new Cypress(x, leaningTreeImg, treeScale, mossLocations, pg);
}

function getFullBaldTree(x, pg) {
  const treeScale = 0.5;
  const mossLocations = [
    { x: 110, y: 140, numSegments: 5, mossScale: 0.6 },
    { x: 50, y: 320, numSegments: 4, mossScale: 0.72 },
    { x: 350, y: 300, numSegments: 5, mossScale: 0.5 },
    { x: 400, y: 450, numSegments: 5, mossScale: 0.65 },
  ];
  return new Cypress(x, fullBaldTreeImg, treeScale, mossLocations, pg);
}

function initTrees(pg = scene2D) {
  let x = 0;
  for (let i = 0; i < 6; i++) {
    let tree;

    if (i % 4 == 0) {
      tree = getCroppedTreeFull(x, pg);
    } else if (i % 4 == 1) {
      tree = getFullTree(x, pg);
    } else if (i % 4 == 2) {
      tree = getLeaningTree(x, pg);
    } else if (i % 4 == 3) {
      tree = getFullBaldTree(x, pg);
    }
    trees.push(tree);
    x += tree.getWidth() + 100;
  }
}
