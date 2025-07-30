const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

console.log('🗄️  JafaSol Database Setup');
console.log('=============================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jafasol_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
DB_DIALECT=postgres

# JWT Configuration
JWT_SECRET=jafasol-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=jafasol-refresh-secret-key-change-this-in-production
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

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('⚠️  Please update the database password in .env file\n');
} else {
  console.log('✅ .env file already exists\n');
}

console.log('📋 Database Setup Instructions:');
console.log('===============================');
console.log('');
console.log('1. Install PostgreSQL:');
console.log('   - Download from: https://www.postgresql.org/download/windows/');
console.log('   - Run installer and set a password for postgres user');
console.log('   - Remember the password you set!');
console.log('');
console.log('2. Update .env file:');
console.log('   - Open backend/.env');
console.log('   - Change DB_PASSWORD to your PostgreSQL password');
console.log('');
console.log('3. Create Database:');
console.log('   - Open pgAdmin (installed with PostgreSQL)');
console.log('   - Connect to PostgreSQL server');
console.log('   - Create a new database named "jafasol_db"');
console.log('   - Or use command line: createdb jafasol_db');
console.log('');
console.log('4. Install Dependencies:');
console.log('   - Run: npm install');
console.log('');
console.log('5. Start the Server:');
console.log('   - Run: npm run dev');
console.log('');
console.log('6. Test Connection:');
console.log('   - Server should start without database errors');
console.log('   - Check console for "Database connection established" message');
console.log('');
console.log('🔗 Useful Commands:');
console.log('===================');
console.log('psql -U postgres -d jafasol_db    # Connect to database');
console.log('\\dt                                # List tables');
console.log('\\q                                # Quit psql');
console.log('');
console.log('📞 Need Help?');
console.log('==============');
console.log('- Check PostgreSQL service is running');
console.log('- Verify password in .env file');
console.log('- Ensure database "jafasol_db" exists');
console.log('- Check firewall settings');
console.log(''); 