let poseLandmarker = null;

async function init() {
  const { FilesetResolver, PoseLandmarker } = await import(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14"
  );

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
    },
    runningMode: "IMAGE",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  self.postMessage({ type: "ready" });
}

self.onmessage = (e) => {
  if (e.data.type === "detect") {
    if (!poseLandmarker) return;
    const result = poseLandmarker.detect(e.data.bitmap);
    e.data.bitmap.close();
    self.postMessage({ type: "result", landmarks: result.landmarks });
  }
};

init();
