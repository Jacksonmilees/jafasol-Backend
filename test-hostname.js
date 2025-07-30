const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);

console.log('🔍 Testing Supabase hostname resolution...\n');

const testHostname = async () => {
  const hostname = 'db.jhiiqqvvfwuqejsipemp.supabase.co';
  
  console.log(`Testing hostname: ${hostname}`);
  
  try {
    const addresses = await resolve4(hostname);
    console.log('✅ Hostname resolved successfully!');
    console.log('IP addresses:', addresses);
    
    // Test if we can reach the port
    const net = require('net');
    const testPort = (host, port) => {
      return new Promise((resolve) => {
        const socket = new net.Socket();
        const timeout = setTimeout(() => {
          socket.destroy();
          resolve(false);
        }, 5000);
        
        socket.connect(port, host, () => {
          clearTimeout(timeout);
          socket.destroy();
          resolve(true);
        });
        
        socket.on('error', () => {
          clearTimeout(timeout);
          socket.destroy();
          resolve(false);
        });
      });
    };
    
    console.log('\n🔄 Testing port 5432 connectivity...');
    const portReachable = await testPort(hostname, 5432);
    
    if (portReachable) {
      console.log('✅ Port 5432 is reachable!');
    } else {
      console.log('❌ Port 5432 is not reachable');
      console.log('💡 This might be due to:');
      console.log('   - Firewall blocking the connection');
      console.log('   - Supabase project being paused');
      console.log('   - Network restrictions');
    }
    
  } catch (error) {
    console.log('❌ Hostname resolution failed:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('1. Check if your Supabase project is active');
    console.log('2. Verify the project reference: jhiiqqvvfwuqejsipemp');
    console.log('3. Go to https://supabase.com/dashboard and check your project status');
    console.log('4. Try pausing and resuming your project');
  }
};

testHostname(); 