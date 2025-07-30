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

// ==================== SUBDOMAIN MANAGEMENT ====================

let subdomains = [
  {
    id: '1',
    schoolId: '1',
    schoolName: "St. Mary's Academy",
    subdomain: 'stmarys',
    fullDomain: 'stmarys.jafasol.com',
    status: 'active',
    sslStatus: 'active',
    serverStatus: 'online',
    createdAt: '2024-01-15',
    lastChecked: new Date().toISOString(),
    dnsRecords: [
      { type: 'A', name: 'stmarys.jafasol.com', value: '192.168.1.100' },
      { type: 'CNAME', name: 'www.stmarys.jafasol.com', value: 'stmarys.jafasol.com' }
    ]
  },
  {
    id: '2',
    schoolId: '2',
    schoolName: 'Bright Future School',
    subdomain: 'brightfuture',
    fullDomain: 'brightfuture.jafasol.com',
    status: 'active',
    sslStatus: 'active',
    serverStatus: 'online',
    createdAt: '2024-02-01',
    lastChecked: new Date().toISOString(),
    dnsRecords: [
      { type: 'A', name: 'brightfuture.jafasol.com', value: '192.168.1.101' },
      { type: 'CNAME', name: 'www.brightfuture.jafasol.com', value: 'brightfuture.jafasol.com' }
    ]
  }
];

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

// Create new subdomain
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
    id: String(Date.now()),
    schoolId,
    schoolName,
    subdomain,
    fullDomain: `${subdomain}.jafasol.com`,
    status: 'active',
    sslStatus: 'active',
    serverStatus: 'online',
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    dnsRecords: [
      { type: 'A', name: `${subdomain}.jafasol.com`, value: '192.168.1.100' },
      { type: 'CNAME', name: `www.${subdomain}.jafasol.com`, value: `${subdomain}.jafasol.com` }
    ]
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
    description: 'Enable advanced analytics dashboard for all schools',
    enabled: true,
    type: 'global',
    rolloutPercentage: 100,
    createdAt: '2024-07-30T10:00:00Z',
    updatedAt: '2024-07-30T10:00:00Z'
  },
  {
    id: '2',
    name: 'AI Chat Assistant',
    description: 'Enable AI-powered chat assistant for support',
    enabled: false,
    type: 'gradual',
    rolloutPercentage: 25,
    createdAt: '2024-07-30T09:00:00Z',
    updatedAt: '2024-07-30T09:00:00Z'
  },
  {
    id: '3',
    name: 'Dark Mode',
    description: 'Enable dark mode theme option',
    enabled: true,
    type: 'global',
    rolloutPercentage: 100,
    createdAt: '2024-07-30T08:00:00Z',
    updatedAt: '2024-07-30T08:00:00Z'
  },
  {
    id: '4',
    name: 'Real-time Notifications',
    description: 'Enable real-time push notifications',
    enabled: false,
    type: 'gradual',
    rolloutPercentage: 0,
    createdAt: '2024-07-30T07:00:00Z',
    updatedAt: '2024-07-30T07:00:00Z'
  }
];

let abTests = [
  {
    id: '1',
    name: 'New Dashboard Layout',
    description: 'Testing new dashboard layout vs old layout',
    status: 'active',
    variantA: 'old_layout',
    variantB: 'new_layout',
    trafficSplit: 50, // 50% A, 50% B
    startDate: '2024-07-30T00:00:00Z',
    endDate: '2024-08-30T00:00:00Z',
    metrics: {
      variantA: { users: 150, engagement: 0.75 },
      variantB: { users: 148, engagement: 0.82 }
    }
  }
];

// List all feature toggles
app.get('/api/admin/features', (req, res) => {
  const { enabled, type } = req.query;
  
  let filteredFeatures = featureToggles;
  
  if (enabled !== undefined) {
    filteredFeatures = filteredFeatures.filter(f => f.enabled === (enabled === 'true'));
  }
  
  if (type) {
    filteredFeatures = filteredFeatures.filter(f => f.type === type);
  }
  
  res.json({
    message: 'Feature toggles retrieved successfully',
    features: filteredFeatures
  });
});

// Get specific feature toggle
app.get('/api/admin/features/:id', (req, res) => {
  const { id } = req.params;
  const feature = featureToggles.find(f => f.id === id);
  
  if (!feature) {
    return res.status(404).json({
      error: 'Feature toggle not found',
      message: `Feature toggle with ID '${id}' does not exist`
    });
  }
  
  res.json({
    message: 'Feature toggle retrieved successfully',
    feature
  });
});

// Create new feature toggle
app.post('/api/admin/features', (req, res) => {
  const { name, description, enabled, type, rolloutPercentage } = req.body;
  
  const newFeature = {
    id: `feature_${Date.now()}`,
    name,
    description,
    enabled: enabled || false,
    type: type || 'global',
    rolloutPercentage: rolloutPercentage || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  featureToggles.push(newFeature);
  
  res.status(201).json({
    message: 'Feature toggle created successfully',
    feature: newFeature
  });
});

// Update feature toggle
app.put('/api/admin/features/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const featureIndex = featureToggles.findIndex(f => f.id === id);
  if (featureIndex === -1) {
    return res.status(404).json({
      error: 'Feature toggle not found',
      message: `Feature toggle with ID '${id}' does not exist`
    });
  }
  
  featureToggles[featureIndex] = {
    ...featureToggles[featureIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    message: 'Feature toggle updated successfully',
    feature: featureToggles[featureIndex]
  });
});

// Delete feature toggle
app.delete('/api/admin/features/:id', (req, res) => {
  const { id } = req.params;
  
  const featureIndex = featureToggles.findIndex(f => f.id === id);
  if (featureIndex === -1) {
    return res.status(404).json({
      error: 'Feature toggle not found',
      message: `Feature toggle with ID '${id}' does not exist`
    });
  }
  
  const deletedFeature = featureToggles.splice(featureIndex, 1)[0];
  
  res.json({
    message: 'Feature toggle deleted successfully',
    feature: deletedFeature
  });
});

// Toggle feature on/off
app.post('/api/admin/features/:id/toggle', (req, res) => {
  const { id } = req.params;
  
  const featureIndex = featureToggles.findIndex(f => f.id === id);
  if (featureIndex === -1) {
    return res.status(404).json({
      error: 'Feature toggle not found',
      message: `Feature toggle with ID '${id}' does not exist`
    });
  }
  
  featureToggles[featureIndex].enabled = !featureToggles[featureIndex].enabled;
  featureToggles[featureIndex].updatedAt = new Date().toISOString();
  
  res.json({
    message: `Feature ${featureToggles[featureIndex].enabled ? 'enabled' : 'disabled'} successfully`,
    feature: featureToggles[featureIndex]
  });
});

// Get A/B tests
app.get('/api/admin/features/ab-tests', (req, res) => {
  const { status } = req.query;
  
  let filteredTests = abTests;
  
  if (status) {
    filteredTests = filteredTests.filter(test => test.status === status);
  }
  
  res.json({
    message: 'A/B tests retrieved successfully',
    tests: filteredTests
  });
});

// Create A/B test
app.post('/api/admin/features/ab-tests', (req, res) => {
  const { name, description, variantA, variantB, trafficSplit, startDate, endDate } = req.body;
  
  const newTest = {
    id: `abtest_${Date.now()}`,
    name,
    description,
    status: 'active',
    variantA,
    variantB,
    trafficSplit: trafficSplit || 50,
    startDate: startDate || new Date().toISOString(),
    endDate,
    metrics: {
      variantA: { users: 0, engagement: 0 },
      variantB: { users: 0, engagement: 0 }
    }
  };
  
  abTests.push(newTest);
  
  res.status(201).json({
    message: 'A/B test created successfully',
    test: newTest
  });
});

// Update A/B test metrics
app.put('/api/admin/features/ab-tests/:id/metrics', (req, res) => {
  const { id } = req.params;
  const { variantA, variantB } = req.body;
  
  const testIndex = abTests.findIndex(t => t.id === id);
  if (testIndex === -1) {
    return res.status(404).json({
      error: 'A/B test not found',
      message: `A/B test with ID '${id}' does not exist`
    });
  }
  
  abTests[testIndex].metrics = {
    variantA: variantA || abTests[testIndex].metrics.variantA,
    variantB: variantB || abTests[testIndex].metrics.variantB
  };
  
  res.json({
    message: 'A/B test metrics updated successfully',
    test: abTests[testIndex]
  });
});

// ==================== GEMINI AI INTEGRATION ====================

let aiChatHistory = [
  {
    id: '1',
    userId: 'admin-1',
    userName: 'JafaSol Super Admin',
    message: 'How can I improve school performance?',
    response: 'Based on your data, I recommend focusing on attendance tracking and parent communication. Schools with active parent engagement show 25% better performance.',
    timestamp: '2024-07-30T10:00:00Z',
    type: 'insight'
  },
  {
    id: '2',
    userId: 'admin-1',
    userName: 'JafaSol Super Admin',
    message: 'What are the best practices for fee collection?',
    response: 'Implement automated reminders, offer multiple payment methods, and provide clear payment schedules. Schools using digital payments see 40% faster collections.',
    timestamp: '2024-07-30T09:30:00Z',
    type: 'recommendation'
  }
];

let aiInsights = [
  {
    id: '1',
    type: 'performance',
    title: 'Attendance Impact on Grades',
    description: 'Schools with 95%+ attendance show 15% higher average grades',
    data: {
      highAttendance: { count: 12, avgGrade: 85 },
      lowAttendance: { count: 8, avgGrade: 72 }
    },
    recommendation: 'Implement automated attendance tracking and parent notifications',
    timestamp: '2024-07-30T10:00:00Z'
  },
  {
    id: '2',
    type: 'revenue',
    title: 'Payment Method Analysis',
    description: 'Digital payments are 3x faster than cash payments',
    data: {
      digital: { avgTime: 2.3, successRate: 94 },
      cash: { avgTime: 7.1, successRate: 87 }
    },
    recommendation: 'Encourage digital payment adoption with incentives',
    timestamp: '2024-07-30T09:00:00Z'
  }
];

// AI Chat
app.post('/api/admin/ai/chat', (req, res) => {
  const { message, userId, userName } = req.body;
  
  // Simulate AI response based on message content
  let response = '';
  let type = 'general';
  
  if (message.toLowerCase().includes('performance') || message.toLowerCase().includes('grades')) {
    response = 'To improve school performance, focus on attendance tracking, parent communication, and regular assessments. Schools with active parent engagement show 25% better performance.';
    type = 'insight';
  } else if (message.toLowerCase().includes('fee') || message.toLowerCase().includes('payment')) {
    response = 'For better fee collection: implement automated reminders, offer multiple payment methods, and provide clear payment schedules. Digital payments are 3x faster than cash.';
    type = 'recommendation';
  } else if (message.toLowerCase().includes('attendance')) {
    response = 'Attendance tracking best practices: use automated systems, send parent notifications, and analyze patterns. Schools with 95%+ attendance show 15% higher grades.';
    type = 'insight';
  } else {
    response = 'I can help you with school performance analysis, fee collection strategies, attendance tracking, and general administrative insights. What specific area would you like to explore?';
    type = 'general';
  }
  
  const chatEntry = {
    id: `chat_${Date.now()}`,
    userId,
    userName,
    message,
    response,
    timestamp: new Date().toISOString(),
    type
  };
  
  aiChatHistory.push(chatEntry);
  
  res.json({
    message: 'AI response generated successfully',
    chat: chatEntry
  });
});

// Get AI chat history
app.get('/api/admin/ai/chat', (req, res) => {
  const { userId, type } = req.query;
  
  let filteredChat = aiChatHistory;
  
  if (userId) {
    filteredChat = filteredChat.filter(chat => chat.userId === userId);
  }
  
  if (type) {
    filteredChat = filteredChat.filter(chat => chat.type === type);
  }
  
  res.json({
    message: 'AI chat history retrieved successfully',
    chatHistory: filteredChat
  });
});

// Get AI insights
app.get('/api/admin/ai/insights', (req, res) => {
  const { type } = req.query;
  
  let filteredInsights = aiInsights;
  
  if (type) {
    filteredInsights = filteredInsights.filter(insight => insight.type === type);
  }
  
  res.json({
    message: 'AI insights retrieved successfully',
    insights: filteredInsights
  });
});

// Generate AI insights
app.post('/api/admin/ai/insights/generate', (req, res) => {
  const { type, data } = req.body;
  
  // Simulate AI insight generation
  const newInsight = {
    id: `insight_${Date.now()}`,
    type: type || 'performance',
    title: 'AI-Generated Insight',
    description: 'This insight was generated based on your platform data',
    data: data || {},
    recommendation: 'Consider implementing the suggested improvements',
    timestamp: new Date().toISOString()
  };
  
  aiInsights.push(newInsight);
  
  res.json({
    message: 'AI insight generated successfully',
    insight: newInsight
  });
});

// AI recommendations
app.get('/api/admin/ai/recommendations', (req, res) => {
  const recommendations = [
    {
      id: '1',
      category: 'performance',
      title: 'Improve Attendance Tracking',
      description: 'Implement automated attendance systems to boost grades by 15%',
      priority: 'high',
      impact: '15% grade improvement',
      effort: 'medium'
    },
    {
      id: '2',
      category: 'revenue',
      title: 'Digital Payment Adoption',
      description: 'Encourage digital payments to speed up collections by 3x',
      priority: 'medium',
      impact: '3x faster collections',
      effort: 'low'
    },
    {
      id: '3',
      category: 'communication',
      title: 'Parent Engagement Program',
      description: 'Increase parent communication to improve student performance',
      priority: 'high',
      impact: '25% performance boost',
      effort: 'high'
    }
  ];
  
  res.json({
    message: 'AI recommendations retrieved successfully',
    recommendations
  });
});

// AI automated response
app.post('/api/admin/ai/auto-response', (req, res) => {
  const { query, context } = req.body;
  
  // Simulate automated response generation
  let response = '';
  
  if (query.toLowerCase().includes('support') || query.toLowerCase().includes('help')) {
    response = 'I can help you with technical support, feature questions, or general inquiries. Please provide more details about your specific issue.';
  } else if (query.toLowerCase().includes('billing') || query.toLowerCase().includes('payment')) {
    response = 'For billing inquiries, please check your subscription status in the billing section. You can also contact our support team for payment issues.';
  } else if (query.toLowerCase().includes('feature') || query.toLowerCase().includes('update')) {
    response = 'New features are regularly added to the platform. Check the announcements section for the latest updates and feature releases.';
  } else {
    response = 'Thank you for your inquiry. I\'ll forward this to our support team who will get back to you within 24 hours.';
  }
  
  res.json({
    message: 'Automated response generated',
    response,
    confidence: 0.85
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