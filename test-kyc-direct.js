/**
 * Direct KYC Test Script
 * Tests KYC workflow with specific Aadhar details
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
const BASE_URL = 'http://localhost:5000';
const TEST_CLIENT = {
  firstName: 'Abhishek',
  lastName: 'Rajput',
  email: 'abhishek.rajput@test.com',
  phoneNumber: '8239697729',
  personalInfo: {
    aadharNumber: '522540051114',
    firstName: 'Abhishek',
    lastName: 'Rajput'
  }
};

// You need to replace these with actual advisor credentials
const ADVISOR_CREDENTIALS = {
  email: 'your-advisor@email.com', // Replace with actual advisor email
  password: 'your-password'         // Replace with actual advisor password
};

let authToken = null;

async function testKYCWorkflow() {
  console.log('🧪 Starting Direct KYC Test...');
  console.log('📋 Test Client:', TEST_CLIENT);
  console.log('=' * 60);

  try {
    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, ADVISOR_CREDENTIALS);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + JSON.stringify(loginResponse.data));
    }
    
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Create test client
    console.log('\n👤 Step 2: Creating test client...');
    const clientResponse = await axios.post(`${BASE_URL}/api/clients`, TEST_CLIENT, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!clientResponse.data.success) {
      throw new Error('Client creation failed: ' + JSON.stringify(clientResponse.data));
    }

    const clientId = clientResponse.data.client._id;
    console.log('✅ Test client created:', clientId);

    // Step 3: Start KYC workflow
    console.log('\n🚀 Step 3: Starting KYC workflow...');
    console.log('📋 Client ID:', clientId);
    console.log('📋 Aadhar:', TEST_CLIENT.personalInfo.aadharNumber);
    console.log('📋 Phone:', TEST_CLIENT.phoneNumber);
    console.log('📋 Name:', `${TEST_CLIENT.firstName} ${TEST_CLIENT.lastName}`);

    const kycResponse = await axios.post(`${BASE_URL}/api/kyc/workflow/${clientId}`, {}, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (kycResponse.data.success) {
      console.log('\n🎉 KYC WORKFLOW STARTED SUCCESSFULLY!');
      console.log('=' * 60);
      console.log('📋 Digio Request ID:', kycResponse.data.data.digioRequestId);
      console.log('📋 Access Token:', kycResponse.data.data.accessToken ? 'Present' : 'Missing');
      console.log('📋 Message:', kycResponse.data.data.message);
      console.log('=' * 60);
      
      console.log('\n💡 Next Steps:');
      console.log('1. Check your Digio dashboard for the KYC request');
      console.log('2. The client should receive SMS notification (if notify_customer is true)');
      console.log('3. Use the access token in your frontend SDK');
      console.log('4. Monitor webhook events for status updates');
      
      return {
        success: true,
        clientId,
        digioRequestId: kycResponse.data.data.digioRequestId,
        accessToken: kycResponse.data.data.accessToken
      };
    } else {
      throw new Error('KYC workflow failed: ' + JSON.stringify(kycResponse.data));
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// Quick test function
async function quickTest() {
  console.log('⚡ Quick KYC Test (No Login Required)');
  console.log('📋 This will test the Digio service directly...');
  
  try {
    // Import the digio service directly
    const digioService = require('./backend/services/digioService');
    
    console.log('🔗 Testing Digio service directly...');
    
    const result = await digioService.createKYCWorkflowRequest(
      TEST_CLIENT.phoneNumber, // customer_identifier
      `${TEST_CLIENT.firstName} ${TEST_CLIENT.lastName}`, // customer_name
      `KYC_${Date.now()}`, // reference_id
      `TXN_${Date.now()}`, // transaction_id
      'SURENDRA', // template_name
      false, // notify_customer
      true  // generate_access_token
    );
    
    if (result.success) {
      console.log('\n🎉 DIRECT DIGIO API TEST SUCCESSFUL!');
      console.log('📋 Digio Request ID:', result.digioRequestId);
      console.log('📋 Access Token:', result.accessToken ? 'Present' : 'Missing');
      console.log('📋 Message:', result.message);
    } else {
      console.log('\n❌ Direct Digio API test failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('\n❌ Direct test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  console.log('Choose test mode:');
  console.log('1. Full workflow test (requires login credentials)');
  console.log('2. Quick direct test (tests Digio service only)');
  console.log('\nTo run full test: node test-kyc-direct.js full');
  console.log('To run quick test: node test-kyc-direct.js quick');
  
  const mode = process.argv[2];
  
  if (mode === 'full') {
    testKYCWorkflow().catch(console.error);
  } else if (mode === 'quick') {
    quickTest().catch(console.error);
  } else {
    console.log('\n⚠️ Please specify test mode: full or quick');
    console.log('Example: node test-kyc-direct.js quick');
  }
}

module.exports = { testKYCWorkflow, quickTest };
