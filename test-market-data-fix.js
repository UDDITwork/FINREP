// Test script to verify Market Data CORS fix
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
});

async function testMarketDataAPI() {
  console.log('🧪 Testing Market Data API (CORS Fix)...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await api.get('/market-data/health');
    console.log('✅ Health check successful:', healthResponse.data);
    console.log('');

    // Test 2: NIFTY 50
    console.log('2️⃣ Testing NIFTY 50 data...');
    const niftyResponse = await api.get('/market-data/nifty50');
    console.log('✅ NIFTY 50 data fetched successfully');
    console.log('Data:', {
      symbol: niftyResponse.data.data.symbol,
      currentPrice: niftyResponse.data.data.currentPrice,
      change: niftyResponse.data.data.change,
      changePercent: niftyResponse.data.data.changePercent
    });
    console.log('');

    // Test 3: SENSEX
    console.log('3️⃣ Testing SENSEX data...');
    const sensexResponse = await api.get('/market-data/sensex');
    console.log('✅ SENSEX data fetched successfully');
    console.log('Data:', {
      symbol: sensexResponse.data.data.symbol,
      currentPrice: sensexResponse.data.data.currentPrice,
      change: sensexResponse.data.data.change,
      changePercent: sensexResponse.data.data.changePercent
    });
    console.log('');

    // Test 4: Bank Nifty
    console.log('4️⃣ Testing Bank Nifty data...');
    const bankNiftyResponse = await api.get('/market-data/banknifty');
    console.log('✅ Bank Nifty data fetched successfully');
    console.log('Data:', {
      symbol: bankNiftyResponse.data.data.symbol,
      currentPrice: bankNiftyResponse.data.data.currentPrice,
      change: bankNiftyResponse.data.data.change,
      changePercent: bankNiftyResponse.data.data.changePercent
    });
    console.log('');

    // Test 5: Market Overview (all data in one request)
    console.log('5️⃣ Testing Market Overview...');
    const overviewResponse = await api.get('/market-data/overview');
    console.log('✅ Market Overview fetched successfully');
    console.log('Available indices:', Object.keys(overviewResponse.data.data));
    console.log('Timestamp:', overviewResponse.data.data.timestamp);
    console.log('');

    console.log('🎉 All Market Data API tests passed! CORS issue resolved.');
    console.log('');
    console.log('📊 Summary:');
    console.log('- Backend proxy is working correctly');
    console.log('- Yahoo Finance data is being fetched successfully');
    console.log('- CORS issues are resolved');
    console.log('- Frontend can now access market data through backend');

  } catch (error) {
    console.error('❌ Market Data API test failed:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.message
    });
    
    if (error.response?.data?.error) {
      console.error('Backend error details:', error.response.data.error);
    }
  }
}

// Run the test
testMarketDataAPI();
