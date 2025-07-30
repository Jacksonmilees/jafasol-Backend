const { Sequelize } = require('sequelize');
const dns = require('dns');

// Force IPv4 resolution
dns.setDefaultResultOrder('ipv4first');

console.log('🔍 Testing Supabase connection with IPv4...\n');

const testConnection = async () => {
  try {
    const databaseUrl = 'postgresql://postgres:yo5S1dACNl8X1NXm@db.jhiiqqvvfwuqejsipemp.supabase.co:5432/postgres';
    
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
    
    await sequelize.close();
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Hostname not found. Let\'s try a different approach...');
      console.log('1. The hostname might be resolving to IPv6 only');
      console.log('2. Let\'s try using the direct IP address');
      
      // Try to get the IP address
      const { promisify } = require('util');
      const resolve4 = promisify(dns.resolve4);
      
      try {
        console.log('\n🔄 Trying to resolve IPv4 address...');
        const addresses = await resolve4('db.jhiiqqvvfwuqejsipemp.supabase.co');
        console.log('IPv4 addresses found:', addresses);
        
        if (addresses.length > 0) {
          console.log('\n🔄 Trying connection with IP address...');
          const ipUrl = `postgresql://postgres:yo5S1dACNl8X1NXm@${addresses[0]}:5432/postgres`;
          
          const sequelize2 = new Sequelize(ipUrl, {
            dialect: 'postgres',
            logging: false,
            dialectOptions: {
              ssl: {
                require: true,
                rejectUnauthorized: false
              }
            }
          });
          
          await sequelize2.authenticate();
          console.log('✅ Connection with IP address successful!');
          await sequelize2.close();
        }
      } catch (resolveError) {
        console.log('❌ IPv4 resolution failed:', resolveError.message);
      }
    }
  }
};

testConnection(); 