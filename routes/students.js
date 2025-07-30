const express = require('express');
const { body, validationResult, query } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Student = require('../models/Student');
const User = require('../models/User');
const { requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const { Op } = require('sequelize');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Get all students with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('formClass').optional().isString(),
  query('stream').optional().isString(),
  query('status').optional().isIn(['Active', 'Inactive'])
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
    const { search, formClass, stream, status } = req.query;

    // Build where clause
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { admissionNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (formClass) whereClause.formClass = formClass;
    if (stream) whereClause.stream = stream;
    if (status) whereClause.status = status;

    const { count, rows: students } = await Student.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      students: students.map(student => ({
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        formClass: student.formClass,
        stream: student.stream,
        status: student.status,
        enrollmentDate: student.enrollmentDate,
        avatarUrl: student.avatarUrl,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        isRegistered: student.isRegistered,
        createdAt: student.createdAt
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      error: 'Failed to fetch students',
      message: 'An error occurred while fetching students'
    });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'No student found with the provided ID'
      });
    }

    res.json({
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        formClass: student.formClass,
        stream: student.stream,
        status: student.status,
        enrollmentDate: student.enrollmentDate,
        avatarUrl: student.avatarUrl,
        examResults: student.examResults,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        guardianEmail: student.guardianEmail,
        address: student.address,
        emergencyContact: student.emergencyContact,
        medicalConditions: student.medicalConditions,
        isRegistered: student.isRegistered,
        registrationDate: student.registrationDate,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      }
    });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      error: 'Failed to fetch student',
      message: 'An error occurred while fetching student'
    });
  }
});

// Create new student
router.post('/', [
  body('admissionNumber').isString().isLength({ min: 1 }),
  body('firstName').trim().isLength({ min: 1, max: 50 }),
  body('lastName').trim().isLength({ min: 1, max: 50 }),
  body('dateOfBirth').isISO8601().toDate(),
  body('gender').isIn(['Male', 'Female']),
  body('formClass').isString(),
  body('stream').isString(),
  body('enrollmentDate').isISO8601().toDate(),
  body('guardianName').optional().isString(),
  body('guardianPhone').optional().isMobilePhone('any'),
  body('guardianEmail').optional().isEmail(),
  body('address').optional().isString(),
  body('emergencyContact').optional().isString(),
  body('medicalConditions').optional().isString()
], requirePermission('Students', 'create'), async (req, res) => {
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
      admissionNumber,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      formClass,
      stream,
      enrollmentDate,
      guardianName,
      guardianPhone,
      guardianEmail,
      address,
      emergencyContact,
      medicalConditions
    } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ where: { admissionNumber } });
    if (existingStudent) {
      return res.status(409).json({
        error: 'Student already exists',
        message: 'A student with this admission number already exists'
      });
    }

    // Create student
    const student = await Student.create({
      admissionNumber,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      formClass,
      stream,
      enrollmentDate,
      guardianName,
      guardianPhone,
      guardianEmail,
      address,
      emergencyContact,
      medicalConditions
    });

    // Create audit log
    await createAuditLog(req.user.id, 'Student Created', { type: 'Student', id: student.id, name: `${student.firstName} ${student.lastName}` }, `Created by ${req.user.name}`);

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        formClass: student.formClass,
        stream: student.stream,
        status: student.status,
        createdAt: student.createdAt
      }
    });

  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      error: 'Failed to create student',
      message: 'An error occurred while creating student'
    });
  }
});

// Update student
router.put('/:id', [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('dateOfBirth').optional().isISO8601().toDate(),
  body('gender').optional().isIn(['Male', 'Female']),
  body('formClass').optional().isString(),
  body('stream').optional().isString(),
  body('status').optional().isIn(['Active', 'Inactive']),
  body('guardianName').optional().isString(),
  body('guardianPhone').optional().isMobilePhone('any'),
  body('guardianEmail').optional().isEmail(),
  body('address').optional().isString(),
  body('emergencyContact').optional().isString(),
  body('medicalConditions').optional().isString()
], requirePermission('Students', 'edit'), async (req, res) => {
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

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'No student found with the provided ID'
      });
    }

    await student.update(updateData);

    // Create audit log
    await createAuditLog(req.user.id, 'Student Updated', { type: 'Student', id: student.id, name: `${student.firstName} ${student.lastName}` }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Student updated successfully',
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        formClass: student.formClass,
        stream: student.stream,
        status: student.status,
        updatedAt: student.updatedAt
      }
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      error: 'Failed to update student',
      message: 'An error occurred while updating student'
    });
  }
});

// Delete student
router.delete('/:id', requirePermission('Students', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'No student found with the provided ID'
      });
    }

    // Create audit log before deletion
    await createAuditLog(req.user.id, 'Student Deleted', { type: 'Student', id: student.id, name: `${student.firstName} ${student.lastName}` }, `Deleted by ${req.user.name}`);

    await student.destroy();

    res.json({
      message: 'Student deleted successfully'
    });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      error: 'Failed to delete student',
      message: 'An error occurred while deleting student'
    });
  }
});

// Bulk upload students
router.post('/bulk-upload', upload.single('file'), requirePermission('Students', 'create'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a CSV file'
      });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const createdStudents = [];
          const skippedStudents = [];

          for (const row of results) {
            try {
              // Validate required fields
              if (!row.admissionNumber || !row.firstName || !row.lastName || !row.dateOfBirth || !row.gender || !row.formClass || !row.stream) {
                errors.push({
                  row: row,
                  error: 'Missing required fields'
                });
                continue;
              }

              // Check if student already exists
              const existingStudent = await Student.findOne({ where: { admissionNumber: row.admissionNumber } });
              if (existingStudent) {
                skippedStudents.push({
                  admissionNumber: row.admissionNumber,
                  reason: 'Student already exists'
                });
                continue;
              }

              // Create student
              const student = await Student.create({
                admissionNumber: row.admissionNumber,
                firstName: row.firstName,
                lastName: row.lastName,
                dateOfBirth: row.dateOfBirth,
                gender: row.gender,
                formClass: row.formClass,
                stream: row.stream,
                enrollmentDate: row.enrollmentDate || new Date(),
                guardianName: row.guardianName,
                guardianPhone: row.guardianPhone,
                guardianEmail: row.guardianEmail,
                address: row.address,
                emergencyContact: row.emergencyContact,
                medicalConditions: row.medicalConditions
              });

              createdStudents.push({
                id: student.id,
                admissionNumber: student.admissionNumber,
                name: `${student.firstName} ${student.lastName}`
              });

            } catch (error) {
              errors.push({
                row: row,
                error: error.message
              });
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          // Create audit log
          await createAuditLog(req.user.id, 'Bulk Upload', { type: 'Student', name: 'Bulk Upload' }, `Uploaded ${createdStudents.length} students by ${req.user.name}`);

          res.json({
            message: 'Bulk upload completed',
            summary: {
              total: results.length,
              created: createdStudents.length,
              skipped: skippedStudents.length,
              errors: errors.length
            },
            createdStudents,
            skippedStudents,
            errors
          });

        } catch (error) {
          console.error('Bulk upload processing error:', error);
          res.status(500).json({
            error: 'Bulk upload failed',
            message: 'An error occurred during bulk upload processing'
          });
        }
      });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      error: 'Bulk upload failed',
      message: 'An error occurred during bulk upload'
    });
  }
});

// Get student portal data
router.get('/:id/portal', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'No student found with the provided ID'
      });
    }

    // In a real application, you would fetch additional data from other tables
    // For now, we'll return the student data with some mock portal information
    res.json({
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        formClass: student.formClass,
        stream: student.stream,
        status: student.status,
        avatarUrl: student.avatarUrl,
        examResults: student.examResults,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone
      },
      portalData: {
        // Mock data - in real app, fetch from actual tables
        recentAttendance: [],
        upcomingExams: [],
        feeBalance: 0,
        recentResults: []
      }
    });

  } catch (error) {
    console.error('Get student portal error:', error);
    res.status(500).json({
      error: 'Failed to fetch student portal data',
      message: 'An error occurred while fetching portal data'
    });
  }
});

// Get student exam results
router.get('/:id/exam-results', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'No student found with the provided ID'
      });
    }

    res.json({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      examResults: student.examResults || {}
    });

  } catch (error) {
    console.error('Get student exam results error:', error);
    res.status(500).json({
      error: 'Failed to fetch exam results',
      message: 'An error occurred while fetching exam results'
    });
  }
});

// Get student fee statement
router.get('/:id/fee-statement', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'No student found with the provided ID'
      });
    }

    // Mock fee statement - in real app, fetch from fee tables
    res.json({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      feeStatement: {
        totalFees: 0,
        paidAmount: 0,
        balance: 0,
        invoices: [],
        payments: []
      }
    });

  } catch (error) {
    console.error('Get student fee statement error:', error);
    res.status(500).json({
      error: 'Failed to fetch fee statement',
      message: 'An error occurred while fetching fee statement'
    });
  }
});

// Get student timetable
router.get('/:id/timetable', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'No student found with the provided ID'
      });
    }

    // Mock timetable - in real app, fetch from timetable tables
    res.json({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      formClass: student.formClass,
      timetable: []
    });

  } catch (error) {
    console.error('Get student timetable error:', error);
    res.status(500).json({
      error: 'Failed to fetch timetable',
      message: 'An error occurred while fetching timetable'
    });
  }
});

module.exports = router; 