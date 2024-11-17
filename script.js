import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;

const video = document.getElementById("webcam");
const outputCanvas = document.getElementById("output_canvas");
const canvasCtx = outputCanvas.getContext("2d");
let faceLandmarker;

// FaceLandmarkerを初期化し、Webcamを自動起動
async function initializeFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });
  
  // カメラを自動的に起動
  startWebcam();
}

// カメラ映像を取得し、リアルタイムでランドマークを描画
async function startWebcam() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  video.play();
  video.addEventListener("loadeddata", () => {
    detectFaceLandmarks();
  });
}

// 顔ランドマークをリアルタイムで検出
async function detectFaceLandmarks() {
  outputCanvas.width = video.videoWidth;
  outputCanvas.height = video.videoHeight;

  // ランドマーク検出
  const detectLoop = async () => {
    const results = await faceLandmarker.detectForVideo(video, performance.now());

    // キャンバスをクリアし、映像とランドマークを描画
    canvasCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    canvasCtx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
    
    if (results.faceLandmarks) {
      for (const landmarks of results.faceLandmarks) {
        drawLandmarks(landmarks);
      }
    }
    
    requestAnimationFrame(detectLoop);
  };

  detectLoop();
}

// 顔ランドマークをキャンバスに描画
function drawLandmarks(landmarks) {
  canvasCtx.fillStyle = "red";
  for (const point of landmarks) {
    const x = point.x * outputCanvas.width;
    const y = point.y * outputCanvas.height;
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 2, 0, 2 * Math.PI);
    canvasCtx.fill();
  }
}

// 初期化
initializeFaceLandmarker();
