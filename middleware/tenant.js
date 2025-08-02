const multiTenantManager = require('../config/multiTenant');
const jwt = require('jsonwebtoken');

// Tenant middleware for multi-tenant routing
const tenantMiddleware = async (req, res, next) => {
  try {
    // Extract tenant from subdomain or header
    const host = req.headers.host || req.get('host');
    const tenantId = extractTenantFromHost(host);
    
    if (tenantId) {
      // Get tenant connection
      const tenantConnection = await multiTenantManager.getTenantConnection(tenantId);
      req.tenantConnection = tenantConnection;
      req.tenantId = tenantId;
      
      // Get tenant info
      const tenantInfo = await multiTenantManager.getTenantInfo(tenantId);
      req.tenantInfo = tenantInfo;
    }
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    next();
  }
};

// Extract tenant from hostname
const extractTenantFromHost = (host) => {
  if (!host) return null;
  
  // Handle localhost for development
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return null; // Use default connection for localhost
  }
  
  // Extract subdomain from host
  const parts = host.split('.');
  if (parts.length >= 3 && parts[1] === 'jafasol' && parts[2] === 'com') {
    return parts[0]; // Return subdomain as tenant ID
  }
  
  return null;
};

// Tenant-specific authentication
const authenticateTenantUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get tenant connection
    const tenantId = req.tenantId || decoded.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        error: 'Tenant not found',
        message: 'Invalid tenant access'
      });
    }
    
    const tenantConnection = await multiTenantManager.getTenantConnection(tenantId);
    
    // Get user from tenant database
    const User = tenantConnection.model('User');
    const user = await User.findById(decoded.userId).populate('roleId');
    
    if (!user || user.status !== 'Active') {
      return res.status(401).json({
        error: 'User not found or inactive',
        message: 'Please login again'
      });
    }
    
    req.user = user;
    req.tenantId = tenantId;
    next();
  } catch (error) {
    console.error('Tenant authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Please login again'
    });
  }
};

// System-wide authentication (for admin dashboard)
const authenticateSystemUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get system connection
    const systemConnection = await multiTenantManager.getDefaultConnection();
    const User = systemConnection.model('User');
    const user = await User.findById(decoded.userId).populate('roleId');
    
    if (!user || user.status !== 'Active') {
      return res.status(401).json({
        error: 'User not found or inactive',
        message: 'Please login again'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('System authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Please login again'
    });
  }
};

// Role-based authorization
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }
    
    const userRole = req.user.roleId?.name;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

// Tenant-specific role authorization
const requireTenantRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }
    
    if (!req.tenantId) {
      return res.status(400).json({
        error: 'Tenant context required',
        message: 'Please access this resource through a school subdomain'
      });
    }
    
    const userRole = req.user.roleId?.name;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

module.exports = {
  tenantMiddleware,
  authenticateTenantUser,
  authenticateSystemUser,
  requireRole,
  requireTenantRole,
  extractTenantFromHost
}; 