#!/bin/bash

# Setup logs directory for Jafasol

echo "📁 Setting up logs directory..."

# Create logs directory
mkdir -p /var/www/jafasol/logs

# Create log files
touch /var/www/jafasol/logs/backend-error.log
touch /var/www/jafasol/logs/backend-out.log
touch /var/www/jafasol/logs/backend-combined.log

# Set permissions
chmod 755 /var/www/jafasol/logs
chmod 644 /var/www/jafasol/logs/*.log

echo "✅ Logs directory setup complete!"
echo "📁 Logs location: /var/www/jafasol/logs/" 