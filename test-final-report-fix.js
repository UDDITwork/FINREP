// File: test-final-report-fix.js
// Test script to verify final report API endpoints

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testFinalReportAPI() {
  console.log('🧪 Testing Final Report API Endpoints...\n');

  try {
    // Test 1: Get clients for advisor
    console.log('1. Testing GET /api/final-report/clients');
    try {
      const clientsResponse = await axios.get(`${BASE_URL}/final-report/clients`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      console.log('✅ Clients endpoint working:', {
        status: clientsResponse.status,
        success: clientsResponse.data.success,
        clientCount: clientsResponse.data.data?.clients?.length || 0
      });
      
      if (clientsResponse.data.data?.clients?.length > 0) {
        console.log('📋 Sample client data:', {
          id: clientsResponse.data.data.clients[0]._id,
          name: `${clientsResponse.data.data.clients[0].firstName} ${clientsResponse.data.data.clients[0].lastName}`,
          email: clientsResponse.data.data.clients[0].email
        });
      }
      
    } catch (error) {
      console.log('❌ Clients endpoint failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Test without auth token
    console.log('2. Testing GET /api/final-report/clients without auth');
    try {
      const noAuthResponse = await axios.get(`${BASE_URL}/final-report/clients`);
      console.log('❌ Should have failed without auth, but got:', noAuthResponse.status);
    } catch (error) {
      console.log('✅ Correctly rejected without auth:', {
        status: error.response?.status,
        message: error.response?.data?.message
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFinalReportAPI();
