// Simple script to get a test token
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function getTestToken() {
  console.log('🔑 Getting test token for Market Data API...\n');

  try {
    // Try to login with test credentials
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword'
    });

    if (loginResponse.data.success && loginResponse.data.token) {
      console.log('✅ Login successful!');
      console.log('Token:', loginResponse.data.token);
      console.log('\n📝 Use this token in test-market-data-fix.js:');
      console.log('const TEST_TOKEN = \'' + loginResponse.data.token + '\';');
      return loginResponse.data.token;
    }

  } catch (error) {
    console.log('❌ Login failed. Trying alternative methods...\n');
    
    // Try to get token from existing session or create one
    try {
      // Check if there's a way to get token without login
      const response = await axios.get(`${BASE_URL}/auth/profile`);
      console.log('✅ Found existing session');
      return 'existing-session-token';
    } catch (profileError) {
      console.log('❌ No existing session found');
      console.log('\n🔧 Manual Steps:');
      console.log('1. Login to your application in browser');
      console.log('2. Open Developer Tools (F12)');
      console.log('3. Go to Application/Storage tab');
      console.log('4. Find the token in localStorage');
      console.log('5. Copy the token and update test-market-data-fix.js');
      console.log('\nOr create a test user in your database and use those credentials.');
    }
  }
}

// Run the function
getTestToken();
