const mongoose = require('mongoose');

async function checkRoles() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/jafasol');
        console.log('Connected to MongoDB');

        // Import Role model
        const Role = require('../models/Role');
        const roles = await Role.find();
        
        console.log('\nAvailable Roles:');
        if (roles.length === 0) {
            console.log('No roles found in database');
            
            // Create default roles
            console.log('\nCreating default roles...');
            const defaultRoles = [
                { name: 'Admin', permissions: {} },
                { name: 'Class Teacher', permissions: {} },
                { name: 'Subject Teacher', permissions: {} }
            ];
            
            for (const roleData of defaultRoles) {
                const role = await Role.create(roleData);
                console.log(`✅ Created role: ${role.name} (ID: ${role._id})`);
            }
        } else {
            roles.forEach(role => {
                console.log(`- ${role.name} (ID: ${role._id})`);
            });
        }
        
        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkRoles();
