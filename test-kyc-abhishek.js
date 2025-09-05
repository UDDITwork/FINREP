/**
 * KYC Test for Abhishek Rajput
 * Direct test with Aadhar: 522540051114, Phone: 8239697729
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

// Test configuration
const DIGIO_API_URL = 'https://api.digio.in';
const CLIENT_ID = process.env.DIGIO_CLIENT_ID;
const CLIENT_SECRET = process.env.DIGIO_CLIENT_SECRET;

// Test data
const TEST_DATA = {
  customer_identifier: '8239697729', // Phone number
  customer_name: 'Abhishek Rajput',
  template_name: 'SURENDRA',
  notify_customer: false,
  customer_notification_mode: 'SMS',
  reference_id: `KYC_ABHISHEK_${Date.now()}`,
  transaction_id: `TXN_ABHISHEK_${Date.now()}`,
  expire_in_days: 10,
  generate_access_token: true,
  generate_deeplink_info: true
};

let accessToken = null;

async function getDigioBasicAuth() {
  try {
    console.log('🔐 Setting up Digio Basic Authentication...');
    console.log('📋 Using CLIENT_ID:', CLIENT_ID);
    
    // Create Basic Auth header
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const basicAuth = `Basic ${credentials}`;
    
    console.log('✅ Basic Auth header created');
    return basicAuth;
  } catch (error) {
    console.error('❌ Failed to create Basic Auth:', error.message);
    throw error;
  }
}

async function createKYCRequest() {
  try {
    console.log('🚀 Creating KYC request for Abhishek Rajput...');
    console.log('📋 Request data:', JSON.stringify(TEST_DATA, null, 2));
    
    // Get Basic Auth header
    const basicAuth = await getDigioBasicAuth();
    
    const response = await axios.post(
      `${DIGIO_API_URL}/client/kyc/v2/request/with_template`,
      TEST_DATA,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': basicAuth
        }
      }
    );

    if (response.data && response.data.id) {
      console.log('\n🎉 KYC REQUEST CREATED SUCCESSFULLY!');
      console.log('=' * 60);
      console.log('📋 Digio Request ID:', response.data.id);
      console.log('📋 Access Token:', response.data.access_token ? 'Present' : 'Missing');
      console.log('📋 Reference ID:', response.data.reference_id);
      console.log('📋 Transaction ID:', response.data.transaction_id);
      console.log('📋 Status:', response.data.status);
      console.log('=' * 60);
      
      console.log('\n💡 Next Steps:');
      console.log('1. Check your Digio dashboard for the KYC request');
      console.log('2. Use the access token in your frontend SDK');
      console.log('3. The client (Abhishek Rajput) can now complete KYC verification');
      console.log('4. Monitor webhook events for status updates');
      
      return {
        success: true,
        digioRequestId: response.data.id,
        accessToken: response.data.access_token,
        referenceId: response.data.reference_id,
        transactionId: response.data.transaction_id,
        status: response.data.status
      };
    } else {
      throw new Error('Invalid response from Digio: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('❌ Failed to create KYC request:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function runTest() {
  try {
    console.log('🧪 KYC Test for Abhishek Rajput');
    console.log('📋 Aadhar: 522540051114');
    console.log('📋 Phone: 8239697729');
    console.log('📋 Name: Abhishek Rajput');
    console.log('=' * 60);

    // Check environment variables
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('❌ Missing Digio credentials!');
      console.log('Please set environment variables:');
      console.log('  DIGIO_CLIENT_ID=your_client_id');
      console.log('  DIGIO_CLIENT_SECRET=your_client_secret');
      return;
    }

    // Step 1: Setup Basic Auth (no separate token needed)
    console.log('✅ Using HTTP Basic Authentication');

    // Step 2: Create KYC request
    const result = await createKYCRequest();

    if (result.success) {
      console.log('\n✅ Test completed successfully!');
      console.log('📋 You can now use this request ID in your application');
    } else {
      console.log('\n❌ Test failed');
    }

  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { runTest, getDigioBasicAuth, createKYCRequest };
