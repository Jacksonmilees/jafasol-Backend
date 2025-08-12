const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function finalPasswordFix() {
  try {
    console.log('🔧 FINAL PASSWORD FIX - Ensuring backend can access the password...');
    
    // Test multiple connection methods to ensure consistency
    const connections = [
      {
        name: 'Direct Connection',
        uri: 'mongodb://127.0.0.1:27017/school_jesus'
      },
      {
        name: 'Localhost Connection',
        uri: 'mongodb://localhost:27017/school_jesus'
      }
    ];
    
    for (const conn of connections) {
      console.log(`\n📝 Testing ${conn.name}...`);
      
      const connection = mongoose.createConnection(conn.uri);
      const User = connection.model('User', require('../models/User').schema);
      
      // Find the user
      const user = await User.findOne({ email: 'admin@jesus.jafasol.com' });
      
      if (user) {
        console.log(`✅ User found via ${conn.name}:`, user.name);
        console.log(`🔑 Current hash: ${user.password.substring(0, 20)}...`);
        
        // Test password
        const isValid = await bcrypt.compare('Jesus2024!', user.password);
        console.log(`🧪 Password test via ${conn.name}:`, isValid);
        
        if (!isValid) {
          console.log(`❌ Password invalid via ${conn.name} - updating...`);
          
          // Update password
          const saltRounds = 12;
          const newPassword = 'Jesus2024!';
          const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
          
          await User.findOneAndUpdate(
            { email: 'admin@jesus.jafasol.com' },
            { password: hashedPassword },
            { new: true }
          );
          
          console.log(`✅ Password updated via ${conn.name}`);
          
          // Verify update
          const updatedUser = await User.findOne({ email: 'admin@jesus.jafasol.com' });
          const newIsValid = await bcrypt.compare('Jesus2024!', updatedUser.password);
          console.log(`🧪 Updated password test via ${conn.name}:`, newIsValid);
        }
      } else {
        console.log(`❌ User not found via ${conn.name}`);
      }
      
      await connection.close();
    }
    
    console.log('\n📝 Testing backend-style connection...');
    
    // Test the exact same connection method the backend uses
    const mongoURI = 'mongodb://127.0.0.1:27017/jafasol';
    const subdomain = 'jesus';
    const schoolDbName = `school_${subdomain}`;
    
    let schoolDbURI;
    if (mongoURI.includes('?')) {
      schoolDbURI = mongoURI.replace('/jafasol?', `/${schoolDbName}?`);
    } else if (mongoURI.includes('/jafasol')) {
      schoolDbURI = mongoURI.replace('/jafasol', `/${schoolDbName}`);
    } else {
      schoolDbURI = mongoURI.replace('?', `/${schoolDbName}?`);
    }
    
    console.log(`🔗 Backend connection URI: ${schoolDbURI}`);
    
    const backendConnection = mongoose.createConnection(schoolDbURI);
    const BackendUser = backendConnection.model('User', require('../models/User').schema);
    
    const backendUser = await BackendUser.findOne({ email: 'admin@jesus.jafasol.com' });
    
    if (backendUser) {
      console.log('✅ User found via backend connection:', backendUser.name);
      console.log(`🔑 Backend hash: ${backendUser.password.substring(0, 20)}...`);
      
      const backendIsValid = await bcrypt.compare('Jesus2024!', backendUser.password);
      console.log('🧪 Backend password test:', backendIsValid);
      
      if (!backendIsValid) {
        console.log('❌ Backend password invalid - updating...');
        
        const saltRounds = 12;
        const newPassword = 'Jesus2024!';
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        await BackendUser.findOneAndUpdate(
          { email: 'admin@jesus.jafasol.com' },
          { password: hashedPassword },
          { new: true }
        );
        
        console.log('✅ Backend password updated');
        
        // Final verification
        const finalUser = await BackendUser.findOne({ email: 'admin@jesus.jafasol.com' });
        const finalIsValid = await bcrypt.compare('Jesus2024!', finalUser.password);
        console.log('🧪 Final backend password test:', finalIsValid);
        
        if (finalIsValid) {
          console.log('\n🎉 SUCCESS! Backend should now be able to login with:');
          console.log('📧 Email: admin@jesus.jafasol.com');
          console.log('🔑 Password: Jesus2024!');
        }
      }
    } else {
      console.log('❌ User not found via backend connection');
    }
    
    await backendConnection.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 All connections closed');
  }
}

finalPasswordFix();



