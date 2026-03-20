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

let poseReady = false;

const poseState = {
  active: false,
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
let shouldInvert = false;
let debugMode = true;

let director;

const trees = [];

function preload() {
  bodyPose = ml5.bodyPose("BlazePose", { flipped: true });
  gatorImg = loadImage("./assets/gator.png");
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
  });
}

function setup() {
  pixelDensity(1);
  const c = createCanvas(windowWidth, windowHeight);
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
    this,
  );

  textFont(font);

  createLayeredStars();

  for (let i = 0; i < 6; i++) {
    pirogue.imgs[i].resize(0, 500);
  }
  pirogue.y = 100;

  initTrees();
  initBird();
  setupLotus();
  setupDuckweed();
  setupMossScene();

  setStatus("Ready. Click Start Camera.");
}
function draw() {
  renderFrameCount++;
  push();

  if (shouldInvert) {
    scale(-1, 1);
    translate(-width, 0);
  }

  background(0);

  const activeSceneId = director.scenes[director.activeIndex]?.id;
  if (activeSceneId !== "duckweed" && activeSceneId !== "moss") drawStars();
  noCursor();

  director.update(deltaTime, this);
  director.draw(this);

  if (debugMode) debugPose();

  pop();
  displayFrameRate();
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
  updateFPS();
  fill("red");
  noStroke();
  textSize(20);

  text(`render FPS: ${renderFPS}`, width - 200, 150);
  text(`pose FPS: ${poseFPS}`, width - 200, 180);
}

function debugPose() {
  push();
  resetMatrix();

  fill(255);
  noStroke();
  textSize(20);
  text(`poseReady: ${poseReady}`, 20, 90);
  text(`pose active: ${poseState.active}`, 20, 120);
  text(`poses: ${mlPoses.length}`, 20, 150);

  if (!poseState.active) { pop(); return; }

  const landmarks = [
    { pt: poseState.nose,        label: "nose",         col: [255, 80, 80] },
    { pt: poseState.leftWrist,   label: "left wrist",   col: [80, 255, 80] },
    { pt: poseState.rightWrist,  label: "right wrist",  col: [80, 180, 255] },
    { pt: poseState.bodyCenter,  label: "body center",  col: [255, 255, 80] },
  ];

  for (const { pt, label, col } of landmarks) {
    if (!pt) continue;
    fill(...col);
    noStroke();
    circle(pt.x, pt.y, 24);
    textSize(14);
    text(label, pt.x + 16, pt.y + 5);
  }

  pop();
}

function createLayeredStars() {
  stars = [];
  for (let i = 0; i < 100; i++) stars.push(new Star(1)); // close
  for (let i = 0; i < 150; i++) stars.push(new Star(2)); // mid
  for (let i = 0; i < 200; i++) stars.push(new Star(3)); // far
}

function drawStars() {
  for (let s of stars) {
    s.update();
    s.display(xPosition);
  }
}

// yBase: vertical center of the water line
// xPosition: your camera / world offset
function drawWaterBand(
  yBase = 500,
  xPosition = 0,
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

  noStroke();
  if (hasOutline) {
    stroke(255);
    strokeWeight(2);
  }

  fill(0); // black water

  const t = millis() * noiseSpeed; // time dimension for noise

  beginShape();

  // left bottom corner
  vertex(-100, yBase + bandDepth);
  // left side up into the wave
  // (optional, but keeps shape nice and closed)
  // vertex(0, yBase);

  for (let x = 0; x <= width + 50; x += step) {
    // worldX shifts with xPosition so the pattern "sticks" to the world
    const worldX = x + xPosition * parallax;
    const n = noise(worldX * noiseScaleX, t); // 0..1
    const offset = (n - 0.5) * 2 * amp; // -amp..amp
    const y = yBase + offset;
    vertex(x, y);
  }

  // right side back down to bottom
  vertex(width, yBase + bandDepth);

  endShape(CLOSE);
}

function displayOutline() {
  noFill();
  strokeWeight(10);
  stroke(255);
  rect(0, 0, width, height);
  pop();
}

function resetAnimation() {
  textFont(font);
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
  }
}

function initBird() {
  bird.y = height - 180;

  for (let i = 0; i < bird.imgs.length; i++) {
    bird.imgs[i].resize(0, 180);
  }
}

function initTrees() {
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
      trees.push(new Cypress(x, treeImg, treeFactor, mossLocations));
      x += treeImg.width * treeFactor + 100;
    } else {
      const treeFactor = 0.38;
      const mossLocations = [
        { x: 300, y: 1100, numSegments: 5, mossScale: 1 },
        { x: 850, y: 60, numSegments: 4, mossScale: 1 },
        { x: 1100, y: 800, numSegments: 5, mossScale: 1 },
      ];
      trees.push(new Cypress(x, treeImg2, treeFactor, mossLocations));
      x += treeImg2.width * treeFactor + 100;
    }
  }
}
function scaleLandmark(kp) {
  // ml5 returns pixel coords in video space; scale to canvas
  return {
    x: kp.x * (width / mlVideo.width),
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

const POSE_SMOOTH = 0.25;       // 0 = frozen, 1 = no smoothing
const POSE_HOLD_MS = 1000;      // keep last position this long after detection drops
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
  if (!mlPoses.length) {
    if (performance.now() - lastPoseDetectedTime > POSE_HOLD_MS) {
      poseState.active = false;
    }
    return;
  }

  const pose = mlPoses[0];
  const kp = {};
  for (const k of pose.keypoints) kp[k.name] = k;

  const leftShoulder  = kp["left_shoulder"];
  const rightShoulder = kp["right_shoulder"];
  const nose          = kp["nose"];
  const leftWrist     = kp["left_wrist"];
  const rightWrist    = kp["right_wrist"];

  if (!leftShoulder || !rightShoulder ||
      leftShoulder.score < POSE_MIN_VISIBILITY ||
      rightShoulder.score < POSE_MIN_VISIBILITY) {
    if (performance.now() - lastPoseDetectedTime > POSE_HOLD_MS) {
      poseState.active = false;
    }
    return;
  }

  lastPoseDetectedTime = performance.now();
  poseState.active = true;

  poseState.nose          = nose      ? smoothLandmark(poseState.nose,          scaleLandmark(nose))          : null;
  poseState.leftShoulder  =             smoothLandmark(poseState.leftShoulder,  scaleLandmark(leftShoulder));
  poseState.rightShoulder =             smoothLandmark(poseState.rightShoulder, scaleLandmark(rightShoulder));
  poseState.leftWrist     = leftWrist  ? smoothLandmark(poseState.leftWrist,    scaleLandmark(leftWrist))     : null;
  poseState.rightWrist    = rightWrist ? smoothLandmark(poseState.rightWrist,   scaleLandmark(rightWrist))    : null;
  poseState.bodyCenter    = midpoint(poseState.leftShoulder, poseState.rightShoulder);

  if (poseState.leftWrist && poseState.rightWrist) {
    poseState.handSpan = dist2D(poseState.leftWrist, poseState.rightWrist);
  } else {
    poseState.handSpan = 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
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
