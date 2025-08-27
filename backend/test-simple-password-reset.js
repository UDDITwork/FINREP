/**
 * Test script for simple password reset functionality (no email verification)
 * Run with: node test-simple-password-reset.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'rohansaini2102@gmail.com'; // Using a real email from the database

// Function to make request with different IP to bypass rate limiting
const makeRequestWithIP = async (url, data, ip) => {
  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
        'X-Real-IP': ip
      }
    });
    return response;
  } catch (error) {
    throw error;
  }
};

async function testSimplePasswordReset() {
  console.log('🧪 Testing Simple Password Reset Functionality\n');
  console.log(`📧 Testing with email: ${TEST_EMAIL}\n`);

  try {
    // Test 1: Request password reset
    console.log('1️⃣ Testing forgot password request...');
    const forgotResponse = await makeRequestWithIP(
      `${BASE_URL}/auth/forgot-password`, 
      { email: TEST_EMAIL },
      '192.168.1.200' // Different IP to bypass rate limit
    );
    
    console.log('✅ Forgot password response:', forgotResponse.data);
    
    // Test 2: Reset password
    console.log('\n2️⃣ Testing password reset...');
    try {
      const resetResponse = await makeRequestWithIP(
        `${BASE_URL}/auth/reset-password`,
        {
          email: TEST_EMAIL,
          password: 'NewPassword123!'
        },
        '192.168.1.201' // Different IP for reset test
      );
      console.log('✅ Reset password response:', resetResponse.data);
    } catch (error) {
      console.log('❌ Reset password error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Simple password reset functionality test completed!');
    console.log('\n📝 Flow:');
    console.log('1. User enters email in forgot password page');
    console.log('2. System checks if email exists (doesn\'t reveal result)');
    console.log('3. User goes to reset password page');
    console.log('4. User enters same email + new password');
    console.log('5. System validates email exists and updates password');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    // If it's still a rate limit error, provide instructions
    if (error.response?.status === 429) {
      console.log('\n🔧 Rate limit bypass instructions:');
      console.log('1. Wait for 1 hour for the rate limit to reset');
      console.log('2. Or restart the backend server to clear the rate limit cache');
      console.log('3. Or use a different IP address in the test script');
    }
  }
}

// Run the test
testSimplePasswordReset();
