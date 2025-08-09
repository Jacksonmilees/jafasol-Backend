const http = require('http');

function testLogin() {
  console.log('🧪 Testing Login API');
  console.log('===================');
  
  const loginData = {
    email: 'admin@jafasol.com',
    password: 'Jafasol2024!'
  };
  
  const postData = JSON.stringify(loginData);
  
  console.log('📤 Sending login request...');
  console.log('   URL: http://localhost:5000/api/auth/login');
  console.log('   Data:', postData);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`📥 Response Status: ${res.statusCode} ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          console.log('✅ Login successful!');
          console.log('   Token:', response.token ? 'Present' : 'Missing');
          console.log('   User:', response.user ? response.user.name : 'Missing');
          console.log('   Role:', response.user?.role?.name || 'Missing');
        } catch (e) {
          console.log('❌ Failed to parse response:', data);
        }
      } else {
        console.log('❌ Login failed!');
        console.log('   Error:', data);
        
        try {
          const errorData = JSON.parse(data);
          console.log('   Error details:', errorData);
        } catch (e) {
          console.log('   Raw error response');
        }
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });
  
  req.write(postData);
  req.end();
}

testLogin(); 