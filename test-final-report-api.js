// Test file for Final Report API endpoints
// Run this to verify the API is working correctly

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
});

async function testFinalReportAPI() {
  console.log('🧪 Testing Final Report API Endpoints...\n');

  try {
    // Test 1: Test endpoint
    console.log('1️⃣ Testing /final-report/test endpoint...');
    const testResponse = await api.get('/final-report/test');
    console.log('✅ Test endpoint working:', testResponse.data);
    console.log('');

    // Test 2: Get clients for report
    console.log('2️⃣ Testing /final-report/clients endpoint...');
    const clientsResponse = await api.get('/final-report/clients');
    console.log('✅ Clients endpoint working:', {
      success: clientsResponse.data.success,
      clientCount: clientsResponse.data.data?.clients?.length || 0,
      totalClients: clientsResponse.data.data?.totalClients || 0
    });
    console.log('');

    // Test 3: Test with a sample client ID (if clients exist)
    if (clientsResponse.data.data?.clients?.length > 0) {
      const sampleClientId = clientsResponse.data.data.clients[0]._id;
      console.log(`3️⃣ Testing /final-report/data/${sampleClientId} endpoint...`);
      
      const dataResponse = await api.get(`/final-report/data/${sampleClientId}`);
      console.log('✅ Data endpoint working:', {
        success: dataResponse.data.success,
        reportId: dataResponse.data.data?.header?.reportId,
        totalServices: dataResponse.data.data?.summary?.totalServices,
        activeServices: dataResponse.data.data?.summary?.activeServices
      });
      console.log('');

      // Test 4: Test summary endpoint
      console.log(`4️⃣ Testing /final-report/summary/${sampleClientId} endpoint...`);
      const summaryResponse = await api.get(`/final-report/summary/${sampleClientId}`);
      console.log('✅ Summary endpoint working:', {
        success: summaryResponse.data.success,
        totalServices: summaryResponse.data.data?.totalServices,
        activeServices: summaryResponse.data.data?.activeServices
      });
    } else {
      console.log('⚠️ No clients found to test data endpoints');
    }

    console.log('\n🎉 All Final Report API tests completed successfully!');

  } catch (error) {
    console.error('❌ API Test Failed:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

// Run the test
testFinalReportAPI();
