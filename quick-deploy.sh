#!/bin/bash

# Quick Deploy Script for Jafasol
# Fast deployment without full backup

echo "⚡ Quick deployment starting..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Pull changes
echo -e "${BLUE}Pulling from GitHub...${NC}"
git stash
git pull origin main

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install

# Restart backend
echo -e "${BLUE}Restarting backend...${NC}"
pm2 restart jafasol-backend

# Deploy frontend if exists
if [ -d "/var/www/jafasol/frontend" ]; then
    echo -e "${BLUE}Deploying frontend...${NC}"
    cd /var/www/jafasol/frontend
    git stash
    git pull origin main
    npm install
    npm run build
    cd /var/www/jafasol/backend
fi

# Deploy admin if exists
if [ -d "/var/www/jafasol/admin" ]; then
    echo -e "${BLUE}Deploying admin dashboard...${NC}"
    cd /var/www/jafasol/admin
    git stash
    git pull origin main
    npm install
    npm run build
    cd /var/www/jafasol/backend
fi

# Health check
echo -e "${BLUE}Checking health...${NC}"
sleep 3
if curl -s http://localhost:5000/api/health | grep -q "OK"; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    pm2 logs jafasol-backend --lines 5
fi 