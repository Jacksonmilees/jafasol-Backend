const AuditLog = require('../models/AuditLog');

const createAuditLog = async (userId, action, target, details) => {
  try {
    const auditLog = await AuditLog.create({
      userId,
      action,
      target,
      details,
      timestamp: new Date().toISOString()
    });

    return auditLog;
  } catch (error) {
    console.error('Audit log creation error:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

module.exports = { createAuditLog }; 