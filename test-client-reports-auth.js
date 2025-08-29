// Test script for Client Reports API authentication
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testClientReportsAuth() {
  console.log('🔍 TESTING CLIENT REPORTS AUTHENTICATION\n');
  
  try {
    // Step 1: Try to login with test credentials
    console.log('1. Testing authentication...');
    let token = null;
    
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (loginResponse.data.success) {
        token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('   Token received:', token ? 'Yes' : 'No');
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Login request failed:', error.response?.data?.message || error.message);
    }

    // Step 2: Test client reports endpoints without auth (should fail)
    console.log('\n2. Testing client reports endpoints without auth...');
    try {
      await axios.get(`${API_BASE_URL}/client-reports/vault`);
      console.log('❌ Should have failed without auth');
    } catch (error) {
      console.log('✅ Correctly failed without auth');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
    }

    // Step 3: Test client reports endpoints with valid token (if available)
    if (token) {
      console.log('\n3. Testing client reports endpoints with valid token...');
      
      try {
        const vaultResponse = await axios.get(`${API_BASE_URL}/client-reports/vault`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Vault endpoint successful');
        console.log('   Status:', vaultResponse.status);
        console.log('   Success:', vaultResponse.data.success);
        console.log('   Data:', vaultResponse.data.data ? 'Available' : 'Not available');
        
      } catch (error) {
        console.log('❌ Vault endpoint failed');
        console.log('   Status:', error.response?.status);
        console.log('   Message:', error.response?.data?.message);
      }

      try {
        const clientsResponse = await axios.get(`${API_BASE_URL}/client-reports/clients`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Clients endpoint successful');
        console.log('   Status:', clientsResponse.status);
        console.log('   Success:', clientsResponse.data.success);
        console.log('   Client count:', clientsResponse.data.data?.length || 0);
        
      } catch (error) {
        console.log('❌ Clients endpoint failed');
        console.log('   Status:', error.response?.status);
        console.log('   Message:', error.response?.data?.message);
      }
    } else {
      console.log('\n⚠️ Skipping authenticated tests - no valid token');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testClientReportsAuth();
