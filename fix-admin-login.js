const mongoose = require('mongoose');
require('dotenv').config();

// Connect to main database
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI);

const User = require('./models/User');
const Role = require('./models/Role');

async function fixAdminLogin() {
  try {
    console.log('🔧 Fixing Admin Login');
    console.log('=====================');
    
    // 1. Find or create SuperAdmin role
    let superAdminRole = await Role.findOne({ name: 'SuperAdmin' });
    if (!superAdminRole) {
      console.log('Creating SuperAdmin role...');
      superAdminRole = new Role({
        name: 'SuperAdmin',
        description: 'Super Administrator with full system access',
        permissions: {
          Dashboard: ['view'],
          'User Management': ['view', 'create', 'edit', 'delete'],
          'Audit Logs': ['view'],
          Students: ['view', 'create', 'edit', 'delete'],
          Teachers: ['view', 'create', 'edit', 'delete'],
          Academics: ['view', 'create', 'edit', 'delete'],
          Attendance: ['view', 'create', 'edit'],
          Timetable: ['view', 'create', 'edit'],
          Exams: ['view', 'create', 'edit'],
          Fees: ['view', 'create', 'edit'],
          Communication: ['view', 'create'],
          Library: ['view', 'create', 'edit'],
          'Learning Resources': ['view', 'create', 'edit', 'delete'],
          Transport: ['view', 'create', 'edit'],
          Documents: ['view', 'create', 'edit'],
          Reports: ['view'],
          Settings: ['view', 'edit']
        }
      });
      await superAdminRole.save();
      console.log('✅ SuperAdmin role created');
    } else {
      console.log('✅ SuperAdmin role found');
    }
    
    // 2. Find or create admin user
    let adminUser = await User.findOne({ email: 'admin@jafasol.com' });
    
    if (!adminUser) {
      console.log('Creating admin user...');
      adminUser = new User({
        name: 'Jafasol Administrator',
        email: 'admin@jafasol.com',
        password: 'Jafasol2024!',
        roleId: superAdminRole._id,
        status: 'Active'
        // Note: NO schoolSubdomain - this is important!
      });
      await adminUser.save();
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user found');
      
      // Update admin user to ensure it has correct role and no schoolSubdomain
      adminUser.roleId = superAdminRole._id;
      adminUser.schoolSubdomain = undefined; // Remove any schoolSubdomain
      adminUser.status = 'Active';
      adminUser.password = 'Jafasol2024!'; // Reset password
      await adminUser.save();
      console.log('✅ Admin user updated');
    }
    
    // 3. Verify the fix
    console.log('\n🔍 Verification:');
    const verifyUser = await User.findOne({ email: 'admin@jafasol.com' }).populate('roleId');
    console.log(`   Email: ${verifyUser.email}`);
    console.log(`   Name: ${verifyUser.name}`);
    console.log(`   Role: ${verifyUser.roleId?.name}`);
    console.log(`   Status: ${verifyUser.status}`);
    console.log(`   School Subdomain: ${verifyUser.schoolSubdomain || 'None (Correct!)'}`);
    
    // 4. Test password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare('Jafasol2024!', verifyUser.password);
    console.log(`   Password valid: ${isPasswordValid ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n🎉 Admin login should now work!');
    console.log('   Try logging in with: admin@jafasol.com / Jafasol2024!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixAdminLogin(); 