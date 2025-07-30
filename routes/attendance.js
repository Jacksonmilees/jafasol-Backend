const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { AttendanceRecord } = require('../models');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

// Get all attendance records with pagination and filtering
router.get('/', authenticateToken, requirePermission('attendance', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, studentId, date, status } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (studentId) whereClause.studentId = studentId;
    if (date) whereClause.date = date;
    if (status) whereClause.status = status;
    
    const { count, rows } = await AttendanceRecord.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']]
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

// Get attendance record by ID
router.get('/:id', authenticateToken, requirePermission('attendance', 'read'), async (req, res) => {
  try {
    const record = await AttendanceRecord.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new attendance record
router.post('/', authenticateToken, requirePermission('attendance', 'create'), [
  body('studentId').isInt().withMessage('Student ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const record = await AttendanceRecord.create(req.body);
    
    await createAuditLog(req.user.id, req.user.name, 'CREATE', 'attendance', {
      recordId: record.id,
      studentId: record.studentId,
      date: record.date
    });
    
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update attendance record
router.put('/:id', authenticateToken, requirePermission('attendance', 'update'), [
  body('status').optional().isIn(['present', 'absent', 'late', 'excused']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const record = await AttendanceRecord.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
    
    await record.update(req.body);
    
    await createAuditLog(req.user.id, req.user.name, 'UPDATE', 'attendance', {
      recordId: record.id,
      studentId: record.studentId,
      changes: req.body
    });
    
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete attendance record
router.delete('/:id', authenticateToken, requirePermission('attendance', 'delete'), async (req, res) => {
  try {
    const record = await AttendanceRecord.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
    
    await record.destroy();
    
    await createAuditLog(req.user.id, req.user.name, 'DELETE', 'attendance', {
      recordId: record.id,
      studentId: record.studentId
    });
    
    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk upload attendance records
router.post('/bulk', authenticateToken, requirePermission('attendance', 'create'), async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'Records array is required' });
    }
    
    const createdRecords = await AttendanceRecord.bulkCreate(records);
    
    await createAuditLog(req.user.id, req.user.name, 'BULK_CREATE', 'attendance', {
      count: createdRecords.length
    });
    
    res.status(201).json({ 
      success: true, 
      data: createdRecords,
      message: `${createdRecords.length} attendance records created`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get attendance statistics
router.get('/stats/overview', authenticateToken, requirePermission('attendance', 'read'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.date = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    }
    
    const totalRecords = await AttendanceRecord.count({ where: whereClause });
    const presentRecords = await AttendanceRecord.count({ 
      where: { ...whereClause, status: 'present' } 
    });
    const absentRecords = await AttendanceRecord.count({ 
      where: { ...whereClause, status: 'absent' } 
    });
    const lateRecords = await AttendanceRecord.count({ 
      where: { ...whereClause, status: 'late' } 
    });
    
    const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        total: totalRecords,
        present: presentRecords,
        absent: absentRecords,
        late: lateRecords,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 