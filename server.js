const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Role = require('./models/Role');

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Please provide a valid authentication token'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'jafasol_super_secret_jwt_key_2024_change_in_production', (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token',
        message: 'Please login again'
      });
    }
    req.user = user;
    next();
  });
};

// Admin role verification middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }

  if (req.user.role !== 'SuperAdmin' && req.user.role !== 'Admin') {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Admin access required'
    });
  }

  next();
};

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'jafasol_super_secret_jwt_key_2024_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://jafasol.com',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('roleId');
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    if (user.status !== 'Active') {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'Your account is not active. Please contact administrator.'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.roleId?.name,
        name: user.name 
      }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.roleId?.name,
        avatarUrl: user.avatarUrl
      },
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Dashboard API with real stats
app.get('/api/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get real stats from database
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'Active' });
    
    // Calculate system health based on real metrics
    const systemHealth = totalUsers > 0 ? 'Operational' : 'Initializing';
    const uptime = process.uptime();
    const responseTime = Date.now() - req.startTime || 0;
    
    const stats = {
      totalSchools: 0, // Will be populated when School model is available
      activeSubscriptions: 0, // Will be populated when Subscription model is available
      pendingSchools: 0,
      suspendedSchools: 0,
      monthlyRevenue: 0, // Will be populated when Revenue model is available
      totalUsers: totalUsers,
      activeUsers: activeUsers,
      systemHealth: systemHealth,
      uptime: uptime > 0 ? Math.round((uptime / (24 * 60 * 60)) * 100) / 100 : 0,
      responseTime: responseTime,
      lastUpdated: new Date().toISOString(),
      newSchoolsThisMonth: 0, // Will be populated when School model is available
      totalRevenue: 0, // Will be populated when Revenue model is available
      averageResponseTime: responseTime,
      systemLoad: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100
    };

    res.json({
      message: 'Dashboard stats retrieved successfully',
      stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: error.message
    });
  }
});

// Admin endpoints
app.get('/api/admin/schools', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // For now, return empty array since School model is not implemented yet
    // This will be populated when School model is available
    res.json({ message: 'Schools retrieved successfully', schools: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().populate('roleId').select('-password');
    res.json({ message: 'Users retrieved successfully', users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({
      message: 'Settings retrieved successfully',
      settings: {
        systemName: 'Jafasol School Management System',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: 'Connected',
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.get('/api/admin/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'Notifications retrieved successfully', notifications: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.get('/api/admin/support/tickets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'Support tickets retrieved successfully', tickets: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

app.get('/api/admin/subdomains', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'Subdomains retrieved successfully', subdomains: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subdomains' });
  }
});

app.get('/api/admin/subdomains/templates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({
      message: 'Subdomain templates retrieved successfully',
      templates: [
        {
          id: 'template-1',
          name: 'Standard School Template',
          description: 'Basic template for standard schools',
          features: ['Attendance', 'Fees', 'Academics'],
          price: 0
        },
        {
          id: 'template-2',
          name: 'Premium School Template',
          description: 'Advanced template with all features',
          features: ['Attendance', 'Fees', 'Academics', 'Communication', 'Analytics'],
          price: 5000
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subdomain templates' });
  }
});

app.get('/api/admin/backups', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'Backups retrieved successfully', backups: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

app.get('/api/admin/announcements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'Announcements retrieved successfully', announcements: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

app.get('/api/admin/security/login-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'Login logs retrieved successfully', logs: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch login logs' });
  }
});

app.get('/api/admin/security/audit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'Audit logs retrieved successfully', audit: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

app.get('/api/admin/security/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({
      message: 'Security settings retrieved successfully',
      settings: {
        twoFactorEnabled: false,
        sessionTimeout: 24,
        passwordPolicy: 'Strong',
        loginAttempts: 5
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch security settings' });
  }
});

app.get('/api/admin/features', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'Features retrieved successfully', features: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

app.get('/api/admin/ab-tests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'AB tests retrieved successfully', tests: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AB tests' });
  }
});

app.get('/api/admin/ai/chat', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'AI chat history retrieved successfully', chatHistory: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI chat history' });
  }
});

app.get('/api/admin/ai/insights', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'AI insights retrieved successfully', insights: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

app.get('/api/admin/ai/recommendations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'AI recommendations retrieved successfully', recommendations: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI recommendations' });
  }
});

// Start server
const startServer = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();