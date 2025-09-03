/**
 * FOCUSED TEST SCRIPT FOR CLAUDE AI INTEGRATION
 * 
 * This script specifically tests:
 * 1. Claude AI API connectivity
 * 2. Fund details fetching
 * 3. Response parsing
 * 4. API endpoint functionality
 * 
 * RUN INSTRUCTIONS:
 * 1. Ensure backend server is running on port 5000
 * 2. Ensure CLAUDE_API_KEY is set in .env
 * 3. Run: node test-claude-integration.js
 */

const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

// Test Configuration
const BASE_URL = 'http://localhost:5000/api';

// Test Results
let passed = 0;
let failed = 0;

const logTest = (testName, success, details = '') => {
  if (success) {
    passed++;
    console.log(`✅ ${testName}`);
  } else {
    failed++;
    console.log(`❌ ${testName}`);
    if (details) console.log(`   Details: ${details}`);
  }
};

// Test 1: Check Environment Variables
const testEnvironment = () => {
  console.log('\n🔍 Testing Environment Configuration...');
  
  const claudeKey = process.env.CLAUDE_API_KEY;
  const claudeUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
  const claudeModel = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
  
  logTest('CLAUDE_API_KEY is set', !!claudeKey, claudeKey ? 'API key found' : 'API key missing');
  logTest('CLAUDE_API_URL is configured', !!claudeUrl, `Using: ${claudeUrl}`);
  logTest('CLAUDE_MODEL is configured', !!claudeModel, `Using: ${claudeModel}`);
  
  if (claudeKey) {
    console.log(`   API Key: ${claudeKey.substring(0, 20)}...${claudeKey.substring(claudeKey.length - 10)}`);
  }
};

// Test 2: Test Claude AI Service Directly
const testClaudeService = async () => {
  console.log('\n🔍 Testing Claude AI Service Directly...');
  
  try {
    const claudeService = require('./backend/services/claudeMutualFundService');
    
    // Test with a real mutual fund
    console.log('   Testing with ICICI Prudential Large Cap Fund...');
    const fundDetails = await claudeService.fetchMutualFundDetails(
      'ICICI Prudential Large Cap Fund', 
      'ICICI Prudential'
    );
    
    if (fundDetails.success) {
      logTest('Claude AI API call successful', true, 'Fund details fetched');
      
      // Display the response
      console.log('\n   📊 Claude AI Response:');
      console.log(`   Fund Name: ${fundDetails.data.fundName || 'N/A'}`);
      console.log(`   Category: ${fundDetails.data.category || 'N/A'}`);
      console.log(`   AUM: ${fundDetails.data.aum || 'N/A'}`);
      console.log(`   Latest NAV: ${fundDetails.data.latestNAV || 'N/A'}`);
      console.log(`   Risk: ${fundDetails.data.risk || 'N/A'}`);
      console.log(`   Returns (1Y): ${fundDetails.data.returns?.oneYear || 'N/A'}`);
      
      // Test response parsing
      const parsedData = claudeService.parseClaudeResponse(fundDetails.data);
      logTest('Response parsing successful', !!parsedData.fundName, `Parsed: ${parsedData.fundName}`);
      
      // Test data validation
      const validation = claudeService.validateFundData(parsedData);
      logTest('Data validation passed', validation.isValid, `Completeness: ${validation.completeness}%`);
      
    } else {
      logTest('Claude AI API call', false, fundDetails.error);
    }
    
  } catch (error) {
    logTest('Claude Service Test', false, error.message);
  }
};

// Test 3: Test API Endpoint (Claude Fund Details)
const testAPIEndpoint = async () => {
  console.log('\n🔍 Testing API Endpoint for Claude Fund Details...');
  
  try {
    // Test the /claude/fund-details endpoint
    const response = await axios.post(`${BASE_URL}/mutual-fund-recommend/claude/fund-details`, {
      fundName: 'HDFC Mid-Cap Opportunities Fund',
      fundHouseName: 'HDFC Mutual Fund'
    });
    
    if (response.status === 200 && response.data.success) {
      logTest('API endpoint successful', true, 'Fund details returned via API');
      
      console.log('\n   📊 API Response Sample:');
      const data = response.data.data;
      console.log(`   Fund Name: ${data.fundName || 'N/A'}`);
      console.log(`   Category: ${data.category || 'N/A'}`);
      console.log(`   AUM: ${data.aum || 'N/A'}`);
      console.log(`   Risk: ${data.risk || 'N/A'}`);
      
      // Check validation data
      if (response.data.validation) {
        console.log(`   Data Completeness: ${response.data.validation.completeness}%`);
        console.log(`   Missing Fields: ${response.data.validation.missingFields.join(', ') || 'None'}`);
      }
      
    } else {
      logTest('API endpoint', false, `Unexpected response: ${response.status}`);
    }
    
  } catch (error) {
    if (error.response) {
      logTest('API endpoint', false, `HTTP ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`);
    } else {
      logTest('API endpoint', false, error.message);
    }
  }
};

// Test 4: Test Multiple Fund Types
const testMultipleFunds = async () => {
  console.log('\n🔍 Testing Multiple Fund Types...');
  
  const testFunds = [
    { name: 'SBI Bluechip Fund', house: 'SBI Mutual Fund' },
    { name: 'Axis Bluechip Fund', house: 'Axis Mutual Fund' },
    { name: 'Kotak Emerging Equity Fund', house: 'Kotak Mutual Fund' }
  ];
  
  for (const fund of testFunds) {
    try {
      console.log(`   Testing: ${fund.name} (${fund.house})`);
      
      const response = await axios.post(`${BASE_URL}/mutual-fund-recommend/claude/fund-details`, {
        fundName: fund.name,
        fundHouseName: fund.house
      });
      
      if (response.status === 200 && response.data.success) {
        const data = response.data.data;
        logTest(`${fund.name} - API call`, true, `Category: ${data.category}, Risk: ${data.risk}`);
      } else {
        logTest(`${fund.name} - API call`, false, 'Unexpected response');
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      logTest(`${fund.name} - API call`, false, error.response?.data?.message || error.message);
    }
  }
};

// Test 5: Test Error Handling
const testErrorHandling = async () => {
  console.log('\n🔍 Testing Error Handling...');
  
  try {
    // Test with empty fund name
    const response1 = await axios.post(`${BASE_URL}/mutual-fund-recommend/claude/fund-details`, {
      fundName: '',
      fundHouseName: 'Test House'
    });
    
    logTest('Empty fund name validation', response1.status === 400, 'Properly rejected empty fund name');
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logTest('Empty fund name validation', true, 'Properly rejected empty fund name');
    } else {
      logTest('Empty fund name validation', false, 'Unexpected response');
    }
  }
  
  try {
    // Test with missing fields
    const response2 = await axios.post(`${BASE_URL}/mutual-fund-recommend/claude/fund-details`, {
      fundName: 'Test Fund'
      // Missing fundHouseName
    });
    
    logTest('Missing fields validation', response2.status === 400, 'Properly rejected missing fields');
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logTest('Missing fields validation', true, 'Properly rejected missing fields');
    } else {
      logTest('Missing fields validation', false, 'Unexpected response');
    }
  }
};

// Test 6: Performance Test
const testPerformance = async () => {
  console.log('\n🔍 Testing Performance...');
  
  try {
    const startTime = Date.now();
    
    const response = await axios.post(`${BASE_URL}/mutual-fund-recommend/claude/fund-details`, {
      fundName: 'Reliance Large Cap Fund',
      fundHouseName: 'Reliance Mutual Fund'
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200 && response.data.success) {
      logTest('Performance test', responseTime < 30000, `Response time: ${responseTime}ms`);
      
      if (responseTime > 30000) {
        console.log('   ⚠️  Warning: Response time exceeds 30 seconds');
      } else if (responseTime > 15000) {
        console.log('   ⚠️  Warning: Response time is slow (>15 seconds)');
      } else {
        console.log('   ✅ Response time is acceptable');
      }
    } else {
      logTest('Performance test', false, 'API call failed');
    }
    
  } catch (error) {
    logTest('Performance test', false, error.message);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 STARTING CLAUDE AI INTEGRATION TEST');
  console.log('=' .repeat(50));
  
  try {
    await testEnvironment();
    await testClaudeService();
    await testAPIEndpoint();
    await testMultipleFunds();
    await testErrorHandling();
    await testPerformance();
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Claude AI integration is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }
    
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
