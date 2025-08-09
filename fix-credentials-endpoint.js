const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jafasol');
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  avatarUrl: String,
  twoFactorEnabled: { type: Boolean, default: false },
  lastLoginAt: Date,
  schoolSubdomain: String,
  phone: String,
  modules: [String]
});

const User = mongoose.model('User', userSchema);

// Role Schema
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  permissions: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const Role = mongoose.model('Role', roleSchema);

async function debugCredentialsEndpoint() {
  try {
    console.log('🔧 Debugging School Credentials Endpoint');
    console.log('========================================');
    
    // 1. Check if SuperAdmin role exists
    const superAdminRole = await Role.findOne({ name: 'SuperAdmin' });
    console.log('1. SuperAdmin role exists:', !!superAdminRole);
    
    // 2. Check if admin user exists
    const adminUser = await User.findOne({ email: 'admin@jafasol.com' });
    console.log('2. Admin user exists:', !!adminUser);
    
    if (adminUser) {
      console.log('   - Admin user role:', adminUser.roleId);
      console.log('   - Admin user status:', adminUser.status);
    }
    
    // 3. Check school users
    const schoolUsers = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null } 
    });
    
    console.log(`3. Found ${schoolUsers.length} school users:`);
    
    for (const user of schoolUsers) {
      console.log(`   - ${user.name} (${user.email}): ${user.schoolSubdomain}`);
      console.log(`     ID: ${user._id}`);
      console.log(`     Status: ${user.status}`);
    }
    
    // 4. Test specific school ID that's failing
    const failingSchoolId = '689219003971bf32b309c6d2';
    const failingSchool = await User.findById(failingSchoolId);
    
    console.log(`4. Testing failing school ID: ${failingSchoolId}`);
    console.log('   School exists:', !!failingSchool);
    
    if (failingSchool) {
      console.log('   - Name:', failingSchool.name);
      console.log('   - Email:', failingSchool.email);
      console.log('   - Subdomain:', failingSchool.schoolSubdomain);
      console.log('   - Status:', failingSchool.status);
    }
    
    // 5. Check if the issue is with the query
    const schoolWithSubdomain = await User.findOne({ 
      _id: failingSchoolId,
      schoolSubdomain: { $exists: true, $ne: null }
    });
    
    console.log('5. School with subdomain query result:', !!schoolWithSubdomain);
    
    // 6. Create a test admin user if needed
    if (!adminUser) {
      console.log('6. Creating admin user...');
      const newAdminUser = new User({
        name: 'Jafasol Administrator',
        email: 'admin@jafasol.com',
        password: 'Jafasol2024!',
        status: 'Active'
      });
      await newAdminUser.save();
      console.log('   ✅ Admin user created');
    }
    
    console.log('\n🎉 Debugging completed!');
    console.log('\n📋 Recommendations:');
    console.log('1. Ensure admin user has SuperAdmin role');
    console.log('2. Check if school users have proper subdomain values');
    console.log('3. Verify the credentials endpoint query logic');
    
  } catch (error) {
    console.error('❌ Error debugging credentials endpoint:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
connectDB().then(debugCredentialsEndpoint); 