// Step 2: Authentication and Vault API Test
const axios = require('axios');

async function testStep2() {
  console.log('🔍 STEP 2: AUTHENTICATION & VAULT API TEST\n');
  
  try {
    // Test 1: Try to login with test credentials
    console.log('1. Testing authentication...');
    let token = null;
    
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
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

    // Test 2: Test vault endpoint without auth (should fail)
    console.log('\n2. Testing vault endpoint without auth...');
    try {
      await axios.get('http://localhost:5000/api/vault');
      console.log('❌ Should have failed without auth');
    } catch (error) {
      console.log('✅ Correctly failed without auth');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
    }

    // Test 3: Test vault endpoint with invalid token
    console.log('\n3. Testing vault endpoint with invalid token...');
    try {
      await axios.get('http://localhost:5000/api/vault', {
        headers: {
          'Authorization': 'Bearer invalid-token-123'
        }
      });
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      console.log('✅ Correctly failed with invalid token');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
    }

    // Test 4: Test vault endpoint with valid token (if available)
    if (token) {
      console.log('\n4. Testing vault endpoint with valid token...');
      try {
        const vaultResponse = await axios.get('http://localhost:5000/api/vault', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Vault API call successful');
        console.log('   Status:', vaultResponse.status);
        console.log('   Success:', vaultResponse.data.success);
        console.log('   Has data:', !!vaultResponse.data.data);
        
        if (vaultResponse.data.data) {
          console.log('   Data keys:', Object.keys(vaultResponse.data.data));
        }
        
      } catch (error) {
        console.log('❌ Vault API call failed');
        console.log('   Status:', error.response?.status);
        console.log('   Message:', error.response?.data?.message);
        console.log('   Error details:', error.response?.data);
      }
    } else {
      console.log('\n4. Skipping vault test - no valid token available');
    }

    console.log('\n✅ STEP 2 COMPLETED');
    
  } catch (error) {
    console.log('❌ STEP 2 FAILED:', error.message);
  }
}

testStep2().catch(console.error);
