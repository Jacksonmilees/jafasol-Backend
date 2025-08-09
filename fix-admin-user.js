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
  lastLoginAt: Date
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hash password middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
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

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Create SuperAdmin role if it doesn't exist
    let superAdminRole = await Role.findOne({ name: 'SuperAdmin' });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'SuperAdmin',
        description: 'System super administrator with full access',
        permissions: ['*'],
        isSystem: true
      });
      console.log('✅ SuperAdmin role created');
    }

    // Check if admin user exists
    let adminUser = await User.findOne({ email: 'admin@jafasol.com' });
    
    if (adminUser) {
      console.log('⚠️ Admin user exists, updating...');
      adminUser.password = 'Jafasol2024!';
      adminUser.roleId = superAdminRole._id;
      adminUser.status = 'Active';
      await adminUser.save();
      console.log('✅ Admin user updated');
    } else {
      console.log('👤 Creating new admin user...');
      adminUser = await User.create({
        name: 'JafaSol Super Admin',
        email: 'admin@jafasol.com',
        password: 'Jafasol2024!',
        roleId: superAdminRole._id,
        status: 'Active'
      });
      console.log('✅ Admin user created');
    }

    console.log('📋 Admin credentials:');
    console.log('Email: admin@jafasol.com');
    console.log('Password: Jafasol2024!');
    
    // Test the user
    const testUser = await User.findOne({ email: 'admin@jafasol.com' }).populate('roleId');
    const isPasswordValid = await testUser.comparePassword('Jafasol2024!');
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful');
    } else {
      console.log('❌ Password verification failed');
    }

    console.log('🎉 Admin user setup completed!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
connectDB().then(createAdminUser); 