import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Eye, Users, Clock, Shield, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const InterviewerDashboard = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [realTimeAlerts, setRealTimeAlerts] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    totalViolations: 0,
    integrityScore: 100,
    duration: 0,
    alertsByType: {}
  });
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (sessionId) {
      loadSession();
      setupWebSocket();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setSession(data.session);
        updateSessionStats(data.session);
      } else {
        toast.error('Session not found');
        navigate('/home');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load session');
    }
  };

  const setupWebSocket = () => {
    try {
      socketRef.current = new WebSocket('ws://localhost:5000');
      
      socketRef.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected - Interviewer dashboard');
        
        // Join the session room
        socketRef.current.send(JSON.stringify({
          type: 'join-session',
          sessionId,
          role: 'interviewer'
        }));
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'proctoring-alert') {
          handleRealTimeAlert(data);
        }
      };

      socketRef.current.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  };

  const handleRealTimeAlert = (alertData) => {
    const alert = {
      id: Date.now(),
      timestamp: new Date(alertData.timestamp),
      type: alertData.eventType,
      severity: alertData.severity || 'medium',
      data: alertData.eventData,
      description: alertData.eventData.description || `${alertData.eventType} detected`
    };

    setRealTimeAlerts(prev => [alert, ...prev.slice(0, 19)]); // Keep last 20 alerts

    // Update stats
    setSessionStats(prev => ({
      ...prev,
      totalViolations: prev.totalViolations + 1,
      alertsByType: {
        ...prev.alertsByType,
        [alert.type]: (prev.alertsByType[alert.type] || 0) + 1
      }
    }));

    // Show toast for high severity alerts
    if (alert.severity === 'high') {
      toast.error(`⚠️ ${alert.description}`, { duration: 5000 });
    } else if (alert.severity === 'medium') {
      toast.error(`⚡ ${alert.description}`, { duration: 3000 });
    }
  };

  const updateSessionStats = (sessionData) => {
    const stats = {
      totalViolations: sessionData.events?.length || 0,
      integrityScore: sessionData.integrityScore || 100,
      duration: sessionData.duration || 0,
      alertsByType: {}
    };

    sessionData.events?.forEach(event => {
      if (event.eventType !== 'session_start' && event.eventType !== 'session_end') {
        stats.alertsByType[event.eventType] = (stats.alertsByType[event.eventType] || 0) + 1;
      }
    });

    setSessionStats(stats);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Eye className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const formatEventType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const endSession = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast.success('Session ended successfully');
        navigate('/reports');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Session Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Interviewer Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={endSession}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Integrity Score</p>
              <p className={`text-2xl font-bold ${
                sessionStats.integrityScore >= 90 ? 'text-green-600' :
                sessionStats.integrityScore >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {sessionStats.integrityScore}%
              </p>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Violations</p>
              <p className="text-2xl font-bold text-gray-900">{sessionStats.totalViolations}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Session Duration</p>
              <p className="text-2xl font-bold text-gray-900">{sessionStats.duration}m</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-2xl font-bold text-green-600">{session.status.toUpperCase()}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Real-time Alerts */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Real-time Alerts
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {realTimeAlerts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No alerts detected</p>
            ) : (
              realTimeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-md border-l-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(alert.severity)}
                      <div>
                        <p className="font-medium text-sm">
                          {formatEventType(alert.type)}
                        </p>
                        <p className="text-xs opacity-75">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs opacity-75">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Violation Breakdown */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingDown className="h-5 w-5 text-blue-500 mr-2" />
            Violation Breakdown
          </h2>
          <div className="space-y-3">
            {Object.entries(sessionStats.alertsByType).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No violations yet</p>
            ) : (
              Object.entries(sessionStats.alertsByType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{formatEventType(type)}</span>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium">
                    {count}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/reports', sessionId)}
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                View Detailed Report
              </button>
              <button
                onClick={() => window.open(`/candidate/${sessionId}`, '_blank')}
                className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
              >
                Monitor Candidate View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerDashboard;