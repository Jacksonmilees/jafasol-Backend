const mongoose = require('mongoose');
require('dotenv').config();

// Connect to school database
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
const schoolDbURI = mongoURI.replace('/jafasol?', '/school_jesus?');

console.log('Connecting to school database: school_jesus');
const schoolConnection = mongoose.createConnection(schoolDbURI, { useNewUrlParser: true, useUnifiedTopology: true });

const SchoolUser = schoolConnection.model('User', require('./models/User').schema);
const bcrypt = require('bcryptjs');

async function checkAndFixPassword() {
  try {
    console.log('🔧 Checking Jesus School Admin Password');
    console.log('====================================');
    
    // Find the admin user
    const adminUser = await SchoolUser.findOne({ email: 'admin@jesus.jafasol.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found in school database');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Password hash: ${adminUser.password.substring(0, 20)}...`);
    
    // Set a new password directly
    const newPassword = 'Jesus2024!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password
    adminUser.password = hashedPassword;
    await adminUser.save();
    
    console.log('✅ Password updated successfully!');
    console.log(`   New password: ${newPassword}`);
    console.log(`   Email: admin@jesus.jafasol.com`);
    
    // Verify the new password
    const isNewPasswordValid = await bcrypt.compare(newPassword, adminUser.password);
    console.log(`   New password verification: ${isNewPasswordValid ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n🎉 Login credentials for Jesus School:');
    console.log('   Email: admin@jesus.jafasol.com');
    console.log('   Password: Jesus2024!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    schoolConnection.close();
    mongoose.connection.close();
  }
}

checkAndFixPassword(); 