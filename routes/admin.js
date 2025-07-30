const express = require('express');
const { body, validationResult } = require('express-validator');
const multiTenantManager = require('../config/multiTenant');
const tenantOnboarding = require('../utils/tenantOnboarding');
const { authenticateToken } = require('../middleware/auth');
const { auditLogger } = require('../utils/auditLogger');

const router = express.Router();

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }
  next();
};

// ==================== DASHBOARD STATS ====================

// Get admin dashboard overview
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get all tenants
    const tenants = await multiTenantManager.listTenants();
    
    // Calculate stats
    const totalSchools = tenants.length;
    const activeSubscriptions = tenants.filter(t => t.status === 'active').length;
    const pendingSchools = tenants.filter(t => t.status === 'pending').length;
    const suspendedSchools = tenants.filter(t => t.status === 'suspended').length;
    
    // Calculate revenue (mock data for now)
    const monthlyRevenue = activeSubscriptions * 250; // $250 per school
    const totalUsers = activeSubscriptions * 150; // Average 150 users per school
    
    // System health
    const systemHealth = {
      database: 'Excellent',
      performance: 'Good',
      uptime: '99.9%',
      lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    };

    res.json({
      message: 'Dashboard stats retrieved successfully',
      stats: {
        totalSchools,
        activeSubscriptions,
        pendingSchools,
        suspendedSchools,
        monthlyRevenue,
        totalUsers,
        systemHealth
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard stats',
      message: error.message
    });
  }
});

// ==================== SCHOOLS MANAGEMENT ====================

// List all schools with detailed info
router.get('/schools', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    
    const tenants = await multiTenantManager.listTenants();
    
    // Filter and paginate
    let filteredTenants = tenants;
    
    if (search) {
      filteredTenants = tenants.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.tenantId.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status) {
      filteredTenants = filteredTenants.filter(t => t.status === status);
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTenants = filteredTenants.slice(startIndex, endIndex);
    
    // Get detailed info for each tenant
    const schoolsWithDetails = await Promise.all(
      paginatedTenants.map(async (tenant) => {
        try {
          const connection = await multiTenantManager.getTenantConnection(tenant.tenantId);
          const userCount = await connection.connection.db.collection('users').countDocuments();
          const studentCount = await connection.connection.db.collection('students').countDocuments();
          const teacherCount = await connection.connection.db.collection('teachers').countDocuments();
          
          return {
            id: tenant.tenantId,
            name: tenant.name,
            domain: tenant.domain,
            status: tenant.status,
            subscriptionPlan: tenant.subscriptionPlan || 'basic',
            createdAt: tenant.createdAt,
            expiresAt: tenant.expiresAt,
            stats: {
              users: userCount,
              students: studentCount,
              teachers: teacherCount
            },
            contactEmail: tenant.contactEmail,
            contactPhone: tenant.contactPhone
          };
        } catch (error) {
          return {
            id: tenant.tenantId,
            name: tenant.name,
            domain: tenant.domain,
            status: tenant.status,
            subscriptionPlan: tenant.subscriptionPlan || 'basic',
            createdAt: tenant.createdAt,
            expiresAt: tenant.expiresAt,
            stats: {
              users: 0,
              students: 0,
              teachers: 0
            },
            contactEmail: tenant.contactEmail,
            contactPhone: tenant.contactPhone,
            error: 'Unable to fetch stats'
          };
        }
      })
    );

    res.json({
      message: 'Schools retrieved successfully',
      schools: schoolsWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredTenants.length,
        pages: Math.ceil(filteredTenants.length / limit)
      }
    });
  } catch (error) {
    console.error('Schools list error:', error);
    res.status(500).json({
      error: 'Failed to get schools list',
      message: error.message
    });
  }
});

// Get single school details
router.get('/schools/:schoolId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    const tenant = await multiTenantManager.getTenantInfo(schoolId);
    if (!tenant) {
      return res.status(404).json({
        error: 'School not found',
        message: `School '${schoolId}' does not exist`
      });
    }

    // Get detailed stats
    const connection = await multiTenantManager.getTenantConnection(schoolId);
    const userCount = await connection.connection.db.collection('users').countDocuments();
    const studentCount = await connection.connection.db.collection('students').countDocuments();
    const teacherCount = await connection.connection.db.collection('teachers').countDocuments();
    const classCount = await connection.connection.db.collection('schoolclasses').countDocuments();
    const examCount = await connection.connection.db.collection('exams').countDocuments();
    const feeCount = await connection.connection.db.collection('feestructures').countDocuments();

    // Get recent activity
    const recentUsers = await connection.connection.db.collection('users')
      .find({}, { sort: { createdAt: -1 }, limit: 5 })
      .toArray();

    const recentStudents = await connection.connection.db.collection('students')
      .find({}, { sort: { createdAt: -1 }, limit: 5 })
      .toArray();

    res.json({
      message: 'School details retrieved successfully',
      school: {
        id: tenant.tenantId,
        name: tenant.name,
        domain: tenant.domain,
        status: tenant.status,
        subscriptionPlan: tenant.subscriptionPlan || 'basic',
        createdAt: tenant.createdAt,
        expiresAt: tenant.expiresAt,
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        settings: tenant.settings,
        stats: {
          users: userCount,
          students: studentCount,
          teachers: teacherCount,
          classes: classCount,
          exams: examCount,
          fees: feeCount
        },
        recentActivity: {
          users: recentUsers,
          students: recentStudents
        }
      }
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
router.post('/schools', authenticateToken, requireAdmin, [
  body('name').isString().isLength({ min: 2, max: 100 }),
  body('tenantId').isString().isLength({ min: 3, max: 50 }).matches(/^[a-z0-9-]+$/),
  body('contactEmail').isEmail(),
  body('contactPhone').optional().isMobilePhone('any'),
  body('domain').optional().isURL(),
  body('subscriptionPlan').optional().isIn(['basic', 'premium', 'enterprise']),
  body('expiresAt').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { tenantId, ...schoolInfo } = req.body;

    // Check if school already exists
    const existingTenant = await multiTenantManager.getTenantInfo(tenantId);
    if (existingTenant) {
      return res.status(409).json({
        error: 'School already exists',
        message: `School '${tenantId}' already exists`
      });
    }

    // Create new tenant
    const tenant = await multiTenantManager.createTenant(tenantId, schoolInfo);

    // Automatically onboard the tenant
    const onboardingResult = await tenantOnboarding.onboardTenant(tenantId, schoolInfo);

    // Log admin action
    await auditLogger.log({
      action: 'SCHOOL_CREATED',
      userId: req.user.id,
      details: {
        schoolId: tenantId,
        schoolName: schoolInfo.name,
        subscriptionPlan: schoolInfo.subscriptionPlan || 'basic'
      }
    });

    res.status(201).json({
      message: 'School created and onboarded successfully',
      school: {
        id: tenant.tenantId,
        name: tenant.name,
        status: tenant.status,
        createdAt: tenant.createdAt,
        subscriptionPlan: tenant.subscriptionPlan,
        adminCredentials: {
          email: onboardingResult.superAdmin.email,
          password: onboardingResult.superAdmin.defaultPassword
        }
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

// Update school
router.put('/schools/:schoolId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { schoolId } = req.params;
    const updates = req.body;

    const updatedTenant = await multiTenantManager.updateTenant(schoolId, updates);
    
    if (!updatedTenant) {
      return res.status(404).json({
        error: 'School not found',
        message: `School '${schoolId}' does not exist`
      });
    }

    // Log admin action
    await auditLogger.log({
      action: 'SCHOOL_UPDATED',
      userId: req.user.id,
      details: {
        schoolId,
        updates
      }
    });

    res.json({
      message: 'School updated successfully',
      school: {
        id: updatedTenant.tenantId,
        name: updatedTenant.name,
        status: updatedTenant.status,
        updatedAt: updatedTenant.updatedAt
      }
    });
  } catch (error) {
    console.error('School update error:', error);
    res.status(500).json({
      error: 'Failed to update school',
      message: error.message
    });
  }
});

// Delete school
router.delete('/schools/:schoolId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    // Check if school exists
    const tenant = await multiTenantManager.getTenantInfo(schoolId);
    if (!tenant) {
      return res.status(404).json({
        error: 'School not found',
        message: `School '${schoolId}' does not exist`
      });
    }

    // Delete tenant
    await multiTenantManager.deleteTenant(schoolId);

    // Log admin action
    await auditLogger.log({
      action: 'SCHOOL_DELETED',
      userId: req.user.id,
      details: {
        schoolId,
        schoolName: tenant.name
      }
    });

    res.json({
      message: 'School deleted successfully',
      schoolId: schoolId
    });
  } catch (error) {
    console.error('School deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete school',
      message: error.message
    });
  }
});

// ==================== BILLING & SUBSCRIPTIONS ====================

// Get all subscriptions
router.get('/billing/subscriptions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tenants = await multiTenantManager.listTenants();
    
    const subscriptions = tenants.map(tenant => ({
      schoolId: tenant.tenantId,
      schoolName: tenant.name,
      plan: tenant.subscriptionPlan || 'basic',
      status: tenant.status,
      createdAt: tenant.createdAt,
      expiresAt: tenant.expiresAt,
      amount: getPlanAmount(tenant.subscriptionPlan || 'basic'),
      isOverdue: tenant.expiresAt && new Date(tenant.expiresAt) < new Date()
    }));

    const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const overdueSubscriptions = subscriptions.filter(s => s.isOverdue).length;

    res.json({
      message: 'Subscriptions retrieved successfully',
      subscriptions,
      summary: {
        totalRevenue,
        activeSubscriptions,
        overdueSubscriptions,
        totalSubscriptions: subscriptions.length
      }
    });
  } catch (error) {
    console.error('Subscriptions error:', error);
    res.status(500).json({
      error: 'Failed to get subscriptions',
      message: error.message
    });
  }
});

// Get billing analytics
router.get('/billing/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tenants = await multiTenantManager.listTenants();
    
    // Calculate monthly revenue for last 12 months
    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toISOString().slice(0, 7);
      
      const activeSchools = tenants.filter(t => 
        t.status === 'active' && 
        t.createdAt && 
        new Date(t.createdAt) <= date
      ).length;
      
      monthlyRevenue.push({
        month,
        revenue: activeSchools * 250, // $250 per school
        schools: activeSchools
      });
    }

    // Plan distribution
    const planDistribution = {
      basic: tenants.filter(t => t.subscriptionPlan === 'basic').length,
      premium: tenants.filter(t => t.subscriptionPlan === 'premium').length,
      enterprise: tenants.filter(t => t.subscriptionPlan === 'enterprise').length
    };

    res.json({
      message: 'Billing analytics retrieved successfully',
      analytics: {
        monthlyRevenue,
        planDistribution,
        totalRevenue: monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0)
      }
    });
  } catch (error) {
    console.error('Billing analytics error:', error);
    res.status(500).json({
      error: 'Failed to get billing analytics',
      message: error.message
    });
  }
});

// ==================== SUPPORT & COMMUNICATION ====================

// Get support tickets
router.get('/support/tickets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Mock support tickets - in real app, this would come from a support system
    const tickets = [
      {
        id: 1,
        schoolId: 'st-marys',
        schoolName: 'St. Mary\'s High School',
        subject: 'Login issues',
        status: 'open',
        priority: 'high',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastUpdated: new Date().toISOString()
      },
      {
        id: 2,
        schoolId: 'nairobi-academy',
        schoolName: 'Nairobi Academy',
        subject: 'Payment processing',
        status: 'in-progress',
        priority: 'medium',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
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
router.get('/backups', authenticateToken, requireAdmin, async (req, res) => {
  res.json({
    message: 'Backups retrieved successfully',
    backups,
  });
});

// Create new backup
router.post('/backups', authenticateToken, requireAdmin, async (req, res) => {
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

// ==================== SYSTEM SETTINGS ====================

// Get system settings
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = {
      system: {
        maintenanceMode: false,
        backupFrequency: 'daily',
        dataRetention: '2 years',
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

// Update system settings
router.put('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    
    // Log admin action
    await auditLogger.log({
      action: 'SYSTEM_SETTINGS_UPDATED',
      userId: req.user.id,
      details: updates
    });

    res.json({
      message: 'System settings updated successfully',
      settings: updates
    });
  } catch (error) {
    console.error('System settings update error:', error);
    res.status(500).json({
      error: 'Failed to update system settings',
      message: error.message
    });
  }
});

// ==================== ANALYTICS ====================

// Get system analytics
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tenants = await multiTenantManager.listTenants();
    
    // Calculate various analytics
    const totalSchools = tenants.length;
    const activeSchools = tenants.filter(t => t.status === 'active').length;
    const totalUsers = activeSchools * 150; // Mock calculation
    
    // Growth metrics
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const newSchoolsThisMonth = tenants.filter(t => {
      const created = new Date(t.createdAt);
      return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
    }).length;

    const analytics = {
      overview: {
        totalSchools,
        activeSchools,
        totalUsers,
        newSchoolsThisMonth,
        growthRate: ((newSchoolsThisMonth / totalSchools) * 100).toFixed(1)
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
router.get('/export', authenticateToken, requireAdmin, async (req, res) => {
  res.json({
    message: 'Available export types',
    types: Object.keys(exportData),
  });
});

// Export data for a type
router.post('/export', authenticateToken, requireAdmin, async (req, res) => {
  const { type } = req.body;
  if (!type || !exportData[type]) {
    return res.status(400).json({ error: 'Invalid export type' });
  }
  res.json({
    message: `Exported data for ${type}`,
    data: exportData[type],
  });
});

// Helper function to get plan amount
function getPlanAmount(plan) {
  const amounts = {
    basic: 250,
    premium: 500,
    enterprise: 1000
  };
  return amounts[plan] || 250;
}

module.exports = router; 