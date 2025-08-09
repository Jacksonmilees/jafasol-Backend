const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jafasol');
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  avatarUrl: String,
  twoFactorEnabled: { type: Boolean, default: false },
  lastLoginAt: Date,
  schoolSubdomain: String,
  phone: String,
  modules: [String]
});

const User = mongoose.model('User', userSchema);

async function fixSubdomainRouting() {
  try {
    console.log('🔧 Fixing Subdomain Routing and Credentials');
    console.log('===========================================');
    
    // 1. Get all school users
    const schoolUsers = await User.find({ 
      schoolSubdomain: { $exists: true, $ne: null } 
    });
    
    console.log(`Found ${schoolUsers.length} schools:`);
    
    // 2. Create valid subdomain list for Nginx
    const validSubdomains = schoolUsers.map(user => {
      const subdomain = user.schoolSubdomain.replace('.jafasol.com', '');
      console.log(`- ${user.name}: ${subdomain}`);
      return subdomain;
    });
    
    console.log('\n📋 Valid subdomains for Nginx configuration:');
    validSubdomains.forEach(subdomain => {
      console.log(`  - ${subdomain}.jafasol.com`);
    });
    
    // 3. Create Nginx configuration
    const nginxConfig = `server {
    listen 80;
    server_name jafasol.com *.jafasol.com;

    # MIME types for JavaScript modules (global)
    location ~* \\.js$ {
        add_header Content-Type "application/javascript; charset=utf-8";
    }

    # Admin dashboard
    location /admin {
        alias /var/www/jafasol/admin/dist;
        try_files $uri $uri/ /admin/index.html;

        # Proper MIME types for admin assets
        location ~* \\.js$ {
            add_header Content-Type "application/javascript; charset=utf-8";
        }
        location ~* \\.css$ {
            add_header Content-Type "text/css; charset=utf-8";
        }
        location ~* \\.json$ {
            add_header Content-Type "application/json; charset=utf-8";
        }
    }

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # School subdomain routing
    location / {
        # Check if this is a valid school subdomain
        set $is_valid_school 0;
        set $school_subdomain "";
        
        # Valid school subdomains
        if ($host ~* ^(stmarys|brightfuture|excellence|innovation|jafasolacademy|steamlapacademy|success|testnewschool|finaltest|perfecttest)\\.jafasol\\.com$) {
            set $is_valid_school 1;
            set $school_subdomain $1;
        }
        
        # If valid school subdomain, serve frontend
        if ($is_valid_school = 1) {
            root /var/www/jafasol/frontend/dist;
            try_files $uri $uri/ /index.html;
            
            # Proper MIME types for frontend assets
            location ~* \\.js$ {
                add_header Content-Type "application/javascript; charset=utf-8";
            }
            location ~* \\.css$ {
                add_header Content-Type "text/css; charset=utf-8";
            }
            location ~* \\.json$ {
                add_header Content-Type "application/json; charset=utf-8";
            }
        }
        
        # If not a valid school subdomain, return 404
        if ($is_valid_school = 0) {
            return 404;
        }
    }
}`;

    console.log('\n📝 Nginx configuration to fix subdomain routing:');
    console.log('================================================');
    console.log(nginxConfig);
    
    console.log('\n🎉 Subdomain routing fix prepared!');
    console.log('\n📋 Next steps:');
    console.log('1. Update Nginx configuration with the above config');
    console.log('2. Test school credentials endpoint');
    console.log('3. Verify only valid subdomains show login pages');
    
  } catch (error) {
    console.error('❌ Error fixing subdomain routing:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
connectDB().then(fixSubdomainRouting); 