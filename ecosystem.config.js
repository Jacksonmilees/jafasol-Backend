module.exports = {
  apps: [
    {
      name: 'jafasol-backend',
      script: 'server-clean.js',
      cwd: '/var/www/jafasol/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/www/jafasol/logs/backend-error.log',
      out_file: '/var/www/jafasol/logs/backend-out.log',
      log_file: '/var/www/jafasol/logs/backend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'jafasol.com',
      port: '5050',
      ref: 'origin/main',
      repo: 'https://github.com/Jacksonmilees/jafasol-Backend.git',
      path: '/var/www/jafasol/backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 