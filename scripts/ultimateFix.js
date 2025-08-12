const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function ultimateFix() {
  try {
    console.log('🔧 ULTIMATE FIX - Resolving all backend issues...');
    
    // Connect to the school database
    const connection = mongoose.createConnection('mongodb://127.0.0.1:27017/school_jesus');
    
    // Get the User model
    const User = connection.model('User', require('../models/User').schema);
    
    console.log('📝 Step 1: Checking current user state...');
    
    // Find the user
    const user = await User.findOne({ email: 'admin@jesus.jafasol.com' });
    
    if (!user) {
      console.log('❌ User not found - creating new admin user...');
      
      // Create new admin user
      const saltRounds = 12;
      const newPassword = 'Jesus2024!';
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const newUser = new User({
        name: 'Jesus Academy Administrator',
        email: 'admin@jesus.jafasol.com',
        password: hashedPassword,
        roleId: null, // Will be set later
        status: 'Active',
        schoolSubdomain: 'jesus'
      });
      
      await newUser.save();
      console.log('✅ New admin user created');
    } else {
      console.log('✅ User found:', user.name);
      console.log('🔑 Current hash:', user.password.substring(0, 20) + '...');
      
      // Force update the password
      const saltRounds = 12;
      const newPassword = 'Jesus2024!';
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      console.log('🔑 New hash:', hashedPassword.substring(0, 20) + '...');
      
      // Update using findOneAndUpdate to bypass any middleware
      const updateResult = await User.findOneAndUpdate(
        { email: 'admin@jesus.jafasol.com' },
        { password: hashedPassword },
        { new: true }
      );
      
      console.log('✅ Password updated using findOneAndUpdate');
      console.log('🔑 Updated hash:', updateResult.password.substring(0, 20) + '...');
    }
    
    console.log('📝 Step 2: Verifying password works...');
    
    // Get the updated user
    const updatedUser = await User.findOne({ email: 'admin@jesus.jafasol.com' });
    const isValid = await bcrypt.compare('Jesus2024!', updatedUser.password);
    
    console.log('🧪 Password test result:', isValid);
    
    if (isValid) {
      console.log('🎉 SUCCESS! Login credentials:');
      console.log('📧 Email: admin@jesus.jafasol.com');
      console.log('🔑 Password: Jesus2024!');
    } else {
      console.log('❌ Password verification failed!');
    }
    
    console.log('📝 Step 3: Checking database collections...');
    
    // List all collections
    const db = connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections in school_jesus database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    console.log('📝 Step 4: Checking users collection...');
    
    // List all users
    const allUsers = await User.find({}, 'name email status createdAt');
    console.log('👥 All users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.status} - Created: ${user.createdAt}`);
    });
    
    console.log('📝 Step 5: Testing database connection string...');
    
    // Test the exact connection string the backend uses
    const testConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/school_jesus');
    const TestUser = testConnection.model('User', require('../models/User').schema);
    
    const testUser = await TestUser.findOne({ email: 'admin@jesus.jafasol.com' });
    if (testUser) {
      console.log('✅ Test connection successful - user found');
      const testValid = await bcrypt.compare('Jesus2024!', testUser.password);
      console.log('🧪 Test connection password test:', testValid);
    } else {
      console.log('❌ Test connection failed - user not found');
    }
    
    await testConnection.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

ultimateFix();



