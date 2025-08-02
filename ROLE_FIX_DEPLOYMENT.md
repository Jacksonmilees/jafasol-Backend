# Role Fix Deployment Guide

## Issue Fixed:
- **Problem**: `User validation failed: roleId: Role is required`
- **Cause**: Backend was creating users with `role: 'Admin'` string instead of `roleId: ObjectId` reference
- **Fix**: Updated user creation to properly reference Role documents

## Manual Deployment Steps:

### 1. SSH into the production server
```bash
ssh root@jafasol.com -p 5050
```

### 2. Navigate to backend directory
```bash
cd /var/www/jafasol/backend
```

### 3. Stop PM2 processes
```bash
pm2 delete all
pm2 kill
pm2 flush
```

### 4. Pull latest changes
```bash
git pull origin main
```

### 5. Install dependencies
```bash
npm install
```

### 6. Copy the fixed server file
```bash
cp server-clean.js server.js
```

### 7. Start PM2 with fixed server
```bash
pm2 start server.js --name jafasol-backend
pm2 save
pm2 startup
```

### 8. Check server status
```bash
pm2 status
pm2 logs jafasol-backend --lines 10
```

## What the fix includes:

1. **✅ Role Creation**: Automatically creates Admin role if it doesn't exist
2. **✅ Proper Role Reference**: Uses `roleId: adminRole._id` instead of `role: 'Admin'`
3. **✅ School Database**: Also fixes role reference in school-specific database
4. **✅ Validation**: Ensures User model validation passes

## Expected Results:
- ✅ School creation should work without "Role is required" error
- ✅ Admin users will have proper role references
- ✅ Login and authentication should work correctly
- ✅ Admin permissions should be properly enforced

## Test the fix:
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test subdomain check (should work without auth)
curl -X POST -H "Content-Type: application/json" \
  -d '{"subdomain":"myschool"}' \
  http://localhost:5000/api/admin/subdomains/check
```

## Troubleshooting:
If you still see role errors:
1. Check PM2 logs: `pm2 logs jafasol-backend`
2. Verify Role collection exists: The fix automatically creates roles
3. Restart PM2: `pm2 restart jafasol-backend`
4. Check database connection: The fix handles role creation automatically 