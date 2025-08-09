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

async function fixCredentialsIssue() {
  try {
    console.log('🔧 Fixing School Credentials Issue');
    console.log('==================================');
    
    // 1. Ensure SuperAdmin role exists
    let superAdminRole = await Role.findOne({ name: 'SuperAdmin' });
    if (!superAdminRole) {
      console.log('1. Creating SuperAdmin role...');
      superAdminRole = new Role({
        name: 'SuperAdmin',
        permissions: {
          Dashboard: { view: true },
          'User Management': { view: true, create: true, edit: true, delete: true },
          'Audit Logs': { view: true },
          Students: { view: true, create: true, edit: true, delete: true },
          Teachers: { view: true, create: true, edit: true, delete: true },
          Academics: { view: true, create: true, edit: true, delete: true },
          Attendance: { view: true, create: true, edit: true },
          Timetable: { view: true, create: true, edit: true },
          Exams: { view: true, create: true, edit: true },
          Fees: { view: true, create: true, edit: true },
          Communication: { view: true, create: true },
          Library: { view: true, create: true, edit: true },
          'Learning Resources': { view: true, create: true, edit: true, delete: true },
          Transport: { view: true, create: true, edit: true },
          Documents: { view: true, create: true, edit: true },
          Reports: { view: true },
          Settings: { view: true, edit: true }
        }
      });
      await superAdminRole.save();
      console.log('   ✅ SuperAdmin role created');
    } else {
      console.log('1. SuperAdmin role exists');
    }
    
    // 2. Ensure admin user exists with SuperAdmin role
    let adminUser = await User.findOne({ email: 'admin@jafasol.com' });
    if (!adminUser) {
      console.log('2. Creating admin user...');
      adminUser = new User({
        name: 'Jafasol Administrator',
        email: 'admin@jafasol.com',
        password: 'Jafasol2024!',
        roleId: superAdminRole._id,
        status: 'Active'
      });
      await adminUser.save();
      console.log('   ✅ Admin user created');
    } else {
      console.log('2. Admin user exists');
      // Update role if needed
      if (!adminUser.roleId || adminUser.roleId.toString() !== superAdminRole._id.toString()) {
        adminUser.roleId = superAdminRole._id;
        await adminUser.save();
        console.log('   ✅ Admin user role updated');
      }
    }
    
    // 3. Check school users and fix any issues
    const schoolUsers = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null } 
    });
    
    console.log(`3. Found ${schoolUsers.length} school users:`);
    
    for (const user of schoolUsers) {
      console.log(`   - ${user.name} (${user.email}): ${user.schoolSubdomain}`);
      console.log(`     ID: ${user._id}`);
      console.log(`     Status: ${user.status}`);
      
      // Ensure school users have proper subdomain format
      if (user.schoolSubdomain && !user.schoolSubdomain.includes('.jafasol.com')) {
        const subdomain = user.schoolSubdomain.replace('.jafasol.com', '');
        user.schoolSubdomain = `${subdomain}.jafasol.com`;
        await user.save();
        console.log(`     ✅ Fixed subdomain: ${user.schoolSubdomain}`);
      }
    }
    
    // 4. Test the specific failing school ID
    const failingSchoolId = '689219003971bf32b309c6d2';
    const failingSchool = await User.findById(failingSchoolId);
    
    console.log(`4. Testing failing school ID: ${failingSchoolId}`);
    if (failingSchool) {
      console.log('   ✅ School exists');
      console.log('   - Name:', failingSchool.name);
      console.log('   - Email:', failingSchool.email);
      console.log('   - Subdomain:', failingSchool.schoolSubdomain);
      console.log('   - Status:', failingSchool.status);
    } else {
      console.log('   ❌ School not found');
    }
    
    console.log('\n🎉 Credentials issue fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart the backend');
    console.log('2. Test admin login');
    console.log('3. Test school credentials endpoint');
    
  } catch (error) {
    console.error('❌ Error fixing credentials issue:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
connectDB().then(fixCredentialsIssue); 