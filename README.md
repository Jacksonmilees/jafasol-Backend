# JafaSol School Management System - Backend API

A comprehensive Node.js backend API for the JafaSol School Management System, built with Express.js, Sequelize ORM, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete CRUD operations for users with different roles
- **Student Management**: Student registration, profiles, and portal access
- **Teacher Management**: Teacher profiles and dashboard data
- **Academic Management**: Classes, subjects, and academic settings
- **Exam Management**: Exam creation, results tracking, and analysis
- **Fee Management**: Fee structures, invoices, payments, and M-Pesa integration
- **Attendance Tracking**: Daily attendance marking and reporting
- **Timetable Management**: Class and teacher timetables
- **Communication**: Internal messaging system
- **Library Management**: Book catalog and issue tracking
- **Learning Resources**: File upload and resource management
- **Transport Management**: Vehicle and route management
- **Document Store**: Secure document storage and retrieval
- **Reports & Analytics**: Comprehensive reporting system
- **AI Integration**: Google AI for intelligent features
- **Audit Logging**: Complete system activity tracking

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jafasol-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=jafasol_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h
   
   # Google AI
   GOOGLE_AI_API_KEY=your-google-ai-api-key
   
   # M-Pesa (optional)
   MPESA_CONSUMER_KEY=your-mpesa-consumer-key
   MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
   MPESA_PASSKEY=your-mpesa-passkey
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb jafasol_db
   
   # Run migrations (in development)
   npm run dev
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Student/Guardian registration
- `POST /api/auth/verify-2fa` - Two-factor authentication
- `POST /api/auth/setup-2fa` - Setup 2FA
- `GET /api/auth/qr-code/:userId` - Get 2FA QR code
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh JWT token

### User Management

- `GET /api/users` - Get all users (with pagination)
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/roles` - Get all roles
- `PUT /api/users/roles/:id/permissions` - Update role permissions

### Student Management

- `GET /api/students` - Get all students (with pagination)
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/bulk-upload` - Bulk upload students
- `GET /api/students/:id/portal` - Get student portal data
- `GET /api/students/:id/exam-results` - Get student exam results
- `GET /api/students/:id/fee-statement` - Get student fee statement
- `GET /api/students/:id/timetable` - Get student timetable

### Teacher Management

- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create new teacher
- `GET /api/teachers/:id` - Get teacher by ID
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher
- `GET /api/teachers/:id/dashboard` - Get teacher dashboard
- `GET /api/teachers/:id/classes` - Get teacher's classes
- `GET /api/teachers/:id/subjects` - Get teacher's subjects

### Academic Management

- `GET /api/academics/classes` - Get all classes
- `POST /api/academics/classes` - Create new class
- `PUT /api/academics/classes/:id` - Update class
- `DELETE /api/academics/classes/:id` - Delete class
- `GET /api/academics/subjects` - Get all subjects
- `POST /api/academics/subjects` - Create new subject
- `PUT /api/academics/subjects/:id` - Update subject
- `DELETE /api/academics/subjects/:id` - Delete subject

### Exam Management

- `GET /api/exams` - Get all exams
- `POST /api/exams` - Create new exam
- `GET /api/exams/:id` - Get exam by ID
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam
- `POST /api/exams/:id/lock-marks` - Lock exam marks
- `POST /api/exams/:id/unlock-marks` - Unlock exam marks
- `GET /api/exams/:id/results` - Get exam results
- `POST /api/exams/:id/results` - Submit exam results
- `PUT /api/exams/:id/results` - Update exam results
- `POST /api/exams/:id/results/bulk-upload` - Bulk upload results
- `GET /api/exams/:id/results/export` - Export exam results

### Fee Management

- `GET /api/fees/structures` - Get fee structures
- `POST /api/fees/structures` - Create fee structure
- `PUT /api/fees/structures/:id` - Update fee structure
- `DELETE /api/fees/structures/:id` - Delete fee structure
- `GET /api/fees/invoices` - Get fee invoices
- `POST /api/fees/invoices` - Create fee invoice
- `GET /api/fees/payments` - Get fee payments
- `POST /api/fees/payments` - Record payment
- `POST /api/fees/payments/mpesa` - Process M-Pesa payment
- `GET /api/fees/payments/:id/receipt` - Generate payment receipt
- `GET /api/fees/balance-summary` - Get fee balance summary
- `GET /api/fees/collection-report` - Get fee collection report
- `GET /api/fees/outstanding-report` - Get outstanding fees report

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 👥 Roles & Permissions

- **Admin**: Full system access
- **Class Teacher**: Class management, attendance, student profiles
- **Subject Teacher**: Exam results, subject management
- **Treasurer**: Fee management and financial reports
- **Student**: Portal access to own data
- **Guardian**: Portal access to child's data

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:

- `users` - User accounts and authentication
- `roles` - User roles and permissions
- `students` - Student information and profiles
- `teachers` - Teacher information and assignments
- `school_classes` - Class information
- `subjects` - Subject catalog
- `exams` - Exam definitions
- `fee_structures` - Fee structure definitions
- `fee_invoices` - Student fee invoices
- `fee_payments` - Payment records
- `audit_logs` - System activity tracking

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Variables

Required environment variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database configuration
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_AI_API_KEY` - Google AI API key

## 📝 API Response Format

All API responses follow a consistent format:

```json
{
  "message": "Success message",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error responses:
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": [
    // Validation errors
  ]
}
```

## 🔧 Development

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
npm run migrate
```

### Seeding Data
```bash
npm run seed
```

## 📞 Support

For support and questions, please contact the development team.

## 📄 License

This project is licensed under the MIT License. 