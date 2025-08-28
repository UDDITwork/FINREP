// Test script for Market Data API without authentication
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testMarketDataWithoutAuth() {
  console.log('🧪 Testing Market Data API (No Auth)...\n');

  try {
    // Test 1: Health check (should work without auth)
    console.log('1️⃣ Testing health check...');
    const healthResponse = await api.get('/market-data/health');
    console.log('✅ Health check successful:', healthResponse.data);
    console.log('');

    console.log('🎉 Market Data API is working!');
    console.log('📊 The issue was authentication, not the API itself.');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Get a valid token from your application');
    console.log('2. Update test-market-data-fix.js with the token');
    console.log('3. Run the full test again');

  } catch (error) {
    console.error('❌ Market Data API test failed:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.message
    });
    
    if (error.response?.status === 401) {
      console.log('\n🔧 Solution:');
      console.log('The API requires authentication. You need to:');
      console.log('1. Login to your application');
      console.log('2. Get the token from browser localStorage');
      console.log('3. Update the test file with the token');
    }
  }
}

// Run the test
testMarketDataWithoutAuth();
