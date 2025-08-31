/**
 * Direct test of tax planning AI recommendations
 * This bypasses authentication for testing purposes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { generateAIRecommendations } = require('./controllers/taxPlanningController');

async function testTaxPlanningDirect() {
  console.log('🧪 Testing Tax Planning AI Recommendations Directly...\n');
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Use real client ID from database
    const clientId = '687d5781cd2a759b14087160';
    
    // Create mock request and response objects
    const mockReq = {
      params: { clientId },
      body: { taxYear: new Date().getFullYear().toString() },
      advisor: { id: '687c80ff3be6f9e1b846a467' } // Real advisor ID
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`📡 Response Status: ${code}`);
          console.log('📊 Response Data:', JSON.stringify(data, null, 2));
          return { status: code, json: (data) => data };
        }
      }),
      json: (data) => {
        console.log('📊 Response Data:', JSON.stringify(data, null, 2));
        return data;
      }
    };
    
    console.log(`\n🤖 Testing AI recommendations for client: ${clientId}`);
    console.log('📅 Tax Year:', mockReq.body.taxYear);
    console.log('👤 Advisor ID:', mockReq.advisor.id);
    
    // Call the function directly
    await generateAIRecommendations(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
testTaxPlanningDirect().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
