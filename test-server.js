const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'development',
    message: 'Test server running without database'
  });
});

// Test authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and password are required' 
    });
  }
  
  // Mock authentication
  if (email === 'admin@jafasol.com' && password === 'password') {
    res.json({
      success: true,
      data: {
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@jafasol.com',
          role: 'admin'
        },
        token: 'mock-jwt-token-12345',
        refreshToken: 'mock-refresh-token-12345'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Name, email and password are required' 
    });
  }
  
  res.status(201).json({
    success: true,
    data: {
      user: {
        id: 2,
        name,
        email,
        role: role || 'user'
      },
      message: 'User registered successfully'
    }
  });
});

// Test users endpoints
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@jafasol.com',
        role: 'admin',
        status: 'active'
      },
      {
        id: 2,
        name: 'John Doe',
        email: 'john@jafasol.com',
        role: 'teacher',
        status: 'active'
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      pages: 1
    }
  });
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  if (id === '1') {
    res.json({
      success: true,
      data: {
        id: 1,
        name: 'Admin User',
        email: 'admin@jafasol.com',
        role: 'admin',
        status: 'active'
      }
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
});

// Test students endpoints
app.get('/api/students', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        admissionNumber: 'STU001',
        firstName: 'Alice',
        lastName: 'Johnson',
        formClass: 'Form 1A',
        status: 'active'
      },
      {
        id: 2,
        admissionNumber: 'STU002',
        firstName: 'Bob',
        lastName: 'Smith',
        formClass: 'Form 2B',
        status: 'active'
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      pages: 1
    }
  });
});

// Test teachers endpoints
app.get('/api/teachers', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Dr. Sarah Wilson',
        email: 'sarah.wilson@jafasol.com',
        subjects: ['Mathematics', 'Physics'],
        status: 'active'
      },
      {
        id: 2,
        name: 'Mr. James Brown',
        email: 'james.brown@jafasol.com',
        subjects: ['English', 'Literature'],
        status: 'active'
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      pages: 1
    }
  });
});

// Test academics endpoints
app.get('/api/academics/classes', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Form 1A',
        formLevel: 'Form 1',
        stream: 'A',
        students: 25,
        classTeacher: 'Dr. Sarah Wilson'
      },
      {
        id: 2,
        name: 'Form 2B',
        formLevel: 'Form 2',
        stream: 'B',
        students: 28,
        classTeacher: 'Mr. James Brown'
      }
    ]
  });
});

app.get('/api/academics/subjects', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Mathematics',
        code: 'MATH',
        curriculum: 'KCSE',
        formLevels: ['Form 1', 'Form 2', 'Form 3', 'Form 4']
      },
      {
        id: 2,
        name: 'English',
        code: 'ENG',
        curriculum: 'KCSE',
        formLevels: ['Form 1', 'Form 2', 'Form 3', 'Form 4']
      }
    ]
  });
});

// Test exams endpoints
app.get('/api/exams', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Mid-Term Exam',
        type: 'Mid-Term',
        term: 'Term 1',
        startDate: '2024-03-15',
        endDate: '2024-03-20',
        status: 'active'
      },
      {
        id: 2,
        name: 'End of Term Exam',
        type: 'End of Term',
        term: 'Term 1',
        startDate: '2024-04-01',
        endDate: '2024-04-05',
        status: 'active'
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      pages: 1
    }
  });
});

// Test fees endpoints
app.get('/api/fees/structures', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        formLevel: 'Form 1',
        amount: 50000,
        type: 'Tuition',
        term: 'Term 1',
        dueDate: '2024-02-15'
      },
      {
        id: 2,
        formLevel: 'Form 2',
        amount: 55000,
        type: 'Tuition',
        term: 'Term 1',
        dueDate: '2024-02-15'
      }
    ]
  });
});

// Test attendance endpoints
app.get('/api/attendance', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        studentId: 1,
        date: '2024-01-15',
        status: 'present',
        timeIn: '08:00:00'
      },
      {
        id: 2,
        studentId: 2,
        date: '2024-01-15',
        status: 'present',
        timeIn: '08:05:00'
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      pages: 1
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: error.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Environment: development`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app; 