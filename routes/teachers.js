const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Teacher = require('../models/Teacher');
const { requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const { Op } = require('sequelize');

const router = express.Router();

// Get all teachers with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('status').optional().isIn(['Active', 'On-leave', 'Terminated'])
], async (req, res) => {
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
    const { search, status } = req.query;

    // Build where clause
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: teachers } = await Teacher.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      teachers: teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        avatarUrl: teacher.avatarUrl,
        subjects: teacher.subjects,
        classes: teacher.classes,
        status: teacher.status,
        phoneNumber: teacher.phoneNumber,
        createdAt: teacher.createdAt
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      error: 'Failed to fetch teachers',
      message: 'An error occurred while fetching teachers'
    });
  }
});

// Get teacher by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({
        error: 'Teacher not found',
        message: 'No teacher found with the provided ID'
      });
    }

    res.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        avatarUrl: teacher.avatarUrl,
        subjects: teacher.subjects,
        classes: teacher.classes,
        status: teacher.status,
        phoneNumber: teacher.phoneNumber,
        address: teacher.address,
        dateOfBirth: teacher.dateOfBirth,
        hireDate: teacher.hireDate,
        qualification: teacher.qualification,
        specialization: teacher.specialization,
        emergencyContact: teacher.emergencyContact,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt
      }
    });

  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({
      error: 'Failed to fetch teacher',
      message: 'An error occurred while fetching teacher'
    });
  }
});

// Create new teacher
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('subjects').optional().isArray(),
  body('classes').optional().isArray(),
  body('status').optional().isIn(['Active', 'On-leave', 'Terminated']),
  body('phoneNumber').optional().isMobilePhone('any'),
  body('address').optional().isString(),
  body('dateOfBirth').optional().isISO8601().toDate(),
  body('hireDate').optional().isISO8601().toDate(),
  body('qualification').optional().isString(),
  body('specialization').optional().isString(),
  body('emergencyContact').optional().isString()
], requirePermission('Teachers', 'create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const {
      name,
      email,
      subjects = [],
      classes = [],
      status = 'Active',
      phoneNumber,
      address,
      dateOfBirth,
      hireDate,
      qualification,
      specialization,
      emergencyContact
    } = req.body;

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ where: { email } });
    if (existingTeacher) {
      return res.status(409).json({
        error: 'Teacher already exists',
        message: 'A teacher with this email already exists'
      });
    }

    // Create teacher
    const teacher = await Teacher.create({
      name,
      email,
      subjects,
      classes,
      status,
      phoneNumber,
      address,
      dateOfBirth,
      hireDate,
      qualification,
      specialization,
      emergencyContact
    });

    // Create audit log
    await createAuditLog(req.user.id, 'Teacher Created', { type: 'Teacher', id: teacher.id, name: teacher.name }, `Created by ${req.user.name}`);

    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        subjects: teacher.subjects,
        classes: teacher.classes,
        status: teacher.status,
        createdAt: teacher.createdAt
      }
    });

  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      error: 'Failed to create teacher',
      message: 'An error occurred while creating teacher'
    });
  }
});

// Update teacher
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('subjects').optional().isArray(),
  body('classes').optional().isArray(),
  body('status').optional().isIn(['Active', 'On-leave', 'Terminated']),
  body('phoneNumber').optional().isMobilePhone('any'),
  body('address').optional().isString(),
  body('dateOfBirth').optional().isISO8601().toDate(),
  body('hireDate').optional().isISO8601().toDate(),
  body('qualification').optional().isString(),
  body('specialization').optional().isString(),
  body('emergencyContact').optional().isString()
], requirePermission('Teachers', 'edit'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({
        error: 'Teacher not found',
        message: 'No teacher found with the provided ID'
      });
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== teacher.email) {
      const existingTeacher = await Teacher.findOne({ where: { email: updateData.email } });
      if (existingTeacher) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'A teacher with this email already exists'
        });
      }
    }

    await teacher.update(updateData);

    // Create audit log
    await createAuditLog(req.user.id, 'Teacher Updated', { type: 'Teacher', id: teacher.id, name: teacher.name }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Teacher updated successfully',
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        subjects: teacher.subjects,
        classes: teacher.classes,
        status: teacher.status,
        updatedAt: teacher.updatedAt
      }
    });

  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      error: 'Failed to update teacher',
      message: 'An error occurred while updating teacher'
    });
  }
});

// Delete teacher
router.delete('/:id', requirePermission('Teachers', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({
        error: 'Teacher not found',
        message: 'No teacher found with the provided ID'
      });
    }

    // Create audit log before deletion
    await createAuditLog(req.user.id, 'Teacher Deleted', { type: 'Teacher', id: teacher.id, name: teacher.name }, `Deleted by ${req.user.name}`);

    await teacher.destroy();

    res.json({
      message: 'Teacher deleted successfully'
    });

  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      error: 'Failed to delete teacher',
      message: 'An error occurred while deleting teacher'
    });
  }
});

// Get teacher dashboard data
router.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({
        error: 'Teacher not found',
        message: 'No teacher found with the provided ID'
      });
    }

    // Mock dashboard data - in real app, fetch from actual tables
    res.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        subjects: teacher.subjects,
        classes: teacher.classes,
        status: teacher.status
      },
      dashboardData: {
        totalStudents: 0,
        totalClasses: teacher.classes.length,
        totalSubjects: teacher.subjects.length,
        recentAttendance: [],
        upcomingExams: [],
        recentResults: []
      }
    });

  } catch (error) {
    console.error('Get teacher dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch teacher dashboard',
      message: 'An error occurred while fetching dashboard data'
    });
  }
});

// Get teacher's assigned classes
router.get('/:id/classes', async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({
        error: 'Teacher not found',
        message: 'No teacher found with the provided ID'
      });
    }

    // Mock class data - in real app, fetch from actual class tables
    res.json({
      teacherId: teacher.id,
      teacherName: teacher.name,
      classes: teacher.classes.map(className => ({
        name: className,
        students: 0,
        subjects: teacher.subjects
      }))
    });

  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({
      error: 'Failed to fetch teacher classes',
      message: 'An error occurred while fetching classes'
    });
  }
});

// Get teacher's assigned subjects
router.get('/:id/subjects', async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({
        error: 'Teacher not found',
        message: 'No teacher found with the provided ID'
      });
    }

    res.json({
      teacherId: teacher.id,
      teacherName: teacher.name,
      subjects: teacher.subjects
    });

  } catch (error) {
    console.error('Get teacher subjects error:', error);
    res.status(500).json({
      error: 'Failed to fetch teacher subjects',
      message: 'An error occurred while fetching subjects'
    });
  }
});

module.exports = router; 