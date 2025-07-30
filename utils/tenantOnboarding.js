const bcrypt = require('bcryptjs');
const multiTenantManager = require('../config/multiTenant');

class TenantOnboarding {
  constructor() {
    this.defaultRoles = [
      {
        name: 'Super Admin',
        description: 'Full system access and control',
        permissions: [
          'users:create', 'users:read', 'users:update', 'users:delete',
          'students:create', 'students:read', 'students:update', 'students:delete',
          'teachers:create', 'teachers:read', 'teachers:update', 'teachers:delete',
          'classes:create', 'classes:read', 'classes:update', 'classes:delete',
          'subjects:create', 'subjects:read', 'subjects:update', 'subjects:delete',
          'exams:create', 'exams:read', 'exams:update', 'exams:delete',
          'fees:create', 'fees:read', 'fees:update', 'fees:delete',
          'attendance:create', 'attendance:read', 'attendance:update', 'attendance:delete',
          'reports:read', 'settings:update', 'system:admin'
        ]
      },
      {
        name: 'Administrator',
        description: 'School administration and management',
        permissions: [
          'users:create', 'users:read', 'users:update',
          'students:create', 'students:read', 'students:update', 'students:delete',
          'teachers:create', 'teachers:read', 'teachers:update', 'teachers:delete',
          'classes:create', 'classes:read', 'classes:update', 'classes:delete',
          'subjects:create', 'subjects:read', 'subjects:update', 'subjects:delete',
          'exams:create', 'exams:read', 'exams:update', 'exams:delete',
          'fees:create', 'fees:read', 'fees:update', 'fees:delete',
          'attendance:create', 'attendance:read', 'attendance:update', 'attendance:delete',
          'reports:read'
        ]
      },
      {
        name: 'Teacher',
        description: 'Class and subject management',
        permissions: [
          'students:read', 'students:update',
          'classes:read', 'subjects:read',
          'exams:create', 'exams:read', 'exams:update',
          'attendance:create', 'attendance:read', 'attendance:update',
          'reports:read'
        ]
      },
      {
        name: 'Student',
        description: 'Student access to their own data',
        permissions: [
          'profile:read', 'profile:update',
          'grades:read', 'attendance:read',
          'fees:read'
        ]
      },
      {
        name: 'Parent',
        description: 'Parent access to child information',
        permissions: [
          'children:read', 'grades:read',
          'attendance:read', 'fees:read'
        ]
      }
    ];

    this.defaultSubjects = [
      { name: 'Mathematics', code: 'MATH', description: 'Core mathematics curriculum' },
      { name: 'English', code: 'ENG', description: 'English language and literature' },
      { name: 'Science', code: 'SCI', description: 'General science studies' },
      { name: 'History', code: 'HIST', description: 'World and local history' },
      { name: 'Geography', code: 'GEO', description: 'Physical and human geography' },
      { name: 'Computer Science', code: 'CS', description: 'Programming and technology' },
      { name: 'Physical Education', code: 'PE', description: 'Sports and fitness' },
      { name: 'Art', code: 'ART', description: 'Creative arts and design' },
      { name: 'Music', code: 'MUSIC', description: 'Musical education' },
      { name: 'Business Studies', code: 'BUS', description: 'Business and economics' }
    ];

    this.defaultClasses = [
      { name: 'Form 1', grade: 1, description: 'First year students' },
      { name: 'Form 2', grade: 2, description: 'Second year students' },
      { name: 'Form 3', grade: 3, description: 'Third year students' },
      { name: 'Form 4', grade: 4, description: 'Fourth year students' }
    ];
  }

  // Main onboarding function
  async onboardTenant(tenantId, tenantInfo) {
    try {
      console.log(`🚀 Starting onboarding for tenant: ${tenantId}`);
      
      // Get tenant connection
      const connection = await multiTenantManager.getTenantConnection(tenantId);
      
      // Step 1: Create default roles
      const roles = await this.createDefaultRoles(connection);
      console.log(`✅ Created ${roles.length} default roles`);
      
      // Step 2: Create default subjects
      const subjects = await this.createDefaultSubjects(connection);
      console.log(`✅ Created ${subjects.length} default subjects`);
      
      // Step 3: Create default classes
      const classes = await this.createDefaultClasses(connection);
      console.log(`✅ Created ${classes.length} default classes`);
      
      // Step 4: Create super admin user
      const superAdmin = await this.createSuperAdmin(connection, tenantInfo);
      console.log(`✅ Created super admin user: ${superAdmin.email}`);
      
      // Step 5: Create system settings
      const settings = await this.createSystemSettings(connection, tenantInfo);
      console.log(`✅ Created system settings`);
      
      // Step 6: Create default fee structure
      const feeStructure = await this.createDefaultFeeStructure(connection);
      console.log(`✅ Created default fee structure`);
      
      console.log(`🎉 Tenant ${tenantId} onboarding completed successfully!`);
      
      return {
        success: true,
        tenantId,
        roles: roles.length,
        subjects: subjects.length,
        classes: classes.length,
        superAdmin: superAdmin.email,
        settings: settings
      };
      
    } catch (error) {
      console.error(`❌ Tenant onboarding failed for ${tenantId}:`, error);
      throw error;
    }
  }

  // Create default roles
  async createDefaultRoles(connection) {
    const Role = connection.model('Role', require('../models/Role').schema);
    const roles = [];
    
    for (const roleData of this.defaultRoles) {
      const role = new Role(roleData);
      await role.save();
      roles.push(role);
    }
    
    return roles;
  }

  // Create default subjects
  async createDefaultSubjects(connection) {
    const Subject = connection.model('Subject', require('../models/Subject').schema);
    const subjects = [];
    
    for (const subjectData of this.defaultSubjects) {
      const subject = new Subject(subjectData);
      await subject.save();
      subjects.push(subject);
    }
    
    return subjects;
  }

  // Create default classes
  async createDefaultClasses(connection) {
    const SchoolClass = connection.model('SchoolClass', require('../models/SchoolClass').schema);
    const classes = [];
    
    for (const classData of this.defaultClasses) {
      const schoolClass = new SchoolClass(classData);
      await schoolClass.save();
      classes.push(schoolClass);
    }
    
    return classes;
  }

  // Create super admin user
  async createSuperAdmin(connection, tenantInfo) {
    const User = connection.model('User', require('../models/User').schema);
    const Role = connection.model('Role', require('../models/Role').schema);
    
    // Get super admin role
    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      throw new Error('Super Admin role not found');
    }
    
    // Generate default password
    const defaultPassword = 'admin123'; // Should be changed on first login
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    // Create super admin user
    const superAdmin = new User({
      name: 'System Administrator',
      email: `admin@${tenantInfo.domain || tenantInfo.tenantId}.com`,
      password: hashedPassword,
      roleId: superAdminRole._id,
      status: 'Active',
      twoFactorEnabled: false
    });
    
    await superAdmin.save();
    
    return {
      ...superAdmin.toObject(),
      defaultPassword // Return for initial setup
    };
  }

  // Create system settings
  async createSystemSettings(connection, tenantInfo) {
    const settings = {
      schoolName: tenantInfo.name,
      schoolAddress: tenantInfo.address || '',
      schoolPhone: tenantInfo.contactPhone || '',
      schoolEmail: tenantInfo.contactEmail || '',
      academicYear: new Date().getFullYear(),
      term: 1,
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      dateFormat: 'DD/MM/YYYY',
      maxStudentsPerClass: 40,
      attendanceRequired: true,
      feeReminders: true,
      smsNotifications: false,
      emailNotifications: true,
      systemTheme: 'default',
      language: 'en',
      createdBy: 'system',
      createdAt: new Date()
    };
    
    // Store settings in tenant database
    const db = connection.connection.db;
    await db.collection('settings').insertOne(settings);
    
    return settings;
  }

  // Create default fee structure
  async createDefaultFeeStructure(connection) {
    const FeeStructure = connection.model('FeeStructure', require('../models/FeeStructure').schema);
    
    const defaultFees = [
      {
        name: 'Tuition Fee',
        description: 'Standard tuition fee per term',
        amount: 15000,
        frequency: 'per_term',
        isRequired: true,
        category: 'tuition'
      },
      {
        name: 'Development Fee',
        description: 'School development and maintenance',
        amount: 5000,
        frequency: 'per_year',
        isRequired: true,
        category: 'development'
      },
      {
        name: 'Library Fee',
        description: 'Library and learning resources',
        amount: 2000,
        frequency: 'per_year',
        isRequired: false,
        category: 'library'
      },
      {
        name: 'Sports Fee',
        description: 'Sports facilities and activities',
        amount: 1500,
        frequency: 'per_year',
        isRequired: false,
        category: 'sports'
      }
    ];
    
    const feeStructures = [];
    for (const feeData of defaultFees) {
      const feeStructure = new FeeStructure(feeData);
      await feeStructure.save();
      feeStructures.push(feeStructure);
    }
    
    return feeStructures;
  }

  // Get onboarding status
  async getOnboardingStatus(tenantId) {
    try {
      const connection = await multiTenantManager.getTenantConnection(tenantId);
      
      const Role = connection.model('Role', require('../models/Role').schema);
      const User = connection.model('User', require('../models/User').schema);
      const Subject = connection.model('Subject', require('../models/Subject').schema);
      const SchoolClass = connection.model('SchoolClass', require('../models/SchoolClass').schema);
      
      const [roles, users, subjects, classes] = await Promise.all([
        Role.countDocuments(),
        User.countDocuments(),
        Subject.countDocuments(),
        SchoolClass.countDocuments()
      ]);
      
      return {
        tenantId,
        roles,
        users,
        subjects,
        classes,
        isOnboarded: roles > 0 && users > 0
      };
    } catch (error) {
      console.error(`Error getting onboarding status for ${tenantId}:`, error);
      return {
        tenantId,
        roles: 0,
        users: 0,
        subjects: 0,
        classes: 0,
        isOnboarded: false,
        error: error.message
      };
    }
  }

  // Reset tenant data (for testing)
  async resetTenant(tenantId) {
    try {
      const connection = await multiTenantManager.getTenantConnection(tenantId);
      await connection.connection.db.dropDatabase();
      console.log(`✅ Reset tenant ${tenantId} data`);
    } catch (error) {
      console.error(`❌ Failed to reset tenant ${tenantId}:`, error);
      throw error;
    }
  }
}

module.exports = new TenantOnboarding(); 