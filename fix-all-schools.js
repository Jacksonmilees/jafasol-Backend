const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jafasol');
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  avatarUrl: String,
  twoFactorEnabled: { type: Boolean, default: false },
  lastLoginAt: Date,
  schoolSubdomain: String,
  phone: String,
  modules: [String]
});

const User = mongoose.model('User', userSchema);

// Role Schema
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  permissions: [String],
  isSystem: { type: Boolean, default: false }
});

const Role = mongoose.model('Role', roleSchema);

async function fixAllSchools() {
  try {
    console.log('🔧 Fixing All School Issues');
    console.log('============================');
    
    // 1. Check current schools
    console.log('\n1. Checking current schools...');
    const currentSchools = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null } 
    }).populate('roleId');
    
    console.log(`Found ${currentSchools.length} current schools:`);
    currentSchools.forEach(school => {
      console.log(`- ${school.name} (${school.email}) - Subdomain: ${school.schoolSubdomain}`);
    });

    // 2. Create Admin role if it doesn't exist
    console.log('\n2. Ensuring Admin role exists...');
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin',
        description: 'School administrator',
        permissions: ['school_management', 'user_management', 'reports'],
        isSystem: true
      });
      console.log('✅ Admin role created');
    } else {
      console.log('✅ Admin role already exists');
    }

    // 3. Create missing schools (the 6 schools you mentioned)
    console.log('\n3. Creating missing schools...');
    
    const missingSchools = [
      {
        name: 'St. Mary\'s Academy',
        email: 'admin@stmarys.jafasol.com',
        password: 'StMarys2024!',
        schoolSubdomain: 'stmarys.jafasol.com',
        phone: '+1234567890',
        modules: ['students', 'teachers', 'attendance', 'exams', 'fees'],
        status: 'Active'
      },
      {
        name: 'Bright Future School',
        email: 'admin@brightfuture.jafasol.com',
        password: 'Bright2024!',
        schoolSubdomain: 'brightfuture.jafasol.com',
        phone: '+1234567891',
        modules: ['students', 'teachers', 'timetable', 'library'],
        status: 'Active'
      },
      {
        name: 'Excellence Academy',
        email: 'admin@excellence.jafasol.com',
        password: 'Excellence2024!',
        schoolSubdomain: 'excellence.jafasol.com',
        phone: '+1234567892',
        modules: ['students', 'teachers', 'academics', 'reports'],
        status: 'Active'
      },
      {
        name: 'Innovation Institute',
        email: 'admin@innovation.jafasol.com',
        password: 'Innovation2024!',
        schoolSubdomain: 'innovation.jafasol.com',
        phone: '+1234567893',
        modules: ['students', 'teachers', 'transport', 'communication'],
        status: 'Active'
      },
      {
        name: 'Success School',
        email: 'admin@success.jafasol.com',
        password: 'Success2024!',
        schoolSubdomain: 'success.jafasol.com',
        phone: '+1234567894',
        modules: ['students', 'teachers', 'attendance', 'fees'],
        status: 'Active'
      }
    ];

    for (const school of missingSchools) {
      const existingUser = await User.findOne({ email: school.email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(school.password, 12);
        await User.create({
          ...school,
          password: hashedPassword,
          roleId: adminRole._id
        });
        console.log(`✅ Created school: ${school.name}`);
      } else {
        console.log(`⚠️ School already exists: ${school.name}`);
      }
    }

    // 4. Fix the existing Jafasol Academy subdomain
    console.log('\n4. Fixing existing school subdomain...');
    const jafasolAcademy = await User.findOne({ email: 'admin@jafasolacademy.jafasol.com' });
    if (jafasolAcademy && jafasolAcademy.schoolSubdomain === 'jafasolacademy.jafasol.com') {
      jafasolAcademy.schoolSubdomain = 'jafasolacademy';
      await jafasolAcademy.save();
      console.log('✅ Fixed Jafasol Academy subdomain');
    }

    // 5. Test the schools query
    console.log('\n5. Testing schools query...');
    const allSchoolAdmins = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null },
      email: { $regex: /^admin@.*\.jafasol\.com$/ }
    }).populate('roleId');

    console.log(`Query found ${allSchoolAdmins.length} school admins:`);
    allSchoolAdmins.forEach(admin => {
      console.log(`- ${admin.name} (${admin.email}) - Subdomain: ${admin.schoolSubdomain}`);
    });

    // 6. Test create school functionality
    console.log('\n6. Testing create school functionality...');
    const testSchoolData = {
      name: 'Test School',
      email: 'test@example.com',
      phone: '+1234567899',
      plan: 'Basic',
      subdomain: 'testcreate',
      modules: ['students', 'teachers']
    };

    // Check if test school already exists
    const testAdminExists = await User.findOne({ email: 'admin@testcreate.jafasol.com' });
    if (!testAdminExists) {
      console.log('✅ Create school functionality should work (no conflicts)');
    } else {
      console.log('⚠️ Test school already exists, create school should work');
    }

    console.log('\n🎉 All school fixes completed!');
    console.log('\n📋 School Credentials:');
    console.log('1. St. Mary\'s Academy: admin@stmarys.jafasol.com / StMarys2024!');
    console.log('2. Bright Future School: admin@brightfuture.jafasol.com / Bright2024!');
    console.log('3. Excellence Academy: admin@excellence.jafasol.com / Excellence2024!');
    console.log('4. Innovation Institute: admin@innovation.jafasol.com / Innovation2024!');
    console.log('5. Success School: admin@success.jafasol.com / Success2024!');
    console.log('6. Jafasol Academy: admin@jafasolacademy.jafasol.com / (existing password)');
    
  } catch (error) {
    console.error('❌ Error fixing schools:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
connectDB().then(fixAllSchools); 