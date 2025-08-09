const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
  name: { type: String, required: true, unique: true },
  description: String,
  permissions: [String],
  isSystem: { type: Boolean, default: false }
});

const Role = mongoose.model('Role', roleSchema);

async function checkAndFixSchools() {
  try {
    console.log('🔍 Checking schools data...');
    
    // Check all users with schoolSubdomain
    const schoolUsers = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null } 
    }).populate('roleId');
    
    console.log(`Found ${schoolUsers.length} users with schoolSubdomain:`);
    schoolUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Subdomain: ${user.schoolSubdomain}`);
    });

    // Check admin users specifically
    const adminUsers = await User.find({ 
      email: { $regex: /^admin@.*\.jafasol\.com$/ } 
    }).populate('roleId');
    
    console.log(`\nFound ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.roleId?.name || 'No role'}`);
    });

    // Create some sample schools if none exist
    if (schoolUsers.length === 0) {
      console.log('\n📝 Creating sample schools...');
      
      const adminRole = await Role.findOne({ name: 'Admin' });
      if (!adminRole) {
        console.log('Creating Admin role...');
        await Role.create({
          name: 'Admin',
          description: 'School administrator',
          permissions: ['school_management', 'user_management', 'reports'],
          isSystem: true
        });
      }

      const sampleSchools = [
        {
          name: 'Demo School Administrator',
          email: 'admin@demo.jafasol.com',
          password: 'Demo2024!',
          schoolSubdomain: 'demo',
          phone: '+1234567890',
          modules: ['students', 'teachers', 'attendance', 'exams'],
          status: 'Active'
        },
        {
          name: 'Test School Administrator',
          email: 'admin@test.jafasol.com',
          password: 'Test2024!',
          schoolSubdomain: 'test',
          phone: '+1234567891',
          modules: ['students', 'teachers', 'fees', 'library'],
          status: 'Active'
        }
      ];

      for (const school of sampleSchools) {
        const existingUser = await User.findOne({ email: school.email });
        if (!existingUser) {
          const hashedPassword = await bcrypt.hash(school.password, 12);
          await User.create({
            ...school,
            password: hashedPassword,
            roleId: adminRole._id
          });
          console.log(`✅ Created school: ${school.name}`);
        } else {
          console.log(`⚠️ School already exists: ${school.name}`);
        }
      }
    }

    // Test the schools query
    console.log('\n🧪 Testing schools query...');
    const schoolAdmins = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null },
      email: { $regex: /^admin@.*\.jafasol\.com$/ }
    }).populate('roleId');

    console.log(`Query found ${schoolAdmins.length} school admins:`);
    schoolAdmins.forEach(admin => {
      console.log(`- ${admin.name} (${admin.email}) - Subdomain: ${admin.schoolSubdomain}`);
    });

    console.log('\n🎉 Schools check completed!');
    
  } catch (error) {
    console.error('❌ Error checking schools:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
connectDB().then(checkAndFixSchools); 