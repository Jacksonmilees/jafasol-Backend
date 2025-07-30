const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔍 Testing Supabase Session Pooler connection...\n');

const testConnection = async () => {
  try {
    // Try different session pooler formats
    const connectionStrings = [
      // Format 1: Standard session pooler
      'postgresql://postgres:yo5S1dACNl8X1NXm@db.jhiiqqvvfwuqejsipemp.supabase.co:6543/postgres?pgbouncer=true',
      
      // Format 2: With session mode
      'postgresql://postgres:yo5S1dACNl8X1NXm@db.jhiiqqvvfwuqejsipemp.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1',
      
      // Format 3: Direct connection (fallback)
      'postgresql://postgres:yo5S1dACNl8X1NXm@db.jhiiqqvvfwuqejsipemp.supabase.co:5432/postgres'
    ];

    for (let i = 0; i < connectionStrings.length; i++) {
      const databaseUrl = connectionStrings[i];
      console.log(`\n🔄 Testing connection format ${i + 1}:`);
      console.log('URL:', databaseUrl.replace(/:[^:@]*@/, ':****@'));
      
      try {
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

        await sequelize.authenticate();
        console.log('✅ Connection successful!');
        
        // Test a simple query
        const result = await sequelize.query('SELECT version()');
        console.log('✅ Query successful!');
        console.log('Database version:', result[0][0].version);
        
        await sequelize.close();
        console.log('\n🎉 Database connection test completed successfully!');
        return; // Exit if successful
        
      } catch (error) {
        console.log(`❌ Format ${i + 1} failed:`, error.message);
        if (i === connectionStrings.length - 1) {
          console.log('\n💡 All connection formats failed.');
          console.log('Possible solutions:');
          console.log('1. Check your Supabase project status');
          console.log('2. Verify the project reference');
          console.log('3. Try using a different region');
          console.log('4. Check if your project is paused');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
};

testConnection(); 