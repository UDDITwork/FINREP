/**
 * QUICK SERVER STATUS CHECK
 * 
 * This script checks if the backend server is running and accessible
 * 
 * RUN INSTRUCTIONS:
 * Run: node test-server-status.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const checkServerStatus = async () => {
  console.log('🔍 Checking Backend Server Status...\n');
  
  try {
    // Test basic connectivity
    console.log('1. Testing basic server connectivity...');
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    
    if (response.status === 200) {
      console.log('   ✅ Server is running and responding');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    } else {
      console.log(`   ⚠️  Server responded with unexpected status: ${response.status}`);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('   ❌ Server is not running (Connection refused)');
      console.log('   Please start the backend server with: npm start');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   ❌ Server address not found');
      console.log('   Please check if the server is running on the correct port');
    } else if (error.code === 'ECONNABORTED') {
      console.log('   ❌ Server connection timeout');
      console.log('   Server might be overloaded or not responding');
    } else {
      console.log(`   ❌ Connection error: ${error.message}`);
    }
  }
  
  try {
    // Test API endpoint availability
    console.log('\n2. Testing API endpoint availability...');
    const apiResponse = await axios.get(`${BASE_URL}/api/mutual-fund-recommend`, { timeout: 5000 });
    
    if (apiResponse.status === 401) {
      console.log('   ✅ API endpoint is accessible (returns 401 for unauthenticated access - expected)');
    } else {
      console.log(`   ⚠️  API endpoint responded with unexpected status: ${apiResponse.status}`);
    }
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('   ✅ API endpoint is accessible (returns 401 for unauthenticated access - expected)');
    } else {
      console.log(`   ❌ API endpoint error: ${error.message}`);
    }
  }
  
  try {
    // Test specific mutual fund endpoint
    console.log('\n3. Testing mutual fund recommendation endpoint...');
    const mfResponse = await axios.post(`${BASE_URL}/api/mutual-fund-recommend/claude/fund-details`, {
      fundName: 'Test Fund',
      fundHouseName: 'Test House'
    }, { timeout: 5000 });
    
    console.log(`   ⚠️  Endpoint responded with status: ${mfResponse.status}`);
    console.log('   Note: This endpoint requires authentication, so 401 is expected');
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('   ✅ Mutual fund endpoint is accessible (returns 401 for unauthenticated access - expected)');
    } else {
      console.log(`   ❌ Mutual fund endpoint error: ${error.message}`);
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('   - If you see ✅ marks, the server is working correctly');
  console.log('   - If you see ❌ marks, there are issues to resolve');
  console.log('   - 401 responses are expected for unauthenticated API calls');
  console.log('\n🚀 Next Steps:');
  console.log('   1. If server is running, proceed with Claude AI integration tests');
  console.log('   2. If server is not running, start it with: npm start');
  console.log('   3. If there are connection issues, check port configuration');
};

// Run the check
checkServerStatus().catch(console.error);
