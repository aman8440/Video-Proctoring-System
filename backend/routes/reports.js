const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// Generate detailed report for a session
router.get('/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const report = generateDetailedReport(session);
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Generate CSV report
router.get('/:sessionId/csv', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const csvData = generateCSVReport(session);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="proctoring_report_${sessionId}.csv"`);
    res.send(csvData);
  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500).json({ error: 'Failed to generate CSV report' });
  }
});

// Generate summary statistics for multiple sessions
router.get('/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        startTime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const sessions = await Session.find(dateFilter);
    const analytics = generateAnalytics(sessions);
    
    res.json({
      success: true,
      analytics,
      totalSessions: sessions.length
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

function generateDetailedReport(session) {
  const report = {
    sessionInfo: {
      sessionId: session.sessionId,
      candidateName: session.candidateName,
      candidateEmail: session.candidateEmail,
      interviewerName: session.interviewerName,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      status: session.status
    },
    integrityAssessment: {
      finalScore: session.integrityScore,
      rating: getIntegrityRating(session.integrityScore),
      recommendation: getRecommendation(session.integrityScore)
    },
    violationSummary: {
      totalViolations: session.summary.totalViolations,
      focusLostEvents: session.summary.focusLostEvents,
      unauthorizedItems: session.summary.unauthorizedItems,
      multipleFaceEvents: session.summary.multipleFaceEvents,
      noFaceEvents: session.summary.noFaceEvents
    },
    detailedEvents: session.events.map(event => ({
      type: event.eventType,
      timestamp: event.timestamp,
      duration: event.duration,
      severity: event.severity,
      description: event.description,
      confidence: event.confidence
    })),
    timelineAnalysis: generateTimelineAnalysis(session.events),
    riskFactors: identifyRiskFactors(session),
    recommendations: generateRecommendations(session)
  };

  return report;
}

function generateCSVReport(session) {
  let csvContent = 'PROCTORING REPORT\n';
  csvContent += `Session ID,${session.sessionId}\n`;
  csvContent += `Candidate Name,${session.candidateName}\n`;
  csvContent += `Candidate Email,${session.candidateEmail}\n`;
  csvContent += `Interviewer,${session.interviewerName}\n`;
  csvContent += `Start Time,${session.startTime}\n`;
  csvContent += `End Time,${session.endTime || 'N/A'}\n`;
  csvContent += `Duration (minutes),${session.duration}\n`;
  csvContent += `Integrity Score,${session.integrityScore}\n`;
  csvContent += `Status,${session.status}\n\n`;

  csvContent += 'VIOLATION SUMMARY\n';
  csvContent += `Total Violations,${session.summary.totalViolations}\n`;
  csvContent += `Focus Lost Events,${session.summary.focusLostEvents}\n`;
  csvContent += `Unauthorized Items,${session.summary.unauthorizedItems}\n`;
  csvContent += `Multiple Face Events,${session.summary.multipleFaceEvents}\n`;
  csvContent += `No Face Events,${session.summary.noFaceEvents}\n\n`;

  csvContent += 'DETAILED EVENTS\n';
  csvContent += 'Timestamp,Event Type,Duration (sec),Severity,Description,Confidence\n';
  
  session.events.forEach(event => {
    csvContent += `${event.timestamp},${event.eventType},${event.duration},${event.severity},"${event.description}",${event.confidence}\n`;
  });

  return csvContent;
}

function generateAnalytics(sessions) {
  const analytics = {
    averageIntegrityScore: 0,
    totalViolations: 0,
    commonViolations: {},
    scoreDistribution: {
      excellent: 0,  // 90-100
      good: 0,       // 70-89
      fair: 0,       // 50-69
      poor: 0        // 0-49
    },
    averageSessionDuration: 0
  };

  if (sessions.length === 0) return analytics;

  let totalScore = 0;
  let totalDuration = 0;

  sessions.forEach(session => {
    totalScore += session.integrityScore;
    totalDuration += session.duration;
    analytics.totalViolations += session.summary.totalViolations;

    // Score distribution
    if (session.integrityScore >= 90) analytics.scoreDistribution.excellent++;
    else if (session.integrityScore >= 70) analytics.scoreDistribution.good++;
    else if (session.integrityScore >= 50) analytics.scoreDistribution.fair++;
    else analytics.scoreDistribution.poor++;

    // Common violations
    session.events.forEach(event => {
      if (event.eventType !== 'session_start' && event.eventType !== 'session_end') {
        analytics.commonViolations[event.eventType] = 
          (analytics.commonViolations[event.eventType] || 0) + 1;
      }
    });
  });

  analytics.averageIntegrityScore = Math.round(totalScore / sessions.length);
  analytics.averageSessionDuration = Math.round(totalDuration / sessions.length);

  return analytics;
}

function generateTimelineAnalysis(events) {
  const timeline = [];
  let currentPeriod = null;
  
  events.forEach(event => {
    const hour = new Date(event.timestamp).getHours();
    const period = `${hour}:00-${hour + 1}:00`;
    
    if (period !== currentPeriod) {
      timeline.push({
        period,
        events: [],
        violationCount: 0
      });
      currentPeriod = period;
    }
    
    const lastPeriod = timeline[timeline.length - 1];
    if (event.eventType !== 'session_start' && event.eventType !== 'session_end') {
      lastPeriod.events.push(event.eventType);
      lastPeriod.violationCount++;
    }
  });

  return timeline;
}

function identifyRiskFactors(session) {
  const riskFactors = [];

  if (session.integrityScore < 50) {
    riskFactors.push('Very low integrity score - High risk candidate');
  }

  if (session.summary.unauthorizedItems > 0) {
    riskFactors.push('Unauthorized items detected during interview');
  }

  if (session.summary.multipleFaceEvents > 0) {
    riskFactors.push('Multiple people present during interview');
  }

  if (session.summary.noFaceEvents > 3) {
    riskFactors.push('Candidate frequently absent from camera');
  }

  if (session.summary.focusLostEvents > 10) {
    riskFactors.push('Excessive focus loss - attention issues');
  }

  return riskFactors;
}

function generateRecommendations(session) {
  const recommendations = [];

  if (session.integrityScore >= 90) {
    recommendations.push('Candidate showed excellent integrity - Recommended for next round');
  } else if (session.integrityScore >= 70) {
    recommendations.push('Good candidate with minor issues - Consider for next round with notes');
  } else if (session.integrityScore >= 50) {
    recommendations.push('Moderate concerns - Requires careful evaluation');
  } else {
    recommendations.push('Significant integrity issues - Not recommended');
  }

  if (session.summary.unauthorizedItems > 0) {
    recommendations.push('Investigate unauthorized item usage');
  }

  if (session.summary.multipleFaceEvents > 0) {
    recommendations.push('Verify identity and ensure solo participation in future rounds');
  }

  return recommendations;
}

function getIntegrityRating(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

function getRecommendation(score) {
  if (score >= 90) return 'Highly Recommended';
  if (score >= 70) return 'Recommended';
  if (score >= 50) return 'Consider with Caution';
  return 'Not Recommended';
}

module.exports = router;