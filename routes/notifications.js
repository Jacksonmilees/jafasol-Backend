const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { requireRole, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const { Op } = require('sequelize');

const router = express.Router();

// Mock notifications data
let notifications = [
  {
    id: '1',
    userId: '1',
    title: 'New Fee Payment Received',
    message: 'Payment of KES 25,000 received from Sarah Wilson',
    type: 'payment',
    priority: 'medium',
    isRead: false,
    actionUrl: '/fees/payments',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  {
    id: '2',
    userId: '1',
    title: 'Low Attendance Alert',
    message: 'Class 2B attendance dropped below 85% this week',
    type: 'attendance',
    priority: 'high',
    isRead: false,
    actionUrl: '/attendance',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
  },
  {
    id: '3',
    userId: '1',
    title: 'Exam Results Uploaded',
    message: 'Mathematics mid-term results have been uploaded',
    type: 'exam',
    priority: 'medium',
    isRead: true,
    actionUrl: '/exams/results',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
  },
  {
    id: '4',
    userId: '1',
    title: 'New Student Enrollment',
    message: 'John Doe has been enrolled in Class 3A',
    type: 'enrollment',
    priority: 'low',
    isRead: true,
    actionUrl: '/students',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  {
    id: '5',
    userId: '1',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Sunday 2:00 AM - 4:00 AM',
    type: 'system',
    priority: 'medium',
    isRead: false,
    actionUrl: '/settings',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
  }
];

// Get user notifications
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isString(),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('isRead').optional().isBoolean(),
  query('sort').optional().isIn(['newest', 'oldest', 'priority'])
], requirePermission('Notifications', 'view'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { type, priority, isRead, sort = 'newest' } = req.query;

    // Filter notifications for current user
    let filteredNotifications = notifications.filter(n => n.userId === req.user.id);
    
    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }
    
    if (priority) {
      filteredNotifications = filteredNotifications.filter(n => n.priority === priority);
    }
    
    if (isRead !== undefined) {
      filteredNotifications = filteredNotifications.filter(n => n.isRead === isRead);
    }

    // Sort notifications
    switch (sort) {
      case 'newest':
        filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filteredNotifications.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        filteredNotifications.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        break;
    }

    const total = filteredNotifications.length;
    const paginatedNotifications = filteredNotifications.slice(offset, offset + limit);

    res.json({
      notifications: paginatedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount: filteredNotifications.filter(n => !n.isRead).length
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: 'An error occurred while fetching notifications'
    });
  }
});

// Mark notification as read
router.put('/:id/read', requirePermission('Notifications', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const notification = notifications.find(n => n.id === id && n.userId === req.user.id);

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        message: 'No notification found with the provided ID'
      });
    }

    notification.isRead = true;
    notification.updatedAt = new Date();

    // Create audit log
    await createAuditLog(req.user.id, 'Notification Marked as Read', { 
      type: 'Notification', 
      action: 'Mark Read',
      notificationId: id
    }, `Marked by ${req.user.name}`);

    res.json({
      message: 'Notification marked as read successfully',
      notification
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: 'An error occurred while marking notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/read-all', requirePermission('Notifications', 'edit'), async (req, res) => {
  try {
    const userNotifications = notifications.filter(n => n.userId === req.user.id && !n.isRead);
    
    userNotifications.forEach(notification => {
      notification.isRead = true;
      notification.updatedAt = new Date();
    });

    // Create audit log
    await createAuditLog(req.user.id, 'All Notifications Marked as Read', { 
      type: 'Notification', 
      action: 'Mark All Read',
      count: userNotifications.length
    }, `Marked by ${req.user.name}`);

    res.json({
      message: 'All notifications marked as read successfully',
      count: userNotifications.length
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      message: 'An error occurred while marking all notifications as read'
    });
  }
});

// Delete notification
router.delete('/:id', requirePermission('Notifications', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const notificationIndex = notifications.findIndex(n => n.id === id && n.userId === req.user.id);

    if (notificationIndex === -1) {
      return res.status(404).json({
        error: 'Notification not found',
        message: 'No notification found with the provided ID'
      });
    }

    const notification = notifications[notificationIndex];

    // Create audit log before deletion
    await createAuditLog(req.user.id, 'Notification Deleted', { 
      type: 'Notification', 
      action: 'Delete',
      notificationId: id
    }, `Deleted by ${req.user.name}`);

    notifications.splice(notificationIndex, 1);

    res.json({
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      message: 'An error occurred while deleting notification'
    });
  }
});

// Create new notification
router.post('/', [
  body('userId').isString(),
  body('title').trim().isLength({ min: 2, max: 100 }),
  body('message').trim().isLength({ min: 5, max: 500 }),
  body('type').isIn(['payment', 'attendance', 'exam', 'enrollment', 'system', 'communication', 'fee', 'academic']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('actionUrl').optional().isString(),
  body('expiresAt').optional().isISO8601()
], requirePermission('Notifications', 'create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { userId, title, message, type, priority = 'medium', actionUrl, expiresAt } = req.body;

    const newNotification = {
      id: (notifications.length + 1).toString(),
      userId,
      title,
      message,
      type,
      priority,
      isRead: false,
      actionUrl: actionUrl || '',
      createdAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
    };

    notifications.push(newNotification);

    // Create audit log
    await createAuditLog(req.user.id, 'Notification Created', { 
      type: 'Notification', 
      action: 'Create',
      notificationId: newNotification.id,
      targetUserId: userId
    }, `Created by ${req.user.name}`);

    res.status(201).json({
      message: 'Notification created successfully',
      notification: newNotification
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      error: 'Failed to create notification',
      message: 'An error occurred while creating notification'
    });
  }
});

// Get notification statistics
router.get('/statistics', requirePermission('Notifications', 'view'), async (req, res) => {
  try {
    const userNotifications = notifications.filter(n => n.userId === req.user.id);
    
    const statistics = {
      total: userNotifications.length,
      unread: userNotifications.filter(n => !n.isRead).length,
      read: userNotifications.filter(n => n.isRead).length,
      byType: {
        payment: userNotifications.filter(n => n.type === 'payment').length,
        attendance: userNotifications.filter(n => n.type === 'attendance').length,
        exam: userNotifications.filter(n => n.type === 'exam').length,
        enrollment: userNotifications.filter(n => n.type === 'enrollment').length,
        system: userNotifications.filter(n => n.type === 'system').length,
        communication: userNotifications.filter(n => n.type === 'communication').length,
        fee: userNotifications.filter(n => n.type === 'fee').length,
        academic: userNotifications.filter(n => n.type === 'academic').length
      },
      byPriority: {
        high: userNotifications.filter(n => n.priority === 'high').length,
        medium: userNotifications.filter(n => n.priority === 'medium').length,
        low: userNotifications.filter(n => n.priority === 'low').length
      },
      recentActivity: userNotifications
        .filter(n => new Date(n.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .length
    };

    res.json({
      statistics,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Notification statistics error:', error);
    res.status(500).json({
      error: 'Failed to fetch notification statistics',
      message: 'An error occurred while fetching notification statistics'
    });
  }
});

// Get notification preferences
router.get('/preferences', requirePermission('Notifications', 'view'), async (req, res) => {
  try {
    // Mock notification preferences
    const preferences = {
      email: {
        enabled: true,
        types: ['payment', 'attendance', 'exam', 'system'],
        frequency: 'immediate'
      },
      sms: {
        enabled: false,
        types: ['payment', 'attendance'],
        frequency: 'daily'
      },
      push: {
        enabled: true,
        types: ['payment', 'attendance', 'exam', 'enrollment', 'system', 'communication'],
        frequency: 'immediate'
      },
      inApp: {
        enabled: true,
        types: ['payment', 'attendance', 'exam', 'enrollment', 'system', 'communication', 'fee', 'academic'],
        frequency: 'immediate'
      }
    };

    res.json({
      preferences,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Notification preferences error:', error);
    res.status(500).json({
      error: 'Failed to fetch notification preferences',
      message: 'An error occurred while fetching notification preferences'
    });
  }
});

// Update notification preferences
router.put('/preferences', [
  body('email.enabled').optional().isBoolean(),
  body('email.types').optional().isArray(),
  body('email.frequency').optional().isIn(['immediate', 'hourly', 'daily', 'weekly']),
  body('sms.enabled').optional().isBoolean(),
  body('sms.types').optional().isArray(),
  body('sms.frequency').optional().isIn(['immediate', 'hourly', 'daily', 'weekly']),
  body('push.enabled').optional().isBoolean(),
  body('push.types').optional().isArray(),
  body('push.frequency').optional().isIn(['immediate', 'hourly', 'daily', 'weekly']),
  body('inApp.enabled').optional().isBoolean(),
  body('inApp.types').optional().isArray(),
  body('inApp.frequency').optional().isIn(['immediate', 'hourly', 'daily', 'weekly'])
], requirePermission('Notifications', 'edit'), async (req, res) => {
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

    // Mock updated preferences
    const updatedPreferences = {
      email: {
        enabled: updateData.email?.enabled !== undefined ? updateData.email.enabled : true,
        types: updateData.email?.types || ['payment', 'attendance', 'exam', 'system'],
        frequency: updateData.email?.frequency || 'immediate'
      },
      sms: {
        enabled: updateData.sms?.enabled !== undefined ? updateData.sms.enabled : false,
        types: updateData.sms?.types || ['payment', 'attendance'],
        frequency: updateData.sms?.frequency || 'daily'
      },
      push: {
        enabled: updateData.push?.enabled !== undefined ? updateData.push.enabled : true,
        types: updateData.push?.types || ['payment', 'attendance', 'exam', 'enrollment', 'system', 'communication'],
        frequency: updateData.push?.frequency || 'immediate'
      },
      inApp: {
        enabled: updateData.inApp?.enabled !== undefined ? updateData.inApp.enabled : true,
        types: updateData.inApp?.types || ['payment', 'attendance', 'exam', 'enrollment', 'system', 'communication', 'fee', 'academic'],
        frequency: updateData.inApp?.frequency || 'immediate'
      }
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Notification Preferences Updated', { 
      type: 'Notification', 
      action: 'Update Preferences',
      changes: updateData
    }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Notification preferences updated successfully',
      preferences: updatedPreferences
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      error: 'Failed to update notification preferences',
      message: 'An error occurred while updating notification preferences'
    });
  }
});

// Send test notification
router.post('/test', [
  body('type').isIn(['email', 'sms', 'push', 'inApp']),
  body('message').trim().isLength({ min: 5, max: 200 })
], requirePermission('Notifications', 'create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { type, message } = req.body;

    // Mock test notification
    const testNotification = {
      id: 'test-' + Date.now(),
      userId: req.user.id,
      title: 'Test Notification',
      message,
      type: 'system',
      priority: 'low',
      isRead: false,
      actionUrl: '',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Test Notification Sent', { 
      type: 'Notification', 
      action: 'Test',
      notificationType: type,
      message
    }, `Sent by ${req.user.name}`);

    res.json({
      message: `Test ${type} notification sent successfully`,
      notification: testNotification
    });

  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      error: 'Failed to send test notification',
      message: 'An error occurred while sending test notification'
    });
  }
});

module.exports = router; 