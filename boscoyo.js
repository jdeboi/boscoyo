let bodyPose;
let mlVideo;
let mlPoses = [];

let renderFrameCount = 0;
let poseFrameCount = 0;
let renderFPS = 0;
let poseFPS = 0;
let lastFPSTime = 0;
let lastRenderCount = 0;
let lastPoseCount = 0;

let mappedSurface1, mappedSurface2;
let scene2D;

let poseReady = false;
const drawOutline = false;

const poseState = {
  active: false,
  bodies: [], // all detected people
  // first body mirrored here for backwards compat
  nose: null,
  leftWrist: null,
  rightWrist: null,
  leftShoulder: null,
  rightShoulder: null,
  bodyCenter: null,
  handSpan: 0,
};

let xPosition = 0;
let treeImg;
let treeImg2;
let gatorImg;
let font;
let stars = [];
let pMapper;
let moveForward = false;
let shouldInvert = true;
let debugMode = true;
let previewMode = true;
let mouseMode = true;    // toggle with 'm'
let invertPoseX = true;  // mirror pose X coords; toggle with 'x'

// --- sync ---
const SYNC_SERVER_URL = `ws://${location.host}`;
const syncRole = new URLSearchParams(location.search).get("role"); // "leader" | "follower"
let syncSocket = null;
let lastSyncedSceneIndex = -1;

let director;

const trees = [];

function preload() {
  bodyPose = ml5.bodyPose("MoveNet", {
    flipped: true,
    modelType: "MULTIPOSE_LIGHTNING",
  });
  gatorImg = loadImage("./assets/Gator1.png");
  loadLotusImgs();
  treeImg = loadImage("./assets/tree.png");
  treeImg2 = loadImage("./assets/jotree.png");
  font = loadFont("./assets/PARISREBEL.ttf");
  for (let i = 1; i < 13; i++) {
    bird.imgs[i - 1] = loadImage("./assets/walk/" + i + ".png");
  }
  for (let i = 0; i < 6; i++) {
    pirogue.imgs[i] = loadImage("./assets/Pirogues/" + i + ".png");
  }
}
function initPoseSystem() {
  setStatus("Starting camera...");
  mlVideo = createCapture(VIDEO);
  mlVideo.size(480, 360);
  mlVideo.hide();

  bodyPose.detectStart(mlVideo, (results) => {
    mlPoses = results;
    poseFrameCount++;
    if (!poseReady) {
      poseReady = true;
      setStatus("Pose system ready");
    }
    updatePoseState();
    sendPoseSync();
  });
}

function setup() {
  pixelDensity(1);
  const c = createCanvas(windowWidth, windowHeight, WEBGL);
  scene2D = createGraphics(width, height);

  c.position(0, 0);
  c.style("position", "fixed");
  c.style("left", "0");
  c.style("top", "0");
  c.style("z-index", "0");

  director = new SceneDirector(
    scenes,
    {
      loop: true,
      startAtSceneId: START_SCENE_ID,
    },
    scene2D,
  );

  scene2D.textFont(font);
  textFont(font);

  createLayeredStars(scene2D);

  for (let i = 0; i < 6; i++) {
    pirogue.imgs[i].resize(0, 500);
  }
  pirogue.y = 100;

  initTrees(scene2D);
  initBird(scene2D);
  setupLotus();
  setupDuckweed();
  setupMossScene(scene2D);
  setupPirogueScene(scene2D);

  initProjectionMapper();
  pMapper.load("maps/map.json");
  initSync();

  if (syncRole === "leader") initPoseSystem();
}
function draw() {
  if (mouseMode && syncRole !== "follower") {
    const mouseBody = {
      bodyCenter: { x: mouseX, y: mouseY },
      nose: null, leftShoulder: null, rightShoulder: null,
      leftWrist: null, rightWrist: null, handSpan: 0,
    };
    poseState.active = true;
    poseState.bodies = [mouseBody];
    poseState.bodyCenter = mouseBody.bodyCenter;
    if (syncRole === "leader") sendPoseSync();
  }

  background(0);
  renderFrameCount++;
  push();

  scene2D.push();
  scene2D.background(0);

  const activeSceneId = director.scenes[director.activeIndex]?.id;
  const scenesWithoutStars = [
    "duckweed",
    "moss",
    "pirogueScene",
    "pirogueOnly",
  ];
  if (!scenesWithoutStars.includes(activeSceneId)) drawStars(scene2D);
  // noCursor();

  director.update(deltaTime, scene2D);
  director.draw(scene2D);

  if (syncRole === "leader" && director.activeIndex !== lastSyncedSceneIndex) {
    lastSyncedSceneIndex = director.activeIndex;
    sendSceneSync();
  }

  if (debugMode) debugPose(scene2D);

  if (drawOutline) {
    scene2D.push();
    scene2D.noFill();
    scene2D.stroke(255);
    scene2D.strokeWeight(10);
    scene2D.rect(0, 0, scene2D.width, scene2D.height);
    scene2D.pop();
  }

  scene2D.pop();

  if (previewMode) {
    image(scene2D, -width / 2, -height / 2, width, height);
  } else {
    mappedSurface1.displayTexture(scene2D, 0, 0, width / 2, height);
    mappedSurface2.displayTexture(scene2D, width / 2, 0, width / 2, height);
  }
  displayFrameRate();
  pop();
}

function updateFPS() {
  const now = millis();

  if (now - lastFPSTime > 1000) {
    renderFPS = renderFrameCount - lastRenderCount;
    poseFPS = poseFrameCount - lastPoseCount;

    lastRenderCount = renderFrameCount;
    lastPoseCount = poseFrameCount;
    lastFPSTime = now;
  }
}
function displayFrameRate() {
  if (!debugMode) return;
  updateFPS();
  fill("red");
  noStroke();
  textSize(20);

  push();
  translate(-width / 2, -height / 2);
  text(`render FPS: ${renderFPS}`, width - 200, 150);
  text(`pose FPS: ${poseFPS}`, width - 200, 180);
  pop();
}

function debugPose(pg = scene2D) {
  pg.push();
  pg.resetMatrix();

  pg.fill(255);
  pg.noStroke();
  pg.textSize(20);
  pg.text(`poseReady: ${poseReady}`, 20, 90);
  pg.text(`pose active: ${poseState.active}`, 20, 120);
  pg.text(`poses: ${mlPoses.length}`, 20, 150);
  if (!poseState.active) {
    pg.pop();
    return;
  }

  const landmarks = [
    { pt: poseState.nose, label: "nose", col: [255, 80, 80] },
    { pt: poseState.leftWrist, label: "left wrist", col: [80, 255, 80] },
    { pt: poseState.rightWrist, label: "right wrist", col: [80, 180, 255] },
    { pt: poseState.bodyCenter, label: "body center", col: [255, 255, 80] },
  ];

  for (const { pt, label, col } of landmarks) {
    if (!pt) continue;
    pg.fill(...col);
    pg.noStroke();
    pg.circle(pt.x, pt.y, 24);
    pg.textSize(14);
    pg.text(label, pt.x + 16, pt.y + 5);
  }

  pg.pop();
}

function createLayeredStars(scene) {
  stars = [];
  for (let i = 0; i < 100; i++) stars.push(new Star(1, scene)); // close
  for (let i = 0; i < 150; i++) stars.push(new Star(2, scene)); // mid
  for (let i = 0; i < 200; i++) stars.push(new Star(3, scene)); // far
}

function drawStars(pg) {
  for (let s of stars) {
    s.update(pg);
    s.display(xPosition, pg);
  }
}

// yBase: vertical center of the water line
// xPosition: your camera / world offset
function drawWaterBand(
  yBase = 500,
  xPosition = 0,
  pg = scene2D,
  {
    amp = 30, // vertical wave amplitude in pixels
    step = 8, // horizontal resolution (smaller = smoother, slower)
    bandDepth = null, // how far down to fill; default = to bottom of screen
    parallax = 1, // how much water shifts with xPosition
    noiseScaleX = 0.002, // horizontal noise frequency
    noiseSpeed = 0.0003, // animation speed over time
    hasOutline = false,
  } = {},
) {
  if (bandDepth === null) bandDepth = height - yBase;

  pg.noStroke();
  if (hasOutline) {
    pg.stroke(255);
    pg.strokeWeight(2);
  }

  pg.fill(0); // black water

  const t = millis() * noiseSpeed; // time dimension for noise

  pg.beginShape();
  // left bottom corner
  pg.vertex(-100, yBase + bandDepth);
  // left side up into the wave
  // (optional, but keeps shape nice and closed)
  // vertex(0, yBase);

  for (let x = 0; x <= width + 50; x += step) {
    // worldX shifts with xPosition so the pattern "sticks" to the world
    const worldX = x + xPosition * parallax;
    const n = noise(worldX * noiseScaleX, t); // 0..1
    const offset = (n - 0.5) * 2 * amp; // -amp..amp
    const y = yBase + offset;
    pg.vertex(x, y);
  }

  // right side back down to bottom
  pg.vertex(width, yBase + bandDepth);
  pg.endShape(CLOSE);
}

function displayOutline(pg = scene2D) {
  pg.noFill();
  pg.strokeWeight(10);
  pg.stroke(255);
  pg.rect(0, 0, width, height);
  pg.pop();
}

function resetAnimation(pg = scene2D) {
  pg.textFont(font);
  moveForward = false;
  xPosition = 0;
  trees.forEach((tree) => tree.reset());
  pirogue.reset();
  bird.x = 0;
}

function keyPressed() {
  switch (key) {
    case "i":
      shouldInvert = !shouldInvert;
      break;
    case "d":
      debugMode = !debugMode;
      break;
    case "m":
      mouseMode = !mouseMode;
      break;
    case "x":
      invertPoseX = !invertPoseX;
      break;
    case "p":
      previewMode = !previewMode;
      break;
    case "c":
      pMapper.toggleCalibration();
      break;
    case "f":
      let fs = fullscreen();
      fullscreen(!fs);
      break;
    case "l":
      pMapper.load("maps/map.json");
      break;

    case "s":
      pMapper.save("map.json");
      break;
    case "ArrowRight": {
      const next = (director.activeIndex + 1) % director.scenes.length;
      director.goToScene(director.scenes[next].id);
      return false;
    }
    case "ArrowLeft": {
      const prev =
        (director.activeIndex - 1 + director.scenes.length) %
        director.scenes.length;
      director.goToScene(director.scenes[prev].id);
      return false;
    }
  }
}

function initBird(pg = scene2D) {
  bird.y = pg.height - 180;

  for (let i = 0; i < bird.imgs.length; i++) {
    bird.imgs[i].resize(0, 180);
  }
}

function initTrees(pg = scene2D) {
  treeImg2.resize(treeImg2.width * 0.58, 0);
  let x = 0;
  for (let i = 0; i < 5; i++) {
    if (i % 2 == 0) {
      const treeFactor = 0.4;
      const mossLocations = [
        { x: 400, y: 220, numSegments: 5, mossScale: 1.2 },
        { x: 1200, y: 100, numSegments: 4, mossScale: 1.2 },
        { x: 1400, y: 990, numSegments: 5, mossScale: 1.3 },
      ];
      trees.push(new Cypress(x, treeImg, treeFactor, mossLocations, pg));
      x += treeImg.width * treeFactor + 100;
    } else {
      const treeFactor = 0.38;
      const mossLocations = [
        { x: 300, y: 1100, numSegments: 5, mossScale: 1 },
        { x: 850, y: 60, numSegments: 4, mossScale: 1 },
        { x: 1100, y: 800, numSegments: 5, mossScale: 1 },
      ];
      trees.push(new Cypress(x, treeImg2, treeFactor, mossLocations, pg));
      x += treeImg2.width * treeFactor + 100;
    }
  }
}
function scaleLandmark(kp) {
  // ml5 returns pixel coords in video space; scale to canvas
  const x = kp.x * (width / mlVideo.width);
  return {
    x: invertPoseX ? width - x : x,
    y: kp.y * (height / mlVideo.height),
    z: kp.z ?? 0,
    visibility: kp.score ?? 1,
  };
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function dist2D(a, b) {
  return dist(a.x, a.y, b.x, b.y);
}

const POSE_SMOOTH = 0.25; // 0 = frozen, 1 = no smoothing
const POSE_HOLD_MS = 1000; // keep last position this long after detection drops
const POSE_MIN_VISIBILITY = 0.5; // landmarks below this are treated as absent
let lastPoseDetectedTime = 0;

function smoothLandmark(current, next) {
  if (!current) return next;
  return {
    x: lerp(current.x, next.x, POSE_SMOOTH),
    y: lerp(current.y, next.y, POSE_SMOOTH),
    z: lerp(current.z, next.z, POSE_SMOOTH),
    visibility: next.visibility,
  };
}

function updatePoseState() {
  const now = performance.now();

  if (!mlPoses.length) {
    if (now - lastPoseDetectedTime > POSE_HOLD_MS) {
      poseState.active = false;
      poseState.bodies = [];
    }
    return;
  }

  const newBodies = [];
  for (let i = 0; i < mlPoses.length; i++) {
    const pose = mlPoses[i];
    const kp = {};
    for (const k of pose.keypoints) kp[k.name] = k;

    const leftShoulder = kp["left_shoulder"];
    const rightShoulder = kp["right_shoulder"];
    if (
      !leftShoulder ||
      !rightShoulder ||
      leftShoulder.score < POSE_MIN_VISIBILITY ||
      rightShoulder.score < POSE_MIN_VISIBILITY
    )
      continue;

    const prev = poseState.bodies[i] ?? {};
    const nose = kp["nose"];
    const leftWrist = kp["left_wrist"];
    const rightWrist = kp["right_wrist"];

    const sLS = smoothLandmark(prev.leftShoulder, scaleLandmark(leftShoulder));
    const sRS = smoothLandmark(
      prev.rightShoulder,
      scaleLandmark(rightShoulder),
    );

    const body = {
      nose: nose ? smoothLandmark(prev.nose, scaleLandmark(nose)) : null,
      leftShoulder: sLS,
      rightShoulder: sRS,
      leftWrist: leftWrist
        ? smoothLandmark(prev.leftWrist, scaleLandmark(leftWrist))
        : null,
      rightWrist: rightWrist
        ? smoothLandmark(prev.rightWrist, scaleLandmark(rightWrist))
        : null,
      bodyCenter: midpoint(sLS, sRS),
      handSpan: 0,
    };
    if (body.leftWrist && body.rightWrist) {
      body.handSpan = dist2D(body.leftWrist, body.rightWrist);
    }
    newBodies.push(body);
  }

  if (!newBodies.length) {
    if (now - lastPoseDetectedTime > POSE_HOLD_MS) {
      poseState.active = false;
      poseState.bodies = [];
    }
    return;
  }

  lastPoseDetectedTime = now;
  poseState.bodies = newBodies;
  poseState.active = true;

  // mirror first body onto top-level fields for backwards compat
  const first = newBodies[0];
  poseState.nose = first.nose;
  poseState.leftShoulder = first.leftShoulder;
  poseState.rightShoulder = first.rightShoulder;
  poseState.leftWrist = first.leftWrist;
  poseState.rightWrist = first.rightWrist;
  poseState.bodyCenter = first.bodyCenter;
  poseState.handSpan = first.handSpan;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  recreateProjectionSurface();
}

const startBtn = document.getElementById("startBtn");
const statusEl = document.getElementById("status");

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}
if (startBtn) {
  startBtn.addEventListener("click", () => {
    startBtn.disabled = true;
    initPoseSystem();
  });
}

function initSync() {
  if (!syncRole) return;
  syncSocket = new WebSocket(SYNC_SERVER_URL);

  syncSocket.onopen = () => console.log(`sync connected as ${syncRole}`);
  syncSocket.onerror = (e) => console.warn("sync error", e);

  syncSocket.onmessage = ({ data }) => {
    if (syncRole !== "follower") return;
    const msg = JSON.parse(data);
    if (msg.type === "scene") {
      director.goToScene(msg.sceneId, { localSeconds: msg.localMs / 1000 });
      lastSyncedSceneIndex = director.activeIndex;
    } else if (msg.type === "pose") {
      poseState.active = msg.active;
      poseState.bodies = msg.bodies;
      const first = msg.bodies[0];
      if (first) {
        poseState.nose = first.nose;
        poseState.leftShoulder = first.leftShoulder;
        poseState.rightShoulder = first.rightShoulder;
        poseState.leftWrist = first.leftWrist;
        poseState.rightWrist = first.rightWrist;
        poseState.bodyCenter = first.bodyCenter;
        poseState.handSpan = first.handSpan;
      }
    }
  };
}

function sendPoseSync() {
  if (
    syncRole !== "leader" ||
    !syncSocket ||
    syncSocket.readyState !== WebSocket.OPEN
  )
    return;
  syncSocket.send(
    JSON.stringify({
      type: "pose",
      active: poseState.active,
      bodies: poseState.bodies,
    }),
  );
}

function sendSceneSync() {
  if (
    syncRole !== "leader" ||
    !syncSocket ||
    syncSocket.readyState !== WebSocket.OPEN
  )
    return;
  const active = director.scenes[director.activeIndex];
  if (!active) return;
  syncSocket.send(
    JSON.stringify({
      type: "scene",
      sceneId: active.id,
      localMs: director.t - active.startMs,
    }),
  );
}

function initProjectionMapper() {
  pMapper = createProjectionMapper(this);
  mappedSurface1 = pMapper.createQuadMap(width / 2, height, 8);
  mappedSurface2 = pMapper.createQuadMap(width / 2, height, 8);
}

function recreateProjectionSurface() {
  if (!mappedSurface1) return;
  mappedSurface1.setSize(width / 2, height);
  mappedSurface2.setSize(width / 2, height);
}
