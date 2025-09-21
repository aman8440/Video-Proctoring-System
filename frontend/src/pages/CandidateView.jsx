import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Mic, MicOff, Video, VideoOff, Shield, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const CandidateView = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionStatus, setSessionStatus] = useState('active');
  const [violations, setViolations] = useState([]);
  const [integrityScore, setIntegrityScore] = useState(100);
  
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const sessionTimerRef = useRef(null);

  useEffect(() => {
    if (sessionId) {
      loadSession();
      setupSocketIO();
      startSession();
    }

    return () => {
      cleanup();
    };
  }, [sessionId]);

  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
  };

  const loadSession = async () => {
    try {
      const response = await fetch(`https://video-proctoring-system-52ph.onrender.com/api/sessions/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setSession(data.session);
        if (data.session.status === 'ended') {
          setSessionStatus('ended');
          toast.error('This session has ended');
        }
      } else {
        toast.error('Session not found');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load session');
    }
  };

  const setupSocketIO = () => {
    try {
      socketRef.current = io('https://video-proctoring-system-52ph.onrender.com', {
        transports: ['websocket', 'polling'],
        upgrade: true,
        timeout: 20000,
        forceNew: true
      });
      
      socketRef.current.on('connect', () => {
        setIsConnected(true);
        console.log('Socket.IO connected - Candidate view');
        
        // Join the session room
        socketRef.current.emit('join-session', sessionId);
      });

      socketRef.current.on('session-ended', () => {
        setSessionStatus('ended');
        toast.info('Session has been ended by the interviewer');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      });

      socketRef.current.on('disconnect', (reason) => {
        setIsConnected(false);
        console.log('Socket.IO disconnected:', reason);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        setIsConnected(false);
      });

      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        socketRef.current.emit('join-session', sessionId);
      });

    } catch (error) {
      console.error('Error setting up Socket.IO:', error);
    }
  };

  const startSession = async () => {
    try {
      // Start camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      setMediaStream(stream);
      streamRef.current = stream;

      // Start session timer
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);

      // Start proctoring detection
      startProctoringDetection();

      toast.success('Session started successfully');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const startProctoringDetection = () => {
    // Simulate proctoring events for demo purposes
    detectionIntervalRef.current = setInterval(() => {
      if (sessionStatus === 'ended') return;

      // Random proctoring events for demo
      const events = [
        'face_not_detected',
        'multiple_faces', 
        'looking_away',
        'eyes_closed',
        'audio_detected'
      ];

      // 10% chance of generating an event every 5 seconds
      if (Math.random() < 0.1) {
        const eventType = events[Math.floor(Math.random() * events.length)];
        handleProctoringEvent(eventType);
      }
    }, 5000);
  };

  const handleProctoringEvent = (eventType) => {
    const eventData = {
      sessionId,
      eventType,
      timestamp: new Date().toISOString(),
      eventData: {
        description: getEventDescription(eventType),
        confidence: Math.floor(Math.random() * 40) + 60 // 60-100% confidence
      }
    };

    // Send to server via Socket.IO
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('proctoring-event', eventData);
    }

    // Update local state
    const violation = {
      id: Date.now(),
      type: eventType,
      timestamp: new Date(),
      description: getEventDescription(eventType)
    };

    setViolations(prev => [violation, ...prev.slice(0, 9)]); // Keep last 10
    setIntegrityScore(prev => Math.max(0, prev - 5)); // Decrease score

    // Show warning to candidate
    toast.warning(`⚠️ ${violation.description}`, { duration: 4000 });
  };

  const getEventDescription = (eventType) => {
    const descriptions = {
      'face_not_detected': 'Please ensure your face is clearly visible',
      'multiple_faces': 'Multiple faces detected in frame',
      'looking_away': 'Please look at the camera',
      'eyes_closed': 'Please keep your eyes open',
      'audio_detected': 'Unexpected audio detected',
      'phone_detected': 'Mobile device detected',
      'book_detected': 'Reading material detected',
      'device_detected': 'Electronic device detected'
    };
    return descriptions[eventType] || 'Suspicious activity detected';
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const endSession = async () => {
    try {
      setSessionStatus('ended');
      cleanup();
      
      const response = await fetch(`https://video-proctoring-system-52ph.onrender.com/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endTime: new Date().toISOString(),
          duration: sessionTime,
          finalIntegrityScore: integrityScore
        })
      });

      if (response.ok) {
        toast.success('Session ended successfully');
      }
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session properly');
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sessionStatus === 'ended') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Ended</h2>
            <p className="text-gray-600 mb-4">Thank you for participating in the interview session.</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <p className="font-medium">{formatTime(sessionTime)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Final Score:</span>
                  <p className={`font-medium ${integrityScore >= 90 ? 'text-green-600' : integrityScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {integrityScore}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-800">Interview Session</h1>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Reconnecting...'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-mono">{formatTime(sessionTime)}</span>
              </div>
              <button
                onClick={endSession}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Feed */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-96 bg-gray-900 rounded-lg object-cover"
                />
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  Candidate View
                </div>
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isVideoOn ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    {isVideoOn ? 'Camera On' : 'Camera Off'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full ${isVideoOn ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-100 hover:bg-red-200'} transition-colors`}
                >
                  {isVideoOn ? (
                    <Video className="h-6 w-6 text-gray-700" />
                  ) : (
                    <VideoOff className="h-6 w-6 text-red-600" />
                  )}
                </button>
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full ${isAudioOn ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-100 hover:bg-red-200'} transition-colors`}
                >
                  {isAudioOn ? (
                    <Mic className="h-6 w-6 text-gray-700" />
                  ) : (
                    <MicOff className="h-6 w-6 text-red-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Proctoring Guidelines
              </h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>• Keep your face clearly visible in the camera frame</li>
                <li>• Look at the camera/screen during the session</li>
                <li>• Avoid looking away from the screen for extended periods</li>
                <li>• Keep your workspace clear of unauthorized materials</li>
                <li>• Do not use mobile phones or other devices</li>
                <li>• Maintain good lighting so your face is clearly visible</li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Session Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Candidate:</span>
                  <p className="font-medium">{session.candidateName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{session.candidateEmail}</p>
                </div>
                <div>
                  <span className="text-gray-600">Started:</span>
                  <p className="font-medium">{new Date(session.startTime).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {/* Integrity Score */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Integrity Score</h3>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  integrityScore >= 90 ? 'text-green-600' :
                  integrityScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {integrityScore}%
                </div>
                <p className="text-sm text-gray-600">
                  {integrityScore >= 90 ? 'Excellent' :
                   integrityScore >= 70 ? 'Good' : 'Needs Attention'}
                </p>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                Recent Alerts
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {violations.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No violations detected</p>
                ) : (
                  violations.map((violation) => (
                    <div key={violation.id} className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <p className="font-medium text-sm text-orange-800">
                        {violation.description}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {violation.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">System Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Camera:</span>
                  <span className={`font-medium ${isVideoOn ? 'text-green-600' : 'text-red-600'}`}>
                    {isVideoOn ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Microphone:</span>
                  <span className={`font-medium ${isAudioOn ? 'text-green-600' : 'text-red-600'}`}>
                    {isAudioOn ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Connection:</span>
                  <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateView;