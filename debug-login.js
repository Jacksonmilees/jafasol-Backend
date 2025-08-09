const mongoose = require('mongoose');
require('dotenv').config();

// Connect to main database
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI);

const User = require('./models/User');
const Role = require('./models/Role');
const bcrypt = require('bcryptjs');

async function debugLogin() {
  try {
    console.log('🔍 Debugging Login Issue');
    console.log('========================');
    
    // 1. Check if admin user exists
    const adminUser = await User.findOne({ email: 'admin@jafasol.com' }).populate('roleId');
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Status: ${adminUser.status}`);
    console.log(`   Role: ${adminUser.roleId?.name || 'No role'}`);
    console.log(`   School Subdomain: ${adminUser.schoolSubdomain || 'None'}`);
    
    // 2. Test password
    const isPasswordValid = await bcrypt.compare('Jafasol2024!', adminUser.password);
    console.log(`   Password valid: ${isPasswordValid ? '✅ YES' : '❌ NO'}`);
    
    // 3. Check role
    if (adminUser.roleId) {
      console.log(`   Role ID: ${adminUser.roleId._id}`);
      console.log(`   Role Name: ${adminUser.roleId.name}`);
      console.log(`   Role Description: ${adminUser.roleId.description}`);
    }
    
    // 4. Simulate login logic
    console.log('\n🧪 Simulating Login Logic:');
    
    // Check if user has schoolSubdomain (should be false for main admin)
    if (adminUser.schoolSubdomain) {
      console.log('❌ User has schoolSubdomain - should not login to main domain');
    } else {
      console.log('✅ User has no schoolSubdomain - can login to main domain');
    }
    
    // Check if user has SuperAdmin role
    if (adminUser.roleId && adminUser.roleId.name === 'SuperAdmin') {
      console.log('✅ User has SuperAdmin role - can login to main domain');
    } else {
      console.log('❌ User does not have SuperAdmin role - cannot login to main domain');
    }
    
    // 5. Test password comparison using the model method
    console.log('\n🔐 Testing password comparison:');
    try {
      const compareResult = await adminUser.comparePassword('Jafasol2024!');
      console.log(`   Model comparePassword result: ${compareResult ? '✅ YES' : '❌ NO'}`);
    } catch (error) {
      console.log(`   Model comparePassword error: ${error.message}`);
    }
    
    // 6. Check if user is active
    if (adminUser.status === 'Active') {
      console.log('✅ User status is Active');
    } else {
      console.log(`❌ User status is ${adminUser.status}`);
    }
    
    console.log('\n📋 Summary:');
    if (isPasswordValid && !adminUser.schoolSubdomain && adminUser.roleId?.name === 'SuperAdmin' && adminUser.status === 'Active') {
      console.log('✅ All conditions met - login should work');
    } else {
      console.log('❌ Some conditions not met:');
      if (!isPasswordValid) console.log('   - Password is invalid');
      if (adminUser.schoolSubdomain) console.log('   - User has schoolSubdomain');
      if (adminUser.roleId?.name !== 'SuperAdmin') console.log('   - User is not SuperAdmin');
      if (adminUser.status !== 'Active') console.log('   - User is not Active');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugLogin(); 