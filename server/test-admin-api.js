const http = require('http');

// First get the token
const loginData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const response = JSON.parse(data);
    const token = response.token;
    
    console.log('✅ Login successful!');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // Now test admin API with token
    testAdminAPI(token);
  });
});

loginReq.on('error', (e) => {
  console.error(`Login error: ${e.message}`);
});

loginReq.write(loginData);
loginReq.end();

function testAdminAPI(token) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/loan-categories',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\n📊 Admin API Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Admin API working!');
        console.log('📋 Loan Categories:', response.length);
        console.log('🏷️  First category:', response[0]?.name);
      } catch (e) {
        console.log('❌ Response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Admin API error: ${e.message}`);
  });

  req.end();
}
