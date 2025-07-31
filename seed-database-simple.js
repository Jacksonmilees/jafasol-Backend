const mongoose = require('mongoose');
const { connectDB } = require('./config/database');

// Import only Mongoose models
const User = require('./models/User');
const School = require('./models/School');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const SchoolClass = require('./models/SchoolClass');
const Subject = require('./models/Subject');
const Book = require('./models/Book');
const Message = require('./models/Message');
const AuditLog = require('./models/AuditLog');
const Role = require('./models/Role');

// Sample data for seeding
const sampleData = {
  roles: [
    { name: 'admin', permissions: ['all'] },
    { name: 'school_admin', permissions: ['school_management', 'user_management', 'reports'] },
    { name: 'teacher', permissions: ['class_management', 'attendance', 'grades'] },
    { name: 'student', permissions: ['view_grades', 'view_attendance'] },
    { name: 'parent', permissions: ['view_child_grades', 'view_child_attendance'] }
  ],
  
  schools: [
    {
      name: 'St. Mary\'s Academy',
      email: 'admin@stmarys.edu',
      phone: '+254700123456',
      address: 'Nairobi, Kenya',
      logoUrl: 'https://picsum.photos/seed/stmarys/200/200',
      plan: 'Premium',
      status: 'Active',
      subdomain: 'stmarys',
      storageUsage: 25,
      modules: ['attendance', 'fees', 'academics', 'analytics', 'communication'],
      stats: {
        totalStudents: 120,
        totalTeachers: 30,
        totalClasses: 8,
        monthlyRevenue: 50000,
        lastActive: new Date()
      }
    },
    {
      name: 'Bright Future School',
      email: 'admin@brightfuture.edu',
      phone: '+254700654321',
      address: 'Mombasa, Kenya',
      logoUrl: 'https://picsum.photos/seed/brightfuture/200/200',
      plan: 'Basic',
      status: 'Active',
      subdomain: 'brightfuture',
      storageUsage: 15,
      modules: ['attendance', 'fees', 'academics'],
      stats: {
        totalStudents: 80,
        totalTeachers: 15,
        totalClasses: 6,
        monthlyRevenue: 30000,
        lastActive: new Date()
      }
    },
    {
      name: 'Excellence Academy',
      email: 'admin@excellence.edu',
      phone: '+254700789012',
      address: 'Kisumu, Kenya',
      logoUrl: 'https://picsum.photos/seed/excellence/200/200',
      plan: 'Enterprise',
      status: 'Active',
      subdomain: 'excellence',
      storageUsage: 40,
      modules: ['attendance', 'fees', 'academics', 'analytics', 'communication', 'transport', 'library'],
      stats: {
        totalStudents: 200,
        totalTeachers: 25,
        totalClasses: 12,
        monthlyRevenue: 80000,
        lastActive: new Date()
      }
    }
  ],

  users: [
    {
      name: 'John Admin',
      email: 'admin@jafasol.com',
      password: '$2b$10$example.hash.for.admin',
      role: 'admin',
      status: 'active',
      lastLogin: new Date('2024-07-30T10:00:00Z'),
      avatarUrl: 'https://picsum.photos/seed/admin/200/200'
    },
    {
      name: 'Sarah Principal',
      email: 'principal@stmarys.edu',
      password: '$2b$10$example.hash.for.principal',
      role: 'school_admin',
      status: 'active',
      lastLogin: new Date('2024-07-30T09:00:00Z'),
      avatarUrl: 'https://picsum.photos/seed/sarah/200/200'
    }
  ],

  teachers: [
    {
      name: 'Michael Johnson',
      email: 'michael.johnson@stmarys.edu',
      phone: '+254700111111',
      subject: 'Mathematics',
      status: 'active',
      avatarUrl: 'https://picsum.photos/seed/michael/200/200'
    },
    {
      name: 'Emily Davis',
      email: 'emily.davis@stmarys.edu',
      phone: '+254700222222',
      subject: 'English',
      status: 'active',
      avatarUrl: 'https://picsum.photos/seed/emily/200/200'
    },
    {
      name: 'David Wilson',
      email: 'david.wilson@brightfuture.edu',
      phone: '+254700333333',
      subject: 'Science',
      status: 'active',
      avatarUrl: 'https://picsum.photos/seed/david/200/200'
    }
  ],

  students: [
    {
      name: 'Alice Johnson',
      email: 'alice.johnson@student.stmarys.edu',
      phone: '+254700444444',
      grade: '10',
      parentName: 'Robert Johnson',
      parentPhone: '+254700555555',
      status: 'active',
      avatarUrl: 'https://picsum.photos/seed/alice/200/200'
    },
    {
      name: 'Bob Smith',
      email: 'bob.smith@student.stmarys.edu',
      phone: '+254700666666',
      grade: '11',
      parentName: 'Mary Smith',
      parentPhone: '+254700777777',
      status: 'active',
      avatarUrl: 'https://picsum.photos/seed/bob/200/200'
    },
    {
      name: 'Carol Brown',
      email: 'carol.brown@student.brightfuture.edu',
      phone: '+254700888888',
      grade: '9',
      parentName: 'James Brown',
      parentPhone: '+254700999999',
      status: 'active',
      avatarUrl: 'https://picsum.photos/seed/carol/200/200'
    }
  ],

  subjects: [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English', code: 'ENG' },
    { name: 'Science', code: 'SCI' },
    { name: 'History', code: 'HIST' },
    { name: 'Geography', code: 'GEO' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Chemistry', code: 'CHEM' },
    { name: 'Biology', code: 'BIO' }
  ],

  classes: [
    { name: 'Class 10A', grade: '10', teacherId: '1' },
    { name: 'Class 11B', grade: '11', teacherId: '2' },
    { name: 'Class 9A', grade: '9', teacherId: '3' }
  ],

  books: [
    {
      title: 'Advanced Mathematics',
      author: 'John Smith',
      isbn: '978-1234567890',
      category: 'Mathematics',
      copies: 10,
      availableCopies: 8
    },
    {
      title: 'English Literature',
      author: 'Jane Doe',
      isbn: '978-0987654321',
      category: 'English',
      copies: 15,
      availableCopies: 12
    },
    {
      title: 'Physics Fundamentals',
      author: 'Robert Wilson',
      isbn: '978-1122334455',
      category: 'Science',
      copies: 8,
      availableCopies: 6
    }
  ],

  messages: [
    {
      sender: 'School Admin',
      recipient: 'Support Team',
      subject: 'Login Issue',
      content: 'Unable to access the portal',
      type: 'support',
      status: 'open',
      priority: 'high'
    },
    {
      sender: 'School Admin',
      recipient: 'Support Team',
      subject: 'Payment Problem',
      content: 'Payment not processing',
      type: 'support',
      status: 'in_progress',
      priority: 'medium'
    }
  ],

  auditLogs: [
    {
      action: 'LOGIN',
      userId: 'admin',
      details: 'Admin logged in successfully',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      action: 'SCHOOL_CREATED',
      userId: 'admin',
      details: 'New school "Excellence Academy" created',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      action: 'USER_UPDATED',
      userId: 'admin',
      details: 'User profile updated',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  ]
};

// Seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      School.deleteMany({}),
      Student.deleteMany({}),
      Teacher.deleteMany({}),
      Subject.deleteMany({}),
      SchoolClass.deleteMany({}),
      Book.deleteMany({}),
      Message.deleteMany({}),
      AuditLog.deleteMany({}),
      Role.deleteMany({})
    ]);

    // Seed roles
    console.log('👥 Seeding roles...');
    const roles = await Role.insertMany(sampleData.roles);
    console.log(`✅ Created ${roles.length} roles`);

    // Seed schools
    console.log('🏫 Seeding schools...');
    const schools = await School.insertMany(sampleData.schools);
    console.log(`✅ Created ${schools.length} schools`);

    // Update user data with school IDs
    const updatedUsers = sampleData.users.map(user => {
      if (user.email.includes('stmarys')) {
        user.schoolId = schools[0]._id;
      } else if (user.email.includes('brightfuture')) {
        user.schoolId = schools[1]._id;
      }
      return user;
    });

    // Seed users
    console.log('👤 Seeding users...');
    const users = await User.insertMany(updatedUsers);
    console.log(`✅ Created ${users.length} users`);

    // Update teacher and student data with school IDs
    const updatedTeachers = sampleData.teachers.map(teacher => {
      if (teacher.email.includes('stmarys')) {
        teacher.schoolId = schools[0]._id;
      } else if (teacher.email.includes('brightfuture')) {
        teacher.schoolId = schools[1]._id;
      }
      return teacher;
    });

    const updatedStudents = sampleData.students.map(student => {
      if (student.email.includes('stmarys')) {
        student.schoolId = schools[0]._id;
      } else if (student.email.includes('brightfuture')) {
        student.schoolId = schools[1]._id;
      }
      return student;
    });

    // Seed teachers
    console.log('👨‍🏫 Seeding teachers...');
    const teachers = await Teacher.insertMany(updatedTeachers);
    console.log(`✅ Created ${teachers.length} teachers`);

    // Seed students
    console.log('👨‍🎓 Seeding students...');
    const students = await Student.insertMany(updatedStudents);
    console.log(`✅ Created ${students.length} students`);

    // Update subjects with school IDs
    const updatedSubjects = sampleData.subjects.map(subject => {
      // Assign subjects to first school for simplicity
      subject.schoolId = schools[0]._id;
      return subject;
    });

    // Seed subjects
    console.log('📚 Seeding subjects...');
    const subjects = await Subject.insertMany(updatedSubjects);
    console.log(`✅ Created ${subjects.length} subjects`);

    // Update classes with school and teacher IDs
    const updatedClasses = sampleData.classes.map((cls, index) => {
      cls.schoolId = schools[0]._id; // Assign to first school
      cls.teacherId = teachers[index] ? teachers[index]._id : teachers[0]._id;
      return cls;
    });

    // Seed classes
    console.log('🏫 Seeding classes...');
    const classes = await SchoolClass.insertMany(updatedClasses);
    console.log(`✅ Created ${classes.length} classes`);

    // Update books with school IDs
    const updatedBooks = sampleData.books.map(book => {
      book.schoolId = schools[0]._id; // Assign to first school
      return book;
    });

    // Seed books
    console.log('📖 Seeding books...');
    const books = await Book.insertMany(updatedBooks);
    console.log(`✅ Created ${books.length} books`);

    // Update messages with school IDs
    const updatedMessages = sampleData.messages.map(message => {
      message.schoolId = schools[0]._id; // Assign to first school
      return message;
    });

    // Seed messages
    console.log('💬 Seeding messages...');
    const messages = await Message.insertMany(updatedMessages);
    console.log(`✅ Created ${messages.length} messages`);

    // Update audit logs with user IDs
    const updatedAuditLogs = sampleData.auditLogs.map(log => {
      log.userId = users[0]._id; // Assign to admin user
      return log;
    });

    // Seed audit logs
    console.log('📝 Seeding audit logs...');
    const auditLogs = await AuditLog.insertMany(updatedAuditLogs);
    console.log(`✅ Created ${auditLogs.length} audit logs`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${schools.length} schools`);
    console.log(`- ${users.length} users`);
    console.log(`- ${teachers.length} teachers`);
    console.log(`- ${students.length} students`);
    console.log(`- ${subjects.length} subjects`);
    console.log(`- ${classes.length} classes`);
    console.log(`- ${books.length} books`);
    console.log(`- ${messages.length} messages`);
    console.log(`- ${auditLogs.length} audit logs`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase }; 