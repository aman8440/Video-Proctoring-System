const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: true,
    trim: true
  },
  candidateEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  interviewerName: {
    type: String,
    required: true,
    trim: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated'],
    default: 'active'
  },
  integrityScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  events: [{
    eventType: {
      type: String,
      enum: [
        'face_not_detected',
        'multiple_faces',
        'looking_away',
        'phone_detected',
        'book_detected',
        'device_detected',
        'eyes_closed',
        'audio_detected',
        'session_start',
        'session_end'
      ],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number, // in seconds
      default: 0
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    description: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  summary: {
    totalViolations: {
      type: Number,
      default: 0
    },
    focusLostEvents: {
      type: Number,
      default: 0
    },
    unauthorizedItems: {
      type: Number,
      default: 0
    },
    multipleFaceEvents: {
      type: Number,
      default: 0
    },
    noFaceEvents: {
      type: Number,
      default: 0
    }
  },
  videoRecordingPath: String,
  notes: String
}, {
  timestamps: true
});

// Calculate integrity score based on events
SessionSchema.methods.calculateIntegrityScore = function() {
  let score = 100;
  
  this.events.forEach(event => {
    switch(event.eventType) {
      case 'face_not_detected':
        if (event.duration > 10) score -= 15;
        else score -= 5;
        break;
      case 'multiple_faces':
        score -= 20;
        break;
      case 'looking_away':
        if (event.duration > 5) score -= 10;
        else score -= 3;
        break;
      case 'phone_detected':
        score -= 25;
        break;
      case 'book_detected':
      case 'device_detected':
        score -= 15;
        break;
      case 'eyes_closed':
        if (event.duration > 30) score -= 10;
        break;
      case 'audio_detected':
        score -= 8;
        break;
    }
  });

  this.integrityScore = Math.max(0, score);
  return this.integrityScore;
};

// Update summary statistics
SessionSchema.methods.updateSummary = function() {
  const summary = {
    totalViolations: 0,
    focusLostEvents: 0,
    unauthorizedItems: 0,
    multipleFaceEvents: 0,
    noFaceEvents: 0
  };

  this.events.forEach(event => {
    summary.totalViolations++;
    
    switch(event.eventType) {
      case 'looking_away':
      case 'eyes_closed':
        summary.focusLostEvents++;
        break;
      case 'phone_detected':
      case 'book_detected':
      case 'device_detected':
        summary.unauthorizedItems++;
        break;
      case 'multiple_faces':
        summary.multipleFaceEvents++;
        break;
      case 'face_not_detected':
        summary.noFaceEvents++;
        break;
    }
  });

  this.summary = summary;
};

// Pre-save middleware to calculate scores
SessionSchema.pre('save', function(next) {
  if (this.isModified('events')) {
    this.updateSummary();
    this.calculateIntegrityScore();
  }
  
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  
  next();
});

module.exports = mongoose.model('Session', SessionSchema);