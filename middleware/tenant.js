const multiTenantManager = require('../config/multiTenant');

// Middleware to identify tenant from request
const identifyTenant = async (req, res, next) => {
  try {
    // Multiple ways to identify tenant:
    // 1. From subdomain (e.g., school1.jafasol.com)
    // 2. From custom header (X-Tenant-ID)
    // 3. From query parameter (?tenant=school1)
    // 4. From JWT token (if user is logged in)
    
    let tenantId = null;
    
    // Method 1: From subdomain
    const host = req.get('host');
    if (host && host.includes('.')) {
      const subdomain = host.split('.')[0];
      if (subdomain !== 'www' && subdomain !== 'api') {
        tenantId = subdomain;
      }
    }
    
    // Method 2: From custom header
    if (!tenantId && req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'];
    }
    
    // Method 3: From query parameter
    if (!tenantId && req.query.tenant) {
      tenantId = req.query.tenant;
    }
    
    // Method 4: From JWT token (if user is logged in)
    if (!tenantId && req.user && req.user.tenantId) {
      tenantId = req.user.tenantId;
    }
    
    // Method 5: Default tenant for development
    if (!tenantId && process.env.NODE_ENV === 'development') {
      tenantId = 'demo';
    }
    
    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant identification required',
        message: 'Please provide tenant ID via subdomain, header, or query parameter'
      });
    }
    
    // Validate tenant exists
    const tenantInfo = await multiTenantManager.getTenantInfo(tenantId);
    if (!tenantInfo) {
      return res.status(404).json({
        error: 'Tenant not found',
        message: `Tenant '${tenantId}' does not exist`
      });
    }
    
    // Check if tenant is active
    if (tenantInfo.status !== 'active') {
      return res.status(403).json({
        error: 'Tenant inactive',
        message: `Tenant '${tenantId}' is ${tenantInfo.status}`
      });
    }
    
    // Get tenant-specific database connection
    const tenantConnection = await multiTenantManager.getTenantConnection(tenantId);
    
    // Attach tenant info to request
    req.tenantId = tenantId;
    req.tenantInfo = tenantInfo;
    req.tenantConnection = tenantConnection;
    
    next();
  } catch (error) {
    console.error('Tenant identification error:', error);
    res.status(500).json({
      error: 'Tenant identification failed',
      message: 'Unable to identify tenant'
    });
  }
};

// Middleware to create tenant-specific models
const createTenantModels = (req, res, next) => {
  try {
    const connection = req.tenantConnection;
    
    // Create tenant-specific models
    req.models = {
      User: require('../models/User')(connection),
      Student: require('../models/Student')(connection),
      Teacher: require('../models/Teacher')(connection),
      Role: require('../models/Role')(connection),
      SchoolClass: require('../models/SchoolClass')(connection),
      Subject: require('../models/Subject')(connection),
      Exam: require('../models/Exam')(connection),
      AttendanceRecord: require('../models/AttendanceRecord')(connection),
      FeeStructure: require('../models/FeeStructure')(connection),
      FeePayment: require('../models/FeePayment')(connection),
      FeeInvoice: require('../models/FeeInvoice')(connection),
      Book: require('../models/Book')(connection),
      BookIssue: require('../models/BookIssue')(connection),
      LearningResource: require('../models/LearningResource')(connection),
      TimetableEntry: require('../models/TimetableEntry')(connection),
      Message: require('../models/Message')(connection),
      AuditLog: require('../models/AuditLog')(connection)
    };
    
    next();
  } catch (error) {
    console.error('Model creation error:', error);
    res.status(500).json({
      error: 'Model creation failed',
      message: 'Unable to create tenant-specific models'
    });
  }
};

// Combine both middlewares
const tenantMiddleware = [identifyTenant, createTenantModels];

module.exports = {
  identifyTenant,
  createTenantModels,
  tenantMiddleware
}; 