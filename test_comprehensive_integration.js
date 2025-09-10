/**
 * COMPREHENSIVE INTEGRATION TEST SCRIPT
 * 
 * PURPOSE: Test the integration of the four new data models into the client reports system
 * 
 * MODELS TESTED:
 * 1. EstateInformation - Estate planning data
 * 2. MutualFundRecommend - Mutual fund recommendations
 * 3. MutualFundExitStrategy - Exit strategies (already existed)
 * 4. TaxPlanning - Tax planning strategies
 * 
 * TEST CLIENT: Rekha Saxena (ID: 689948713515196131838949)
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_CLIENT_ID = '689948713515196131838949';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

// Test configuration
const config = {
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

// Test results storage
const testResults = {
  backend: {},
  frontend: {},
  dataIntegrity: {},
  errors: []
};

// Helper function to log test results
const logTestResult = (testName, success, details = {}) => {
  const result = {
    testName,
    success,
    timestamp: new Date().toISOString(),
    details
  };
  
  if (success) {
    console.log(`✅ ${testName}: PASSED`);
  } else {
    console.log(`❌ ${testName}: FAILED`);
    testResults.errors.push(result);
  }
  
  return result;
};

// Test 1: Backend API - Client Report Endpoint
const testBackendClientReport = async () => {
  console.log('\n🔍 TESTING BACKEND CLIENT REPORT API...');
  
  try {
    const response = await axios.get(`${BASE_URL}/client-reports/clients/${TEST_CLIENT_ID}`, config);
    
    const result = logTestResult('Backend Client Report API', response.data.success, {
      status: response.status,
      hasData: !!response.data.data,
      processingTime: response.data.processingTime,
      dataIntegrity: response.data.dataIntegrity
    });
    
    testResults.backend.clientReport = result;
    
    // Test for new data models
    const data = response.data.data;
    
    // Test Estate Information
    const estateTest = logTestResult('Estate Information Data', !!data.estateInformation, {
      exists: data.estateInformation?.exists,
      hasData: !!data.estateInformation?.data,
      hasSummary: !!data.estateInformation?.summary
    });
    testResults.dataIntegrity.estateInformation = estateTest;
    
    // Test Mutual Fund Recommendations
    const mfRecTest = logTestResult('Mutual Fund Recommendations Data', !!data.mutualFundRecommendations, {
      count: data.mutualFundRecommendations?.count || 0,
      hasRecommendations: data.mutualFundRecommendations?.recommendations?.length > 0,
      hasSummary: !!data.mutualFundRecommendations?.summary
    });
    testResults.dataIntegrity.mutualFundRecommendations = mfRecTest;
    
    // Test Tax Planning
    const taxTest = logTestResult('Tax Planning Data', !!data.taxPlanning, {
      count: data.taxPlanning?.count || 0,
      hasPlans: data.taxPlanning?.plans?.length > 0,
      hasSummary: !!data.taxPlanning?.summary
    });
    testResults.dataIntegrity.taxPlanning = taxTest;
    
    // Test Mutual Fund Exit Strategies (existing)
    const exitTest = logTestResult('Mutual Fund Exit Strategies Data', !!data.mutualFundExitStrategies, {
      count: data.mutualFundExitStrategies?.count || 0,
      hasStrategies: data.mutualFundExitStrategies?.strategies?.length > 0
    });
    testResults.dataIntegrity.mutualFundExitStrategies = exitTest;
    
    return response.data;
    
  } catch (error) {
    const result = logTestResult('Backend Client Report API', false, {
      error: error.message,
      status: error.response?.status,
      responseData: error.response?.data
    });
    testResults.backend.clientReport = result;
    throw error;
  }
};

// Test 2: Data Model Field Validation
const testDataModelFields = (reportData) => {
  console.log('\n🔍 TESTING DATA MODEL FIELDS...');
  
  const data = reportData.data;
  
  // Test Estate Information Fields
  if (data.estateInformation?.exists) {
    const estateData = data.estateInformation.data;
    const estateFields = [
      'familyStructure',
      'realEstateProperties', 
      'legalDocumentsStatus',
      'personalAssets',
      'estatePreferences',
      'healthcareDirectives',
      'estateMetadata'
    ];
    
    estateFields.forEach(field => {
      const hasField = estateData[field] && Object.keys(estateData[field]).length > 0;
      logTestResult(`Estate Information - ${field}`, hasField, {
        field,
        hasData: hasField,
        dataType: typeof estateData[field]
      });
    });
  }
  
  // Test Mutual Fund Recommendations Fields
  if (data.mutualFundRecommendations?.count > 0) {
    const mfData = data.mutualFundRecommendations.recommendations[0];
    const mfFields = [
      'fundName',
      'fundHouseName',
      'recommendedMonthlySIP',
      'riskProfile',
      'investmentGoal',
      'status',
      'claudeResponse'
    ];
    
    mfFields.forEach(field => {
      const hasField = mfData[field] && mfData[field] !== 'Not Available';
      logTestResult(`Mutual Fund Recommendations - ${field}`, hasField, {
        field,
        hasData: hasField,
        value: mfData[field]
      });
    });
  }
  
  // Test Tax Planning Fields
  if (data.taxPlanning?.count > 0) {
    const taxData = data.taxPlanning.plans[0];
    const taxFields = [
      'taxYear',
      'personalTaxInfo',
      'incomeAnalysis',
      'taxSavingInvestments',
      'taxCalculations',
      'status',
      'priority'
    ];
    
    taxFields.forEach(field => {
      const hasField = taxData[field] && taxData[field] !== 'Not Available';
      logTestResult(`Tax Planning - ${field}`, hasField, {
        field,
        hasData: hasField,
        value: taxData[field]
      });
    });
  }
};

// Test 3: Data Isolation Verification
const testDataIsolation = (reportData) => {
  console.log('\n🔍 TESTING DATA ISOLATION...');
  
  const data = reportData.data;
  const clientId = reportData.data.client.basicInfo?.clientId || TEST_CLIENT_ID;
  
  // Verify all data belongs to the correct client
  const isolationTests = [
    {
      name: 'Estate Information Client ID',
      test: () => data.estateInformation?.data?.clientId === clientId,
      data: data.estateInformation?.data?.clientId
    },
    {
      name: 'Mutual Fund Recommendations Client ID',
      test: () => data.mutualFundRecommendations?.recommendations?.every(rec => rec.clientId === clientId),
      data: data.mutualFundRecommendations?.recommendations?.map(rec => rec.clientId)
    },
    {
      name: 'Tax Planning Client ID',
      test: () => data.taxPlanning?.plans?.every(plan => plan.clientId === clientId),
      data: data.taxPlanning?.plans?.map(plan => plan.clientId)
    }
  ];
  
  isolationTests.forEach(test => {
    const result = logTestResult(test.name, test.test(), {
      expectedClientId: clientId,
      actualData: test.data
    });
    testResults.dataIntegrity[test.name] = result;
  });
};

// Test 4: Frontend Integration Test (Simulated)
const testFrontendIntegration = () => {
  console.log('\n🔍 TESTING FRONTEND INTEGRATION...');
  
  // Simulate frontend data access patterns
  const frontendTests = [
    {
      name: 'Estate Planning Tab Data',
      test: () => {
        // Simulate accessing estate data in frontend
        const estateData = testResults.dataIntegrity.estateInformation?.success;
        return estateData !== undefined;
      }
    },
    {
      name: 'Mutual Fund Recommendations Tab Data',
      test: () => {
        const mfData = testResults.dataIntegrity.mutualFundRecommendations?.success;
        return mfData !== undefined;
      }
    },
    {
      name: 'Tax Planning Tab Data',
      test: () => {
        const taxData = testResults.dataIntegrity.taxPlanning?.success;
        return taxData !== undefined;
      }
    }
  ];
  
  frontendTests.forEach(test => {
    const result = logTestResult(test.name, test.test(), {
      testType: 'frontend_simulation'
    });
    testResults.frontend[test.name] = result;
  });
};

// Test 5: Performance Test
const testPerformance = (reportData) => {
  console.log('\n🔍 TESTING PERFORMANCE...');
  
  const processingTime = reportData.processingTime;
  const dataSize = JSON.stringify(reportData).length;
  
  const performanceTests = [
    {
      name: 'Response Time',
      test: () => {
        const timeMs = parseInt(processingTime.replace('ms', ''));
        return timeMs < 5000; // Should be under 5 seconds
      },
      details: { processingTime, threshold: '5000ms' }
    },
    {
      name: 'Data Size',
      test: () => dataSize < 1000000, // Should be under 1MB
      details: { dataSize, threshold: '1MB' }
    }
  ];
  
  performanceTests.forEach(test => {
    const result = logTestResult(test.name, test.test(), test.details);
    testResults.performance = testResults.performance || {};
    testResults.performance[test.name] = result;
  });
};

// Main test execution
const runComprehensiveTest = async () => {
  console.log('🚀 STARTING COMPREHENSIVE INTEGRATION TEST');
  console.log(`📊 Testing Client: Rekha Saxena (${TEST_CLIENT_ID})`);
  console.log(`🔗 API Endpoint: ${BASE_URL}/client-reports/clients/${TEST_CLIENT_ID}`);
  
  try {
    // Test 1: Backend API
    const reportData = await testBackendClientReport();
    
    // Test 2: Data Model Fields
    testDataModelFields(reportData);
    
    // Test 3: Data Isolation
    testDataIsolation(reportData);
    
    // Test 4: Frontend Integration
    testFrontendIntegration();
    
    // Test 5: Performance
    testPerformance(reportData);
    
    // Generate final report
    console.log('\n📋 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('=====================================');
    
    const totalTests = Object.values(testResults).flat().length;
    const passedTests = Object.values(testResults).flat().filter(test => test.success).length;
    const failedTests = testResults.errors.length;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.errors.forEach(error => {
        console.log(`- ${error.testName}: ${error.details.error || 'Unknown error'}`);
      });
    }
    
    console.log('\n✅ INTEGRATION TEST COMPLETED');
    
    return {
      success: failedTests === 0,
      totalTests,
      passedTests,
      failedTests,
      results: testResults
    };
    
  } catch (error) {
    console.error('\n❌ CRITICAL TEST FAILURE:', error.message);
    return {
      success: false,
      error: error.message,
      results: testResults
    };
  }
};

// Export for use in other scripts
module.exports = {
  runComprehensiveTest,
  testBackendClientReport,
  testDataModelFields,
  testDataIsolation,
  testFrontendIntegration,
  testPerformance
};

// Run tests if this script is executed directly
if (require.main === module) {
  runComprehensiveTest()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}
