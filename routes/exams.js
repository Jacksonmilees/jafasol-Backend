const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const { requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const { Op } = require('sequelize');

const router = express.Router();

// Get all exams with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('type').optional().isIn(['CAT', 'Mid-Term', 'End-Term', 'Mock']),
  query('status').optional().isIn(['Upcoming', 'Ongoing', 'Completed'])
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
    const { search, type, status } = req.query;

    // Build where clause
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { term: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const { count, rows: exams } = await Exam.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['startDate', 'DESC']]
    });

    res.json({
      exams: exams.map(exam => ({
        id: exam.id,
        name: exam.name,
        type: exam.type,
        term: exam.term,
        startDate: exam.startDate,
        status: exam.status,
        subjects: exam.subjects,
        marksLocked: exam.marksLocked,
        createdAt: exam.createdAt
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({
      error: 'Failed to fetch exams',
      message: 'An error occurred while fetching exams'
    });
  }
});

// Get exam by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByPk(id);
    if (!exam) {
      return res.status(404).json({
        error: 'Exam not found',
        message: 'No exam found with the provided ID'
      });
    }

    res.json({
      exam: {
        id: exam.id,
        name: exam.name,
        type: exam.type,
        term: exam.term,
        startDate: exam.startDate,
        status: exam.status,
        subjects: exam.subjects,
        marksLocked: exam.marksLocked,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt
      }
    });

  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({
      error: 'Failed to fetch exam',
      message: 'An error occurred while fetching exam'
    });
  }
});

// Create new exam
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('type').isIn(['CAT', 'Mid-Term', 'End-Term', 'Mock']),
  body('term').isString(),
  body('startDate').isISO8601().toDate(),
  body('status').optional().isIn(['Upcoming', 'Ongoing', 'Completed']),
  body('subjects').isArray({ min: 1 })
], requirePermission('Exams', 'create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { name, type, term, startDate, status = 'Upcoming', subjects } = req.body;

    // Create exam
    const exam = await Exam.create({
      name,
      type,
      term,
      startDate,
      status,
      subjects
    });

    // Create audit log
    await createAuditLog(req.user.id, 'Exam Created', { type: 'Exam', id: exam.id, name: exam.name }, `Created by ${req.user.name}`);

    res.status(201).json({
      message: 'Exam created successfully',
      exam: {
        id: exam.id,
        name: exam.name,
        type: exam.type,
        term: exam.term,
        startDate: exam.startDate,
        status: exam.status,
        subjects: exam.subjects,
        createdAt: exam.createdAt
      }
    });

  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      error: 'Failed to create exam',
      message: 'An error occurred while creating exam'
    });
  }
});

// Update exam
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('type').optional().isIn(['CAT', 'Mid-Term', 'End-Term', 'Mock']),
  body('term').optional().isString(),
  body('startDate').optional().isISO8601().toDate(),
  body('status').optional().isIn(['Upcoming', 'Ongoing', 'Completed']),
  body('subjects').optional().isArray({ min: 1 })
], requirePermission('Exams', 'edit'), async (req, res) => {
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

    const exam = await Exam.findByPk(id);
    if (!exam) {
      return res.status(404).json({
        error: 'Exam not found',
        message: 'No exam found with the provided ID'
      });
    }

    await exam.update(updateData);

    // Create audit log
    await createAuditLog(req.user.id, 'Exam Updated', { type: 'Exam', id: exam.id, name: exam.name }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Exam updated successfully',
      exam: {
        id: exam.id,
        name: exam.name,
        type: exam.type,
        term: exam.term,
        startDate: exam.startDate,
        status: exam.status,
        subjects: exam.subjects,
        updatedAt: exam.updatedAt
      }
    });

  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({
      error: 'Failed to update exam',
      message: 'An error occurred while updating exam'
    });
  }
});

// Delete exam
router.delete('/:id', requirePermission('Exams', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByPk(id);
    if (!exam) {
      return res.status(404).json({
        error: 'Exam not found',
        message: 'No exam found with the provided ID'
      });
    }

    // Create audit log before deletion
    await createAuditLog(req.user.id, 'Exam Deleted', { type: 'Exam', id: exam.id, name: exam.name }, `Deleted by ${req.user.name}`);

    await exam.destroy();

    res.json({
      message: 'Exam deleted successfully'
    });

  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      error: 'Failed to delete exam',
      message: 'An error occurred while deleting exam'
    });
  }
});

// Lock exam marks
router.post('/:id/lock-marks', requirePermission('Exams', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByPk(id);
    if (!exam) {
      return res.status(404).json({
        error: 'Exam not found',
        message: 'No exam found with the provided ID'
      });
    }

    await exam.update({ marksLocked: true });

    // Create audit log
    await createAuditLog(req.user.id, 'Exam Marks Locked', { type: 'Exam', id: exam.id, name: exam.name }, `Locked by ${req.user.name}`);

    res.json({
      message: 'Exam marks locked successfully'
    });

  } catch (error) {
    console.error('Lock exam marks error:', error);
    res.status(500).json({
      error: 'Failed to lock exam marks',
      message: 'An error occurred while locking exam marks'
    });
  }
});

// Unlock exam marks
router.post('/:id/unlock-marks', requirePermission('Exams', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByPk(id);
    if (!exam) {
      return res.status(404).json({
        error: 'Exam not found',
        message: 'No exam found with the provided ID'
      });
    }

    await exam.update({ marksLocked: false });

    // Create audit log
    await createAuditLog(req.user.id, 'Exam Marks Unlocked', { type: 'Exam', id: exam.id, name: exam.name }, `Unlocked by ${req.user.name}`);

    res.json({
      message: 'Exam marks unlocked successfully'
    });

  } catch (error) {
    console.error('Unlock exam marks error:', error);
    res.status(500).json({
      error: 'Failed to unlock exam marks',
      message: 'An error occurred while unlocking exam marks'
    });
  }
});

// Get exam results
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByPk(id);
    if (!exam) {
      return res.status(404).json({
        error: 'Exam not found',
        message: 'No exam found with the provided ID'
      });
    }

    // Get all students with their exam results
    const students = await Student.findAll({
      where: { status: 'Active' },
      attributes: ['id', 'firstName', 'lastName', 'admissionNumber', 'formClass', 'stream', 'examResults']
    });

    const results = students.map(student => {
      const examResult = student.examResults?.[id];
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        formClass: student.formClass,
        stream: student.stream,
        results: examResult?.results || {},
        comment: examResult?.comment || '',
        totalScore: examResult ? Object.values(examResult.results).reduce((sum, score) => sum + (score || 0), 0) : 0,
        averageScore: examResult ? Object.values(examResult.results).filter(score => score !== null).length > 0 
          ? Object.values(examResult.results).filter(score => score !== null).reduce((sum, score) => sum + score, 0) / Object.values(examResult.results).filter(score => score !== null).length 
          : 0 : 0
      };
    });

    res.json({
      exam: {
        id: exam.id,
        name: exam.name,
        type: exam.type,
        term: exam.term,
        subjects: exam.subjects,
        marksLocked: exam.marksLocked
      },
      results
    });

  } catch (error) {
    console.error('Get exam results error:', error);
    res.status(500).json({
      error: 'Failed to fetch exam results',
      message: 'An error occurred while fetching exam results'
    });
  }
});

// Submit exam results
router.post('/:id/results', [
  body('studentId').isUUID(),
  body('results').isObject(),
  body('comment').optional().isString()
], requirePermission('Exams', 'edit'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { id: examId } = req.params;
    const { studentId, results, comment } = req.body;

    const exam = await Exam.findByPk(examId);
    if (!exam) {
      return res.status(404).json({
        error: 'Exam not found',
        message: 'No exam found with the provided ID'
      });
    }

    if (exam.marksLocked) {
      return res.status(403).json({
        error: 'Marks locked',
        message: 'Cannot submit results for an exam with locked marks'
      });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'No student found with the provided ID'
      });
    }

    // Update student's exam results
    const currentResults = student.examResults || {};
    currentResults[examId] = {
      results,
      comment,
      submittedAt: new Date().toISOString(),
      submittedBy: req.user.id
    };

    await student.update({ examResults: currentResults });

    // Create audit log
    await createAuditLog(req.user.id, 'Exam Results Submitted', { type: 'Exam', id: examId, name: exam.name }, `Results submitted for student ${student.firstName} ${student.lastName} by ${req.user.name}`);

    res.json({
      message: 'Exam results submitted successfully'
    });

  } catch (error) {
    console.error('Submit exam results error:', error);
    res.status(500).json({
      error: 'Failed to submit exam results',
      message: 'An error occurred while submitting exam results'
    });
  }
});

// Update exam results
router.put('/:id/results', [
  body('studentId').isUUID(),
  body('results').isObject(),
  body('comment').optional().isString()
], requirePermission('Exams', 'edit'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { id: examId } = req.params;
    const { studentId, results, comment } = req.body;

    const exam = await Exam.findByPk(examId);
    if (!exam) {
      return res.status(404).json({
        error: 'Exam not found',
        message: 'No exam found with the provided ID'
      });
    }

    if (exam.marksLocked) {
      return res.status(403).json({
        error: 'Marks locked',
        message: 'Cannot update results for an exam with locked marks'
      });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'No student found with the provided ID'
      });
    }

    // Update student's exam results
    const currentResults = student.examResults || {};
    currentResults[examId] = {
      results,
      comment,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    };

    await student.update({ examResults: currentResults });

    // Create audit log
    await createAuditLog(req.user.id, 'Exam Results Updated', { type: 'Exam', id: examId, name: exam.name }, `Results updated for student ${student.firstName} ${student.lastName} by ${req.user.name}`);

    res.json({
      message: 'Exam results updated successfully'
    });

  } catch (error) {
    console.error('Update exam results error:', error);
    res.status(500).json({
      error: 'Failed to update exam results',
      message: 'An error occurred while updating exam results'
    });
  }
});

// Bulk upload exam results
router.post('/:id/results/bulk-upload', requirePermission('Exams', 'edit'), async (req, res) => {
  try {
    const { id: examId } = req.params;
    const { results } = req.body;

    const exam = await Exam.findByPk(examId);
    if (!exam) {
      return res.status(404).json({
        error: 'Exam not found',
        message: 'No exam found with the provided ID'
      });
    }

    if (exam.marksLocked) {
      return res.status(403).json({
        error: 'Marks locked',
        message: 'Cannot upload results for an exam with locked marks'
      });
    }

    if (!Array.isArray(results)) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'Results must be an array'
      });
    }

    let updatedCount = 0;
    const errors = [];

    for (const result of results) {
      try {
        const { studentId, results: studentResults, comment } = result;

        const student = await Student.findByPk(studentId);
        if (!student) {
          errors.push({
            studentId,
            error: 'Student not found'
          });
          continue;
        }

        // Update student's exam results
        const currentResults = student.examResults || {};
        currentResults[examId] = {
          results: studentResults,
          comment,
          submittedAt: new Date().toISOString(),
          submittedBy: req.user.id
        };

        await student.update({ examResults: currentResults });
        updatedCount++;

      } catch (error) {
        errors.push({
          studentId: result.studentId,
          error: error.message
        });
      }
    }

    // Create audit log
    await createAuditLog(req.user.id, 'Bulk Upload Exam Results', { type: 'Exam', id: examId, name: exam.name }, `Bulk uploaded ${updatedCount} results by ${req.user.name}`);

    res.json({
      message: 'Bulk upload completed',
      summary: {
        total: results.length,
        updated: updatedCount,
        errors: errors.length
      },
      errors
    });

  } catch (error) {
    console.error('Bulk upload exam results error:', error);
    res.status(500).json({
      error: 'Failed to bulk upload exam results',
      message: 'An error occurred while bulk uploading exam results'
    });
  }
});

// Export exam results
router.get('/:id/results/export', async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByPk(id);
    if (!exam) {
      return res.status(404).json({
        error: 'Exam not found',
        message: 'No exam found with the provided ID'
      });
    }

    // Get all students with their exam results
    const students = await Student.findAll({
      where: { status: 'Active' },
      attributes: ['id', 'firstName', 'lastName', 'admissionNumber', 'formClass', 'stream', 'examResults']
    });

    const results = students.map(student => {
      const examResult = student.examResults?.[id];
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        formClass: student.formClass,
        stream: student.stream,
        results: examResult?.results || {},
        comment: examResult?.comment || '',
        totalScore: examResult ? Object.values(examResult.results).reduce((sum, score) => sum + (score || 0), 0) : 0,
        averageScore: examResult ? Object.values(examResult.results).filter(score => score !== null).length > 0 
          ? Object.values(examResult.results).filter(score => score !== null).reduce((sum, score) => sum + score, 0) / Object.values(examResult.results).filter(score => score !== null).length 
          : 0 : 0
      };
    });

    // In a real application, you would generate a CSV or Excel file here
    res.json({
      exam: {
        id: exam.id,
        name: exam.name,
        type: exam.type,
        term: exam.term,
        subjects: exam.subjects
      },
      results,
      exportUrl: `/api/exams/${id}/results/export/file` // Mock export URL
    });

  } catch (error) {
    console.error('Export exam results error:', error);
    res.status(500).json({
      error: 'Failed to export exam results',
      message: 'An error occurred while exporting exam results'
    });
  }
});

module.exports = router; 