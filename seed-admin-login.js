const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Role = require('./models/Role');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    // Clear existing admin users
    await User.deleteMany({ email: { $regex: /admin@jafasol\.com/i } });
    console.log('🗑️ Cleared existing admin users');

    // Create admin role if it doesn't exist
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin',
        description: 'System administrator with full access',
        permissions: {
          'all': ['read', 'write', 'delete'],
          'users': ['read', 'write', 'delete'],
          'schools': ['read', 'write', 'delete'],
          'reports': ['read', 'write']
        }
      });
      console.log('✅ Created admin role');
    }

    // Create super admin user
    const superAdmin = await User.create({
      name: 'JafaSol Super Admin',
      email: 'admin@jafasol.com',
      password: 'admin123', // Will be hashed by pre-save middleware
      status: 'Active',
      roleId: adminRole._id,
      lastLoginAt: new Date(),
      avatarUrl: 'https://picsum.photos/seed/admin/200/200'
    });

    console.log('✅ Created super admin user:');
    console.log(`   Email: admin@jafasol.com`);
    console.log(`   Password: admin123`);
    console.log(`   Name: ${superAdmin.name}`);
    console.log(`   Status: ${superAdmin.status}`);

    // Create additional admin users for testing
    const additionalAdmins = [
      {
        name: 'System Administrator',
        email: 'system@jafasol.com',
        password: 'system123',
        status: 'Active',
        roleId: adminRole._id,
        lastLoginAt: new Date(),
        avatarUrl: 'https://picsum.photos/seed/system/200/200'
      },
      {
        name: 'Platform Manager',
        email: 'manager@jafasol.com',
        password: 'manager123',
        status: 'Active',
        roleId: adminRole._id,
        lastLoginAt: new Date(),
        avatarUrl: 'https://picsum.photos/seed/manager/200/200'
      }
    ];

    for (const adminData of additionalAdmins) {
      await User.create(adminData);
      console.log(`✅ Created admin: ${adminData.email} (${adminData.password})`);
    }

    console.log('\n🎉 Admin login seeding completed!');
    console.log('\n📋 Available Admin Logins:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('│ Email: admin@jafasol.com     │ Password: admin123 │');
    console.log('│ Email: system@jafasol.com    │ Password: system123│');
    console.log('│ Email: manager@jafasol.com   │ Password: manager123│');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Use any of these credentials to login to the admin dashboard');

  } catch (error) {
    console.error('❌ Error seeding admin logins:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}); 