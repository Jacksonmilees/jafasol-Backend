const fs = require('fs');
const path = require('path');

console.log('🔧 Creating .env file with your Supabase credentials...\n');

const envContent = `# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database Configuration (Supabase)
DB_HOST=db.jhiiqqvvfwuqejsipemp.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=yo5S1dACNl8X1NXm
DB_DIALECT=postgres

# Supabase Configuration
SUPABASE_URL=https://jhiiqqvvfwuqejsipemp.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Configuration
JWT_SECRET=jafasol-super-secret-jwt-key-change-this-in-production-2024
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=jafasol-refresh-secret-key-change-this-in-production-2024
JWT_REFRESH_EXPIRES_IN=7d

# Google AI Configuration
GOOGLE_AI_API_KEY=your-google-ai-api-key

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_PASSKEY=your-mpesa-passkey
MPESA_ENVIRONMENT=sandbox

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
`;

try {
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ .env file created successfully!');
  console.log('📁 Location: backend/.env');
  console.log('\n🔐 Your Supabase credentials are configured:');
  console.log('   - Host: db.jhiiqqvvfwuqejsipemp.supabase.co');
  console.log('   - Database: postgres');
  console.log('   - User: postgres');
  console.log('   - Password: yo5S1dACNl8X1NXm');
  
  console.log('\n⚠️  Important: You still need to add your Supabase API keys:');
  console.log('   1. Go to your Supabase dashboard');
  console.log('   2. Navigate to Settings > API');
  console.log('   3. Copy the "anon public" and "service role" keys');
  console.log('   4. Replace "your-supabase-anon-key" and "your-supabase-service-role-key" in .env');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Add your Supabase API keys to .env file');
  console.log('2. Test database connection: node test-database.js');
  console.log('3. Start the server: npm start');
  
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📝 Manual Setup:');
  console.log('Create a .env file in the backend directory with the content above');
} 