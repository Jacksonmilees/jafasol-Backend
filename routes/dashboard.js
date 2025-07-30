const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { requireRole, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const { Op } = require('sequelize');

const router = express.Router();

// Get main dashboard data
router.get('/', requirePermission('Dashboard', 'view'), async (req, res) => {
  try {
    // Mock dashboard data
    const dashboardData = {
      overview: {
        totalStudents: 450,
        totalTeachers: 25,
        totalClasses: 15,
        totalSubjects: 12,
        attendanceRate: 92.5,
        feeCollectionRate: 85.3,
        averageAcademicScore: 76.8
      },
      quickStats: [
        { title: 'New Enrollments', value: 15, change: '+12%', trend: 'up' },
        { title: 'Fee Collection', value: 'KES 2.4M', change: '+8%', trend: 'up' },
        { title: 'Attendance Rate', value: '92.5%', change: '+2%', trend: 'up' },
        { title: 'Academic Performance', value: '76.8%', change: '+5%', trend: 'up' }
      ],
      recentActivities: [
        { type: 'enrollment', message: 'New student enrolled: John Doe', time: '2 hours ago' },
        { type: 'payment', message: 'Fee payment received: KES 25,000', time: '3 hours ago' },
        { type: 'attendance', message: 'Attendance marked for Class 3A', time: '4 hours ago' },
        { type: 'exam', message: 'Exam results uploaded for Mathematics', time: '5 hours ago' },
        { type: 'communication', message: 'New message from Parent Portal', time: '6 hours ago' }
      ],
      upcomingEvents: [
        { title: 'Parent-Teacher Meeting', date: '2024-01-15', type: 'meeting' },
        { title: 'Sports Day', date: '2024-01-20', type: 'event' },
        { title: 'Mid-term Exams', date: '2024-01-25', type: 'exam' },
        { title: 'School Assembly', date: '2024-01-30', type: 'assembly' }
      ]
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Dashboard Accessed', { 
      type: 'Dashboard', 
      action: 'View'
    }, `Accessed by ${req.user.name}`);

    res.json({
      dashboard: dashboardData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load dashboard',
      message: 'An error occurred while loading dashboard data'
    });
  }
});

// Get analytics data
router.get('/analytics', [
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], requirePermission('Dashboard', 'view'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { period = 'monthly', startDate, endDate } = req.query;

    // Mock analytics data
    const analyticsData = {
      enrollmentTrend: [
        { period: 'Jan', value: 420, change: 0 },
        { period: 'Feb', value: 425, change: 1.2 },
        { period: 'Mar', value: 430, change: 1.2 },
        { period: 'Apr', value: 435, change: 1.2 },
        { period: 'May', value: 440, change: 1.1 },
        { period: 'Jun', value: 445, change: 1.1 },
        { period: 'Jul', value: 450, change: 1.1 }
      ],
      attendanceTrend: [
        { period: 'Jan', value: 89.5, change: 0 },
        { period: 'Feb', value: 90.2, change: 0.8 },
        { period: 'Mar', value: 91.1, change: 1.0 },
        { period: 'Apr', value: 91.8, change: 0.8 },
        { period: 'May', value: 92.3, change: 0.5 },
        { period: 'Jun', value: 92.5, change: 0.2 },
        { period: 'Jul', value: 92.8, change: 0.3 }
      ],
      academicPerformance: [
        { period: 'Jan', value: 72.5, change: 0 },
        { period: 'Feb', value: 73.8, change: 1.8 },
        { period: 'Mar', value: 74.2, change: 0.5 },
        { period: 'Apr', value: 75.1, change: 1.2 },
        { period: 'May', value: 76.3, change: 1.6 },
        { period: 'Jun', value: 76.8, change: 0.7 },
        { period: 'Jul', value: 77.2, change: 0.5 }
      ],
      feeCollection: [
        { period: 'Jan', value: 2.1, change: 0 },
        { period: 'Feb', value: 2.2, change: 4.8 },
        { period: 'Mar', value: 2.3, change: 4.5 },
        { period: 'Apr', value: 2.4, change: 4.3 },
        { period: 'May', value: 2.5, change: 4.2 },
        { period: 'Jun', value: 2.6, change: 4.0 },
        { period: 'Jul', value: 2.7, change: 3.8 }
      ]
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Analytics Accessed', { 
      type: 'Dashboard', 
      action: 'Analytics',
      filters: { period, startDate, endDate }
    }, `Accessed by ${req.user.name}`);

    res.json({
      analytics: analyticsData,
      filters: { period, startDate, endDate },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Failed to load analytics',
      message: 'An error occurred while loading analytics data'
    });
  }
});

// Get key performance indicators
router.get('/kpis', requirePermission('Dashboard', 'view'), async (req, res) => {
  try {
    // Mock KPI data
    const kpiData = {
      academic: {
        averageScore: 76.8,
        passRate: 85.3,
        improvementRate: 5.2,
        topPerformers: 45
      },
      attendance: {
        overallRate: 92.5,
        classAverage: 91.8,
        improvementRate: 2.1,
        perfectAttendance: 120
      },
      financial: {
        feeCollectionRate: 85.3,
        outstandingAmount: 150000,
        monthlyGrowth: 8.5,
        budgetUtilization: 78.2
      },
      operational: {
        teacherSatisfaction: 88.5,
        parentSatisfaction: 92.1,
        studentRetention: 95.8,
        facilityUtilization: 87.3
      }
    };

    // Create audit log
    await createAuditLog(req.user.id, 'KPIs Accessed', { 
      type: 'Dashboard', 
      action: 'KPIs'
    }, `Accessed by ${req.user.name}`);

    res.json({
      kpis: kpiData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('KPIs error:', error);
    res.status(500).json({
      error: 'Failed to load KPIs',
      message: 'An error occurred while loading KPI data'
    });
  }
});

// Get class performance overview
router.get('/class-performance', [
  query('classId').optional().isString()
], requirePermission('Dashboard', 'view'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { classId } = req.query;

    // Mock class performance data
    const classPerformanceData = {
      summary: {
        totalClasses: 15,
        averageClassSize: 30,
        overallPerformance: 76.8,
        averageAttendance: 92.5
      },
      classRankings: [
        { className: 'Class 3A', performance: 82.5, attendance: 95.2, size: 31, rank: 1 },
        { className: 'Class 2A', performance: 80.1, attendance: 93.8, size: 32, rank: 2 },
        { className: 'Class 3B', performance: 78.9, attendance: 92.5, size: 30, rank: 3 },
        { className: 'Class 2B', performance: 77.3, attendance: 91.7, size: 29, rank: 4 },
        { className: 'Class 1A', performance: 76.8, attendance: 90.5, size: 30, rank: 5 }
      ],
      subjectPerformance: [
        { subject: 'Mathematics', averageScore: 78.2, improvement: 4.5 },
        { subject: 'English', averageScore: 81.5, improvement: 3.2 },
        { subject: 'Science', averageScore: 79.8, improvement: 5.1 },
        { subject: 'History', averageScore: 83.1, improvement: 2.8 },
        { subject: 'Geography', averageScore: 77.5, improvement: 3.7 }
      ]
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Class Performance Accessed', { 
      type: 'Dashboard', 
      action: 'Class Performance',
      filters: { classId }
    }, `Accessed by ${req.user.name}`);

    res.json({
      performance: classPerformanceData,
      filters: { classId },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Class performance error:', error);
    res.status(500).json({
      error: 'Failed to load class performance',
      message: 'An error occurred while loading class performance data'
    });
  }
});

// Get notifications and alerts
router.get('/notifications', requirePermission('Dashboard', 'view'), async (req, res) => {
  try {
    // Mock notifications data
    const notificationsData = {
      alerts: [
        { type: 'warning', message: 'Low attendance in Class 2B', time: '1 hour ago' },
        { type: 'info', message: 'New fee payment received', time: '2 hours ago' },
        { type: 'success', message: 'Exam results uploaded successfully', time: '3 hours ago' },
        { type: 'warning', message: 'Outstanding fees reminder', time: '4 hours ago' }
      ],
      recentActivities: [
        { action: 'Student enrolled', details: 'John Doe - Class 3A', time: '30 minutes ago' },
        { action: 'Fee payment', details: 'KES 25,000 - Sarah Wilson', time: '1 hour ago' },
        { action: 'Attendance marked', details: 'Class 1A - 95% attendance', time: '2 hours ago' },
        { action: 'Exam uploaded', details: 'Mathematics - Mid-term', time: '3 hours ago' }
      ],
      upcomingReminders: [
        { type: 'exam', message: 'End-term exams starting next week', date: '2024-01-15' },
        { type: 'meeting', message: 'Parent-teacher meeting scheduled', date: '2024-01-20' },
        { type: 'payment', message: 'Fee payment deadline approaching', date: '2024-01-25' },
        { type: 'event', message: 'Sports day preparation needed', date: '2024-01-30' }
      ]
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Notifications Accessed', { 
      type: 'Dashboard', 
      action: 'Notifications'
    }, `Accessed by ${req.user.name}`);

    res.json({
      notifications: notificationsData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({
      error: 'Failed to load notifications',
      message: 'An error occurred while loading notifications'
    });
  }
});

// Get quick actions
router.get('/quick-actions', requirePermission('Dashboard', 'view'), async (req, res) => {
  try {
    // Mock quick actions data
    const quickActionsData = {
      actions: [
        { id: 'add-student', title: 'Add New Student', icon: 'user-plus', route: '/students/add' },
        { id: 'record-payment', title: 'Record Payment', icon: 'credit-card', route: '/fees/payments' },
        { id: 'mark-attendance', title: 'Mark Attendance', icon: 'check-square', route: '/attendance' },
        { id: 'upload-results', title: 'Upload Results', icon: 'file-text', route: '/exams/results' },
        { id: 'send-message', title: 'Send Message', icon: 'message-circle', route: '/communication' },
        { id: 'generate-report', title: 'Generate Report', icon: 'bar-chart', route: '/reports' }
      ],
      shortcuts: [
        { key: 'Ctrl+N', action: 'Add New Student' },
        { key: 'Ctrl+P', action: 'Record Payment' },
        { key: 'Ctrl+A', action: 'Mark Attendance' },
        { key: 'Ctrl+R', action: 'Generate Report' }
      ]
    };

    // Create audit log
    await createAuditLog(req.user.id, 'Quick Actions Accessed', { 
      type: 'Dashboard', 
      action: 'Quick Actions'
    }, `Accessed by ${req.user.name}`);

    res.json({
      quickActions: quickActionsData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Quick actions error:', error);
    res.status(500).json({
      error: 'Failed to load quick actions',
      message: 'An error occurred while loading quick actions'
    });
  }
});

// Get system status
router.get('/system-status', requirePermission('Dashboard', 'view'), async (req, res) => {
  try {
    // Mock system status data
    const systemStatusData = {
      database: { status: 'online', responseTime: '45ms' },
      fileStorage: { status: 'online', usedSpace: '2.5GB', totalSpace: '10GB' },
      emailService: { status: 'online', lastSent: '2 hours ago' },
      backupService: { status: 'online', lastBackup: '1 day ago' },
      uptime: '99.8%',
      lastMaintenance: '2024-01-01'
    };

    // Create audit log
    await createAuditLog(req.user.id, 'System Status Accessed', { 
      type: 'Dashboard', 
      action: 'System Status'
    }, `Accessed by ${req.user.name}`);

    res.json({
      systemStatus: systemStatusData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({
      error: 'Failed to load system status',
      message: 'An error occurred while loading system status'
    });
  }
});

module.exports = router; 