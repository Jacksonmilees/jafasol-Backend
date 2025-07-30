const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { requireRole, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || './uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, document, and spreadsheet files are allowed!'));
    }
  }
});

// Mock data for documents (in a real app, these would be database models)
let documents = [
  {
    id: '1',
    title: 'School Policy Document',
    description: 'Comprehensive school policies and guidelines',
    category: 'Policies',
    subcategory: 'General',
    tags: ['policy', 'guidelines', 'school'],
    fileName: 'school-policy.pdf',
    fileSize: 2048576,
    fileType: 'pdf',
    uploadedBy: 'admin',
    uploadedById: '1',
    downloadCount: 15,
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: 'Academic Calendar 2024',
    description: 'Complete academic calendar for the year 2024',
    category: 'Academic',
    subcategory: 'Calendar',
    tags: ['calendar', 'academic', '2024'],
    fileName: 'academic-calendar-2024.pdf',
    fileSize: 1048576,
    fileType: 'pdf',
    uploadedBy: 'admin',
    uploadedById: '1',
    downloadCount: 8,
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: 'Student Handbook',
    description: 'Student handbook with rules and regulations',
    category: 'Student',
    subcategory: 'Handbook',
    tags: ['handbook', 'student', 'rules'],
    fileName: 'student-handbook.pdf',
    fileSize: 3145728,
    fileType: 'pdf',
    uploadedBy: 'admin',
    uploadedById: '1',
    downloadCount: 25,
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Get all documents with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('category').optional().isString(),
  query('subcategory').optional().isString(),
  query('status').optional().isIn(['Active', 'Inactive', 'Archived']),
  query('fileType').optional().isString()
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
    const { search, category, subcategory, status, fileType } = req.query;

    // Filter documents
    let filteredDocuments = documents;
    
    if (search) {
      filteredDocuments = filteredDocuments.filter(doc =>
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.description.toLowerCase().includes(search.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (category) {
      filteredDocuments = filteredDocuments.filter(doc => doc.category === category);
    }
    
    if (subcategory) {
      filteredDocuments = filteredDocuments.filter(doc => doc.subcategory === subcategory);
    }
    
    if (status) {
      filteredDocuments = filteredDocuments.filter(doc => doc.status === status);
    }
    
    if (fileType) {
      filteredDocuments = filteredDocuments.filter(doc => doc.fileType === fileType);
    }

    const total = filteredDocuments.length;
    const paginatedDocuments = filteredDocuments.slice(offset, offset + limit);

    res.json({
      documents: paginatedDocuments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Failed to fetch documents',
      message: 'An error occurred while fetching documents'
    });
  }
});

// Get document by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const document = documents.find(d => d.id === id);

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'No document found with the provided ID'
      });
    }

    res.json({ document });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      error: 'Failed to fetch document',
      message: 'An error occurred while fetching document'
    });
  }
});

// Upload new document
router.post('/', [
  body('title').trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('category').isIn(['Academic', 'Administrative', 'Policies', 'Student', 'Teacher', 'Financial', 'Other']),
  body('subcategory').optional().trim().isLength({ min: 2, max: 50 }),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['Active', 'Inactive', 'Archived'])
], upload.single('file'), requirePermission('Document Management', 'create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a file'
      });
    }

    const { title, description, category, subcategory, tags = [], status = 'Active' } = req.body;

    // Check if document with same title already exists
    const existingDocument = documents.find(d => d.title === title);
    if (existingDocument) {
      return res.status(409).json({
        error: 'Document already exists',
        message: 'A document with this title already exists'
      });
    }

    const newDocument = {
      id: (documents.length + 1).toString(),
      title,
      description: description || '',
      category,
      subcategory: subcategory || '',
      tags,
      fileName: req.file.filename,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).substring(1).toLowerCase(),
      uploadedBy: req.user.name,
      uploadedById: req.user.id,
      downloadCount: 0,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    documents.push(newDocument);

    // Create audit log
    await createAuditLog(req.user.id, 'Document Uploaded', { type: 'Document', id: newDocument.id, title: newDocument.title }, `Uploaded by ${req.user.name}`);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: newDocument
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      error: 'Failed to upload document',
      message: 'An error occurred while uploading document'
    });
  }
});

// Update document
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('category').optional().isIn(['Academic', 'Administrative', 'Policies', 'Student', 'Teacher', 'Financial', 'Other']),
  body('subcategory').optional().trim().isLength({ min: 2, max: 50 }),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['Active', 'Inactive', 'Archived'])
], requirePermission('Document Management', 'edit'), async (req, res) => {
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
    const documentIndex = documents.findIndex(d => d.id === id);

    if (documentIndex === -1) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'No document found with the provided ID'
      });
    }

    const document = documents[documentIndex];
    const { title, description, category, subcategory, tags, status } = req.body;

    // Check if title is being changed and if it already exists
    if (title && title !== document.title) {
      const existingDocument = documents.find(d => d.title === title);
      if (existingDocument) {
        return res.status(409).json({
          error: 'Document title already exists',
          message: 'A document with this title already exists'
        });
      }
    }

    // Update document
    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (category) document.category = category;
    if (subcategory !== undefined) document.subcategory = subcategory;
    if (tags) document.tags = tags;
    if (status) document.status = status;
    document.updatedAt = new Date();

    documents[documentIndex] = document;

    // Create audit log
    await createAuditLog(req.user.id, 'Document Updated', { type: 'Document', id: document.id, title: document.title }, `Updated by ${req.user.name}`);

    res.json({
      message: 'Document updated successfully',
      document
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      error: 'Failed to update document',
      message: 'An error occurred while updating document'
    });
  }
});

// Delete document
router.delete('/:id', requirePermission('Document Management', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const documentIndex = documents.findIndex(d => d.id === id);

    if (documentIndex === -1) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'No document found with the provided ID'
      });
    }

    const document = documents[documentIndex];

    // Delete file from filesystem
    const filePath = path.join(process.env.UPLOAD_PATH || './uploads/documents', document.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Create audit log before deletion
    await createAuditLog(req.user.id, 'Document Deleted', { type: 'Document', id: document.id, title: document.title }, `Deleted by ${req.user.name}`);

    documents.splice(documentIndex, 1);

    res.json({
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: 'An error occurred while deleting document'
    });
  }
});

// Download document
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const document = documents.find(d => d.id === id);

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        message: 'No document found with the provided ID'
      });
    }

    const filePath = path.join(process.env.UPLOAD_PATH || './uploads/documents', document.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The document file does not exist on the server'
      });
    }

    // Increment download count
    document.downloadCount += 1;
    document.updatedAt = new Date();

    // Create audit log
    await createAuditLog(req.user.id, 'Document Downloaded', { type: 'Document', id: document.id, title: document.title }, `Downloaded by ${req.user.name}`);

    res.download(filePath, document.title + path.extname(document.fileName));

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      error: 'Failed to download document',
      message: 'An error occurred while downloading document'
    });
  }
});

// Get document categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { name: 'Academic', subcategories: ['Calendar', 'Curriculum', 'Syllabus', 'Exam Papers', 'Results'] },
      { name: 'Administrative', subcategories: ['Reports', 'Minutes', 'Notices', 'Circulars'] },
      { name: 'Policies', subcategories: ['General', 'Academic', 'Discipline', 'Safety'] },
      { name: 'Student', subcategories: ['Handbook', 'Forms', 'Guidelines', 'Resources'] },
      { name: 'Teacher', subcategories: ['Handbook', 'Resources', 'Guidelines', 'Training'] },
      { name: 'Financial', subcategories: ['Budgets', 'Reports', 'Receipts', 'Invoices'] },
      { name: 'Other', subcategories: ['General', 'Miscellaneous'] }
    ];

    res.json({ categories });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: 'An error occurred while fetching categories'
    });
  }
});

// Get document statistics
router.get('/statistics', async (req, res) => {
  try {
    const totalDocuments = documents.length;
    const activeDocuments = documents.filter(d => d.status === 'Active').length;
    const totalDownloads = documents.reduce((sum, doc) => sum + doc.downloadCount, 0);
    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);

    const categories = documents.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {});

    const fileTypes = documents.reduce((acc, doc) => {
      acc[doc.fileType] = (acc[doc.fileType] || 0) + 1;
      return acc;
    }, {});

    res.json({
      statistics: {
        totalDocuments,
        activeDocuments,
        totalDownloads,
        totalSize,
        categories,
        fileTypes
      }
    });

  } catch (error) {
    console.error('Get document statistics error:', error);
    res.status(500).json({
      error: 'Failed to fetch document statistics',
      message: 'An error occurred while fetching document statistics'
    });
  }
});

module.exports = router; 