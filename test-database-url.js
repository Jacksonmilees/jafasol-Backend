const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔍 Testing Supabase connection with DATABASE_URL...\n');

const testConnection = async () => {
  try {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:yo5S1dACNl8X1NXm@db.jhiiqqvvfwuqejsipemp.supabase.co:5432/postgres';
    
    console.log('Using DATABASE_URL:', databaseUrl.replace(/:[^:@]*@/, ':****@'));
    
    const sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });

    console.log('\n🔄 Attempting to connect...');
    await sequelize.authenticate();
    console.log('✅ Connection successful!');
    
    // Test a simple query
    console.log('\n🔄 Testing query...');
    const result = await sequelize.query('SELECT version()');
    console.log('✅ Query successful!');
    console.log('Database version:', result[0][0].version);
    
    await sequelize.close();
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Password authentication failed. Possible solutions:');
      console.log('1. Check if the password is correct');
      console.log('2. Verify the password in your Supabase dashboard');
      console.log('3. Make sure there are no extra spaces or characters');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Hostname not found. Possible solutions:');
      console.log('1. Check if your Supabase project is active');
      console.log('2. Verify the project reference');
      console.log('3. Try pausing and resuming your project');
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection refused. Possible solutions:');
      console.log('1. Check if your Supabase project is active');
      console.log('2. Verify the port number (5432)');
      console.log('3. Check firewall settings');
    }
  }
};

testConnection(); 