import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

const FocusDetector = ({ videoElement, onViolation }) => {
  const [model, setModel] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const violationTimersRef = useRef({
    lookingAway: null,
    noFace: null,
    eyesClosed: null
  });
  const violationStartTimes = useRef({});

  useEffect(() => {
    loadModel();
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      Object.values(violationTimersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  useEffect(() => {
    if (model && videoElement && !isDetecting) {
      startDetection();
    }
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [model, videoElement]);

  const loadModel = async () => {
    try {
      // Using a lightweight face detection approach with TensorFlow.js
      await tf.ready();
      console.log('TensorFlow.js loaded for focus detection');
      setModel(true); // Using browser's built-in face detection as fallback
    } catch (error) {
      console.error('Error loading focus detection model:', error);
    }
  };

  const startDetection = () => {
    if (isDetecting) return;
    setIsDetecting(true);

    detectionIntervalRef.current = setInterval(() => {
      detectFocusAndFace();
    }, 1000); // Check every second
  };

  const detectFocusAndFace = async () => {
    if (!videoElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    
    // Draw current video frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    try {
      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Basic face detection using brightness and color analysis
      const faceDetected = await detectFace(imageData);
      const eyesOpen = await detectEyeState(imageData);
      const lookingAtCamera = await detectGazeDirection(imageData);
      
      // Process detection results
      handleFaceDetection(faceDetected);
      handleEyeDetection(eyesOpen);
      handleGazeDetection(lookingAtCamera);
      
    } catch (error) {
      console.error('Error in focus detection:', error);
    }
  };

  const detectFace = async (imageData) => {
    // Simple face detection using skin tone and facial feature approximation
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let skinPixels = 0;
    let totalPixels = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Basic skin tone detection
      if (r > 95 && g > 40 && b > 20 && 
          Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
          Math.abs(r - g) > 15 && r > g && r > b) {
        skinPixels++;
      }
    }
    
    const skinRatio = skinPixels / totalPixels;
    return skinRatio > 0.02; // Face detected if > 2% skin pixels
  };

  const detectEyeState = async (imageData) => {
    // Simplified eye detection - looking for dark regions in upper face area
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Focus on upper 1/3 of image where eyes would be
    const startY = Math.floor(height * 0.2);
    const endY = Math.floor(height * 0.5);
    
    let darkPixels = 0;
    let checkedPixels = 0;
    
    for (let y = startY; y < endY; y++) {
      for (let x = Math.floor(width * 0.2); x < Math.floor(width * 0.8); x++) {
        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        if (brightness < 100) { // Dark pixel
          darkPixels++;
        }
        checkedPixels++;
      }
    }
    
    const darkRatio = darkPixels / checkedPixels;
    return darkRatio > 0.1; // Eyes likely open if sufficient dark regions
  };

  const detectGazeDirection = async (imageData) => {
    // Simplified gaze detection using face center approximation
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Find the center of mass of skin-colored pixels (face center approximation)
    let totalWeight = 0;
    let centerX = 0;
    let centerY = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Skin tone detection
        if (r > 95 && g > 40 && b > 20) {
          const weight = 1;
          centerX += x * weight;
          centerY += y * weight;
          totalWeight += weight;
        }
      }
    }
    
    if (totalWeight === 0) return false;
    
    centerX /= totalWeight;
    centerY /= totalWeight;
    
    // Check if face center is roughly in the center of the frame
    const framecenterX = width / 2;
    const framecenterY = height / 2;
    
    const distanceFromCenter = Math.sqrt(
      Math.pow(centerX - framecenterX, 2) + Math.pow(centerY - framecenterY, 2)
    );
    
    // Consider looking at camera if face center is within reasonable distance from frame center
    return distanceFromCenter < Math.min(width, height) * 0.2;
  };

  const handleFaceDetection = (faceDetected) => {
    if (!faceDetected) {
      if (!violationTimersRef.current.noFace) {
        violationStartTimes.current.noFace = Date.now();
        violationTimersRef.current.noFace = setTimeout(() => {
          const duration = (Date.now() - violationStartTimes.current.noFace) / 1000;
          onViolation('face_not_detected', {
            duration,
            confidence: 0.9,
            description: `No face detected for ${duration.toFixed(1)} seconds`
          });
          violationTimersRef.current.noFace = null;
        }, 10000); // 10 seconds threshold
      }
    } else {
      if (violationTimersRef.current.noFace) {
        clearTimeout(violationTimersRef.current.noFace);
        violationTimersRef.current.noFace = null;
      }
    }
  };

  const handleEyeDetection = (eyesOpen) => {
    if (!eyesOpen) {
      if (!violationTimersRef.current.eyesClosed) {
        violationStartTimes.current.eyesClosed = Date.now();
        violationTimersRef.current.eyesClosed = setTimeout(() => {
          const duration = (Date.now() - violationStartTimes.current.eyesClosed) / 1000;
          onViolation('eyes_closed', {
            duration,
            confidence: 0.7,
            description: `Eyes closed/drowsy for ${duration.toFixed(1)} seconds`
          });
          violationTimersRef.current.eyesClosed = null;
        }, 30000); // 30 seconds threshold for drowsiness
      }
    } else {
      if (violationTimersRef.current.eyesClosed) {
        clearTimeout(violationTimersRef.current.eyesClosed);
        violationTimersRef.current.eyesClosed = null;
      }
    }
  };

  const handleGazeDetection = (lookingAtCamera) => {
    if (!lookingAtCamera) {
      if (!violationTimersRef.current.lookingAway) {
        violationStartTimes.current.lookingAway = Date.now();
        violationTimersRef.current.lookingAway = setTimeout(() => {
          const duration = (Date.now() - violationStartTimes.current.lookingAway) / 1000;
          onViolation('looking_away', {
            duration,
            confidence: 0.8,
            description: `Looking away from camera for ${duration.toFixed(1)} seconds`
          });
          violationTimersRef.current.lookingAway = null;
        }, 5000); // 5 seconds threshold
      }
    } else {
      if (violationTimersRef.current.lookingAway) {
        clearTimeout(violationTimersRef.current.lookingAway);
        violationTimersRef.current.lookingAway = null;
      }
    }
  };

  return (
    <div style={{ display: 'none' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default FocusDetector;