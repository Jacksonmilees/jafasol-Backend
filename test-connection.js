const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔍 Testing Supabase Connection String...\n');

// Log the connection details (without password)
console.log('Connection Details:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Password: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}`);

// Test the connection
const testConnection = async () => {
  try {
    const sequelize = new Sequelize(
      process.env.DB_NAME || 'postgres',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      }
    );

    console.log('\n🔄 Attempting to connect...');
    await sequelize.authenticate();
    console.log('✅ Connection successful!');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if the password is correct');
      console.log('2. Verify the password in your .env file');
      console.log('3. Make sure there are no extra spaces or characters');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if the hostname is correct');
      console.log('2. Verify your Supabase project is active');
      console.log('3. Check your internet connection');
    }
  }
};

testConnection(); 