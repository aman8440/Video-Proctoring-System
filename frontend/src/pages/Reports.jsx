import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Search, Filter, Eye, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailedReport, setDetailedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch('https://video-proctoring-system-52ph.onrender.com/api/sessions');
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions);
      } else {
        toast.error('Failed to load sessions');
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDetailedReport = async (sessionId) => {
    setIsGeneratingReport(true);
    try {
      const response = await fetch(`https://video-proctoring-system-52ph.onrender.com/api/reports/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setDetailedReport(data.report);
        setSelectedSession(sessionId);
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const downloadCSVReport = async (sessionId) => {
    try {
      const response = await fetch(`https://video-proctoring-system-52ph.onrender.com/api/reports/${sessionId}/csv`);
      const csvData = await response.text();
      
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proctoring_report_${sessionId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getIntegrityColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getIntegrityRating = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  if (selectedSession && detailedReport) {
    return <DetailedReportView 
      report={detailedReport} 
      onBack={() => {
        setSelectedSession(null);
        setDetailedReport(null);
      }}
      onDownloadCSV={() => downloadCSVReport(selectedSession)}
    />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Proctoring Reports</h1>
            <p className="text-gray-600">View and download detailed interview session reports</p>
          </div>
          <button
            onClick={() => navigate('/analytics')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>View Analytics</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Sessions</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            Total Sessions: {filteredSessions.length}
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Integrity Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Violations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {session.candidateName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.candidateEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        {new Date(session.startTime).toLocaleDateString()}
                        <br />
                        {new Date(session.startTime).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.duration || 0}m
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIntegrityColor(session.integrityScore)}`}>
                        {session.integrityScore}% - {getIntegrityRating(session.integrityScore)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.summary?.totalViolations || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : session.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => generateDetailedReport(session.sessionId)}
                          disabled={isGeneratingReport}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => downloadCSVReport(session.sessionId)}
                          className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>CSV</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Detailed Report View Component
const DetailedReportView = ({ report, onBack, onDownloadCSV }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatEventType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800 mb-4 flex items-center space-x-1"
            >
              ← Back to Reports
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Detailed Proctoring Report</h1>
            <p className="text-gray-600">Session ID: {report.sessionInfo.sessionId}</p>
          </div>
          <button
            onClick={onDownloadCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Session Information</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-gray-600">Candidate Name</span>
            <p className="font-medium">{report.sessionInfo.candidateName}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Email</span>
            <p className="font-medium">{report.sessionInfo.candidateEmail}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Interviewer</span>
            <p className="font-medium">{report.sessionInfo.interviewerName}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Duration</span>
            <p className="font-medium">{report.sessionInfo.duration} minutes</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Start Time</span>
            <p className="font-medium">{formatDate(report.sessionInfo.startTime)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">End Time</span>
            <p className="font-medium">
              {report.sessionInfo.endTime ? formatDate(report.sessionInfo.endTime) : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Status</span>
            <p className="font-medium capitalize">{report.sessionInfo.status}</p>
          </div>
        </div>
      </div>

      {/* Integrity Assessment */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Integrity Assessment</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${
              report.integrityAssessment.finalScore >= 90 ? 'text-green-600' :
              report.integrityAssessment.finalScore >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {report.integrityAssessment.finalScore}%
            </div>
            <p className="text-sm text-gray-600">Final Integrity Score</p>
          </div>
          <div className="text-center">
            <div className={`text-xl font-semibold mb-2 ${
              report.integrityAssessment.rating === 'Excellent' ? 'text-green-600' :
              report.integrityAssessment.rating === 'Good' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {report.integrityAssessment.rating}
            </div>
            <p className="text-sm text-gray-600">Integrity Rating</p>
          </div>
          <div className="text-center">
            <div className={`text-sm font-medium px-3 py-2 rounded-full inline-block ${
              report.integrityAssessment.recommendation.includes('Recommended') ? 'bg-green-100 text-green-800' :
              report.integrityAssessment.recommendation.includes('Consider') ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {report.integrityAssessment.recommendation}
            </div>
            <p className="text-sm text-gray-600 mt-2">Recommendation</p>
          </div>
        </div>
      </div>

      {/* Violation Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Violation Summary</h2>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{report.violationSummary.totalViolations}</div>
            <p className="text-sm text-gray-600">Total Violations</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{report.violationSummary.focusLostEvents}</div>
            <p className="text-sm text-gray-600">Focus Lost</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{report.violationSummary.unauthorizedItems}</div>
            <p className="text-sm text-gray-600">Unauthorized Items</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{report.violationSummary.multipleFaceEvents}</div>
            <p className="text-sm text-gray-600">Multiple Faces</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{report.violationSummary.noFaceEvents}</div>
            <p className="text-sm text-gray-600">No Face</p>
          </div>
        </div>
      </div>

      {/* Risk Factors & Recommendations */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Risk Factors</h2>
          {report.riskFactors.length === 0 ? (
            <p className="text-sm text-gray-500">No significant risk factors identified</p>
          ) : (
            <ul className="space-y-2">
              {report.riskFactors.map((risk, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{risk}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h2>
          <ul className="space-y-2">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detailed Events */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Detailed Event Log</h2>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report.detailedEvents.map((event, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {formatDate(event.timestamp)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {formatEventType(event.type)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {event.duration}s
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {event.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;