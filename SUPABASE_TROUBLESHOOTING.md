# 🔧 Supabase Connection Troubleshooting Guide

## Current Issue
- **Error**: `getaddrinfo ENOTFOUND db.jhiiqqvvfwuqejsipemp.supabase.co`
- **Status**: Server running with mock data ✅
- **Problem**: Cannot connect to Supabase database

## 🔍 Step-by-Step Troubleshooting

### 1. Verify Project Reference
**Current project reference**: `jhiiqqvvfwuqejsipemp`

**To verify:**
1. Go to https://supabase.com/dashboard
2. Check your project list
3. Verify the project reference matches exactly
4. If different, update your `.env` file

### 2. Check Project Status
**In your Supabase dashboard:**
1. Go to your project
2. Check if the project is **Active** (not paused)
3. If paused, click "Resume" to activate it
4. Wait 1-2 minutes for full activation

### 3. Verify Connection Strings
**From your Supabase dashboard:**
1. Go to **Settings > Database**
2. Copy the exact connection strings provided
3. Compare with your current `.env` file

### 4. Test Different Connection Methods

#### Method A: Direct Connection
```
DATABASE_URL=postgresql://postgres:yo5S1dACNl8X1NXm@db.jhiiqqvvfwuqejsipemp.supabase.co:5432/postgres
```

#### Method B: Session Pooler (IPv4 Compatible)
```
DATABASE_URL=postgresql://postgres:yo5S1dACNl8X1NXm@db.jhiiqqvvfwuqejsipemp.supabase.co:6543/postgres?pgbouncer=true
```

#### Method C: Connection Pooler
```
DATABASE_URL=postgresql://postgres:yo5S1dACNl8X1NXm@db.jhiiqqvvfwuqejsipemp.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```

### 5. Network/DNS Testing

#### Test DNS Resolution:
```bash
nslookup db.jhiiqqvvfwuqejsipemp.supabase.co
```

#### Test Port Connectivity:
```bash
telnet db.jhiiqqvvfwuqejsipemp.supabase.co 5432
telnet db.jhiiqqvvfwuqejsipemp.supabase.co 6543
```

### 6. Alternative Solutions

#### Option A: Use Different Region
1. Create a new Supabase project in a different region
2. Update connection strings with new project reference

#### Option B: Local Development Database
1. Install PostgreSQL locally
2. Use local database for development
3. Deploy with Supabase for production

#### Option C: Continue with Mock Data
- Server is working perfectly with mock data
- Can develop frontend and test API structure
- Add real database later

## 🚀 Quick Fixes to Try

### Fix 1: Update Project Reference
If your project reference is different, update your `.env` file:
```bash
# Replace jhiiqqvvfwuqejsipemp with your actual project reference
DB_HOST=db.YOUR-ACTUAL-PROJECT-REF.supabase.co
DATABASE_URL=postgresql://postgres:yo5S1dACNl8X1NXm@db.YOUR-ACTUAL-PROJECT-REF.supabase.co:6543/postgres?pgbouncer=true
```

### Fix 2: Resume Project
1. Go to Supabase dashboard
2. Find your project
3. Click "Resume" if it's paused
4. Wait 2 minutes
5. Test connection again

### Fix 3: Use Direct Connection
Update your `.env` file to use direct connection:
```bash
DATABASE_URL=postgresql://postgres:yo5S1dACNl8X1NXm@db.jhiiqqvvfwuqejsipemp.supabase.co:5432/postgres
```

## 📊 Current Status

✅ **What's Working:**
- Server running on port 5000
- All API routes responding
- Health endpoint working
- Mock data system functional

❌ **What's Not Working:**
- Database connection to Supabase
- Real data persistence

## 🎯 Next Steps

1. **Verify your project reference** in Supabase dashboard
2. **Check if project is active** (not paused)
3. **Try the connection strings** from your dashboard
4. **Test with different regions** if needed
5. **Continue development** with mock data while troubleshooting

## 📞 Support Resources

- **Supabase Status**: https://status.supabase.com
- **Supabase Docs**: https://supabase.com/docs
- **Community Forum**: https://github.com/supabase/supabase/discussions

## 🎉 Success Criteria

Once fixed, you should see:
- ✅ Database connection successful
- ✅ Tables created automatically
- ✅ Real data persistence
- ✅ Full CRUD operations working 