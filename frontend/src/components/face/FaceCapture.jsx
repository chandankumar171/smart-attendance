import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { toast } from 'react-toastify';
import { loadModels, detectFaceDescriptor, faceapi } from '../../utils/faceUtils';
import api from '../../utils/api';

const STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  DETECTING: 'detecting',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function FaceCapture({ mode = 'register', onSuccess }) {
  // mode: 'register' | 'attendance'
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const [status, setStatus] = useState(STATUS.LOADING);
  const [message, setMessage] = useState('Loading face detection models...');
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturing, setCapturing] = useState(false);

  // Load models on mount
  useEffect(() => {
    loadModels()
      .then(() => {
        setStatus(STATUS.READY);
        setMessage('Position your face in the camera, then click the button.');
      })
      .catch(() => {
        setStatus(STATUS.ERROR);
        setMessage('Failed to load face models. Make sure model files are in /public/models/');
      });
  }, []);

  // Live face detection loop
  useEffect(() => {
    if (status !== STATUS.READY && status !== STATUS.DETECTING) return;

    intervalRef.current = setInterval(async () => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4) return;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
        .withFaceLandmarks();

      setFaceDetected(!!detection);

      // Draw on canvas
      const canvas = canvasRef.current;
      if (canvas && detection) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const dims = faceapi.matchDimensions(canvas, video, true);
        const resized = faceapi.resizeResults(detection, dims);
        faceapi.draw.drawFaceLandmarks(canvas, resized);
      } else if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 200);

    return () => clearInterval(intervalRef.current);
  }, [status]);

  const handleCapture = useCallback(async () => {
    const video = webcamRef.current?.video;
    if (!video) return;

    setCapturing(true);
    setMessage('Detecting face...');

    try {
      const descriptor = await detectFaceDescriptor(video);

      if (!descriptor) {
        toast.warn('No face detected. Please look directly at the camera.');
        setMessage('No face detected. Try again.');
        setCapturing(false);
        return;
      }

      const descriptorArray = Array.from(descriptor);

      if (mode === 'register') {
        await api.post('/auth/register-face', { faceDescriptor: descriptorArray });
        setStatus(STATUS.SUCCESS);
        setMessage('Face registered successfully!');
        onSuccess?.();
      } else {
        // attendance mode — send descriptor to backend for comparison
        const res = await api.post('/attendance/mark', { faceDescriptor: descriptorArray });
        setStatus(STATUS.SUCCESS);
        setMessage(res.data.message);
        toast.success(res.data.message);
        onSuccess?.(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Try again.';
      setMessage(msg);
      toast.error(msg);
      setCapturing(false);
    }
  }, [mode, onSuccess]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-xs rounded-xl overflow-hidden bg-black">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 320, height: 240, facingMode: 'user' }}
          className="w-full"
          onUserMediaError={() => {
            setStatus(STATUS.ERROR);
            setMessage('Camera access denied. Please allow camera access.');
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          width={320}
          height={240}
        />
        {/* Face detected indicator */}
        <div className={`absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${faceDetected ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-300'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${faceDetected ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
          {faceDetected ? 'Face detected' : 'No face'}
        </div>
      </div>

      {/* Status message */}
      <p className={`text-sm text-center px-2 ${status === STATUS.ERROR ? 'text-red-600' : status === STATUS.SUCCESS ? 'text-green-600' : 'text-gray-600'}`}>
        {message}
      </p>

      {status !== STATUS.SUCCESS && status !== STATUS.ERROR && (
        <button
          onClick={handleCapture}
          disabled={capturing || status === STATUS.LOADING || !faceDetected}
          className="btn-primary w-full max-w-xs"
        >
          {capturing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : mode === 'register' ? 'Capture & Register Face' : 'Mark Attendance'}
        </button>
      )}
    </div>
  );
}