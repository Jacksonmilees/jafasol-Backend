const mongoose = require('mongoose');
const { connectDB } = require('./config/database');

// Import only Mongoose models that exist
const User = require('./models/User');
const School = require('./models/School');
const Role = require('./models/Role');
const AuditLog = require('./models/AuditLog');

// Sample data for seeding
const sampleData = {
  roles: [
    { 
      name: 'Admin', 
      description: 'System administrator with full access',
      permissions: {
        'all': ['read', 'write', 'delete'],
        'users': ['read', 'write', 'delete'],
        'schools': ['read', 'write', 'delete'],
        'reports': ['read', 'write']
      }
    },
    { 
      name: 'Teacher', 
      description: 'Teacher with class management permissions',
      permissions: {
        'classes': ['read', 'write'],
        'students': ['read'],
        'attendance': ['read', 'write'],
        'grades': ['read', 'write']
      }
    },
    { 
      name: 'Student', 
      description: 'Student with limited access',
      permissions: {
        'grades': ['read'],
        'attendance': ['read'],
        'schedule': ['read']
      }
    },
    { 
      name: 'Parent', 
      description: 'Parent with child-related access',
      permissions: {
        'child_grades': ['read'],
        'child_attendance': ['read'],
        'child_schedule': ['read']
      }
    },
    { 
      name: 'Staff', 
      description: 'School staff with administrative access',
      permissions: {
        'students': ['read', 'write'],
        'fees': ['read', 'write'],
        'reports': ['read']
      }
    }
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
      password: 'admin123',
      status: 'Active',
      lastLoginAt: new Date('2024-07-30T10:00:00Z'),
      avatarUrl: 'https://picsum.photos/seed/admin/200/200'
    },
    {
      name: 'Sarah Principal',
      email: 'principal@stmarys.edu',
      password: 'principal123',
      status: 'Active',
      lastLoginAt: new Date('2024-07-30T09:00:00Z'),
      avatarUrl: 'https://picsum.photos/seed/sarah/200/200'
    }
  ],

  auditLogs: [
    {
      action: 'LOGIN',
      resource: 'AUTH',
      details: 'Admin logged in successfully',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      action: 'SCHOOL_CREATED',
      resource: 'SCHOOL',
      details: 'New school "Excellence Academy" created',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      action: 'USER_UPDATED',
      resource: 'USER',
      details: 'User profile updated',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  ]
};

// Seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting minimal database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      School.deleteMany({}),
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
    // Seed users
    console.log('👤 Seeding users...');
    
    // Get the Admin role for the first user
    const adminRole = roles.find(r => r.name === 'Admin');
    const staffRole = roles.find(r => r.name === 'Staff');
    
    const updatedUsers = sampleData.users.map((user, index) => {
      if (user.email.includes('stmarys')) {
        user.schoolId = schools[0]._id;
        user.roleId = staffRole._id; // Assign Staff role
      } else {
        user.roleId = adminRole._id; // Assign Admin role
      }
      return user;
    });
    
    const users = await User.insertMany(updatedUsers);
    console.log(`✅ Created ${users.length} users`);

    // Update audit logs with user IDs
    const updatedAuditLogs = sampleData.auditLogs.map(log => {
      log.userId = users[0]._id; // Assign to admin user
      return log;
    });

    // Seed audit logs
    console.log('📝 Seeding audit logs...');
    const auditLogs = await AuditLog.insertMany(updatedAuditLogs);
    console.log(`✅ Created ${auditLogs.length} audit logs`);

    console.log('🎉 Minimal database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${schools.length} schools`);
    console.log(`- ${users.length} users`);
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
      console.log('✅ Minimal seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase }; 