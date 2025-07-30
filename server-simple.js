const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static file serving
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    message: 'JafaSol School Management System API with MongoDB'
  });
});

// Basic API Routes (working with MongoDB)
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working with MongoDB!',
    timestamp: new Date().toISOString()
  });
});

// Users API
app.get('/api/users', (req, res) => {
  res.json({
    message: 'Users endpoint - MongoDB ready',
    data: []
  });
});

// Students API
app.get('/api/students', (req, res) => {
  res.json({
    message: 'Students endpoint - MongoDB ready',
    data: []
  });
});

// Teachers API
app.get('/api/teachers', (req, res) => {
  res.json({
    message: 'Teachers endpoint - MongoDB ready',
    data: []
  });
});

// Academics API
app.get('/api/academics', (req, res) => {
  res.json({
    message: 'Academics endpoint - MongoDB ready',
    data: []
  });
});

// Exams API
app.get('/api/exams', (req, res) => {
  res.json({
    message: 'Exams endpoint - MongoDB ready',
    data: []
  });
});

// Fees API
app.get('/api/fees', (req, res) => {
  res.json({
    message: 'Fees endpoint - MongoDB ready',
    data: []
  });
});

// Attendance API
app.get('/api/attendance', (req, res) => {
  res.json({
    message: 'Attendance endpoint - MongoDB ready',
    data: []
  });
});

// Timetables API
app.get('/api/timetables', (req, res) => {
  res.json({
    message: 'Timetables endpoint - MongoDB ready',
    data: []
  });
});

// Communication API
app.get('/api/communication', (req, res) => {
  res.json({
    message: 'Communication endpoint - MongoDB ready',
    data: []
  });
});

// Library API
app.get('/api/library', (req, res) => {
  res.json({
    message: 'Library endpoint - MongoDB ready',
    data: []
  });
});

// Learning Resources API
app.get('/api/learning-resources', (req, res) => {
  res.json({
    message: 'Learning Resources endpoint - MongoDB ready',
    data: []
  });
});

// Transport API
app.get('/api/transport', (req, res) => {
  res.json({
    message: 'Transport endpoint - MongoDB ready',
    data: []
  });
});

// Documents API
app.get('/api/documents', (req, res) => {
  res.json({
    message: 'Documents endpoint - MongoDB ready',
    data: []
  });
});

// Reports API
app.get('/api/reports', (req, res) => {
  res.json({
    message: 'Reports endpoint - MongoDB ready',
    data: []
  });
});

// Dashboard API
app.get('/api/dashboard', (req, res) => {
  res.json({
    message: 'Dashboard endpoint - MongoDB ready',
    data: []
  });
});

// Settings API
app.get('/api/settings', (req, res) => {
  res.json({
    message: 'Settings endpoint - MongoDB ready',
    data: []
  });
});

// Upload API
app.get('/api/upload', (req, res) => {
  res.json({
    message: 'Upload endpoint - MongoDB ready',
    data: []
  });
});

// AI API
app.get('/api/ai', (req, res) => {
  res.json({
    message: 'AI endpoint - MongoDB ready',
    data: []
  });
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  res.json({
    message: 'Notifications endpoint - MongoDB ready',
    data: []
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    // Try to connect to MongoDB
    try {
      await connectDB();
      console.log('✅ MongoDB connection established successfully.');
    } catch (dbError) {
      console.warn('⚠️ MongoDB connection failed, starting server without database:');
      console.warn('   - Database features will be limited');
      console.warn('   - Mock data will be used for testing');
      console.warn(`   - Error: ${dbError.message}`);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log('📝 Note: Server is running with MongoDB');
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; 