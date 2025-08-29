/**
 * Test script to verify client-reports endpoints are working
 * Run this with: node test-client-reports-endpoints.js
 * 
 * IMPORTANT: This script requires a valid authentication token from your real login system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
  console.log('🧪 Testing Client Reports Endpoints...\n');
  console.log('⚠️  IMPORTANT: You need to provide a valid authentication token!');
  console.log('💡 Get this token by logging into your frontend and copying it from localStorage\n');

  // Get token from user input
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const token = await new Promise((resolve) => {
    rl.question('🔑 Enter your authentication token (from localStorage.token): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!token) {
    console.log('❌ No token provided. Exiting...');
    return;
  }

  try {
    // Test 1: Test vault endpoint
    console.log('1️⃣ Testing /api/client-reports/vault...');
    const vaultResponse = await axios.get(`${BASE_URL}/api/client-reports/vault`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Vault endpoint successful:', vaultResponse.data);
    console.log('');

    // Test 2: Test clients list endpoint
    console.log('2️⃣ Testing /api/client-reports/clients...');
    const clientsResponse = await axios.get(`${BASE_URL}/api/client-reports/clients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Clients list endpoint successful:', clientsResponse.data);
    console.log('');

    // Test 3: Test specific client endpoint (if we have a client ID)
    if (clientsResponse.data.data && clientsResponse.data.data.length > 0) {
      const firstClientId = clientsResponse.data.data[0]._id;
      console.log(`3️⃣ Testing /api/client-reports/clients/${firstClientId}...`);
      const clientResponse = await axios.get(`${BASE_URL}/api/client-reports/clients/${firstClientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Client detail endpoint successful:', clientResponse.data);
      console.log('');
    }

    console.log('🎉 All endpoints are working correctly!');
    console.log('✅ Frontend should now be able to fetch data properly.');
    console.log('✅ No more test advisor data - using your real authentication system!');

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure your token is valid and not expired');
      console.log('💡 Tip: Try logging out and back in to get a fresh token');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tip: Make sure your backend server is running on port 5000');
    }
  }
}

// Run the test
testEndpoints();
