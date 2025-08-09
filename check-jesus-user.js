const mongoose = require('mongoose');
require('dotenv').config();

// Connect to school database
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
const schoolDbURI = mongoURI.replace('/jafasol?', '/school_jesus?');

console.log('Connecting to school database: school_jesus');
const schoolConnection = mongoose.createConnection(schoolDbURI, { useNewUrlParser: true, useUnifiedTopology: true });

const SchoolUser = schoolConnection.model('User', require('./models/User').schema);
const bcrypt = require('bcryptjs');

async function checkJesusUser() {
  try {
    console.log('🔍 Checking Jesus School Admin User');
    console.log('==================================');
    
    // Find the admin user
    const adminUser = await SchoolUser.findOne({ email: 'admin@jesus.jafasol.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found in school database');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Status: ${adminUser.status}`);
    console.log(`   School Subdomain: ${adminUser.schoolSubdomain}`);
    console.log(`   Role ID: ${adminUser.roleId}`);
    console.log(`   Modules: ${adminUser.modules?.join(', ') || 'None'}`);
    
    // Test password
    const isPasswordValid = await bcrypt.compare('Jafasol2024!', adminUser.password);
    console.log(`   Password valid: ${isPasswordValid ? '✅ YES' : '❌ NO'}`);
    
    // Test with different passwords
    const testPasswords = ['jesus2024', 'Jesus2024!', 'admin123', 'password'];
    for (const pwd of testPasswords) {
      const isValid = await bcrypt.compare(pwd, adminUser.password);
      console.log(`   Password "${pwd}": ${isValid ? '✅ YES' : '❌ NO'}`);
    }
    
    // Check if user meets login requirements
    console.log('\n🧪 Login Requirements Check:');
    console.log(`   Status Active: ${adminUser.status === 'Active' ? '✅ YES' : '❌ NO'}`);
    console.log(`   Has schoolSubdomain: ${adminUser.schoolSubdomain ? '✅ YES' : '❌ NO'}`);
    console.log(`   schoolSubdomain matches: ${adminUser.schoolSubdomain === 'jesus.jafasol.com' ? '✅ YES' : '❌ NO'}`);
    
    // Simulate login logic
    const expectedSubdomain = 'jesus.jafasol.com';
    const userSubdomain = adminUser.schoolSubdomain;
    
    if (!userSubdomain || (userSubdomain !== expectedSubdomain && userSubdomain !== 'jesus')) {
      console.log('❌ User schoolSubdomain validation failed');
    } else {
      console.log('✅ User schoolSubdomain validation passed');
    }
    
    if (adminUser.status !== 'Active') {
      console.log('❌ User status is not Active');
    } else {
      console.log('✅ User status is Active');
    }
    
    if (!isPasswordValid) {
      console.log('❌ Password is incorrect');
    } else {
      console.log('✅ Password is correct');
    }
    
    console.log('\n📋 Summary:');
    if (isPasswordValid && adminUser.status === 'Active' && userSubdomain && (userSubdomain === expectedSubdomain || userSubdomain === 'jesus')) {
      console.log('✅ All conditions met - login should work');
    } else {
      console.log('❌ Some conditions not met:');
      if (!isPasswordValid) console.log('   - Password is incorrect');
      if (adminUser.status !== 'Active') console.log('   - User status is not Active');
      if (!userSubdomain || (userSubdomain !== expectedSubdomain && userSubdomain !== 'jesus')) console.log('   - schoolSubdomain validation failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    schoolConnection.close();
    mongoose.connection.close();
  }
}

checkJesusUser(); 