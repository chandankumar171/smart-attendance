import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Load all required face-api.js models from /models directory.
 * Models must be downloaded and placed in public/models/
 * Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
 * Required: tiny_face_detector, face_landmark_68, face_recognition
 */
export const loadModels = async () => {
  if (modelsLoaded) return;
  const MODEL_URL = '/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
  console.log('[face-api] Models loaded');
};

/**
 * Detect a single face in a video element and return its 128-d descriptor.
 * Returns Float32Array | null
 */
export const detectFaceDescriptor = async (videoEl) => {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ? detection.descriptor : null;
};

/**
 * Draw face detection box on a canvas overlaid on the video.
 */
export const drawDetection = (videoEl, canvasEl, detection) => {
  const dims = faceapi.matchDimensions(canvasEl, videoEl, true);
  const resized = faceapi.resizeResults(detection, dims);
  faceapi.draw.drawDetections(canvasEl, resized);
  faceapi.draw.drawFaceLandmarks(canvasEl, resized);
};

/**
 * Euclidean distance between two descriptors.
 * face-api.js recommends threshold of 0.5 for recognition.
 */
export const descriptorDistance = (a, b) => faceapi.euclideanDistance(a, b);

export { faceapi };