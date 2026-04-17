const mossSceneChains = [];

function setupMossScene(pg) {
  mossSceneChains.length = 0;
  const numBushes = 7;
  const chainsPerBush = 5;

  for (let b = 0; b < numBushes; b++) {
    const bushX = (b + 0.5) * (width / numBushes);
    for (let c = 0; c < chainsPerBush; c++) {
      const x = bushX + random(-25, 25);
      const len = random(80, 500);
      const chain = new MossChain(x, 0, len, 1.2, pg);
      const preGrowSteps = int(random(30, 400));
      for (let s = 0; s < preGrowSteps; s++) {
        chain.update([]);
        chain.grow(2);
      }
      mossSceneChains.push(chain);
    }
  }
}

function displayMossScene(pg = scene2D) {
  pg.background(0);

  const repelX = getPoseX();
  const repelY = pg.height * 0.3;
  for (const chain of mossSceneChains) {
    chain.applyRepulsion(repelX, repelY, 200, 0.8);
    chain.update([]);
    chain.grow(0.5);
    chain.display(pg);
  }
}
