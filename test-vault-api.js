// Test script for Vault API
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test authentication first
async function testAuth() {
  try {
    console.log('🔐 Testing authentication...');
    
    // You'll need to replace this with a valid JWT token
    const token = 'YOUR_JWT_TOKEN_HERE';
    
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Authentication successful:', response.data);
    return token;
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data || error.message);
    return null;
  }
}

// Test vault API
async function testVaultAPI(token) {
  if (!token) {
    console.log('❌ No valid token, skipping vault test');
    return;
  }
  
  try {
    console.log('\n🔐 Testing Vault API...');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test GET /vault
    console.log('📤 GET /vault');
    const getResponse = await axios.get(`${API_BASE_URL}/vault`, { headers });
    console.log('✅ GET /vault successful:', {
      success: getResponse.data.success,
      hasData: !!getResponse.data.data
    });
    
    // Test PUT /vault (update)
    console.log('\n📤 PUT /vault');
    const updateData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    };
    
    const putResponse = await axios.put(`${API_BASE_URL}/vault`, updateData, { headers });
    console.log('✅ PUT /vault successful:', {
      success: putResponse.data.success,
      message: putResponse.data.message
    });
    
    console.log('\n🎉 All vault API tests passed!');
    
  } catch (error) {
    console.log('❌ Vault API test failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      error: error.response?.data?.error
    });
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Vault API tests...\n');
  
  const token = await testAuth();
  await testVaultAPI(token);
  
  console.log('\n🏁 Tests completed!');
}

runTests().catch(console.error);
