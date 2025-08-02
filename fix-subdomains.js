const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function fixSubdomains() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to database');

    // Find all admin users with schoolSubdomain
    const adminUsers = await User.find({ 
      email: { $regex: /^admin@.*\.jafasol\.com$/ },
      schoolSubdomain: { $exists: true, $ne: null }
    });

    console.log(`Found ${adminUsers.length} admin users to fix`);

    for (const user of adminUsers) {
      // Extract full subdomain from email
      const email = user.email;
      const fullSubdomain = email.replace('admin@', '');
      
      console.log(`Fixing user: ${user.name} (${email}) -> subdomain: ${fullSubdomain}`);
      
      // Update the user with correct schoolSubdomain format
      await User.findByIdAndUpdate(user._id, {
        schoolSubdomain: fullSubdomain
      });
    }

    console.log('✅ Subdomain format fixed!');

    // Verify the fix
    const updatedUsers = await User.find({ 
      email: { $regex: /^admin@.*\.jafasol\.com$/ }
    }).select('name email schoolSubdomain');

    console.log('\n📋 Updated users:');
    console.log(JSON.stringify(updatedUsers, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixSubdomains(); 