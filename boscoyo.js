let bodyPose;
let mlVideo;
let cameraStream = null;
let cameraActive = false;
let mlPoses = [];

let renderFrameCount = 0;
let poseFrameCount = 0;
let renderFPS = 0;
let poseFPS = 0;
let lastFPSTime = 0;
let lastRenderCount = 0;
let lastPoseCount = 0;
let lastPoseTime = 0;
let lastPoseMsg = null; // raw last received pose message for debugging

const mappedSurfaces = [];
let scene2D;

let poseReady = false;

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
let starDrift = 0;

// imgs
let croppedTreeTallImg;
let fullTreeImg;
let treeArmImg;
let leaningTreeImg;
let fullBaldTreeImg;
let gatorHeadImg;
let gatorBackImg;
let reedImgs = [];
const gator = new Gator();

let font;
let stars = [];
let pMapper;
let moveForward = false;
let shouldInvert = false;
let debugMode = true;
let previewMode = true;
let invertPoseX = true; // mirror pose X coords; toggle with 'x'

// --- sync ---
const _syncParams = new URLSearchParams(location.search);
const syncRole = _syncParams.get("role"); // "leader" | "follower"
const _syncHost = _syncParams.get("sync"); // optional leader IP for offline-local-server mode
const cameraAllowed = _syncParams.get("camera") !== "0"; // set ?camera=0 to disable camera on this machine
let localPoseEnabled = _syncParams.get("localpose") === "1"; // sync scene changes but use own camera for pose
let mouseMode = cameraAllowed; // false when ?camera=0 (using dedicated pose computer); toggle with 'm'
const SYNC_SERVER_URL = _syncHost
  ? `ws://${_syncHost}:8080`
  : `ws://${location.host}`;
let syncSocket = null;
let lastSyncedSceneIndex = -1;

let director;
let lastPoseSyncTime = 0;
const POSE_SYNC_INTERVAL_MS = 50; // send pose at 20fps max

const trees = [];

function preload() {
  bodyPose = ml5.bodyPose("MoveNet", {
    flipped: true,
    modelType: "MULTIPOSE_LIGHTNING",
  });
  gatorHeadImg = loadImage("./assets/gator/head2.png");
  gatorBackImg = loadImage("./assets/gator/back4.png");
  loadLotusImgs();

  // croppedTreeTallImg = loadImage("./assets/trees/croppedTreeTall.png");
  croppedTreeTallImg = loadImage("./assets/trees/croppedTree.png");

  fullTreeImg = loadImage("./assets/trees/fullTree.png");
  leaningTreeImg = loadImage("./assets/trees/leaningTree.png");
  fullBaldTreeImg = loadImage("./assets/trees/fullBaldTree.png");
  treeArmImg = loadImage("./assets/trees/arm.png");

  font = loadFont("./assets/fonts/PARISREBEL.ttf");
  for (let i = 0; i < 12; i++) {
    bird.imgs[i] = loadImage("./assets/bird/walk2/" + i + ".png");
  }
  for (let i = 0; i < 6; i++) {
    flyBird.imgs[i] = loadImage("./assets/bird/fly/" + i + "_white.png");
  }
  for (let i = 0; i < 6; i++) {
    pirogue.imgs[i] = loadImage("./assets/Pirogues/" + i + ".png");
  }
  // for (let i = 0; i < 4; i++) {
  //   reedImgs[i] = loadImage("./assets/reed/plume_" + i + ".png");
  // }
}

function resizeImages() {
  for (let i = 0; i < bird.imgs.length; i++) {
    bird.imgs[i].resize(0, 400);
  }
  for (let i = 0; i < flyBird.imgs.length; i++) {
    flyBird.imgs[i].resize(0, 400);
  }
  for (let i = 0; i < pirogue.imgs.length; i++) {
    pirogue.imgs[i].resize(0, 500);
  }
  // for (let i = 0; i < reedImgs.length; i++) {
  //   reedImgs[i].resize(0, 80);
  // }
}
async function initPoseSystem() {
  if (cameraActive) return; // prevent double-start during async init
  cameraActive = true;
  setStatus("Starting camera...");

  try {
    // Open default camera first (grants permission + populates device labels)
    const permStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((d) => d.kind === "videoinput");
    console.log(
      "Available cameras:",
      cameras.map((c) => c.label),
    );

    const usb = cameras.find(
      (c) =>
        !c.label.toLowerCase().includes("facetime") &&
        !c.label.toLowerCase().includes("built-in"),
    );

    let stream;
    const currentDeviceId = permStream
      .getVideoTracks()[0]
      ?.getSettings().deviceId;
    if (usb && usb.deviceId !== currentDeviceId) {
      // Permission stream is the wrong camera — stop it and open the USB one
      permStream.getTracks().forEach((t) => t.stop());
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: usb.deviceId },
          width: 480,
          height: 360,
          frameRate: { ideal: 15, max: 20 },
        },
      });
      setStatus(`Using: ${usb.label}`);
    } else {
      // Already on the right camera — reuse the stream, apply constraints
      stream = permStream;
    }

    // Use a raw video element to avoid p5 createCapture permission conflicts
    const videoEl = document.createElement("video");
    videoEl.srcObject = stream;
    videoEl.width = 480;
    videoEl.height = 360;
    videoEl.playsInline = true;
    await videoEl.play();

    mlVideo = videoEl;
    cameraStream = stream;
    cameraActive = true;

    bodyPose.detectStart(mlVideo, (results) => {
      if (!cameraActive) return; // camera was stopped before this callback fired
      mlPoses = results;
      if (!poseReady) {
        poseReady = true;
        setStatus("Pose system ready");
      }
      updatePoseState();
      sendPoseSync();
    });
  } catch (e) {
    cameraActive = false; // allow retry
    setStatus("Camera error: " + e.message);
    console.error("initPoseSystem:", e);
  }
}

function stopPoseSystem() {
  bodyPose.detectStop();
  if (mlVideo) {
    mlVideo.srcObject = null; // release frame pipeline
  }
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  mlVideo = null;
  mlPoses = [];
  poseReady = false;
  cameraActive = false;
  poseState.active = false;
  poseState.bodies = [];
  setStatus("Camera off");
}

async function toggleCamera() {
  if (cameraActive) {
    stopPoseSystem();
  } else {
    await initPoseSystem();
  }
}

function setup() {
  pixelDensity(1);
  resizeImages();

  let cW = windowWidth;
  let cH = windowHeight;

  const c = createCanvas(1280, 800, WEBGL);
  scene2D = createGraphics(c.width, c.height);
  scene2D.pixelDensity(1);

  c.position(0, 0);
  c.style("position", "fixed");
  c.style("left", "0");
  c.style("top", "0");
  c.style("z-index", "0");

  const scenes = sceneCoordinator.map((entry) => {
    const config = entry[SKETCH_ID] ?? { draw: (pg) => pg.background(0) };
    return { id: entry.id, durationSeconds: entry.durationSeconds, ...config };
  });

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

  initTrees(scene2D);
  setupLotus();
  setupDuckweed();
  setupMossScene(scene2D);
  setupPirogueScene(scene2D);

  initProjectionMapper();
  // pMapper.load("maps/map.json");
  initSync();

  // Camera is started manually via the "Start Camera" button,
  // or left off when using a dedicated pose computer (/pose)
}

function draw() {
  if (mouseMode && syncRole !== "follower") {
    const mouseBody = {
      bodyCenter: { x: mouseX, y: mouseY },
      nose: null,
      leftShoulder: null,
      rightShoulder: null,
      leftWrist: null,
      rightWrist: null,
      handSpan: 0,
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

  // TEST A: comment this block out — does display get fast?
  const activeSceneId = director.scenes[director.activeIndex]?.id;
  const scenesWithoutStars = ["duckweed"];
  // TEST A1: comment out stars
  const isOverlay = SKETCH_ID === "sketchOverlay";
  const isSplit = SKETCH_ID === "sketchSplit";
  if (!scenesWithoutStars.includes(activeSceneId) && !(isOverlay || isSplit))
    drawStars(scene2D);

  // TEST A2: comment out scene
  director.update(deltaTime, scene2D);
  director.draw(scene2D);

  if (syncRole === "leader" && director.activeIndex !== lastSyncedSceneIndex) {
    lastSyncedSceneIndex = director.activeIndex;
    sendSceneSync();
  }

  if (debugMode) debugPose(scene2D);

  if (debugMode) {
    scene2D.push();
    scene2D.noFill();
    scene2D.stroke(255);
    scene2D.strokeWeight(10);
    scene2D.rect(0, 0, scene2D.width, scene2D.height);
    scene2D.pop();

    // if (isSplit) {
    displaySplitOutline(scene2D);
    // }
  }
  // END TEST A

  scene2D.pop();

  // TEST B: comment this block out — does fps recover without any display?
  if (previewMode) {
    image(scene2D, -width / 2, -height / 2, width, height);
  } else {
    const sw = width / mappedSurfaces.length;
    for (let i = 0; i < mappedSurfaces.length; i++) {
      mappedSurfaces[i].displayTexture(scene2D, i * sw, 0, sw, height);
    }
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
  textSize(200);

  push();
  translate(-width / 2, -height / 2);
  text(`${renderFPS}`, 200, 150);
  text(`${poseFPS}`, 200, 380);

  const sceneId = director?.scenes[director.activeIndex]?.id ?? "";
  textSize(60);
  text(sceneId, 20, height - 30);
  if (getIsAutoMove()) text("AUTO", 20, height - 100);
  if (localPoseEnabled) text("LOCAL POSE", 20, height - 170);
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
  pg.text(`bodies: ${poseState.bodies.length}`, 20, 150);
  pg.text(`mlPoses: ${mlPoses.length}`, 20, 180);
  const bc = poseState.bodyCenter;
  pg.text(
    `bodyCenter: ${bc ? `${bc.x.toFixed(0)}, ${bc.y.toFixed(0)}` : "null"}`,
    20,
    210,
  );
  pg.text(`mouseMode: ${mouseMode}`, 20, 240);
  pg.text(`canvas: ${width} x ${height}`, 20, 270);
  if (lastPoseMsg) {
    const rawBc = lastPoseMsg.bodies?.[0]?.bodyCenter;
    pg.text(
      `senderSize: ${lastPoseMsg.senderWidth} x ${lastPoseMsg.senderHeight}`,
      20,
      300,
    );
    pg.text(
      `raw bodyCenter: ${rawBc ? `${rawBc.x.toFixed(2)}, ${rawBc.y.toFixed(2)}` : "null"}`,
      20,
      330,
    );
  }
  if (!poseState.active) {
    pg.pop();
    return;
  }

  if (mouseMode) {
    const pt = poseState.bodyCenter;
    if (pt) {
      pg.fill(255, 140, 0);
      pg.noStroke();
      pg.circle(pt.x, pt.y, 24);
      pg.textSize(14);
      pg.fill(255, 140, 0);
      pg.text("mouse", pt.x + 16, pt.y + 5);
    }
  } else {
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
  const t = millis() / 1000;
  starDrift += 0.3; // slow continuous drift across all scenes
  pg.noStroke();
  for (let s of stars) {
    s.update(t);
    s.display(xPosition + starDrift);
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
    hasRipples = false,
    rippleRows = 7, // number of ripple depth bands
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

  for (let x = 0; x <= width + 50; x += step) {
    // worldX shifts with xPosition so the pattern "sticks" to the world
    const worldX = x + xPosition * parallax;
    const n = noise(worldX * noiseScaleX, t); // 0..1
    const offset = (n - 0.5) * 2 * amp; // -amp..amp
    const y = yBase + offset;
    pg.vertex(x, y);
  }

  // right side back down to bottom
  pg.vertex(width + 100, yBase + bandDepth);
  pg.endShape(CLOSE);

  // --- animated ripples ---
  if (!hasRipples) return;

  const tSec = millis() * 0.001;
  pg.noFill();

  for (let row = 0; row < rippleRows; row++) {
    const t_row = (row + 0.5) / rippleRows;
    const rowY = yBase + t_row * bandDepth;

    const rLen = lerp(14, 60, t_row); // stroke length
    const rAmp = lerp(1.5, 6, t_row); // sine wave height
    const sw = lerp(0.5, 2.0, t_row); // stroke weight
    const maxAlpha = lerp(130, 255, t_row);
    const spacing = lerp(42, 115, t_row); // x gap between ripples
    const waveSpeed = lerp(1.2, 2.8, t_row); // how fast the sine phase advances

    pg.strokeWeight(sw);

    const stagger = (row % 2) * (spacing * 0.5);
    const scroll =
      (((xPosition * parallax * 0.35 + stagger) % spacing) + spacing) % spacing;

    for (let lx = -spacing + scroll; lx < width + rLen; lx += spacing) {
      // world-stable seed so each ripple keeps its identity as camera scrolls
      const worldSlot = Math.round(
        (lx + xPosition * parallax * 0.35) / spacing,
      );
      const seed = row * 53.7 + worldSlot * 91.3;

      // independent lifecycle: sin²(phase) gives smooth 0→1→0 pulse
      const cycleSpeed = lerp(0.35, 0.9, noise(seed * 0.17));
      const lifePhase = tSec * cycleSpeed + noise(seed) * TWO_PI;
      const pulse = pow(max(0, sin(lifePhase)), 2);
      if (pulse < 0.04) continue;

      pg.stroke(255, maxAlpha * pulse);

      // small y jitter per slot, slowly drifting
      const yJitter =
        (noise(seed * 0.4, tSec * 0.08) - 0.5) * (bandDepth / rippleRows) * 0.5;
      const ry = rowY + yJitter;

      // phase advances over time → ripple crest slides horizontally
      const wavePhase = tSec * waveSpeed + seed;

      pg.beginShape();
      for (let i = 0; i <= 10; i++) {
        const fx = i / 10; // 0..1 along stroke length
        const px = lx - rLen * 0.5 + fx * rLen;
        const py = ry + sin(fx * TWO_PI + wavePhase) * rAmp;
        pg.vertex(px, py);
      }
      pg.endShape();
    }
  }
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
    case "k":
      if (cameraAllowed) toggleCamera();
      break;
    case "i":
      shouldInvert = !shouldInvert;
      break;
    case "d":
      debugMode = !debugMode;
      if (statusEl) statusEl.style.display = debugMode ? "block" : "none";
      break;
    case "m":
      mouseMode = !mouseMode;
      break;
    case "x":
      invertPoseX = !invertPoseX;
      break;
    case "o":
      localPoseEnabled = !localPoseEnabled;
      break;
    case "p":
      previewMode = !previewMode;
      break;
    case "c":
      pMapper.toggleCalibration();
      if (pMapper.calibrate) cursor();
      else noCursor();
      break;
    case "f":
      let fs = fullscreen();
      fullscreen(!fs);
      break;
    case "t":
      showtime();
      break;
    case "l":
      pMapper.load("maps/map.json");
      break;

    case "s":
      pMapper.save("map.json");
      break;
    case "ArrowRight": {
      if (syncRole !== "leader" && syncRole !== null) return false;
      const next = (director.activeIndex + 1) % director.scenes.length;
      director.goToScene(director.scenes[next].id);
      sendSceneSync();
      lastSyncedSceneIndex = director.activeIndex;
      return false;
    }
    case "ArrowLeft": {
      if (syncRole !== "leader" && syncRole !== null) return false;
      const prev =
        (director.activeIndex - 1 + director.scenes.length) %
        director.scenes.length;
      director.goToScene(director.scenes[prev].id);
      sendSceneSync();
      lastSyncedSceneIndex = director.activeIndex;
      return false;
    }
  }
}

async function showtime() {
  // if we're calibrating, turn that off
  if (pMapper.calibrate) {
    pMapper.toggleCalibration();
  }
  if (!cameraActive && cameraAllowed) await initPoseSystem();
  if (previewMode) previewMode = false;
  if (mouseMode) mouseMode = false;
  if (debugMode) {
    debugMode = false;
    if (statusEl) statusEl.style.display = "none";
  }
  shouldInvert = true;
  if (!fullscreen()) fullscreen(true);
  noCursor();
}

function scaleLandmark(kp) {
  if (!kp || !mlVideo) return null;
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
const PRIMARY_SWITCH_TIMEOUT = 3000; // ms absent before switching to a new primary person
const PRIMARY_MATCH_RADIUS = 0.4; // fraction of canvas width to consider "same person"
let lastPoseDetectedTime = 0;
let primaryBodyCenter = null; // last known position of the tracked person
let primaryLostTime = 0; // when primary person was last missing

function smoothLandmark(current, next) {
  if (!current) return next;
  return {
    x: lerp(current.x, next.x, POSE_SMOOTH),
    y: lerp(current.y, next.y, POSE_SMOOTH),
    z: lerp(current.z, next.z, POSE_SMOOTH),
    visibility: next.visibility,
  };
}

function buildBody(pose, prev) {
  try {
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
      return null;

    const sLS = smoothLandmark(prev?.leftShoulder, scaleLandmark(leftShoulder));
    const sRS = smoothLandmark(
      prev?.rightShoulder,
      scaleLandmark(rightShoulder),
    );
    if (!sLS || !sRS) return null;

    const nose = kp["nose"];
    const leftWrist = kp["left_wrist"];
    const rightWrist = kp["right_wrist"];

    const body = {
      nose: nose ? smoothLandmark(prev?.nose, scaleLandmark(nose)) : null,
      leftShoulder: sLS,
      rightShoulder: sRS,
      leftWrist: leftWrist
        ? smoothLandmark(prev?.leftWrist, scaleLandmark(leftWrist))
        : null,
      rightWrist: rightWrist
        ? smoothLandmark(prev?.rightWrist, scaleLandmark(rightWrist))
        : null,
      bodyCenter: midpoint(sLS, sRS),
      handSpan: 0,
    };
    if (body.leftWrist && body.rightWrist) {
      body.handSpan = dist2D(body.leftWrist, body.rightWrist);
    }
    return body;
  } catch (e) {
    return null;
  }
}

function selectPrimaryBody(newBodies, now) {
  if (!newBodies.length) return null;

  // No primary established yet — pick first
  if (!primaryBodyCenter) return 0;

  const threshold = width * PRIMARY_MATCH_RADIUS;
  let bestIdx = -1;
  let bestDist = Infinity;
  for (let i = 0; i < newBodies.length; i++) {
    const d = dist2D(newBodies[i].bodyCenter, primaryBodyCenter);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  if (bestDist < threshold) {
    // Found — reset lost timer
    primaryLostTime = 0;
    return bestIdx;
  }

  // Primary not found this frame
  if (!primaryLostTime) primaryLostTime = now;
  if (now - primaryLostTime > PRIMARY_SWITCH_TIMEOUT) {
    // Gone long enough — accept new person
    primaryLostTime = 0;
    primaryBodyCenter = null;
    return 0;
  }

  // Within debounce — hold last position
  return null;
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

  // Build valid bodies from all detected poses
  const newBodies = [];
  for (const pose of mlPoses) {
    const body = buildBody(pose, null);
    if (body) newBodies.push(body);
  }

  if (!newBodies.length) {
    if (now - lastPoseDetectedTime > POSE_HOLD_MS) {
      poseState.active = false;
      poseState.bodies = [];
    }
    return;
  }

  // Lock onto primary person
  const primaryIdx = selectPrimaryBody(newBodies, now);
  if (primaryIdx === null) return; // within debounce — hold current state

  // Smooth primary body against its previous state
  const prevPrimary = poseState.bodies[0] ?? {};
  const primary =
    buildBody(mlPoses[primaryIdx], prevPrimary) ?? newBodies[primaryIdx];

  primaryBodyCenter = primary.bodyCenter;
  lastPoseDetectedTime = now;

  poseState.active = true;
  poseState.bodies = [primary];

  // top-level fields for backwards compat
  poseState.nose = primary.nose;
  poseState.leftShoulder = primary.leftShoulder;
  poseState.rightShoulder = primary.rightShoulder;
  poseState.leftWrist = primary.leftWrist;
  poseState.rightWrist = primary.rightWrist;
  poseState.bodyCenter = primary.bodyCenter;
  poseState.handSpan = primary.handSpan;
}

function windowResized() {
  // resizeCanvas(windowWidth, windowHeight);
  // recreateProjectionSurface();
}

const statusEl = document.getElementById("status");
if (statusEl) statusEl.style.display = debugMode ? "block" : "none";

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function initSync() {
  if (!syncRole) return;

  function connect() {
    syncSocket = new WebSocket(SYNC_SERVER_URL);

    syncSocket.onopen = () => {
      console.log(`sync connected as ${syncRole}`);
      if (syncRole === "follower") {
        syncSocket.send(JSON.stringify({ type: "hello" }));
      }
    };
    syncSocket.onerror = (e) => console.warn("sync error", e);
    syncSocket.onclose = () => {
      console.log("sync lost — retrying in 2s");
      setTimeout(connect, 2000);
    };

    syncSocket.onmessage = ({ data }) => {
      const msg = JSON.parse(data);

      // New follower joined — leader re-sends current scene so they sync immediately
      if (msg.type === "hello" && syncRole === "leader") {
        sendSceneSync();
      }

      // Scene changes: followers only
      if (msg.type === "scene" && syncRole === "follower") {
        director.goToScene(msg.sceneId, { localSeconds: msg.localMs / 1000 });
        lastSyncedSceneIndex = director.activeIndex;
      }

      // Pose: apply on both leader and follower (leader gets pose from /pose computer)
      // Followers always accept synced pose regardless of local mouseMode
      if (msg.type === "pose" && !localPoseEnabled && (!mouseMode || syncRole === "follower")) {
        lastPoseMsg = msg;
        const sx = msg.senderWidth ? width / msg.senderWidth : 1;
        const sy = msg.senderHeight ? height / msg.senderHeight : 1;
        const scalePoint = (pt) => {
          if (!pt) return null;
          const x = pt.x * sx;
          return { ...pt, x: invertPoseX ? width - x : x, y: pt.y * sy };
        };
        poseState.active = msg.active;
        poseState.bodies = msg.bodies.map((b) => ({
          ...b,
          bodyCenter: scalePoint(b.bodyCenter),
          nose: scalePoint(b.nose),
          leftShoulder: scalePoint(b.leftShoulder),
          rightShoulder: scalePoint(b.rightShoulder),
          leftWrist: scalePoint(b.leftWrist),
          rightWrist: scalePoint(b.rightWrist),
          handSpan: b.handSpan * sx,
        }));
        const first = poseState.bodies[0];
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

  connect();
}

function sendPoseSync() {
  if (
    syncRole !== "leader" ||
    !syncSocket ||
    syncSocket.readyState !== WebSocket.OPEN
  )
    return;
  const now = millis();
  if (now - lastPoseSyncTime < POSE_SYNC_INTERVAL_MS) return;
  lastPoseSyncTime = now;
  syncSocket.send(
    JSON.stringify({
      type: "pose",
      active: poseState.active,
      bodies: poseState.bodies,
      senderWidth: width,
      senderHeight: height,
    }),
  );
}

function sendSceneSync() {
  if (syncRole !== "leader") {
    console.log("sendSceneSync: not leader, skipping");
    return;
  }
  if (!syncSocket || syncSocket.readyState !== WebSocket.OPEN) {
    console.warn("sendSceneSync: socket not open");
    return;
  }
  const active = director.scenes[director.activeIndex];
  if (!active) return;
  const msg = {
    type: "scene",
    sceneId: active.id,
    localMs: director.t - active.startMs,
  };
  console.log("sendSceneSync →", msg);
  syncSocket.send(JSON.stringify(msg));
}

function initProjectionMapper() {
  pMapper = createProjectionMapper(this);
  const sw = width / NUM_PROJECTION_SURFACES;
  for (let i = 0; i < NUM_PROJECTION_SURFACES; i++) {
    mappedSurfaces.push(pMapper.createQuadMap(sw, height, 8));
  }
}

function recreateProjectionSurface() {
  if (!mappedSurfaces.length) return;
  const sw = width / mappedSurfaces.length;
  for (const s of mappedSurfaces) s.setSize(sw, height);
}

function getIsAutoMove() {
  const AUTO_TIMEOUT = 8000;
  const hasPose = poseState.bodies.length > 0;
  if (hasPose) lastPoseTime = millis();
  const autoMode = !mouseMode && millis() - lastPoseTime > AUTO_TIMEOUT;
  return autoMode;
}

function getPoseX() {
  // leader in mouse mode: use local mouse (also broadcast as pose)
  // follower: always use synced poseState (which may have come from leader's mouse)
  if (mouseMode && syncRole !== "follower") return mouseX;
  const hasPose = poseState.bodies.length > 0;
  return hasPose ? poseState.bodies[0].bodyCenter.x : width / 2;
}

function getPoseY() {
  if (mouseMode && syncRole !== "follower") return mouseY;
  const hasPose = poseState.bodies.length > 0;
  return hasPose ? poseState.bodies[0].bodyCenter.y : height / 2;
}

function displaySplitOutline(pg) {
  // 6" bar + 58" screen + 3" bar + 26" screen + 3" bar + 58" screen + 6" bar
  // = 160"
  const totalWidth = 160;
  const scale = pg.width / totalWidth;
  const bigBarWidth = 6 * scale;
  const littleBarWidth = 3 * scale;
  const screen1Width = 58 * scale;
  const screen2Width = 26 * scale;

  let x = 0;
  pg.push();
  pg.noStroke();
  pg.fill(255, 100);
  // Left bar
  pg.rect(0, 0, bigBarWidth, pg.height);
  x += bigBarWidth;
  // screen 1
  x += screen1Width;
  // first little bar
  pg.rect(x, 0, littleBarWidth, pg.height);
  x += littleBarWidth;
  // Screen 2
  x += screen2Width;
  // second little bar
  pg.rect(x, 0, littleBarWidth, pg.height);
  x += littleBarWidth;
  // screen 3
  x += screen1Width;
  // right big bar
  pg.rect(x, 0, bigBarWidth, pg.height);
  pg.pop();
}
