const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to the main database first
const mainConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/jafasol', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Get the User model for the main database
const MainUser = mainConnection.model('User', require('../models/User').schema);

// Connect to the school database
const schoolConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/school_jesus', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Get the User model for the school database
const SchoolUser = schoolConnection.model('User', require('../models/User').schema);

async function resetJesusPassword() {
  try {
    console.log('🔧 Resetting password for jesus.jafasol.com admin...');
    
    // First, let's check if the user exists in the school database
    const schoolUser = await SchoolUser.findOne({ email: 'admin@jesus.jafasol.com' });
    
    if (!schoolUser) {
      console.log('❌ User not found in school database. Creating new admin user...');
      
      // Get the Admin role from main database
      const adminRole = await MainUser.findOne({ email: 'admin@jafasol.com' });
      if (!adminRole) {
        console.log('❌ Admin role not found in main database');
        return;
      }
      
      // Create new admin user in school database
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash('Jesus2024!', saltRounds);
      
      const newAdminUser = new SchoolUser({
        name: 'jesus Administrator',
        email: 'admin@jesus.jafasol.com',
        password: hashedPassword,
        roleId: adminRole.roleId,
        status: 'Active',
        schoolSubdomain: 'jesus'
      });
      
      await newAdminUser.save();
      console.log('✅ New admin user created in school database');
    } else {
      console.log('✅ User found in school database. Updating password...');
      
      // Update the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash('Jesus2024!', saltRounds);
      
      schoolUser.password = hashedPassword;
      await schoolUser.save();
      
      console.log('✅ Password updated successfully');
    }
    
    // Verify the password works
    const testUser = await SchoolUser.findOne({ email: 'admin@jesus.jafasol.com' });
    const isPasswordValid = await bcrypt.compare('Jesus2024!', testUser.password);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful!');
      console.log('📧 Email: admin@jesus.jafasol.com');
      console.log('🔑 Password: Jesus2024!');
    } else {
      console.log('❌ Password verification failed!');
    }
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    // Close connections
    await mainConnection.close();
    await schoolConnection.close();
    console.log('🔌 Database connections closed');
  }
}

// Run the script
resetJesusPassword();
