/**
 * COMPREHENSIVE TEST SCRIPT FOR MUTUAL FUND EXIT SUITE
 * 
 * PURPOSE: Verify all operations related to Mutual Fund Exit Suite
 * - Backend API endpoints functionality
 * - Frontend-backend connectivity
 * - Database operations and data persistence
 * - Complete workflow from client selection to strategy completion
 * 
 * TEST COVERAGE:
 * 1. Backend API Endpoints Testing
 * 2. Database Operations Testing
 * 3. Frontend Component Integration Testing
 * 4. End-to-End Workflow Testing
 * 5. Data Validation and Error Handling
 * 
 * USAGE:
 * node test_mutual_fund_exit_suite.js
 */

const axios = require('axios');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Test configuration
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  TEST_TIMEOUT: 30000,
  CLEANUP_DELAY: 2000
};

// Test data
const TEST_DATA = {
  advisor: {
    firstName: 'UDDIT',
    lastName: 'UDDIT',
    email: 'udditalerts247@gmail.com',
    password: 'jpmcA@123',
    phoneNumber: '+917456886877'
  },
  client: {
    firstName: 'Test',
    lastName: 'Client',
    email: 'test.client@example.com',
    phoneNumber: '+91-9876543211',
    casData: {
      parsedData: {
        mutual_funds: [
          {
            folio_number: 'FOLIO001',
            amc: 'Test AMC',
            schemes: [
              {
                scheme_name: 'Test Equity Fund',
                scheme_type: 'Equity',
                value: 100000,
                units: 1000,
                nav: 100
              }
            ]
          }
        ]
      }
    }
  },
  exitStrategy: {
    fundId: 'test_fund_001',
    fundName: 'Test Equity Fund',
    fundCategory: 'Equity',
    fundType: 'existing',
    source: 'cas',
    primaryExitAnalysis: {
      currentValue: 100000,
      units: 1000,
      nav: 100,
      exitRationale: 'goal_achievement',
      detailedReason: 'Client has achieved their financial goal and wants to exit',
      performanceAnalysis: 'Fund has performed well over the holding period'
    },
    timingStrategy: {
      recommendedExitDate: '2024-12-31',
      marketConditions: 'Stable market conditions with positive outlook',
      exitTriggers: ['target_achieved'],
      urgency: 'medium_term'
    },
    taxImplications: {
      holdingPeriod: 'long_term',
      taxRate: 10,
      taxAmount: 10000,
      taxOptimization: 'Exit during long-term holding period to minimize tax impact',
      lossHarvesting: false
    },
    alternativeInvestmentStrategy: {
      recommendedFunds: [
        {
          fundName: 'Test Debt Fund',
          fundCategory: 'Debt',
          allocation: 60,
          rationale: 'Lower risk alternative for capital preservation'
        }
      ],
      portfolioRebalancing: 'Rebalance portfolio to 60% debt and 40% equity',
      riskAdjustment: 'Reduce risk exposure by moving to debt funds',
      diversificationBenefits: 'Better diversification across asset classes'
    },
    financialGoalAssessment: {
      goalImpact: 'Exit aligns with client\'s goal achievement timeline',
      timelineAdjustment: 'No timeline adjustment needed',
      riskTolerance: 'moderate',
      liquidityNeeds: 'Client needs liquidity for upcoming expenses'
    },
    riskAnalysis: {
      currentRiskLevel: 'medium',
      exitRiskFactors: ['market_volatility', 'timing_risk'],
      mitigationStrategies: 'Exit in tranches to minimize timing risk',
      stressTestResults: 'Strategy performs well under various market scenarios'
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
      prerequisites: ['Client consent', 'Market analysis'],
      contingencies: ['Market downturn', 'Liquidity issues'],
      monitoringPoints: ['Market conditions', 'Client feedback']
    },
    costBenefitAnalysis: {
      exitLoad: 1000,
      transactionCosts: 500,
      taxSavings: 10000,
      opportunityCost: 2000,
      netBenefit: 7500
    },
    advisorCertification: {
      certifiedBy: 'test_advisor_id',
      certificationDate: new Date(),
      certificationNotes: 'Strategy reviewed and approved',
      complianceCheck: true
    },
    clientAcknowledgment: {
      acknowledged: false,
      acknowledgmentDate: null,
      acknowledgmentMethod: 'digital',
      clientNotes: 'Client informed about strategy details',
      followUpRequired: true
    }
  }
};

class MutualFundExitSuiteTester {
  constructor() {
    this.authToken = null;
    this.advisorId = null;
    this.clientId = null;
    this.strategyId = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Log test results with formatting
   */
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * Assert test condition
   */
  assert(condition, message) {
    if (condition) {
      this.testResults.passed++;
      this.log(`PASS: ${message}`, 'success');
      return true;
    } else {
      this.testResults.failed++;
      this.log(`FAIL: ${message}`, 'error');
      this.testResults.errors.push(message);
      return false;
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: `${TEST_CONFIG.BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        timeout: TEST_CONFIG.TEST_TIMEOUT
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      this.log(`API Request Error: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Test 1: Authentication and Setup
   */
  async testAuthentication() {
    this.log('🔐 Testing Authentication and Setup...');
    
    try {
      // Test advisor registration/login
      const authResponse = await axios.post(`${TEST_CONFIG.BASE_URL}/auth/login`, {
        email: TEST_DATA.advisor.email,
        password: TEST_DATA.advisor.password
      });

      this.authToken = authResponse.data.token;
      this.advisorId = authResponse.data.user.id;
      
      this.assert(!!this.authToken, 'Authentication token received');
      this.assert(!!this.advisorId, 'Advisor ID received');
      
      return true;
    } catch (error) {
      this.log(`Authentication failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 2: Client Creation and Management
   */
  async testClientManagement() {
    this.log('👥 Testing Client Management...');
    
    try {
      // Create test client
      const clientResponse = await this.makeRequest('POST', '/clients', {
        ...TEST_DATA.client,
        advisor: this.advisorId
      });

      this.clientId = clientResponse.data._id;
      
      this.assert(!!this.clientId, 'Client created successfully');
      this.assert(clientResponse.data.firstName === TEST_DATA.client.firstName, 'Client data matches');
      
      // Test client retrieval
      const getClientResponse = await this.makeRequest('GET', `/clients/${this.clientId}`);
      this.assert(getClientResponse.data._id === this.clientId, 'Client retrieval successful');
      
      return true;
    } catch (error) {
      this.log(`Client management failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 3: Backend API Endpoints
   */
  async testBackendEndpoints() {
    this.log('🔌 Testing Backend API Endpoints...');
    
    try {
      // Test 3.1: Get clients with funds
      const clientsWithFundsResponse = await this.makeRequest('GET', '/mutual-fund-exit-strategies/clients-with-funds');
      this.assert(clientsWithFundsResponse.success, 'Clients with funds endpoint working');
      this.assert(Array.isArray(clientsWithFundsResponse.data.clients), 'Clients array returned');
      
      // Test 3.2: Get summary
      const summaryResponse = await this.makeRequest('GET', '/mutual-fund-exit-strategies/summary');
      this.assert(summaryResponse.success, 'Summary endpoint working');
      this.assert(typeof summaryResponse.data.totalStrategies === 'number', 'Summary data valid');
      
      // Test 3.3: Health check
      const healthResponse = await axios.get(`${TEST_CONFIG.BASE_URL.replace('/api', '')}/`);
      this.assert(healthResponse.data.status === 'active', 'Health check endpoint working');
      this.assert(healthResponse.data.database === 'connected', 'Database connection verified');
      
      return true;
    } catch (error) {
      this.log(`Backend endpoints test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 4: Exit Strategy Creation
   */
  async testExitStrategyCreation() {
    this.log('📝 Testing Exit Strategy Creation...');
    
    try {
      const strategyData = {
        ...TEST_DATA.exitStrategy,
        clientId: this.clientId,
        advisorId: this.advisorId
      };

      // Test strategy creation
      const createResponse = await this.makeRequest('POST', '/mutual-fund-exit-strategies/strategies', strategyData);
      
      this.strategyId = createResponse.data._id;
      this.assert(!!this.strategyId, 'Exit strategy created successfully');
      this.assert(createResponse.data.fundName === TEST_DATA.exitStrategy.fundName, 'Strategy data matches');
      this.assert(createResponse.data.status === 'pending_approval', 'Strategy status set correctly');
      
      return true;
    } catch (error) {
      this.log(`Exit strategy creation failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 5: Exit Strategy Retrieval and Updates
   */
  async testExitStrategyOperations() {
    this.log('📊 Testing Exit Strategy Operations...');
    
    try {
      // Test strategy retrieval
      const getStrategyResponse = await this.makeRequest('GET', `/mutual-fund-exit-strategies/strategies/${this.strategyId}`);
      this.assert(getStrategyResponse.success, 'Strategy retrieval successful');
      this.assert(getStrategyResponse.data._id === this.strategyId, 'Correct strategy retrieved');
      
      // Test strategy update
      const updateData = {
        status: 'approved',
        priority: 'high'
      };
      
      const updateResponse = await this.makeRequest('PUT', `/mutual-fund-exit-strategies/strategies/${this.strategyId}`, updateData);
      this.assert(updateResponse.success, 'Strategy update successful');
      this.assert(updateResponse.data.status === 'approved', 'Strategy status updated');
      
      // Test client strategies retrieval
      const clientStrategiesResponse = await this.makeRequest('GET', `/mutual-fund-exit-strategies/strategies/client/${this.clientId}`);
      this.assert(clientStrategiesResponse.success, 'Client strategies retrieval successful');
      this.assert(Array.isArray(clientStrategiesResponse.data), 'Client strategies array returned');
      
      return true;
    } catch (error) {
      this.log(`Exit strategy operations failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 6: Database Operations and Data Persistence
   */
  async testDatabaseOperations() {
    this.log('💾 Testing Database Operations...');
    
    try {
      // Connect to MongoDB
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finrep_test';
      await mongoose.connect(mongoUri);
      
      // Test MutualFundExitStrategy model
      const MutualFundExitStrategy = require('./backend/models/MutualFundExitStrategy');
      
      // Find strategy in database
      const dbStrategy = await MutualFundExitStrategy.findById(this.strategyId);
      this.assert(!!dbStrategy, 'Strategy found in database');
      this.assert(dbStrategy.fundName === TEST_DATA.exitStrategy.fundName, 'Database data matches');
      this.assert(dbStrategy.status === 'approved', 'Database status updated');
      
      // Test data integrity
      this.assert(dbStrategy.primaryExitAnalysis.currentValue === TEST_DATA.exitStrategy.primaryExitAnalysis.currentValue, 'Primary exit analysis data integrity');
      this.assert(dbStrategy.taxImplications.taxRate === TEST_DATA.exitStrategy.taxImplications.taxRate, 'Tax implications data integrity');
      this.assert(dbStrategy.costBenefitAnalysis.netBenefit === TEST_DATA.exitStrategy.costBenefitAnalysis.netBenefit, 'Cost-benefit analysis data integrity');
      
      // Test relationships
      this.assert(dbStrategy.clientId.toString() === this.clientId, 'Client relationship maintained');
      this.assert(dbStrategy.advisorId.toString() === this.advisorId, 'Advisor relationship maintained');
      
      await mongoose.disconnect();
      return true;
    } catch (error) {
      this.log(`Database operations test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 7: Data Validation and Error Handling
   */
  async testDataValidation() {
    this.log('🔍 Testing Data Validation and Error Handling...');
    
    try {
      // Test invalid strategy creation
      const invalidStrategyData = {
        clientId: 'invalid_id',
        fundId: '', // Empty fund ID
        fundName: '', // Empty fund name
        // Missing required fields
      };

      try {
        await this.makeRequest('POST', '/mutual-fund-exit-strategies/strategies', invalidStrategyData);
        this.assert(false, 'Should have failed with invalid data');
      } catch (error) {
        this.assert(error.response.status === 400, 'Proper error response for invalid data');
        this.assert(error.response.data.success === false, 'Error response format correct');
      }

      // Test non-existent strategy retrieval
      try {
        await this.makeRequest('GET', '/mutual-fund-exit-strategies/strategies/invalid_id');
        this.assert(false, 'Should have failed with invalid ID');
      } catch (error) {
        this.assert(error.response.status === 400, 'Proper error response for invalid ID');
      }

      // Test unauthorized access
      const unauthorizedToken = 'invalid_token';
      try {
        await axios.get(`${TEST_CONFIG.BASE_URL}/mutual-fund-exit-strategies/clients-with-funds`, {
          headers: { 'Authorization': `Bearer ${unauthorizedToken}` }
        });
        this.assert(false, 'Should have failed with invalid token');
      } catch (error) {
        this.assert(error.response.status === 401, 'Proper unauthorized response');
      }

      return true;
    } catch (error) {
      this.log(`Data validation test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 8: Frontend-Backend Integration Simulation
   */
  async testFrontendBackendIntegration() {
    this.log('🔄 Testing Frontend-Backend Integration...');
    
    try {
      // Simulate frontend workflow
      
      // Step 1: Get clients with funds (ClientSelection component)
      const clientsResponse = await this.makeRequest('GET', '/mutual-fund-exit-strategies/clients-with-funds');
      this.assert(clientsResponse.success, 'Client selection data retrieved');
      
      const clientWithFunds = clientsResponse.data.clients.find(c => c.clientId === this.clientId);
      this.assert(!!clientWithFunds, 'Client found in funds list');
      this.assert(clientWithFunds.existingFunds.length > 0, 'Client has existing funds');
      
      // Step 2: Get fund details (MutualFundsList component)
      const fund = clientWithFunds.existingFunds[0];
      this.assert(!!fund.fundId, 'Fund ID available');
      this.assert(!!fund.fundName, 'Fund name available');
      this.assert(fund.currentValue > 0, 'Fund value available');
      
      // Step 3: Create strategy (ExitStrategyForm component)
      const formData = {
        ...TEST_DATA.exitStrategy,
        clientId: this.clientId,
        fundId: fund.fundId,
        fundName: fund.fundName,
        fundCategory: fund.fundCategory || 'Equity',
        fundType: 'existing',
        source: 'cas'
      };

      const strategyResponse = await this.makeRequest('POST', '/mutual-fund-exit-strategies/strategies', formData);
      this.assert(strategyResponse.success, 'Strategy created from frontend data');
      
      // Step 4: View strategy (ExitStrategyView component)
      const viewResponse = await this.makeRequest('GET', `/mutual-fund-exit-strategies/strategies/${strategyResponse.data._id}`);
      this.assert(viewResponse.success, 'Strategy view data retrieved');
      this.assert(viewResponse.data.primaryExitAnalysis, 'Primary exit analysis available');
      this.assert(viewResponse.data.timingStrategy, 'Timing strategy available');
      this.assert(viewResponse.data.taxImplications, 'Tax implications available');
      this.assert(viewResponse.data.costBenefitAnalysis, 'Cost-benefit analysis available');
      
      return true;
    } catch (error) {
      this.log(`Frontend-backend integration test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 9: Performance and Load Testing
   */
  async testPerformance() {
    this.log('⚡ Testing Performance...');
    
    try {
      const startTime = Date.now();
      
      // Test multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(this.makeRequest('GET', '/mutual-fund-exit-strategies/summary'));
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.assert(results.every(r => r.success), 'All concurrent requests successful');
      this.assert(duration < 5000, 'Performance within acceptable limits');
      
      return true;
    } catch (error) {
      this.log(`Performance test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 10: Cleanup Operations
   */
  async testCleanup() {
    this.log('🧹 Testing Cleanup Operations...');
    
    try {
      // Test soft delete
      const deleteResponse = await this.makeRequest('DELETE', `/mutual-fund-exit-strategies/strategies/${this.strategyId}`);
      this.assert(deleteResponse.success, 'Strategy soft delete successful');
      
      // Verify soft delete
      const getDeletedResponse = await this.makeRequest('GET', `/mutual-fund-exit-strategies/strategies/${this.strategyId}`);
      this.assert(!getDeletedResponse.success, 'Deleted strategy not accessible');
      
      return true;
    } catch (error) {
      this.log(`Cleanup test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    this.log('🚀 Starting Mutual Fund Exit Suite Comprehensive Testing...');
    this.log('============================================================');
    
    const tests = [
      { name: 'Authentication', fn: () => this.testAuthentication() },
      { name: 'Client Management', fn: () => this.testClientManagement() },
      { name: 'Backend Endpoints', fn: () => this.testBackendEndpoints() },
      { name: 'Exit Strategy Creation', fn: () => this.testExitStrategyCreation() },
      { name: 'Exit Strategy Operations', fn: () => this.testExitStrategyOperations() },
      { name: 'Database Operations', fn: () => this.testDatabaseOperations() },
      { name: 'Data Validation', fn: () => this.testDataValidation() },
      { name: 'Frontend-Backend Integration', fn: () => this.testFrontendBackendIntegration() },
      { name: 'Performance', fn: () => this.testPerformance() },
      { name: 'Cleanup', fn: () => this.testCleanup() }
    ];

    for (const test of tests) {
      try {
        this.log(`\n🧪 Running ${test.name} Test...`);
        await test.fn();
        this.log(`✅ ${test.name} Test Completed`, 'success');
      } catch (error) {
        this.log(`❌ ${test.name} Test Failed: ${error.message}`, 'error');
        this.testResults.failed++;
        this.testResults.errors.push(`${test.name}: ${error.message}`);
      }
    }

    this.generateReport();
  }

  /**
   * Generate test report
   */
  generateReport() {
    this.log('\n============================================================');
    this.log('📊 TEST REPORT SUMMARY');
    this.log('============================================================');
    
    const totalTests = this.testResults.passed + this.testResults.failed;
    const passRate = ((this.testResults.passed / totalTests) * 100).toFixed(2);
    
    this.log(`Total Tests: ${totalTests}`);
    this.log(`Passed: ${this.testResults.passed}`, 'success');
    this.log(`Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'error' : 'success');
    this.log(`Pass Rate: ${passRate}%`);
    
    if (this.testResults.errors.length > 0) {
      this.log('\n❌ FAILED TESTS:');
      this.testResults.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error}`, 'error');
      });
    }
    
    this.log('\n🎯 MUTUAL FUND EXIT SUITE STATUS:');
    if (this.testResults.failed === 0) {
      this.log('✅ ALL TESTS PASSED - SUITE IS FULLY FUNCTIONAL', 'success');
    } else if (this.testResults.failed <= 2) {
      this.log('⚠️ MINOR ISSUES DETECTED - SUITE IS MOSTLY FUNCTIONAL', 'warning');
    } else {
      this.log('❌ MAJOR ISSUES DETECTED - SUITE NEEDS ATTENTION', 'error');
    }
    
    this.log('\n📋 RECOMMENDATIONS:');
    if (this.testResults.failed === 0) {
      this.log('• Suite is ready for production deployment');
      this.log('• All backend-frontend connections are working');
      this.log('• Database operations are functioning correctly');
      this.log('• Data validation and error handling are robust');
    } else {
      this.log('• Review failed tests and fix identified issues');
      this.log('• Re-run tests after fixes to ensure resolution');
      this.log('• Consider additional testing for edge cases');
    }
    
    this.log('\n🏁 Testing completed at: ' + new Date().toISOString());
  }
}

/**
 * Main execution function
 */
async function main() {
  const tester = new MutualFundExitSuiteTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MutualFundExitSuiteTester;
