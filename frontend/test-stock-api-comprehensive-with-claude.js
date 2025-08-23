/**
 * COMPREHENSIVE STOCK API TEST WITH CLAUDE AI FALLBACK
 * 
 * This script tests all available endpoints from the Indian Stock API
 * and shows Claude AI fallback responses when the API fails.
 * 
 * USAGE: Run this script to test all endpoints comprehensively
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');

const API_BASE_URL = 'http://localhost:5000/api/stock-market';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  bright: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logHeader = (title) => {
  console.log('\n' + '='.repeat(80));
  log(`🚀 ${title}`, 'bright');
  console.log('='.repeat(80));
};

const logSection = (title) => {
  console.log('\n' + '-'.repeat(60));
  log(`📋 ${title}`, 'cyan');
  console.log('-'.repeat(60));
};

const logResult = (endpoint, status, responseTime, details = '') => {
  const statusIcon = status === 'success' ? '✅' : status === 'fallback' ? '🤖' : '❌';
  const statusColor = status === 'success' ? 'green' : status === 'fallback' ? 'yellow' : 'red';
  const timeStr = responseTime ? ` (${responseTime}ms)` : '';
  
  log(`${statusIcon} ${endpoint}${timeStr}`, statusColor);
  if (details) {
    log(`   ${details}`, 'reset');
  }
};

// HTTP request function with authentication
const makeRequest = (url, authToken = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

// Test configuration
const TEST_ENDPOINTS = [
  {
    name: 'Health Check',
    path: '/health',
    description: 'API health status',
    requiresAuth: false,
    testParams: {}
  },
  {
    name: 'Stock Search',
    path: '/search-stock',
    description: 'Search for stock information',
    requiresAuth: true,
    testParams: { companyName: 'RELIANCE' }
  },
  {
    name: 'Mutual Fund Search',
    path: '/search-mutual-fund',
    description: 'Search for mutual funds',
    requiresAuth: true,
    testParams: { query: 'SBI' }
  },
  {
    name: 'Mutual Funds',
    path: '/mutual-funds',
    description: 'Get comprehensive mutual funds data',
    requiresAuth: true,
    testParams: {}
  },
  {
    name: 'IPO Data',
    path: '/ipo',
    description: 'Get IPO information',
    requiresAuth: true,
    testParams: {}
  },
  {
    name: 'Financial News',
    path: '/news',
    description: 'Get latest financial news',
    requiresAuth: true,
    testParams: {}
  },
  {
    name: 'Trending Stocks',
    path: '/trending',
    description: 'Get trending stocks data',
    requiresAuth: true,
    testParams: {}
  },
  {
    name: '52-Week High/Low',
    path: '/52-week-high-low',
    description: 'Get 52-week high/low data',
    requiresAuth: true,
    testParams: {}
  },
  {
    name: 'Most Active Stocks',
    path: '/most-active',
    description: 'Get most active stocks by exchange',
    requiresAuth: true,
    testParams: { exchange: 'both' }
  },
  {
    name: 'Price Shockers',
    path: '/price-shockers',
    description: 'Get price shockers data',
    requiresAuth: true,
    testParams: {}
  },
  {
    name: 'Historical Data',
    path: '/historical-data',
    description: 'Get historical stock data',
    requiresAuth: true,
    testParams: { stockName: 'RELIANCE', period: '1yr', filter: 'price' }
  },
  {
    name: 'Stock Target Price',
    path: '/stock-target-price',
    description: 'Get analyst target prices',
    requiresAuth: true,
    testParams: { stockId: 'RELIANCE' }
  },
  {
    name: 'Market Overview',
    path: '/overview',
    description: 'Get comprehensive market overview',
    requiresAuth: true,
    testParams: {}
  },
  {
    name: 'Cache Statistics',
    path: '/cache-stats',
    description: 'Get cache statistics',
    requiresAuth: true,
    testParams: {}
  }
];

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  totalEndpoints: TEST_ENDPOINTS.length,
  successful: 0,
  failed: 0,
  fallbackUsed: 0,
  endpoints: [],
  summary: {},
  claudeAIStatus: 'unknown'
};

// Test a single endpoint
const testEndpoint = async (endpoint) => {
  const startTime = Date.now();
  const result = {
    name: endpoint.name,
    path: endpoint.path,
    description: endpoint.description,
    requiresAuth: endpoint.requiresAuth,
    status: 'unknown',
    responseTime: null,
    response: null,
    error: null,
    fallbackUsed: false,
    fallbackData: null
  };

  try {
    // Build URL with query parameters
    const url = new URL(`${API_BASE_URL}${endpoint.path}`);
    Object.keys(endpoint.testParams).forEach(key => {
      if (endpoint.testParams[key] !== undefined && endpoint.testParams[key] !== null) {
        url.searchParams.append(key, endpoint.testParams[key]);
      }
    });

    log(`🔍 Testing: ${endpoint.name}`, 'cyan');
    
    // Make request
    const response = await makeRequest(url.toString());
    result.responseTime = Date.now() - startTime;
    
    if (response.status === 200) {
      result.status = 'success';
      result.response = response.data;
      testResults.successful++;
      
      logResult(endpoint.name, 'success', result.responseTime, 'API responded successfully');
    } else if (response.status === 401) {
      result.status = 'auth_required';
      result.error = 'Authentication required';
      testResults.failed++;
      
      logResult(endpoint.name, 'auth_required', result.responseTime, 'JWT token required');
    } else {
      result.status = 'failed';
      result.error = `HTTP ${response.status}: ${response.data?.message || 'Unknown error'}`;
      testResults.failed++;
      
      logResult(endpoint.name, 'failed', result.responseTime, result.error);
    }
    
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
    result.responseTime = Date.now() - startTime;
    testResults.failed++;
    
    logResult(endpoint.name, 'error', result.responseTime, error.message);
  }

  testResults.endpoints.push(result);
  return result;
};

// Test Claude AI fallback service
const testClaudeAIFallback = async () => {
  logSection('Testing Claude AI Fallback Service');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/health`);
    
    if (response.status === 200) {
      log('✅ Claude AI fallback service is available', 'green');
      testResults.claudeAIStatus = 'available';
    } else {
      log('❌ Claude AI fallback service is not responding', 'red');
      testResults.claudeAIStatus = 'unavailable';
    }
  } catch (error) {
    log('❌ Claude AI fallback service test failed', 'red');
    testResults.claudeAIStatus = 'error';
  }
};

// Generate comprehensive summary
const generateSummary = () => {
  const total = testResults.totalEndpoints;
  const successful = testResults.successful;
  const failed = testResults.failed;
  const successRate = Math.round((successful / total) * 100);
  
  testResults.summary = {
    successRate,
    totalEndpoints: total,
    successful,
    failed,
    fallbackUsed: testResults.fallbackUsed,
    claudeAIStatus: testResults.claudeAIStatus,
    recommendations: []
  };

  // Generate recommendations
  if (successRate < 50) {
    testResults.summary.recommendations.push('Critical: More than half of endpoints are failing. Check API key and connectivity.');
  } else if (successRate < 80) {
    testResults.summary.recommendations.push('Warning: Several endpoints are failing. Implement retry logic and fallbacks.');
  } else if (successRate < 95) {
    testResults.summary.recommendations.push('Good: Most endpoints are working. Monitor failing endpoints.');
  } else {
    testResults.summary.recommendations.push('Excellent: Almost all endpoints are working correctly.');
  }

  if (testResults.claudeAIStatus === 'unavailable') {
    testResults.summary.recommendations.push('Claude AI fallback service is not available. Check configuration.');
  }

  // Check for specific issues
  const authRequiredCount = testResults.endpoints.filter(e => e.status === 'auth_required').length;
  if (authRequiredCount > 0) {
    testResults.summary.recommendations.push(`${authRequiredCount} endpoints require authentication. Implement proper auth flow.`);
  }

  const slowEndpoints = testResults.endpoints.filter(e => e.responseTime && e.responseTime > 5000);
  if (slowEndpoints.length > 0) {
    testResults.summary.recommendations.push(`${slowEndpoints.length} endpoints are responding slowly (>5s). Consider optimization.`);
  }
};

// Display detailed results
const displayResults = () => {
  logHeader('COMPREHENSIVE TEST RESULTS');
  
  // Overall summary
  logSection('Overall Summary');
  log(`Total Endpoints Tested: ${testResults.totalEndpoints}`, 'bright');
  log(`Successful: ${testResults.successful}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Success Rate: ${testResults.summary.successRate}%`, 'bright');
  log(`Claude AI Status: ${testResults.claudeAIStatus}`, 'yellow');
  
  // Endpoint details
  logSection('Endpoint Details');
  testResults.endpoints.forEach(endpoint => {
    const statusIcon = endpoint.status === 'success' ? '✅' : 
                      endpoint.status === 'auth_required' ? '🔒' : '❌';
    const statusColor = endpoint.status === 'success' ? 'green' : 
                       endpoint.status === 'auth_required' ? 'yellow' : 'red';
    
    log(`${statusIcon} ${endpoint.name}`, statusColor);
    log(`   Path: ${endpoint.path}`, 'reset');
    log(`   Status: ${endpoint.status}`, 'reset');
    if (endpoint.responseTime) {
      log(`   Response Time: ${endpoint.responseTime}ms`, 'reset');
    }
    if (endpoint.error) {
      log(`   Error: ${endpoint.error}`, 'red');
    }
    if (endpoint.fallbackUsed) {
      log(`   Fallback: Claude AI used`, 'yellow');
    }
    console.log('');
  });
  
  // Recommendations
  if (testResults.summary.recommendations.length > 0) {
    logSection('Recommendations');
    testResults.summary.recommendations.forEach((rec, index) => {
      log(`${index + 1}. ${rec}`, 'yellow');
    });
  }
  
  // Performance analysis
  const responseTimes = testResults.endpoints
    .filter(e => e.responseTime)
    .map(e => e.responseTime);
  
  if (responseTimes.length > 0) {
    const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    logSection('Performance Analysis');
    log(`Average Response Time: ${avgResponseTime}ms`, 'cyan');
    log(`Fastest Response: ${minResponseTime}ms`, 'green');
    log(`Slowest Response: ${maxResponseTime}ms`, 'red');
  }
};

// Main test execution
const runComprehensiveTest = async () => {
  logHeader('STARTING COMPREHENSIVE STOCK API TEST SUITE');
  log(`Testing ${TEST_ENDPOINTS.length} endpoints with Claude AI fallback support`, 'cyan');
  log(`Base URL: ${API_BASE_URL}`, 'cyan');
  log(`Timestamp: ${testResults.timestamp}`, 'cyan');
  
  // Test Claude AI fallback service first
  await testClaudeAIFallback();
  
  // Test all endpoints
  logSection('Testing Individual Endpoints');
  for (const endpoint of TEST_ENDPOINTS) {
    await testEndpoint(endpoint);
    // Small delay between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Generate and display results
  generateSummary();
  displayResults();
  
  // Save results to file
  const fs = require('fs');
  const resultsFile = `test-results-${Date.now()}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  log(`\n📁 Test results saved to: ${resultsFile}`, 'green');
  
  return testResults;
};

// Export for use in other modules
export { runComprehensiveTest, testResults };

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTest().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}
