const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixAllIssues() {
  try {
    console.log('🔧 Fixing all backend issues...');
    
    // Connect to the school database
    const connection = mongoose.createConnection('mongodb://127.0.0.1:27017/school_jesus');
    
    // Get the User model
    const User = connection.model('User', require('../models/User').schema);
    
    console.log('📝 Step 1: Updating password with proper hash...');
    
    // Hash the password with the same salt rounds as the backend
    const saltRounds = 12;
    const newPassword = 'Jesus2024!';
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔑 New hash:', hashedPassword.substring(0, 20) + '...');
    
    // Update the password directly in the database
    const result = await User.updateOne(
      { email: 'admin@jesus.jafasol.com' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ Password update result:', result);
    
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
    }
    
    console.log('📝 Step 2: Checking for any other users that might need password reset...');
    
    // List all users in the school database
    const allUsers = await User.find({}, 'name email status');
    console.log('👥 Users in school database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.status}`);
    });
    
    console.log('📝 Step 3: Database connection test...');
    
    // Test database connection
    const db = connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections in school_jesus database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

fixAllIssues();



