# 🚀 Supabase Setup Guide for JafaSol School Management System

## 📋 Prerequisites
- Supabase account (free tier available)
- Node.js and npm installed
- Git repository cloned

## 🔧 Step 1: Create Supabase Project

### 1.1 Sign up for Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Create an account or sign in with GitHub

### 1.2 Create New Project
1. Click "New Project"
2. Choose your organization
3. Enter project details:
   - **Name**: `jafasol-school-management`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
4. Click "Create new project"

### 1.3 Get Connection Details
Once your project is created, go to **Settings > Database** to find:
- **Host**: `db.your-project-ref.supabase.co`
- **Database name**: `postgres`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: (the one you created)

## 🔑 Step 2: Get API Keys

### 2.1 Get API Keys
1. Go to **Settings > API**
2. Copy the following:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Create .env file
Create a `.env` file in the `backend` directory:

```bash
# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database Configuration (Supabase)
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_DIALECT=postgres

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
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

### 3.2 Replace Placeholder Values
Replace the following with your actual Supabase values:

- `your-project-ref` → Your actual project reference
- `your-database-password` → Your database password
- `your-supabase-anon-key` → Your anon public key
- `your-supabase-service-role-key` → Your service role key

## 🗄️ Step 4: Database Schema Setup

### 4.1 Run Database Migration
The system will automatically create tables when it starts. Run:

```bash
cd backend
npm start
```

### 4.2 Verify Tables Created
Go to **Supabase Dashboard > Table Editor** to verify these tables were created:

- `users`
- `roles`
- `students`
- `teachers`
- `school_classes`
- `subjects`
- `exams`
- `fee_structures`
- `fee_invoices`
- `fee_payments`
- `attendance_records`
- `timetable_entries`
- `messages`
- `books`
- `book_issues`
- `learning_resources`
- `audit_logs`

## 🧪 Step 5: Test Database Connection

### 5.1 Test Connection
Run the test script:

```bash
cd backend
node test-database.js
```

### 5.2 Expected Output
```
✅ Database connection successful!
✅ All tables created successfully!
✅ Test data inserted successfully!
```

## 🔐 Step 6: Security Configuration

### 6.1 Row Level Security (RLS)
Enable RLS for sensitive tables:

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

### 6.2 API Security
1. Go to **Settings > API**
2. Enable **Row Level Security** for all tables
3. Configure policies as needed

## 📊 Step 7: Monitor and Debug

### 7.1 Database Logs
- Go to **Logs > Database** to see SQL queries
- Monitor performance and errors

### 7.2 API Logs
- Go to **Logs > API** to see API requests
- Monitor authentication and authorization

## 🚀 Step 8: Production Deployment

### 8.1 Environment Variables
For production, update your environment variables:

```bash
NODE_ENV=production
DB_HOST=db.your-project-ref.supabase.co
DB_PASSWORD=your-production-password
JWT_SECRET=your-production-jwt-secret
```

### 8.2 Security Best Practices
1. Use strong passwords
2. Enable 2FA on Supabase account
3. Regularly rotate API keys
4. Monitor usage and costs
5. Set up alerts for unusual activity

## 🔧 Troubleshooting

### Common Issues:

#### 1. Connection Refused
```
Error: connect ECONNREFUSED
```
**Solution**: Check your DB_HOST and ensure the project is active

#### 2. Authentication Failed
```
Error: password authentication failed
```
**Solution**: Verify your DB_PASSWORD in the .env file

#### 3. SSL Connection Required
```
Error: no pg_hba.conf entry for host
```
**Solution**: Supabase requires SSL. The connection should work automatically.

#### 4. Table Not Found
```
Error: relation "users" does not exist
```
**Solution**: Run the database sync by starting the server

## 📞 Support

If you encounter issues:

1. **Check Supabase Status**: [https://status.supabase.com](https://status.supabase.com)
2. **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
3. **Community Forum**: [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)

## 🎉 Success!

Once configured, your JafaSol School Management System will be running with:
- ✅ Real-time database
- ✅ Automatic backups
- ✅ Row-level security
- ✅ API authentication
- ✅ Scalable infrastructure

Your backend is now ready for production use! 🚀 