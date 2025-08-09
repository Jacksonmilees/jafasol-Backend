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

// Module name mapping
const moduleMapping = {
  'students': 'studentManagement',
  'teachers': 'teacherManagement',
  'attendance': 'attendance',
  'exams': 'exams',
  'fees': 'fees',
  'timetable': 'timetable',
  'library': 'library',
  'academics': 'academics',
  'reports': 'analytics',
  'transport': 'transport',
  'communication': 'communication'
};

async function fixModuleNames() {
  try {
    console.log('🔧 Fixing Module Names');
    console.log('======================');
    
    // Get all school users
    const schoolUsers = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null } 
    });
    
    console.log(`Found ${schoolUsers.length} schools to update:`);
    
    for (const user of schoolUsers) {
      console.log(`\n📝 Updating ${user.name} (${user.email}):`);
      console.log(`  Old modules: ${user.modules.join(', ') || 'none'}`);
      
      // Update modules with correct names
      const updatedModules = user.modules.map(module => {
        const newModule = moduleMapping[module];
        if (newModule) {
          console.log(`    ${module} → ${newModule}`);
          return newModule;
        } else {
          console.log(`    ${module} → (kept as is)`);
          return module;
        }
      });
      
      // Add some default modules if none exist
      if (updatedModules.length === 0) {
        updatedModules.push('studentManagement', 'teacherManagement', 'attendance');
        console.log(`    Added default modules: ${updatedModules.join(', ')}`);
      }
      
      // Update the user
      user.modules = updatedModules;
      await user.save();
      
      console.log(`  ✅ Updated modules: ${updatedModules.join(', ')}`);
    }
    
    console.log('\n🎉 Module names fixed successfully!');
    console.log('\n📋 Available modules for create school:');
    console.log('- analytics');
    console.log('- studentManagement');
    console.log('- teacherManagement');
    console.log('- timetable');
    console.log('- fees');
    console.log('- exams');
    console.log('- communication');
    console.log('- attendance');
    console.log('- library');
    console.log('- transport');
    console.log('- academics');
    
  } catch (error) {
    console.error('❌ Error fixing module names:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
connectDB().then(fixModuleNames); 