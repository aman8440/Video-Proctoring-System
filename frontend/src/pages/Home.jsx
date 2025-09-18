import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Users, Shield, ArrowRight, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [sessionData, setSessionData] = useState({
    candidateName: '',
    candidateEmail: '',
    interviewerName: ''
  });

  const handleInputChange = (field, value) => {
    setSessionData(prev => ({ ...prev, [field]: value }));
  };

  const createSession = async () => {
    if (!sessionData.candidateName || !sessionData.candidateEmail || !sessionData.interviewerName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Session created successfully!');
        navigate(`/session/${data.session.sessionId}`); // ✅ FIXED
      } else {
        toast.error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Plus className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Create New Interview Session</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter candidate's full name"
                value={sessionData.candidateName}
                onChange={(e) => handleInputChange('candidateName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Email *
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter candidate's email"
                value={sessionData.candidateEmail}
                onChange={(e) => handleInputChange('candidateEmail', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interviewer Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter interviewer's name"
                value={sessionData.interviewerName}
                onChange={(e) => handleInputChange('interviewerName', e.target.value)}
              />
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={createSession}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Video className="h-4 w-4" />
              <span>Create Session</span>
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Video Proctoring System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Advanced AI-powered interview monitoring with focus detection and object recognition
        </p>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
        >
          <Plus className="h-5 w-5" />
          <span>Start New Interview</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <Video className="h-8 w-8 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">Focus Detection</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Real-time monitoring of candidate attention and focus during interviews
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Eye tracking and gaze detection</li>
            <li>• Looking away alerts (&gt;5 seconds)</li>
            <li>• Face presence monitoring</li>
            <li>• Multiple person detection</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-800">Object Detection</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Automatic identification of unauthorized items and devices
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Mobile phone detection</li>
            <li>• Book and note identification</li>
            <li>• Electronic device monitoring</li>
            <li>• Real-time violation alerts</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-8 w-8 text-purple-600" />
            <h3 className="text-xl font-semibold text-gray-800">Integrity Reports</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Comprehensive proctoring reports with integrity scoring
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Detailed violation logs</li>
            <li>• Integrity score calculation</li>
            <li>• PDF/CSV report export</li>
            <li>• Analytics dashboard</li>
          </ul>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/reports')} // ✅ FIXED
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
          >
            <h4 className="font-medium text-gray-800 mb-2">View Reports</h4>
            <p className="text-sm text-gray-600">Access detailed proctoring reports and session history</p>
          </button>
          <button
            onClick={() => navigate('/analytics')} // ✅ FIXED
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
          >
            <h4 className="font-medium text-gray-800 mb-2">Analytics Dashboard</h4>
            <p className="text-sm text-gray-600">View system-wide analytics and performance metrics</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
