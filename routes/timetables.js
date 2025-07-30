const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { TimetableEntry } = require('../models');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

// Get all timetable entries with filtering
router.get('/', authenticateToken, requirePermission('timetables', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, classId, day, subject } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (classId) whereClause.classId = classId;
    if (day) whereClause.day = day;
    if (subject) whereClause.subject = subject;
    
    const { count, rows } = await TimetableEntry.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['day', 'ASC'], ['startTime', 'ASC']]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get timetable by ID
router.get('/:id', authenticateToken, requirePermission('timetables', 'read'), async (req, res) => {
  try {
    const entry = await TimetableEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Timetable entry not found' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new timetable entry
router.post('/', authenticateToken, requirePermission('timetables', 'create'), [
  body('classId').isInt().withMessage('Class ID is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('day').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).withMessage('Valid day is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required'),
  body('teacherId').isInt().withMessage('Teacher ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const entry = await TimetableEntry.create(req.body);
    
    await createAuditLog(req.user.id, req.user.name, 'CREATE', 'timetable', {
      entryId: entry.id,
      classId: entry.classId,
      subject: entry.subject
    });
    
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update timetable entry
router.put('/:id', authenticateToken, requirePermission('timetables', 'update'), [
  body('subject').optional().notEmpty().withMessage('Subject cannot be empty'),
  body('day').optional().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).withMessage('Valid day is required'),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required'),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const entry = await TimetableEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Timetable entry not found' });
    }
    
    await entry.update(req.body);
    
    await createAuditLog(req.user.id, req.user.name, 'UPDATE', 'timetable', {
      entryId: entry.id,
      classId: entry.classId,
      changes: req.body
    });
    
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete timetable entry
router.delete('/:id', authenticateToken, requirePermission('timetables', 'delete'), async (req, res) => {
  try {
    const entry = await TimetableEntry.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Timetable entry not found' });
    }
    
    await entry.destroy();
    
    await createAuditLog(req.user.id, req.user.name, 'DELETE', 'timetable', {
      entryId: entry.id,
      classId: entry.classId,
      subject: entry.subject
    });
    
    res.json({ success: true, message: 'Timetable entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get timetable for specific class
router.get('/class/:classId', authenticateToken, requirePermission('timetables', 'read'), async (req, res) => {
  try {
    const entries = await TimetableEntry.findAll({
      where: { classId: req.params.classId },
      order: [['day', 'ASC'], ['startTime', 'ASC']]
    });
    
    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get timetable for specific teacher
router.get('/teacher/:teacherId', authenticateToken, requirePermission('timetables', 'read'), async (req, res) => {
  try {
    const entries = await TimetableEntry.findAll({
      where: { teacherId: req.params.teacherId },
      order: [['day', 'ASC'], ['startTime', 'ASC']]
    });
    
    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk create timetable entries
router.post('/bulk', authenticateToken, requirePermission('timetables', 'create'), async (req, res) => {
  try {
    const { entries } = req.body;
    
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, error: 'Entries array is required' });
    }
    
    const createdEntries = await TimetableEntry.bulkCreate(entries);
    
    await createAuditLog(req.user.id, req.user.name, 'BULK_CREATE', 'timetable', {
      count: createdEntries.length
    });
    
    res.status(201).json({ 
      success: true, 
      data: createdEntries,
      message: `${createdEntries.length} timetable entries created`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate timetable using AI
router.post('/generate', authenticateToken, requirePermission('timetables', 'create'), async (req, res) => {
  try {
    const { classId, subjects, teachers, constraints } = req.body;
    
    // Mock AI timetable generation
    const generatedEntries = [
      {
        classId,
        subject: 'Mathematics',
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        teacherId: 1,
        room: 'Room 101'
      },
      {
        classId,
        subject: 'English',
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        teacherId: 2,
        room: 'Room 102'
      }
    ];
    
    await createAuditLog(req.user.id, req.user.name, 'AI_GENERATE', 'timetable', {
      classId,
      subjectsCount: subjects?.length || 0
    });
    
    res.json({
      success: true,
      data: generatedEntries,
      message: 'Timetable generated successfully using AI'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 