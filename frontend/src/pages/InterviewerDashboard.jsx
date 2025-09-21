import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { io } from "socket.io-client";

const InterviewerDashboard = () => {
  const { sessionId } = useParams();
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  const setupWebSocket = () => {
    socketRef.current = io("https://video-proctoring-system-52ph.onrender.com", {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      setIsConnected(true);
      console.log("Socket.IO connected - Interviewer");
      socketRef.current.emit("join-session", sessionId);
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket.IO disconnected");
    });

    socketRef.current.on("proctoring-alert", (data) => {
      handleRealTimeAlert(data);
    });
  };

  const handleRealTimeAlert = (data) => {
    setAlerts((prev) => [
      {
        type: data.eventType,
        details: data.eventData,
        timestamp: data.timestamp,
        severity: data.severity,
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    setupWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold">Session Monitoring</h2>
          <span className={`px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="mr-2 text-yellow-500" />
            Real-Time Proctoring Alerts
          </h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border text-sm ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-200'
                    : alert.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <p className="font-medium">{alert.type}</p>
                <p className="text-gray-600">{alert.timestamp}</p>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-gray-500 text-sm">No alerts received yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerDashboard;
