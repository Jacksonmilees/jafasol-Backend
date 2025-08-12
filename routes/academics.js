const express = require('express');
const { body, validationResult, query } = require('express-validator');
const SchoolClass = require('../models/SchoolClass');
const Subject = require('../models/Subject');
const { requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

const router = express.Router();

// ==================== CLASSES ====================

// Get all classes
router.get('/classes', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('formLevel').optional().isInt({ min: 1, max: 4 }),
  query('stream').optional().isString()
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
    const { search, formLevel, stream } = req.query;

    // Build filter query
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { teacher: { $regex: search, $options: 'i' } }
      ];
    }
    if (formLevel) filter.formLevel = formLevel;
    if (stream) filter.stream = stream;

    const [classes, count] = await Promise.all([
      SchoolClass.find(filter)
        .sort({ formLevel: 1, stream: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      SchoolClass.countDocuments(filter)
    ]);

    res.json({
      classes: classes.map(cls => ({
        id: cls._id,
        name: cls.name,
        formLevel: cls.formLevel,
        stream: cls.stream,
        teacher: cls.teacher,
        students: cls.students,
        classTeacherId: cls.classTeacherId,
        capacity: cls.capacity,
        academicYear: cls.academicYear,
        status: cls.status,
        createdAt: cls.createdAt
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      error: 'Failed to fetch classes',
      message: 'An error occurred while fetching classes'
    });
  }
});

// Get class by ID
router.get('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const schoolClass = await SchoolClass.findById(id);
    if (!schoolClass) {
      return res.status(404).json({
        error: 'Class not found',
        message: 'No class found with the provided ID'
      });
    }

    res.json({
      class: {
        id: schoolClass._id,
        name: schoolClass.name,
        formLevel: schoolClass.formLevel,
        stream: schoolClass.stream,
        teacher: schoolClass.teacher,
        students: schoolClass.students,
        classTeacherId: schoolClass.classTeacherId,
        createdAt: schoolClass.createdAt,
        updatedAt: schoolClass.updatedAt
      }
    });

  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      error: 'Failed to fetch class',
      message: 'An error occurred while fetching class'
    });
  }
});

// Create new class
router.post('/classes', [
  body('name').trim().isLength({ min: 1, max: 50 }),
  body('formLevel').isInt({ min: 1, max: 4 }),
  body('stream').isString(),
  body('teacher').optional().isString(),
  body('students').optional().isInt({ min: 0 }),
  body('classTeacherId').optional().isUUID()
], requirePermission('Academics', 'create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { name, formLevel, stream, teacher, students = 0, classTeacherId } = req.body;

    // Check if class already exists
    const existingClass = await SchoolClass.findOne({ name });
    if (existingClass) {
      return res.status(409).json({
        error: 'Class already exists',
        message: 'A class with this name already exists'
      });
    }

    // Create class
    const schoolClass = new SchoolClass({
      name,
      formLevel,
      stream,
      teacher,
      students,
      classTeacherId
    });
    await schoolClass.save();

    // Create audit log
    await createAuditLog(req.user.id, 'Class Created', { type: 'Class', id: schoolClass._id, name: schoolClass.name }, `Created by ${req.user.name}`);

    res.status(201).json({
      message: 'Class created successfully',
      class: {
        id: schoolClass._id,
        name: schoolClass.name,
        formLevel: schoolClass.formLevel,
        stream: schoolClass.stream,
        teacher: schoolClass.teacher,
        students: schoolClass.students,
        createdAt: schoolClass.createdAt
      }
    });

  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      error: 'Failed to create class',
      message: 'An error occurred while creating class'
    });
  }
});

// Update class
router.put('/classes/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 50 }),
  body('formLevel').optional().isInt({ min: 1, max: 4 }),
  body('stream').optional().isString(),
  body('teacher').optional().isString(),
  body('students').optional().isInt({ min: 0 }),
  body('classTeacherId').optional().isUUID()
], requirePermission('Academics', 'edit'), async (req, res) => {
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

    const schoolClass = await SchoolClass.findById(id);
    if (!schoolClass) {
      return res.status(404).json({
        error: 'Class not found',
        message: 'No class found with the provided ID'
      });
    }

    // Check if name is being changed and if it already exists
    if (updateData.name && updateData.name !== schoolClass.name) {
      const existingClass = await SchoolClass.findOne({ name: updateData.name, _id: { $ne: id } });
      if (existingClass) {
        return res.status(409).json({
          error: 'Class name already exists',
          message: 'A class with this name already exists'
        });
      }
    }

    Object.assign(schoolClass, updateData);
    await schoolClass.save();

    // Create audit log
    await createAuditLog(req.user.id, 'Class Updated', { type: 'Class', id: schoolClass._id, name: schoolClass.name }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Class updated successfully',
      class: {
        id: schoolClass._id,
        name: schoolClass.name,
        formLevel: schoolClass.formLevel,
        stream: schoolClass.stream,
        teacher: schoolClass.teacher,
        students: schoolClass.students,
        updatedAt: schoolClass.updatedAt
      }
    });

  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      error: 'Failed to update class',
      message: 'An error occurred while updating class'
    });
  }
});

// Delete class
router.delete('/classes/:id', requirePermission('Academics', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const schoolClass = await SchoolClass.findById(id);
    if (!schoolClass) {
      return res.status(404).json({
        error: 'Class not found',
        message: 'No class found with the provided ID'
      });
    }

    // Create audit log before deletion
    await createAuditLog(req.user.id, 'Class Deleted', { type: 'Class', id: schoolClass._id, name: schoolClass.name }, `Deleted by ${req.user.name}`);

    await schoolClass.deleteOne();

    res.json({
      message: 'Class deleted successfully'
    });

  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      error: 'Failed to delete class',
      message: 'An error occurred while deleting class'
    });
  }
});

// ==================== SUBJECTS ====================

// Get all subjects
router.get('/subjects', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('curriculum').optional().isIn(['8-4-4', 'International']),
  query('formLevel').optional().isInt({ min: 1, max: 4 })
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
    const { search, curriculum, formLevel } = req.query;

    // Build filter query
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    if (curriculum) filter.curriculum = curriculum;
    if (formLevel) {
      filter.formLevels = formLevel;
    }

    const [subjects, count] = await Promise.all([
      Subject.find(filter)
        .sort({ name: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Subject.countDocuments(filter)
    ]);

    res.json({
      subjects: subjects.map(subject => ({
        id: subject._id,
        name: subject.name,
        code: subject.code,
        curriculum: subject.curriculum,
        formLevels: subject.formLevels,
        createdAt: subject.createdAt
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      error: 'Failed to fetch subjects',
      message: 'An error occurred while fetching subjects'
    });
  }
});

// Get subject by ID
router.get('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        error: 'Subject not found',
        message: 'No subject found with the provided ID'
      });
    }

    res.json({
      subject: {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        curriculum: subject.curriculum,
        formLevels: subject.formLevels,
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt
      }
    });

  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({
      error: 'Failed to fetch subject',
      message: 'An error occurred while fetching subject'
    });
  }
});

// Create new subject
router.post('/subjects', [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('code').isString().isLength({ min: 1, max: 10 }),
  body('curriculum').isIn(['8-4-4', 'International']),
  body('formLevels').isArray({ min: 1 })
], requirePermission('Academics', 'create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { name, code, curriculum, formLevels } = req.body;

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ 
      $or: [
        { name },
        { code }
      ]
    });
    if (existingSubject) {
      return res.status(409).json({
        error: 'Subject already exists',
        message: 'A subject with this name or code already exists'
      });
    }

    // Create subject
    const subject = new Subject({
      name,
      code,
      curriculum,
      formLevels
    });
    await subject.save();

    // Create audit log
    await createAuditLog(req.user.id, 'Subject Created', { type: 'Subject', id: subject._id, name: subject.name }, `Created by ${req.user.name}`);

    res.status(201).json({
      message: 'Subject created successfully',
      subject: {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        curriculum: subject.curriculum,
        formLevels: subject.formLevels,
        createdAt: subject.createdAt
      }
    });

  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      error: 'Failed to create subject',
      message: 'An error occurred while creating subject'
    });
  }
});

// Update subject
router.put('/subjects/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('code').optional().isString().isLength({ min: 1, max: 10 }),
  body('curriculum').optional().isIn(['8-4-4', 'International']),
  body('formLevels').optional().isArray({ min: 1 })
], requirePermission('Academics', 'edit'), async (req, res) => {
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

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        error: 'Subject not found',
        message: 'No subject found with the provided ID'
      });
    }

    // Check if name or code is being changed and if it already exists
    if ((updateData.name && updateData.name !== subject.name) || 
        (updateData.code && updateData.code !== subject.code)) {
      const existingSubject = await Subject.findOne({ 
        $or: [
          { name: updateData.name || subject.name },
          { code: updateData.code || subject.code }
        ],
        _id: { $ne: id }
      });
      if (existingSubject) {
        return res.status(409).json({
          error: 'Subject already exists',
          message: 'A subject with this name or code already exists'
        });
      }
    }

    Object.assign(subject, updateData);
    await subject.save();

    // Create audit log
    await createAuditLog(req.user.id, 'Subject Updated', { type: 'Subject', id: subject._id, name: subject.name }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Subject updated successfully',
      subject: {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        curriculum: subject.curriculum,
        formLevels: subject.formLevels,
        updatedAt: subject.updatedAt
      }
    });

  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      error: 'Failed to update subject',
      message: 'An error occurred while updating subject'
    });
  }
});

// Delete subject
router.delete('/subjects/:id', requirePermission('Academics', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({
        error: 'Subject not found',
        message: 'No subject found with the provided ID'
      });
    }

    // Create audit log before deletion
    await createAuditLog(req.user.id, 'Subject Deleted', { type: 'Subject', id: subject._id, name: subject.name }, `Deleted by ${req.user.name}`);

    await subject.deleteOne();

    res.json({
      message: 'Subject deleted successfully'
    });

  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      error: 'Failed to delete subject',
      message: 'An error occurred while deleting subject'
    });
  }
});

module.exports = router; 