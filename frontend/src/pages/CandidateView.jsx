import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, CameraOff, Mic, MicOff, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import FocusDetector from '../components/FocusDetector';
import ObjectDetector from '../components/ObjectDetector';
import { io } from "socket.io-client";

const CandidateView = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [violations, setViolations] = useState([]);
  const socketRef = useRef(null);

  // Setup WebSocket with socket.io-client
  const setupWebSocket = () => {
    socketRef.current = io("https://video-proctoring-system-52ph.onrender.com", {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("Socket.IO connected - Candidate");
      if (sessionId) {
        socketRef.current.emit("join-session", sessionId);
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket.IO disconnected");
    });
  };

  useEffect(() => {
    setupWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessionId]);

  const handleViolation = (violationType, data) => {
    const violation = {
      type: violationType,
      timestamp: new Date().toLocaleTimeString(),
      details: data,
    };
    setViolations((prev) => [...prev, violation]);

    // Send violation to backend via socket
    if (socketRef.current) {
      socketRef.current.emit("proctoring-event", {
        sessionId,
        eventType: violationType,
        eventData: data,
        timestamp: violation.timestamp,
      });
    }

    toast.error(`Violation detected: ${violationType}`);
  };

  const toggleCamera = async () => {
    if (!isCameraOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } catch (error) {
        console.error("Camera access denied:", error);
        toast.error("Unable to access camera");
      }
    } else {
      const stream = videoRef.current.srcObject;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };

  const toggleMic = async () => {
    if (!isMicOn) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsMicOn(true);
      } catch (error) {
        console.error("Microphone access denied:", error);
        toast.error("Unable to access microphone");
      }
    } else {
      setIsMicOn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          {/* Video & Controls */}
          <div className="col-span-2 space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay muted className="w-full h-[480px] object-cover" />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-full ${isCameraOn ? 'bg-red-500' : 'bg-green-500'} text-white`}
                >
                  {isCameraOn ? <CameraOff /> : <Camera />}
                </button>
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full ${isMicOn ? 'bg-red-500' : 'bg-green-500'} text-white`}
                >
                  {isMicOn ? <MicOff /> : <Mic />}
                </button>
              </div>
            </div>
          </div>

          {/* Violations */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="mr-2 text-yellow-500" />
              Detected Violations
            </h3>
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {violations.map((violation, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm"
                >
                  <p className="font-medium text-red-700">{violation.type}</p>
                  <p className="text-gray-600">{violation.timestamp}</p>
                </div>
              ))}
              {violations.length === 0 && (
                <p className="text-gray-500 text-sm">No violations detected</p>
              )}
            </div>
          </div>
        </div>

        {/* AI Detectors */}
        {isCameraOn && (
          <div className="mt-6 grid grid-cols-2 gap-6">
            <FocusDetector onViolation={handleViolation} videoRef={videoRef} />
            <ObjectDetector onViolation={handleViolation} videoRef={videoRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateView;
