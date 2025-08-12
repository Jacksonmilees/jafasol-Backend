const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function finalCompleteFix() {
  try {
    console.log('🔧 FINAL COMPLETE FIX - Resolving all remaining issues...');

    // Step 1: Fix password in all possible database connections
    console.log('\n📝 Step 1: Fixing password across all connections...');

    const connections = [
      'mongodb://127.0.0.1:27017/school_jesus',
      'mongodb://localhost:27017/school_jesus'
    ];

    for (const uri of connections) {
      console.log(`\n🔗 Testing connection: ${uri}`);

      const connection = mongoose.createConnection(uri);
      const User = connection.model('User', require('../models/User').schema);

      const user = await User.findOne({ email: 'admin@jesus.jafasol.com' });

      if (user) {
        console.log(`✅ User found: ${user.name}`);
        console.log(`🔑 Current hash: ${user.password.substring(0, 20)}...`);

        // Test current password
        const currentValid = await bcrypt.compare('Jesus2024!', user.password);
        console.log(`🧪 Current password test: ${currentValid}`);

        if (!currentValid) {
          console.log('❌ Password invalid - updating...');

          // Update password
          const saltRounds = 12;
          const newPassword = 'Jesus2024!';
          const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

          await User.findOneAndUpdate(
            { email: 'admin@jesus.jafasol.com' },
            { password: hashedPassword },
            { new: true }
          );

          console.log('✅ Password updated');

          // Verify update
          const updatedUser = await User.findOne({ email: 'admin@jesus.jafasol.com' });
          const newValid = await bcrypt.compare('Jesus2024!', updatedUser.password);
          console.log(`🧪 Updated password test: ${newValid}`);
        }
      } else {
        console.log('❌ User not found');
      }

      await connection.close();
    }

    // Step 2: Test the exact backend connection method
    console.log('\n📝 Step 2: Testing backend connection method...');

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

    console.log(`🔗 Backend URI: ${schoolDbURI}`);

    const backendConnection = mongoose.createConnection(schoolDbURI);
    const BackendUser = backendConnection.model('User', require('../models/User').schema);

    const backendUser = await BackendUser.findOne({ email: 'admin@jesus.jafasol.com' });

    if (backendUser) {
      console.log(`✅ Backend user found: ${backendUser.name}`);
      console.log(`🔑 Backend hash: ${backendUser.password.substring(0, 20)}...`);

      const backendValid = await bcrypt.compare('Jesus2024!', backendUser.password);
      console.log(`🧪 Backend password test: ${backendValid}`);

      if (!backendValid) {
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
        const finalValid = await bcrypt.compare('Jesus2024!', finalUser.password);
        console.log(`🧪 Final backend password test: ${finalValid}`);

        if (finalValid) {
          console.log('\n🎉 SUCCESS! Backend should now work with:');
          console.log('📧 Email: admin@jesus.jafasol.com');
          console.log('🔑 Password: Jesus2024!');
        }
      }
    } else {
      console.log('❌ Backend user not found');
    }

    await backendConnection.close();

    // Step 3: Check database collections
    console.log('\n📝 Step 3: Checking database structure...');

    const testConnection = mongoose.createConnection('mongodb://127.0.0.1:27017/school_jesus');
    const db = testConnection.db;
    const collections = await db.listCollections().toArray();

    console.log('📚 Collections in school_jesus:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    await testConnection.close();

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 All connections closed');
  }
}

finalCompleteFix();
