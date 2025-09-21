import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, CameraOff, Mic, MicOff, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import FocusDetector from '../components/FocusDetector';
import ObjectDetector from '../components/ObjectDetector';

const CandidateView = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentViolations, setCurrentViolations] = useState([]);
  const [integrityScore, setIntegrityScore] = useState(100);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (sessionId) {
      initializeSession();
      setupWebSocket();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId]);

  const initializeSession = async () => {
    try {
      const response = await fetch(`https://video-proctoring-system-52ph.onrender.com/api/sessions/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setSession(data.session);
        await setupCamera();
      } else {
        toast.error('Session not found');
        navigate('/home');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocket = () => {
    socketRef.current = new WebSocket('wss://video-proctoring-system-52ph.onrender.com');
    
    socketRef.current.onopen = () => {
      console.log('WebSocket connected');
      if (sessionId) {
        socketRef.current.send(JSON.stringify({
          type: 'join-session',
          sessionId
        }));
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        },
        audio: true
      });
      
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Camera access denied. Please enable camera permissions.');
    }
  };

  const toggleVideo = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const handleViolationDetected = async (violationType, data) => {
    const violation = {
      type: violationType,
      timestamp: new Date(),
      data
    };

    setCurrentViolations(prev => [...prev.slice(-4), violation]);

    // Send violation to backend
    try {
      const response = await fetch(`https://video-proctoring-system-52ph.onrender.com/api/sessions/${sessionId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: violationType,
          duration: data.duration || 0,
          confidence: data.confidence || 0.8,
          description: data.description
        })
      });

      const result = await response.json();
      if (result.success) {
        setIntegrityScore(result.integrityScore);
      }
    } catch (error) {
      console.error('Error logging violation:', error);
    }

    // Send real-time alert via WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'proctoring-event',
        sessionId,
        eventType: violationType,
        eventData: data,
        timestamp: violation.timestamp
      }));
    }
  };

  const endSession = async () => {
    try {
      const response = await fetch(`https://video-proctoring-system-52ph.onrender.com/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast.success('Session ended successfully');
        navigate('/home');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Session Not Found</h2>
        <button
          onClick={() => navigate('/home')}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Session Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Interview Session</h1>
            <p className="text-gray-600">Candidate: {session.candidateName}</p>
            <p className="text-gray-600">Interviewer: {session.interviewerName}</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              integrityScore >= 90 ? 'bg-green-100 text-green-800' :
              integrityScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              <Eye className="h-4 w-4 mr-1" />
              Integrity: {integrityScore}%
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Video Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-96 bg-gray-900 rounded-lg object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
                style={{ display: 'none' }}
              />
              
              {/* Video Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-600'} text-white hover:opacity-80`}
                >
                  {isVideoEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-600'} text-white hover:opacity-80`}
                >
                  {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
              </div>

              {/* Recording Indicator */}
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording</span>
              </div>
            </div>

            {/* End Session Button */}
            <div className="mt-6 text-center">
              <button
                onClick={endSession}
                className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>

        {/* Monitoring Panel */}
        <div className="space-y-6">
          {/* Current Violations */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Recent Alerts
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentViolations.length === 0 ? (
                <p className="text-sm text-gray-500">No violations detected</p>
              ) : (
                currentViolations.map((violation, index) => (
                  <div key={index} className={`p-2 rounded-md text-sm ${
                    violation.type.includes('phone') || violation.type.includes('multiple_faces') 
                      ? 'bg-red-50 text-red-800 border-l-4 border-red-500'
                      : 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500'
                  }`}>
                    <div className="font-medium">
                      {violation.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs opacity-75">
                      {violation.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Interview Guidelines</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Keep your face visible at all times</li>
              <li>• Look at the camera/screen</li>
              <li>• Remove phones and notes from view</li>
              <li>• Ensure you're alone in the room</li>
              <li>• Maintain good lighting</li>
            </ul>
          </div>
        </div>
      </div>

      {/* AI Monitoring Components */}
      {videoRef.current && mediaStream && (
        <>
          <FocusDetector
            videoElement={videoRef.current}
            onViolation={handleViolationDetected}
          />
          <ObjectDetector
            videoElement={videoRef.current}
            canvasElement={canvasRef.current}
            onViolation={handleViolationDetected}
          />
        </>
      )}
    </div>
  );
};

export default CandidateView;