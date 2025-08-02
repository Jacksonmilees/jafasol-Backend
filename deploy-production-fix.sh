#!/bin/bash

# Production Server Fix Script
# This script will update the backend on the production server

echo "🚀 Deploying fixes to production server..."

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

echo "🧪 Testing endpoints..."
curl -X POST -H "Content-Type: application/json" \
  -d '{"subdomain":"myschool"}' \
  http://localhost:5000/api/admin/subdomains/check

echo "🎉 Production deployment complete!"
echo "🌐 Server should now be accessible at https://jafasol.com"

EOF

echo "✅ Production deployment script completed!" 