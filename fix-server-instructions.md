# Server Fix Instructions

## Problem
The server is failing with `MODULE_NOT_FOUND` error for `/var/www/jafasol/backend/routes/users.js`

## Solution
Follow these steps on your Linux server:

### 1. Stop PM2 and clear cache
```bash
pm2 delete all
pm2 kill
pm2 flush
```

### 2. Replace server.js with clean version
```bash
cd /var/www/jafasol/backend
cp server-clean.js server.js
```

### 3. Restart PM2
```bash
pm2 start server.js --name jafasol-backend
pm2 save
pm2 startup
```

### 4. Check if it's working
```bash
pm2 logs jafasol-backend
curl http://localhost:5000/api/health
```

## What this fixes:
- ✅ Removes all route imports that were causing MODULE_NOT_FOUND
- ✅ Implements multi-tenant architecture
- ✅ Adds school creation with subdomain validation
- ✅ Adds school-specific database isolation
- ✅ Includes all necessary endpoints for admin and school dashboards

## Expected output:
```
✅ Database connected successfully
🚀 Server running on port 5000
 Health check: http://localhost:5000/api/health
```

## Test the endpoints:
```bash
# Health check
curl http://localhost:5000/api/health

# Admin dashboard
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/dashboard

# School creation
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test School","email":"test@school.com","subdomain":"testschool"}' \
  http://localhost:5000/api/admin/schools
```

## Multi-tenant features now working:
- ✅ Subdomain routing (myschool.jafasol.com)
- ✅ Database isolation (school_myschool database)
- ✅ School-specific login and dashboard
- ✅ Admin dashboard for main domain
- ✅ Real-time subdomain validation
- ✅ Automatic admin user creation for schools 