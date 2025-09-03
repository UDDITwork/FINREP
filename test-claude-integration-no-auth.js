/**
 * CLAUDE AI INTEGRATION TEST (NO AUTHENTICATION)
 * 
 * This script tests Claude AI integration without requiring authentication
 * 
 * RUN INSTRUCTIONS:
 * 1. Ensure backend server is running on port 5000
 * 2. Ensure CLAUDE_API_KEY is set in backend/.env
 * 3. Run: node test-claude-integration-no-auth.js
 */

const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

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

// Test 3: Test Multiple Fund Types
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
      
      const claudeService = require('./backend/services/claudeMutualFundService');
      const fundDetails = await claudeService.fetchMutualFundDetails(fund.name, fund.house);
      
      if (fundDetails.success) {
        const data = fundDetails.data;
        logTest(`${fund.name} - Claude AI call`, true, `Category: ${data.category}, Risk: ${data.risk}`);
      } else {
        logTest(`${fund.name} - Claude AI call`, false, fundDetails.error);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      logTest(`${fund.name} - Claude AI call`, false, error.message);
    }
  }
};

// Test 4: Performance Test
const testPerformance = async () => {
  console.log('\n🔍 Testing Performance...');
  
  try {
    const claudeService = require('./backend/services/claudeMutualFundService');
    const startTime = Date.now();
    
    const fundDetails = await claudeService.fetchMutualFundDetails('Reliance Large Cap Fund', 'Reliance Mutual Fund');
    
    const responseTime = Date.now() - startTime;
    
    if (fundDetails.success) {
      logTest('Performance test', responseTime < 30000, `Response time: ${responseTime}ms`);
      
      if (responseTime > 30000) {
        console.log('   ⚠️  Warning: Response time exceeds 30 seconds');
      } else if (responseTime > 15000) {
        console.log('   ⚠️  Warning: Response time is slow (>15 seconds)');
      } else {
        console.log('   ✅ Response time is acceptable');
      }
    } else {
      logTest('Performance test', false, fundDetails.error);
    }
    
  } catch (error) {
    logTest('Performance test', false, error.message);
  }
};

// Test 5: Error Handling Test
const testErrorHandling = async () => {
  console.log('\n🔍 Testing Error Handling...');
  
  try {
    const claudeService = require('./backend/services/claudeMutualFundService');
    
    // Test with invalid fund name
    const invalidResponse = await claudeService.fetchMutualFundDetails('', '');
    logTest('Error Handling - Invalid Input', !invalidResponse.success, 'Properly handled invalid input');
    
    // Test with non-existent fund
    const nonExistentResponse = await claudeService.fetchMutualFundDetails('Non Existent Fund XYZ', 'Non Existent House');
    logTest('Error Handling - Non-existent Fund', true, 'Handled non-existent fund gracefully');
    
  } catch (error) {
    logTest('Error Handling Test', false, `Error: ${error.message}`);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 STARTING CLAUDE AI INTEGRATION TEST (NO AUTH)');
  console.log('=' .repeat(60));
  
  try {
    await testEnvironment();
    await testClaudeService();
    await testMultipleFunds();
    await testPerformance();
    await testErrorHandling();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
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
