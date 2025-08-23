/**
 * FILE LOCATION: test-mutual-fund-exit.js
 * 
 * PURPOSE: Integration test script for the Mutual Fund Exit Suite API
 * 
 * FUNCTIONALITY:
 * - Tests all major API endpoints for the mutual fund exit strategies
 * - Validates authentication and authorization
 * - Tests data creation, retrieval, and updates
 * - Verifies error handling and validation
 * - Provides comprehensive testing coverage
 * 
 * TEST COVERAGE:
 * - Authentication and authorization
 * - Client data retrieval
 * - Strategy creation and management
 * - Data validation and error handling
 * - API response format validation
 * 
 * USAGE:
 * - Run with Node.js: node test-mutual-fund-exit.js
 * - Requires valid JWT token for authenticated endpoints
 * - Tests against local development server by default
 * 
 * DEPENDENCIES:
 * - Node.js with fetch support (v18+)
 * - Valid JWT authentication token
 * - Running backend server
 * - MongoDB connection
 */

const BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'your_jwt_token_here'; // Replace with actual token

// Test data
const testStrategyData = {
  clientId: 'test_client_id',
  fundId: 'TEST_FUND_001',
  fundName: 'Test Equity Fund',
  fundCategory: 'Equity',
  fundType: 'existing',
  source: 'cas',
  primaryExitAnalysis: {
    currentValue: 100000,
    units: 1000,
    nav: 100,
    exitRationale: 'rebalancing',
    detailedReason: 'Portfolio rebalancing to reduce equity exposure',
    performanceAnalysis: 'Fund has performed well but portfolio needs rebalancing'
  },
  timingStrategy: {
    recommendedExitDate: '2025-03-31',
    marketConditions: 'Stable market conditions suitable for exit',
    exitTriggers: ['target_achieved', 'rebalancing'],
    urgency: 'medium_term'
  },
  taxImplications: {
    holdingPeriod: 'long_term',
    taxRate: 10,
    taxAmount: 10000,
    taxOptimization: 'Long-term holding for lower tax rate',
    lossHarvesting: false
  },
  alternativeInvestmentStrategy: {
    recommendedFunds: [
      {
        fundName: 'Test Debt Fund',
        fundCategory: 'Debt',
        allocation: 60,
        rationale: 'Lower risk alternative for portfolio stability'
      }
    ],
    portfolioRebalancing: 'Shift from equity to debt for better risk-return profile',
    riskAdjustment: 'Reduce portfolio risk through debt allocation',
    diversificationBenefits: 'Better diversification across asset classes'
  },
  financialGoalAssessment: {
    goalImpact: 'Supports retirement planning goals',
    timelineAdjustment: 'No timeline changes required',
    riskTolerance: 'moderate',
    liquidityNeeds: 'Funds will be reinvested in debt instruments'
  },
  riskAnalysis: {
    currentRiskLevel: 'high',
    exitRiskFactors: ['market_volatility', 'timing_risk'],
    mitigationStrategies: 'Gradual exit over 3 months to minimize market impact',
    stressTestResults: 'Portfolio remains stable under various market scenarios'
  },
  executionActionPlan: {
    steps: [
      {
        stepNumber: 1,
        action: 'Review and approve exit strategy',
        timeline: 'Immediate',
        responsible: 'Advisor',
        status: 'pending'
      },
      {
        stepNumber: 2,
        action: 'Client acknowledgment',
        timeline: 'Within 24 hours',
        responsible: 'Client',
        status: 'pending'
      }
    ],
    prerequisites: ['Client approval', 'Market analysis'],
    contingencies: ['Market downturn', 'Client change of mind'],
    monitoringPoints: ['Market conditions', 'Client feedback']
  },
  costBenefitAnalysis: {
    exitLoad: 0,
    transactionCosts: 500,
    taxSavings: 5000,
    opportunityCost: 2000,
    netBenefit: 2500
  }
};

// Test utilities
const log = (message, data = null) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(message);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log(`${'='.repeat(50)}`);
};

const makeRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
};

// Test functions
const testHealthCheck = async () => {
  log('Testing Health Check Endpoint');
  
  const response = await makeRequest('/mutual-fund-exit-strategies/health');
  
  if (response.ok && response.data.success) {
    console.log('✅ Health check passed');
    console.log(`   Status: ${response.data.message}`);
    console.log(`   Version: ${response.data.version}`);
    console.log(`   Timestamp: ${response.data.timestamp}`);
  } else {
    console.log('❌ Health check failed');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
  }
};

const testGetClientsWithFunds = async () => {
  log('Testing Get Clients with Mutual Funds');
  
  const response = await makeRequest('/mutual-fund-exit-strategies/clients-with-funds');
  
  if (response.ok && response.data.success) {
    console.log('✅ Get clients with funds passed');
    console.log(`   Total clients: ${response.data.count}`);
    
    if (response.data.data && response.data.data.length > 0) {
      const client = response.data.data[0];
      console.log(`   Sample client: ${client.clientName}`);
      console.log(`   Total portfolio value: ₹${client.totalValue?.toLocaleString('en-IN')}`);
      console.log(`   Existing funds: ${client.existingFunds?.length || 0}`);
      console.log(`   Recommended funds: ${client.recommendedFunds?.length || 0}`);
    }
  } else {
    console.log('❌ Get clients with funds failed');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
  }
};

const testCreateExitStrategy = async () => {
  log('Testing Create Exit Strategy');
  
  const response = await makeRequest('/mutual-fund-exit-strategies/strategies', {
    method: 'POST',
    body: JSON.stringify(testStrategyData)
  });
  
  if (response.ok && response.data.success) {
    console.log('✅ Create exit strategy passed');
    console.log(`   Strategy ID: ${response.data.data._id}`);
    console.log(`   Status: ${response.data.data.status}`);
    console.log(`   Fund: ${response.data.data.fundName}`);
    
    // Store strategy ID for subsequent tests
    global.testStrategyId = response.data.data._id;
  } else {
    console.log('❌ Create exit strategy failed');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
  }
};

const testGetExitStrategy = async () => {
  if (!global.testStrategyId) {
    console.log('⚠️ Skipping get strategy test - no strategy ID available');
    return;
  }
  
  log('Testing Get Exit Strategy');
  
  const response = await makeRequest(`/mutual-fund-exit-strategies/strategies/${global.testStrategyId}`);
  
  if (response.ok && response.data.success) {
    console.log('✅ Get exit strategy passed');
    console.log(`   Strategy ID: ${response.data.data._id}`);
    console.log(`   Fund Name: ${response.data.data.fundName}`);
    console.log(`   Status: ${response.data.data.status}`);
    console.log(`   Version: ${response.data.data.version}`);
  } else {
    console.log('❌ Get exit strategy failed');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
  }
};

const testUpdateExitStrategy = async () => {
  if (!global.testStrategyId) {
    console.log('⚠️ Skipping update strategy test - no strategy ID available');
    return;
  }
  
  log('Testing Update Exit Strategy');
  
  const updateData = {
    priority: 'high',
    'timingStrategy.urgency': 'immediate',
    'costBenefitAnalysis.netBenefit': 5000
  };
  
  const response = await makeRequest(`/mutual-fund-exit-strategies/strategies/${global.testStrategyId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
  
  if (response.ok && response.data.success) {
    console.log('✅ Update exit strategy passed');
    console.log(`   Strategy ID: ${response.data.data._id}`);
    console.log(`   Updated priority: ${response.data.data.priority}`);
    console.log(`   Updated urgency: ${response.data.data.timingStrategy.urgency}`);
    console.log(`   Updated net benefit: ₹${response.data.data.costBenefitAnalysis.netBenefit}`);
  } else {
    console.log('❌ Update exit strategy failed');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
  }
};

const testGetStrategySummary = async () => {
  log('Testing Get Strategy Summary');
  
  const response = await makeRequest('/mutual-fund-exit-strategies/summary');
  
  if (response.ok && response.data.success) {
    console.log('✅ Get strategy summary passed');
    console.log(`   Total strategies: ${response.data.data.totalStrategies}`);
    console.log(`   Total value: ₹${response.data.data.totalValue?.toLocaleString('en-IN')}`);
    
    if (response.data.data.summary && response.data.data.summary.length > 0) {
      console.log('   Status breakdown:');
      response.data.data.summary.forEach(item => {
        console.log(`     ${item._id}: ${item.count} strategies, ₹${item.totalValue?.toLocaleString('en-IN')} total value`);
      });
    }
  } else {
    console.log('❌ Get strategy summary failed');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
  }
};

const testGetClientExitStrategies = async () => {
  log('Testing Get Client Exit Strategies');
  
  // Use the client ID from the test strategy
  if (!global.testStrategyId) {
    console.log('⚠️ Skipping client strategies test - no strategy ID available');
    return;
  }
  
  // First get the strategy to extract client ID
  const strategyResponse = await makeRequest(`/mutual-fund-exit-strategies/strategies/${global.testStrategyId}`);
  if (!strategyResponse.ok) {
    console.log('⚠️ Cannot get client ID for testing');
    return;
  }
  
  const clientId = strategyResponse.data.data.clientId;
  const response = await makeRequest(`/mutual-fund-exit-strategies/strategies/client/${clientId}`);
  
  if (response.ok && response.data.success) {
    console.log('✅ Get client exit strategies passed');
    console.log(`   Client ID: ${clientId}`);
    console.log(`   Total strategies: ${response.data.count}`);
    
    if (response.data.data && response.data.data.length > 0) {
      response.data.data.forEach(strategy => {
        console.log(`     - ${strategy.fundName}: ${strategy.status} (₹${strategy.primaryExitAnalysis?.currentValue?.toLocaleString('en-IN')})`);
      });
    }
  } else {
    console.log('❌ Get client exit strategies failed');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
  }
};

const testDeleteExitStrategy = async () => {
  if (!global.testStrategyId) {
    console.log('⚠️ Skipping delete strategy test - no strategy ID available');
    return;
  }
  
  log('Testing Delete Exit Strategy (Soft Delete)');
  
  const response = await makeRequest(`/mutual-fund-exit-strategies/strategies/${global.testStrategyId}`, {
    method: 'DELETE'
  });
  
  if (response.ok && response.data.success) {
    console.log('✅ Delete exit strategy passed');
    console.log(`   Strategy ID: ${global.testStrategyId}`);
    console.log(`   Message: ${response.data.message}`);
    
    // Verify it's soft deleted by trying to get it
    const getResponse = await makeRequest(`/mutual-fund-exit-strategies/strategies/${global.testStrategyId}`);
    if (getResponse.ok && !getResponse.data.data.isActive) {
      console.log('✅ Strategy successfully soft deleted');
    } else {
      console.log('⚠️ Strategy may not have been soft deleted properly');
    }
  } else {
    console.log('❌ Delete exit strategy failed');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
  }
};

const testErrorHandling = async () => {
  log('Testing Error Handling');
  
  // Test with invalid strategy ID
  const response = await makeRequest('/mutual-fund-exit-strategies/strategies/invalid_id');
  
  if (!response.ok) {
    console.log('✅ Error handling for invalid ID passed');
    console.log(`   Status: ${response.status}`);
    console.log(`   Error: ${response.data.message}`);
  } else {
    console.log('❌ Error handling for invalid ID failed');
  }
  
  // Test without authentication
  const noAuthResponse = await makeRequest('/mutual-fund-exit-strategies/clients-with-funds', {
    headers: {} // No Authorization header
  });
  
  if (!noAuthResponse.ok) {
    console.log('✅ Authentication error handling passed');
    console.log(`   Status: ${noAuthResponse.status}`);
  } else {
    console.log('❌ Authentication error handling failed');
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Mutual Fund Exit Suite API Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`🔑 Using token: ${AUTH_TOKEN ? 'Present' : 'Missing'}`);
  
  if (!AUTH_TOKEN || AUTH_TOKEN === 'your_jwt_token_here') {
    console.log('\n❌ ERROR: Please set a valid JWT token in AUTH_TOKEN variable');
    console.log('   You can get this token by logging into the application');
    return;
  }
  
  try {
    // Run tests in sequence
    await testHealthCheck();
    await testGetClientsWithFunds();
    await testCreateExitStrategy();
    await testGetExitStrategy();
    await testUpdateExitStrategy();
    await testGetStrategySummary();
    await testGetClientExitStrategies();
    await testDeleteExitStrategy();
    await testErrorHandling();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testHealthCheck,
  testGetClientsWithFunds,
  testCreateExitStrategy,
  testGetExitStrategy,
  testUpdateExitStrategy,
  testGetStrategySummary,
  testGetClientExitStrategies,
  testDeleteExitStrategy,
  testErrorHandling
};

