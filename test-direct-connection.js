const { Sequelize } = require('sequelize');

console.log('🔍 Testing direct connection to Supabase...\n');

const testConnection = async () => {
  try {
    // Try using the IPv6 address directly
    const ipv6Address = '2600:1f18:2e13:9d03:2419:1c5d:92e:5cb0';
    const databaseUrl = `postgresql://postgres:yo5S1dACNl8X1NXm@[${ipv6Address}]:5432/postgres`;
    
    console.log('Using IPv6 address:', ipv6Address);
    console.log('DATABASE_URL:', databaseUrl.replace(/:[^:@]*@/, ':****@'));
    
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
      console.log('\n💡 Password authentication failed. This means we can reach the server!');
      console.log('The issue is with the password. Let\'s verify:');
      console.log('1. Password: yo5S1dACNl8X1NXm');
      console.log('2. Check if this matches your Supabase dashboard');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Still can\'t resolve hostname');
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection refused');
    }
  }
};

testConnection(); 