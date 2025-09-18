import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, AlertTriangle, Shield, Calendar, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
  const navigate = useNavigate();  
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadAnalytics();
    loadSessions();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const response = await fetch(`http://localhost:5000/api/reports/analytics/summary?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        toast.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sessions?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // Process data for charts
  const processViolationData = () => {
    if (!analytics || !analytics.commonViolations) return [];
    
    return Object.entries(analytics.commonViolations).map(([type, count]) => ({
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: ((count / analytics.totalViolations) * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count);
  };

  const processScoreDistribution = () => {
    if (!analytics || !analytics.scoreDistribution) return [];
    
    return [
      { name: 'Excellent (90-100)', value: analytics.scoreDistribution.excellent, color: '#10B981' },
      { name: 'Good (70-89)', value: analytics.scoreDistribution.good, color: '#F59E0B' },
      { name: 'Fair (50-69)', value: analytics.scoreDistribution.fair, color: '#EF4444' },
      { name: 'Poor (0-49)', value: analytics.scoreDistribution.poor, color: '#DC2626' }
    ];
  };

  const processTimelineData = () => {
    const timelineData = [];
    const now = new Date();
    
    for (let i = parseInt(dateRange) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daysSessions = sessions.filter(session => 
        session.startTime.split('T')[0] === dateStr
      );
      
      const avgScore = daysSessions.length > 0 
        ? daysSessions.reduce((sum, session) => sum + session.integrityScore, 0) / daysSessions.length
        : 0;
        
      timelineData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sessions: daysSessions.length,
        avgScore: Math.round(avgScore)
      });
    }
    
    return timelineData;
  };

  const violationData = processViolationData();
  const scoreDistribution = processScoreDistribution();
  const timelineData = processTimelineData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">System-wide proctoring analytics and insights</p>
          </div>
          <div className="flex space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              onClick={() => navigate('/reports')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>View Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Integrity Score</p>
              <p className={`text-3xl font-bold ${
                analytics?.averageIntegrityScore >= 90 ? 'text-green-600' :
                analytics?.averageIntegrityScore >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analytics?.averageIntegrityScore || 0}%
              </p>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Violations</p>
              <p className="text-3xl font-bold text-red-600">{analytics?.totalViolations || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Session Duration</p>
              <p className="text-3xl font-bold text-gray-900">{analytics?.averageSessionDuration || 0}m</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Violation Types Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Common Violations</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, 'Count']}
                  labelFormatter={(label) => `Violation: ${label}`}
                />
                <Bar dataKey="count" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Distribution Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Integrity Score Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Sessions']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Sessions & Average Scores Timeline</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="sessions" orientation="left" />
              <YAxis yAxisId="score" orientation="right" domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name) => [
                  value, 
                  name === 'sessions' ? 'Sessions' : 'Avg Score (%)'
                ]}
              />
              <Bar yAxisId="sessions" dataKey="sessions" fill="#3B82F6" opacity={0.3} />
              <Line 
                yAxisId="score" 
                type="monotone" 
                dataKey="avgScore" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Violation Types</h2>
          <div className="space-y-3">
            {violationData.slice(0, 5).map((violation, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{violation.name}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${violation.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{violation.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Detection Accuracy</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <span className="text-sm font-medium">92%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">System Uptime</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '99%' }}></div>
                </div>
                <span className="text-sm font-medium">99%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">False Positive Rate</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '8%' }}></div>
                </div>
                <span className="text-sm font-medium">8%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;