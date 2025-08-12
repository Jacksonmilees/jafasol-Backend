const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function updatePasswordDirectly() {
  try {
    console.log('🔧 Directly updating password for jesus.jafasol.com admin...');
    
    // Connect to the school database
    const connection = mongoose.createConnection('mongodb://127.0.0.1:27017/school_jesus');
    
    // Get the User model
    const User = connection.model('User', require('../models/User').schema);
    
    // Hash the password
    const saltRounds = 12;
    const newPassword = 'Jesus2024!';
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔑 New hash:', hashedPassword.substring(0, 20) + '...');
    
    // Update the password directly in the database without triggering middleware
    const result = await User.updateOne(
      { email: 'admin@jesus.jafasol.com' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Update result:', result);
    
    if (result.modifiedCount > 0) {
      console.log('✅ Password updated successfully');
      
      // Verify the update
      const user = await User.findOne({ email: 'admin@jesus.jafasol.com' });
      console.log('📧 User:', user.name);
      console.log('🔑 Stored hash:', user.password.substring(0, 20) + '...');
      
      // Test the password
      const isValid = await bcrypt.compare(newPassword, user.password);
      console.log('🧪 Password test result:', isValid);
      
      if (isValid) {
        console.log('🎉 SUCCESS! Login credentials:');
        console.log('📧 Email: admin@jesus.jafasol.com');
        console.log('🔑 Password: Jesus2024!');
      }
    } else {
      console.log('❌ No user was updated');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

updatePasswordDirectly();



