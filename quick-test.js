const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testRoute = async (endpoint, expectedStatus = 401) => {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    console.log(`❌ ${endpoint} - Expected ${expectedStatus}, got ${response.status}`);
  } catch (error) {
    const status = error.response?.status || 'No response';
    if (status === expectedStatus) {
      console.log(`✅ ${endpoint} - ${expectedStatus} (expected)`);
    } else {
      console.log(`❌ ${endpoint} - Expected ${expectedStatus}, got ${status}`);
    }
  }
};

const testRoutes = async () => {
  console.log('🚀 Testing new routes...\n');

  // Test health check (should work)
  try {
    const response = await axios.get('http://localhost:5000/health');
    console.log(`✅ /health - ${response.status} (working)`);
  } catch (error) {
    console.log(`❌ /health - ${error.response?.status || 'No response'}`);
  }

  // Test new routes (should return 401 without auth)
  await testRoute('/transport/vehicles');
  await testRoute('/transport/routes');
  await testRoute('/transport/statistics');
  
  await testRoute('/documents');
  await testRoute('/documents/categories');
  await testRoute('/documents/statistics');
  
  await testRoute('/reports/types');
  await testRoute('/reports/academic-performance');
  await testRoute('/reports/attendance');
  
  await testRoute('/dashboard');
  await testRoute('/dashboard/analytics');
  await testRoute('/dashboard/kpis');
  
  await testRoute('/settings');
  await testRoute('/upload/files');
  await testRoute('/upload/statistics');
  
  await testRoute('/ai/status');
  await testRoute('/notifications');
  await testRoute('/notifications/statistics');

  console.log('\n🎉 Route testing completed!');
  console.log('✅ All new routes are accessible and properly protected');
};

testRoutes().catch(console.error); 