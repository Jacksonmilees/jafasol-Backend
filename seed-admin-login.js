const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/database');
const multiTenantManager = require('./config/multiTenant');

// Enhanced seeding script
async function seedAdminAndInitialData() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

    // Get default connection for system-wide operations
    const defaultConnection = await multiTenantManager.getDefaultConnection();

    // Create Role model
    const roleSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      description: String,
      permissions: [String],
      isSystem: { type: Boolean, default: false }
    });
    const Role = defaultConnection.model('Role', roleSchema);

    // Create User model for system database
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
      status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
      avatarUrl: String,
      twoFactorEnabled: { type: Boolean, default: false },
      lastLoginAt: Date
    });

    // Hash password middleware
    userSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      this.password = await bcrypt.hash(this.password, 12);
      next();
    });

    const User = defaultConnection.model('User', userSchema);

    // Create system roles
    console.log('📝 Creating system roles...');
    const roles = [
      {
        name: 'SuperAdmin',
        description: 'System super administrator with full access',
        permissions: ['*'],
        isSystem: true
      },
      {
        name: 'Admin',
        description: 'School administrator',
        permissions: ['school_management', 'user_management', 'reports'],
        isSystem: true
      },
      {
        name: 'Teacher',
        description: 'School teacher',
        permissions: ['class_management', 'attendance', 'grades'],
        isSystem: true
      },
      {
        name: 'Student',
        description: 'School student',
        permissions: ['view_grades', 'view_schedule'],
        isSystem: true
      },
      {
        name: 'Parent',
        description: 'Student parent',
        permissions: ['view_child_grades', 'view_child_attendance'],
        isSystem: true
      }
    ];

    // Clear existing roles and create new ones
    await Role.deleteMany({});
    const createdRoles = await Role.insertMany(roles);
    console.log('✅ System roles created');

    // Create super admin user
    console.log('👤 Creating super admin user...');
    const superAdminRole = createdRoles.find(r => r.name === 'SuperAdmin');
    
    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@jafasol.com' });
    if (existingAdmin) {
      console.log('⚠️ Super admin already exists, updating...');
      existingAdmin.password = 'Jafasol2024!';
      existingAdmin.roleId = superAdminRole._id;
      existingAdmin.status = 'Active';
      await existingAdmin.save();
    } else {
      const superAdmin = new User({
        name: 'Super Administrator',
        email: 'admin@jafasol.com',
        password: 'Jafasol2024!',
        roleId: superAdminRole._id,
        status: 'Active',
        avatarUrl: 'https://ui-avatars.com/api/?name=Super+Admin&background=0D9488&color=fff'
      });
      await superAdmin.save();
    }

    // Create additional admin users
    const adminUsers = [
      {
        name: 'System Administrator',
        email: 'system@jafasol.com',
        password: 'System2024!',
        role: 'SuperAdmin'
      },
      {
        name: 'Demo School Admin',
        email: 'demo@jafasol.com',
        password: 'Demo2024!',
        role: 'Admin'
      }
    ];

    for (const userData of adminUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const role = createdRoles.find(r => r.name === userData.role);
        const user = new User({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          roleId: role._id,
          status: 'Active',
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D9488&color=fff`
        });
        await user.save();
        console.log(`✅ Created ${userData.role} user: ${userData.email}`);
      }
    }

    // Create sample schools with tenants
    console.log('🏫 Creating sample schools...');
    const sampleSchools = [
      {
        name: 'Demo Academy',
        email: 'info@demoacademy.com',
        phone: '+254700000001',
        subdomain: 'demoacademy',
        plan: 'Premium',
        timezone: 'Africa/Nairobi',
        language: 'en',
        academicYear: '2024-2025'
      },
      {
        name: 'Test School',
        email: 'admin@testschool.com',
        phone: '+254700000002',
        subdomain: 'testschool',
        plan: 'Basic',
        timezone: 'Africa/Nairobi',
        language: 'en',
        academicYear: '2024-2025'
      }
    ];

    for (const schoolData of sampleSchools) {
      try {
        const tenantId = `school_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create tenant
        const tenant = await multiTenantManager.createTenant(tenantId, {
          name: schoolData.name,
          domain: `${schoolData.subdomain}.jafasol.com`,
          contactEmail: schoolData.email,
          contactPhone: schoolData.phone,
          subscriptionPlan: schoolData.plan,
          settings: {
            timezone: schoolData.timezone,
            language: schoolData.language,
            academicYear: schoolData.academicYear
          }
        });

        // Initialize school data
        await initializeSchoolData(tenantId, schoolData);

        console.log(`✅ Created school tenant: ${schoolData.name} (${tenantId})`);
      } catch (error) {
        console.error(`❌ Failed to create school ${schoolData.name}:`, error.message);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Super Admin: admin@jafasol.com / Jafasol2024!');
    console.log('System Admin: system@jafasol.com / System2024!');
    console.log('Demo Admin: demo@jafasol.com / Demo2024!');
    console.log('\n🌐 Access URLs:');
    console.log('Main Admin: https://jafasol.com/admin');
    console.log('Demo School: https://demoacademy.jafasol.com');
    console.log('Test School: https://testschool.jafasol.com');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Initialize school data
async function initializeSchoolData(tenantId, schoolData) {
  const connection = await multiTenantManager.getTenantConnection(tenantId);
  
  // Create school-specific models
  const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    studentId: { type: String, required: true, unique: true },
    class: String,
    section: String,
    parentPhone: String,
    status: { type: String, default: 'Active' }
  });

  const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    subjects: [String],
    status: { type: String, default: 'Active' }
  });

  const classSchema = new mongoose.Schema({
    name: { type: String, required: true },
    section: String,
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    subjects: [String],
    academicYear: String
  });

  // Create models
  const Student = connection.model('Student', studentSchema);
  const Teacher = connection.model('Teacher', teacherSchema);
  const Class = connection.model('Class', classSchema);

  // Add sample data
  const sampleStudents = [
    { name: 'John Doe', email: 'john@demoacademy.com', studentId: 'ST001', class: '10', section: 'A' },
    { name: 'Jane Smith', email: 'jane@demoacademy.com', studentId: 'ST002', class: '10', section: 'A' }
  ];

  const sampleTeachers = [
    { name: 'Mr. Johnson', email: 'johnson@demoacademy.com', subjects: ['Mathematics', 'Physics'] },
    { name: 'Ms. Williams', email: 'williams@demoacademy.com', subjects: ['English', 'Literature'] }
  ];

  await Student.insertMany(sampleStudents);
  await Teacher.insertMany(sampleTeachers);
}

// Run seeding
if (require.main === module) {
  seedAdminAndInitialData()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAdminAndInitialData }; 