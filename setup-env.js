const fs = require('fs');
const path = require('path');

console.log('🚀 JafaSol School Management System - Environment Setup\n');

console.log('📋 Please provide your Supabase configuration details:');
console.log('(You can find these in your Supabase project dashboard)\n');

const questions = [
  {
    name: 'projectRef',
    message: 'Enter your Supabase project reference (e.g., jhiiqqvvfwuqejsipemp): ',
    validate: (input) => input.length > 0 ? true : 'Project reference is required'
  },
  {
    name: 'dbPassword',
    message: 'Enter your database password: ',
    validate: (input) => input.length > 0 ? true : 'Database password is required'
  },
  {
    name: 'anonKey',
    message: 'Enter your Supabase anon key: ',
    validate: (input) => input.length > 0 ? true : 'Anon key is required'
  },
  {
    name: 'serviceRoleKey',
    message: 'Enter your Supabase service role key: ',
    validate: (input) => input.length > 0 ? true : 'Service role key is required'
  }
];

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question.message, (answer) => {
      if (question.validate && !question.validate(answer)) {
        console.log(question.validate(answer));
        return askQuestion(question);
      }
      resolve(answer);
    });
  });
};

const setupEnvironment = async () => {
  try {
    console.log('🔧 Setting up environment variables...\n');

    const projectRef = await askQuestion(questions[0]);
    const dbPassword = await askQuestion(questions[1]);
    const anonKey = await askQuestion(questions[2]);
    const serviceRoleKey = await askQuestion(questions[3]);

    // Generate JWT secrets
    const jwtSecret = require('crypto').randomBytes(64).toString('hex');
    const jwtRefreshSecret = require('crypto').randomBytes(64).toString('hex');

    const envContent = `# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database Configuration (Supabase)
DB_HOST=db.${projectRef}.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=${dbPassword}
DB_DIALECT=postgres

# Supabase Configuration
SUPABASE_URL=https://${projectRef}.supabase.co
SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=${jwtRefreshSecret}
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

    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Environment file created successfully!');
    console.log('📁 File location: backend/.env');
    console.log('\n🔐 Security Note:');
    console.log('- JWT secrets have been generated automatically');
    console.log('- Keep your .env file secure and never commit it to version control');
    console.log('- Update other API keys (Google AI, M-Pesa, Email) as needed');

    console.log('\n🚀 Next Steps:');
    console.log('1. Test database connection: node test-database.js');
    console.log('2. Start the server: npm start');
    console.log('3. Test the API endpoints');

  } catch (error) {
    console.error('❌ Error setting up environment:', error.message);
  } finally {
    rl.close();
  }
};

setupEnvironment(); 