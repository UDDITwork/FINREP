// File: test-final-report-api.js
// Simple test script to verify Final Report API endpoints

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_ADVISOR_ID = '507f1f77bcf86cd799439011'; // Replace with actual advisor ID
const TEST_CLIENT_ID = '507f1f77bcf86cd799439012'; // Replace with actual client ID

async function testFinalReportAPI() {
  console.log('🧪 Testing Final Report API Endpoints...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/final-report/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Get Clients List
    console.log('2️⃣ Testing Get Clients...');
    const clientsResponse = await axios.get(`${BASE_URL}/final-report/clients/${TEST_ADVISOR_ID}`);
    console.log('✅ Get Clients:', {
      success: clientsResponse.data.success,
      count: clientsResponse.data.count,
      firstClient: clientsResponse.data.clients?.[0] ? {
        name: `${clientsResponse.data.clients[0].firstName} ${clientsResponse.data.clients[0].lastName}`,
        email: clientsResponse.data.clients[0].email,
        portfolio: clientsResponse.data.clients[0].totalPortfolioValue
      } : 'No clients found'
    });
    console.log('');

    // Test 3: Get Comprehensive Data
    console.log('3️⃣ Testing Get Comprehensive Data...');
    const dataResponse = await axios.get(`${BASE_URL}/final-report/data/${TEST_ADVISOR_ID}/${TEST_CLIENT_ID}`);
    console.log('✅ Get Comprehensive Data:', {
      success: dataResponse.data.success,
      reportId: dataResponse.data.data?.header?.reportId,
      clientName: dataResponse.data.data?.header?.clientName,
      totalServices: dataResponse.data.data?.summary?.totalServices,
      activeServices: dataResponse.data.data?.summary?.activeServices,
      portfolioValue: dataResponse.data.data?.summary?.portfolioValue
    });
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('📊 Final Report API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure the backend server is running on port 5000');
    console.log('2. Check if the advisor and client IDs exist in the database');
    console.log('3. Verify that the final-report route is properly registered');
    console.log('4. Check backend console for any error messages');
  }
}

// Run the test
testFinalReportAPI();
