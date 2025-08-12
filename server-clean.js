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
  
  console.log(`🔍 Tenant middleware - Host: ${host}, Subdomain: ${subdomain}`);
  
  // Skip tenant handling for main admin domain AND admin subdomain
  if (host === 'jafasol.com' || host === 'localhost:5000' || host === 'localhost:3000' || host === 'www.jafasol.com' || host === 'admin.jafasol.com') {
    req.tenant = null;
    req.isMainAdmin = true;
    console.log('✅ Main admin domain detected');
    return next();
  }
  
  // Handle school subdomains
  if (subdomain && subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'jafasol') {
    req.tenant = subdomain;
    req.isMainAdmin = false;
    console.log(`✅ School subdomain detected: ${subdomain}`);
    
    // Connect to school-specific database
    const schoolDbName = `school_${subdomain}`;
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jafasol';
    
    // Fix the database name replacement
    let schoolDbURI;
    if (mongoURI.includes('/jafasol?')) {
      schoolDbURI = mongoURI.replace('/jafasol?', `/${schoolDbName}?`);
    } else if (mongoURI.includes('/jafasol')) {
      schoolDbURI = mongoURI.replace('/jafasol', `/${schoolDbName}`);
    } else {
      // If no /jafasol found, append the school database name
      schoolDbURI = mongoURI.replace('?', `/${schoolDbName}?`);
    }
    
    console.log(`Connecting to school database: ${schoolDbName}`);
    const schoolConnection = mongoose.createConnection(
      schoolDbURI,
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    
    // Add connection error handling
    schoolConnection.on('error', (err) => {
      console.error(`❌ School database connection error for ${schoolDbName}:`, err);
    });
    
    schoolConnection.once('open', () => {
      console.log(`✅ School database connected: ${schoolDbName}`);
    });
    
    req.schoolDb = schoolConnection;
    req.schoolModels = {
      User: schoolConnection.model('User', require('./models/User').schema),
      Student: schoolConnection.model('Student', require('./models/Student').schema),
      Teacher: schoolConnection.model('Teacher', require('./models/Teacher').schema),
      School: schoolConnection.model('School', require('./models/School').schema),
      Role: schoolConnection.model('Role', require('./models/Role').schema),
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
    const expectedSubdomain = `${req.tenant}.jafasol.com`;
    if (user.schoolSubdomain !== expectedSubdomain && user.schoolSubdomain !== req.tenant) {
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
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

// Middleware
app.use(cors({
  origin: true,
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

// Backend only handles API requests - Nginx handles all frontend serving

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
    
    console.log(`🔐 Login attempt - Tenant: ${req.tenant}, isMainAdmin: ${req.isMainAdmin}, isSchoolLogin: ${isSchoolLogin}`);
    
    let user;
    if (isSchoolLogin) {
      // School login - use school-specific database
      console.log(`School login attempt for subdomain: ${req.tenant}`);
      console.log(`Looking for user: ${email.toLowerCase()}`);
      
      user = await req.schoolModels.User.findOne({ email: email.toLowerCase() });
      
      // Check if user exists in this school database
      if (!user) {
        console.log(`User not found in school database: ${req.tenant}`);
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Username or password is incorrect. Please try again.'
        });
      }
      
      console.log(`User found in school database: ${user.name}`);
      
      // Verify user belongs to this school
      const expectedSubdomain = `${req.tenant}.jafasol.com`;
      const userSubdomain = user.schoolSubdomain;
      
      // User must have schoolSubdomain and it must match this subdomain
      if (!userSubdomain || (userSubdomain !== expectedSubdomain && userSubdomain !== req.tenant)) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'You can only login through your school\'s subdomain'
        });
      }
    } else {
      // Main admin domain login - use main database
      user = await User.findOne({ email: email.toLowerCase() }).populate('roleId');
      
      // For main admin domain, only allow SuperAdmin users (no schoolSubdomain)
      if (user && user.schoolSubdomain) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'School users cannot login through the main admin domain'
        });
      }
      
      // Only allow SuperAdmin role for main domain
      if (user && user.roleId && user.roleId.name !== 'SuperAdmin') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Only SuperAdmin can login to the main admin domain'
        });
      }
    }
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect. Please try again.'
      });
    }

    if (user.status !== 'Active') {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'Your account is not active. Please contact administrator.'
      });
    }

    // Use direct bcrypt comparison for better debugging
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log(`Password comparison result: ${isPasswordValid}`);
    console.log(`Input password: ${password}`);
    console.log(`Stored hash: ${user.password.substring(0, 20)}...`);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect. Please try again.'
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Get the role name properly
    let roleName = 'Admin';
    let roleId = null;
    
    if (user.roleId && user.roleId.name) {
      roleName = user.roleId.name;
      roleId = user.roleId._id;
    } else if (user.roleId && typeof user.roleId === 'object') {
      roleName = user.roleId.name || 'Admin';
      roleId = user.roleId._id;
    } else if (user.roleId) {
      roleId = user.roleId;
    }
    
    // Ensure user has required fields
    if (!user.name) {
      user.name = 'School Administrator';
    }
    if (!user.email) {
      user.email = 'admin@school.jafasol.com';
    }
    
    // Assign default modules for any school if none exist
    if (isSchoolLogin && (!user.modules || user.modules.length === 0)) {
      const { DEFAULT_SCHOOL_MODULES } = require('./constants');
      user.modules = DEFAULT_SCHOOL_MODULES;
      await user.save();
      console.log(`✅ Assigned default modules to ${req.tenant} school admin: ${DEFAULT_SCHOOL_MODULES.join(', ')}`);
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: roleName,
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
        role: roleName,
        roleId: roleId,
        avatarUrl: user.avatarUrl,
        schoolSubdomain: user.schoolSubdomain || req.tenant,
        modules: user.modules || [] // Include school modules in response
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
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        systemHealth: 'Operational',
        uptime: process.uptime() || 0,
        responseTime: Date.now() - (req.startTime || Date.now()) || 0,
        lastUpdated: new Date().toISOString(),
        schoolName: req.tenant || 'Unknown School',
        schoolSubdomain: req.tenant || 'unknown'
      };

      res.json({
        message: 'School dashboard stats retrieved successfully',
        stats
      });
    } else {
      // Admin dashboard - use main database
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ status: 'Active' });
      
      // Count schools (admin users with schoolSubdomain)
      const totalSchools = await User.countDocuments({ 
        schoolSubdomain: { $exists: true, $ne: null },
        email: { $regex: /^admin@.*\.jafasol\.com$/ }
      });
      
      // Calculate system health based on real metrics
      const systemHealth = totalUsers > 0 ? 'Operational' : 'Initializing';
      const uptime = process.uptime();
      const responseTime = Date.now() - req.startTime || 0;
      
      const stats = {
        totalSchools: totalSchools,
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
    // Find all admin users that represent schools (they have schoolSubdomain)
    const schoolAdmins = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null },
      email: { $regex: /^admin@.*\.jafasol\.com$/ }
    }).populate('roleId');

    // Transform admin users into school objects (simplified - no school-specific DB calls)
    const schools = schoolAdmins.map((admin) => {
      // Extract school name from admin name
      const schoolName = admin.name.replace(' Administrator', '');
      
      // Extract email from admin email
      const schoolEmail = admin.email.replace('admin@', '').replace('.jafasol.com', '');
      
      return {
        id: admin._id,
        name: schoolName,
        email: schoolEmail,
        phone: admin.phone || '',
        modules: admin.modules || [],
        logoUrl: `https://picsum.photos/seed/${admin._id}/40/40`,
        plan: 'Basic',
        status: admin.status || 'Active',
        subdomain: admin.schoolSubdomain,
        storageUsage: 0, // Default storage
        createdAt: admin.createdAt ? admin.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        modules: admin.modules || [], // Show actual modules
        adminUserId: admin._id
      };
    });

    console.log(`Found ${schools.length} schools in database`);
    
    res.json({ 
      message: 'Schools retrieved successfully', 
      schools: schools 
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
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

    // Check if admin user already exists for this subdomain
    const checkAdminUsername = `admin@${subdomain}.jafasol.com`;
    const existingAdmin = await User.findOne({ email: checkAdminUsername });
    
    if (existingAdmin) {
      return res.status(409).json({
        error: 'Subdomain already exists',
        message: `A school with subdomain "${subdomain}" already exists. Please choose a different subdomain.`
      });
    }

    // Validate modules against available modules
    const availableModules = [
      'analytics', 'studentManagement', 'teacherManagement', 'timetable', 
      'fees', 'exams', 'communication', 'attendance', 'library', 'transport', 'academics'
    ];
    
    if (modules && Array.isArray(modules)) {
      const invalidModules = modules.filter(module => !availableModules.includes(module));
      if (invalidModules.length > 0) {
        return res.status(400).json({
          error: 'Invalid modules',
          message: `The following modules are not available: ${invalidModules.join(', ')}`
        });
      }
    }

    // Generate admin credentials
    const adminUsername = `admin@${subdomain}.jafasol.com`;
    const adminPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);

    // Create school-specific database connection
    const schoolDbName = `school_${subdomain}`;
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jafasol';
    const schoolConnection = mongoose.createConnection(
      mongoURI.replace('/jafasol', `/${schoolDbName}`),
      { useNewUrlParser: true, useUnifiedTopology: true }
    );

    // Create school models for the new database
    const SchoolUser = schoolConnection.model('User', require('./models/User').schema);
    const SchoolStudent = schoolConnection.model('Student', require('./models/Student').schema);
    const SchoolTeacher = schoolConnection.model('Teacher', require('./models/Teacher').schema);
    const SchoolSchool = schoolConnection.model('School', require('./models/School').schema);

    // Find or create Admin role in main database
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = new Role({
        name: 'Admin',
        description: 'Administrator with full system access',
        permissions: {
          Dashboard: ['view'],
          'User Management': ['view', 'create', 'edit', 'delete'],
          'Audit Logs': ['view'],
          Students: ['view', 'create', 'edit', 'delete'],
          Teachers: ['view', 'create', 'edit', 'delete'],
          Academics: ['view', 'create', 'edit', 'delete'],
          Attendance: ['view', 'create', 'edit'],
          Timetable: ['view', 'create', 'edit'],
          Exams: ['view', 'create', 'edit'],
          Fees: ['view', 'create', 'edit'],
          Communication: ['view', 'create'],
          Library: ['view', 'create', 'edit'],
          'Learning Resources': ['view', 'create', 'edit', 'delete'],
          Transport: ['view', 'create', 'edit'],
          Documents: ['view', 'create', 'edit'],
          Reports: ['view'],
          Settings: ['view', 'edit']
        }
      });
      await adminRole.save();
    }

    // Create admin user for the school in the main database
    const adminUser = new User({
      name: `${name} Administrator`,
      email: adminUsername,
      password: adminPassword,
      roleId: adminRole._id,
      status: 'Active',
      schoolSubdomain: `${subdomain}.jafasol.com`,
      modules: modules || [] // Save modules to admin user
    });

    await adminUser.save();

    // Create Admin role in school-specific database
    const SchoolRole = schoolConnection.model('Role', require('./models/Role').schema);
    let schoolAdminRole = await SchoolRole.findOne({ name: 'Admin' });
    if (!schoolAdminRole) {
      schoolAdminRole = new SchoolRole({
        name: 'Admin',
        description: 'School Administrator',
        permissions: {
          Dashboard: ['view'],
          'User Management': ['view', 'create', 'edit', 'delete'],
          'Audit Logs': ['view'],
          Students: ['view', 'create', 'edit', 'delete'],
          Teachers: ['view', 'create', 'edit', 'delete'],
          Academics: ['view', 'create', 'edit', 'delete'],
          Attendance: ['view', 'create', 'edit'],
          Timetable: ['view', 'create', 'edit'],
          Exams: ['view', 'create', 'edit'],
          Fees: ['view', 'create', 'edit'],
          Communication: ['view', 'create'],
          Library: ['view', 'create', 'edit'],
          'Learning Resources': ['view', 'create', 'edit', 'delete'],
          Transport: ['view', 'create', 'edit'],
          Documents: ['view', 'create', 'edit'],
          Reports: ['view'],
          Settings: ['view', 'edit']
        }
      });
      await schoolAdminRole.save();
    }

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
      roleId: schoolAdminRole._id, // Use school-specific role
      status: 'Active',
      schoolSubdomain: `${subdomain}.jafasol.com`,
      modules: modules || [] // Include modules in school-specific admin user
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

// Get all available modules (admin only)
app.get('/api/admin/modules', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const availableModules = [
      { key: 'analytics', name: 'Analytics', description: 'Performance by subject/stream' },
      { key: 'studentManagement', name: 'Student Management', description: 'Manage student information' },
      { key: 'teacherManagement', name: 'Teacher Management', description: 'Manage teacher information' },
      { key: 'timetable', name: 'Timetable', description: 'Manage class schedules' },
      { key: 'fees', name: 'Fee Management', description: 'Track and collect fees' },
      { key: 'exams', name: 'Exams', description: 'Manage examinations and results' },
      { key: 'communication', name: 'Communication', description: 'Send alerts and messages' },
      { key: 'attendance', name: 'Attendance', description: 'Track student attendance' },
      { key: 'library', name: 'Library', description: 'Manage library resources' },
      { key: 'transport', name: 'Transport', description: 'Manage transport services' },
      { key: 'academics', name: 'Academics', description: 'Manage academic activities' }
    ];
    
    res.json({
      message: 'Available modules retrieved successfully',
      modules: availableModules
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// School-specific endpoints for creating teachers and students
app.post('/api/teachers', authenticateToken, async (req, res) => {
  try {
    // Check if this is a school user
    if (!req.tenant || req.isMainAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only school administrators can create teachers'
      });
    }

    const { name, email, phone, subject, qualification } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Teacher name and email are required'
      });
    }

    // Use school-specific models
    const SchoolTeacher = req.schoolModels.Teacher;
    const SchoolUser = req.schoolModels.User;
    const SchoolRole = req.schoolModels.Role;

    // Find or create Teacher role
    let teacherRole = await SchoolRole.findOne({ name: 'Teacher' });
    if (!teacherRole) {
      teacherRole = new SchoolRole({
        name: 'Teacher',
        description: 'School Teacher',
        permissions: {
          Dashboard: ['view'],
          Students: ['view'],
          Attendance: ['view', 'create', 'edit'],
          Timetable: ['view'],
          Exams: ['view', 'create', 'edit'],
          Communication: ['view', 'create'],
          Library: ['view'],
          'Learning Resources': ['view', 'create', 'edit'],
          Reports: ['view']
        }
      });
      await teacherRole.save();
    }

    // Generate teacher password
    const teacherPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);

    // Create teacher user
    const teacherUser = new SchoolUser({
      name,
      email: email.toLowerCase(),
      password: teacherPassword,
      roleId: teacherRole._id,
      status: 'Active',
      schoolSubdomain: `${req.tenant}.jafasol.com`
    });

    await teacherUser.save();

    // Create teacher record
    const teacher = new SchoolTeacher({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      subject: subject || '',
      qualification: qualification || '',
      userId: teacherUser._id,
      status: 'Active',
      schoolSubdomain: `${req.tenant}.jafasol.com`
    });

    await teacher.save();

    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: {
        id: teacher._id,
        name,
        email: email.toLowerCase(),
        phone: phone || '',
        subject: subject || '',
        qualification: qualification || '',
        status: 'Active',
        credentials: {
          username: email.toLowerCase(),
          password: teacherPassword
        }
      }
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({
      error: 'Failed to create teacher',
      message: error.message
    });
  }
});

app.post('/api/students', authenticateToken, async (req, res) => {
  try {
    // Check if this is a school user
    if (!req.tenant || req.isMainAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only school administrators can create students'
      });
    }

    const { name, email, phone, grade, parentName, parentPhone } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Student name and email are required'
      });
    }

    // Use school-specific models
    const SchoolStudent = req.schoolModels.Student;
    const SchoolUser = req.schoolModels.User;
    const SchoolRole = req.schoolModels.Role;

    // Find or create Student role
    let studentRole = await SchoolRole.findOne({ name: 'Student' });
    if (!studentRole) {
      studentRole = new SchoolRole({
        name: 'Student',
        description: 'School Student',
        permissions: {
          Dashboard: ['view'],
          Timetable: ['view'],
          Exams: ['view'],
          Communication: ['view'],
          Library: ['view'],
          'Learning Resources': ['view']
        }
      });
      await studentRole.save();
    }

    // Generate student password
    const studentPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);

    // Create student user
    const studentUser = new SchoolUser({
      name,
      email: email.toLowerCase(),
      password: studentPassword,
      roleId: studentRole._id,
      status: 'Active',
      schoolSubdomain: `${req.tenant}.jafasol.com`
    });

    await studentUser.save();

    // Create student record
    const student = new SchoolStudent({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      grade: grade || '',
      parentName: parentName || '',
      parentPhone: parentPhone || '',
      userId: studentUser._id,
      status: 'Active',
      schoolSubdomain: `${req.tenant}.jafasol.com`
    });

    await student.save();

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        id: student._id,
        name,
        email: email.toLowerCase(),
        phone: phone || '',
        grade: grade || '',
        parentName: parentName || '',
        parentPhone: parentPhone || '',
        status: 'Active',
        credentials: {
          username: email.toLowerCase(),
          password: studentPassword
        }
      }
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({
      error: 'Failed to create student',
      message: error.message
    });
  }
});

// Public modules endpoint (no authentication required)
app.get('/api/modules', async (req, res) => {
  try {
    const availableModules = [
      { key: 'analytics', name: 'Analytics', description: 'Performance by subject/stream' },
      { key: 'studentManagement', name: 'Student Management', description: 'Manage student information' },
      { key: 'teacherManagement', name: 'Teacher Management', description: 'Manage teacher information' },
      { key: 'timetable', name: 'Timetable', description: 'Manage class schedules' },
      { key: 'fees', name: 'Fee Management', description: 'Track and collect fees' },
      { key: 'exams', name: 'Exams', description: 'Manage examinations and results' },
      { key: 'communication', name: 'Communication', description: 'Send alerts and messages' },
      { key: 'attendance', name: 'Attendance', description: 'Track student attendance' },
      { key: 'library', name: 'Library', description: 'Manage library resources' },
      { key: 'transport', name: 'Transport', description: 'Manage transport services' },
      { key: 'academics', name: 'Academics', description: 'Manage academic activities' }
    ];
    
    res.json({
      message: 'Available modules retrieved successfully',
      modules: availableModules
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// School-specific modules endpoint
app.get('/api/school/modules', authenticateSchoolUser, async (req, res) => {
  try {
    // Get the school admin user to see what modules are assigned
    const schoolAdmin = await req.schoolModels.User.findOne({ 
      email: { $regex: /^admin@.*\.jafasol\.com$/ }
    });
    
    console.log('School admin found:', schoolAdmin ? schoolAdmin.email : 'Not found');
    console.log('School admin modules:', schoolAdmin?.modules);
    
    // Get assigned modules from school admin
    let assignedModules = schoolAdmin?.modules || [];
    
    // If no modules assigned, use default modules
    if (assignedModules.length === 0) {
      const { DEFAULT_SCHOOL_MODULES } = require('./constants');
      assignedModules = DEFAULT_SCHOOL_MODULES;
      console.log(`Setting default modules for ${req.tenant} school:`, assignedModules);
    }
    
    // Get all available modules from constants
    const { AVAILABLE_MODULES } = require('./constants');
    const allModules = AVAILABLE_MODULES;
    
    // Filter modules based on what's assigned to this school
    const schoolModules = allModules.filter(module => 
      assignedModules.includes(module.key)
    );
    
    console.log('Returning modules:', schoolModules.map(m => m.name));
    
    // Ensure all modules have required properties
    const safeModules = schoolModules.map(module => ({
      key: module.key || 'unknown',
      name: module.name || 'Unknown Module',
      description: module.description || 'No description available'
    }));
    
    res.json({
      message: 'School modules retrieved successfully',
      modules: safeModules,
      assignedModules: assignedModules,
      user: {
        email: req.user?.email || 'unknown',
        name: req.user?.name || 'School Admin',
        role: req.user?.roleId?.name || 'Admin'
      }
    });
  } catch (error) {
    console.error('Error fetching school modules:', error);
    res.status(500).json({ error: 'Failed to fetch school modules' });
  }
});

// School-specific audit logs endpoint
app.get('/api/audit-logs', authenticateSchoolUser, async (req, res) => {
  try {
    // For now, return empty audit logs for school users
    res.json({
      message: 'School audit logs retrieved successfully',
      logs: [],
      total: 0
    });
  } catch (error) {
    console.error('Error fetching school audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch school audit logs' });
  }
});

// School-specific users endpoint
app.get('/api/users', authenticateSchoolUser, async (req, res) => {
  try {
    const users = await req.schoolModels.User.find().select('-password');
    
    res.json({
      message: 'School users retrieved successfully',
      users: users,
      total: users.length
    });
  } catch (error) {
    console.error('Error fetching school users:', error);
    res.status(500).json({ error: 'Failed to fetch school users' });
  }
});

// School-specific notifications endpoint
app.get('/api/notifications', authenticateSchoolUser, async (req, res) => {
  try {
    // For now, return empty notifications for school users
    res.json({
      message: 'School notifications retrieved successfully',
      notifications: [],
      total: 0
    });
  } catch (error) {
    console.error('Error fetching school notifications:', error);
    res.status(500).json({ error: 'Failed to fetch school notifications' });
  }
});

// Get all available modules for admin dashboard
app.get('/api/admin/modules', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { AVAILABLE_MODULES } = require('./constants');
    res.json({
      message: 'Available modules retrieved successfully',
      modules: AVAILABLE_MODULES
    });
  } catch (error) {
    console.error('Error fetching available modules:', error);
    res.status(500).json({ error: 'Failed to fetch available modules' });
  }
});

// Update school modules endpoint
app.put('/api/admin/schools/:schoolId/modules', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { modules } = req.body;

    if (!modules || !Array.isArray(modules)) {
      return res.status(400).json({
        error: 'Invalid modules data',
        message: 'Modules must be an array'
      });
    }

    // Find the school admin user
    const schoolAdmin = await User.findOne({ 
      _id: schoolId,
      schoolSubdomain: { $exists: true, $ne: null }
    });

    if (!schoolAdmin) {
      return res.status(404).json({
        error: 'School not found',
        message: 'School admin user not found'
      });
    }

    // Update the school admin's modules
    schoolAdmin.modules = modules;
    await schoolAdmin.save();

    console.log(`✅ Updated modules for school ${schoolAdmin.schoolSubdomain}: ${modules.join(', ')}`);

    res.json({
      message: 'School modules updated successfully',
      school: {
        id: schoolAdmin._id,
        name: schoolAdmin.name,
        email: schoolAdmin.email,
        subdomain: schoolAdmin.schoolSubdomain,
        modules: schoolAdmin.modules
      }
    });
  } catch (error) {
    console.error('Error updating school modules:', error);
    res.status(500).json({ error: 'Failed to update school modules' });
  }
});

// Public subdomain check endpoint (no authentication required)
app.post('/api/admin/subdomains/check', async (req, res) => {
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
    // More realistic list of reserved/taken subdomains
    const reservedSubdomains = [
      'www', 'api', 'admin', 'mail', 'ftp', 'blog', 'shop', 'store', 
      'support', 'help', 'docs', 'demo', 'test', 'dev', 'staging',
      'app', 'mobile', 'web', 'cdn', 'static', 'assets', 'images',
      'files', 'download', 'upload', 'secure', 'ssl', 'login', 'auth',
      'register', 'signup', 'account', 'profile', 'dashboard', 'panel',
      'cpanel', 'whm', 'plesk', 'server', 'hosting', 'domain', 'dns',
      'ns1', 'ns2', 'mx', 'smtp', 'pop', 'imap', 'webmail', 'email',
      'calendar', 'contacts', 'tasks', 'notes', 'chat', 'forum', 'wiki',
      'cms', 'wordpress', 'joomla', 'drupal', 'magento', 'shopify',
      'paypal', 'stripe', 'square', 'quickbooks', 'salesforce', 'hubspot',
      'zendesk', 'freshdesk', 'intercom', 'drift', 'calendly', 'zoom',
      'teams', 'slack', 'discord', 'telegram', 'whatsapp', 'facebook',
      'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'snapchat',
      'pinterest', 'reddit', 'github', 'gitlab', 'bitbucket', 'stackoverflow',
      'medium', 'devto', 'hashnode', 'substack', 'newsletter', 'podcast',
      'video', 'stream', 'live', 'broadcast', 'tv', 'radio', 'music',
      'podcast', 'audiobook', 'ebook', 'pdf', 'doc', 'xls', 'ppt',
      'archive', 'backup', 'restore', 'sync', 'cloud', 'storage', 'drive',
      'dropbox', 'google', 'microsoft', 'apple', 'amazon', 'aws', 'azure',
      'digitalocean', 'linode', 'vultr', 'heroku', 'netlify', 'vercel',
      'cloudflare', 'godaddy', 'namecheap', 'hostgator', 'bluehost',
      'dreamhost', 'siteground', 'a2hosting', 'inmotion', 'hostinger',
      'ionos', 'ovh', 'hetzner', 'contabo', 'vps', 'dedicated', 'shared',
      'reseller', 'affiliate', 'partner', 'referral', 'commission', 'bonus',
      'reward', 'loyalty', 'membership', 'subscription', 'billing', 'invoice',
      'payment', 'checkout', 'cart', 'order', 'shipping', 'delivery', 'tracking',
      'status', 'progress', 'update', 'notification', 'alert', 'warning',
      'error', 'debug', 'log', 'monitor', 'analytics', 'stats', 'report',
      'dashboard', 'admin', 'moderator', 'editor', 'author', 'contributor',
      'user', 'member', 'guest', 'visitor', 'customer', 'client', 'patient',
      'student', 'teacher', 'parent', 'guardian', 'principal', 'director',
      'manager', 'supervisor', 'coordinator', 'assistant', 'secretary',
      'receptionist', 'nurse', 'doctor', 'therapist', 'counselor', 'advisor',
      'consultant', 'specialist', 'expert', 'professional', 'certified',
      'licensed', 'accredited', 'approved', 'verified', 'authenticated',
      'official', 'premium', 'pro', 'enterprise', 'business', 'corporate',
      'commercial', 'retail', 'wholesale', 'distributor', 'supplier', 'vendor',
      'manufacturer', 'producer', 'creator', 'developer', 'designer', 'artist',
      'writer', 'journalist', 'reporter', 'correspondent', 'photographer',
      'videographer', 'filmmaker', 'director', 'producer', 'actor', 'actress',
      'singer', 'musician', 'composer', 'arranger', 'conductor', 'performer',
      'entertainer', 'comedian', 'magician', 'illusionist', 'ventriloquist',
      'puppeteer', 'clown', 'juggler', 'acrobat', 'dancer', 'choreographer',
      'instructor', 'trainer', 'coach', 'mentor', 'tutor', 'lecturer',
      'professor', 'researcher', 'scientist', 'engineer', 'architect', 'designer',
      'planner', 'strategist', 'analyst', 'consultant', 'advisor', 'counselor',
      'therapist', 'psychologist', 'psychiatrist', 'neurologist', 'cardiologist',
      'dermatologist', 'orthopedist', 'pediatrician', 'geriatrician', 'oncologist',
      'radiologist', 'pathologist', 'anesthesiologist', 'surgeon', 'dentist',
      'orthodontist', 'periodontist', 'endodontist', 'oral', 'maxillofacial',
      'ophthalmologist', 'optometrist', 'otolaryngologist', 'audiologist',
      'speech', 'language', 'pathologist', 'occupational', 'physical', 'therapist',
      'respiratory', 'therapist', 'nutritionist', 'dietitian', 'pharmacist',
      'pharmacy', 'drugstore', 'clinic', 'hospital', 'medical', 'center',
      'healthcare', 'wellness', 'fitness', 'gym', 'exercise', 'workout',
      'training', 'coaching', 'mentoring', 'counseling', 'therapy', 'treatment',
      'rehabilitation', 'recovery', 'healing', 'wellness', 'prevention', 'screening',
      'diagnosis', 'prognosis', 'symptom', 'condition', 'disease', 'illness',
      'infection', 'injury', 'trauma', 'emergency', 'urgent', 'critical', 'acute',
      'chronic', 'terminal', 'palliative', 'hospice', 'end', 'of', 'life',
      'care', 'nursing', 'home', 'assisted', 'living', 'independent', 'senior',
      'elderly', 'aging', 'geriatric', 'pediatric', 'neonatal', 'maternal',
      'fetal', 'obstetric', 'gynecologic', 'urologic', 'nephrologic', 'hepatic',
      'gastroenterologic', 'endocrinologic', 'diabetic', 'metabolic', 'genetic',
      'immunologic', 'allergic', 'dermatologic', 'rheumatologic', 'orthopedic',
      'neurologic', 'psychiatric', 'behavioral', 'cognitive', 'developmental',
      'learning', 'disability', 'autism', 'adhd', 'add', 'ocd', 'ptsd', 'anxiety',
      'depression', 'bipolar', 'schizophrenia', 'personality', 'disorder',
      'eating', 'disorder', 'substance', 'abuse', 'addiction', 'recovery',
      'sobriety', 'alcoholics', 'anonymous', 'narcotics', 'anonymous', 'gamblers',
      'anonymous', 'overeaters', 'anonymous', 'sex', 'addicts', 'anonymous',
      'codependents', 'anonymous', 'al', 'anon', 'na', 'ga', 'oa', 'saa', 'ca',
      'coda', 'alanon', 'alateen', 'nar', 'anon', 'naranon', 'gam', 'anon',
      'gam', 'anon', 'gam', 'anon', 'gam', 'anon', 'gam', 'anon', 'gam', 'anon'
    ];
    
    const isReserved = reservedSubdomains.includes(subdomain.toLowerCase());
    
    if (isReserved) {
      return res.json({
        message: 'Subdomain is not available',
        subdomain,
        available: false,
        fullDomain: `${subdomain}.jafasol.com`
      });
    }

    // Check if admin user already exists for this subdomain
    const adminUsername = `admin@${subdomain}.jafasol.com`;
    const existingAdmin = await User.findOne({ email: adminUsername });
    
    if (existingAdmin) {
      return res.json({
        message: 'Subdomain is not available',
        subdomain,
        available: false,
        fullDomain: `${subdomain}.jafasol.com`,
        reason: 'A school with this subdomain already exists'
      });
    }

    res.json({
      message: 'Subdomain is available',
      subdomain,
      available: true,
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

// Missing admin endpoints
app.get('/api/admin/support/tickets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ 
      message: 'Support tickets retrieved successfully', 
      tickets: [] 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

app.get('/api/admin/backups', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ 
      message: 'Backups retrieved successfully', 
      backups: [] 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

app.get('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ 
      message: 'Settings retrieved successfully', 
      settings: {
        systemName: 'Jafasol School Management System',
        version: '1.0.0',
        maintenanceMode: false,
        emailNotifications: true,
        smsNotifications: false,
        backupFrequency: 'daily',
        maxFileUploadSize: '10MB'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// School-specific settings endpoints
app.get('/api/settings', async (req, res) => {
  try {
    // Get subdomain from request headers or hostname
    const hostname = req.headers.host || req.headers['x-forwarded-host'] || '';
    const subdomain = hostname.split('.')[0];
    
    // For now, return default settings based on subdomain
    // In a real implementation, you would store these in a database
    const schoolName = subdomain && subdomain !== 'www' && subdomain !== 'jafasol' 
      ? subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + ' School' 
      : 'School';
    
    console.log(`📋 Settings request - Host: ${hostname}, Subdomain: ${subdomain}, School: ${schoolName}`);
    
    res.json({ 
      message: 'School settings retrieved successfully', 
      settings: {
        schoolName: schoolName,
        schoolMotto: 'Excellence in Education',
        schoolLogo: '',
        address: '',
        phone: '',
        email: '',
        website: ''
      }
    });
  } catch (error) {
    console.error('Error fetching school settings:', error);
    res.status(500).json({ error: 'Failed to fetch school settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    console.log('📝 PUT /api/settings called');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    const { schoolName, schoolMotto, schoolLogo, address, phone, email, website } = req.body;
    
    // Get subdomain from request headers or hostname
    const hostname = req.headers.host || req.headers['x-forwarded-host'] || '';
    const subdomain = hostname.split('.')[0];
    
    // For now, just log the settings update
    // In a real implementation, you would store these in a database
    console.log(`✅ Settings update for school ${subdomain}:`, {
      schoolName,
      schoolMotto,
      schoolLogo: schoolLogo ? '[LOGO_DATA]' : '',
      address,
      phone,
      email,
      website
    });
    
    res.json({ 
      message: 'School settings updated successfully',
      settings: {
        schoolName,
        schoolMotto,
        schoolLogo,
        address,
        phone,
        email,
        website
      }
    });
  } catch (error) {
    console.error('Error updating school settings:', error);
    res.status(500).json({ error: 'Failed to update school settings' });
  }
});

app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ 
      message: 'Analytics retrieved successfully', 
      analytics: {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        totalSchools: 0,
        activeSchools: 0,
        newSchoolsThisMonth: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        systemUptime: process.uptime(),
        averageResponseTime: 0,
        errorRate: 0,
        topFeatures: [],
        userGrowth: [],
        revenueGrowth: []
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
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

// Dashboard endpoint
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    if (req.isMainAdmin) {
      // Admin dashboard data
      const totalSchools = await User.countDocuments({ schoolSubdomain: { $exists: true, $ne: null } });
      const totalUsers = await User.countDocuments();
      const recentLogins = await User.find().sort({ lastLogin: -1 }).limit(5).select('-password');
      
      res.json({
        message: 'Dashboard data retrieved successfully',
        stats: {
          totalSchools,
          totalUsers,
          recentLogins
        }
      });
    } else {
      // School dashboard data
      const totalStudents = await req.schoolModels.Student.countDocuments();
      const totalTeachers = await req.schoolModels.Teacher.countDocuments();
      const recentActivity = await req.schoolModels.User.find().sort({ lastLogin: -1 }).limit(5).select('-password');
      
      res.json({
        message: 'School dashboard data retrieved successfully',
        stats: {
          totalStudents,
          totalTeachers,
          recentActivity
        }
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Admin notifications endpoint
app.get('/api/admin/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Mock notifications data
    const notifications = [
      { id: 1, type: 'info', message: 'System updated successfully', timestamp: new Date() },
      { id: 2, type: 'warning', message: 'New school registration pending', timestamp: new Date() }
    ];
    res.json({ message: 'Notifications retrieved successfully', notifications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Admin announcements endpoint
app.get('/api/admin/announcements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Mock announcements data
    const announcements = [
      { id: 1, title: 'System Maintenance', content: 'Scheduled maintenance on Sunday', timestamp: new Date() }
    ];
    res.json({ message: 'Announcements retrieved successfully', announcements });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Security endpoints
app.get('/api/admin/security/login-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Mock login logs data
    const loginLogs = [
      { id: 1, user: 'admin@jafasol.com', ip: '192.168.1.1', timestamp: new Date(), status: 'success' }
    ];
    res.json({ message: 'Login logs retrieved successfully', loginLogs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch login logs' });
  }
});

app.get('/api/admin/security/audit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Mock audit logs data
    const auditLogs = [
      { id: 1, action: 'user_login', user: 'admin@jafasol.com', timestamp: new Date() }
    ];
    res.json({ message: 'Audit logs retrieved successfully', auditLogs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

app.get('/api/admin/security/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Mock security settings
    const securitySettings = {
      twoFactorEnabled: true,
      passwordPolicy: 'strong',
      sessionTimeout: 3600
    };
    res.json({ message: 'Security settings retrieved successfully', securitySettings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch security settings' });
  }
});

// Features and A/B testing endpoints
app.get('/api/admin/features', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Mock features data
    const features = [
      { id: 1, name: 'Multi-tenancy', enabled: true },
      { id: 2, name: 'AI Integration', enabled: true }
    ];
    res.json({ message: 'Features retrieved successfully', features });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

app.get('/api/admin/ab-tests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Mock A/B test data
    const abTests = [
      { id: 1, name: 'New UI Layout', status: 'active', variant: 'A' }
    ];
    res.json({ message: 'A/B tests retrieved successfully', abTests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch A/B tests' });
  }
});

// AI endpoints
app.get('/api/admin/ai/chat', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Mock AI chat data
    const chatHistory = [
      { id: 1, message: 'Hello, how can I help?', timestamp: new Date(), type: 'ai' }
    ];
    res.json({ message: 'AI chat history retrieved successfully', chatHistory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI chat history' });
  }
});

app.get('/api/admin/ai/insights', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Mock AI insights data
    const insights = [
      { id: 1, type: 'usage_pattern', title: 'Peak Usage Times', data: { morning: 30, afternoon: 45, evening: 25 } }
    ];
    res.json({ message: 'AI insights retrieved successfully', insights });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI insights' });
  }
});

app.get('/api/admin/ai/recommendations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Mock AI recommendations data
    const recommendations = [
      { id: 1, type: 'performance', title: 'Optimize Database Queries', priority: 'high' }
    ];
    res.json({ message: 'AI recommendations retrieved successfully', recommendations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI recommendations' });
  }
});

// General users endpoint (for both admin and school contexts)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Determine if this is a school context or admin context
    const isSchoolContext = req.tenant && !req.isMainAdmin;
    
    if (isSchoolContext) {
      // School context - get users from school-specific database
      const users = await req.schoolModels.User.find().populate('roleId').select('-password');
      res.json({ message: 'School users retrieved successfully', users });
    } else {
      // Admin context - get users from main database
      const users = await User.find().populate('roleId').select('-password');
      res.json({ message: 'Users retrieved successfully', users });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Debug endpoint to check school admin users
app.get('/api/admin/debug/schools', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const schoolAdmins = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null },
      email: { $regex: /^admin@.*\.jafasol\.com$/ }
    }).select('-password');
    
    res.json({ 
      message: 'School admin users found', 
      count: schoolAdmins.length,
      schools: schoolAdmins.map(admin => ({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        schoolSubdomain: admin.schoolSubdomain,
        status: admin.status,
        createdAt: admin.createdAt
      }))
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch debug info' });
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

// School-specific data endpoints
app.post('/api/students', authenticateSchoolUser, async (req, res) => {
  try {
    const studentData = req.body;
    const student = new req.schoolModels.Student(studentData);
    await student.save();
    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

app.post('/api/teachers', authenticateSchoolUser, async (req, res) => {
  try {
    const teacherData = req.body;
    const teacher = new req.schoolModels.Teacher(teacherData);
    await teacher.save();
    res.status(201).json({ message: 'Teacher created successfully', teacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

app.post('/api/users', authenticateSchoolUser, async (req, res) => {
  try {
    const userData = req.body;
    const user = new req.schoolModels.User(userData);
    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update school endpoint
app.put('/api/admin/schools/:schoolId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { name, email, phone, plan, status, modules } = req.body;
    
    const schoolAdmin = await User.findOne({ 
      _id: schoolId,
      schoolSubdomain: { $exists: true, $ne: null }
    });
    
    if (!schoolAdmin) {
      return res.status(404).json({
        error: 'School not found',
        message: 'School admin user not found'
      });
    }
    
    // Update school admin user
    if (name) schoolAdmin.name = name;
    if (phone) schoolAdmin.phone = phone;
    if (status) schoolAdmin.status = status;
    
    await schoolAdmin.save();
    
    res.json({
      message: 'School updated successfully',
      school: {
        id: schoolAdmin._id,
        name: schoolAdmin.name,
        email: schoolAdmin.email,
        phone: schoolAdmin.phone || '',
        plan: plan || 'Basic',
        status: schoolAdmin.status,
        subdomain: schoolAdmin.schoolSubdomain,
        modules: modules || [],
        adminUserId: schoolAdmin._id
      }
    });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({
      error: 'Failed to update school',
      message: error.message
    });
  }
});

// Password management endpoints for schools
app.get('/api/admin/schools/:schoolId/credentials', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    // Find the school admin user directly by ID
    const schoolAdmin = await User.findById(schoolId).select('-password');
    
    if (!schoolAdmin) {
      return res.status(404).json({
        error: 'School not found',
        message: 'School admin user not found'
      });
    }
    
    // Verify this is actually a school admin (has schoolSubdomain)
    if (!schoolAdmin.schoolSubdomain) {
      return res.status(404).json({
        error: 'Invalid school',
        message: 'This user is not a school administrator'
      });
    }
    
    res.json({
      message: 'School credentials retrieved successfully',
      school: {
        id: schoolAdmin._id,
        name: schoolAdmin.name,
        email: schoolAdmin.email,
        schoolSubdomain: schoolAdmin.schoolSubdomain,
        status: schoolAdmin.status,
        createdAt: schoolAdmin.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching school credentials:', error);
    res.status(500).json({
      error: 'Failed to fetch school credentials',
      message: error.message
    });
  }
});

app.put('/api/admin/schools/:schoolId/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password must be at least 6 characters long'
      });
    }
    
    const schoolAdmin = await User.findById(schoolId);
    
    if (!schoolAdmin) {
      return res.status(404).json({
        error: 'School not found',
        message: 'School admin user not found'
      });
    }
    
    // Verify this is actually a school admin (has schoolSubdomain)
    if (!schoolAdmin.schoolSubdomain) {
      return res.status(404).json({
        error: 'Invalid school',
        message: 'This user is not a school administrator'
      });
    }
    
    // Update password (this will trigger the pre-save middleware to hash it)
    schoolAdmin.password = newPassword;
    await schoolAdmin.save();
    
    res.json({
      message: 'School admin password updated successfully',
      school: {
        id: schoolAdmin._id,
        name: schoolAdmin.name,
        email: schoolAdmin.email,
        schoolSubdomain: schoolAdmin.schoolSubdomain,
        status: schoolAdmin.status
      }
    });
  } catch (error) {
    console.error('Error updating school password:', error);
    res.status(500).json({
      error: 'Failed to update school password',
      message: error.message
    });
  }
});

app.post('/api/admin/schools/:schoolId/generate-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    const schoolAdmin = await User.findById(schoolId);
    
    if (!schoolAdmin) {
      return res.status(404).json({
        error: 'School not found',
        message: 'School admin user not found'
      });
    }
    
    // Verify this is actually a school admin (has schoolSubdomain)
    if (!schoolAdmin.schoolSubdomain) {
      return res.status(404).json({
        error: 'Invalid school',
        message: 'This user is not a school administrator'
      });
    }
    
    // Generate a new random password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
    
    // Update password
    schoolAdmin.password = newPassword;
    await schoolAdmin.save();
    
    res.json({
      message: 'New password generated successfully',
      school: {
        id: schoolAdmin._id,
        name: schoolAdmin.name,
        email: schoolAdmin.email,
        schoolSubdomain: schoolAdmin.schoolSubdomain,
        status: schoolAdmin.status,
        newPassword: newPassword
      }
    });
  } catch (error) {
    console.error('Error generating new password:', error);
    res.status(500).json({
      error: 'Failed to generate new password',
      message: error.message
    });
  }
});

// Delete school endpoint
app.delete('/api/admin/schools/:schoolId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    console.log(`🗑️ Delete school request for: ${schoolId}`);
    
    // Try to find school admin by ID first, then by subdomain
    let schoolAdmin = null;
    
    // Check if schoolId looks like a MongoDB ObjectId
    if (schoolId.match(/^[0-9a-fA-F]{24}$/)) {
      schoolAdmin = await User.findById(schoolId);
    }
    
    // If not found by ID, try by subdomain
    if (!schoolAdmin) {
      schoolAdmin = await User.findOne({ schoolSubdomain: schoolId });
    }
    
    if (!schoolAdmin) {
      return res.status(404).json({
        error: 'School not found',
        message: 'No school found with this ID or subdomain'
      });
    }
    
    // Delete the school admin user
    await User.findByIdAndDelete(schoolAdmin._id);
    
    console.log(`✅ School deleted successfully: ${schoolId} (${schoolAdmin.schoolSubdomain})`);
    
    res.json({
      message: 'School deleted successfully',
      schoolId: schoolId,
      schoolSubdomain: schoolAdmin.schoolSubdomain
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({
      error: 'Failed to delete school',
      message: error.message
    });
  }
});

// ==================== ACADEMICS ROUTES ====================
// Load Subject and SchoolClass models
const Subject = require('./models/Subject');
const SchoolClass = require('./models/SchoolClass');

// Get all subjects
app.get('/api/academics/subjects', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, curriculum, formLevel } = req.query;

    // Build filter query
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    if (curriculum) filter.curriculum = curriculum;
    if (formLevel) {
      filter.formLevels = formLevel;
    }

    const [subjects, count] = await Promise.all([
      Subject.find(filter)
        .sort({ name: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Subject.countDocuments(filter)
    ]);

    res.json({
      subjects: subjects.map(subject => ({
        id: subject._id,
        name: subject.name,
        code: subject.code,
        curriculum: subject.curriculum,
        formLevels: subject.formLevels,
        status: subject.status,
        createdAt: subject.createdAt
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      error: 'Failed to fetch subjects',
      message: 'An error occurred while fetching subjects'
    });
  }
});

// Create new subject
app.post('/api/academics/subjects', async (req, res) => {
  try {
    const { name, code, curriculum, formLevels } = req.body;

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ 
      $or: [
        { name },
        { code }
      ]
    });
    if (existingSubject) {
      return res.status(409).json({
        error: 'Subject already exists',
        message: 'A subject with this name or code already exists'
      });
    }

    // Create subject
    const subject = new Subject({
      name,
      code,
      curriculum,
      formLevels
    });
    await subject.save();

    res.status(201).json({
      message: 'Subject created successfully',
      subject: {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        curriculum: subject.curriculum,
        formLevels: subject.formLevels,
        createdAt: subject.createdAt
      }
    });

  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      error: 'Failed to create subject',
      message: 'An error occurred while creating subject'
    });
  }
});

// Get all classes
app.get('/api/academics/classes', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, formLevel, stream } = req.query;

    // Build filter query
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { teacher: { $regex: search, $options: 'i' } }
      ];
    }
    if (formLevel) filter.formLevel = formLevel;
    if (stream) filter.stream = stream;

    const [classes, count] = await Promise.all([
      SchoolClass.find(filter)
        .sort({ formLevel: 1, stream: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      SchoolClass.countDocuments(filter)
    ]);

    res.json({
      classes: classes.map(cls => ({
        id: cls._id,
        name: cls.name,
        formLevel: cls.formLevel,
        stream: cls.stream,
        teacher: cls.teacher,
        students: cls.students,
        classTeacherId: cls.classTeacherId,
        capacity: cls.capacity,
        academicYear: cls.academicYear,
        status: cls.status,
        createdAt: cls.createdAt
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      error: 'Failed to fetch classes',
      message: 'An error occurred while fetching classes'
    });
  }
});

// Create new class
app.post('/api/academics/classes', async (req, res) => {
  try {
    const { name, formLevel, stream, teacher, capacity } = req.body;

    // Check if class already exists
    const existingClass = await SchoolClass.findOne({ name });
    if (existingClass) {
      return res.status(409).json({
        error: 'Class already exists',
        message: 'A class with this name already exists'
      });
    }

    // Create class
    const schoolClass = new SchoolClass({
      name,
      formLevel,
      stream,
      teacher: teacher || null,
      capacity: capacity || 50,
      students: 0
    });
    await schoolClass.save();

    res.status(201).json({
      message: 'Class created successfully',
      class: {
        id: schoolClass._id,
        name: schoolClass.name,
        formLevel: schoolClass.formLevel,
        stream: schoolClass.stream,
        teacher: schoolClass.teacher,
        students: schoolClass.students,
        capacity: schoolClass.capacity,
        createdAt: schoolClass.createdAt
      }
    });

  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      error: 'Failed to create class',
      message: 'An error occurred while creating class'
    });
  }
});

// 404 handler for non-API routes - must be at the end
app.use((req, res) => {
  if (!req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'This endpoint is not available'
    });
  }
  res.status(404).json({
    error: 'API Not Found',
    message: 'The requested API endpoint does not exist'
  });
});

// Start server
const startServer = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jafasol';
    
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