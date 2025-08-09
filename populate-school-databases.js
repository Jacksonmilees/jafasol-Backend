const mongoose = require('mongoose');
require('dotenv').config();

// Connect to main database
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI);

const User = require('./models/User');
const Role = require('./models/Role');

async function populateSchoolDatabases() {
  try {
    console.log('🔧 Populating School Databases');
    console.log('==============================');
    
    // 1. Get all school users from main database
    console.log('\n1. Finding school users in main database...');
    const schoolUsers = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null } 
    }).populate('roleId');
    
    console.log(`Found ${schoolUsers.length} school users:`);
    schoolUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.schoolSubdomain})`);
    });
    
    // 2. Group users by school
    const schoolsMap = new Map();
    schoolUsers.forEach(user => {
      const subdomain = user.schoolSubdomain.split('.')[0]; // Extract subdomain from full domain
      if (!schoolsMap.has(subdomain)) {
        schoolsMap.set(subdomain, []);
      }
      schoolsMap.get(subdomain).push(user);
    });
    
    // 3. Populate each school database
    for (const [schoolName, users] of schoolsMap) {
      console.log(`\n2. Populating ${schoolName} database...`);
      
      // Connect to school database
      const schoolDbName = `school_${schoolName}`;
      const schoolConnection = mongoose.createConnection(
        mongoURI.replace('/jafasol?', `/${schoolDbName}?`),
        { useNewUrlParser: true, useUnifiedTopology: true }
      );
      
      const SchoolUser = schoolConnection.model('User', require('./models/User').schema);
      const SchoolRole = schoolConnection.model('Role', require('./models/Role').schema);
      
      // Check if Admin role exists, create if not
      let adminRole = await SchoolRole.findOne({ name: 'Admin' });
      if (!adminRole) {
        console.log(`   Creating Admin role for ${schoolName}...`);
        adminRole = new SchoolRole({
          name: 'Admin',
          description: 'School Administrator',
          permissions: {
            Dashboard: ['view'],
            'User Management': ['view', 'create', 'edit', 'delete'],
            'Audit Logs': ['view'],
            Students: ['view', 'create', 'edit', 'delete'],
            Teachers: ['view', 'create', 'edit', 'delete'],
            Academics: ['view', 'create', 'edit', 'delete'],
            Attendance: ['view', 'create', 'edit'],
            Timetable: ['view', 'create', 'edit'],
            Exams: ['view', 'create', 'edit'],
            Fees: ['view', 'create', 'edit'],
            Communication: ['view', 'create'],
            Library: ['view', 'create', 'edit'],
            'Learning Resources': ['view', 'create', 'edit', 'delete'],
            Transport: ['view', 'create', 'edit'],
            Documents: ['view', 'create', 'edit'],
            Reports: ['view'],
            Settings: ['view', 'edit']
          }
        });
        await adminRole.save();
      }
      
      // Add users to school database
      for (const user of users) {
        // Check if user already exists in school database
        const existingUser = await SchoolUser.findOne({ email: user.email });
        
        if (!existingUser) {
          console.log(`   Adding user ${user.email} to ${schoolName} database...`);
          
          // Create user in school database
          const schoolUser = new SchoolUser({
            name: user.name,
            email: user.email,
            password: user.password, // Copy hashed password
            roleId: adminRole._id,
            status: user.status,
            schoolSubdomain: user.schoolSubdomain,
            modules: user.modules || [],
            avatarUrl: user.avatarUrl,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          });
          
          await schoolUser.save();
          console.log(`   ✅ Added ${user.email} to ${schoolName} database`);
        } else {
          console.log(`   ⚠️ User ${user.email} already exists in ${schoolName} database`);
        }
      }
      
      schoolConnection.close();
    }
    
    console.log('\n✅ School databases populated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

populateSchoolDatabases(); 