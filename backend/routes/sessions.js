const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');

// Create new session
router.post('/create', async (req, res) => {
  try {
    const { candidateName, candidateEmail, interviewerName } = req.body;
    
    if (!candidateName || !candidateEmail || !interviewerName) {
      return res.status(400).json({ 
        error: 'Missing required fields: candidateName, candidateEmail, interviewerName' 
      });
    }

    const sessionId = uuidv4();
    
    const session = new Session({
      candidateName,
      candidateEmail,
      interviewerName,
      sessionId,
      startTime: new Date()
    });

    // Add session start event
    session.events.push({
      eventType: 'session_start',
      timestamp: new Date(),
      severity: 'low',
      description: 'Interview session started'
    });

    const savedSession = await session.save();
    
    res.status(201).json({
      success: true,
      session: savedSession,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session by ID
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Add event to session
router.post('/:sessionId/events', async (req, res) => {
  try {
    const { eventType, duration, confidence, description } = req.body;
    const sessionId = req.params.sessionId;

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

    const newEvent = {
      eventType,
      timestamp: new Date(),
      duration: duration || 0,
      severity: severityMap[eventType] || 'medium',
      description: description || `${eventType.replace('_', ' ')} detected`,
      confidence: confidence || 0.8
    };

    session.events.push(newEvent);
    await session.save();

    res.json({
      success: true,
      event: newEvent,
      integrityScore: session.integrityScore,
      message: 'Event added successfully'
    });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ error: 'Failed to add event' });
  }
});

// End session
router.post('/:sessionId/end', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { notes } = req.body;

    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.endTime = new Date();
    session.status = 'completed';
    session.notes = notes || '';

    // Add session end event
    session.events.push({
      eventType: 'session_end',
      timestamp: new Date(),
      severity: 'low',
      description: 'Interview session ended'
    });

    await session.save();

    res.json({
      success: true,
      session,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get all sessions (for admin/interviewer dashboard)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sessions = await Session.find()
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments();

    res.json({
      success: true,
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Delete session
router.delete('/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    const session = await Session.findOneAndDelete({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;