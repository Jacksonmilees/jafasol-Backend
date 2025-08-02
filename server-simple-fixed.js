const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// JWT Authentication Middleware - MOVED TO TOP
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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

// Admin role verification middleware - MOVED TO TOP
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

// Import multi-tenant manager
const multiTenantManager = require('./config/multiTenant');

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://jafasol.com',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Redis setup (optional)
const setupRedis = async () => {
  try {
    const redis = require('redis');
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await client.connect();
    console.log('✅ Redis connected successfully');
    return client;
  } catch (error) {
    console.log('⚠️ Redis not available, using memory cache');
    return null;
  }
};

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache service
class CacheService {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  async get(key) {
    const item = this.cache.get(key);
    if (item && item.expiresAt > Date.now()) {
      return item.data;
    }
    if (item) {
      this.cache.delete(key);
      const timer = this.timers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }
    return null;
  }

  async set(key, data, ttl = CACHE_TTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt });
    
    // Set timer to clean up
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);
  }

  async delete(key) {
    this.cache.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  async invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        await this.delete(key);
      }
    }
  }
}

const cacheService = new CacheService();

// Cache middleware
const cacheMiddleware = (ttl = CACHE_TTL, keyGenerator = null) => {
  return async (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : `cache:${req.originalUrl}`;
    
    try {
      const cached = await cacheService.get(key);
      if (cached) {
        return res.json(cached);
      }
      
      // Store original send method
      const originalSend = res.json;
      
      // Override send method to cache response
      res.json = function(data) {
        cacheService.set(key, data, ttl);
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

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

    // Get system connection for admin login
    const systemConnection = await multiTenantManager.getDefaultConnection();
    const User = systemConnection.model('User');
    const Role = systemConnection.model('Role');

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).populate('roleId');
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if user is active
    if (user.status !== 'Active') {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'Your account is not active. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Create JWT token
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

    // Log the login
    const AuditLog = systemConnection.model('AuditLog');
    await AuditLog.create({
      userId: user._id,
      action: 'LOGIN',
      target: 'SYSTEM',
      details: `User ${user.email} logged in successfully`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

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

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // Log the logout
    const systemConnection = await multiTenantManager.getDefaultConnection();
    const AuditLog = systemConnection.model('AuditLog');
    
    await AuditLog.create({
      userId: req.user.userId,
      action: 'LOGOUT',
      target: 'SYSTEM',
      details: `User ${req.user.email} logged out`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

// Dashboard API
app.get('/api/dashboard', authenticateToken, requireAdmin, cacheMiddleware(2 * 60 * 1000), async (req, res) => {
  try {
    const systemConnection = await multiTenantManager.getDefaultConnection();
    const School = systemConnection.model('School');
    const AuditLog = systemConnection.model('AuditLog');

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

// Schools API
app.get('/api/admin/schools', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const systemConnection = await multiTenantManager.getDefaultConnection();
    const School = systemConnection.model('School');
    
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

// Create school endpoint
app.post('/api/admin/schools/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      address, 
      subscriptionPlan, 
      timezone, 
      language, 
      academicYear,
      adminEmail,
      adminPassword,
      adminName
    } = req.body;

    if (!name || !email || !adminEmail || !adminPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'School name, email, admin email, and admin password are required'
      });
    }

    // Generate unique tenant ID and subdomain
    const tenantId = `school_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const subdomain = generateUniqueSubdomain(name);

    // Create tenant database
    const tenant = await multiTenantManager.createTenant(tenantId, {
      name,
      subdomain,
      createdAt: new Date()
    });

    // Initialize school data
    await initializeSchoolData(tenantId, {
      name,
      email,
      phone,
      address,
      subscriptionPlan,
      timezone,
      language,
      academicYear
    });

    // Create school admin user
    const tenantConnection = await multiTenantManager.getTenantConnection(tenantId);
    const User = tenantConnection.model('User');
    const Role = tenantConnection.model('Role');

    // Create roles for the school
    const schoolRoles = [
      { name: 'Admin', permissions: ['all'] },
      { name: 'Teacher', permissions: ['academics', 'attendance', 'reports'] },
      { name: 'Student', permissions: ['view_own_data'] },
      { name: 'Parent', permissions: ['view_child_data'] }
    ];

    await Role.insertMany(schoolRoles);
    const adminRole = await Role.findOne({ name: 'Admin' });

    // Create admin user
    const adminUser = new User({
      name: adminName || 'School Administrator',
      email: adminEmail,
      password: adminPassword,
      roleId: adminRole._id,
      status: 'Active',
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName || 'Admin')}&background=0D9488&color=fff`
    });

    await adminUser.save();

    // Create school record in system database
    const systemConnection = await multiTenantManager.getDefaultConnection();
    const School = systemConnection.model('School');
    
    const school = new School({
      name,
      email,
      phone,
      address,
      subdomain,
      tenantId,
      subscriptionPlan: subscriptionPlan || 'basic',
      timezone: timezone || 'UTC',
      language: language || 'en',
      academicYear: academicYear || new Date().getFullYear().toString(),
      status: 'Active',
      adminEmail,
      adminName: adminName || 'School Administrator',
      createdAt: new Date()
    });

    await school.save();

    // Create subdomain configuration
    const subdomainConfig = {
      subdomain,
      tenantId,
      schoolId: school._id,
      status: 'active',
      createdAt: new Date()
    };

    res.status(201).json({
      message: 'School created successfully with tenant and subdomain',
      school: {
        id: school._id,
        name: school.name,
        email: school.email,
        subdomain: school.subdomain,
        tenantId: school.tenantId,
        status: school.status
      },
      subdomain: subdomainConfig,
      adminCredentials: {
        email: adminEmail,
        password: adminPassword,
        name: adminName || 'School Administrator'
      }
    });
  } catch (error) {
    console.error('School creation error:', error);
    res.status(500).json({
      error: 'School creation failed',
      message: error.message
    });
  }
});

// Helper functions
function generateSubdomain(schoolName) {
  return schoolName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
}

function isSubdomainAvailable(subdomain) {
  // In a real implementation, check against existing subdomains
  return true;
}

function generateUniqueSubdomain(schoolName) {
  let subdomain = generateSubdomain(schoolName);
  let counter = 1;
  
  while (!isSubdomainAvailable(subdomain)) {
    subdomain = `${generateSubdomain(schoolName)}${counter}`;
    counter++;
  }
  
  return subdomain;
}

async function initializeSchoolData(tenantId, schoolData) {
  try {
    const tenantConnection = await multiTenantManager.getTenantConnection(tenantId);
    
    // Initialize basic school data
    const School = tenantConnection.model('School');
    const school = new School({
      name: schoolData.name,
      email: schoolData.email,
      phone: schoolData.phone,
      address: schoolData.address,
      subscriptionPlan: schoolData.subscriptionPlan || 'basic',
      timezone: schoolData.timezone || 'UTC',
      language: schoolData.language || 'en',
      academicYear: schoolData.academicYear || new Date().getFullYear().toString(),
      status: 'Active',
      createdAt: new Date()
    });

    await school.save();
    
    console.log(`✅ School data initialized for tenant: ${tenantId}`);
  } catch (error) {
    console.error(`❌ Failed to initialize school data for tenant ${tenantId}:`, error);
    throw error;
  }
}

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connected successfully');
    
    // Setup Redis (optional)
    await setupRedis();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer(); 