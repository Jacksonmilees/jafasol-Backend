const express = require('express');
const app = express();

// Test middleware to simulate subdomain
app.use((req, res, next) => {
  // Simulate different subdomains for testing
  const testSubdomain = req.query.subdomain || 'jafasolacademy';
  req.headers.host = `${testSubdomain}.jafasol.com`;
  next();
});

// Test endpoint
app.get('/test', (req, res) => {
  const host = req.get('host');
  const subdomain = host.split('.')[0];
  
  res.json({
    message: 'Subdomain test',
    host: host,
    subdomain: subdomain,
    fullUrl: `http://${host}/test`
  });
});

app.listen(3001, () => {
  console.log('🧪 Test server running on port 3001');
  console.log('Test URLs:');
  console.log('http://localhost:3001/test?subdomain=jafasolacademy');
  console.log('http://localhost:3001/test?subdomain=jafasol');
  console.log('http://localhost:3001/test?subdomain=jackson');
}); 