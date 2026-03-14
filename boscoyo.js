let FilesetResolver = null;
let PoseLandmarker = null;

let renderFrameCount = 0;
let poseFrameCount = 0;
let renderFPS = 0;
let poseFPS = 0;
let lastFPSTime = 0;
let lastRenderCount = 0;
let lastPoseCount = 0;

let videoEl;
let poseLandmarker = null;
let latestLandmarks = [];
let lastVideoTime = -1;
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

// let mossBushes = [];
let xPosition = 0;
let treeImg;
let treeImg2;
// let projectedText;
let font;
let rotateProjector = false;
let stars = [];
let pMapper;
let textQuadMap;
let textLayer;
let moveForward = false;
let shouldInvert = false;

let director;

const trees = [];

function preload() {
  loadLotusImgs();
  treeImg = loadImage("./assets/tree.png");
  treeImg2 = loadImage("./assets/jotree.png");
  // font = loadFont("../shared/assets/LESNOIR.ttf");
  // font = loadFont("../shared/assets/Orleans City.otf");
  font = loadFont("./assets/PARISREBEL.ttf");
  for (let i = 1; i < 13; i++) {
    bird.imgs[i - 1] = loadImage("./assets/walk/" + i + ".png");
  }
  for (let i = 0; i < 6; i++) {
    pirogue.imgs[i] = loadImage("./assets/Pirogues/" + i + ".png");
  }
}
async function setupCamera() {
  setStatus("Requesting camera access...");

  videoEl = document.createElement("video");
  videoEl.autoplay = true;
  videoEl.playsInline = true;
  videoEl.muted = true;
  videoEl.setAttribute("autoplay", "");
  videoEl.setAttribute("muted", "");
  videoEl.setAttribute("playsinline", "");
  videoEl.style.display = "none";
  document.body.appendChild(videoEl);

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30 },
    },
    audio: false,
  });

  videoEl.srcObject = stream;

  await new Promise((resolve) => {
    videoEl.onloadedmetadata = () => resolve();
  });

  await videoEl.play();

  console.log("Camera ready", videoEl.videoWidth, videoEl.videoHeight);
  setStatus(`Camera ready: ${videoEl.videoWidth} x ${videoEl.videoHeight}`);
}

async function setupPose() {
  setStatus("Loading pose model...");

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  poseReady = true;
  console.log("Pose model loaded");
  setStatus("Pose model loaded");
}

async function loadMediaPipe() {
  if (FilesetResolver && PoseLandmarker) return;

  const mp =
    await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14");

  FilesetResolver = mp.FilesetResolver;
  PoseLandmarker = mp.PoseLandmarker;
}
async function initPoseSystem() {
  try {
    setStatus("Loading MediaPipe...");
    await loadMediaPipe();
    await setupCamera();
    await setupPose();
    console.log("Pose system ready");
    setStatus("Pose system ready");
  } catch (err) {
    console.error("Pose setup failed:", err);
    setStatus(`Pose setup failed: ${err.message || err}`);
    throw err;
  }
}

function setup() {
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

  updatePoseDetection();

  drawStars();
  noCursor();

  director.update(deltaTime, this);
  director.draw(this);

  debugPose();

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
  text(`video ready: ${videoEl ? videoEl.readyState : "no video"}`, 20, 120);
  text(`pose active: ${poseState.active}`, 20, 150);
  text(`landmarks: ${latestLandmarks.length}`, 20, 180);

  if (!videoEl || videoEl.readyState < 2) {
    text("camera not ready", 20, 210);
    pop();
    return;
  }

  // draw a small camera preview so you know the feed is alive
  drawingContext.drawImage(videoEl, 20, 220, 320, 240);

  if (poseState.nose) {
    fill(255, 0, 0);
    circle(poseState.nose.x, poseState.nose.y, 30);
  }

  if (poseState.leftWrist) {
    fill(0, 255, 0);
    circle(poseState.leftWrist.x, poseState.leftWrist.y, 30);
  }

  if (poseState.rightWrist) {
    fill(0, 0, 255);
    circle(poseState.rightWrist.x, poseState.rightWrist.y, 30);
  }

  if (poseState.bodyCenter) {
    fill(255, 255, 0);
    circle(poseState.bodyCenter.x, poseState.bodyCenter.y, 36);
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
function updatePoseDetection() {
  if (!poseLandmarker || !videoEl) return;
  if (videoEl.readyState < 2) return;

  if (videoEl.currentTime !== lastVideoTime) {
    lastVideoTime = videoEl.currentTime;

    poseFrameCount++;

    const result = poseLandmarker.detectForVideo(videoEl, performance.now());
    latestLandmarks = result.landmarks || [];
    updatePoseState();
  }
}
function mirrorLandmark(lm) {
  return {
    x: width - lm.x * width,
    y: lm.y * height,
    z: lm.z,
    visibility: lm.visibility ?? 1,
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

function updatePoseState() {
  if (!latestLandmarks.length) {
    poseState.active = false;
    poseState.nose = null;
    poseState.leftWrist = null;
    poseState.rightWrist = null;
    poseState.leftShoulder = null;
    poseState.rightShoulder = null;
    poseState.bodyCenter = null;
    poseState.handSpan = 0;
    return;
  }

  const pose = latestLandmarks[0];

  const nose = pose[0];
  const leftShoulder = pose[11];
  const rightShoulder = pose[12];
  const leftWrist = pose[15];
  const rightWrist = pose[16];

  if (!leftShoulder || !rightShoulder) {
    poseState.active = false;
    return;
  }

  poseState.active = true;
  poseState.nose = nose ? mirrorLandmark(nose) : null;
  poseState.leftShoulder = mirrorLandmark(leftShoulder);
  poseState.rightShoulder = mirrorLandmark(rightShoulder);
  poseState.leftWrist = leftWrist ? mirrorLandmark(leftWrist) : null;
  poseState.rightWrist = rightWrist ? mirrorLandmark(rightWrist) : null;
  poseState.bodyCenter = midpoint(
    poseState.leftShoulder,
    poseState.rightShoulder,
  );

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
  startBtn.addEventListener("click", async () => {
    try {
      startBtn.disabled = true;
      setStatus("Starting camera...");
      await initPoseSystem();
      setStatus("Pose system ready");
    } catch (err) {
      console.error(err);
      setStatus("Pose setup failed");
      startBtn.disabled = false;
    }
  });
}
