const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    console.log('🔧 Resetting password for jesus.jafasol.com admin...');
    
    // Connect to the school database
    const connection = mongoose.createConnection('mongodb://127.0.0.1:27017/school_jesus');
    
    // Get the User model
    const User = connection.model('User', require('../models/User').schema);
    
    // Find the user
    const user = await User.findOne({ email: 'admin@jesus.jafasol.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🔑 Current hash:', user.password.substring(0, 20) + '...');
    
    // Hash the new password
    const saltRounds = 12;
    const newPassword = 'Jesus2024!';
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔑 New hash:', hashedPassword.substring(0, 20) + '...');
    
    // Update the password
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated successfully');
    
    // Test the password
    const testUser = await User.findOne({ email: 'admin@jesus.jafasol.com' });
    const isValid = await bcrypt.compare(newPassword, testUser.password);
    
    console.log('🧪 Password test result:', isValid);
    
    if (isValid) {
      console.log('🎉 SUCCESS! Login credentials:');
      console.log('📧 Email: admin@jesus.jafasol.com');
      console.log('🔑 Password: Jesus2024!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

resetPassword();



