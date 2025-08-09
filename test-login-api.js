const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('🧪 Testing Login API');
    console.log('===================');
    
    const loginData = {
      email: 'admin@jafasol.com',
      password: 'Jafasol2024!'
    };
    
    console.log('📤 Sending login request...');
    console.log('   URL: http://localhost:5000/api/auth/login');
    console.log('   Data:', JSON.stringify(loginData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log('   Token:', data.token ? 'Present' : 'Missing');
      console.log('   User:', data.user ? data.user.name : 'Missing');
      console.log('   Role:', data.user?.role?.name || 'Missing');
    } else {
      const errorText = await response.text();
      console.log('❌ Login failed!');
      console.log('   Error:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        console.log('   Error details:', errorData);
      } catch (e) {
        console.log('   Raw error response');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLogin(); 