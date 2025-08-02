const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Test login functionality
async function testLogin() {
  try {
    console.log('🧪 Testing login functionality...');
    
    // Connect to database
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Database connected');

    // Create User model
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, default: 'SuperAdmin' },
      status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
      avatarUrl: String,
      lastLoginAt: Date,
      createdAt: { type: Date, default: Date.now }
    });

    // Add comparePassword method
    userSchema.methods.comparePassword = async function(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };

    const User = mongoose.model('User', userSchema);

    // Check if admin user exists
    const adminUser = await User.findOne({ email: 'admin@jafasol.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found. Creating one...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('Jafasol2024!', 12);
      const newAdmin = new User({
        name: 'Super Administrator',
        email: 'admin@jafasol.com',
        password: hashedPassword,
        role: 'SuperAdmin',
        status: 'Active',
        avatarUrl: 'https://ui-avatars.com/api/?name=Super+Admin&background=0D9488&color=fff'
      });
      
      await newAdmin.save();
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user found');
    }

    // Test password verification
    const testUser = await User.findOne({ email: 'admin@jafasol.com' });
    const isPasswordValid = await testUser.comparePassword('Jafasol2024!');
    
    if (isPasswordValid) {
      console.log('✅ Password verification working');
    } else {
      console.log('❌ Password verification failed');
    }

    // Test API endpoint
    console.log('\n🌐 Testing API endpoint...');
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@jafasol.com',
        password: 'Jafasol2024!'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API login successful');
      console.log('Token:', data.token ? 'Present' : 'Missing');
      console.log('User:', data.user ? 'Present' : 'Missing');
    } else {
      const error = await response.text();
      console.log('❌ API login failed:', error);
    }

    console.log('\n📋 Login Credentials:');
    console.log('Email: admin@jafasol.com');
    console.log('Password: Jafasol2024!');
    console.log('URL: https://jafasol.com/admin');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run test
testLogin(); 