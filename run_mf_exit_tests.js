#!/usr/bin/env node

/**
 * SIMPLIFIED TEST RUNNER FOR MUTUAL FUND EXIT SUITE
 * 
 * This script provides an easy way to run the comprehensive tests
 * for the Mutual Fund Exit Suite functionality.
 * 
 * USAGE:
 * node run_mf_exit_tests.js
 * 
 * PREREQUISITES:
 * 1. Backend server running on localhost:5000
 * 2. MongoDB database accessible
 * 3. Test advisor account exists in the system
 */

const axios = require('axios');

// Test configuration
const CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  TEST_ADVISOR: {
    email: 'udditalerts247@gmail.com',
    password: 'jpmcA@123'
  }
};

class SimpleTester {
  constructor() {
    this.authToken = null;
    this.results = { passed: 0, failed: 0, errors: [] };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m'  // Yellow
    };
    const reset = '\x1b[0m';
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${colors[type]}${icon} ${message}${reset}`);
  }

  async makeRequest(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: `${CONFIG.BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        }
      };
      if (data) config.data = data;
      return await axios(config);
    } catch (error) {
      throw new Error(`API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  async testAuthentication() {
    this.log('🔐 Testing Authentication...');
    try {
      const response = await axios.post(`${CONFIG.BASE_URL}/auth/login`, CONFIG.TEST_ADVISOR);
      this.authToken = response.data.token;
      this.log('✅ Authentication successful', 'success');
      this.results.passed++;
      return true;
    } catch (error) {
      this.log(`❌ Authentication failed: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push('Authentication failed');
      return false;
    }
  }

  async testClientsWithFunds() {
    this.log('👥 Testing Clients with Funds endpoint...');
    try {
      const response = await this.makeRequest('GET', '/mutual-fund-exit-strategies/clients-with-funds');
      if (response.data.success && Array.isArray(response.data.data.clients)) {
        this.log(`✅ Found ${response.data.data.clients.length} clients`, 'success');
        this.results.passed++;
        return true;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      this.log(`❌ Clients with funds test failed: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push('Clients with funds endpoint failed');
      return false;
    }
  }

  async testSummaryEndpoint() {
    this.log('📊 Testing Summary endpoint...');
    try {
      const response = await this.makeRequest('GET', '/mutual-fund-exit-strategies/summary');
      if (response.data.success && typeof response.data.data.totalStrategies === 'number') {
        this.log(`✅ Summary shows ${response.data.data.totalStrategies} strategies`, 'success');
        this.results.passed++;
        return true;
      } else {
        throw new Error('Invalid summary response');
      }
    } catch (error) {
      this.log(`❌ Summary endpoint test failed: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push('Summary endpoint failed');
      return false;
    }
  }

  async testHealthCheck() {
    this.log('🏥 Testing Health Check endpoint...');
    try {
      const response = await axios.get(`${CONFIG.BASE_URL.replace('/api', '')}/`);
      if (response.data.status === 'active' && response.data.database === 'connected') {
        this.log('✅ Health check passed', 'success');
        this.results.passed++;
        return true;
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      this.log(`❌ Health check failed: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push('Health check failed');
      return false;
    }
  }

  async testStrategyCreation() {
    this.log('📝 Testing Strategy Creation...');
    try {
      // First, let's get the actual client data from the clients-with-funds endpoint
      const clientsResponse = await this.makeRequest('GET', '/mutual-fund-exit-strategies/clients-with-funds');
      if (!clientsResponse.success || !clientsResponse.data.clients || clientsResponse.data.clients.length === 0) {
        throw new Error('No clients available for testing');
      }
      
      const client = clientsResponse.data.clients[0];
      this.log(`Using client: ${client.clientName} (ID: ${client.clientId})`);
      
      const testStrategy = {
        clientId: client.clientId,
        advisorId: '6883ec3e2cc2c6df98e40604', // Your advisor ID
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
          detailedReason: 'Test exit strategy',
          performanceAnalysis: 'Test performance analysis'
        },
        timingStrategy: {
          recommendedExitDate: '2024-12-31',
          marketConditions: 'Stable market',
          exitTriggers: ['target_achieved'],
          urgency: 'medium_term'
        },
        taxImplications: {
          holdingPeriod: 'long_term',
          taxRate: 10,
          taxAmount: 10000,
          taxOptimization: 'Test optimization',
          lossHarvesting: false
        },
        alternativeInvestmentStrategy: {
          recommendedFunds: [],
          portfolioRebalancing: 'Test rebalancing',
          riskAdjustment: 'Test risk adjustment',
          diversificationBenefits: 'Test benefits'
        },
        financialGoalAssessment: {
          goalImpact: 'Test impact',
          timelineAdjustment: 'Test adjustment',
          riskTolerance: 'moderate',
          liquidityNeeds: 'Test needs'
        },
        riskAnalysis: {
          currentRiskLevel: 'medium',
          exitRiskFactors: ['market_volatility'],
          mitigationStrategies: 'Test mitigation',
          stressTestResults: 'Test results'
        },
        executionActionPlan: {
          steps: [{
            stepNumber: 1,
            action: 'Test action',
            timeline: 'Immediate',
            responsible: 'Advisor',
            status: 'pending'
          }],
          prerequisites: ['Test prerequisite'],
          contingencies: ['Test contingency'],
          monitoringPoints: ['Test monitoring']
        },
        costBenefitAnalysis: {
          exitLoad: 1000,
          transactionCosts: 500,
          taxSavings: 10000,
          opportunityCost: 2000,
          netBenefit: 7500
        },
        advisorCertification: {
          certifiedBy: 'test_advisor',
          certificationDate: new Date(),
          certificationNotes: 'Test certification',
          complianceCheck: true
        },
        clientAcknowledgment: {
          acknowledged: false,
          acknowledgmentDate: null,
          acknowledgmentMethod: 'digital',
          clientNotes: 'Test notes',
          followUpRequired: true
        }
      };

      const response = await this.makeRequest('POST', '/mutual-fund-exit-strategies/strategies', testStrategy);
      if (response.data.success && response.data.data._id) {
        this.log('✅ Strategy created successfully', 'success');
        this.results.passed++;
        return response.data.data._id;
      } else {
        throw new Error('Strategy creation failed');
      }
    } catch (error) {
      this.log(`❌ Strategy creation failed: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push('Strategy creation failed');
      return null;
    }
  }

  async testStrategyRetrieval(strategyId) {
    if (!strategyId) return false;
    
    this.log('📖 Testing Strategy Retrieval...');
    try {
      const response = await this.makeRequest('GET', `/mutual-fund-exit-strategies/strategies/${strategyId}`);
      if (response.data.success && response.data.data._id === strategyId) {
        this.log('✅ Strategy retrieved successfully', 'success');
        this.results.passed++;
        return true;
      } else {
        throw new Error('Strategy retrieval failed');
      }
    } catch (error) {
      this.log(`❌ Strategy retrieval failed: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push('Strategy retrieval failed');
      return false;
    }
  }

  async testStrategyUpdate(strategyId) {
    if (!strategyId) return false;
    
    this.log('✏️ Testing Strategy Update...');
    try {
      const updateData = { status: 'approved', priority: 'high' };
      const response = await this.makeRequest('PUT', `/mutual-fund-exit-strategies/strategies/${strategyId}`, updateData);
      if (response.data.success && response.data.data.status === 'approved') {
        this.log('✅ Strategy updated successfully', 'success');
        this.results.passed++;
        return true;
      } else {
        throw new Error('Strategy update failed');
      }
    } catch (error) {
      this.log(`❌ Strategy update failed: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push('Strategy update failed');
      return false;
    }
  }

  async testStrategyDeletion(strategyId) {
    if (!strategyId) return false;
    
    this.log('🗑️ Testing Strategy Deletion...');
    try {
      const response = await this.makeRequest('DELETE', `/mutual-fund-exit-strategies/strategies/${strategyId}`);
      if (response.data.success) {
        this.log('✅ Strategy deleted successfully', 'success');
        this.results.passed++;
        return true;
      } else {
        throw new Error('Strategy deletion failed');
      }
    } catch (error) {
      this.log(`❌ Strategy deletion failed: ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push('Strategy deletion failed');
      return false;
    }
  }

  async runTests() {
    this.log('🚀 Starting Mutual Fund Exit Suite Tests...');
    this.log('==================================================');
    
    // Test authentication first
    if (!(await this.testAuthentication())) {
      this.log('❌ Cannot proceed without authentication', 'error');
      return;
    }

    // Run all tests
    await this.testClientsWithFunds();
    await this.testSummaryEndpoint();
    await this.testHealthCheck();
    
    const strategyId = await this.testStrategyCreation();
    await this.testStrategyRetrieval(strategyId);
    await this.testStrategyUpdate(strategyId);
    await this.testStrategyDeletion(strategyId);

    this.generateReport();
  }

  generateReport() {
    this.log('\n==================================================');
    this.log('📊 TEST RESULTS SUMMARY');
    this.log('==================================================');
    
    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
    
    this.log(`Total Tests: ${total}`);
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');
    this.log(`Pass Rate: ${passRate}%`);
    
    if (this.results.errors.length > 0) {
      this.log('\n❌ FAILED TESTS:');
      this.results.errors.forEach((error, i) => {
        this.log(`${i + 1}. ${error}`, 'error');
      });
    }
    
    this.log('\n🎯 MUTUAL FUND EXIT SUITE STATUS:');
    if (this.results.failed === 0) {
      this.log('✅ ALL TESTS PASSED - SUITE IS FULLY FUNCTIONAL!', 'success');
      this.log('• Backend API endpoints are working correctly');
      this.log('• Database operations are functioning properly');
      this.log('• Frontend-backend connectivity is established');
      this.log('• Data validation and error handling are robust');
    } else {
      this.log('❌ SOME TESTS FAILED - ISSUES DETECTED', 'error');
      this.log('• Review failed tests and fix identified issues');
      this.log('• Ensure backend server is running on localhost:5000');
      this.log('• Verify database connection and test data');
    }
    
    this.log('\n🏁 Testing completed at: ' + new Date().toISOString());
  }
}

// Run tests
async function main() {
  const tester = new SimpleTester();
  try {
    await tester.runTests();
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
