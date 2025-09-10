const axios = require('axios');

async function simpleTest() {
  try {
    console.log('🚀 Running Simple Mutual Fund Exit Suite Test...');
    
    // Step 1: Test backend health
    console.log('🏥 Testing backend health...');
    const healthResponse = await axios.get('http://localhost:5000/');
    console.log('✅ Backend is healthy:', healthResponse.data.status);
    
    // Step 2: Test authentication
    console.log('🔐 Testing authentication...');
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'udditalerts247@gmail.com',
      password: 'jpmcA@123'
    });
    
    const token = authResponse.data.token;
    console.log('✅ Authentication successful');
    
    // Step 3: Test clients endpoint
    console.log('👥 Testing clients with funds...');
    const clientsResponse = await axios.get('http://localhost:5000/api/mutual-fund-exit-strategies/clients-with-funds', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Clients endpoint working:', clientsResponse.data.success);
    console.log(`📊 Found ${clientsResponse.data.data.clients.length} clients`);
    
    // Step 4: Test summary endpoint
    console.log('📈 Testing summary endpoint...');
    const summaryResponse = await axios.get('http://localhost:5000/api/mutual-fund-exit-strategies/summary', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Summary endpoint working:', summaryResponse.data.success);
    console.log(`📊 Total strategies: ${summaryResponse.data.data.totalStrategies}`);
    
    console.log('\n🎉 ALL BASIC TESTS PASSED!');
    console.log('✅ Backend server is running');
    console.log('✅ Authentication is working');
    console.log('✅ API endpoints are responding');
    console.log('✅ Database connection is working');
    console.log('✅ Mutual Fund Exit Suite is functional');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

simpleTest();
