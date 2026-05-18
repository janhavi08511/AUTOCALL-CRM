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
    console.log('👤 User:', response.user.name, '-', response.user.role);
    
    // Test all endpoints
    testEndpoints(token);
  });
});

loginReq.on('error', (e) => {
  console.error(`Login error: ${e.message}`);
});

loginReq.write(loginData);
loginReq.end();

function testEndpoints(token) {
  const endpoints = [
    { path: '/api/admin/dashboard/kpi', name: 'Dashboard KPI' },
    { path: '/api/admin/loan-categories', name: 'Loan Categories' },
    { path: '/api/admin/users', name: 'Users' },
    { path: '/api/upload/loan-categories', name: 'Upload Loan Categories' }
  ];

  let completed = 0;
  
  endpoints.forEach((endpoint, index) => {
    setTimeout(() => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: endpoint.path,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          completed++;
          const status = res.statusCode === 200 ? '✅' : '❌';
          console.log(`${status} ${endpoint.name}: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            try {
              const response = JSON.parse(data);
              if (Array.isArray(response)) {
                console.log(`   📊 Found ${response.length} items`);
              } else if (response.totalLeads) {
                console.log(`   📈 KPIs: ${response.totalLeads} leads, ${response.totalCalls} calls`);
              }
            } catch (e) {
              console.log(`   ⚠️  Invalid JSON response`);
            }
          } else {
            console.log(`   📄 Response: ${data.substring(0, 100)}...`);
          }
          
          if (completed === endpoints.length) {
            console.log('\n🎉 All endpoints tested!');
            console.log('\n🔧 If your frontend still shows errors:');
            console.log('1. Clear browser cache and localStorage');
            console.log('2. Logout and login again with: admin / admin123');
            console.log('3. Check browser network tab for actual API calls');
          }
        });
      });

      req.on('error', (e) => {
        completed++;
        console.log(`❌ ${endpoint.name}: Error - ${e.message}`);
        if (completed === endpoints.length) {
          console.log('\n🎉 All endpoints tested!');
        }
      });

      req.end();
    }, index * 200); // Stagger requests
  });
}
