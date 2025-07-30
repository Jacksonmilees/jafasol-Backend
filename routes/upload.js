const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { requireRole, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    const category = req.body.category || 'general';
    const finalPath = path.join(uploadDir, category);
    
    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }
    cb(null, finalPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + originalName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image': /jpeg|jpg|png|gif|webp/,
    'document': /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv/,
    'video': /mp4|avi|mov|wmv|flv/,
    'audio': /mp3|wav|aac|ogg/
  };

  const fileType = file.mimetype.split('/')[0];
  const extname = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes[fileType] && allowedTypes[fileType].test(extname.substring(1))) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${Object.keys(allowedTypes).join(', ')}`));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 10 // Maximum 10 files at once
  },
  fileFilter: fileFilter
});

// Upload single file
router.post('/single', [
  body('category').optional().isIn(['documents', 'images', 'videos', 'audio', 'general']),
  body('description').optional().trim().isLength({ max: 500 }),
  body('tags').optional().isArray()
], upload.single('file'), requirePermission('File Upload', 'create'), async (req, res) => {
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

    const { category = 'general', description, tags = [] } = req.body;

    // Process image if it's an image file
    let processedFile = req.file;
    if (req.file.mimetype.startsWith('image/')) {
      try {
        const imagePath = req.file.path;
        const processedPath = imagePath.replace(path.extname(imagePath), '_processed' + path.extname(imagePath));
        
        await sharp(imagePath)
          .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(processedPath);
        
        processedFile = {
          ...req.file,
          path: processedPath,
          filename: path.basename(processedPath)
        };
      } catch (error) {
        console.error('Image processing error:', error);
      }
    }

    const fileData = {
      id: Date.now().toString(),
      originalName: req.file.originalname,
      filename: processedFile.filename,
      path: processedFile.path,
      size: processedFile.size,
      mimetype: req.file.mimetype,
      category,
      description: description || '',
      tags,
      uploadedBy: req.user.id,
      uploadedByName: req.user.name,
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create audit log
    await createAuditLog(req.user.id, 'File Uploaded', { 
      type: 'File Upload', 
      fileId: fileData.id,
      fileName: fileData.originalName,
      category
    }, `Uploaded by ${req.user.name}`);

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: fileData.id,
        originalName: fileData.originalName,
        filename: fileData.filename,
        size: fileData.size,
        mimetype: fileData.mimetype,
        category: fileData.category,
        description: fileData.description,
        tags: fileData.tags,
        uploadedBy: fileData.uploadedByName,
        createdAt: fileData.createdAt,
        downloadUrl: `/api/upload/download/${fileData.id}`
      }
    });

  } catch (error) {
    console.error('Upload single file error:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      message: 'An error occurred while uploading the file'
    });
  }
});

// Upload multiple files
router.post('/multiple', [
  body('category').optional().isIn(['documents', 'images', 'videos', 'audio', 'general']),
  body('description').optional().trim().isLength({ max: 500 }),
  body('tags').optional().isArray()
], upload.array('files', 10), requirePermission('File Upload', 'create'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please upload at least one file'
      });
    }

    const { category = 'general', description, tags = [] } = req.body;

    const uploadedFiles = [];

    for (const file of req.files) {
      // Process image if it's an image file
      let processedFile = file;
      if (file.mimetype.startsWith('image/')) {
        try {
          const imagePath = file.path;
          const processedPath = imagePath.replace(path.extname(imagePath), '_processed' + path.extname(imagePath));
          
          await sharp(imagePath)
            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(processedPath);
          
          processedFile = {
            ...file,
            path: processedPath,
            filename: path.basename(processedPath)
          };
        } catch (error) {
          console.error('Image processing error:', error);
        }
      }

      const fileData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        originalName: file.originalname,
        filename: processedFile.filename,
        path: processedFile.path,
        size: processedFile.size,
        mimetype: file.mimetype,
        category,
        description: description || '',
        tags,
        uploadedBy: req.user.id,
        uploadedByName: req.user.name,
        downloadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      uploadedFiles.push({
        id: fileData.id,
        originalName: fileData.originalName,
        filename: fileData.filename,
        size: fileData.size,
        mimetype: fileData.mimetype,
        category: fileData.category,
        description: fileData.description,
        tags: fileData.tags,
        uploadedBy: fileData.uploadedByName,
        createdAt: fileData.createdAt,
        downloadUrl: `/api/upload/download/${fileData.id}`
      });
    }

    // Create audit log
    await createAuditLog(req.user.id, 'Multiple Files Uploaded', { 
      type: 'File Upload', 
      fileCount: uploadedFiles.length,
      category
    }, `Uploaded by ${req.user.name}`);

    res.status(201).json({
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Upload multiple files error:', error);
    res.status(500).json({
      error: 'Failed to upload files',
      message: 'An error occurred while uploading the files'
    });
  }
});

// Download file
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Mock file data (in a real app, this would come from database)
    const fileData = {
      id,
      originalName: 'sample-file.pdf',
      filename: 'file-123456789-sample-file.pdf',
      path: path.join(process.env.UPLOAD_PATH || './uploads', 'documents', 'file-123456789-sample-file.pdf'),
      size: 1024000,
      mimetype: 'application/pdf',
      downloadCount: 5
    };

    if (!fs.existsSync(fileData.path)) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file does not exist'
      });
    }

    // Increment download count
    fileData.downloadCount += 1;

    // Create audit log
    await createAuditLog(req.user.id, 'File Downloaded', { 
      type: 'File Download', 
      fileId: fileData.id,
      fileName: fileData.originalName
    }, `Downloaded by ${req.user.name}`);

    res.download(fileData.path, fileData.originalName);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      error: 'Failed to download file',
      message: 'An error occurred while downloading the file'
    });
  }
});

// Get uploaded files
router.get('/files', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('uploadedBy').optional().isString()
], requirePermission('File Upload', 'view'), async (req, res) => {
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
    const { category, search, uploadedBy } = req.query;

    // Mock files data
    const mockFiles = [
      {
        id: '1',
        originalName: 'school-policy.pdf',
        filename: 'file-123456789-school-policy.pdf',
        size: 2048576,
        mimetype: 'application/pdf',
        category: 'documents',
        description: 'School policy document',
        tags: ['policy', 'school'],
        uploadedBy: 'admin',
        uploadedByName: 'Admin User',
        downloadCount: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
        downloadUrl: '/api/upload/download/1'
      },
      {
        id: '2',
        originalName: 'student-photo.jpg',
        filename: 'file-987654321-student-photo.jpg',
        size: 512000,
        mimetype: 'image/jpeg',
        category: 'images',
        description: 'Student profile photo',
        tags: ['photo', 'student'],
        uploadedBy: 'teacher1',
        uploadedByName: 'John Teacher',
        downloadCount: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        downloadUrl: '/api/upload/download/2'
      }
    ];

    // Filter files
    let filteredFiles = mockFiles;
    
    if (category) {
      filteredFiles = filteredFiles.filter(file => file.category === category);
    }
    
    if (search) {
      filteredFiles = filteredFiles.filter(file =>
        file.originalName.toLowerCase().includes(search.toLowerCase()) ||
        file.description.toLowerCase().includes(search.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (uploadedBy) {
      filteredFiles = filteredFiles.filter(file => file.uploadedBy === uploadedBy);
    }

    const total = filteredFiles.length;
    const paginatedFiles = filteredFiles.slice(offset, offset + limit);

    res.json({
      files: paginatedFiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      error: 'Failed to fetch files',
      message: 'An error occurred while fetching files'
    });
  }
});

// Delete file
router.delete('/files/:id', requirePermission('File Upload', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Mock file data
    const fileData = {
      id,
      originalName: 'sample-file.pdf',
      filename: 'file-123456789-sample-file.pdf',
      path: path.join(process.env.UPLOAD_PATH || './uploads', 'documents', 'file-123456789-sample-file.pdf')
    };

    // Check if file exists
    if (fs.existsSync(fileData.path)) {
      fs.unlinkSync(fileData.path);
    }

    // Create audit log
    await createAuditLog(req.user.id, 'File Deleted', { 
      type: 'File Delete', 
      fileId: fileData.id,
      fileName: fileData.originalName
    }, `Deleted by ${req.user.name}`);

    res.json({
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      message: 'An error occurred while deleting the file'
    });
  }
});

// Get upload statistics
router.get('/statistics', requirePermission('File Upload', 'view'), async (req, res) => {
  try {
    // Mock statistics data
    const statisticsData = {
      totalFiles: 150,
      totalSize: 524288000, // 500MB
      filesByCategory: {
        documents: 80,
        images: 45,
        videos: 15,
        audio: 10
      },
      filesByType: {
        'application/pdf': 50,
        'image/jpeg': 30,
        'image/png': 15,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 20,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 15,
        'video/mp4': 10,
        'audio/mpeg': 10
      },
      recentUploads: 25,
      totalDownloads: 450
    };

    res.json({
      statistics: statisticsData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload statistics error:', error);
    res.status(500).json({
      error: 'Failed to fetch upload statistics',
      message: 'An error occurred while fetching upload statistics'
    });
  }
});

module.exports = router; 