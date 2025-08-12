const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function simpleTestSetup() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/jafasol');
        console.log('🔗 Connected to local MongoDB');

        // Import models
        const User = require('../models/User');
        const Role = require('../models/Role');
        
        console.log('🏗️ Setting up basic test data for Jesus school...\n');

        // Get Admin role
        const adminRole = await Role.findOne({ name: 'Admin' });
        if (!adminRole) {
            throw new Error('Admin role not found');
        }
        console.log(`✅ Found Admin role: ${adminRole._id}`);

        // Clear existing test users
        await User.deleteMany({ email: { $regex: /test.*@jesus\.jafasol\.com/ } });
        console.log('🧹 Cleared existing test users');

        // Create test users with minimal required fields
        const hashedPassword = await bcrypt.hash('test123', 10);

        const testUsers = [
            {
                name: 'Sister Mary Catherine',
                email: 'test.mary@jesus.jafasol.com',
                password: hashedPassword,
                roleId: adminRole._id,
                status: 'Active'
            },
            {
                name: 'Brother John Paul',
                email: 'test.john@jesus.jafasol.com',
                password: hashedPassword,
                roleId: adminRole._id,
                status: 'Active'
            },
            {
                name: 'Dr. Grace Emmanuel',
                email: 'test.grace@jesus.jafasol.com',
                password: hashedPassword,
                roleId: adminRole._id,
                status: 'Active'
            },
            {
                name: 'Father Michael Joseph',
                email: 'test.michael@jesus.jafasol.com',
                password: hashedPassword,
                roleId: adminRole._id,
                status: 'Active'
            },
            {
                name: 'Mrs. Ruth David',
                email: 'test.ruth@jesus.jafasol.com',
                password: hashedPassword,
                roleId: adminRole._id,
                status: 'Active'
            }
        ];

        console.log('👥 Creating test users...');
        for (const userData of testUsers) {
            const user = await User.create(userData);
            console.log(`✅ Created user: ${user.name} (${user.email})`);
        }

        console.log('\n🎉 Basic test setup completed successfully!\n');
        
        console.log('🔑 TEST LOGIN CREDENTIALS for Jesus School:');
        console.log('✝️  test.mary@jesus.jafasol.com (Sister Mary Catherine)');
        console.log('✝️  test.john@jesus.jafasol.com (Brother John Paul)'); 
        console.log('👩‍🏫 test.grace@jesus.jafasol.com (Dr. Grace Emmanuel)');
        console.log('👨‍🏫 test.michael@jesus.jafasol.com (Father Michael Joseph)');
        console.log('🎵  test.ruth@jesus.jafasol.com (Mrs. Ruth David)');
        console.log('🔐 Password: test123');
        console.log('\n📍 Database: Local MongoDB Docker (127.0.0.1:27017/jafasol)');

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from database');

    } catch (error) {
        console.error('❌ Error setting up test data:', error.message);
        process.exit(1);
    }
}

simpleTestSetup();



