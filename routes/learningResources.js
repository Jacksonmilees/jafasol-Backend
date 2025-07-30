const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { LearningResource } = require('../models');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

// Get all learning resources with filtering
router.get('/', authenticateToken, requirePermission('learning-resources', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, title, subject, type, grade } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (title) whereClause.title = { [require('sequelize').Op.iLike]: `%${title}%` };
    if (subject) whereClause.subject = subject;
    if (type) whereClause.type = type;
    if (grade) whereClause.grade = grade;
    
    const { count, rows } = await LearningResource.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
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

// Get learning resource by ID
router.get('/:id', authenticateToken, requirePermission('learning-resources', 'read'), async (req, res) => {
  try {
    const resource = await LearningResource.findByPk(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Learning resource not found' });
    }
    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new learning resource
router.post('/', authenticateToken, requirePermission('learning-resources', 'create'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('type').isIn(['document', 'video', 'audio', 'link', 'interactive']).withMessage('Valid type is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('grade').notEmpty().withMessage('Grade is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const resourceData = {
      ...req.body,
      uploadedBy: req.user.id
    };
    
    const resource = await LearningResource.create(resourceData);
    
    await createAuditLog(req.user.id, req.user.name, 'CREATE', 'learning-resource', {
      resourceId: resource.id,
      title: resource.title,
      type: resource.type
    });
    
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update learning resource
router.put('/:id', authenticateToken, requirePermission('learning-resources', 'update'), [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('type').optional().isIn(['document', 'video', 'audio', 'link', 'interactive']).withMessage('Valid type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const resource = await LearningResource.findByPk(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Learning resource not found' });
    }
    
    await resource.update(req.body);
    
    await createAuditLog(req.user.id, req.user.name, 'UPDATE', 'learning-resource', {
      resourceId: resource.id,
      changes: req.body
    });
    
    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete learning resource
router.delete('/:id', authenticateToken, requirePermission('learning-resources', 'delete'), async (req, res) => {
  try {
    const resource = await LearningResource.findByPk(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Learning resource not found' });
    }
    
    await resource.destroy();
    
    await createAuditLog(req.user.id, req.user.name, 'DELETE', 'learning-resource', {
      resourceId: resource.id,
      title: resource.title
    });
    
    res.json({ success: true, message: 'Learning resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get resources by subject
router.get('/subject/:subject', authenticateToken, requirePermission('learning-resources', 'read'), async (req, res) => {
  try {
    const resources = await LearningResource.findAll({
      where: { subject: req.params.subject },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get resources by grade
router.get('/grade/:grade', authenticateToken, requirePermission('learning-resources', 'read'), async (req, res) => {
  try {
    const resources = await LearningResource.findAll({
      where: { grade: req.params.grade },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get learning resources statistics
router.get('/stats/overview', authenticateToken, requirePermission('learning-resources', 'read'), async (req, res) => {
  try {
    const totalResources = await LearningResource.count();
    const documentResources = await LearningResource.count({ where: { type: 'document' } });
    const videoResources = await LearningResource.count({ where: { type: 'video' } });
    const audioResources = await LearningResource.count({ where: { type: 'audio' } });
    const linkResources = await LearningResource.count({ where: { type: 'link' } });
    const interactiveResources = await LearningResource.count({ where: { type: 'interactive' } });
    
    res.json({
      success: true,
      data: {
        total: totalResources,
        documents: documentResources,
        videos: videoResources,
        audio: audioResources,
        links: linkResources,
        interactive: interactiveResources
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 