const fs = require('fs');
const path = require('path');

// Read the current server.js file
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Check if the subdomain login route already exists
if (!serverContent.includes('// Subdomain login page handler')) {
  // Find the health check endpoint and add the subdomain login route after it
  const healthCheckPattern = /\/\/ Health check endpoint[\s\S]*?app\.get\('\/api\/health'[\s\S]*?}\);[\s\S]*?/;
  
  const subdomainLoginRoute = `
// Subdomain login page handler
app.get('/', (req, res) => {
  const host = req.get('host');
  const subdomain = host.split('.')[0];
  
  // Only handle subdomains, not main domain
  if (host === 'jafasol.com' || host === 'localhost:5000' || host === 'localhost:3000') {
    return res.status(404).send('Not found');
  }
  
  // Check if this is a school subdomain
  if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
    // Check if the school exists in the main database
    User.findOne({ schoolSubdomain: subdomain })
      .then(schoolAdmin => {
        if (!schoolAdmin) {
          // School doesn't exist, show error page
          return res.send(\`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>School Not Found</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100vh; display: flex; align-items: center; justify-content: center; }
                    .error-container { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; }
                    .error-title { color: #e74c3c; font-size: 1.5rem; margin-bottom: 1rem; }
                    .error-message { color: #555; margin-bottom: 1rem; }
                    .back-link { color: #667eea; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-title">School Not Found</div>
                    <div class="error-message">The school "\${subdomain}" does not exist or is not configured.</div>
                    <a href="https://jafasol.com" class="back-link">Go to Jafasol Admin</a>
                </div>
            </body>
            </html>
          \`);
        }
        
        // School exists, serve the login page
        return res.send(\`
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>\${subdomain} - School Login</title>
              <style>
                  body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100vh; display: flex; align-items: center; justify-content: center; }
                  .login-container { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
                  .school-name { text-align: center; color: #333; margin-bottom: 2rem; font-size: 1.5rem; font-weight: bold; }
                  .form-group { margin-bottom: 1rem; }
                  label { display: block; margin-bottom: 0.5rem; color: #555; }
                  input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
                  button { width: 100%; padding: 0.75rem; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem; }
                  button:hover { background: #5a6fd8; }
                  .error { color: red; margin-top: 1rem; text-align: center; }
              </style>
          </head>
          <body>
              <div class="login-container">
                  <div class="school-name">\${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} School</div>
                  <form id="loginForm">
                      <div class="form-group">
                          <label for="email">Email</label>
                          <input type="email" id="email" name="email" required>
                      </div>
                      <div class="form-group">
                          <label for="password">Password</label>
                          <input type="password" id="password" name="password" required>
                      </div>
                      <button type="submit">Login</button>
                  </form>
                  <div id="error" class="error"></div>
              </div>
              
              <script>
                  document.getElementById('loginForm').addEventListener('submit', async (e) => {
                      e.preventDefault();
                      const email = document.getElementById('email').value;
                      const password = document.getElementById('password').value;
                      const errorDiv = document.getElementById('error');
                      
                      try {
                          const response = await fetch('/api/auth/login', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email, password })
                          });
                          
                          const data = await response.json();
                          
                          if (response.ok) {
                              localStorage.setItem('schoolToken', data.token);
                              localStorage.setItem('schoolUser', JSON.stringify(data.user));
                              window.location.href = '/dashboard';
                          } else {
                              errorDiv.textContent = data.message || 'Login failed';
                          }
                      } catch (error) {
                          errorDiv.textContent = 'Network error. Please try again.';
                      }
                  });
              </script>
          </body>
          </html>
        \`);
      })
      .catch(error => {
        console.error('Error checking school:', error);
        res.status(500).send('Internal server error');
      });
  } else {
    res.status(404).send('Not found');
  }
});

`;

  // Insert the subdomain login route after the health check endpoint
  const insertPattern = /(app\.get\('\/api\/health'[\s\S]*?}\);[\s\S]*?)/;
  serverContent = serverContent.replace(insertPattern, `$1${subdomainLoginRoute}`);

  // Write the updated content back to the file
  fs.writeFileSync(serverPath, serverContent);
  console.log('✅ Subdomain login route added to server.js');
} else {
  console.log('✅ Subdomain login route already exists in server.js');
}

console.log('🎉 Subdomain login fix completed!');
console.log('📝 Please restart the backend server: pm2 restart jafasol-backend'); 