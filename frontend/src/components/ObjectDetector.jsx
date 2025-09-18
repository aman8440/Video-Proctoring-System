import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

const ObjectDetector = ({ videoElement, canvasElement, onViolation }) => {
  const [model, setModel] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionIntervalRef = useRef(null);
  const detectedObjectsRef = useRef(new Set());

  // Object detection thresholds and mappings
  const DETECTION_THRESHOLD = 0.5;
  const FORBIDDEN_OBJECTS = {
    'cell phone': 'phone_detected',
    'book': 'book_detected',
    'laptop': 'device_detected',
    'tablet': 'device_detected',
    'remote': 'device_detected',
    'keyboard': 'device_detected'
  };

  useEffect(() => {
    loadModel();
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
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
      // Load COCO-SSD model for object detection
      await tf.ready();
      
      // Using a lightweight object detection approach
      // In production, you would load: await cocoSsd.load();
      console.log('TensorFlow.js loaded for object detection');
      setModel(true); // Placeholder - using simulated detection
    } catch (error) {
      console.error('Error loading object detection model:', error);
    }
  };

  const startDetection = () => {
    if (isDetecting) return;
    setIsDetecting(true);

    detectionIntervalRef.current = setInterval(() => {
      detectObjects();
    }, 2000); // Check every 2 seconds
  };

  const detectObjects = async () => {
    if (!videoElement || !canvasElement || !model) return;

    const canvas = canvasElement;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    
    // Draw current video frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    try {
      // Simulate object detection (in production, use actual ML model)
      const detections = await simulateObjectDetection(canvas);
      
      // Process detections
      processDetections(detections);
      
    } catch (error) {
      console.error('Error in object detection:', error);
    }
  };

  const simulateObjectDetection = async (canvas) => {
    // This simulates object detection - replace with actual ML model
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const detections = [];
    
    // Simulate phone detection based on rectangular dark objects
    const phoneDetection = detectRectangularObjects(imageData, canvas.width, canvas.height);
    if (phoneDetection) {
      detections.push({
        class: 'cell phone',
        score: phoneDetection.confidence,
        bbox: phoneDetection.bbox
      });
    }
    
    // Simulate book/paper detection based on large rectangular light objects
    const bookDetection = detectBookLikeObjects(imageData, canvas.width, canvas.height);
    if (bookDetection) {
      detections.push({
        class: 'book',
        score: bookDetection.confidence,
        bbox: bookDetection.bbox
      });
    }

    // Simulate multiple face detection
    const multipleFaces = await detectMultipleFaces(imageData);
    if (multipleFaces > 1) {
      onViolation('multiple_faces', {
        count: multipleFaces,
        confidence: 0.9,
        description: `${multipleFaces} faces detected in frame`
      });
    }
    
    return detections;
  };

  const detectRectangularObjects = (imageData, width, height) => {
    const data = imageData.data;
    const regions = [];
    
    // Simple edge detection for rectangular objects
    for (let y = 10; y < height - 10; y += 5) {
      for (let x = 10; x < width - 10; x += 5) {
        const region = analyzeRegion(data, x, y, width, height, 40, 80);
        
        // Look for dark rectangular regions (phone-like)
        if (region.avgBrightness < 80 && region.aspectRatio > 1.5 && region.aspectRatio < 3) {
          regions.push({
            x, y,
            confidence: Math.min(0.9, region.uniformity),
            type: 'phone'
          });
        }
      }
    }
    
    if (regions.length > 0) {
      const bestRegion = regions.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      return {
        confidence: bestRegion.confidence,
        bbox: [bestRegion.x, bestRegion.y, 40, 80]
      };
    }
    
    return null;
  };

  const detectBookLikeObjects = (imageData, width, height) => {
    const data = imageData.data;
    const regions = [];
    
    // Look for large, light-colored rectangular regions
    for (let y = 20; y < height - 100; y += 10) {
      for (let x = 20; x < width - 150; x += 10) {
        const region = analyzeRegion(data, x, y, width, height, 150, 100);
        
        // Look for light rectangular regions (book/paper-like)
        if (region.avgBrightness > 150 && region.aspectRatio > 1.2 && region.aspectRatio < 2) {
          regions.push({
            x, y,
            confidence: Math.min(0.8, region.uniformity * 0.8),
            type: 'book'
          });
        }
      }
    }
    
    if (regions.length > 0) {
      const bestRegion = regions.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      return {
        confidence: bestRegion.confidence,
        bbox: [bestRegion.x, bestRegion.y, 150, 100]
      };
    }
    
    return null;
  };

  const analyzeRegion = (data, startX, startY, imageWidth, imageHeight, regionWidth, regionHeight) => {
    let totalBrightness = 0;
    let pixelCount = 0;
    let brightnessVariance = 0;
    
    const endX = Math.min(startX + regionWidth, imageWidth);
    const endY = Math.min(startY + regionHeight, imageHeight);
    
    // Calculate average brightness
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const i = (y * imageWidth + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
        pixelCount++;
      }
    }
    
    const avgBrightness = totalBrightness / pixelCount;
    
    // Calculate uniformity (lower variance = more uniform)
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const i = (y * imageWidth + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        brightnessVariance += Math.pow(brightness - avgBrightness, 2);
      }
    }
    
    const variance = brightnessVariance / pixelCount;
    const uniformity = Math.max(0, 1 - variance / 10000); // Normalize variance
    const aspectRatio = regionWidth / regionHeight;
    
    return {
      avgBrightness,
      uniformity,
      aspectRatio
    };
  };

  const detectMultipleFaces = async (imageData) => {
    // Simple multiple face detection using skin tone clustering
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const faceRegions = [];
    
    // Find skin-colored regions
    for (let y = 0; y < height - 50; y += 20) {
      for (let x = 0; x < width - 50; x += 20) {
        let skinPixels = 0;
        const regionSize = 50;
        
        for (let dy = 0; dy < regionSize && y + dy < height; dy += 2) {
          for (let dx = 0; dx < regionSize && x + dx < width; dx += 2) {
            const i = ((y + dy) * width + (x + dx)) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Skin tone detection
            if (r > 95 && g > 40 && b > 20 && 
                Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                Math.abs(r - g) > 15 && r > g && r > b) {
              skinPixels++;
            }
          }
        }
        
        const skinRatio = skinPixels / ((regionSize / 2) * (regionSize / 2));
        if (skinRatio > 0.3) { // Potential face region
          faceRegions.push({ x, y, skinRatio });
        }
      }
    }
    
    // Cluster nearby face regions
    const clusteredFaces = clusterFaceRegions(faceRegions);
    return clusteredFaces.length;
  };

  const clusterFaceRegions = (regions) => {
    const clusters = [];
    const used = new Set();
    
    regions.forEach((region, index) => {
      if (used.has(index)) return;
      
      const cluster = [region];
      used.add(index);
      
      // Find nearby regions
      regions.forEach((otherRegion, otherIndex) => {
        if (used.has(otherIndex)) return;
        
        const distance = Math.sqrt(
          Math.pow(region.x - otherRegion.x, 2) + 
          Math.pow(region.y - otherRegion.y, 2)
        );
        
        if (distance < 100) { // Cluster nearby regions
          cluster.push(otherRegion);
          used.add(otherIndex);
        }
      });
      
      // Only consider as face if cluster has sufficient skin regions
      if (cluster.length >= 2) {
        clusters.push(cluster);
      }
    });
    
    return clusters;
  };

  const processDetections = (detections) => {
    const currentObjects = new Set();
    
    detections.forEach(detection => {
      const objectClass = detection.class.toLowerCase();
      const violationType = FORBIDDEN_OBJECTS[objectClass];
      
      if (violationType && detection.score > DETECTION_THRESHOLD) {
        currentObjects.add(violationType);
        
        // Only trigger violation if this is a new detection
        if (!detectedObjectsRef.current.has(violationType)) {
          onViolation(violationType, {
            objectClass,
            confidence: detection.score,
            bbox: detection.bbox,
            description: `${objectClass} detected in frame`
          });
          
          detectedObjectsRef.current.add(violationType);
          
          // Remove from detected objects after 10 seconds
          setTimeout(() => {
            detectedObjectsRef.current.delete(violationType);
          }, 10000);
        }
      }
    });
  };

  // Audio detection for background voices
  useEffect(() => {
    let audioContext;
    let analyser;
    let dataArray;
    let source;
    
    const setupAudioDetection = async () => {
      if (!videoElement || !videoElement.srcObject) return;
      
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        source = audioContext.createMediaStreamSource(videoElement.srcObject);
        source.connect(analyser);
        
        // Start audio monitoring
        const monitorAudio = () => {
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate average volume
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          
          // Detect unusual audio patterns (multiple voices, background noise)
          const highFrequencyEnergy = dataArray.slice(128).reduce((sum, value) => sum + value, 0);
          
          if (average > 50 && highFrequencyEnergy > 2000) {
            // Potential background voice or noise detected
            onViolation('audio_detected', {
              volume: average,
              confidence: Math.min(0.8, average / 100),
              description: 'Background audio/voices detected'
            });
          }
          
          // Continue monitoring
          if (audioContext.state === 'running') {
            setTimeout(monitorAudio, 3000); // Check every 3 seconds
          }
        };
        
        monitorAudio();
        
      } catch (error) {
        console.error('Error setting up audio detection:', error);
      }
    };
    
    if (videoElement && videoElement.srcObject) {
      setupAudioDetection();
    }
    
    return () => {
      if (audioContext && audioContext.state === 'running') {
        audioContext.close();
      }
    };
  }, [videoElement]);

  return (
    <div style={{ display: 'none' }}>
      {/* Hidden component - all detection happens in background */}
    </div>
  );
};

export default ObjectDetector;