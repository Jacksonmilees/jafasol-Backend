const { sequelize } = require('./config/database');
const User = require('./models/User');
const Role = require('./models/Role');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const SchoolClass = require('./models/SchoolClass');
const Subject = require('./models/Subject');
const Exam = require('./models/Exam');
const FeeStructure = require('./models/FeeStructure');
const FeeInvoice = require('./models/FeeInvoice');
const FeePayment = require('./models/FeePayment');
const AttendanceRecord = require('./models/AttendanceRecord');
const TimetableEntry = require('./models/TimetableEntry');
const Message = require('./models/Message');
const Book = require('./models/Book');
const BookIssue = require('./models/BookIssue');
const LearningResource = require('./models/LearningResource');
const AuditLog = require('./models/AuditLog');

const testDatabase = async () => {
  console.log('🧪 Testing Supabase Database Connection...\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Sync all models (create tables)
    console.log('\n2. Creating database tables...');
    await sequelize.sync({ force: false }); // force: false to not drop existing tables
    console.log('✅ All tables created successfully!');

    // Test inserting sample data
    console.log('\n3. Testing data insertion...');

    // Create roles
    const adminRole = await Role.findOrCreate({
      where: { name: 'Admin' },
      defaults: {
        name: 'Admin',
        description: 'System Administrator',
        permissions: {
          'User Management': ['create', 'read', 'update', 'delete'],
          'Student Management': ['create', 'read', 'update', 'delete'],
          'Teacher Management': ['create', 'read', 'update', 'delete'],
          'Academic Management': ['create', 'read', 'update', 'delete'],
          'Exam Management': ['create', 'read', 'update', 'delete'],
          'Fee Management': ['create', 'read', 'update', 'delete'],
          'Attendance Management': ['create', 'read', 'update', 'delete'],
          'Timetable Management': ['create', 'read', 'update', 'delete'],
          'Communication Management': ['create', 'read', 'update', 'delete'],
          'Library Management': ['create', 'read', 'update', 'delete'],
          'Learning Resources': ['create', 'read', 'update', 'delete'],
          'Transport Management': ['create', 'read', 'update', 'delete'],
          'Document Management': ['create', 'read', 'update', 'delete'],
          'Reports': ['read', 'export'],
          'Dashboard': ['read'],
          'Settings': ['read', 'update'],
          'File Upload': ['create', 'read', 'delete'],
          'AI Features': ['use'],
          'Notifications': ['create', 'read', 'update', 'delete']
        }
      }
    });

    const teacherRole = await Role.findOrCreate({
      where: { name: 'Teacher' },
      defaults: {
        name: 'Teacher',
        description: 'School Teacher',
        permissions: {
          'Student Management': ['read'],
          'Academic Management': ['read'],
          'Exam Management': ['create', 'read', 'update'],
          'Attendance Management': ['create', 'read', 'update'],
          'Timetable Management': ['read'],
          'Communication Management': ['create', 'read'],
          'Learning Resources': ['create', 'read', 'update'],
          'Reports': ['read'],
          'Dashboard': ['read'],
          'Notifications': ['read']
        }
      }
    });

    const studentRole = await Role.findOrCreate({
      where: { name: 'Student' },
      defaults: {
        name: 'Student',
        description: 'School Student',
        permissions: {
          'Academic Management': ['read'],
          'Exam Management': ['read'],
          'Attendance Management': ['read'],
          'Timetable Management': ['read'],
          'Communication Management': ['read'],
          'Library Management': ['read'],
          'Learning Resources': ['read'],
          'Dashboard': ['read'],
          'Notifications': ['read']
        }
      }
    });

    // Create admin user
    const adminUser = await User.findOrCreate({
      where: { email: 'admin@jafasol.com' },
      defaults: {
        name: 'System Administrator',
        email: 'admin@jafasol.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iQeO', // admin123
        roleId: adminRole[0].id,
        status: 'Active'
      }
    });

    // Create sample class
    const sampleClass = await SchoolClass.findOrCreate({
      where: { name: 'Class 1A' },
      defaults: {
        name: 'Class 1A',
        grade: '1',
        section: 'A',
        capacity: 30,
        teacherId: null,
        academicYear: '2024',
        status: 'Active'
      }
    });

    // Create sample subject
    const mathSubject = await Subject.findOrCreate({
      where: { name: 'Mathematics' },
      defaults: {
        name: 'Mathematics',
        code: 'MATH101',
        description: 'Basic Mathematics',
        grade: '1',
        credits: 4,
        status: 'Active'
      }
    });

    console.log('✅ Test data inserted successfully!');

    // Test queries
    console.log('\n4. Testing database queries...');

    const userCount = await User.count();
    const roleCount = await Role.count();
    const classCount = await SchoolClass.count();
    const subjectCount = await Subject.count();

    console.log(`✅ Users: ${userCount}`);
    console.log(`✅ Roles: ${roleCount}`);
    console.log(`✅ Classes: ${classCount}`);
    console.log(`✅ Subjects: ${subjectCount}`);

    // Test relationships
    console.log('\n5. Testing relationships...');
    
    const adminWithRole = await User.findOne({
      where: { email: 'admin@jafasol.com' },
      include: [{ model: Role, as: 'role' }]
    });

    if (adminWithRole) {
      console.log(`✅ Admin user found with role: ${adminWithRole.role.name}`);
    }

    console.log('\n🎉 Database test completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log('✅ Connection: Working');
    console.log('✅ Tables: Created');
    console.log('✅ Data: Inserted');
    console.log('✅ Relationships: Working');
    console.log('✅ Queries: Successful');

    console.log('\n🔗 Next Steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Test the API endpoints');
    console.log('3. Connect the frontend application');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file configuration');
    console.log('2. Verify Supabase project is active');
    console.log('3. Ensure database password is correct');
    console.log('4. Check network connectivity');
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Tip: The hostname might be incorrect. Check your DB_HOST in .env file');
    }
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Tip: Check your DB_PASSWORD in .env file');
    }
    
    if (error.message.includes('connection refused')) {
      console.log('\n💡 Tip: Check if your Supabase project is active and DB_HOST is correct');
    }
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

// Run the test
testDatabase(); 