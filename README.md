# Video Proctoring System with AI Focus & Object Detection

A comprehensive video proctoring system built with React frontend and Node.js backend, featuring real-time focus detection, object recognition, and integrity scoring for online interviews.

## 🚀 Features

### Core Functionality
- **Real-time Video Monitoring**: Live video feed with recording capabilities
- **Focus Detection**: AI-powered attention monitoring with configurable thresholds
- **Object Detection**: Identification of unauthorized items (phones, books, devices)
- **Multiple Face Detection**: Alerts when multiple people are present
- **Integrity Scoring**: Dynamic scoring system based on violations
- **Real-time Alerts**: Instant notifications for interviewers
- **Comprehensive Reporting**: Detailed PDF/CSV reports with analytics

### Advanced Features
- **Eye Tracking**: Drowsiness and attention detection
- **Audio Monitoring**: Background voice and noise detection
- **WebSocket Integration**: Real-time communication between candidate and interviewer
- **Analytics Dashboard**: System-wide insights and trends
- **Violation Timeline**: Detailed chronological event logging
- **Export Capabilities**: CSV and PDF report generation

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│  Node.js API    │────│   MongoDB       │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              WebSocket
           (Real-time Events)
```

## 📋 Prerequisites

- **Node.js**: v16.0.0 or higher
- **MongoDB**: v4.4 or higher
- **npm**: v7.0.0 or higher
- **Modern Browser**: Chrome, Firefox, Safari with WebRTC support
- **Camera & Microphone**: Required for video proctoring

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git https://github.com/aman8440/Video-Proctoring-System.git
cd Video-Proctoring-System
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Important Environment Variables:**
```bash
MONGODB_URI=mongodb://localhost:27017/video_proctoring
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

### 3. Frontend Setup

```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure API endpoint
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### 4. Database Setup

```bash
# Start MongoDB (if using local installation)
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- **Frontend**: https://video-proctoring-system-one.vercel.app
- **Backend API**: https://video-proctoring-system-52ph.onrender.com
- **MongoDB**: mongodb://localhost:27017

## 🎯 Usage Guide

### Creating an Interview Session

1. **Access the Application**: Navigate to http://localhost:3000
2. **Create Session**: Click "Start New Interview"
3. **Fill Details**: 
   - Candidate Name
   - Candidate Email  
   - Interviewer Name
4. **Generate Session**: Get unique Session ID

### Joining as Candidate

1. **Join Session**: Use Session ID to join
2. **Select Role**: Choose "Join as Candidate"
3. **Camera Setup**: Allow camera and microphone access
4. **Start Interview**: Begin monitored session

**Candidate Guidelines:**
- Keep face visible at all times
- Look at the camera/screen
- Remove phones and notes from view
- Ensure you're alone in the room
- Maintain good lighting

### Joining as Interviewer

1. **Join Session**: Use same Session ID
2. **Select Role**: Choose "Join as Interviewer"
3. **Monitor Dashboard**: View real-time alerts and statistics
4. **End Session**: Conclude and generate report

### Generating Reports

1. **Navigate to Reports**: Click "Reports" in navigation
2. **Select Session**: Choose completed session
3. **View Details**: Access comprehensive analysis
4. **Download**: Export as CSV or PDF

## 🔧 API Documentation

### Session Management

#### Create Session
```http
POST /api/sessions/create
Content-Type: application/json

{
  "candidateName": "John Doe",
  "candidateEmail": "john@example.com", 
  "interviewerName": "Jane Smith"
}
```

#### Get Session
```http
GET /api/sessions/{sessionId}
```

#### End Session
```http
POST /api/sessions/{sessionId}/end
Content-Type: application/json

{
  "notes": "Interview completed successfully"
}
```

### Event Logging

#### Add Violation Event
```http
POST /api/sessions/{sessionId}/events
Content-Type: application/json

{
  "eventType": "looking_away",
  "duration": 7,
  "confidence": 0.85,
  "description": "Candidate looked away for 7 seconds"
}
```

### Reports

#### Generate Report
```http
GET /api/reports/{sessionId}
```

#### Download CSV
```http
GET /api/reports/{sessionId}/csv
```

#### Analytics
```http
GET /api/reports/analytics/summary?startDate=2024-01-01&endDate=2024-01-31
```

## 🤖 AI Detection Details

### Focus Detection Algorithm

1. **Face Detection**: Identifies presence and position of face
2. **Eye Tracking**: Monitors eye position and blink patterns
3. **Gaze Direction**: Calculates looking direction relative to camera
4. **Attention Scoring**: Combines multiple factors for focus score

**Thresholds:**
- Looking away: >5 seconds triggers violation
- No face detected: >10 seconds triggers violation
- Eyes closed: >30 seconds triggers drowsiness alert

### Object Detection System

1. **Real-time Analysis**: Processes video frames every 2 seconds
2. **Object Classification**: Identifies phones, books, devices
3. **Confidence Scoring**: Each detection includes confidence level
4. **False Positive Filtering**: Reduces noise through temporal consistency

**Detected Objects:**
- Mobile phones (confidence >0.5)
- Books and papers (confidence >0.4)
- Electronic devices (laptops, tablets)
- Multiple faces/people

## 📊 Integrity Scoring System

### Scoring Algorithm

**Base Score**: 100 points

**Deductions:**
- Face not detected (>10s): -15 points
- Face not detected (<10s): -5 points
- Multiple faces: -20 points
- Looking away (>5s): -10 points
- Looking away (<5s): -3 points
- Phone detected: -25 points
- Book/notes detected: -15 points
- Other devices: -15 points
- Eyes closed (>30s): -10 points
- Background audio: -8 points

**Final Categories:**
- **Excellent**: 90-100 points
- **Good**: 70-89 points  
- **Fair**: 50-69 points
- **Poor**: 0-49 points

## 📈 Analytics & Reporting

### Available Metrics

- **Session Statistics**: Duration, violations, scores
- **Violation Breakdown**: Types and frequency
- **Timeline Analysis**: Event chronology
- **Integrity Trends**: Score distribution over time
- **System Health**: Accuracy, uptime, false positives

### Report Formats

1. **Detailed Web Report**: Interactive dashboard view
2. **CSV Export**: Spreadsheet-compatible data
3. **PDF Report**: Professional formatted document
4. **JSON API**: Programmatic access to data

## 🔧 Configuration Options

### Detection Sensitivity

```javascript
// Focus Detection Thresholds
const FOCUS_CONFIG = {
  LOOKING_AWAY_THRESHOLD: 5000, // ms
  NO_FACE_THRESHOLD: 10000,     // ms
  DROWSINESS_THRESHOLD: 30000   // ms
};

// Object Detection Settings
const OBJECT_CONFIG = {
  DETECTION_INTERVAL: 2000,     // ms
  CONFIDENCE_THRESHOLD: 0.5,    // 0.0-1.0
  FORBIDDEN_OBJECTS: ['phone', 'book', 'laptop']
};
```

### Scoring Weights

```javascript
const SCORING_CONFIG = {
  FACE_NOT_DETECTED: -15,
  MULTIPLE_FACES: -20,
  LOOKING_AWAY: -10,
  PHONE_DETECTED: -25,
  UNAUTHORIZED_ITEM: -15
};
```

## 🚀 Deployment Guide

### Production Deployment

1. **Environment Setup**:
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/proctoring
FRONTEND_URL=https://your-domain.com
```

2. **Build Frontend**:
```bash
cd frontend
npm run build
```

3. **Deploy Backend**:
```bash
cd backend
npm start
```

### Docker Deployment

```dockerfile
# Dockerfile for backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Cloud Deployment Options

- **Heroku**: Easy deployment with MongoDB Atlas
- **AWS**: EC2 + RDS/DocumentDB
- **Google Cloud**: App Engine + Cloud Firestore
- **Azure**: App Service + Cosmos DB

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test

# Run specific test suite
npm test -- --grep "Session API"

# Coverage report
npm run test:coverage
```

### Frontend Testing

```bash
cd frontend
npm test

# Run with coverage
npm test -- --coverage --watchAll=false
```

### Integration Testing

```bash
# Test complete user flow
npm run test:integration

# Load testing
npm run test:load
```

## 🐛 Troubleshooting

### Common Issues

1. **Camera Access Denied**
   ```javascript
   // Check browser permissions
   navigator.permissions.query({name: 'camera'})
   ```

2. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Restart MongoDB
   sudo systemctl restart mongod
   ```

3. **WebSocket Connection Issues**
   ```javascript
   // Check firewall settings
   sudo ufw allow 5000
   ```

4. **High CPU Usage**
   - Reduce detection frequency
   - Optimize video resolution
   - Use hardware acceleration

### Performance Optimization

1. **Video Processing**:
   - Lower frame rate for detection
   - Resize frames before processing
   - Use Web Workers for heavy computations

2. **Database Optimization**:
   - Index frequently queried fields
   - Implement data archiving
   - Use connection pooling

3. **Frontend Optimization**:
   - Lazy load components
   - Implement virtual scrolling
   - Optimize bundle size

## 🤝 Contributing

### Development Workflow

1. **Fork Repository**: Create personal fork
2. **Create Branch**: `git checkout -b feature/new-feature`
3. **Make Changes**: Implement feature/fix
4. **Add Tests**: Ensure test coverage
5. **Submit PR**: Create pull request

### Code Standards

- **JavaScript**: ESLint + Prettier
- **React**: Functional components with hooks
- **Node.js**: Express.js best practices
- **Database**: Mongoose schemas with validation
- **Testing**: Jest + React Testing Library

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Frontend Development**: React.js, TensorFlow.js, WebRTC
- **Backend Development**: Node.js, Express.js, MongoDB
- **AI/ML Integration**: Computer Vision, Object Detection
- **DevOps**: Docker, CI/CD, Cloud Deployment

## 🙏 Acknowledgments

- **TensorFlow.js**: AI model integration
- **MediaPipe**: Face detection capabilities  
- **Socket.io**: Real-time communication
- **MongoDB**: Database management
- **React**: Frontend framework
- **Node.js**: Backend runtime

## 📞 Support

For technical support or questions:

- **Email**: amang4885@gmail.com
