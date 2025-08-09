const mongoose = require('mongoose');
require('dotenv').config();

// Connect to main database
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI);

const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function checkAdminUser() {
  try {
    console.log('🔍 Checking Admin User');
    console.log('=====================');
    
    // Check if admin user exists
    const adminUser = await User.findOne({ email: 'admin@jafasol.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      console.log('Creating admin user...');
      
      // Find or create Admin role
      const Role = require('./models/Role');
      let adminRole = await Role.findOne({ name: 'SuperAdmin' });
      if (!adminRole) {
        adminRole = new Role({
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
        await adminRole.save();
      }
      
      // Create admin user
      const newAdminUser = new User({
        name: 'Jafasol Administrator',
        email: 'admin@jafasol.com',
        password: 'Jafasol2024!',
        roleId: adminRole._id,
        status: 'Active'
      });
      
      await newAdminUser.save();
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user found');
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Status: ${adminUser.status}`);
      console.log(`   Role: ${adminUser.roleId?.name || 'No role'}`);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('Jafasol2024!', adminUser.password);
      console.log(`   Password valid: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        console.log('⚠️ Password is incorrect, updating...');
        adminUser.password = 'Jafasol2024!';
        await adminUser.save();
        console.log('✅ Password updated');
      }
    }
    
    // Test login simulation
    console.log('\n🧪 Testing login simulation...');
    const testUser = await User.findOne({ email: 'admin@jafasol.com' });
    if (testUser) {
      const isPasswordValid = await bcrypt.compare('Jafasol2024!', testUser.password);
      console.log(`   Login test: ${isPasswordValid ? '✅ SUCCESS' : '❌ FAILED'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAdminUser(); 