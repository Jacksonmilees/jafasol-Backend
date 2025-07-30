const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Book, BookIssue } = require('../models');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

// Get all books with filtering
router.get('/books', authenticateToken, requirePermission('library', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, title, author, category, status } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (title) whereClause.title = { [require('sequelize').Op.iLike]: `%${title}%` };
    if (author) whereClause.author = { [require('sequelize').Op.iLike]: `%${author}%` };
    if (category) whereClause.category = category;
    if (status) whereClause.status = status;
    
    const { count, rows } = await Book.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['title', 'ASC']]
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

// Get book by ID
router.get('/books/:id', authenticateToken, requirePermission('library', 'read'), async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new book
router.post('/books', authenticateToken, requirePermission('library', 'create'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('author').notEmpty().withMessage('Author is required'),
  body('isbn').notEmpty().withMessage('ISBN is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('copies').isInt({ min: 1 }).withMessage('Valid number of copies is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const book = await Book.create(req.body);
    
    await createAuditLog(req.user.id, req.user.name, 'CREATE', 'book', {
      bookId: book.id,
      title: book.title,
      author: book.author
    });
    
    res.status(201).json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update book
router.put('/books/:id', authenticateToken, requirePermission('library', 'update'), [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('author').optional().notEmpty().withMessage('Author cannot be empty'),
  body('copies').optional().isInt({ min: 0 }).withMessage('Valid number of copies is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }
    
    await book.update(req.body);
    
    await createAuditLog(req.user.id, req.user.name, 'UPDATE', 'book', {
      bookId: book.id,
      changes: req.body
    });
    
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete book
router.delete('/books/:id', authenticateToken, requirePermission('library', 'delete'), async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }
    
    await book.destroy();
    
    await createAuditLog(req.user.id, req.user.name, 'DELETE', 'book', {
      bookId: book.id,
      title: book.title
    });
    
    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Issue book
router.post('/issue', authenticateToken, requirePermission('library', 'create'), [
  body('bookId').isInt().withMessage('Book ID is required'),
  body('studentId').isInt().withMessage('Student ID is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { bookId, studentId, dueDate } = req.body;
    
    // Check if book is available
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }
    
    if (book.availableCopies < 1) {
      return res.status(400).json({ success: false, error: 'Book is not available' });
    }
    
    // Check if student already has this book
    const existingIssue = await BookIssue.findOne({
      where: { bookId, studentId, status: 'borrowed' }
    });
    
    if (existingIssue) {
      return res.status(400).json({ success: false, error: 'Student already has this book' });
    }
    
    const issue = await BookIssue.create({
      bookId,
      studentId,
      issuedBy: req.user.id,
      dueDate,
      status: 'borrowed'
    });
    
    // Update book available copies
    await book.update({ availableCopies: book.availableCopies - 1 });
    
    await createAuditLog(req.user.id, req.user.name, 'ISSUE', 'book', {
      bookId,
      studentId,
      dueDate
    });
    
    res.status(201).json({ success: true, data: issue });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Return book
router.put('/return/:issueId', authenticateToken, requirePermission('library', 'update'), async (req, res) => {
  try {
    const issue = await BookIssue.findByPk(req.params.issueId);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Book issue not found' });
    }
    
    if (issue.status !== 'borrowed') {
      return res.status(400).json({ success: false, error: 'Book is not currently borrowed' });
    }
    
    await issue.update({ 
      status: 'returned',
      returnedAt: new Date(),
      returnedTo: req.user.id
    });
    
    // Update book available copies
    const book = await Book.findByPk(issue.bookId);
    await book.update({ availableCopies: book.availableCopies + 1 });
    
    await createAuditLog(req.user.id, req.user.name, 'RETURN', 'book', {
      bookId: issue.bookId,
      studentId: issue.studentId
    });
    
    res.json({ success: true, data: issue });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get book issues
router.get('/issues', authenticateToken, requirePermission('library', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, studentId, bookId } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (studentId) whereClause.studentId = studentId;
    if (bookId) whereClause.bookId = bookId;
    
    const { count, rows } = await BookIssue.findAndCountAll({
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

// Get overdue books
router.get('/overdue', authenticateToken, requirePermission('library', 'read'), async (req, res) => {
  try {
    const overdueIssues = await BookIssue.findAll({
      where: {
        status: 'borrowed',
        dueDate: {
          [require('sequelize').Op.lt]: new Date()
        }
      },
      order: [['dueDate', 'ASC']]
    });
    
    res.json({
      success: true,
      data: overdueIssues
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get library statistics
router.get('/stats/overview', authenticateToken, requirePermission('library', 'read'), async (req, res) => {
  try {
    const totalBooks = await Book.count();
    const availableBooks = await Book.sum('availableCopies');
    const borrowedBooks = await BookIssue.count({ where: { status: 'borrowed' } });
    const overdueBooks = await BookIssue.count({
      where: {
        status: 'borrowed',
        dueDate: {
          [require('sequelize').Op.lt]: new Date()
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        totalBooks,
        availableBooks,
        borrowedBooks,
        overdueBooks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 