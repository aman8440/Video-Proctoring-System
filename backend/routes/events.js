const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// Batch add multiple events
router.post('/batch', async (req, res) => {
  try {
    const { sessionId, events } = req.body;
    
    if (!sessionId || !events || !Array.isArray(events)) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, events (array)' 
      });
    }

    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const severityMap = {
      'face_not_detected': 'high',
      'multiple_faces': 'high',
      'looking_away': 'medium',
      'phone_detected': 'high',
      'book_detected': 'high',
      'device_detected': 'high',
      'eyes_closed': 'medium',
      'audio_detected': 'medium'
    };

    const processedEvents = events.map(event => ({
      eventType: event.eventType,
      timestamp: new Date(event.timestamp || Date.now()),
      duration: event.duration || 0,
      severity: severityMap[event.eventType] || 'medium',
      description: event.description || `${event.eventType.replace('_', ' ')} detected`,
      confidence: event.confidence || 0.8
    }));

    session.events.push(...processedEvents);
    await session.save();

    res.json({
      success: true,
      eventsAdded: processedEvents.length,
      integrityScore: session.integrityScore,
      message: 'Events added successfully'
    });
  } catch (error) {
    console.error('Error adding batch events:', error);
    res.status(500).json({ error: 'Failed to add events' });
  }
});

// Get events for a session with filtering
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { eventType, severity, startTime, endTime } = req.query;
    
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    let filteredEvents = session.events;

    // Apply filters
    if (eventType) {
      filteredEvents = filteredEvents.filter(event => event.eventType === eventType);
    }

    if (severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === severity);
    }

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      filteredEvents = filteredEvents.filter(event => 
        event.timestamp >= start && event.timestamp <= end
      );
    }

    res.json({
      success: true,
      events: filteredEvents,
      totalEvents: filteredEvents.length
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event statistics for a session
router.get('/:sessionId/stats', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const stats = {
      totalEvents: session.events.length,
      eventsByType: {},
      eventsBySeverity: {
        low: 0,
        medium: 0,
        high: 0
      },
      averageConfidence: 0,
      timeline: []
    };

    let totalConfidence = 0;
    let confidenceCount = 0;

    session.events.forEach(event => {
      // Count by type
      stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
      
      // Count by severity
      stats.eventsBySeverity[event.severity]++;
      
      // Calculate average confidence
      if (event.confidence) {
        totalConfidence += event.confidence;
        confidenceCount++;
      }
    });

    if (confidenceCount > 0) {
      stats.averageConfidence = Math.round((totalConfidence / confidenceCount) * 100) / 100;
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({ error: 'Failed to fetch event statistics' });
  }
});

// Delete specific event
router.delete('/:sessionId/:eventId', async (req, res) => {
  try {
    const { sessionId, eventId } = req.params;
    
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const eventIndex = session.events.findIndex(event => event._id.toString() === eventId);
    
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    session.events.splice(eventIndex, 1);
    await session.save();

    res.json({
      success: true,
      message: 'Event deleted successfully',
      integrityScore: session.integrityScore
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;