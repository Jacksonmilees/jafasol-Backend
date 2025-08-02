# Production Server Deployment Guide

## Current Issues Fixed:
1. ✅ Added missing admin endpoints (`/api/admin/analytics`, `/api/admin/support/tickets`, `/api/admin/backups`, `/api/admin/settings`)
2. ✅ Fixed subdomain check endpoint to be public (no authentication required)
3. ✅ Updated reserved subdomains list to be more realistic
4. ✅ Fixed syntax errors in server code

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

### 9. Test the endpoints
```bash
# Test subdomain check (should work without authentication)
curl -X POST -H "Content-Type: application/json" \
  -d '{"subdomain":"myschool"}' \
  http://localhost:5000/api/admin/subdomains/check

# Test health endpoint
curl http://localhost:5000/api/health
```

## Expected Results:
- ✅ Subdomain check should return `{"available": true}` for most subdomains
- ✅ All admin endpoints should return 200 status (when authenticated)
- ✅ No more 404 errors for missing endpoints
- ✅ No more 401 errors for subdomain check

## Troubleshooting:
If you see errors:
1. Check PM2 logs: `pm2 logs jafasol-backend`
2. Restart PM2: `pm2 restart jafasol-backend`
3. Check if server is running: `pm2 status`
4. Test locally: `curl http://localhost:5000/api/health`

## Frontend Configuration:
The frontend is already configured to use `https://jafasol.com` as the API base URL, so once the backend is updated, the frontend should work correctly. 