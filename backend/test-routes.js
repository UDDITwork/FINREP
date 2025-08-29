const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test all the main API endpoints
const testEndpoints = [
  '/',
  '/api/auth/login',
  '/api/clients',
  '/api/admin',
  '/api/plans',
  '/api/meetings',
  '/api/loe',
  '/api/chat',
  '/api/stock-market',
  '/api/vault',
  '/api/billing',
  '/api/claude'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🔍 Testing: ${endpoint}`);
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      timeout: 5000
    });
    
    console.log(`✅ SUCCESS: ${response.status} ${response.statusText}`);
    if (response.data && typeof response.data === 'object') {
      console.log(`📊 Response keys: ${Object.keys(response.data).join(', ')}`);
    }
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ ERROR: ${error.response.status} ${error.response.statusText}`);
      if (error.response.data && error.response.data.message) {
        console.log(`📝 Message: ${error.response.data.message}`);
      }
      if (error.response.data && error.response.data.availableEndpoints) {
        console.log(`🔗 Available endpoints: ${JSON.stringify(error.response.data.availableEndpoints, null, 2)}`);
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`❌ CONNECTION REFUSED: Backend server is not running on port 5000`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`⏰ TIMEOUT: Request took too long`);
    } else {
      console.log(`❌ UNKNOWN ERROR: ${error.message}`);
    }
  }
}

async function testAllEndpoints() {
  console.log('🚀 STARTING BACKEND ROUTE TEST');
  console.log('='.repeat(50));
  console.log(`📍 Testing backend at: ${BASE_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(50));
  
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 TEST COMPLETED');
  console.log('='.repeat(50));
}

// Run the test
testAllEndpoints().catch(console.error);
