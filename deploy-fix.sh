#!/bin/bash

echo "🔧 Fixing Jafasol Backend Server..."

# Stop all PM2 processes
echo "Stopping PM2 processes..."
pm2 delete all
pm2 kill
pm2 flush

# Wait a moment
sleep 2

# Navigate to backend directory
cd /var/www/jafasol/backend

# Backup current server.js
echo "Backing up current server.js..."
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)

# Replace with clean version
echo "Replacing server.js with clean version..."
cp server-clean.js server.js

# Install dependencies if needed
echo "Checking dependencies..."
npm install

# Start the server
echo "Starting server with PM2..."
pm2 start server.js --name jafasol-backend

# Save PM2 configuration
pm2 save
pm2 startup

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Check if server is running
echo "Checking server status..."
pm2 status

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:5000/api/health

echo ""
echo "✅ Server fix completed!"
echo "📊 Check logs with: pm2 logs jafasol-backend"
echo "🏥 Health check: http://localhost:5000/api/health" 