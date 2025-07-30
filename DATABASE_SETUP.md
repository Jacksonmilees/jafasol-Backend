# 🗄️ Database Setup Guide

## 📋 Prerequisites

1. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/windows/
   - Run installer and set a password for `postgres` user
   - Remember the password!

## 🔧 Step-by-Step Setup

### Step 1: Create Environment File

Create a file named `.env` in the `backend` folder with this content:

```env
# Server Configuration
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
```

**⚠️ Important:** Replace `your_postgres_password_here` with your actual PostgreSQL password!

### Step 2: Create Database

**Option A: Using pgAdmin (GUI)**
1. Open pgAdmin (installed with PostgreSQL)
2. Connect to PostgreSQL server
3. Right-click on "Databases"
4. Select "Create" → "Database"
5. Name it `jafasol_db`
6. Click "Save"

**Option B: Using Command Line**
```bash
createdb -U postgres jafasol_db
```

### Step 3: Test Database Connection

Run the test script:
```bash
node test-database.js
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Start the Server

```bash
npm run dev
```

## 🔍 Troubleshooting

### Common Issues:

1. **"psql is not recognized"**
   - Add PostgreSQL to PATH: `C:\Program Files\PostgreSQL\16\bin`
   - Or use full path: `"C:\Program Files\PostgreSQL\16\bin\psql.exe"`

2. **"Connection refused"**
   - Check if PostgreSQL service is running
   - Open Services (services.msc) and start "postgresql-x64-16"

3. **"Authentication failed"**
   - Verify password in .env file
   - Check if password matches PostgreSQL installation

4. **"Database does not exist"**
   - Create database manually: `createdb -U postgres jafasol_db`
   - Or use pgAdmin to create it

### Useful Commands:

```bash
# Test PostgreSQL connection
psql -U postgres -d jafasol_db

# List databases
psql -U postgres -c "\l"

# Create database
createdb -U postgres jafasol_db

# Drop database (if needed)
dropdb -U postgres jafasol_db
```

## ✅ Success Indicators

- ✅ `node test-database.js` shows "Database connection successful!"
- ✅ `npm run dev` starts without database errors
- ✅ Console shows "Database connection established successfully"
- ✅ Server runs on http://localhost:5000

## 🚀 Next Steps

After successful database setup:
1. The server will automatically create tables
2. You can start developing the frontend
3. API endpoints will be available at http://localhost:5000/api/

## 📞 Need Help?

- Check PostgreSQL service status
- Verify .env file configuration
- Test database connection manually
- Check firewall settings
- Ensure database exists 