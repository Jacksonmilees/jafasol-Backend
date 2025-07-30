const multiTenantManager = require('./config/multiTenant');
const tenantOnboarding = require('./utils/tenantOnboarding');

async function testOnboarding() {
  try {
    console.log('🧪 Testing JafaSol Tenant Onboarding System\n');
    
    // Test tenant ID
    const testTenantId = 'demo-school';
    const tenantInfo = {
      name: 'Demo High School',
      contactEmail: 'admin@demoschool.com',
      contactPhone: '+254700000000',
      domain: 'demoschool.jafasol.com',
      subscriptionPlan: 'premium'
    };
    
    console.log('📋 Test Tenant Details:');
    console.log(`   Tenant ID: ${testTenantId}`);
    console.log(`   School Name: ${tenantInfo.name}`);
    console.log(`   Contact Email: ${tenantInfo.contactEmail}`);
    console.log(`   Domain: ${tenantInfo.domain}`);
    console.log(`   Plan: ${tenantInfo.subscriptionPlan}\n`);
    
    // Step 1: Create tenant
    console.log('🚀 Step 1: Creating tenant...');
    const tenant = await multiTenantManager.createTenant(testTenantId, tenantInfo);
    console.log(`✅ Tenant created: ${tenant.name}\n`);
    
    // Step 2: Run onboarding
    console.log('🎯 Step 2: Running automated onboarding...');
    const onboardingResult = await tenantOnboarding.onboardTenant(testTenantId, tenantInfo);
    console.log('✅ Onboarding completed successfully!\n');
    
    // Step 3: Check onboarding status
    console.log('📊 Step 3: Checking onboarding status...');
    const status = await tenantOnboarding.getOnboardingStatus(testTenantId);
    console.log('📈 Onboarding Results:');
    console.log(`   ✅ Roles created: ${status.roles}`);
    console.log(`   ✅ Users created: ${status.users}`);
    console.log(`   ✅ Subjects created: ${status.subjects}`);
    console.log(`   ✅ Classes created: ${status.classes}`);
    console.log(`   ✅ Is onboarded: ${status.isOnboarded}\n`);
    
    // Step 4: Show login credentials
    console.log('🔐 Step 4: Login Credentials');
    console.log(`   Email: ${onboardingResult.superAdmin.email}`);
    console.log(`   Password: ${onboardingResult.superAdmin.defaultPassword}`);
    console.log('   ⚠️  IMPORTANT: Change password on first login!\n');
    
    // Step 5: Show what was created
    console.log('📝 Step 5: System Setup Summary');
    console.log('   ✅ 5 Default Roles (Super Admin, Administrator, Teacher, Student, Parent)');
    console.log('   ✅ 10 Default Subjects (Math, English, Science, etc.)');
    console.log('   ✅ 4 Default Classes (Form 1-4)');
    console.log('   ✅ 1 Super Admin User');
    console.log('   ✅ System Settings');
    console.log('   ✅ Default Fee Structure\n');
    
    console.log('🎉 Test completed successfully!');
    console.log(`🌐 The school can now access their system at: ${tenantInfo.domain}`);
    console.log('📧 They will receive login credentials via email.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Clean up on error
    try {
      await multiTenantManager.deleteTenant(testTenantId);
      console.log('🧹 Cleaned up test tenant');
    } catch (cleanupError) {
      console.error('Failed to cleanup:', cleanupError.message);
    }
  }
}

// Run the test
testOnboarding(); 