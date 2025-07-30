const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB Connection...\n');

// Log the connection details (without password)
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
console.log('Connection Details:');
console.log(`URI: ${mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

// Test the connection
const testConnection = async () => {
  try {
    console.log('\n🔄 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connection successful!');
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Collections found: ${collections.length}`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ MongoDB Connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if the MongoDB credentials are correct');
      console.log('2. Verify the connection string in your .env file');
      console.log('3. Make sure the MongoDB Atlas cluster is accessible');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the MongoDB Atlas cluster is active');
      console.log('3. Check if the cluster URL is correct');
    }
  }
};

testConnection(); 