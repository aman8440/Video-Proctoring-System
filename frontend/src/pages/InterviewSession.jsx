import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Monitor } from 'lucide-react';
import CandidateView from './CandidateView';
import InterviewerDashboard from './InterviewerDashboard';

const InterviewSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const response = await fetch(`https://video-proctoring-system-52ph.onrender.com/api/sessions/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setSession(data.session);
      } else {
        navigate('home');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      navigate('home');
    } finally {
      setIsLoading(false);
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
          onClick={() => navigate('home')}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (userRole === null) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Join Interview Session</h1>
          <div className="mb-6">
            <p className="text-gray-600 mb-2">Session ID: <span className="font-mono">{sessionId}</span></p>
            <p className="text-gray-600 mb-2">Candidate: {session.candidateName}</p>
            <p className="text-gray-600">Interviewer: {session.interviewerName}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setUserRole('candidate')}
              className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors flex flex-col items-center space-y-3"
            >
              <Users className="h-12 w-12" />
              <div>
                <h3 className="text-lg font-semibold">Join as Candidate</h3>
                <p className="text-sm opacity-90">Take the interview with AI monitoring</p>
              </div>
            </button>
            
            <button
              onClick={() => setUserRole('interviewer')}
              className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors flex flex-col items-center space-y-3"
            >
              <Monitor className="h-12 w-12" />
              <div>
                <h3 className="text-lg font-semibold">Join as Interviewer</h3>
                <p className="text-sm opacity-90">Monitor the candidate in real-time</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === 'candidate') {
    return <CandidateView sessionId={sessionId} />;
  }

  if (userRole === 'interviewer') {
    return <InterviewerDashboard sessionId={sessionId} />;
  }

  return null;
};

export default InterviewSession;