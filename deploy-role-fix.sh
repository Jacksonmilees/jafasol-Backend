#!/bin/bash

# Role Fix Deployment Script
# This script will fix the roleId issue on the production server

echo "🚀 Deploying role fix to production server..."

# SSH into the production server and run the fixes
ssh root@jafasol.com -p 5050 << 'EOF'

echo "📁 Navigating to backend directory..."
cd /var/www/jafasol/backend

echo "🛑 Stopping PM2 processes..."
pm2 delete all
pm2 kill
pm2 flush

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔄 Copying fixed server file..."
cp server-clean.js server.js

echo "🚀 Starting PM2 with fixed server..."
pm2 start server.js --name jafasol-backend
pm2 save
pm2 startup

echo "✅ Checking server status..."
pm2 status
pm2 logs jafasol-backend --lines 10

echo "🧪 Testing school creation..."
# Test with a sample school creation
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"Test School","email":"test@school.com","subdomain":"testschool","plan":"Basic"}' \
  http://localhost:5000/api/admin/schools

echo "🎉 Role fix deployment complete!"
echo "🌐 Server should now handle school creation properly"

EOF

echo "✅ Role fix deployment script completed!" 