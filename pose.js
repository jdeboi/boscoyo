const SYNC_SERVER_URL = `ws://${location.host}`;
const POSE_SYNC_INTERVAL_MS = 50; // 20fps max send rate
const POSE_MIN_VISIBILITY = 0.5;
const POSE_SMOOTH = 0.25;
const POSE_HOLD_MS = 1000;

let socket = null;
let prevBodies = [];
let lastSendTime = 0;
let lastDetectedTime = 0;
let sendCount = 0;
let lastFpsTime = performance.now();

function setStatus(msg) {
  document.getElementById("status").textContent = msg;
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function dist2D(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function smoothLandmark(current, next) {
  if (!current) return next;
  if (!next) return null;
  return {
    x: current.x + (next.x - current.x) * POSE_SMOOTH,
    y: current.y + (next.y - current.y) * POSE_SMOOTH,
    visibility: next.visibility,
  };
}

function scalePt(kp) {
  if (!kp) return null;
  return { x: kp.x, y: kp.y, visibility: kp.score ?? 1 };
}

function processPoses(results, videoEl) {
  const newBodies = [];

  for (let i = 0; i < results.length; i++) {
    const pose = results[i];
    const kp = {};
    for (const k of pose.keypoints) kp[k.name] = k;

    const leftShoulder = kp["left_shoulder"];
    const rightShoulder = kp["right_shoulder"];
    if (
      !leftShoulder || !rightShoulder ||
      leftShoulder.score < POSE_MIN_VISIBILITY ||
      rightShoulder.score < POSE_MIN_VISIBILITY
    ) continue;

    const prev = prevBodies[i] ?? {};
    const sLS = smoothLandmark(prev.leftShoulder, scalePt(leftShoulder));
    const sRS = smoothLandmark(prev.rightShoulder, scalePt(rightShoulder));
    const nose = smoothLandmark(prev.nose, scalePt(kp["nose"]));
    const leftWrist = smoothLandmark(prev.leftWrist, scalePt(kp["left_wrist"]));
    const rightWrist = smoothLandmark(prev.rightWrist, scalePt(kp["right_wrist"]));

    newBodies.push({
      leftShoulder: sLS,
      rightShoulder: sRS,
      nose,
      leftWrist,
      rightWrist,
      bodyCenter: midpoint(sLS, sRS),
      handSpan: leftWrist && rightWrist ? dist2D(leftWrist, rightWrist) : 0,
    });
  }

  prevBodies = newBodies.length ? newBodies : prevBodies;

  const now = performance.now();
  const active = newBodies.length > 0;
  if (active) lastDetectedTime = now;

  const shouldSend = active || (now - lastDetectedTime < POSE_HOLD_MS);

  if (socket?.readyState === WebSocket.OPEN && now - lastSendTime >= POSE_SYNC_INTERVAL_MS) {
    lastSendTime = now;
    socket.send(JSON.stringify({
      type: "pose",
      active: shouldSend && prevBodies.length > 0,
      bodies: shouldSend ? prevBodies : [],
      senderWidth: videoEl.videoWidth,
      senderHeight: videoEl.videoHeight,
    }));
    sendCount++;
    const flash = document.getElementById("sendflash");
    flash.style.background = "#4f4";
    setTimeout(() => { flash.style.background = "#333"; }, 80);
  }

  // Update coords display every frame
  const coordEl = document.getElementById("coords");
  if (prevBodies.length > 0) {
    coordEl.textContent = prevBodies.map((b, i) => {
      const c = b.bodyCenter;
      const lw = b.leftWrist, rw = b.rightWrist;
      return `body${i}: center(${c.x.toFixed(0)}, ${c.y.toFixed(0)})` +
        (lw ? `  lw(${lw.x.toFixed(0)}, ${lw.y.toFixed(0)})` : "") +
        (rw ? `  rw(${rw.x.toFixed(0)}, ${rw.y.toFixed(0)})` : "");
    }).join("  |  ");
  } else {
    coordEl.textContent = "no bodies";
  }

  // Update FPS display once per second
  if (now - lastFpsTime > 1000) {
    document.getElementById("fpstext").textContent =
      `sending ${sendCount}fps  |  ${newBodies.length} bod${newBodies.length === 1 ? "y" : "ies"} detected`;
    sendCount = 0;
    lastFpsTime = now;
  }

  drawOverlay(results, videoEl);
}

function drawOverlay(results, videoEl) {
  const canvas = document.getElementById("overlay");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const pose of results) {
    for (const kp of pose.keypoints) {
      if (kp.score < POSE_MIN_VISIBILITY) continue;
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "lime";
      ctx.fill();
    }
  }
}

async function init() {
  // Connect WebSocket with auto-reconnect
  function connectSync() {
    socket = new WebSocket(SYNC_SERVER_URL);
    socket.onopen = () => setStatus("WebSocket connected — waiting for camera...");
    socket.onerror = () => setStatus("WebSocket error");
    socket.onclose = () => {
      setStatus("WebSocket disconnected — retrying...");
      setTimeout(connectSync, 2000);
    };
  }
  connectSync();

  // Load bodyPose model
  const bodyPose = await ml5.bodyPose("MoveNet", {
    flipped: true,
    modelType: "MULTIPOSE_LIGHTNING",
  });

  // Open camera — prefer USB over built-in
  let stream;
  try {
    const permStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((d) => d.kind === "videoinput");
    setStatus("Cameras found: " + cameras.map((c) => c.label).join(" | "));

    const usb = cameras.find(
      (c) =>
        !c.label.toLowerCase().includes("facetime") &&
        !c.label.toLowerCase().includes("built-in"),
    );

    const currentDeviceId = permStream.getVideoTracks()[0]?.getSettings().deviceId;
    if (usb && usb.deviceId !== currentDeviceId) {
      permStream.getTracks().forEach((t) => t.stop());
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: usb.deviceId },
          width: 640, height: 480,
          frameRate: { ideal: 15, max: 20 },
        },
      });
      setStatus(`Camera: ${usb.label}`);
    } else {
      stream = permStream;
      setStatus(`Camera: ${cameras[0]?.label ?? "default"}`);
    }
  } catch (e) {
    setStatus("Camera error: " + e.message);
    return;
  }

  const videoEl = document.getElementById("video");
  videoEl.srcObject = stream;
  await videoEl.play();

  bodyPose.detectStart(videoEl, (results) => {
    processPoses(results, videoEl);
  });

  setStatus("Detecting...");
}

init();
