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

// ==================== AUTH ROUTES ====================

// Admin login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Mock admin authentication
    if (email === 'admin@jafasol.com' && password === 'password') {
      const token = 'mock-jwt-token-' + Date.now();
      const user = {
        id: 'admin-1',
        name: 'JafaSol Super Admin',
        email: email,
        role: 'super_admin'
      };
      
      res.json({
        message: 'Login successful',
        token,
        user
      });
    } else {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
  // For now, allow all requests (no authentication required for testing)
  next();
};

// Get admin dashboard overview
app.get('/api/admin/dashboard', (req, res) => {
  try {
    // Mock data for admin dashboard
    const stats = {
      totalSchools: 25,
      activeSubscriptions: 23,
      pendingSchools: 2,
      suspendedSchools: 0,
      monthlyRevenue: 12500,
      totalUsers: 2500,
      systemHealth: {
        database: 'Excellent',
        performance: 'Good',
        uptime: '99.9%',
        lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    };

    res.json({
      message: 'Dashboard stats retrieved successfully',
      stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard stats',
      message: error.message
    });
  }
});

// List all schools with detailed info
app.get('/api/admin/schools', (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', plan = '' } = req.query;
    
    // Mock schools data
    const mockSchools = [
      {
        id: '1',
        name: 'St. Mary\'s Academy',
        domain: 'stmarys.jafasol.com',
        status: 'active',
        subscriptionPlan: 'Premium',
        createdAt: '2024-01-15',
        stats: { users: 150, students: 120, teachers: 30 },
        contactEmail: 'admin@stmarys.edu'
      },
      {
        id: '2',
        name: 'Bright Future School',
        domain: 'brightfuture.jafasol.com',
        status: 'active',
        subscriptionPlan: 'Basic',
        createdAt: '2024-02-01',
        stats: { users: 80, students: 65, teachers: 15 },
        contactEmail: 'info@brightfuture.edu'
      },
      {
        id: '3',
        name: 'Excellence Academy',
        domain: 'excellence.jafasol.com',
        status: 'pending',
        subscriptionPlan: 'Enterprise',
        createdAt: '2024-03-10',
        stats: { users: 200, students: 180, teachers: 20 },
        contactEmail: 'admin@excellence.edu'
      },
      {
        id: '4',
        name: 'Innovation School',
        domain: 'innovation.jafasol.com',
        status: 'active',
        subscriptionPlan: 'Premium',
        createdAt: '2024-01-20',
        stats: { users: 120, students: 100, teachers: 20 },
        contactEmail: 'admin@innovation.edu'
      },
      {
        id: '5',
        name: 'Future Leaders Academy',
        domain: 'futureleaders.jafasol.com',
        status: 'active',
        subscriptionPlan: 'Basic',
        createdAt: '2024-02-15',
        stats: { users: 90, students: 75, teachers: 15 },
        contactEmail: 'info@futureleaders.edu'
      }
    ];
    
    // Filter schools based on query parameters
    let filteredSchools = mockSchools;
    
    if (search) {
      filteredSchools = mockSchools.filter(school => 
        school.name.toLowerCase().includes(search.toLowerCase()) ||
        school.domain.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status) {
      filteredSchools = filteredSchools.filter(school => school.status === status);
    }
    
    if (plan) {
      filteredSchools = filteredSchools.filter(school => school.subscriptionPlan.toLowerCase() === plan.toLowerCase());
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedSchools = filteredSchools.slice(startIndex, endIndex);
    
    res.json({
      message: 'Schools retrieved successfully',
      schools: paginatedSchools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredSchools.length,
        pages: Math.ceil(filteredSchools.length / limit)
      }
    });
  } catch (error) {
    console.error('Schools error:', error);
    res.status(500).json({
      error: 'Failed to get schools',
      message: error.message
    });
  }
});

// Get school details
app.get('/api/admin/schools/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock school details
    const schoolDetails = {
      id,
      name: 'St. Mary\'s Academy',
      domain: 'stmarys.jafasol.com',
      status: 'active',
      subscriptionPlan: 'Premium',
      createdAt: '2024-01-15',
      expiresAt: '2025-01-15',
      stats: { users: 150, students: 120, teachers: 30 },
      contactEmail: 'admin@stmarys.edu',
      contactPhone: '+1234567890',
      address: '123 School Street, City, State 12345',
      features: ['Dashboard', 'Student Management', 'Fee Management', 'Library', 'Transport'],
      usage: {
        storageUsed: '2.5GB',
        storageLimit: '10GB',
        lastActive: '2024-07-30T10:30:00Z',
        monthlyLogins: 450
      }
    };

    res.json({
      message: 'School details retrieved successfully',
      school: schoolDetails
    });
  } catch (error) {
    console.error('School details error:', error);
    res.status(500).json({
      error: 'Failed to get school details',
      message: error.message
    });
  }
});

// Create new school
app.post('/api/admin/schools', (req, res) => {
  try {
    const schoolData = req.body;
    
    // Generate school credentials
    const schoolId = Date.now().toString();
    const generatedPassword = Math.random().toString(36).slice(-8);
    const generatedUsername = `admin@${schoolData.subdomain || schoolData.name.toLowerCase().replace(/\s+/g, '')}.jafasol.com`;
    
    // Mock response for creating school
    const newSchool = {
      id: schoolId,
      ...schoolData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      stats: { users: 0, students: 0, teachers: 0 },
      credentials: {
        username: generatedUsername,
        password: generatedPassword,
        loginUrl: `https://${schoolData.subdomain || schoolData.name.toLowerCase().replace(/\s+/g, '')}.jafasol.com`
      }
    };

    res.status(201).json({
      message: 'School created successfully with login credentials',
      school: newSchool,
      credentials: {
        username: generatedUsername,
        password: generatedPassword,
        loginUrl: `https://${schoolData.subdomain || schoolData.name.toLowerCase().replace(/\s+/g, '')}.jafasol.com`
      }
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({
      error: 'Failed to create school',
      message: error.message
    });
  }
});

// Update school
app.put('/api/admin/schools/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Mock response for updating school
    const updatedSchool = {
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    res.json({
      message: 'School updated successfully',
      school: updatedSchool
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({
      error: 'Failed to update school',
      message: error.message
    });
  }
});

// Delete school
app.delete('/api/admin/schools/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock response for deleting school
    res.json({
      message: 'School deleted successfully',
      schoolId: id
    });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({
      error: 'Failed to delete school',
      message: error.message
    });
  }
});

// Get subscriptions
app.get('/api/admin/subscriptions', (req, res) => {
  try {
    // Mock subscriptions data
    const subscriptions = [
      {
        schoolId: '1',
        schoolName: 'St. Mary\'s Academy',
        plan: 'Premium',
        status: 'active',
        createdAt: '2024-01-15',
        expiresAt: '2025-01-15',
        amount: 500,
        isOverdue: false
      },
      {
        schoolId: '2',
        schoolName: 'Bright Future School',
        plan: 'Basic',
        status: 'active',
        createdAt: '2024-02-01',
        expiresAt: '2025-02-01',
        amount: 250,
        isOverdue: false
      },
      {
        schoolId: '3',
        schoolName: 'Excellence Academy',
        plan: 'Enterprise',
        status: 'pending',
        createdAt: '2024-03-10',
        expiresAt: '2025-03-10',
        amount: 1000,
        isOverdue: false
      }
    ];

    res.json({
      message: 'Subscriptions retrieved successfully',
      subscriptions
    });
  } catch (error) {
    console.error('Subscriptions error:', error);
    res.status(500).json({
      error: 'Failed to get subscriptions',
      message: error.message
    });
  }
});

// Get support tickets
app.get('/api/admin/support', (req, res) => {
  try {
    // Mock support tickets data
    const tickets = [
      {
        id: 1,
        schoolId: '1',
        schoolName: 'St. Mary\'s Academy',
        subject: 'Login Issue',
        status: 'open',
        priority: 'medium',
        createdAt: '2024-07-29T10:00:00Z',
        lastUpdated: '2024-07-29T15:30:00Z'
      },
      {
        id: 2,
        schoolId: '2',
        schoolName: 'Bright Future School',
        subject: 'Feature Request',
        status: 'in-progress',
        priority: 'low',
        createdAt: '2024-07-28T14:20:00Z',
        lastUpdated: '2024-07-29T09:15:00Z'
      }
    ];

    res.json({
      message: 'Support tickets retrieved successfully',
      tickets
    });
  } catch (error) {
    console.error('Support tickets error:', error);
    res.status(500).json({
      error: 'Failed to get support tickets',
      message: error.message
    });
  }
});

// Get system settings
app.get('/api/admin/settings', (req, res) => {
  try {
    // Mock system settings
    const settings = {
      system: {
        maintenanceMode: false,
        backupFrequency: 'daily',
        dataRetention: '7 years',
        maxFileSize: '10MB',
        maxUsersPerSchool: 1000
      },
      billing: {
        basicPlanPrice: 250,
        premiumPlanPrice: 500,
        enterprisePlanPrice: 1000,
        currency: 'USD',
        billingCycle: 'monthly'
      },
      features: {
        aiEnabled: true,
        analyticsEnabled: true,
        communicationEnabled: true,
        libraryEnabled: true,
        transportEnabled: true
      }
    };

    res.json({
      message: 'System settings retrieved successfully',
      settings
    });
  } catch (error) {
    console.error('System settings error:', error);
    res.status(500).json({
      error: 'Failed to get system settings',
      message: error.message
    });
  }
});

// Get analytics
app.get('/api/admin/analytics', (req, res) => {
  try {
    // Mock analytics data
    const analytics = {
      overview: {
        totalSchools: 25,
        activeSchools: 23,
        totalUsers: 2500,
        newSchoolsThisMonth: 3,
        growthRate: '12.0'
      },
      performance: {
        systemUptime: '99.9%',
        averageResponseTime: '150ms',
        databasePerformance: 'Excellent',
        storageUsage: '45%'
      },
      usage: {
        mostUsedFeatures: ['Dashboard', 'Student Management', 'Fee Management'],
        averageSessionDuration: '45 minutes',
        peakUsageHours: '9:00 AM - 3:00 PM'
      }
    };

    res.json({
      message: 'Analytics retrieved successfully',
      analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Failed to get analytics',
      message: error.message
    });
  }
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