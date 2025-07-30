const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, result, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL';
  const color = result ? 'green' : 'red';
  console.log(`${colors[color]}${status}${colors.reset} - ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      success: response.status === expectedStatus,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.message,
      data: error.response?.data
    };
  }
}

async function runTests() {
  log('🧪 Starting Endpoint Tests', 'bold');
  log('========================', 'bold');
  console.log('');

  // Test 1: Health Check
  log('1. Testing Health Check Endpoint', 'blue');
  const healthResult = await testEndpoint('GET', '/health');
  logTest('Health Check', healthResult.success, `Status: ${healthResult.status}`);
  if (healthResult.success) {
    console.log(`   Response: ${JSON.stringify(healthResult.data, null, 2)}`);
  }
  console.log('');

  // Test 2: Authentication - Login
  log('2. Testing Authentication - Login', 'blue');
  const loginResult = await testEndpoint('POST', '/api/auth/login', {
    email: 'admin@jafasol.com',
    password: 'password'
  });
  logTest('Login with valid credentials', loginResult.success, `Status: ${loginResult.status}`);
  
  const loginInvalidResult = await testEndpoint('POST', '/api/auth/login', {
    email: 'admin@jafasol.com',
    password: 'wrongpassword'
  });
  logTest('Login with invalid credentials', loginInvalidResult.status === 401, `Status: ${loginInvalidResult.status}`);
  console.log('');

  // Test 3: Authentication - Register
  log('3. Testing Authentication - Register', 'blue');
  const registerResult = await testEndpoint('POST', '/api/auth/register', {
    name: 'Test User',
    email: 'test@jafasol.com',
    password: 'password123',
    role: 'teacher'
  });
  logTest('User Registration', registerResult.success, `Status: ${registerResult.status}`);
  console.log('');

  // Test 4: Users Endpoints
  log('4. Testing Users Endpoints', 'blue');
  const usersResult = await testEndpoint('GET', '/api/users');
  logTest('Get All Users', usersResult.success, `Status: ${usersResult.status}`);
  
  const userByIdResult = await testEndpoint('GET', '/api/users/1');
  logTest('Get User by ID', userByIdResult.success, `Status: ${userByIdResult.status}`);
  
  const userNotFoundResult = await testEndpoint('GET', '/api/users/999');
  logTest('Get Non-existent User', userNotFoundResult.status === 404, `Status: ${userNotFoundResult.status}`);
  console.log('');

  // Test 5: Students Endpoints
  log('5. Testing Students Endpoints', 'blue');
  const studentsResult = await testEndpoint('GET', '/api/students');
  logTest('Get All Students', studentsResult.success, `Status: ${studentsResult.status}`);
  console.log('');

  // Test 6: Teachers Endpoints
  log('6. Testing Teachers Endpoints', 'blue');
  const teachersResult = await testEndpoint('GET', '/api/teachers');
  logTest('Get All Teachers', teachersResult.success, `Status: ${teachersResult.status}`);
  console.log('');

  // Test 7: Academics Endpoints
  log('7. Testing Academics Endpoints', 'blue');
  const classesResult = await testEndpoint('GET', '/api/academics/classes');
  logTest('Get All Classes', classesResult.success, `Status: ${classesResult.status}`);
  
  const subjectsResult = await testEndpoint('GET', '/api/academics/subjects');
  logTest('Get All Subjects', subjectsResult.success, `Status: ${subjectsResult.status}`);
  console.log('');

  // Test 8: Exams Endpoints
  log('8. Testing Exams Endpoints', 'blue');
  const examsResult = await testEndpoint('GET', '/api/exams');
  logTest('Get All Exams', examsResult.success, `Status: ${examsResult.status}`);
  console.log('');

  // Test 9: Fees Endpoints
  log('9. Testing Fees Endpoints', 'blue');
  const feesResult = await testEndpoint('GET', '/api/fees/structures');
  logTest('Get Fee Structures', feesResult.success, `Status: ${feesResult.status}`);
  console.log('');

  // Test 10: Attendance Endpoints
  log('10. Testing Attendance Endpoints', 'blue');
  const attendanceResult = await testEndpoint('GET', '/api/attendance');
  logTest('Get All Attendance Records', attendanceResult.success, `Status: ${attendanceResult.status}`);
  console.log('');

  // Test 11: 404 Handler
  log('11. Testing 404 Handler', 'blue');
  const notFoundResult = await testEndpoint('GET', '/api/nonexistent');
  logTest('404 Handler', notFoundResult.status === 404, `Status: ${notFoundResult.status}`);
  console.log('');

  log('🎉 Endpoint Testing Complete!', 'bold');
  log('=============================', 'bold');
}

// Run the tests
runTests().catch(error => {
  log(`❌ Test execution failed: ${error.message}`, 'red');
  process.exit(1);
}); 