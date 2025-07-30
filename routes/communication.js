const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Message } = require('../models');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

// Get all messages with filtering
router.get('/', authenticateToken, requirePermission('communication', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, senderId, recipientId, type, status } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (senderId) whereClause.senderId = senderId;
    if (recipientId) whereClause.recipientId = recipientId;
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    
    const { count, rows } = await Message.findAndCountAll({
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

// Get message by ID
router.get('/:id', authenticateToken, requirePermission('communication', 'read'), async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new message
router.post('/', authenticateToken, requirePermission('communication', 'create'), [
  body('recipientId').isInt().withMessage('Recipient ID is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('type').isIn(['email', 'sms', 'notification', 'announcement']).withMessage('Valid type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const messageData = {
      ...req.body,
      senderId: req.user.id,
      status: 'sent'
    };
    
    const message = await Message.create(messageData);
    
    await createAuditLog(req.user.id, req.user.name, 'CREATE', 'message', {
      messageId: message.id,
      recipientId: message.recipientId,
      type: message.type
    });
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update message
router.put('/:id', authenticateToken, requirePermission('communication', 'update'), [
  body('subject').optional().notEmpty().withMessage('Subject cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('status').optional().isIn(['sent', 'delivered', 'read', 'failed']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    await message.update(req.body);
    
    await createAuditLog(req.user.id, req.user.name, 'UPDATE', 'message', {
      messageId: message.id,
      changes: req.body
    });
    
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete message
router.delete('/:id', authenticateToken, requirePermission('communication', 'delete'), async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    await message.destroy();
    
    await createAuditLog(req.user.id, req.user.name, 'DELETE', 'message', {
      messageId: message.id,
      recipientId: message.recipientId
    });
    
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send bulk messages
router.post('/bulk', authenticateToken, requirePermission('communication', 'create'), [
  body('recipients').isArray().withMessage('Recipients array is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('type').isIn(['email', 'sms', 'notification', 'announcement']).withMessage('Valid type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { recipients, subject, content, type } = req.body;
    
    const messages = recipients.map(recipientId => ({
      senderId: req.user.id,
      recipientId,
      subject,
      content,
      type,
      status: 'sent'
    }));
    
    const createdMessages = await Message.bulkCreate(messages);
    
    await createAuditLog(req.user.id, req.user.name, 'BULK_SEND', 'message', {
      count: createdMessages.length,
      type
    });
    
    res.status(201).json({ 
      success: true, 
      data: createdMessages,
      message: `${createdMessages.length} messages sent successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's inbox
router.get('/inbox', authenticateToken, requirePermission('communication', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Message.findAndCountAll({
      where: { recipientId: req.user.id },
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

// Get user's sent messages
router.get('/sent', authenticateToken, requirePermission('communication', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Message.findAndCountAll({
      where: { senderId: req.user.id },
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

// Mark message as read
router.put('/:id/read', authenticateToken, requirePermission('communication', 'update'), async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    await message.update({ status: 'read', readAt: new Date() });
    
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get communication statistics
router.get('/stats/overview', authenticateToken, requirePermission('communication', 'read'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    }
    
    const totalMessages = await Message.count({ where: whereClause });
    const sentMessages = await Message.count({ 
      where: { ...whereClause, senderId: req.user.id } 
    });
    const receivedMessages = await Message.count({ 
      where: { ...whereClause, recipientId: req.user.id } 
    });
    const unreadMessages = await Message.count({ 
      where: { ...whereClause, recipientId: req.user.id, status: 'sent' } 
    });
    
    res.json({
      success: true,
      data: {
        total: totalMessages,
        sent: sentMessages,
        received: receivedMessages,
        unread: unreadMessages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 