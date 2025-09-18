import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Home from './pages/Home';
import InterviewSession from './pages/InterviewSession';
import InterviewerDashboard from './pages/InterviewerDashboard';
import CandidateView from './pages/CandidateView';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/session/:sessionId" element={<InterviewSession />} />
            <Route path="/candidate/:sessionId" element={<CandidateView />} />
            <Route path="/interviewer/:sessionId" element={<InterviewerDashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: '#10B981',
                secondary: '#065F46',
              },
            },
            error: {
              duration: 5000,
              theme: {
                primary: '#EF4444',
                secondary: '#991B1B',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;