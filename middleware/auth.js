const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found' 
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ 
        error: 'Account inactive',
        message: 'Your account is not active. Please contact administrator.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please login again.' 
      });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication' 
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access this resource' 
      });
    }

    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource' 
      });
    }

    next();
  };
};

const requirePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access this resource' 
      });
    }

    const permissions = req.user.role.permissions;
    if (!permissions || !permissions[module] || !permissions[module][action]) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `You do not have ${action} permission for ${module}` 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission
}; 