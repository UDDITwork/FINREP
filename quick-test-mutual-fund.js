/**
 * QUICK TEST MUTUAL FUND RECOMMENDATION
 * 
 * This script quickly tests the mutual fund recommendation endpoint
 * after you've applied the fixes.
 * 
 * USAGE:
 * 1. Make sure your backend server is running
 * 2. Run: node quick-test-mutual-fund.js
 * 3. Check the output for success/failure
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const ENDPOINT = '/api/mutual-fund-recommend';

// Test data - UPDATE THESE VALUES WITH REAL DATA FROM YOUR DATABASE
const TEST_DATA = {
  // Valid client ID from your database (REKHA SAXENA)
  clientId: '689948713515196131838949',
  
  fundName: 'HDFC Mid-Cap Opportunities Fund',
  fundHouseName: 'HDFC Mutual Fund',
  recommendedMonthlySIP: 5000,
  sipStartDate: '2025-10-01',
  expectedExitDate: '2028-10-01',
  exitConditions: 'Target return achieved or 3 years completed',
  reasonForRecommendation: 'Strong mid-cap growth potential with good track record',
  riskProfile: 'Moderate',
  investmentGoal: 'Long-term wealth creation',
  claudeResponse: 'Sample Claude AI response for testing'
};

// Test function
async function testMutualFundRecommendation() {
  console.log('🧪 TESTING MUTUAL FUND RECOMMENDATION ENDPOINT\n');
  
  try {
    // First, test if the endpoint is accessible
    console.log('🔍 STEP 1: Testing endpoint accessibility...');
    try {
      const response = await axios.get(`${BASE_URL}${ENDPOINT}/debug/test`);
      console.log('✅ Endpoint is accessible');
      console.log('   Response:', response.data.message);
    } catch (error) {
      console.log('❌ Endpoint not accessible:', error.message);
      return;
    }
    
    console.log('');
    
    // Check if we have a valid clientId
    if (TEST_DATA.clientId === 'REPLACE_WITH_VALID_CLIENT_ID') {
      console.log('⚠️ WARNING: You need to update TEST_DATA.clientId with a valid client ID');
      console.log('💡 Run the diagnostic script first: node debug-client-lookup.js');
      console.log('💡 Or run the frontend fix script: node fix-frontend-client-selection.js');
      return;
    }
    
    console.log('🔍 STEP 2: Testing mutual fund recommendation creation...');
    console.log(`   Client ID: ${TEST_DATA.clientId}`);
    console.log(`   Fund: ${TEST_DATA.fundName}`);
    console.log('');
    
    // Test the POST endpoint
    const response = await axios.post(`${BASE_URL}${ENDPOINT}`, TEST_DATA, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // You need to add a valid token
      }
    });
    
    console.log('✅ SUCCESS! Mutual fund recommendation created');
    console.log('   Status:', response.status);
    console.log('   Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ REQUEST FAILED');
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('💡 AUTHENTICATION ERROR: You need to add a valid JWT token');
        console.log('💡 Get a token by logging in through your frontend');
      } else if (error.response.status === 404) {
        console.log('💡 CLIENT NOT FOUND: The clientId is still invalid');
        console.log('💡 Run the diagnostic script to find valid client IDs');
      } else if (error.response.status === 400) {
        console.log('💡 VALIDATION ERROR: Check the required fields in your request');
      }
    } else {
      console.log('❌ NETWORK ERROR:', error.message);
      console.log('💡 Make sure your backend server is running on port 5000');
    }
  }
}

// Instructions
function showInstructions() {
  console.log('📋 SETUP INSTRUCTIONS:\n');
  console.log('1. Make sure your backend server is running');
  console.log('2. Get a valid client ID from your database:');
  console.log('   node debug-client-lookup.js');
  console.log('3. Get a valid JWT token by logging in through your frontend');
  console.log('4. Update TEST_DATA.clientId with the valid client ID');
  console.log('5. Update the Authorization header with your JWT token');
  console.log('6. Run this test: node quick-test-mutual-fund.js');
  console.log('');
}

// Main function
async function main() {
  showInstructions();
  
  // Check if we have the required dependencies
  try {
    require('axios');
  } catch (error) {
    console.log('❌ Missing dependency: axios');
    console.log('💡 Install it with: npm install axios');
    return;
  }
  
  await testMutualFundRecommendation();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testMutualFundRecommendation };
