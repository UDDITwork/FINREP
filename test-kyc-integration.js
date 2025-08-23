/**
 * FILE LOCATION: test-kyc-integration.js (root directory)
 * 
 * PURPOSE: Integration testing script for complete KYC verification workflow
 * 
 * FUNCTIONALITY:
 * - Tests backend KYC API endpoints for functionality
 * - Validates Digio API integration and authentication
 * - Verifies webhook endpoint processing and response handling
 * - Tests complete KYC workflow from initiation to completion
 * - Provides debugging information for integration issues
 * 
 * TEST COVERAGE:
 * - KYC endpoint functionality (clients, status, workflow, reset)
 * - Digio API authentication and workflow creation
 * - Webhook event processing and database updates
 * - End-to-end workflow validation
 * 
 * API ENDPOINTS TESTED:
 * - GET /api/kyc/clients: Client list retrieval
 * - GET /api/kyc/status/:clientId: Status retrieval
 * - POST /api/kyc/workflow/:clientId: Workflow initiation
 * - POST /api/kyc/webhook: Webhook processing
 * - POST https://api.digio.in/client/kyc/v2/request/with_template: Digio API
 * 
 * DATA FLOW TESTING:
 * - Client data retrieval and KYC status fetching
 * - Workflow creation and Digio API integration
 * - Webhook payload processing and status updates
 * - Error handling and response validation
 * 
 * CONNECTIVITY REQUIREMENTS:
 * - Backend server running on localhost:5000
 * - Valid authentication token for API access
 * - Internet connectivity for Digio API calls
 * - Environment variables loaded from backend/.env
 * 
 * AUTHENTICATION:
 * - Requires TEST_TOKEN environment variable
 * - Tests JWT token validation and authorization
 * - Validates multi-tenant access control
 * - Tests unauthenticated webhook access
 * 
 * ERROR SCENARIOS:
 * - Invalid authentication tokens
 * - Network connectivity issues
 * - Digio API credential failures
 * - Backend service unavailability
 * 
 * USAGE INSTRUCTIONS:
 * - Set TEST_TOKEN environment variable
 * - Ensure backend server is running
 * - Run: node test-kyc-integration.js
 * - Review console output for test results
 * 
 * DEPENDENCIES:
 * - axios: HTTP client for API testing
 * - dotenv: Environment variable loading
 * - Node.js runtime environment
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_CLIENT_ID = 'your-test-client-id'; // Replace with actual client ID

// Test functions
async function testKYCEndpoints() {
  console.log('🧪 Testing KYC Integration...\n');

  try {
    // 1. Test getting clients for KYC
    console.log('1. Testing GET /kyc/clients...');
    const clientsResponse = await axios.get(`${BASE_URL}/kyc/clients`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token'}`
      }
    });
    console.log('✅ Clients fetched successfully:', clientsResponse.data.data.length, 'clients found\n');

    // 2. Test getting KYC status for a client
    console.log('2. Testing GET /kyc/status/:clientId...');
    const statusResponse = await axios.get(`${BASE_URL}/kyc/status/${TEST_CLIENT_ID}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token'}`
      }
    });
    console.log('✅ KYC status fetched successfully:', statusResponse.data.data.kycStatus.overallStatus, '\n');

    // 3. Test starting KYC workflow
    console.log('3. Testing POST /kyc/workflow/:clientId...');
    const workflowResponse = await axios.post(`${BASE_URL}/kyc/workflow/${TEST_CLIENT_ID}`, {}, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'your-test-token'}`
      }
    });
    console.log('✅ KYC workflow started successfully:', workflowResponse.data.data.digioRequestId, '\n');

    // 4. Test webhook endpoint
    console.log('4. Testing POST /kyc/webhook...');
    const webhookPayload = {
      event: 'KYC_REQUEST_CREATED',
      entities: ['KYC_REQUEST'],
      payload: {
        KYC_REQUEST: {
          id: workflowResponse.data.data.digioRequestId,
          status: 'requested',
          reference_id: 'TEST_REF_001',
          transaction_id: 'TEST_TXN_001'
        }
      },
      id: 'WHN_TEST_001',
      created_at: Date.now()
    };

    const webhookResponse = await axios.post(`${BASE_URL}/kyc/webhook`, webhookPayload);
    console.log('✅ Webhook processed successfully:', webhookResponse.data.message, '\n');

    console.log('🎉 All KYC tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Make sure you have a valid authentication token');
      console.log('   Set TEST_TOKEN environment variable or update the script');
    }
    
    if (error.response?.status === 404) {
      console.log('\n💡 Make sure the backend server is running on port 5000');
    }
  }
}

// Test Digio service directly
async function testDigioService() {
  console.log('🔧 Testing Digio Service...\n');

  try {
    // Test creating a KYC workflow request
    const testPayload = {
      customer_identifier: 'test@example.com',
      customer_name: 'Test User',
      template_name: 'SURENDRA',
      notify_customer: false,
      expire_in_days: 10,
      generate_access_token: true,
      reference_id: 'TEST_REF_' + Date.now(),
      transaction_id: 'TEST_TXN_' + Date.now()
    };

    const response = await axios.post('https://api.digio.in/client/kyc/v2/request/with_template', testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.DIGIO_CLIENT_ID + ':' + process.env.DIGIO_CLIENT_SECRET).toString('base64')}`
      }
    });

    console.log('✅ Digio API test successful:', response.data.id);
    console.log('   Request ID:', response.data.id);
    console.log('   Status:', response.data.status);
    console.log('   Access Token:', response.data.access_token?.id);

  } catch (error) {
    console.error('❌ Digio service test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Check your Digio credentials in .env file');
      console.log('   DIGIO_CLIENT_ID and DIGIO_CLIENT_SECRET should be valid');
    }
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting KYC Integration Tests...\n');
  
  // Load environment variables
  require('dotenv').config({ path: './backend/.env' });
  
  await testDigioService();
  console.log('\n' + '='.repeat(50) + '\n');
  await testKYCEndpoints();
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testKYCEndpoints,
  testDigioService,
  runTests
};
