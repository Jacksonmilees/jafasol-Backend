const mongoose = require('mongoose');
require('dotenv').config();

// Connect to main database
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI);

const User = require('./models/User');

async function testSchoolLogin() {
  try {
    console.log('🔍 Testing School Login Functionality');
    console.log('=====================================');
    
    // 1. Check school users in main database
    console.log('\n1. School users in main database:');
    const schoolUsers = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null } 
    }).select('email schoolSubdomain status');
    
    if (schoolUsers.length === 0) {
      console.log('❌ No school users found in main database');
    } else {
      schoolUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.schoolSubdomain}) - ${user.status}`);
      });
    }
    
    // 2. Test each school database
    const schools = ['stmarys', 'brightfuture', 'excellence', 'innovation', 'jafasolacademy'];
    
    for (const school of schools) {
      console.log(`\n2. Testing ${school} database:`);
      
      // Connect to school database
      const schoolDbName = `school_${school}`;
      const schoolConnection = mongoose.createConnection(
        mongoURI.replace('/jafasol?', `/${schoolDbName}?`),
        { useNewUrlParser: true, useUnifiedTopology: true }
      );
      
      const SchoolUser = schoolConnection.model('User', require('./models/User').schema);
      
      // Check users in this school
      const schoolUsers = await SchoolUser.find().select('email schoolSubdomain status');
      
      if (schoolUsers.length === 0) {
        console.log(`   ❌ No users found in ${school} database`);
      } else {
        console.log(`   ✅ Found ${schoolUsers.length} users in ${school} database:`);
        schoolUsers.forEach(user => {
          console.log(`      - ${user.email} (${user.schoolSubdomain}) - ${user.status}`);
        });
      }
      
      schoolConnection.close();
    }
    
    // 3. Test login simulation
    console.log('\n3. Testing login simulation:');
    const testEmail = 'admin@stmarys.jafasol.com';
    const testPassword = 'Jafasol2024!';
    
    // Connect to stmarys school database
    const stmarysConnection = mongoose.createConnection(
      mongoURI.replace('/jafasol?', '/school_stmarys?'),
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    
    const StmarysUser = stmarysConnection.model('User', require('./models/User').schema);
    
    // Try to find user
    const user = await StmarysUser.findOne({ email: testEmail.toLowerCase() });
    
    if (!user) {
      console.log(`   ❌ User ${testEmail} not found in stmarys database`);
    } else {
      console.log(`   ✅ User found: ${user.email}`);
      console.log(`   📍 School subdomain: ${user.schoolSubdomain}`);
      console.log(`   🔐 Status: ${user.status}`);
      
      // Test password
      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare(testPassword, user.password);
      console.log(`   🔑 Password valid: ${isPasswordValid}`);
    }
    
    stmarysConnection.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testSchoolLogin(); 