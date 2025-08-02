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

// Multi-tenant middleware to handle subdomain routing
const handleTenant = (req, res, next) => {
  const host = req.get('host');
  const subdomain = host.split('.')[0];
  
  // Skip tenant handling for main admin domain
  if (host === 'jafasol.com' || host === 'localhost:5000' || host === 'localhost:3000') {
    req.tenant = null;
    req.isMainAdmin = true;
    return next();
  }
  
  // Handle school subdomains
  if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
    req.tenant = subdomain;
    req.isMainAdmin = false;
    
    // Connect to school-specific database
    const schoolDbName = `school_${subdomain}`;
    const schoolConnection = mongoose.createConnection(
      process.env.MONGODB_URI.replace('/jafasol?', `/${schoolDbName}?`),
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    
    req.schoolDb = schoolConnection;
    req.schoolModels = {
      User: schoolConnection.model('User', require('./models/User').schema),
      Student: schoolConnection.model('Student', require('./models/Student').schema),
      Teacher: schoolConnection.model('Teacher', require('./models/Teacher').schema),
      School: schoolConnection.model('School', require('./models/School').schema),
    };
  } else {
    req.tenant = null;
    req.isMainAdmin = true;
  }
  
  next();
};

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

// School-specific authentication middleware
const authenticateSchoolUser = (req, res, next) => {
  if (!req.tenant) {
    return res.status(400).json({
      error: 'Invalid subdomain',
      message: 'School subdomain is required'
    });
  }

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
    
    // Verify user belongs to this school
    if (user.schoolSubdomain !== req.tenant) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your school\'s data'
      });
    }
    
    req.user = user;
    next();
  });
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

// Add tenant middleware
app.use(handleTenant);

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

// Login endpoint - handles both admin and school logins
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    // Determine if this is a school login or admin login
    const isSchoolLogin = req.tenant && !req.isMainAdmin;
    
    let user;
    if (isSchoolLogin) {
      // School login - use school-specific database
      user = await req.schoolModels.User.findOne({ email: email.toLowerCase() }).populate('roleId');
    } else {
      // Admin login - use main database
      user = await User.findOne({ email: email.toLowerCase() }).populate('roleId');
    }
    
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
        name: user.name,
        schoolSubdomain: user.schoolSubdomain || req.tenant
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
        avatarUrl: user.avatarUrl,
        schoolSubdomain: user.schoolSubdomain || req.tenant
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

// Dashboard API - handles both admin and school dashboards
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    // Determine if this is a school dashboard or admin dashboard
    const isSchoolDashboard = req.tenant && !req.isMainAdmin;
    
    if (isSchoolDashboard) {
      // School dashboard - use school-specific database
      const totalStudents = await req.schoolModels.Student?.countDocuments() || 0;
      const totalTeachers = await req.schoolModels.Teacher?.countDocuments() || 0;
      const totalUsers = await req.schoolModels.User.countDocuments();
      const activeUsers = await req.schoolModels.User.countDocuments({ status: 'Active' });
      
      const stats = {
        totalStudents: totalStudents,
        totalTeachers: totalTeachers,
        totalUsers: totalUsers,
        activeUsers: activeUsers,
        systemHealth: 'Operational',
        uptime: process.uptime(),
        responseTime: Date.now() - req.startTime || 0,
        lastUpdated: new Date().toISOString(),
        schoolName: req.tenant,
        schoolSubdomain: req.tenant
      };

      res.json({
        message: 'School dashboard stats retrieved successfully',
        stats
      });
    } else {
      // Admin dashboard - use main database
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
    }
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

// Create school with subdomain validation
app.post('/api/admin/schools', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, plan, subdomain, modules } = req.body;

    // Validate required fields
    if (!name || !email || !subdomain) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'School name, email, and subdomain are required'
      });
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({
        error: 'Invalid subdomain format',
        message: 'Subdomain can only contain lowercase letters, numbers, and hyphens'
      });
    }

    // Check if subdomain is already taken
    // For now, we'll simulate this check
    const existingSubdomains = ['demo', 'test', 'admin']; // This would come from database
    if (existingSubdomains.includes(subdomain)) {
      return res.status(409).json({
        error: 'Subdomain already exists',
        message: 'This subdomain is already taken. Please choose a different one.'
      });
    }

    // Generate admin credentials
    const adminUsername = `admin@${subdomain}.jafasol.com`;
    const adminPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);

    // Create school-specific database connection
    const schoolDbName = `school_${subdomain}`;
    const schoolConnection = mongoose.createConnection(
      process.env.MONGODB_URI.replace('/jafasol?', `/${schoolDbName}?`),
      { useNewUrlParser: true, useUnifiedTopology: true }
    );

    // Create school models for the new database
    const SchoolUser = schoolConnection.model('User', require('./models/User').schema);
    const SchoolStudent = schoolConnection.model('Student', require('./models/Student').schema);
    const SchoolTeacher = schoolConnection.model('Teacher', require('./models/Teacher').schema);
    const SchoolSchool = schoolConnection.model('School', require('./models/School').schema);

    // Create admin user for the school in the main database
    const adminUser = new User({
      name: `${name} Administrator`,
      email: adminUsername,
      password: adminPassword,
      role: 'Admin',
      status: 'Active',
      schoolSubdomain: subdomain
    });

    await adminUser.save();

    // Create school record in school-specific database
    const schoolRecord = new SchoolSchool({
      name: name,
      email: email,
      phone: phone || '',
      plan: plan || 'Basic',
      status: 'Active',
      subdomain: `${subdomain}.jafasol.com`,
      modules: modules || [],
      adminUserId: adminUser._id,
      createdAt: new Date()
    });

    await schoolRecord.save();

    // Create admin user in school-specific database
    const schoolAdminUser = new SchoolUser({
      name: `${name} Administrator`,
      email: adminUsername,
      password: adminPassword,
      role: 'Admin',
      status: 'Active',
      schoolSubdomain: subdomain
    });

    await schoolAdminUser.save();

    // For now, return success with the created data
    res.status(201).json({
      message: 'School created successfully',
      school: {
        id: adminUser._id,
        name,
        email,
        phone: phone || '',
        plan: plan || 'Basic',
        status: 'Active',
        subdomain: `${subdomain}.jafasol.com`,
        modules: modules || [],
        adminCredentials: {
          username: adminUsername,
          password: adminPassword
        }
      }
    });
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({
      error: 'Failed to create school',
      message: error.message
    });
  }
});

app.get('/api/admin/subdomains', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: 'Subdomains retrieved successfully', subdomains: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subdomains' });
  }
});

// Check subdomain availability
app.post('/api/admin/subdomains/check', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { subdomain } = req.body;

    if (!subdomain) {
      return res.status(400).json({
        error: 'Subdomain is required',
        message: 'Please provide a subdomain to check'
      });
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({
        error: 'Invalid subdomain format',
        message: 'Subdomain can only contain lowercase letters, numbers, and hyphens'
      });
    }

    // Check if subdomain is already taken
    const existingSubdomains = ['demo', 'test', 'admin']; // This would come from database
    const isAvailable = !existingSubdomains.includes(subdomain);

    res.json({
      message: isAvailable ? 'Subdomain is available' : 'Subdomain is not available',
      subdomain,
      available: isAvailable,
      fullDomain: `${subdomain}.jafasol.com`
    });
  } catch (error) {
    console.error('Error checking subdomain:', error);
    res.status(500).json({
      error: 'Failed to check subdomain',
      message: error.message
    });
  }
});

app.get('/api/admin/subdomains/templates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({
      message: 'Subdomain templates retrieved successfully',
      templates: [
        { name: 'school-name', example: 'stmarys' },
        { name: 'academy-name', example: 'academy' },
        { name: 'institution-name', example: 'institute' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subdomain templates' });
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

// School-specific endpoints
app.get('/api/students', authenticateSchoolUser, async (req, res) => {
  try {
    const students = await req.schoolModels.Student.find().select('-password');
    res.json({ message: 'Students retrieved successfully', students });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.get('/api/teachers', authenticateSchoolUser, async (req, res) => {
  try {
    const teachers = await req.schoolModels.Teacher.find().select('-password');
    res.json({ message: 'Teachers retrieved successfully', teachers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

app.get('/api/school-info', authenticateSchoolUser, async (req, res) => {
  try {
    const school = await req.schoolModels.School.findOne({ subdomain: req.tenant });
    res.json({ 
      message: 'School info retrieved successfully', 
      school: school || { name: req.tenant, subdomain: req.tenant }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch school info' });
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