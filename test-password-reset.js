/**
 * Test script for password reset functionality
 * Run with: node test-password-reset.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'test@example.com'; // Replace with a real email for testing

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset Functionality\n');

  try {
    // Test 1: Request password reset
    console.log('1️⃣ Testing forgot password request...');
    const forgotResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    });
    
    console.log('✅ Forgot password response:', forgotResponse.data);
    
    // Note: In a real test, you would need to check the email for the reset token
    // For this test, we'll simulate the token verification and reset process
    
    console.log('\n2️⃣ Testing token verification (simulated)...');
    console.log('⚠️  Note: In real testing, you would extract the token from the email');
    
    // Test 3: Reset password (this would fail without a real token)
    console.log('\n3️⃣ Testing password reset (would fail without real token)...');
    try {
      const resetResponse = await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: 'fake-token-for-testing',
        password: 'NewPassword123!'
      });
      console.log('✅ Reset password response:', resetResponse.data);
    } catch (error) {
      console.log('❌ Expected error for fake token:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Password reset functionality test completed!');
    console.log('\n📧 To test the full flow:');
    console.log('1. Use a real email address');
    console.log('2. Check the email for the reset link');
    console.log('3. Use the token from the email to reset the password');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testPasswordReset();
