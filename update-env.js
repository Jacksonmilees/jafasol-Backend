const fs = require('fs');
const path = require('path');

console.log('🔧 Updating .env file with Session Pooler configuration...\n');

const envContent = `# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database Configuration (Supabase) - Session Pooler (IPv4 Compatible)
DATABASE_URL=postgresql://postgres:yo5S1dACNl8X1NXm@db.jhiiqqvvfwuqejsipemp.supabase.co:6543/postgres?pgbouncer=true

# Alternative individual variables (if DATABASE_URL doesn't work)
DB_HOST=db.jhiiqqvvfwuqejsipemp.supabase.co
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=yo5S1dACNl8X1NXm
DB_DIALECT=postgres

# Supabase Configuration
SUPABASE_URL=https://jhiiqqvvfwuqejsipemp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaWlxcXZ2Znd1cWVqc2lwZW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzA5MTEsImV4cCI6MjA2NzM0NjkxMX0.JS0ciVz8815t2IipFPF3JoJd5LaaZgwAwwb1bGo7lTUI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaWlxcXZ2Znd1cWVqc2lwZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3MDkxMSwiZXhwIjoyMDY3MzQ2OTExfQ.Vy1AxezSSCwj-Y0gF94voNFGuL8i0DOpjZfuDSwcy1VI

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
  
  console.log('✅ .env file updated successfully!');
  console.log('📁 Location: backend/.env');
  console.log('\n🔧 Key Changes:');
  console.log('   - Using Session Pooler (port 6543)');
  console.log('   - Added pgbouncer=true parameter');
  console.log('   - IPv4 compatible connection');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Test the new connection: node test-database-url.js');
  console.log('2. Restart the server: npm run dev');
  console.log('3. Check if database connection works');
  
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
} 