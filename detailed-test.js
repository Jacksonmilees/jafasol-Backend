const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

function log(message, color = '') {
  const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, endpoint, data = null) {
  try {
    log(`\n🔍 Testing: ${name}`, 'blue');
    log(`📍 Endpoint: ${method} ${endpoint}`, 'yellow');
    
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
      log(`📤 Request Data: ${JSON.stringify(data, null, 2)}`, 'yellow');
    }
    
    const response = await axios(config);
    
    log(`✅ Status: ${response.status}`, 'green');
    log(`📥 Response:`, 'green');
    console.log(JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    log(`❌ Status: ${error.response?.status || 500}`, 'red');
    log(`📥 Error Response:`, 'red');
    console.log(JSON.stringify(error.response?.data || error.message, null, 2));
    return false;
  }
}

async function runDetailedTests() {
  log('🧪 Detailed Endpoint Testing', 'bold');
  log('============================', 'bold');
  
  // Test 1: Health Check
  await testEndpoint('Health Check', 'GET', '/health');
  
  // Test 2: Authentication - Login Success
  await testEndpoint('Login Success', 'POST', '/api/auth/login', {
    email: 'admin@jafasol.com',
    password: 'password'
  });
  
  // Test 3: Authentication - Login Failure
  await testEndpoint('Login Failure', 'POST', '/api/auth/login', {
    email: 'admin@jafasol.com',
    password: 'wrongpassword'
  });
  
  // Test 4: Authentication - Register
  await testEndpoint('User Registration', 'POST', '/api/auth/register', {
    name: 'Test User',
    email: 'test@jafasol.com',
    password: 'password123',
    role: 'teacher'
  });
  
  // Test 5: Users - Get All
  await testEndpoint('Get All Users', 'GET', '/api/users');
  
  // Test 6: Users - Get by ID
  await testEndpoint('Get User by ID', 'GET', '/api/users/1');
  
  // Test 7: Users - Get Non-existent
  await testEndpoint('Get Non-existent User', 'GET', '/api/users/999');
  
  // Test 8: Students - Get All
  await testEndpoint('Get All Students', 'GET', '/api/students');
  
  // Test 9: Teachers - Get All
  await testEndpoint('Get All Teachers', 'GET', '/api/teachers');
  
  // Test 10: Academics - Classes
  await testEndpoint('Get All Classes', 'GET', '/api/academics/classes');
  
  // Test 11: Academics - Subjects
  await testEndpoint('Get All Subjects', 'GET', '/api/academics/subjects');
  
  // Test 12: Exams - Get All
  await testEndpoint('Get All Exams', 'GET', '/api/exams');
  
  // Test 13: Fees - Structures
  await testEndpoint('Get Fee Structures', 'GET', '/api/fees/structures');
  
  // Test 14: Attendance - Get All
  await testEndpoint('Get All Attendance', 'GET', '/api/attendance');
  
  // Test 15: 404 Handler
  await testEndpoint('404 Handler', 'GET', '/api/nonexistent');
  
  log('\n🎉 Detailed Testing Complete!', 'bold');
  log('==============================', 'bold');
}

runDetailedTests().catch(error => {
  log(`❌ Test execution failed: ${error.message}`, 'red');
  process.exit(1);
}); 