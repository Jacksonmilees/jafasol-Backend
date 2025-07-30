const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { requireRole, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const { Op } = require('sequelize');

const router = express.Router();

// Get all settings
router.get('/', requirePermission('Settings', 'view'), async (req, res) => {
  try {
    // Mock settings data
    const settingsData = {
      general: {
        schoolName: 'Jafasol Academy',
        schoolAddress: '123 Education Street, Nairobi, Kenya',
        schoolPhone: '+254700123456',
        schoolEmail: 'info@jafasolacademy.com',
        schoolWebsite: 'www.jafasolacademy.com',
        academicYear: '2024',
        term: 'Term 1',
        timezone: 'Africa/Nairobi',
        language: 'English',
        currency: 'KES'
      },
      academic: {
        gradingSystem: 'A-F',
        passPercentage: 50,
        maxClassSize: 35,
        examWeight: 70,
        assignmentWeight: 30,
        attendanceWeight: 10,
        enableGradeCurving: false,
        enableGradeComments: true
      },
      attendance: {
        enableAttendanceTracking: true,
        attendanceMethod: 'manual',
        lateThreshold: 15,
        absentThreshold: 30,
        enableNotifications: true,
        attendanceReportFrequency: 'weekly'
      },
      fees: {
        enableFeeTracking: true,
        currency: 'KES',
        enableLateFees: true,
        lateFeePercentage: 5,
        enableInstallments: true,
        maxInstallments: 3,
        enableOnlinePayments: true,
        paymentMethods: ['mpesa', 'bank', 'cash']
      },
      communication: {
        enableEmailNotifications: true,
        enableSMSSNotifications: false,
        enablePushNotifications: true,
        emailTemplate: 'default',
        smsProvider: 'twilio',
        notificationSchedule: 'immediate'
      },
      security: {
        enableTwoFactor: true,
        passwordPolicy: 'strong',
        sessionTimeout: 24,
        enableAuditLogging: true,
        enableLoginLogging: true,
        maxLoginAttempts: 5,
        lockoutDuration: 30
      },
      system: {
        enableMaintenanceMode: false,
        enableDebugMode: false,
        enableErrorReporting: true,
        backupFrequency: 'daily',
        backupRetention: 30,
        enableAutoUpdates: true,
        enableSystemNotifications: true
      }
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Settings Accessed', { 
      type: 'Settings', 
      action: 'View'
    }, `Accessed by ${req.user.name}`);

    res.json({
      settings: settingsData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      error: 'Failed to fetch settings',
      message: 'An error occurred while fetching settings'
    });
  }
});

// Update general settings
router.put('/general', [
  body('schoolName').optional().trim().isLength({ min: 2, max: 100 }),
  body('schoolAddress').optional().trim().isLength({ min: 5, max: 200 }),
  body('schoolPhone').optional().matches(/^\+254\d{9}$/),
  body('schoolEmail').optional().isEmail(),
  body('schoolWebsite').optional().isURL(),
  body('academicYear').optional().isLength({ min: 4, max: 4 }),
  body('term').optional().isIn(['Term 1', 'Term 2', 'Term 3']),
  body('timezone').optional().isString(),
  body('language').optional().isIn(['English', 'Swahili']),
  body('currency').optional().isIn(['KES', 'USD', 'EUR'])
], requirePermission('Settings', 'edit'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const updateData = req.body;

    // Mock update response
    const updatedSettings = {
      schoolName: updateData.schoolName || 'Jafasol Academy',
      schoolAddress: updateData.schoolAddress || '123 Education Street, Nairobi, Kenya',
      schoolPhone: updateData.schoolPhone || '+254700123456',
      schoolEmail: updateData.schoolEmail || 'info@jafasolacademy.com',
      schoolWebsite: updateData.schoolWebsite || 'www.jafasolacademy.com',
      academicYear: updateData.academicYear || '2024',
      term: updateData.term || 'Term 1',
      timezone: updateData.timezone || 'Africa/Nairobi',
      language: updateData.language || 'English',
      currency: updateData.currency || 'KES',
      updatedAt: new Date()
    };

    // Create audit log
    await createAuditLog(req.user.id, 'General Settings Updated', { 
      type: 'Settings', 
      action: 'Update General',
      changes: updateData
    }, `Updated by ${req.user.name}`);

    res.json({
      message: 'General settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Update general settings error:', error);
    res.status(500).json({
      error: 'Failed to update general settings',
      message: 'An error occurred while updating general settings'
    });
  }
});

// Update academic settings
router.put('/academic', [
  body('gradingSystem').optional().isIn(['A-F', '1-100', 'Pass/Fail']),
  body('passPercentage').optional().isInt({ min: 0, max: 100 }),
  body('maxClassSize').optional().isInt({ min: 10, max: 50 }),
  body('examWeight').optional().isInt({ min: 0, max: 100 }),
  body('assignmentWeight').optional().isInt({ min: 0, max: 100 }),
  body('attendanceWeight').optional().isInt({ min: 0, max: 100 }),
  body('enableGradeCurving').optional().isBoolean(),
  body('enableGradeComments').optional().isBoolean()
], requirePermission('Settings', 'edit'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const updateData = req.body;

    // Mock update response
    const updatedSettings = {
      gradingSystem: updateData.gradingSystem || 'A-F',
      passPercentage: updateData.passPercentage || 50,
      maxClassSize: updateData.maxClassSize || 35,
      examWeight: updateData.examWeight || 70,
      assignmentWeight: updateData.assignmentWeight || 30,
      attendanceWeight: updateData.attendanceWeight || 10,
      enableGradeCurving: updateData.enableGradeCurving !== undefined ? updateData.enableGradeCurving : false,
      enableGradeComments: updateData.enableGradeComments !== undefined ? updateData.enableGradeComments : true,
      updatedAt: new Date()
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Academic Settings Updated', { 
      type: 'Settings', 
      action: 'Update Academic',
      changes: updateData
    }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Academic settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Update academic settings error:', error);
    res.status(500).json({
      error: 'Failed to update academic settings',
      message: 'An error occurred while updating academic settings'
    });
  }
});

// Update attendance settings
router.put('/attendance', [
  body('enableAttendanceTracking').optional().isBoolean(),
  body('attendanceMethod').optional().isIn(['manual', 'automated', 'hybrid']),
  body('lateThreshold').optional().isInt({ min: 1, max: 60 }),
  body('absentThreshold').optional().isInt({ min: 1, max: 120 }),
  body('enableNotifications').optional().isBoolean(),
  body('attendanceReportFrequency').optional().isIn(['daily', 'weekly', 'monthly'])
], requirePermission('Settings', 'edit'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const updateData = req.body;

    // Mock update response
    const updatedSettings = {
      enableAttendanceTracking: updateData.enableAttendanceTracking !== undefined ? updateData.enableAttendanceTracking : true,
      attendanceMethod: updateData.attendanceMethod || 'manual',
      lateThreshold: updateData.lateThreshold || 15,
      absentThreshold: updateData.absentThreshold || 30,
      enableNotifications: updateData.enableNotifications !== undefined ? updateData.enableNotifications : true,
      attendanceReportFrequency: updateData.attendanceReportFrequency || 'weekly',
      updatedAt: new Date()
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Attendance Settings Updated', { 
      type: 'Settings', 
      action: 'Update Attendance',
      changes: updateData
    }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Attendance settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Update attendance settings error:', error);
    res.status(500).json({
      error: 'Failed to update attendance settings',
      message: 'An error occurred while updating attendance settings'
    });
  }
});

// Update fees settings
router.put('/fees', [
  body('enableFeeTracking').optional().isBoolean(),
  body('currency').optional().isIn(['KES', 'USD', 'EUR']),
  body('enableLateFees').optional().isBoolean(),
  body('lateFeePercentage').optional().isFloat({ min: 0, max: 50 }),
  body('enableInstallments').optional().isBoolean(),
  body('maxInstallments').optional().isInt({ min: 1, max: 12 }),
  body('enableOnlinePayments').optional().isBoolean(),
  body('paymentMethods').optional().isArray()
], requirePermission('Settings', 'edit'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const updateData = req.body;

    // Mock update response
    const updatedSettings = {
      enableFeeTracking: updateData.enableFeeTracking !== undefined ? updateData.enableFeeTracking : true,
      currency: updateData.currency || 'KES',
      enableLateFees: updateData.enableLateFees !== undefined ? updateData.enableLateFees : true,
      lateFeePercentage: updateData.lateFeePercentage || 5,
      enableInstallments: updateData.enableInstallments !== undefined ? updateData.enableInstallments : true,
      maxInstallments: updateData.maxInstallments || 3,
      enableOnlinePayments: updateData.enableOnlinePayments !== undefined ? updateData.enableOnlinePayments : true,
      paymentMethods: updateData.paymentMethods || ['mpesa', 'bank', 'cash'],
      updatedAt: new Date()
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Fees Settings Updated', { 
      type: 'Settings', 
      action: 'Update Fees',
      changes: updateData
    }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Fees settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Update fees settings error:', error);
    res.status(500).json({
      error: 'Failed to update fees settings',
      message: 'An error occurred while updating fees settings'
    });
  }
});

// Update communication settings
router.put('/communication', [
  body('enableEmailNotifications').optional().isBoolean(),
  body('enableSMSSNotifications').optional().isBoolean(),
  body('enablePushNotifications').optional().isBoolean(),
  body('emailTemplate').optional().isString(),
  body('smsProvider').optional().isIn(['twilio', 'africastalking', 'other']),
  body('notificationSchedule').optional().isIn(['immediate', 'daily', 'weekly'])
], requirePermission('Settings', 'edit'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const updateData = req.body;

    // Mock update response
    const updatedSettings = {
      enableEmailNotifications: updateData.enableEmailNotifications !== undefined ? updateData.enableEmailNotifications : true,
      enableSMSSNotifications: updateData.enableSMSSNotifications !== undefined ? updateData.enableSMSSNotifications : false,
      enablePushNotifications: updateData.enablePushNotifications !== undefined ? updateData.enablePushNotifications : true,
      emailTemplate: updateData.emailTemplate || 'default',
      smsProvider: updateData.smsProvider || 'twilio',
      notificationSchedule: updateData.notificationSchedule || 'immediate',
      updatedAt: new Date()
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Communication Settings Updated', { 
      type: 'Settings', 
      action: 'Update Communication',
      changes: updateData
    }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Communication settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Update communication settings error:', error);
    res.status(500).json({
      error: 'Failed to update communication settings',
      message: 'An error occurred while updating communication settings'
    });
  }
});

// Update security settings
router.put('/security', [
  body('enableTwoFactor').optional().isBoolean(),
  body('passwordPolicy').optional().isIn(['weak', 'medium', 'strong']),
  body('sessionTimeout').optional().isInt({ min: 1, max: 168 }),
  body('enableAuditLogging').optional().isBoolean(),
  body('enableLoginLogging').optional().isBoolean(),
  body('maxLoginAttempts').optional().isInt({ min: 1, max: 10 }),
  body('lockoutDuration').optional().isInt({ min: 5, max: 60 })
], requirePermission('Settings', 'edit'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const updateData = req.body;

    // Mock update response
    const updatedSettings = {
      enableTwoFactor: updateData.enableTwoFactor !== undefined ? updateData.enableTwoFactor : true,
      passwordPolicy: updateData.passwordPolicy || 'strong',
      sessionTimeout: updateData.sessionTimeout || 24,
      enableAuditLogging: updateData.enableAuditLogging !== undefined ? updateData.enableAuditLogging : true,
      enableLoginLogging: updateData.enableLoginLogging !== undefined ? updateData.enableLoginLogging : true,
      maxLoginAttempts: updateData.maxLoginAttempts || 5,
      lockoutDuration: updateData.lockoutDuration || 30,
      updatedAt: new Date()
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Security Settings Updated', { 
      type: 'Settings', 
      action: 'Update Security',
      changes: updateData
    }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Security settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Update security settings error:', error);
    res.status(500).json({
      error: 'Failed to update security settings',
      message: 'An error occurred while updating security settings'
    });
  }
});

// Update system settings
router.put('/system', [
  body('enableMaintenanceMode').optional().isBoolean(),
  body('enableDebugMode').optional().isBoolean(),
  body('enableErrorReporting').optional().isBoolean(),
  body('backupFrequency').optional().isIn(['hourly', 'daily', 'weekly', 'monthly']),
  body('backupRetention').optional().isInt({ min: 1, max: 365 }),
  body('enableAutoUpdates').optional().isBoolean(),
  body('enableSystemNotifications').optional().isBoolean()
], requirePermission('Settings', 'edit'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const updateData = req.body;

    // Mock update response
    const updatedSettings = {
      enableMaintenanceMode: updateData.enableMaintenanceMode !== undefined ? updateData.enableMaintenanceMode : false,
      enableDebugMode: updateData.enableDebugMode !== undefined ? updateData.enableDebugMode : false,
      enableErrorReporting: updateData.enableErrorReporting !== undefined ? updateData.enableErrorReporting : true,
      backupFrequency: updateData.backupFrequency || 'daily',
      backupRetention: updateData.backupRetention || 30,
      enableAutoUpdates: updateData.enableAutoUpdates !== undefined ? updateData.enableAutoUpdates : true,
      enableSystemNotifications: updateData.enableSystemNotifications !== undefined ? updateData.enableSystemNotifications : true,
      updatedAt: new Date()
    };

    // Create audit log
    await createAuditLog(req.user.id, 'System Settings Updated', { 
      type: 'Settings', 
      action: 'Update System',
      changes: updateData
    }, `Updated by ${req.user.name}`);

    res.json({
      message: 'System settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      error: 'Failed to update system settings',
      message: 'An error occurred while updating system settings'
    });
  }
});

// Reset settings to default
router.post('/reset', requirePermission('Settings', 'edit'), async (req, res) => {
  try {
    // Mock reset response
    const defaultSettings = {
      general: {
        schoolName: 'Jafasol Academy',
        schoolAddress: '123 Education Street, Nairobi, Kenya',
        schoolPhone: '+254700123456',
        schoolEmail: 'info@jafasolacademy.com',
        schoolWebsite: 'www.jafasolacademy.com',
        academicYear: '2024',
        term: 'Term 1',
        timezone: 'Africa/Nairobi',
        language: 'English',
        currency: 'KES'
      },
      academic: {
        gradingSystem: 'A-F',
        passPercentage: 50,
        maxClassSize: 35,
        examWeight: 70,
        assignmentWeight: 30,
        attendanceWeight: 10,
        enableGradeCurving: false,
        enableGradeComments: true
      },
      attendance: {
        enableAttendanceTracking: true,
        attendanceMethod: 'manual',
        lateThreshold: 15,
        absentThreshold: 30,
        enableNotifications: true,
        attendanceReportFrequency: 'weekly'
      },
      fees: {
        enableFeeTracking: true,
        currency: 'KES',
        enableLateFees: true,
        lateFeePercentage: 5,
        enableInstallments: true,
        maxInstallments: 3,
        enableOnlinePayments: true,
        paymentMethods: ['mpesa', 'bank', 'cash']
      },
      communication: {
        enableEmailNotifications: true,
        enableSMSSNotifications: false,
        enablePushNotifications: true,
        emailTemplate: 'default',
        smsProvider: 'twilio',
        notificationSchedule: 'immediate'
      },
      security: {
        enableTwoFactor: true,
        passwordPolicy: 'strong',
        sessionTimeout: 24,
        enableAuditLogging: true,
        enableLoginLogging: true,
        maxLoginAttempts: 5,
        lockoutDuration: 30
      },
      system: {
        enableMaintenanceMode: false,
        enableDebugMode: false,
        enableErrorReporting: true,
        backupFrequency: 'daily',
        backupRetention: 30,
        enableAutoUpdates: true,
        enableSystemNotifications: true
      }
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Settings Reset to Default', { 
      type: 'Settings', 
      action: 'Reset'
    }, `Reset by ${req.user.name}`);

    res.json({
      message: 'Settings reset to default successfully',
      settings: defaultSettings
    });

  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      error: 'Failed to reset settings',
      message: 'An error occurred while resetting settings'
    });
  }
});

module.exports = router; 