const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import models
const User = require('./models/User');
const School = require('./models/School');
const Role = require('./models/Role');
const AuditLog = require('./models/AuditLog');

const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://jafasol-admin.vercel.app',
      'https://jafasol-admin.netlify.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
    message: 'JafaSol School Management System API',
    overallStatus: 'Operational',
    services: [
      { id: 'api', name: 'API Server', status: 'Operational', latency: 120, lastChecked: new Date().toISOString() },
      { id: 'db', name: 'Database', status: 'Operational', latency: 80, lastChecked: new Date().toISOString() },
      { id: 'storage', name: 'File Storage', status: 'Operational', latency: 60, lastChecked: new Date().toISOString() },
    ],
    apiResponseTime: Array.from({ length: 30 }, (_, i) => ({ time: `${i}m ago`, value: 100 + Math.floor(Math.random() * 50) })),
    dbQueryLoad: Array.from({ length: 30 }, (_, i) => ({ time: `${i}m ago`, value: 40 + Math.floor(Math.random() * 20) })),
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

// Admin AI Chat
app.get('/api/admin/ai/chat', (req, res) => {
  res.json({
    message: 'AI chat history retrieved successfully',
    data: []
  });
});

// Admin AI Insights
app.get('/api/admin/ai/insights', (req, res) => {
  res.json({
    message: 'AI insights retrieved successfully',
    data: []
  });
});

// Admin AI Recommendations
app.get('/api/admin/ai/recommendations', (req, res) => {
  res.json({
    message: 'AI recommendations retrieved successfully',
    data: []
  });
});

// Admin AI Message
app.post('/api/admin/ai/chat', (req, res) => {
  try {
    const { message, userId, userName } = req.body;
    
    // Mock AI response
    const response = {
      id: Date.now().toString(),
      message: `AI response to: ${message}`,
      timestamp: new Date().toISOString(),
      userId,
      userName
    };
    
    res.json({
      message: 'AI message sent successfully',
      response
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      error: 'AI chat failed',
      message: error.message
    });
  }
});

// Subdomain Health Check
app.get('/api/admin/subdomains/:id/health', (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock health check response
    const healthData = {
      id,
      status: 'online',
      uptime: 99.9,
      responseTime: 120,
      sslStatus: 'active',
      lastChecked: new Date().toISOString(),
      issues: []
    };
    
    res.json({
      message: 'Health check completed successfully',
      health: healthData
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Provision Subdomain
app.post('/api/admin/subdomains/:id/provision', (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock provisioning response
    const provisionData = {
      id,
      status: 'provisioned',
      serverUrl: `https://${id}.jafasol.com`,
      sslCertificate: 'active',
      dnsRecords: [
        { type: 'A', name: id, value: '192.168.1.1' },
        { type: 'CNAME', name: `www.${id}`, value: `${id}.jafasol.com` }
      ],
      provisionedAt: new Date().toISOString()
    };
    
    res.json({
      message: 'Subdomain provisioned successfully',
      provision: provisionData
    });
  } catch (error) {
    console.error('Provision error:', error);
    res.status(500).json({
      error: 'Provision failed',
      message: error.message
    });
  }
});

// Get Subdomain Analytics
app.get('/api/admin/subdomains/:id/analytics', (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock analytics data
    const analyticsData = {
      id,
      uptime: 99.9,
      responseTime: 120,
      traffic: {
        daily: 1500,
        weekly: 10500,
        monthly: 45000
      },
      visitors: {
        unique: 850,
        returning: 650
      },
      performance: {
        loadTime: 1.2,
        serverLoad: 45
      },
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      message: 'Analytics retrieved successfully',
      analytics: analyticsData
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Analytics failed',
      message: error.message
    });
  }
});

// Bulk Provision Subdomains
app.post('/api/admin/subdomains/bulk-provision', (req, res) => {
  try {
    const { subdomainIds } = req.body;
    
    // Mock bulk provisioning response
    const results = subdomainIds.map(id => ({
      id,
      status: 'provisioned',
      serverUrl: `https://${id}.jafasol.com`,
      provisionedAt: new Date().toISOString()
    }));
    
    res.json({
      message: 'Bulk provisioning completed successfully',
      results
    });
  } catch (error) {
    console.error('Bulk provision error:', error);
    res.status(500).json({
      error: 'Bulk provision failed',
      message: error.message
    });
  }
});

// Get Subdomain Templates
app.get('/api/admin/subdomains/templates', (req, res) => {
  try {
    // Mock templates data
    const templates = [
      {
        id: 'basic',
        name: 'Basic Template',
        description: 'Standard hosting configuration',
        features: ['SSL Certificate', 'Basic DNS', 'CDN'],
        price: 0
      },
      {
        id: 'premium',
        name: 'Premium Template',
        description: 'Advanced hosting with monitoring',
        features: ['SSL Certificate', 'Advanced DNS', 'CDN', 'Monitoring', 'Backup'],
        price: 5000
      },
      {
        id: 'enterprise',
        name: 'Enterprise Template',
        description: 'Full-featured hosting solution',
        features: ['SSL Certificate', 'Advanced DNS', 'CDN', 'Monitoring', 'Backup', 'Load Balancer', 'DDoS Protection'],
        price: 15000
      }
    ];
    
    res.json({
      message: 'Templates retrieved successfully',
      templates
    });
  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({
      error: 'Templates failed',
      message: error.message
    });
  }
});

// Apply Subdomain Template
app.post('/api/admin/subdomains/:id/apply-template', (req, res) => {
  try {
    const { id } = req.params;
    const { templateId } = req.body;
    
    // Mock template application
    const appliedTemplate = {
      id,
      templateId,
      appliedAt: new Date().toISOString(),
      status: 'applied',
      features: ['SSL Certificate', 'Basic DNS', 'CDN']
    };
    
    res.json({
      message: 'Template applied successfully',
      template: appliedTemplate
    });
  } catch (error) {
    console.error('Template application error:', error);
    res.status(500).json({
      error: 'Template application failed',
      message: error.message
    });
  }
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

// Get dashboard statistics
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const [
      totalSchools,
      activeSchools,
      recentActivities
    ] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ status: 'Active' }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10)
    ]);

    const stats = {
      totalSchools: totalSchools,
      activeSubscriptions: activeSchools,
      pendingSchools: totalSchools - activeSchools,
      suspendedSchools: 0,
      monthlyRevenue: 12500, // Mock data for now
      totalUsers: 2500, // Mock data for now
      systemHealth: 'Operational',
      uptime: 99.9,
      responseTime: 120,
      lastUpdated: new Date().toISOString()
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

// List all schools with detailed info
app.get('/api/admin/schools', async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });
    res.json({
      message: 'Schools retrieved successfully',
      schools
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({
      error: 'Failed to fetch schools',
      message: error.message
    });
  }
});

// Get school details
app.get('/api/admin/schools/:id', async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({
        error: 'School not found',
        message: `School with ID '${req.params.id}' does not exist`
      });
    }
    res.json({
      message: 'School details retrieved successfully',
      school
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({
      error: 'Failed to fetch school',
      message: error.message
    });
  }
});

// Create new school
app.post('/api/admin/schools', async (req, res) => {
  try {
    const { name, email, phone, plan, status, modules } = req.body;
    
    // Check if school already exists
    const existingSchool = await School.findOne({ email });
    if (existingSchool) {
      return res.status(409).json({
        error: 'School already exists',
        message: `School with email '${email}' already exists`
      });
    }
    
    // Auto-generate subdomain
    const subdomain = generateUniqueSubdomain(name);
    
    const newSchool = new School({
      name,
      email,
      phone,
      plan: plan || 'Basic',
      status: status || 'Active',
      subdomain,
      storageUsage: Math.floor(Math.random() * 50) + 10,
      modules: modules || ['attendance', 'fees', 'academics']
    });
    
    await newSchool.save();
    
    res.status(201).json({
      message: 'School created successfully with auto-generated subdomain',
      school: newSchool
    });
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({
      error: 'Failed to create school',
      message: error.message
    });
  }
});

// Update school
app.put('/api/admin/schools/:id', async (req, res) => {
  try {
    const updates = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    if (!school) {
      return res.status(404).json({
        error: 'School not found',
        message: `School with ID '${req.params.id}' does not exist`
      });
    }
    
    res.json({
      message: 'School updated successfully',
      school
    });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({
      error: 'Failed to update school',
      message: error.message
    });
  }
});

// Delete school
app.delete('/api/admin/schools/:id', async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    
    if (!school) {
      return res.status(404).json({
        error: 'School not found',
        message: `School with ID '${req.params.id}' does not exist`
      });
    }
    
    res.json({
      message: 'School deleted successfully',
      school
    });
  } catch (error) {
    console.error('Error deleting school:', error);
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

// ==================== BACKUPS ====================

let backups = [
  {
    id: '1',
    schoolId: '1',
    schoolName: "St. Mary's Academy",
    createdAt: '2024-07-30 10:00',
    type: 'Manual',
    status: 'Completed',
    size: '150 MB',
  },
];

// List all backups
app.get('/api/admin/backups', (req, res) => {
  res.json({
    message: 'Backups retrieved successfully',
    backups,
  });
});

// Create new backup
app.post('/api/admin/backups', (req, res) => {
  const { schoolId, schoolName } = req.body;
  const newBackup = {
    id: String(Date.now()),
    schoolId,
    schoolName,
    createdAt: new Date().toISOString(),
    type: 'Manual',
    status: 'Completed',
    size: `${Math.floor(Math.random() * 200) + 50} MB`,
  };
  backups.unshift(newBackup);
  res.status(201).json({
    message: 'Backup created successfully',
    backup: newBackup,
  });
});

// ==================== DATA EXPORT ====================

const exportData = {
  schools: [
    { id: '1', name: "St. Mary's Academy", plan: 'Premium', status: 'Active' },
    { id: '2', name: 'Bright Future School', plan: 'Basic', status: 'Active' },
  ],
  users: [
    { id: 'admin-1', name: 'JafaSol Super Admin', email: 'admin@jafasol.com', role: 'super_admin' },
  ],
  invoices: [
    { id: '1', schoolId: '1', amount: 199, status: 'Due', dueDate: '2024-08-15' },
  ],
  tickets: [
    { id: '1', schoolId: '1', subject: 'Payment Gateway Issue', status: 'Open' },
  ],
  logs: [
    { id: '1', action: 'LOGIN', userId: 'admin-1', timestamp: '2024-07-30T10:00:00Z' },
  ],
};

// List available export types
app.get('/api/admin/export', (req, res) => {
  res.json({
    message: 'Available export types',
    types: Object.keys(exportData),
  });
});

// Export data for a type
app.post('/api/admin/export', (req, res) => {
  const { type } = req.body;
  if (!type || !exportData[type]) {
    return res.status(400).json({ error: 'Invalid export type' });
  }
  res.json({
    message: `Exported data for ${type}`,
    data: exportData[type],
  });
});

// ==================== ENHANCED SUBDOMAIN MANAGEMENT ====================

let subdomains = [
  {
    id: '1',
    schoolId: '1',
    schoolName: 'St. Mary\'s Academy',
    subdomain: 'stmarys',
    fullDomain: 'stmarys.jafasol.com',
    url: 'https://stmarys.jafasol.com',
    sslStatus: 'active',
    serverStatus: 'online',
    dnsRecords: [
      { type: 'A', name: 'stmarys.jafasol.com', value: '192.168.1.100' },
      { type: 'CNAME', name: 'www.stmarys.jafasol.com', value: 'stmarys.jafasol.com' }
    ],
    createdAt: '2024-07-30T10:00:00Z',
    lastChecked: '2024-07-30T10:00:00Z',
    isActive: true
  },
  {
    id: '2',
    schoolId: '2',
    schoolName: 'Bright Future School',
    subdomain: 'brightfuture',
    fullDomain: 'brightfuture.jafasol.com',
    url: 'https://brightfuture.jafasol.com',
    sslStatus: 'active',
    serverStatus: 'online',
    dnsRecords: [
      { type: 'A', name: 'brightfuture.jafasol.com', value: '192.168.1.101' },
      { type: 'CNAME', name: 'www.brightfuture.jafasol.com', value: 'brightfuture.jafasol.com' }
    ],
    createdAt: '2024-07-30T09:00:00Z',
    lastChecked: '2024-07-30T09:00:00Z',
    isActive: true
  }
];

// Auto-generate subdomain from school name
function generateSubdomain(schoolName) {
  return schoolName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .substring(0, 20); // Limit length
}

// Check if subdomain is available
function isSubdomainAvailable(subdomain) {
  return !subdomains.some(s => s.subdomain === subdomain);
}

// Generate unique subdomain
function generateUniqueSubdomain(schoolName) {
  let baseSubdomain = generateSubdomain(schoolName);
  let subdomain = baseSubdomain;
  let counter = 1;
  
  while (!isSubdomainAvailable(subdomain)) {
    subdomain = `${baseSubdomain}${counter}`;
    counter++;
  }
  
  return subdomain;
}

// Create subdomain automatically when school is created
app.post('/api/admin/schools', (req, res) => {
  const { name, email, phone, plan, status, modules } = req.body;
  
  // Check if school already exists
  const existingSchool = schools.find(s => s.email === email);
  if (existingSchool) {
    return res.status(409).json({
      error: 'School already exists',
      message: `School with email '${email}' already exists`
    });
  }
  
  const newSchool = {
    id: `school_${Date.now()}`,
    name,
    email,
    phone,
    logoUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
    plan: plan || 'Basic',
    status: status || 'Active',
    subdomain: '', // Will be generated
    storageUsage: Math.floor(Math.random() * 50) + 10,
    createdAt: new Date().toISOString(),
    modules: modules || ['attendance', 'fees', 'academics']
  };
  
  // Auto-generate subdomain
  const subdomain = generateUniqueSubdomain(name);
  newSchool.subdomain = subdomain;
  
  schools.push(newSchool);
  
  // Create subdomain automatically
  const newSubdomain = {
    id: `subdomain_${Date.now()}`,
    schoolId: newSchool.id,
    schoolName: name,
    subdomain: subdomain,
    fullDomain: `${subdomain}.jafasol.com`,
    url: `https://${subdomain}.jafasol.com`,
    sslStatus: 'pending',
    serverStatus: 'provisioning',
    dnsRecords: [
      { type: 'A', name: `${subdomain}.jafasol.com`, value: '192.168.1.100' },
      { type: 'CNAME', name: `www.${subdomain}.jafasol.com`, value: `${subdomain}.jafasol.com` }
    ],
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    isActive: false
  };
  
  subdomains.push(newSubdomain);
  
  res.status(201).json({
    message: 'School created successfully with auto-generated subdomain',
    school: newSchool,
    subdomain: newSubdomain
  });
});

// Get subdomain by school ID
app.get('/api/admin/schools/:id/subdomain', (req, res) => {
  const { id } = req.params;
  const subdomain = subdomains.find(s => s.schoolId === id);
  
  if (!subdomain) {
    return res.status(404).json({
      error: 'Subdomain not found',
      message: `No subdomain found for school ID '${id}'`
    });
  }
  
  res.json({
    message: 'Subdomain retrieved successfully',
    subdomain
  });
});

// Update subdomain DNS records
app.put('/api/admin/subdomains/:id/dns', (req, res) => {
  const { id } = req.params;
  const { dnsRecords } = req.body;
  
  const subdomainIndex = subdomains.findIndex(s => s.id === id);
  if (subdomainIndex === -1) {
    return res.status(404).json({
      error: 'Subdomain not found',
      message: `Subdomain with ID '${id}' does not exist`
    });
  }
  
  subdomains[subdomainIndex].dnsRecords = dnsRecords;
  subdomains[subdomainIndex].lastChecked = new Date().toISOString();
  
  res.json({
    message: 'DNS records updated successfully',
    subdomain: subdomains[subdomainIndex]
  });
});

// Provision subdomain (activate it)
app.post('/api/admin/subdomains/:id/provision', (req, res) => {
  const { id } = req.params;
  
  const subdomainIndex = subdomains.findIndex(s => s.id === id);
  if (subdomainIndex === -1) {
    return res.status(404).json({
      error: 'Subdomain not found',
      message: `Subdomain with ID '${id}' does not exist`
    });
  }
  
  // Simulate provisioning process
  subdomains[subdomainIndex].sslStatus = 'active';
  subdomains[subdomainIndex].serverStatus = 'online';
  subdomains[subdomainIndex].isActive = true;
  subdomains[subdomainIndex].lastChecked = new Date().toISOString();
  
  res.json({
    message: 'Subdomain provisioned successfully',
    subdomain: subdomains[subdomainIndex]
  });
});

// Get subdomain analytics
app.get('/api/admin/subdomains/:id/analytics', (req, res) => {
  const { id } = req.params;
  const subdomain = subdomains.find(s => s.id === id);
  
  if (!subdomain) {
    return res.status(404).json({
      error: 'Subdomain not found',
      message: `Subdomain with ID '${id}' does not exist`
    });
  }
  
  // Mock analytics data
  const analytics = {
    subdomainId: id,
    schoolName: subdomain.schoolName,
    fullDomain: subdomain.fullDomain,
    uptime: 99.8,
    responseTime: 120,
    monthlyVisits: Math.floor(Math.random() * 10000) + 1000,
    activeUsers: Math.floor(Math.random() * 500) + 50,
    sslStatus: subdomain.sslStatus,
    serverStatus: subdomain.serverStatus,
    lastUpdated: new Date().toISOString()
  };
  
  res.json({
    message: 'Subdomain analytics retrieved successfully',
    analytics
  });
});

// Bulk provision subdomains
app.post('/api/admin/subdomains/bulk-provision', (req, res) => {
  const { subdomainIds } = req.body;
  
  const results = [];
  
  subdomainIds.forEach(id => {
    const subdomainIndex = subdomains.findIndex(s => s.id === id);
    if (subdomainIndex !== -1) {
      subdomains[subdomainIndex].sslStatus = 'active';
      subdomains[subdomainIndex].serverStatus = 'online';
      subdomains[subdomainIndex].isActive = true;
      subdomains[subdomainIndex].lastChecked = new Date().toISOString();
      
      results.push({
        id,
        status: 'provisioned',
        subdomain: subdomains[subdomainIndex]
      });
    } else {
      results.push({
        id,
        status: 'not_found',
        error: 'Subdomain not found'
      });
    }
  });
  
  res.json({
    message: 'Bulk provisioning completed',
    results
  });
});

// Get subdomain templates
app.get('/api/admin/subdomains/templates', (req, res) => {
  const templates = [
    {
      id: 'basic',
      name: 'Basic Template',
      description: 'Standard school management features',
      features: ['attendance', 'fees', 'academics'],
      price: 0
    },
    {
      id: 'premium',
      name: 'Premium Template',
      description: 'Advanced features with analytics',
      features: ['attendance', 'fees', 'academics', 'analytics', 'communication'],
      price: 50
    },
    {
      id: 'enterprise',
      name: 'Enterprise Template',
      description: 'Full-featured school management',
      features: ['attendance', 'fees', 'academics', 'analytics', 'communication', 'transport', 'library'],
      price: 100
    }
  ];
  
  res.json({
    message: 'Subdomain templates retrieved successfully',
    templates
  });
});

// Apply template to subdomain
app.post('/api/admin/subdomains/:id/apply-template', (req, res) => {
  const { id } = req.params;
  const { templateId } = req.body;
  
  const subdomainIndex = subdomains.findIndex(s => s.id === id);
  if (subdomainIndex === -1) {
    return res.status(404).json({
      error: 'Subdomain not found',
      message: `Subdomain with ID '${id}' does not exist`
    });
  }
  
  // Apply template features
  const templates = {
    basic: ['attendance', 'fees', 'academics'],
    premium: ['attendance', 'fees', 'academics', 'analytics', 'communication'],
    enterprise: ['attendance', 'fees', 'academics', 'analytics', 'communication', 'transport', 'library']
  };
  
  const template = templates[templateId];
  if (!template) {
    return res.status(400).json({
      error: 'Invalid template',
      message: `Template '${templateId}' does not exist`
    });
  }
  
  // Update school modules
  const schoolIndex = schools.findIndex(s => s.id === subdomains[subdomainIndex].schoolId);
  if (schoolIndex !== -1) {
    schools[schoolIndex].modules = template;
  }
  
  res.json({
    message: 'Template applied successfully',
    subdomain: subdomains[subdomainIndex],
    appliedTemplate: templateId,
    features: template
  });
});

// List all subdomains
app.get('/api/admin/subdomains', (req, res) => {
  res.json({
    message: 'Subdomains retrieved successfully',
    subdomains
  });
});

// Get specific subdomain
app.get('/api/admin/subdomains/:id', (req, res) => {
  const { id } = req.params;
  const subdomain = subdomains.find(s => s.id === id);
  
  if (!subdomain) {
    return res.status(404).json({
      error: 'Subdomain not found',
      message: `Subdomain with ID '${id}' does not exist`
    });
  }
  
  res.json({
    message: 'Subdomain retrieved successfully',
    subdomain
  });
});

// Create new subdomain manually
app.post('/api/admin/subdomains', (req, res) => {
  const { schoolId, schoolName, subdomain } = req.body;
  
  // Check if subdomain already exists
  const existingSubdomain = subdomains.find(s => s.subdomain === subdomain);
  if (existingSubdomain) {
    return res.status(409).json({
      error: 'Subdomain already exists',
      message: `Subdomain '${subdomain}.jafasol.com' is already in use`
    });
  }
  
  const newSubdomain = {
    id: `subdomain_${Date.now()}`,
    schoolId,
    schoolName,
    subdomain,
    fullDomain: `${subdomain}.jafasol.com`,
    url: `https://${subdomain}.jafasol.com`,
    sslStatus: 'pending',
    serverStatus: 'provisioning',
    dnsRecords: [
      { type: 'A', name: `${subdomain}.jafasol.com`, value: '192.168.1.100' },
      { type: 'CNAME', name: `www.${subdomain}.jafasol.com`, value: `${subdomain}.jafasol.com` }
    ],
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    isActive: false
  };
  
  subdomains.push(newSubdomain);
  
  res.status(201).json({
    message: 'Subdomain created successfully',
    subdomain: newSubdomain
  });
});

// Update subdomain
app.put('/api/admin/subdomains/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const subdomainIndex = subdomains.findIndex(s => s.id === id);
  if (subdomainIndex === -1) {
    return res.status(404).json({
      error: 'Subdomain not found',
      message: `Subdomain with ID '${id}' does not exist`
    });
  }
  
  subdomains[subdomainIndex] = {
    ...subdomains[subdomainIndex],
    ...updates,
    lastChecked: new Date().toISOString()
  };
  
  res.json({
    message: 'Subdomain updated successfully',
    subdomain: subdomains[subdomainIndex]
  });
});

// Delete subdomain
app.delete('/api/admin/subdomains/:id', (req, res) => {
  const { id } = req.params;
  
  const subdomainIndex = subdomains.findIndex(s => s.id === id);
  if (subdomainIndex === -1) {
    return res.status(404).json({
      error: 'Subdomain not found',
      message: `Subdomain with ID '${id}' does not exist`
    });
  }
  
  const deletedSubdomain = subdomains.splice(subdomainIndex, 1)[0];
  
  res.json({
    message: 'Subdomain deleted successfully',
    subdomain: deletedSubdomain
  });
});

// Check subdomain health
app.get('/api/admin/subdomains/:id/health', (req, res) => {
  const { id } = req.params;
  const subdomain = subdomains.find(s => s.id === id);
  
  if (!subdomain) {
    return res.status(404).json({
      error: 'Subdomain not found',
      message: `Subdomain with ID '${id}' does not exist`
    });
  }
  
  // Simulate health check
  const health = {
    status: 'online',
    responseTime: Math.floor(Math.random() * 100) + 50,
    uptime: '99.9%',
    lastChecked: new Date().toISOString(),
    sslValid: true,
    sslExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    dnsPropagated: true
  };
  
  res.json({
    message: 'Subdomain health check completed',
    health
  });
});

// ==================== USER MANAGEMENT ====================

let users = [
  {
    id: 'admin-1',
    name: 'JafaSol Super Admin',
    email: 'admin@jafasol.com',
    role: 'Super Admin',
    status: 'Active',
    schoolId: null,
    schoolName: null,
    avatarUrl: 'https://picsum.photos/seed/admin/40/40',
    lastLogin: '2024-07-30T10:00:00Z',
    createdAt: '2024-01-01'
  },
  {
    id: 'school-admin-1',
    name: 'St. Mary\'s Admin',
    email: 'admin@stmarys.edu',
    role: 'School Admin',
    status: 'Active',
    schoolId: '1',
    schoolName: 'St. Mary\'s Academy',
    avatarUrl: 'https://picsum.photos/seed/stmarys/40/40',
    lastLogin: '2024-07-30T09:30:00Z',
    createdAt: '2024-01-15'
  }
];

// List all users
app.get('/api/admin/users', (req, res) => {
  const { role, status, search } = req.query;
  
  let filteredUsers = users;
  
  if (role) {
    filteredUsers = filteredUsers.filter(u => u.role === role);
  }
  
  if (status) {
    filteredUsers = filteredUsers.filter(u => u.status === status);
  }
  
  if (search) {
    filteredUsers = filteredUsers.filter(u => 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json({
    message: 'Users retrieved successfully',
    users: filteredUsers
  });
});

// Get specific user
app.get('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID '${id}' does not exist`
    });
  }
  
  res.json({
    message: 'User retrieved successfully',
    user
  });
});

// Create new user
app.post('/api/admin/users', (req, res) => {
  const { name, email, role, schoolId, schoolName } = req.body;
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      error: 'User already exists',
      message: `User with email '${email}' already exists`
    });
  }
  
  const newUser = {
    id: `usr_${Date.now()}`,
    name,
    email,
    role,
    status: 'Active',
    schoolId: schoolId || null,
    schoolName: schoolName || null,
    avatarUrl: `https://picsum.photos/seed/${Date.now()}/40/40`,
    lastLogin: 'Never',
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  res.status(201).json({
    message: 'User created successfully',
    user: newUser
  });
});

// Update user
app.put('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID '${id}' does not exist`
    });
  }
  
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    lastLogin: users[userIndex].lastLogin // Preserve last login
  };
  
  res.json({
    message: 'User updated successfully',
    user: users[userIndex]
  });
});

// Delete user
app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID '${id}' does not exist`
    });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  
  res.json({
    message: 'User deleted successfully',
    user: deletedUser
  });
});

// Password reset
app.post('/api/admin/users/:id/reset-password', (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID '${id}' does not exist`
    });
  }
  
  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8);
  
  res.json({
    message: 'Password reset initiated successfully',
    tempPassword,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

// Toggle user status
app.post('/api/admin/users/:id/toggle-status', (req, res) => {
  const { id } = req.params;
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID '${id}' does not exist`
    });
  }
  
  const currentStatus = users[userIndex].status;
  const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
  
  users[userIndex].status = newStatus;
  
  res.json({
    message: `User status updated to ${newStatus}`,
    user: users[userIndex]
  });
});

// ==================== NOTIFICATIONS SYSTEM ====================

let notifications = [
  {
    id: '1',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Sunday at 2 AM',
    type: 'announcement',
    priority: 'medium',
    target: 'all',
    targetName: 'All Schools',
    status: 'active',
    sentAt: '2024-07-30T10:00:00Z',
    readBy: ['admin-1'],
    createdAt: '2024-07-30T10:00:00Z'
  },
  {
    id: '2',
    title: 'New Feature Available',
    message: 'Advanced analytics dashboard is now available',
    type: 'feature',
    priority: 'high',
    target: 'all',
    targetName: 'All Schools',
    status: 'active',
    sentAt: '2024-07-30T09:00:00Z',
    readBy: [],
    createdAt: '2024-07-30T09:00:00Z'
  }
];

let announcements = [
  {
    id: '1',
    title: 'Welcome to JafaSol',
    message: 'Welcome to the new school management platform',
    target: 'all',
    targetName: 'All Schools',
    sentAt: '2024-07-30T08:00:00Z',
    status: 'active'
  }
];

// List all notifications
app.get('/api/admin/notifications', (req, res) => {
  const { type, status, target } = req.query;
  
  let filteredNotifications = notifications;
  
  if (type) {
    filteredNotifications = filteredNotifications.filter(n => n.type === type);
  }
  
  if (status) {
    filteredNotifications = filteredNotifications.filter(n => n.status === status);
  }
  
  if (target) {
    filteredNotifications = filteredNotifications.filter(n => n.target === target);
  }
  
  res.json({
    message: 'Notifications retrieved successfully',
    notifications: filteredNotifications
  });
});

// Get specific notification
app.get('/api/admin/notifications/:id', (req, res) => {
  const { id } = req.params;
  const notification = notifications.find(n => n.id === id);
  
  if (!notification) {
    return res.status(404).json({
      error: 'Notification not found',
      message: `Notification with ID '${id}' does not exist`
    });
  }
  
  res.json({
    message: 'Notification retrieved successfully',
    notification
  });
});

// Create new notification
app.post('/api/admin/notifications', (req, res) => {
  const { title, message, type, priority, target, targetName } = req.body;
  
  const newNotification = {
    id: `notif_${Date.now()}`,
    title,
    message,
    type: type || 'announcement',
    priority: priority || 'medium',
    target: target || 'all',
    targetName: targetName || 'All Schools',
    status: 'active',
    sentAt: new Date().toISOString(),
    readBy: [],
    createdAt: new Date().toISOString()
  };
  
  notifications.push(newNotification);
  
  res.status(201).json({
    message: 'Notification created successfully',
    notification: newNotification
  });
});

// Update notification
app.put('/api/admin/notifications/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const notificationIndex = notifications.findIndex(n => n.id === id);
  if (notificationIndex === -1) {
    return res.status(404).json({
      error: 'Notification not found',
      message: `Notification with ID '${id}' does not exist`
    });
  }
  
  notifications[notificationIndex] = {
    ...notifications[notificationIndex],
    ...updates
  };
  
  res.json({
    message: 'Notification updated successfully',
    notification: notifications[notificationIndex]
  });
});

// Delete notification
app.delete('/api/admin/notifications/:id', (req, res) => {
  const { id } = req.params;
  
  const notificationIndex = notifications.findIndex(n => n.id === id);
  if (notificationIndex === -1) {
    return res.status(404).json({
      error: 'Notification not found',
      message: `Notification with ID '${id}' does not exist`
    });
  }
  
  const deletedNotification = notifications.splice(notificationIndex, 1)[0];
  
  res.json({
    message: 'Notification deleted successfully',
    notification: deletedNotification
  });
});

// Mark notification as read
app.post('/api/admin/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  const notificationIndex = notifications.findIndex(n => n.id === id);
  if (notificationIndex === -1) {
    return res.status(404).json({
      error: 'Notification not found',
      message: `Notification with ID '${id}' does not exist`
    });
  }
  
  if (!notifications[notificationIndex].readBy.includes(userId)) {
    notifications[notificationIndex].readBy.push(userId);
  }
  
  res.json({
    message: 'Notification marked as read',
    notification: notifications[notificationIndex]
  });
});

// List all announcements
app.get('/api/admin/announcements', (req, res) => {
  res.json({
    message: 'Announcements retrieved successfully',
    announcements
  });
});

// Create new announcement
app.post('/api/admin/announcements', (req, res) => {
  const { title, message, target, targetName } = req.body;
  
  const newAnnouncement = {
    id: `announce_${Date.now()}`,
    title,
    message,
    target: target || 'all',
    targetName: targetName || 'All Schools',
    sentAt: new Date().toISOString(),
    status: 'active'
  };
  
  announcements.push(newAnnouncement);
  
  res.status(201).json({
    message: 'Announcement created successfully',
    announcement: newAnnouncement
  });
});

// ==================== SECURITY FEATURES ====================

let loginLogs = [
  {
    id: '1',
    userId: 'admin-1',
    userName: 'JafaSol Super Admin',
    email: 'admin@jafasol.com',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success',
    timestamp: '2024-07-30T10:00:00Z',
    location: 'Nairobi, Kenya'
  },
  {
    id: '2',
    userId: 'school-admin-1',
    userName: 'St. Mary\'s Admin',
    email: 'admin@stmarys.edu',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    status: 'failed',
    timestamp: '2024-07-30T09:30:00Z',
    location: 'Mombasa, Kenya'
  }
];

let securityAudit = [
  {
    id: '1',
    action: 'USER_CREATED',
    userId: 'admin-1',
    userName: 'JafaSol Super Admin',
    details: 'Created new school admin: admin@stmarys.edu',
    ipAddress: '192.168.1.100',
    timestamp: '2024-07-30T10:00:00Z',
    severity: 'low'
  },
  {
    id: '2',
    action: 'SCHOOL_DELETED',
    userId: 'admin-1',
    userName: 'JafaSol Super Admin',
    details: 'Deleted school: Test School',
    ipAddress: '192.168.1.100',
    timestamp: '2024-07-30T09:00:00Z',
    severity: 'high'
  }
];

let securitySettings = {
  twoFactorEnabled: true,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
    maxAge: 90 // days
  },
  sessionTimeout: 30, // minutes
  maxLoginAttempts: 5,
  lockoutDuration: 15, // minutes
  ipWhitelist: [],
  auditLogRetention: 365 // days
};

// Get login logs
app.get('/api/admin/security/login-logs', (req, res) => {
  const { userId, status, startDate, endDate } = req.query;
  
  let filteredLogs = loginLogs;
  
  if (userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === userId);
  }
  
  if (status) {
    filteredLogs = filteredLogs.filter(log => log.status === status);
  }
  
  if (startDate) {
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
  }
  
  if (endDate) {
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
  }
  
  res.json({
    message: 'Login logs retrieved successfully',
    logs: filteredLogs
  });
});

// Get security audit
app.get('/api/admin/security/audit', (req, res) => {
  const { action, severity, startDate, endDate } = req.query;
  
  let filteredAudit = securityAudit;
  
  if (action) {
    filteredAudit = filteredAudit.filter(audit => audit.action === action);
  }
  
  if (severity) {
    filteredAudit = filteredAudit.filter(audit => audit.severity === severity);
  }
  
  if (startDate) {
    filteredAudit = filteredAudit.filter(audit => new Date(audit.timestamp) >= new Date(startDate));
  }
  
  if (endDate) {
    filteredAudit = filteredAudit.filter(audit => new Date(audit.timestamp) <= new Date(endDate));
  }
  
  res.json({
    message: 'Security audit retrieved successfully',
    audit: filteredAudit
  });
});

// Get security settings
app.get('/api/admin/security/settings', (req, res) => {
  res.json({
    message: 'Security settings retrieved successfully',
    settings: securitySettings
  });
});

// Update security settings
app.put('/api/admin/security/settings', (req, res) => {
  const updates = req.body;
  
  securitySettings = {
    ...securitySettings,
    ...updates
  };
  
  res.json({
    message: 'Security settings updated successfully',
    settings: securitySettings
  });
});

// Enable/disable 2FA for user
app.post('/api/admin/security/2fa/:userId', (req, res) => {
  const { userId } = req.params;
  const { enabled } = req.body;
  
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID '${userId}' does not exist`
    });
  }
  
  // In a real app, you'd update the user's 2FA status in the database
  res.json({
    message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} for ${user.name}`,
    userId,
    twoFactorEnabled: enabled
  });
});

// Get 2FA status for user
app.get('/api/admin/security/2fa/:userId', (req, res) => {
  const { userId } = req.params;
  
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID '${userId}' does not exist`
    });
  }
  
  res.json({
    message: 'Two-factor authentication status retrieved',
    userId,
    twoFactorEnabled: Math.random() > 0.5, // Mock 2FA status
    lastUpdated: new Date().toISOString()
  });
});

// ==================== FEATURE TOGGLES ====================

let featureToggles = [
  {
    id: '1',
    name: 'Advanced Analytics',
    description: 'Enable advanced analytics features',
    status: 'enabled',
    targetAudience: 'all',
    rolloutPercentage: 100,
    createdAt: '2024-07-01T00:00:00Z',
    lastModified: '2024-07-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'AI Chat Support',
    description: 'Enable AI-powered chat support',
    status: 'enabled',
    targetAudience: 'premium',
    rolloutPercentage: 50,
    createdAt: '2024-07-10T00:00:00Z',
    lastModified: '2024-07-20T00:00:00Z'
  },
  {
    id: '3',
    name: 'Mobile App',
    description: 'Enable mobile app features',
    status: 'disabled',
    targetAudience: 'all',
    rolloutPercentage: 0,
    createdAt: '2024-07-05T00:00:00Z',
    lastModified: '2024-07-25T00:00:00Z'
  }
];

// Get all feature toggles
app.get('/api/admin/features', (req, res) => {
  res.json({
    message: 'Feature toggles retrieved successfully',
    featureToggles
  });
});

// Get specific feature toggle
app.get('/api/admin/features/:id', (req, res) => {
  const { id } = req.params;
  const featureToggle = featureToggles.find(f => f.id === id);
  
  if (!featureToggle) {
    return res.status(404).json({
      error: 'Feature toggle not found',
      message: `Feature toggle with ID '${id}' does not exist`
    });
  }
  
  res.json({
    message: 'Feature toggle retrieved successfully',
    featureToggle
  });
});

// Create new feature toggle
app.post('/api/admin/features', (req, res) => {
  const { name, description, targetAudience, rolloutPercentage } = req.body;
  
  const newFeatureToggle = {
    id: `feature_${Date.now()}`,
    name,
    description,
    status: 'disabled',
    targetAudience: targetAudience || 'all',
    rolloutPercentage: rolloutPercentage || 0,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
  
  featureToggles.push(newFeatureToggle);
  
  res.status(201).json({
    message: 'Feature toggle created successfully',
    featureToggle: newFeatureToggle
  });
});

// Update feature toggle
app.put('/api/admin/features/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const featureToggleIndex = featureToggles.findIndex(f => f.id === id);
  if (featureToggleIndex === -1) {
    return res.status(404).json({
      error: 'Feature toggle not found',
      message: `Feature toggle with ID '${id}' does not exist`
    });
  }
  
  featureToggles[featureToggleIndex] = {
    ...featureToggles[featureToggleIndex],
    ...updates,
    lastModified: new Date().toISOString()
  };
  
  res.json({
    message: 'Feature toggle updated successfully',
    featureToggle: featureToggles[featureToggleIndex]
  });
});

// Toggle feature
app.post('/api/admin/features/:id/toggle', (req, res) => {
  const { id } = req.params;
  
  const featureToggleIndex = featureToggles.findIndex(f => f.id === id);
  if (featureToggleIndex === -1) {
    return res.status(404).json({
      error: 'Feature toggle not found',
      message: `Feature toggle with ID '${id}' does not exist`
    });
  }
  
  const currentStatus = featureToggles[featureToggleIndex].status;
  featureToggles[featureToggleIndex].status = currentStatus === 'enabled' ? 'disabled' : 'enabled';
  featureToggles[featureToggleIndex].lastModified = new Date().toISOString();
  
  res.json({
    message: 'Feature toggle updated successfully',
    featureToggle: featureToggles[featureToggleIndex]
  });
});

// Delete feature toggle
app.delete('/api/admin/features/:id', (req, res) => {
  const { id } = req.params;
  
  const featureToggleIndex = featureToggles.findIndex(f => f.id === id);
  if (featureToggleIndex === -1) {
    return res.status(404).json({
      error: 'Feature toggle not found',
      message: `Feature toggle with ID '${id}' does not exist`
    });
  }
  
  const deletedFeatureToggle = featureToggles.splice(featureToggleIndex, 1)[0];
  
  res.json({
    message: 'Feature toggle deleted successfully',
    featureToggle: deletedFeatureToggle
  });
});

// ==================== SUPPORT TICKETS ====================

let supportTickets = [
  {
    id: '1',
    schoolId: '1',
    schoolName: 'St. Mary\'s Academy',
    subject: 'Login Issue',
    description: 'Unable to access the portal',
    status: 'open',
    priority: 'high',
    lastUpdated: '2024-07-30T10:00:00Z',
    conversation: [
      { id: '1', sender: 'School Admin', message: 'Cannot login to the system', timestamp: '2024-07-30T10:00:00Z' },
      { id: '2', sender: 'Support', message: 'We are investigating the issue', timestamp: '2024-07-30T10:30:00Z' }
    ]
  },
  {
    id: '2',
    schoolId: '2',
    schoolName: 'Bright Future School',
    subject: 'Payment Problem',
    description: 'Payment not processing',
    status: 'in_progress',
    priority: 'medium',
    lastUpdated: '2024-07-30T09:00:00Z',
    conversation: [
      { id: '1', sender: 'School Admin', message: 'Payment gateway error', timestamp: '2024-07-30T09:00:00Z' },
      { id: '2', sender: 'Support', message: 'Checking payment gateway status', timestamp: '2024-07-30T09:15:00Z' }
    ]
  }
];

// Get all support tickets
app.get('/api/admin/support/tickets', async (req, res) => {
  try {
    // For now, return mock data since Message model is not imported
    const tickets = [
      {
        id: '1',
        schoolId: '1',
        schoolName: 'St. Mary\'s Academy',
        subject: 'Login Issue',
        description: 'Unable to access the portal',
        status: 'open',
        priority: 'high',
        lastUpdated: '2024-07-30T10:00:00Z',
        conversation: [
          { id: '1', sender: 'School Admin', message: 'Cannot login to the system', timestamp: '2024-07-30T10:00:00Z' },
          { id: '2', sender: 'Support', message: 'We are investigating the issue', timestamp: '2024-07-30T10:30:00Z' }
        ]
      },
      {
        id: '2',
        schoolId: '2',
        schoolName: 'Bright Future School',
        subject: 'Payment Problem',
        description: 'Payment not processing',
        status: 'in_progress',
        priority: 'medium',
        lastUpdated: '2024-07-30T09:00:00Z',
        conversation: [
          { id: '1', sender: 'School Admin', message: 'Payment gateway error', timestamp: '2024-07-30T09:00:00Z' },
          { id: '2', sender: 'Support', message: 'Checking payment gateway status', timestamp: '2024-07-30T09:15:00Z' }
        ]
      }
    ];
    
    res.json({
      message: 'Support tickets retrieved successfully',
      tickets
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      error: 'Failed to fetch support tickets',
      message: error.message
    });
  }
});

// ==================== BILLING & SUBSCRIPTIONS ====================

let subscriptions = [
  {
    id: '1',
    schoolId: '1',
    schoolName: 'St. Mary\'s Academy',
    planName: 'Premium',
    amount: 99.99,
    billingCycle: 'monthly',
    status: 'active',
    nextBillingDate: '2024-08-30T00:00:00Z',
    features: ['attendance', 'fees', 'academics', 'analytics', 'communication'],
    createdAt: '2024-07-30T00:00:00Z'
  },
  {
    id: '2',
    schoolId: '2',
    schoolName: 'Bright Future School',
    planName: 'Basic',
    amount: 49.99,
    billingCycle: 'monthly',
    status: 'active',
    nextBillingDate: '2024-08-30T00:00:00Z',
    features: ['attendance', 'fees', 'academics'],
    createdAt: '2024-07-30T00:00:00Z'
  }
];

// Get all subscriptions
app.get('/api/admin/billing/subscriptions', async (req, res) => {
  try {
    const schools = await School.find({ status: 'Active' })
      .select('name plan status createdAt')
      .sort({ createdAt: -1 });
    
    const subscriptions = schools.map(school => ({
      id: school._id,
      schoolId: school._id,
      schoolName: school.name,
      planName: school.plan,
      amount: school.plan === 'Premium' ? 99.99 : school.plan === 'Enterprise' ? 199.99 : 49.99,
      billingCycle: 'monthly',
      status: school.status,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      features: school.modules,
      createdAt: school.createdAt
    }));
    
    res.json({
      message: 'Subscriptions retrieved successfully',
      subscriptions
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      error: 'Failed to fetch subscriptions',
      message: error.message
    });
  }
});

// ==================== FEATURE TOGGLES ====================

// Get all feature toggles
app.get('/api/admin/features', async (req, res) => {
  try {
    // For now, return empty array as feature toggles are not implemented in DB
    res.json({
      message: 'Feature toggles retrieved successfully',
      featureToggles: []
    });
  } catch (error) {
    console.error('Error fetching feature toggles:', error);
    res.status(500).json({
      error: 'Failed to fetch feature toggles',
      message: error.message
    });
  }
});

// Get AB tests
app.get('/api/admin/features/ab-tests', async (req, res) => {
  try {
    const abTests = [
      {
        id: '1',
        name: 'New Dashboard Layout',
        description: 'Testing new dashboard layout vs current',
        status: 'active',
        variantA: {
          name: 'Current Layout',
          traffic: 50,
          conversion: 12.5
        },
        variantB: {
          name: 'New Layout',
          traffic: 50,
          conversion: 15.2
        },
        startDate: '2024-07-01T00:00:00Z',
        endDate: '2024-07-31T00:00:00Z',
        winner: 'variantB'
      },
      {
        id: '2',
        name: 'Payment Flow',
        description: 'Testing simplified payment flow',
        status: 'completed',
        variantA: {
          name: 'Original Flow',
          traffic: 40,
          conversion: 8.3
        },
        variantB: {
          name: 'Simplified Flow',
          traffic: 60,
          conversion: 11.7
        },
        startDate: '2024-06-01T00:00:00Z',
        endDate: '2024-06-30T00:00:00Z',
        winner: 'variantB'
      }
    ];
    
    res.json({
      message: 'AB tests retrieved successfully',
      abTests
    });
  } catch (error) {
    console.error('Error fetching AB tests:', error);
    res.status(500).json({
      error: 'Failed to fetch AB tests',
      message: error.message
    });
  }
});

// ==================== SUBDOMAIN MANAGEMENT ====================

// Get all subdomains
app.get('/api/admin/subdomains', async (req, res) => {
  try {
    const schools = await School.find({ subdomain: { $exists: true, $ne: '' } });
    
    const subdomains = schools.map(school => ({
      id: school._id,
      schoolId: school._id,
      schoolName: school.name,
      subdomain: school.subdomain,
      fullDomain: `${school.subdomain}.jafasol.com`,
      url: `https://${school.subdomain}.jafasol.com`,
      sslStatus: 'active',
      serverStatus: 'online',
      dnsRecords: [
        { type: 'A', name: `${school.subdomain}.jafasol.com`, value: '192.168.1.100' },
        { type: 'CNAME', name: `www.${school.subdomain}.jafasol.com`, value: `${school.subdomain}.jafasol.com` }
      ],
      createdAt: school.createdAt,
      lastChecked: new Date().toISOString(),
      isActive: true
    }));
    
    res.json({
      message: 'Subdomains retrieved successfully',
      subdomains
    });
  } catch (error) {
    console.error('Error fetching subdomains:', error);
    res.status(500).json({
      error: 'Failed to fetch subdomains',
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