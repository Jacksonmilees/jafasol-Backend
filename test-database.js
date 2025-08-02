const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function testDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to database');

    // Check all users
    const allUsers = await User.find({}).select('name email schoolSubdomain status createdAt');
    console.log('\n📋 All users in database:');
    console.log(JSON.stringify(allUsers, null, 2));

    // Check users with schoolSubdomain
    const usersWithSubdomain = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null }
    }).select('name email schoolSubdomain status createdAt');
    console.log('\n🏫 Users with schoolSubdomain:');
    console.log(JSON.stringify(usersWithSubdomain, null, 2));

    // Check admin users
    const adminUsers = await User.find({ 
      email: { $regex: /^admin@.*\.jafasol\.com$/ }
    }).select('name email schoolSubdomain status createdAt');
    console.log('\n👨‍💼 Admin users:');
    console.log(JSON.stringify(adminUsers, null, 2));

    // Check the exact query we're using
    const schoolAdmins = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null },
      email: { $regex: /^admin@.*\.jafasol\.com$/ }
    }).select('name email schoolSubdomain status createdAt');
    console.log('\n🎓 School admin users (our query):');
    console.log(JSON.stringify(schoolAdmins, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDatabase(); 