const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB Connection...\n');

const testMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('Using MongoDB URI:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    // Connect to MongoDB
    console.log('\n🔄 Attempting to connect...');
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected successfully!');
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`🔌 Port: ${conn.connection.port}`);
    
    // Test database operations
    console.log('\n🔄 Testing database operations...');
    
    // Create a test collection
    const testCollection = mongoose.connection.collection('test');
    
    // Insert a test document
    const testDoc = {
      message: 'JafaSol MongoDB Test',
      timestamp: new Date(),
      status: 'success'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ Document inserted successfully!');
    console.log(`📄 Document ID: ${insertResult.insertedId}`);
    
    // Query the test document
    const queryResult = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('✅ Document queried successfully!');
    console.log(`📄 Message: ${queryResult.message}`);
    
    // Clean up - delete test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Test document cleaned up!');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📚 Available collections:');
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    await mongoose.disconnect();
    console.log('\n🎉 MongoDB test completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Connection: Working');
    console.log('✅ Insert: Working');
    console.log('✅ Query: Working');
    console.log('✅ Cleanup: Working');
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n💡 Authentication failed. Check:');
      console.log('1. Username: wdionet');
      console.log('2. Password: 3r14F65gMv');
      console.log('3. Database permissions');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Network error. Check:');
      console.log('1. Internet connection');
      console.log('2. MongoDB Atlas cluster status');
      console.log('3. Network firewall settings');
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection refused. Check:');
      console.log('1. MongoDB Atlas cluster is active');
      console.log('2. IP whitelist settings');
      console.log('3. Network connectivity');
    }
  }
};

testMongoDB(); 