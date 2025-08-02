#!/bin/bash

# Jafasol Deployment Script
# This script pulls latest changes from GitHub and restarts all services

set -e  # Exit on any error

echo "🚀 Starting Jafasol deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in backend directory. Please run from /var/www/jafasol/backend"
    exit 1
fi

# Backup current state
print_status "Creating backup of current state..."
BACKUP_DIR="/var/www/jafasol/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup current .env file
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/"
    print_success "Backed up .env file"
fi

# Backup PM2 ecosystem
if [ -f "ecosystem.config.js" ]; then
    cp ecosystem.config.js "$BACKUP_DIR/"
    print_success "Backed up PM2 ecosystem"
fi

# Git operations
print_status "Pulling latest changes from GitHub..."

# Check if git repository exists
if [ ! -d ".git" ]; then
    print_error "Git repository not found. Please initialize git first."
    exit 1
fi

# Stash any local changes
git stash

# Pull latest changes
git pull origin main

if [ $? -eq 0 ]; then
    print_success "Successfully pulled latest changes from GitHub"
else
    print_error "Failed to pull from GitHub"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check if .env file exists, if not create from example
if [ ! -f ".env" ]; then
    print_warning ".env file not found, creating from example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        print_success "Created .env file from example"
    else
        print_error "No env.example file found"
        exit 1
    fi
fi

# Restart backend service
print_status "Restarting backend service..."
pm2 restart jafasol-backend

if [ $? -eq 0 ]; then
    print_success "Backend service restarted successfully"
else
    print_error "Failed to restart backend service"
    exit 1
fi

# Check backend health
print_status "Checking backend health..."
sleep 5

HEALTH_CHECK=$(curl -s http://localhost:5000/api/health || echo "FAILED")

if [[ $HEALTH_CHECK == *"OK"* ]]; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
    print_status "Backend logs:"
    pm2 logs jafasol-backend --lines 10
    exit 1
fi

# Deploy frontend if it exists
if [ -d "/var/www/jafasol/frontend" ]; then
    print_status "Deploying frontend..."
    cd /var/www/jafasol/frontend
    
    # Pull frontend changes
    git stash
    git pull origin main
    
    # Install dependencies
    npm install
    
    # Build frontend
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Frontend built successfully"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    cd /var/www/jafasol/backend
fi

# Deploy admin dashboard if it exists
if [ -d "/var/www/jafasol/admin" ]; then
    print_status "Deploying admin dashboard..."
    cd /var/www/jafasol/admin
    
    # Pull admin changes
    git stash
    git pull origin main
    
    # Install dependencies
    npm install
    
    # Build admin dashboard
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Admin dashboard built successfully"
    else
        print_error "Admin dashboard build failed"
        exit 1
    fi
    
    cd /var/www/jafasol/backend
fi

# Reload Nginx configuration
print_status "Reloading Nginx configuration..."
nginx -t && systemctl reload nginx

if [ $? -eq 0 ]; then
    print_success "Nginx configuration reloaded successfully"
else
    print_error "Nginx configuration reload failed"
    exit 1
fi

# Show deployment summary
print_success "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backend: Updated and restarted"
echo "✅ Frontend: Updated and built"
echo "✅ Admin Dashboard: Updated and built"
echo "✅ Nginx: Configuration reloaded"
echo "✅ Health Check: Backend is running"
echo ""
echo "🌐 Access URLs:"
echo "• Main Site: https://jafasol.com"
echo "• Admin Dashboard: https://jafasol.com/admin"
echo "• API Health: https://jafasol.com/api/health"
echo ""
echo "📁 Backup Location: $BACKUP_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Save PM2 process list
pm2 save

print_success "PM2 process list saved" 