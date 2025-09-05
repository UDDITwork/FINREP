/**
 * Digio Authentication Test
 * Tests different authentication endpoints to find the correct one
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Load environment variables from backend/.env file
function loadEnvFile() {
  const envPath = path.join(__dirname, 'backend', '.env');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    
    console.log('✅ Loaded environment variables from backend/.env');
  } else {
    console.log('⚠️ backend/.env file not found, using system environment variables');
  }
}

loadEnvFile();

const DIGIO_API_URL = 'https://api.digio.in';
const CLIENT_ID = process.env.DIGIO_CLIENT_ID;
const CLIENT_SECRET = process.env.DIGIO_CLIENT_SECRET;

console.log('🔍 Testing Digio Authentication Endpoints...');
console.log('📋 CLIENT_ID:', CLIENT_ID);
console.log('📋 CLIENT_SECRET:', CLIENT_SECRET ? 'Present' : 'Missing');
console.log('=' * 60);

async function testAuthEndpoint(endpoint, description) {
  try {
    console.log(`\n🔐 Testing: ${description}`);
    console.log(`📋 Endpoint: ${endpoint}`);
    
    const response = await axios.post(endpoint, {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    console.log(`✅ SUCCESS: ${description}`);
    console.log(`📋 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(response.data, null, 2));
    return { success: true, data: response.data };

  } catch (error) {
    console.log(`❌ FAILED: ${description}`);
    console.log(`📋 Status: ${error.response?.status || 'No response'}`);
    console.log(`📋 Error:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function runAuthTests() {
  const endpoints = [
    {
      url: `${DIGIO_API_URL}/v2/client/auth_token`,
      description: 'v2/client/auth_token (Current)'
    },
    {
      url: `${DIGIO_API_URL}/v1/client/auth_token`,
      description: 'v1/client/auth_token (Version 1)'
    },
    {
      url: `${DIGIO_API_URL}/client/auth_token`,
      description: 'client/auth_token (No version)'
    },
    {
      url: `${DIGIO_API_URL}/auth/token`,
      description: 'auth/token (Alternative)'
    },
    {
      url: `${DIGIO_API_URL}/oauth/token`,
      description: 'oauth/token (OAuth)'
    }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testAuthEndpoint(endpoint.url, endpoint.description);
    results.push({ ...endpoint, result });
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '=' * 60);
  console.log('📊 AUTHENTICATION TEST RESULTS:');
  console.log('=' * 60);

  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);

  if (successful.length > 0) {
    console.log('✅ SUCCESSFUL ENDPOINTS:');
    successful.forEach(r => {
      console.log(`   ${r.description}: ${r.url}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    failed.forEach(r => {
      console.log(`   ${r.description}: ${r.url}`);
    });
  }

  if (successful.length === 0) {
    console.log('\n⚠️ NO WORKING AUTHENTICATION ENDPOINTS FOUND');
    console.log('💡 Possible issues:');
    console.log('   1. Invalid CLIENT_ID or CLIENT_SECRET');
    console.log('   2. API endpoint has changed');
    console.log('   3. Account not activated for API access');
    console.log('   4. Network/firewall issues');
  }

  return results;
}

// Run the tests
if (require.main === module) {
  runAuthTests().catch(console.error);
}

module.exports = { runAuthTests, testAuthEndpoint };
