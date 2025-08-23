// Test script for LOE Automation API endpoints
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import models
const Client = require('./models/Client');
const Advisor = require('./models/Advisor');
const LOEAutomation = require('./models/LOEAutomation');

// Mock request and response objects
const createMockRequest = (advisorId, clientId, body = {}) => ({
  advisor: { _id: advisorId },
  params: { clientId },
  body,
  ip: '127.0.0.1',
  get: (header) => header === 'User-Agent' ? 'Test User Agent' : null
});

const createMockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function testLOEAutomationAPI() {
  try {
    console.log('🔍 Testing LOE Automation API Endpoints...');
    
    const clientId = '689948713515196131838949';
    const advisorId = '6883ec3e2cc2c6df98e40604';
    
    // Import controller functions
    const {
      getClientsWithLOEStatus,
      createLOEForClient,
      getClientLOEData,
      submitClientSignature
    } = require('./controllers/loeAutomationController');
    
    // Test 1: Get clients with LOE status
    console.log('\n📋 Test 1: Testing getClientsWithLOEStatus...');
    const req1 = createMockRequest(advisorId);
    const res1 = createMockResponse();
    
    await getClientsWithLOEStatus(req1, res1);
    
    console.log('✅ getClientsWithLOEStatus result:', {
      statusCode: res1.statusCode,
      success: res1.data?.success,
      totalClients: res1.data?.data?.totalClients,
      clientsWithLOE: res1.data?.data?.clientsWithLOE
    });
    
    // Test 2: Create LOE for client
    console.log('\n📄 Test 2: Testing createLOEForClient...');
    const req2 = createMockRequest(advisorId, clientId, {
      customNotes: 'Test LOE from API'
    });
    const res2 = createMockResponse();
    
    await createLOEForClient(req2, res2);
    
    console.log('✅ createLOEForClient result:', {
      statusCode: res2.statusCode,
      success: res2.data?.success,
      loeId: res2.data?.data?.loeId,
      accessToken: res2.data?.data?.accessToken,
      clientAccessUrl: res2.data?.data?.clientAccessUrl
    });
    
    if (res2.data?.success && res2.data?.data?.accessToken) {
      const accessToken = res2.data.data.accessToken;
      
      // Test 3: Get client LOE data
      console.log('\n🔍 Test 3: Testing getClientLOEData...');
      const req3 = {
        params: { accessToken },
        ip: '127.0.0.1',
        get: (header) => header === 'User-Agent' ? 'Test User Agent' : null
      };
      const res3 = createMockResponse();
      
      await getClientLOEData(req3, res3);
      
      console.log('✅ getClientLOEData result:', {
        statusCode: res3.statusCode,
        success: res3.data?.success,
        hasClientData: !!res3.data?.data?.client,
        hasAdvisorData: !!res3.data?.data?.advisor,
        clientName: res3.data?.data?.client ? 
          `${res3.data.data.client.firstName} ${res3.data.data.client.lastName}` : 'N/A'
      });
      
      // Test 4: Submit client signature
      console.log('\n✍️ Test 4: Testing submitClientSignature...');
      const testSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const req4 = {
        params: { accessToken },
        body: {
          signature: testSignature,
          ipAddress: '127.0.0.1',
          userAgent: 'Test User Agent'
        },
        ip: '127.0.0.1',
        get: (header) => header === 'User-Agent' ? 'Test User Agent' : null
      };
      const res4 = createMockResponse();
      
      await submitClientSignature(req4, res4);
      
      console.log('✅ submitClientSignature result:', {
        statusCode: res4.statusCode,
        success: res4.data?.success,
        message: res4.data?.data?.message,
        hasPdfUrl: !!res4.data?.data?.pdfUrl
      });
    }
    
    console.log('\n🎉 All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testLOEAutomationAPI();
