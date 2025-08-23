// Test script to debug Final Report authentication issue
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_ADVISOR_ID = '6883ec3e2cc2c6df98e40604'; // The ID from the error

async function testFinalReportAuth() {
  console.log('🧪 Testing Final Report Authentication...\n');

  try {
    // Test 1: Health Check (no auth required)
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/final-report/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Test Auth Endpoint (no auth required)
    console.log('2️⃣ Testing Auth Test Endpoint...');
    const authTestResponse = await axios.get(`${BASE_URL}/final-report/test-auth`);
    console.log('✅ Auth Test:', authTestResponse.data);
    console.log('');

    // Test 3: Test with no token (should fail)
    console.log('3️⃣ Testing without token (should fail)...');
    try {
      await axios.get(`${BASE_URL}/final-report/clients/${TEST_ADVISOR_ID}`);
      console.log('❌ Unexpected success without token');
    } catch (error) {
      console.log('✅ Correctly failed without token:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    console.log('');

    // Test 4: Test with invalid token (should fail)
    console.log('4️⃣ Testing with invalid token (should fail)...');
    try {
      await axios.get(`${BASE_URL}/final-report/clients/${TEST_ADVISOR_ID}`, {
        headers: { 'Authorization': 'Bearer invalid_token_123' }
      });
      console.log('❌ Unexpected success with invalid token');
    } catch (error) {
      console.log('✅ Correctly failed with invalid token:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    console.log('');

    // Test 5: Test debug auth endpoint with invalid token (should fail)
    console.log('5️⃣ Testing debug auth endpoint with invalid token...');
    try {
      await axios.get(`${BASE_URL}/final-report/debug-auth`, {
        headers: { 'Authorization': 'Bearer invalid_token_123' }
      });
      console.log('❌ Unexpected success with invalid token');
    } catch (error) {
      console.log('✅ Correctly failed with invalid token:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    console.log('');

    console.log('🎯 Next Steps:');
    console.log('1. Check if the advisor ID exists in the database');
    console.log('2. Verify the JWT token is valid');
    console.log('3. Check backend logs for authentication details');
    console.log('4. Test with a valid token from a logged-in user');
    console.log('5. Use /debug-auth endpoint to check authentication context');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testFinalReportAuth();
