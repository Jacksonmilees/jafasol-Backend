const mongoose = require('mongoose');
require('dotenv').config();

// Connect to school database
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
const schoolDbURI = mongoURI.replace('/jafasol?', '/school_jesus?');

console.log('Connecting to school database: school_jesus');
const schoolConnection = mongoose.createConnection(schoolDbURI, { useNewUrlParser: true, useUnifiedTopology: true });

const SchoolUser = schoolConnection.model('User', require('./models/User').schema);

async function assignModulesToJesus() {
  try {
    console.log('🔧 Assigning Modules to Jesus School Admin');
    console.log('==========================================');
    
    // Find the admin user
    const adminUser = await SchoolUser.findOne({ email: 'admin@jesus.jafasol.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found in school database');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Current modules: ${adminUser.modules || 'None'}`);
    
    // Assign default modules for Jesus school
    const modules = [
      'studentManagement',
      'teacherManagement', 
      'academics',
      'attendance',
      'timetable',
      'exams',
      'fees',
      'communication',
      'library',
      'learningResources',
      'transport',
      'documentStore',
      'reports'
    ];
    
    // Update the user with modules
    adminUser.modules = modules;
    await adminUser.save();
    
    console.log('✅ Modules assigned successfully!');
    console.log(`   Assigned modules: ${modules.join(', ')}`);
    
    // Verify the update
    const updatedUser = await SchoolUser.findOne({ email: 'admin@jesus.jafasol.com' });
    console.log(`   Updated modules: ${updatedUser.modules.join(', ')}`);
    
    console.log('\n🎉 Jesus School Admin now has access to:');
    modules.forEach(module => {
      console.log(`   - ${module}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    schoolConnection.close();
    mongoose.connection.close();
  }
}

assignModulesToJesus(); 