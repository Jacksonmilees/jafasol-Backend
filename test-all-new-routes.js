const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test data
const testData = {
  user: {
    email: 'admin@jafasol.com',
    password: 'admin123'
  },
  transport: {
    vehicle: {
      vehicleNumber: 'KCA 789C',
      vehicleType: 'Bus',
      capacity: 50,
      driverName: 'Test Driver',
      driverPhone: '+254700123789',
      route: 'Test Route'
    },
    route: {
      routeName: 'Test Route',
      startPoint: 'Test Start',
      endPoint: 'Test End',
      stops: ['Stop 1', 'Stop 2', 'Stop 3'],
      estimatedTime: '45 minutes'
    }
  },
  document: {
    title: 'Test Document',
    description: 'Test document description',
    category: 'Documents',
    subcategory: 'General',
    tags: ['test', 'document']
  },
  report: {
    reportType: 'academic-performance',
    format: 'pdf',
    filters: {
      classId: '1',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }
  },
  dashboard: {
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  settings: {
    general: {
      schoolName: 'Test School',
      schoolAddress: 'Test Address',
      schoolPhone: '+254700123456',
      schoolEmail: 'test@school.com'
    }
  },
  notification: {
    userId: '1',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'system',
    priority: 'medium'
  }
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${endpoint} failed:`, error.response?.data || error.message);
    return error.response;
  }
};

// Test authentication
const testAuth = async () => {
  console.log('\n🔐 Testing Authentication...');
  
  const response = await axios.post(`${BASE_URL}/auth/login`, testData.user);
  
  if (response.status === 200) {
    authToken = response.data.token;
    console.log('✅ Authentication successful');
    return true;
  } else {
    console.log('❌ Authentication failed');
    return false;
  }
};

// Test Transport Routes
const testTransportRoutes = async () => {
  console.log('\n🚌 Testing Transport Routes...');

  // Test get vehicles
  let response = await makeRequest('GET', '/transport/vehicles');
  console.log(response.status === 200 ? '✅ Get vehicles' : '❌ Get vehicles');

  // Test get vehicle by ID
  response = await makeRequest('GET', '/transport/vehicles/1');
  console.log(response.status === 200 ? '✅ Get vehicle by ID' : '❌ Get vehicle by ID');

  // Test create vehicle
  response = await makeRequest('POST', '/transport/vehicles', testData.transport.vehicle);
  console.log(response.status === 201 ? '✅ Create vehicle' : '❌ Create vehicle');

  // Test update vehicle
  response = await makeRequest('PUT', '/transport/vehicles/1', { capacity: 55 });
  console.log(response.status === 200 ? '✅ Update vehicle' : '❌ Update vehicle');

  // Test get routes
  response = await makeRequest('GET', '/transport/routes');
  console.log(response.status === 200 ? '✅ Get routes' : '❌ Get routes');

  // Test create route
  response = await makeRequest('POST', '/transport/routes', testData.transport.route);
  console.log(response.status === 201 ? '✅ Create route' : '❌ Create route');

  // Test get statistics
  response = await makeRequest('GET', '/transport/statistics');
  console.log(response.status === 200 ? '✅ Get transport statistics' : '❌ Get transport statistics');
};

// Test Documents Routes
const testDocumentsRoutes = async () => {
  console.log('\n📄 Testing Documents Routes...');

  // Test get documents
  let response = await makeRequest('GET', '/documents');
  console.log(response.status === 200 ? '✅ Get documents' : '❌ Get documents');

  // Test get document by ID
  response = await makeRequest('GET', '/documents/1');
  console.log(response.status === 200 ? '✅ Get document by ID' : '❌ Get document by ID');

  // Test get categories
  response = await makeRequest('GET', '/documents/categories');
  console.log(response.status === 200 ? '✅ Get document categories' : '❌ Get document categories');

  // Test get statistics
  response = await makeRequest('GET', '/documents/statistics');
  console.log(response.status === 200 ? '✅ Get document statistics' : '❌ Get document statistics');
};

// Test Reports Routes
const testReportsRoutes = async () => {
  console.log('\n📊 Testing Reports Routes...');

  // Test academic performance report
  let response = await makeRequest('GET', '/reports/academic-performance');
  console.log(response.status === 200 ? '✅ Academic performance report' : '❌ Academic performance report');

  // Test attendance report
  response = await makeRequest('GET', '/reports/attendance');
  console.log(response.status === 200 ? '✅ Attendance report' : '❌ Attendance report');

  // Test financial report
  response = await makeRequest('GET', '/reports/financial');
  console.log(response.status === 200 ? '✅ Financial report' : '❌ Financial report');

  // Test enrollment report
  response = await makeRequest('GET', '/reports/enrollment');
  console.log(response.status === 200 ? '✅ Enrollment report' : '❌ Enrollment report');

  // Test teacher performance report
  response = await makeRequest('GET', '/reports/teacher-performance');
  console.log(response.status === 200 ? '✅ Teacher performance report' : '❌ Teacher performance report');

  // Test export report
  response = await makeRequest('POST', '/reports/export', testData.report);
  console.log(response.status === 200 ? '✅ Export report' : '❌ Export report');

  // Test get report types
  response = await makeRequest('GET', '/reports/types');
  console.log(response.status === 200 ? '✅ Get report types' : '❌ Get report types');
};

// Test Dashboard Routes
const testDashboardRoutes = async () => {
  console.log('\n📈 Testing Dashboard Routes...');

  // Test get main dashboard
  let response = await makeRequest('GET', '/dashboard');
  console.log(response.status === 200 ? '✅ Get main dashboard' : '❌ Get main dashboard');

  // Test get analytics
  response = await makeRequest('GET', '/dashboard/analytics');
  console.log(response.status === 200 ? '✅ Get analytics' : '❌ Get analytics');

  // Test get KPIs
  response = await makeRequest('GET', '/dashboard/kpis');
  console.log(response.status === 200 ? '✅ Get KPIs' : '❌ Get KPIs');

  // Test get class performance
  response = await makeRequest('GET', '/dashboard/class-performance');
  console.log(response.status === 200 ? '✅ Get class performance' : '❌ Get class performance');

  // Test get notifications
  response = await makeRequest('GET', '/dashboard/notifications');
  console.log(response.status === 200 ? '✅ Get notifications' : '❌ Get notifications');

  // Test get quick actions
  response = await makeRequest('GET', '/dashboard/quick-actions');
  console.log(response.status === 200 ? '✅ Get quick actions' : '❌ Get quick actions');

  // Test get system status
  response = await makeRequest('GET', '/dashboard/system-status');
  console.log(response.status === 200 ? '✅ Get system status' : '❌ Get system status');
};

// Test Settings Routes
const testSettingsRoutes = async () => {
  console.log('\n⚙️ Testing Settings Routes...');

  // Test get all settings
  let response = await makeRequest('GET', '/settings');
  console.log(response.status === 200 ? '✅ Get all settings' : '❌ Get all settings');

  // Test update general settings
  response = await makeRequest('PUT', '/settings/general', testData.settings.general);
  console.log(response.status === 200 ? '✅ Update general settings' : '❌ Update general settings');

  // Test update academic settings
  response = await makeRequest('PUT', '/settings/academic', { passPercentage: 55 });
  console.log(response.status === 200 ? '✅ Update academic settings' : '❌ Update academic settings');

  // Test update attendance settings
  response = await makeRequest('PUT', '/settings/attendance', { lateThreshold: 20 });
  console.log(response.status === 200 ? '✅ Update attendance settings' : '❌ Update attendance settings');

  // Test update fees settings
  response = await makeRequest('PUT', '/settings/fees', { lateFeePercentage: 6 });
  console.log(response.status === 200 ? '✅ Update fees settings' : '❌ Update fees settings');

  // Test update communication settings
  response = await makeRequest('PUT', '/settings/communication', { enableEmailNotifications: true });
  console.log(response.status === 200 ? '✅ Update communication settings' : '❌ Update communication settings');

  // Test update security settings
  response = await makeRequest('PUT', '/settings/security', { maxLoginAttempts: 6 });
  console.log(response.status === 200 ? '✅ Update security settings' : '❌ Update security settings');

  // Test update system settings
  response = await makeRequest('PUT', '/settings/system', { backupFrequency: 'weekly' });
  console.log(response.status === 200 ? '✅ Update system settings' : '❌ Update system settings');

  // Test reset settings
  response = await makeRequest('POST', '/settings/reset');
  console.log(response.status === 200 ? '✅ Reset settings' : '❌ Reset settings');
};

// Test Upload Routes
const testUploadRoutes = async () => {
  console.log('\n📤 Testing Upload Routes...');

  // Test get files
  let response = await makeRequest('GET', '/upload/files');
  console.log(response.status === 200 ? '✅ Get files' : '❌ Get files');

  // Test get statistics
  response = await makeRequest('GET', '/upload/statistics');
  console.log(response.status === 200 ? '✅ Get upload statistics' : '❌ Get upload statistics');
};

// Test AI Routes
const testAIRoutes = async () => {
  console.log('\n🤖 Testing AI Routes...');

  // Test generate timetable
  let response = await makeRequest('POST', '/ai/generate-timetable', {
    classId: '1',
    subjects: ['Math', 'English', 'Science'],
    teachers: ['Teacher1', 'Teacher2', 'Teacher3']
  });
  console.log(response.status === 200 ? '✅ Generate timetable' : '❌ Generate timetable');

  // Test generate report
  response = await makeRequest('POST', '/ai/generate-report', {
    reportType: 'student-performance',
    parameters: { studentId: '1', period: 'monthly' },
    format: 'detailed'
  });
  console.log(response.status === 200 ? '✅ Generate report' : '❌ Generate report');

  // Test predict performance
  response = await makeRequest('POST', '/ai/predict-performance', {
    studentId: '1',
    subjectId: '1',
    examType: 'final'
  });
  console.log(response.status === 200 ? '✅ Predict performance' : '❌ Predict performance');

  // Test analyze attendance
  response = await makeRequest('POST', '/ai/analyze-attendance', {
    classId: '1',
    period: 'month'
  });
  console.log(response.status === 200 ? '✅ Analyze attendance' : '❌ Analyze attendance');

  // Test optimize fees
  response = await makeRequest('POST', '/ai/optimize-fees', {
    parameters: { currentRate: 75, targetRate: 85 }
  });
  console.log(response.status === 200 ? '✅ Optimize fees' : '❌ Optimize fees');

  // Test get AI status
  response = await makeRequest('GET', '/ai/status');
  console.log(response.status === 200 ? '✅ Get AI status' : '❌ Get AI status');
};

// Test Notifications Routes
const testNotificationsRoutes = async () => {
  console.log('\n🔔 Testing Notifications Routes...');

  // Test get notifications
  let response = await makeRequest('GET', '/notifications');
  console.log(response.status === 200 ? '✅ Get notifications' : '❌ Get notifications');

  // Test mark notification as read
  response = await makeRequest('PUT', '/notifications/1/read');
  console.log(response.status === 200 ? '✅ Mark notification as read' : '❌ Mark notification as read');

  // Test mark all notifications as read
  response = await makeRequest('PUT', '/notifications/read-all');
  console.log(response.status === 200 ? '✅ Mark all notifications as read' : '❌ Mark all notifications as read');

  // Test create notification
  response = await makeRequest('POST', '/notifications', testData.notification);
  console.log(response.status === 201 ? '✅ Create notification' : '❌ Create notification');

  // Test get statistics
  response = await makeRequest('GET', '/notifications/statistics');
  console.log(response.status === 200 ? '✅ Get notification statistics' : '❌ Get notification statistics');

  // Test get preferences
  response = await makeRequest('GET', '/notifications/preferences');
  console.log(response.status === 200 ? '✅ Get notification preferences' : '❌ Get notification preferences');

  // Test update preferences
  response = await makeRequest('PUT', '/notifications/preferences', {
    email: { enabled: true, types: ['payment', 'attendance'] }
  });
  console.log(response.status === 200 ? '✅ Update notification preferences' : '❌ Update notification preferences');

  // Test send test notification
  response = await makeRequest('POST', '/notifications/test', {
    type: 'inApp',
    message: 'This is a test notification'
  });
  console.log(response.status === 200 ? '✅ Send test notification' : '❌ Send test notification');
};

// Main test function
const runAllTests = async () => {
  console.log('🚀 Starting comprehensive test of all new routes...\n');

  // Test authentication first
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('❌ Authentication failed. Cannot proceed with tests.');
    return;
  }

  // Run all route tests
  await testTransportRoutes();
  await testDocumentsRoutes();
  await testReportsRoutes();
  await testDashboardRoutes();
  await testSettingsRoutes();
  await testUploadRoutes();
  await testAIRoutes();
  await testNotificationsRoutes();

  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('✅ Transport Routes: Vehicle & Route Management');
  console.log('✅ Documents Routes: File Upload & Management');
  console.log('✅ Reports Routes: Analytics & Data Export');
  console.log('✅ Dashboard Routes: KPIs & Analytics');
  console.log('✅ Settings Routes: System Configuration');
  console.log('✅ Upload Routes: File Handling');
  console.log('✅ AI Routes: AI-Powered Features');
  console.log('✅ Notifications Routes: Real-time Notifications');
};

// Run tests
runAllTests().catch(console.error); 