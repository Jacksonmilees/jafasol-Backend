const mongoose = require('mongoose');
const { connectDB } = require('./config/database');

// Import models
const User = require('./models/User');
const School = require('./models/School');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const SchoolClass = require('./models/SchoolClass');
const Subject = require('./models/Subject');
const FeeStructure = require('./models/FeeStructure');
const FeeInvoice = require('./models/FeeInvoice');
const FeePayment = require('./models/FeePayment');
const AttendanceRecord = require('./models/AttendanceRecord');
const Exam = require('./models/Exam');
const Book = require('./models/Book');
const BookIssue = require('./models/BookIssue');
const LearningResource = require('./models/LearningResource');
const Message = require('./models/Message');
const TimetableEntry = require('./models/TimetableEntry');
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
      createdAt: new Date('2024-01-15')
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
      createdAt: new Date('2024-02-01')
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
      createdAt: new Date('2024-03-01')
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
      schoolId: '1', // Will be updated after school creation
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
      schoolId: '1',
      status: 'active',
      avatarUrl: 'https://picsum.photos/seed/michael/200/200'
    },
    {
      name: 'Emily Davis',
      email: 'emily.davis@stmarys.edu',
      phone: '+254700222222',
      subject: 'English',
      schoolId: '1',
      status: 'active',
      avatarUrl: 'https://picsum.photos/seed/emily/200/200'
    },
    {
      name: 'David Wilson',
      email: 'david.wilson@brightfuture.edu',
      phone: '+254700333333',
      subject: 'Science',
      schoolId: '2',
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
      schoolId: '1',
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
      schoolId: '1',
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
      schoolId: '2',
      parentName: 'James Brown',
      parentPhone: '+254700999999',
      status: 'active',
      avatarUrl: 'https://picsum.photos/seed/carol/200/200'
    }
  ],

  subjects: [
    { name: 'Mathematics', code: 'MATH', schoolId: '1' },
    { name: 'English', code: 'ENG', schoolId: '1' },
    { name: 'Science', code: 'SCI', schoolId: '1' },
    { name: 'History', code: 'HIST', schoolId: '1' },
    { name: 'Mathematics', code: 'MATH', schoolId: '2' },
    { name: 'English', code: 'ENG', schoolId: '2' },
    { name: 'Science', code: 'SCI', schoolId: '2' }
  ],

  classes: [
    { name: 'Class 10A', grade: '10', schoolId: '1', teacherId: '1' },
    { name: 'Class 11B', grade: '11', schoolId: '1', teacherId: '2' },
    { name: 'Class 9A', grade: '9', schoolId: '2', teacherId: '3' }
  ],

  feeStructures: [
    {
      name: 'Standard Fees 2024',
      schoolId: '1',
      academicYear: '2024',
      fees: [
        { name: 'Tuition Fee', amount: 50000, frequency: 'term' },
        { name: 'Library Fee', amount: 5000, frequency: 'year' },
        { name: 'Sports Fee', amount: 3000, frequency: 'year' }
      ]
    },
    {
      name: 'Standard Fees 2024',
      schoolId: '2',
      academicYear: '2024',
      fees: [
        { name: 'Tuition Fee', amount: 40000, frequency: 'term' },
        { name: 'Library Fee', amount: 4000, frequency: 'year' }
      ]
    }
  ],

  books: [
    {
      title: 'Advanced Mathematics',
      author: 'John Smith',
      isbn: '978-1234567890',
      category: 'Mathematics',
      schoolId: '1',
      copies: 10,
      availableCopies: 8
    },
    {
      title: 'English Literature',
      author: 'Jane Doe',
      isbn: '978-0987654321',
      category: 'English',
      schoolId: '1',
      copies: 15,
      availableCopies: 12
    },
    {
      title: 'Physics Fundamentals',
      author: 'Robert Wilson',
      isbn: '978-1122334455',
      category: 'Science',
      schoolId: '2',
      copies: 8,
      availableCopies: 6
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
      FeeStructure.deleteMany({}),
      FeeInvoice.deleteMany({}),
      FeePayment.deleteMany({}),
      AttendanceRecord.deleteMany({}),
      Exam.deleteMany({}),
      Book.deleteMany({}),
      BookIssue.deleteMany({}),
      LearningResource.deleteMany({}),
      Message.deleteMany({}),
      TimetableEntry.deleteMany({}),
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
      if (subject.schoolId === '1') {
        subject.schoolId = schools[0]._id;
      } else if (subject.schoolId === '2') {
        subject.schoolId = schools[1]._id;
      }
      return subject;
    });

    // Seed subjects
    console.log('📚 Seeding subjects...');
    const subjects = await Subject.insertMany(updatedSubjects);
    console.log(`✅ Created ${subjects.length} subjects`);

    // Update classes with school and teacher IDs
    const updatedClasses = sampleData.classes.map(cls => {
      if (cls.schoolId === '1') {
        cls.schoolId = schools[0]._id;
        cls.teacherId = teachers[0]._id;
      } else if (cls.schoolId === '2') {
        cls.schoolId = schools[1]._id;
        cls.teacherId = teachers[2]._id;
      }
      return cls;
    });

    // Seed classes
    console.log('🏫 Seeding classes...');
    const classes = await SchoolClass.insertMany(updatedClasses);
    console.log(`✅ Created ${classes.length} classes`);

    // Update fee structures with school IDs
    const updatedFeeStructures = sampleData.feeStructures.map(structure => {
      if (structure.schoolId === '1') {
        structure.schoolId = schools[0]._id;
      } else if (structure.schoolId === '2') {
        structure.schoolId = schools[1]._id;
      }
      return structure;
    });

    // Seed fee structures
    console.log('💰 Seeding fee structures...');
    const feeStructures = await FeeStructure.insertMany(updatedFeeStructures);
    console.log(`✅ Created ${feeStructures.length} fee structures`);

    // Update books with school IDs
    const updatedBooks = sampleData.books.map(book => {
      if (book.schoolId === '1') {
        book.schoolId = schools[0]._id;
      } else if (book.schoolId === '2') {
        book.schoolId = schools[1]._id;
      }
      return book;
    });

    // Seed books
    console.log('📖 Seeding books...');
    const books = await Book.insertMany(updatedBooks);
    console.log(`✅ Created ${books.length} books`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${schools.length} schools`);
    console.log(`- ${users.length} users`);
    console.log(`- ${teachers.length} teachers`);
    console.log(`- ${students.length} students`);
    console.log(`- ${subjects.length} subjects`);
    console.log(`- ${classes.length} classes`);
    console.log(`- ${feeStructures.length} fee structures`);
    console.log(`- ${books.length} books`);

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