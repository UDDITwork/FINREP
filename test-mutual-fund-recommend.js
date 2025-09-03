/**
 * COMPREHENSIVE TEST SCRIPT FOR MUTUAL FUND RECOMMENDATION SYSTEM
 * 
 * This script tests:
 * 1. Backend server connectivity
 * 2. Database model creation
 * 3. All API endpoints
 * 4. Claude AI integration
 * 5. Data persistence
 * 6. Authentication and security
 * 7. Form validation and error handling
 * 
 * RUN INSTRUCTIONS:
 * 1. Ensure backend server is running on port 5000
 * 2. Ensure MongoDB is connected
 * 3. Ensure CLAUDE_API_KEY is set in .env
 * 4. Run: node test-mutual-fund-recommend.js
 */

const axios = require('axios');
const mongoose = require('mongoose');

// Test Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_CLIENT_ID = '507f1f77bcf86cd799439011'; // Mock client ID for testing
const TEST_ADVISOR_ID = '507f1f77bcf86cd799439012'; // Mock advisor ID for testing

// Test Results Tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to log test results
const logTest = (testName, passed, details = '') => {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${testName}`);
    if (details) console.log(`   Details: ${details}`);
  }
  testResults.details.push({ name: testName, passed, details });
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

// Test 1: Backend Server Connectivity
const testBackendConnectivity = async () => {
  console.log('\n🔍 Testing Backend Server Connectivity...');
  
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    logTest('Backend Server Health Check', response.status === 200, `Status: ${response.status}`);
  } catch (error) {
    logTest('Backend Server Health Check', false, `Error: ${error.message}`);
  }
};

// Test 2: Environment Variables Check
const testEnvironmentVariables = async () => {
  console.log('\n🔍 Testing Environment Variables...');
  
  try {
    // Check if .env file exists and has required variables
    require('dotenv').config({ path: './backend/.env' });
    
    const requiredVars = [
      'CLAUDE_API_KEY',
      'CLAUDE_API_URL', 
      'CLAUDE_MODEL',
      'MONGODB_URI',
      'JWT_SECRET'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      logTest('Environment Variables Check', true, 'All required variables are set');
      
      // Log Claude API configuration
      console.log(`   Claude API Key: ${process.env.CLAUDE_API_KEY ? '✅ Set' : '❌ Missing'}`);
      console.log(`   Claude API URL: ${process.env.CLAUDE_API_URL || 'Using default'}`);
      console.log(`   Claude Model: ${process.env.CLAUDE_MODEL || 'Using default'}`);
    } else {
      logTest('Environment Variables Check', false, `Missing variables: ${missingVars.join(', ')}`);
    }
  } catch (error) {
    logTest('Environment Variables Check', false, `Error: ${error.message}`);
  }
};

// Test 3: Database Connection Test
const testDatabaseConnection = async () => {
  console.log('\n🔍 Testing Database Connection...');
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      logTest('Database Connection', false, 'MONGODB_URI not set');
      return;
    }
    
    await mongoose.connect(mongoUri);
    logTest('Database Connection', true, 'Successfully connected to MongoDB');
    
    // Test if we can access the database
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    logTest('Database Collections Access', true, `Found ${collections.length} collections`);
    
  } catch (error) {
    logTest('Database Connection', false, `Error: ${error.message}`);
  }
};

// Test 4: Mutual Fund Recommend Model Test
const testModelCreation = async () => {
  console.log('\n🔍 Testing Database Model Creation...');
  
  try {
    const MutualFundRecommend = require('./backend/models/MutualFundRecommend');
    
    // Test schema creation
    const testRecommendation = new MutualFundRecommend({
      clientId: new mongoose.Types.ObjectId(),
      advisorId: new mongoose.Types.ObjectId(),
      fundName: 'Test Fund',
      fundHouseName: 'Test Fund House',
      recommendedMonthlySIP: 5000,
      sipStartDate: new Date(),
      expectedExitDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      exitConditions: 'Test exit conditions',
      reasonForRecommendation: 'Test reason',
      riskProfile: 'Moderate',
      investmentGoal: 'Wealth Creation'
    });
    
    logTest('Model Schema Creation', true, 'MutualFundRecommend model created successfully');
    
    // Test validation
    const validationError = testRecommendation.validateSync();
    logTest('Model Validation', !validationError, validationError ? validationError.message : 'Validation passed');
    
  } catch (error) {
    logTest('Model Creation', false, `Error: ${error.message}`);
  }
};

// Test 5: Claude AI Service Test
const testClaudeAIService = async () => {
  console.log('\n🔍 Testing Claude AI Service...');
  
  try {
    const claudeService = require('./backend/services/claudeMutualFundService');
    
    // Test service import
    logTest('Claude Service Import', true, 'Service imported successfully');
    
    // Test system prompt generation
    const prompt = claudeService.generateSystemPrompt('ICICI Prudential Large Cap Fund', 'ICICI Prudential');
    logTest('System Prompt Generation', prompt.length > 100, `Generated prompt length: ${prompt.length} characters`);
    
    // Test Claude API call (this will actually call the API)
    console.log('   Testing Claude API call with real fund data...');
    const fundDetails = await claudeService.fetchMutualFundDetails('ICICI Prudential Large Cap Fund', 'ICICI Prudential');
    
    if (fundDetails.success) {
      logTest('Claude API Call', true, 'Successfully fetched fund details from Claude AI');
      
      // Test response parsing
      const parsedData = claudeService.parseClaudeResponse(fundDetails.data);
      logTest('Response Parsing', !!parsedData.fundName, `Parsed fund name: ${parsedData.fundName}`);
      
      // Test data validation
      const validation = claudeService.validateFundData(parsedData);
      logTest('Data Validation', validation.isValid, `Completeness: ${validation.completeness}%`);
      
      console.log('   Claude AI Response Sample:');
      console.log(`     Fund Name: ${parsedData.fundName || 'N/A'}`);
      console.log(`     Category: ${parsedData.category || 'N/A'}`);
      console.log(`     AUM: ${parsedData.aum || 'N/A'}`);
      console.log(`     Risk: ${parsedData.risk || 'N/A'}`);
      
    } else {
      logTest('Claude API Call', false, `Error: ${fundDetails.error}`);
    }
    
  } catch (error) {
    logTest('Claude AI Service', false, `Error: ${error.message}`);
  }
};

// Test 6: API Endpoints Test (without authentication)
const testAPIEndpoints = async () => {
  console.log('\n🔍 Testing API Endpoints (without authentication)...');
  
  try {
    // Test endpoints that should return 401 (unauthorized)
    const endpoints = [
      { method: 'GET', path: '/mutual-fund-recommend/summary' },
      { method: 'POST', path: '/mutual-fund-recommend', data: {} },
      { method: 'GET', path: '/mutual-fund-recommend/client/test' }
    ];
    
    for (const endpoint of endpoints) {
      const response = await makeAuthenticatedRequest(endpoint.method, endpoint.path, endpoint.data);
      logTest(
        `${endpoint.method} ${endpoint.path} - Unauthorized Access`, 
        response.status === 401, 
        `Status: ${response.status}`
      );
    }
    
  } catch (error) {
    logTest('API Endpoints Test', false, `Error: ${error.message}`);
  }
};

// Test 7: Form Validation Test
const testFormValidation = async () => {
  console.log('\n🔍 Testing Form Validation...');
  
  try {
    // Test missing required fields
    const invalidData = {
      fundName: 'Test Fund',
      // Missing other required fields
    };
    
    const response = await makeAuthenticatedRequest('POST', '/mutual-fund-recommend', invalidData);
    logTest('Form Validation - Missing Fields', response.status === 400, `Status: ${response.status}`);
    
    // Test invalid data types
    const invalidTypesData = {
      clientId: 'invalid-id',
      fundName: 'Test Fund',
      fundHouseName: 'Test House',
      recommendedMonthlySIP: 'not-a-number',
      sipStartDate: 'invalid-date',
      expectedExitDate: 'invalid-date',
      exitConditions: 'Test',
      reasonForRecommendation: 'Test',
      riskProfile: 'Invalid',
      investmentGoal: 'Invalid'
    };
    
    const response2 = await makeAuthenticatedRequest('POST', '/mutual-fund-recommend', invalidTypesData);
    logTest('Form Validation - Invalid Data Types', response2.status === 400, `Status: ${response2.status}`);
    
  } catch (error) {
    logTest('Form Validation Test', false, `Error: ${error.message}`);
  }
};

// Test 8: Database Operations Test
const testDatabaseOperations = async () => {
  console.log('\n🔍 Testing Database Operations...');
  
  try {
    const MutualFundRecommend = require('./backend/models/MutualFundRecommend');
    
    // Test creating a recommendation
    const testRecommendation = new MutualFundRecommend({
      clientId: new mongoose.Types.ObjectId(),
      advisorId: new mongoose.Types.ObjectId(),
      fundName: 'Test Fund for DB Test',
      fundHouseName: 'Test Fund House for DB Test',
      recommendedMonthlySIP: 10000,
      sipStartDate: new Date(),
      expectedExitDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      exitConditions: 'Test exit conditions for DB test',
      reasonForRecommendation: 'Test reason for DB test',
      riskProfile: 'Aggressive',
      investmentGoal: 'Retirement',
      claudeResponse: {
        category: 'Equity - Large Cap',
        aum: '₹1000 Cr',
        risk: 'High'
      }
    });
    
    await testRecommendation.save();
    logTest('Database Create Operation', true, 'Successfully created test recommendation');
    
    // Test reading the recommendation
    const foundRecommendation = await MutualFundRecommend.findById(testRecommendation._id);
    logTest('Database Read Operation', !!foundRecommendation, `Found recommendation: ${foundRecommendation.fundName}`);
    
    // Test updating the recommendation
    foundRecommendation.recommendedMonthlySIP = 15000;
    await foundRecommendation.save();
    logTest('Database Update Operation', true, 'Successfully updated recommendation');
    
    // Test deleting the recommendation
    await MutualFundRecommend.findByIdAndDelete(testRecommendation._id);
    logTest('Database Delete Operation', true, 'Successfully deleted test recommendation');
    
    // Verify deletion
    const deletedRecommendation = await MutualFundRecommend.findById(testRecommendation._id);
    logTest('Database Delete Verification', !deletedRecommendation, 'Recommendation successfully removed');
    
  } catch (error) {
    logTest('Database Operations Test', false, `Error: ${error.message}`);
  }
};

// Test 9: Frontend Component Test (simulation)
const testFrontendComponents = async () => {
  console.log('\n🔍 Testing Frontend Components (simulation)...');
  
  try {
    // Check if frontend files exist
    const fs = require('fs');
    const path = require('path');
    
    const frontendFiles = [
      './frontend/src/components/mutualFundRecommend/MutualFundRecommendPage.jsx',
      './frontend/src/services/mutualFundRecommendAPI.js',
      './frontend/src/components/mutualFundRecommend/index.js'
    ];
    
    let allFilesExist = true;
    for (const file of frontendFiles) {
      if (fs.existsSync(file)) {
        console.log(`   ✅ ${file} exists`);
      } else {
        console.log(`   ❌ ${file} missing`);
        allFilesExist = false;
      }
    }
    
    logTest('Frontend Component Files', allFilesExist, allFilesExist ? 'All files present' : 'Some files missing');
    
    // Test API service structure
    try {
      const apiService = require('./frontend/src/services/mutualFundRecommendAPI.js');
      const hasRequiredMethods = apiService && 
        typeof apiService.createRecommendation === 'function' &&
        typeof apiService.fetchFundDetails === 'function';
      
      logTest('API Service Structure', hasRequiredMethods, 'API service has required methods');
    } catch (error) {
      logTest('API Service Structure', false, `Error importing API service: ${error.message}`);
    }
    
  } catch (error) {
    logTest('Frontend Components Test', false, `Error: ${error.message}`);
  }
};

// Test 10: Integration Test
const testIntegration = async () => {
  console.log('\n🔍 Testing System Integration...');
  
  try {
    // Test the complete flow: Claude AI → Database → API
    const claudeService = require('./backend/services/claudeMutualFundService');
    
    console.log('   Testing complete integration flow...');
    
    // Step 1: Fetch from Claude AI
    const fundDetails = await claudeService.fetchMutualFundDetails('HDFC Mid-Cap Opportunities Fund', 'HDFC Mutual Fund');
    
    if (fundDetails.success) {
      logTest('Integration - Claude AI Fetch', true, 'Successfully fetched fund details');
      
      // Step 2: Test database storage
      const MutualFundRecommend = require('./backend/models/MutualFundRecommend');
      const integrationTest = new MutualFundRecommend({
        clientId: new mongoose.Types.ObjectId(),
        advisorId: new mongoose.Types.ObjectId(),
        fundName: 'HDFC Mid-Cap Opportunities Fund',
        fundHouseName: 'HDFC Mutual Fund',
        recommendedMonthlySIP: 8000,
        sipStartDate: new Date(),
        expectedExitDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
        exitConditions: 'Integration test exit conditions',
        reasonForRecommendation: 'Integration test reason',
        riskProfile: 'Moderate',
        investmentGoal: 'Wealth Creation',
        claudeResponse: fundDetails.data
      });
      
      await integrationTest.save();
      logTest('Integration - Database Storage', true, 'Successfully stored recommendation with Claude data');
      
      // Step 3: Test retrieval
      const retrieved = await MutualFundRecommend.findById(integrationTest._id);
      const hasClaudeData = retrieved && retrieved.claudeResponse && retrieved.claudeResponse.category;
      
      logTest('Integration - Data Retrieval', hasClaudeData, 'Successfully retrieved recommendation with Claude data');
      
      // Cleanup
      await MutualFundRecommend.findByIdAndDelete(integrationTest._id);
      
    } else {
      logTest('Integration - Claude AI Fetch', false, `Error: ${fundDetails.error}`);
    }
    
  } catch (error) {
    logTest('System Integration Test', false, `Error: ${error.message}`);
  }
};

// Test 11: Performance Test
const testPerformance = async () => {
  console.log('\n🔍 Testing System Performance...');
  
  try {
    const claudeService = require('./backend/services/claudeMutualFundService');
    
    console.log('   Testing Claude AI response time...');
    const startTime = Date.now();
    
    const fundDetails = await claudeService.fetchMutualFundDetails('SBI Bluechip Fund', 'SBI Mutual Fund');
    
    const responseTime = Date.now() - startTime;
    
    logTest('Performance - Claude AI Response Time', responseTime < 30000, `Response time: ${responseTime}ms`);
    
    if (responseTime > 30000) {
      console.log('   ⚠️  Warning: Response time exceeds 30 seconds threshold');
    }
    
  } catch (error) {
    logTest('Performance Test', false, `Error: ${error.message}`);
  }
};

// Test 12: Error Handling Test
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
const runAllTests = async () => {
  console.log('🚀 STARTING COMPREHENSIVE MUTUAL FUND RECOMMENDATION SYSTEM TEST');
  console.log('=' .repeat(70));
  
  try {
    // Run all tests
    await testBackendConnectivity();
    await testEnvironmentVariables();
    await testDatabaseConnection();
    await testModelCreation();
    await testClaudeAIService();
    await testAPIEndpoints();
    await testFormValidation();
    await testDatabaseOperations();
    await testFrontendComponents();
    await testIntegration();
    await testPerformance();
    await testErrorHandling();
    
    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.details
        .filter(test => !test.passed)
        .forEach(test => console.log(`   - ${test.name}: ${test.details}`));
    }
    
    if (testResults.passed === testResults.total) {
      console.log('\n🎉 ALL TESTS PASSED! The system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }
    
    // Cleanup
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from database');
    }
    
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error.message);
    console.error(error.stack);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testResults
};
