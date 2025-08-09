const mongoose = require('mongoose');
require('dotenv').config();

// Connect to school database
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
const schoolDbURI = mongoURI.replace('/jafasol?', '/school_jesus?');

console.log('Connecting to school database: school_jesus');
const schoolConnection = mongoose.createConnection(schoolDbURI, { useNewUrlParser: true, useUnifiedTopology: true });

const bcrypt = require('bcryptjs');

async function fixPasswordDirect() {
  try {
    console.log('🔧 Fixing Jesus School Admin Password (Direct Update)');
    console.log('==================================================');
    
    // Hash the new password
    const newPassword = 'Jesus2024!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    console.log(`New password: ${newPassword}`);
    console.log(`Hashed password: ${hashedPassword.substring(0, 30)}...`);
    
    // Direct database update without using User model save
    const result = await schoolConnection.db.collection('users').updateOne(
      { email: 'admin@jesus.jafasol.com' },
      { $set: { password: hashedPassword } }
    );
    
    if (result.matchedCount === 0) {
      console.log('❌ User not found');
      return;
    }
    
    if (result.modifiedCount === 0) {
      console.log('❌ Password not updated');
      return;
    }
    
    console.log('✅ Password updated successfully!');
    
    // Verify the update
    const updatedUser = await schoolConnection.db.collection('users').findOne(
      { email: 'admin@jesus.jafasol.com' }
    );
    
    console.log(`Updated hash: ${updatedUser.password.substring(0, 30)}...`);
    
    // Test the password
    const isPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
    console.log(`Password verification: ${isPasswordValid ? '✅ YES' : '❌ NO'}`);
    
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

fixPasswordDirect(); 