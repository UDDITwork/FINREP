/**
 * KYC API Test Script
 * Tests the KYC verification API with real Aadhar details
 * 
 * Test Data:
 * - Name: Abhishek Rajput
 * - Aadhar: 522540051114
 * - Phone: 8239697729
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

// Load environment variables
loadEnvFile();

// Configuration
const BASE_URL = 'http://localhost:5000'; // Adjust if your backend runs on different port
const TEST_DATA = {
  name: 'Abhishek Rajput',
  aadhar: '522540051114',
  phone: '8239697729',
  email: 'abhishek.rajput@test.com' // Using phone as primary identifier
};

// Test credentials - Replace with actual advisor credentials
const TEST_CREDENTIALS = {
  email: 'test@advisor.com', // Replace with actual advisor email
  password: 'testpassword'   // Replace with actual advisor password
};

let authToken = null;

/**
 * Step 1: Login to get authentication token
 */
async function login() {
  try {
    console.log('🔐 Step 1: Logging in...');
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password
    });

    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log('📋 Token:', authToken.substring(0, 20) + '...');
      return true;
    } else {
      throw new Error('Login failed: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 2: Create a test client
 */
async function createTestClient() {
  try {
    console.log('\n👤 Step 2: Creating test client...');
    
    const clientData = {
      firstName: TEST_DATA.name.split(' ')[0],
      lastName: TEST_DATA.name.split(' ').slice(1).join(' '),
      email: TEST_DATA.email,
      phoneNumber: TEST_DATA.phone,
      personalInfo: {
        aadharNumber: TEST_DATA.aadhar,
        firstName: TEST_DATA.name.split(' ')[0],
        lastName: TEST_DATA.name.split(' ').slice(1).join(' ')
      }
    };

    const response = await axios.post(`${BASE_URL}/api/clients`, clientData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Test client created successfully');
      console.log('📋 Client ID:', response.data.client._id);
      console.log('📋 Client Name:', response.data.client.firstName, response.data.client.lastName);
      return response.data.client._id;
    } else {
      throw new Error('Client creation failed: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('❌ Client creation failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Step 3: Get clients for KYC
 */
async function getClientsForKYC() {
  try {
    console.log('\n📋 Step 3: Getting clients for KYC...');
    
    const response = await axios.get(`${BASE_URL}/api/kyc/clients`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Clients retrieved successfully');
      console.log('📋 Total clients:', response.data.data.length);
      
      // Find our test client
      const testClient = response.data.data.find(client => 
        client.firstName === TEST_DATA.name.split(' ')[0] && 
        client.lastName === TEST_DATA.name.split(' ').slice(1).join(' ')
      );
      
      if (testClient) {
        console.log('✅ Test client found in KYC list');
        console.log('📋 Client KYC Status:', testClient.kycStatus);
        return testClient._id;
      } else {
        console.log('⚠️ Test client not found in KYC list');
        return null;
      }
    } else {
      throw new Error('Failed to get clients: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('❌ Failed to get clients:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Step 4: Get KYC status for client
 */
async function getKYCStatus(clientId) {
  try {
    console.log('\n📊 Step 4: Getting KYC status...');
    
    const response = await axios.get(`${BASE_URL}/api/kyc/status/${clientId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ KYC status retrieved successfully');
      console.log('📋 Overall Status:', response.data.data.kycStatus.overallStatus);
      console.log('📋 Aadhar Status:', response.data.data.kycStatus.aadharStatus);
      console.log('📋 PAN Status:', response.data.data.kycStatus.panStatus);
      return response.data.data;
    } else {
      throw new Error('Failed to get KYC status: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('❌ Failed to get KYC status:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Step 5: Start KYC workflow
 */
async function startKYCWorkflow(clientId) {
  try {
    console.log('\n🚀 Step 5: Starting KYC workflow...');
    console.log('📋 Client ID:', clientId);
    console.log('📋 Aadhar:', TEST_DATA.aadhar);
    console.log('📋 Phone:', TEST_DATA.phone);
    console.log('📋 Name:', TEST_DATA.name);
    
    const response = await axios.post(`${BASE_URL}/api/kyc/workflow/${clientId}`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ KYC workflow started successfully!');
      console.log('📋 Digio Request ID:', response.data.data.digioRequestId);
      console.log('📋 Access Token:', response.data.data.accessToken ? 'Present' : 'Missing');
      console.log('📋 Message:', response.data.data.message);
      
      return {
        success: true,
        digioRequestId: response.data.data.digioRequestId,
        accessToken: response.data.data.accessToken
      };
    } else {
      throw new Error('KYC workflow failed: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('❌ KYC workflow failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Step 6: Test Digio API directly (optional)
 */
async function testDigioAPI() {
  try {
    console.log('\n🔗 Step 6: Testing Digio API directly...');
    
    // This would require your Digio credentials
    console.log('⚠️ Direct Digio API test requires environment variables:');
    console.log('   - DIGIO_CLIENT_ID');
    console.log('   - DIGIO_CLIENT_SECRET');
    console.log('   - Backend server must be running');
    
    return true;
  } catch (error) {
    console.error('❌ Digio API test failed:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runKYCTest() {
  console.log('🧪 KYC API Test Script Starting...');
  console.log('📋 Test Data:', TEST_DATA);
  console.log('🌐 Backend URL:', BASE_URL);
  console.log('=' * 50);

  try {
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.log('\n❌ Test failed at login step');
      return;
    }

    // Step 2: Create test client
    const clientId = await createTestClient();
    if (!clientId) {
      console.log('\n❌ Test failed at client creation step');
      return;
    }

    // Step 3: Get clients for KYC
    const kycClientId = await getClientsForKYC();
    if (!kycClientId) {
      console.log('\n❌ Test failed at getting clients step');
      return;
    }

    // Step 4: Get KYC status
    const kycStatus = await getKYCStatus(kycClientId);
    if (!kycStatus) {
      console.log('\n❌ Test failed at getting KYC status step');
      return;
    }

    // Step 5: Start KYC workflow
    const workflowResult = await startKYCWorkflow(kycClientId);
    if (!workflowResult.success) {
      console.log('\n❌ Test failed at starting KYC workflow step');
      return;
    }

    // Step 6: Test Digio API
    await testDigioAPI();

    console.log('\n' + '=' * 50);
    console.log('🎉 KYC API Test Completed Successfully!');
    console.log('📋 Digio Request ID:', workflowResult.digioRequestId);
    console.log('📋 Access Token Available:', !!workflowResult.accessToken);
    console.log('\n💡 Next Steps:');
    console.log('   1. Check your Digio dashboard for the KYC request');
    console.log('   2. Use the access token in your frontend SDK');
    console.log('   3. Monitor webhook events for status updates');

  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  runKYCTest().catch(console.error);
}

module.exports = {
  runKYCTest,
  login,
  createTestClient,
  getClientsForKYC,
  getKYCStatus,
  startKYCWorkflow
};
