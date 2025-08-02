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

    // Transform admin users into school objects
    const schools = await Promise.all(schoolAdmins.map(async (admin) => {
      // Try to get additional school details from school-specific database
      let schoolDetails = null;
      try {
        const schoolDbName = `school_${admin.schoolSubdomain}`;
        const schoolConnection = mongoose.createConnection(
          process.env.MONGODB_URI.replace('/jafasol?', `/${schoolDbName}?`),
          { useNewUrlParser: true, useUnifiedTopology: true }
        );
        const SchoolModel = schoolConnection.model('School', require('./models/School').schema);
        schoolDetails = await SchoolModel.findOne({ adminUserId: admin._id });
        schoolConnection.close();
      } catch (error) {
        console.log(`Could not fetch details for school ${admin.schoolSubdomain}:`, error.message);
      }

      return {
        id: admin._id,
        name: schoolDetails?.name || admin.name.replace(' Administrator', ''),
        email: schoolDetails?.email || admin.email.replace('admin@', '').replace('.jafasol.com', ''),
        phone: schoolDetails?.phone || admin.phone || '',
        logoUrl: `https://picsum.photos/seed/${admin._id}/40/40`,
        plan: schoolDetails?.plan || 'Basic',
        status: schoolDetails?.status || admin.status || 'Active',
        subdomain: admin.schoolSubdomain,
        storageUsage: 0, // Default storage
        createdAt: admin.createdAt ? admin.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        modules: schoolDetails?.modules || [],
        adminUserId: admin._id
      };
    }));

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
    const adminUsername = `admin@${subdomain}.jafasol.com`;
    const existingAdmin = await User.findOne({ email: adminUsername });
    
    if (existingAdmin) {
      return res.status(409).json({
        error: 'Subdomain already exists',
        message: `A school with subdomain "${subdomain}" already exists. Please choose a different subdomain.`
      });
    }

    // Generate admin credentials
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

    // Find or create Admin role
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = new Role({
        name: 'Admin',
        description: 'Administrator with full system access',
        permissions: {
          'dashboard': ['read', 'write'],
          'schools': ['read', 'write', 'delete'],
          'users': ['read', 'write', 'delete'],
          'settings': ['read', 'write']
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
      roleId: adminRole._id,
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