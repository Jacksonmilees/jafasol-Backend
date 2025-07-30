const fs = require('fs');
const path = require('path');

console.log('🔧 Updating .env file with MongoDB configuration...\n');

const envContent = `# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database Configuration (MongoDB)
MONGODB_URI=mongodb+srv://wdionet:3r14F65gMv@cluster0.lvltkqp.mongodb.net/jafasol?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=jafasol

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
  console.log('   - Switched from PostgreSQL to MongoDB');
  console.log('   - Using MongoDB Atlas cluster');
  console.log('   - Database: jafasol');
  console.log('   - User: wdionet');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Install MongoDB dependencies: npm install');
  console.log('2. Test MongoDB connection: node test-mongodb.js');
  console.log('3. Start the server: npm run dev');
  
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
} 