/**
 * COMPREHENSIVE INDIAN STOCK API TEST SCRIPT
 * 
 * This script tests all available endpoints from the Indian Stock API
 * and identifies which ones are implemented in our backend vs missing.
 * 
 * USAGE: Run this script to test all endpoints and get detailed results
 */

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api/stock-market';
const TEST_TIMEOUT = 30000; // 30 seconds per test

// Test data for different endpoints
const TEST_DATA = {
  stockNames: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'],
  mutualFundQueries: ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak'],
  stockIds: ['RELIANCE', 'TCS', 'HDFCBANK'],
  periods: ['1m', '6m', '1yr', '3yr'],
  filters: ['price', 'pe', 'sm'],
  measureCodes: ['EPS', 'ROE', 'SAL'],
  periodTypes: ['Annual', 'Interim'],
  dataTypes: ['Actuals', 'Estimates'],
  dataAges: ['Current', 'OneWeekAgo', 'ThirtyDaysAgo'],
  stats: ['price', 'volume', 'market_cap']
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test results storage
let testResults = {
  implemented: [],
  missing: [],
  errors: [],
  summary: {
    total: 0,
    implemented: 0,
    missing: 0,
    errors: 0,
    successRate: 0
  }
};

// Utility functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logHeader = (title) => {
  log('\n' + '='.repeat(80), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(80), 'cyan');
};

const logTest = (testName, status, details = '') => {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const statusText = status === 'PASS' ? '✅ PASS' : status === 'FAIL' ? '❌ FAIL' : '⚠️ SKIP';
  log(`  ${statusText} ${testName}`, statusColor);
  if (details) {
    log(`    ${details}`, 'yellow');
  }
};

// API test functions
const testEndpoint = async (endpoint, params = {}, description = '') => {
  const testName = `${endpoint}${description ? ` - ${description}` : ''}`;
  
  try {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Mock token for testing
      },
      timeout: TEST_TIMEOUT
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      testResults.implemented.push({
        endpoint,
        description,
        status: 'PASS',
        responseTime: Date.now(),
        data: data.data
      });
      logTest(testName, 'PASS', `Response: ${JSON.stringify(data.data).substring(0, 100)}...`);
      return true;
    } else {
      testResults.errors.push({
        endpoint,
        description,
        status: 'FAIL',
        error: data.message || 'Unknown error',
        statusCode: response.status
      });
      logTest(testName, 'FAIL', `Error: ${data.message || 'Unknown error'} (${response.status})`);
      return false;
    }
  } catch (error) {
    testResults.errors.push({
      endpoint,
      description,
      status: 'ERROR',
      error: error.message
    });
    logTest(testName, 'FAIL', `Exception: ${error.message}`);
    return false;
  }
};

// Test all implemented endpoints
const testImplementedEndpoints = async () => {
  logHeader('TESTING IMPLEMENTED ENDPOINTS');
  
  // 1. Stock Search
  await testEndpoint('/search-stock', { companyName: 'RELIANCE' }, 'Search for Reliance stock');
  await testEndpoint('/search-stock', { companyName: 'TCS' }, 'Search for TCS stock');
  
  // 2. Mutual Fund Search
  await testEndpoint('/search-mutual-fund', { query: 'SBI' }, 'Search for SBI mutual funds');
  await testEndpoint('/search-mutual-fund', { query: 'HDFC' }, 'Search for HDFC mutual funds');
  
  // 3. Get Mutual Funds
  await testEndpoint('/mutual-funds', {}, 'Get all mutual funds data');
  
  // 4. IPO Data
  await testEndpoint('/ipo', {}, 'Get IPO data');
  
  // 5. News
  await testEndpoint('/news', {}, 'Get latest financial news');
  
  // 6. Trending Stocks
  await testEndpoint('/trending', {}, 'Get trending stocks');
  
  // 7. 52 Week High/Low
  await testEndpoint('/52-week-high-low', {}, 'Get 52-week high/low data');
  
  // 8. Most Active Stocks
  await testEndpoint('/most-active', { exchange: 'nse' }, 'Get NSE most active stocks');
  await testEndpoint('/most-active', { exchange: 'bse' }, 'Get BSE most active stocks');
  await testEndpoint('/most-active', { exchange: 'both' }, 'Get both exchanges most active stocks');
  
  // 9. Price Shockers
  await testEndpoint('/price-shockers', {}, 'Get price shockers data');
  
  // 10. Historical Data
  await testEndpoint('/historical-data', { 
    stockName: 'RELIANCE', 
    period: '1yr', 
    filter: 'price' 
  }, 'Get Reliance historical data');
  
  // 11. Stock Target Price
  await testEndpoint('/stock-target-price', { stockId: 'RELIANCE' }, 'Get Reliance target price');
  
  // 12. Market Overview
  await testEndpoint('/overview', {}, 'Get comprehensive market overview');
  
  // 13. Cache Stats
  await testEndpoint('/cache-stats', {}, 'Get cache statistics');
  
  // 14. Health Check
  await testEndpoint('/health', {}, 'Health check');
};

// Test missing endpoints (these should fail)
const testMissingEndpoints = async () => {
  logHeader('TESTING MISSING ENDPOINTS (Expected to Fail)');
  
  // These endpoints are in the API spec but not implemented in our backend
  const missingEndpoints = [
    { path: '/statement', params: { stock_name: 'RELIANCE', stats: 'price' }, desc: 'Statement endpoint' },
    { path: '/commodities', params: {}, desc: 'Commodities data' },
    { path: '/industry_search', params: { query: 'technology' }, desc: 'Industry search' },
    { path: '/stock_forecasts', params: { 
      stock_id: 'RELIANCE', 
      measure_code: 'EPS', 
      period_type: 'Annual', 
      data_type: 'Actuals', 
      age: 'Current' 
    }, desc: 'Stock forecasts' },
    { path: '/historical_stats', params: { stock_name: 'RELIANCE', stats: 'price' }, desc: 'Historical stats' },
    { path: '/corporate_actions', params: { stock_name: 'RELIANCE' }, desc: 'Corporate actions' },
    { path: '/mutual_funds_details', params: { stock_name: 'SBI' }, desc: 'Mutual fund details' },
    { path: '/recent_announcements', params: { stock_name: 'RELIANCE' }, desc: 'Recent announcements' }
  ];

  for (const endpoint of missingEndpoints) {
    const success = await testEndpoint(endpoint.path, endpoint.params, endpoint.desc);
    if (!success) {
      testResults.missing.push({
        endpoint: endpoint.path,
        description: endpoint.desc,
        params: endpoint.params
      });
    }
  }
};

// Generate comprehensive report
const generateReport = () => {
  logHeader('COMPREHENSIVE TEST REPORT');
  
  // Summary statistics
  testResults.summary.total = testResults.implemented.length + testResults.missing.length + testResults.errors.length;
  testResults.summary.implemented = testResults.implemented.length;
  testResults.summary.missing = testResults.missing.length;
  testResults.summary.errors = testResults.errors.length;
  testResults.summary.successRate = ((testResults.implemented.length / testResults.summary.total) * 100).toFixed(2);
  
  log('\n📊 SUMMARY STATISTICS:', 'bright');
  log(`  Total Endpoints Tested: ${testResults.summary.total}`, 'cyan');
  log(`  ✅ Successfully Implemented: ${testResults.summary.implemented}`, 'green');
  log(`  ❌ Missing/Not Implemented: ${testResults.summary.missing}`, 'red');
  log(`  ⚠️ Errors: ${testResults.summary.errors}`, 'yellow');
  log(`  📈 Success Rate: ${testResults.summary.successRate}%`, 'bright');
  
  // Implemented endpoints
  if (testResults.implemented.length > 0) {
    log('\n✅ IMPLEMENTED ENDPOINTS:', 'green');
    testResults.implemented.forEach((test, index) => {
      log(`  ${index + 1}. ${test.endpoint} - ${test.description}`, 'green');
    });
  }
  
  // Missing endpoints
  if (testResults.missing.length > 0) {
    log('\n❌ MISSING ENDPOINTS (Not Implemented):', 'red');
    testResults.missing.forEach((test, index) => {
      log(`  ${index + 1}. ${test.endpoint} - ${test.description}`, 'red');
      if (test.params && Object.keys(test.params).length > 0) {
        log(`     Parameters: ${JSON.stringify(test.params)}`, 'yellow');
      }
    });
  }
  
  // Error details
  if (testResults.errors.length > 0) {
    log('\n⚠️ ERRORS ENCOUNTERED:', 'yellow');
    testResults.errors.forEach((error, index) => {
      log(`  ${index + 1}. ${error.endpoint} - ${error.description}`, 'yellow');
      log(`     Error: ${error.error}`, 'red');
    });
  }
  
  // API Specification vs Implementation Analysis
  log('\n🔍 API SPECIFICATION ANALYSIS:', 'bright');
  log('  Based on the Indian Stock API specification, here are the endpoints:', 'cyan');
  
  const allSpecEndpoints = [
    '/ipo', '/news', '/stock', '/trending', '/statement', '/commodities',
    '/mutual_funds', '/price_shockers', '/BSE_most_active', '/NSE_most_active',
    '/historical_data', '/industry_search', '/stock_forecasts', '/historical_stats',
    '/corporate_actions', '/mutual_fund_search', '/stock_target_price',
    '/mutual_funds_details', '/recent_announcements', '/fetch_52_week_high_low_data'
  ];
  
  const implementedEndpoints = testResults.implemented.map(t => t.endpoint);
  const missingFromSpec = allSpecEndpoints.filter(endpoint => 
    !implementedEndpoints.some(impl => impl.includes(endpoint.replace('/', '')))
  );
  
  log(`  📋 Total Endpoints in API Spec: ${allSpecEndpoints.length}`, 'cyan');
  log(`  ✅ Implemented in Our Backend: ${implementedEndpoints.length}`, 'green');
  log(`  ❌ Missing from Our Implementation: ${missingFromSpec.length}`, 'red');
  
  if (missingFromSpec.length > 0) {
    log('\n  📝 Missing Endpoints to Implement:', 'yellow');
    missingFromSpec.forEach((endpoint, index) => {
      log(`    ${index + 1}. ${endpoint}`, 'yellow');
    });
  }
  
  // Recommendations
  log('\n💡 RECOMMENDATIONS:', 'bright');
  log('  1. Implement missing endpoints for complete API coverage', 'cyan');
  log('  2. Add proper error handling for rate limiting', 'cyan');
  log('  3. Implement caching for frequently accessed data', 'cyan');
  log('  4. Add comprehensive logging for debugging', 'cyan');
  log('  5. Consider implementing WebSocket for real-time updates', 'cyan');
};

// Main test execution
const runComprehensiveTest = async () => {
  logHeader('INDIAN STOCK API COMPREHENSIVE TEST SUITE');
  log('Starting comprehensive test of all Indian Stock API endpoints...', 'cyan');
  log(`Base URL: ${API_BASE_URL}`, 'cyan');
  log(`Timeout per test: ${TEST_TIMEOUT}ms`, 'cyan');
  
  try {
    // Test implemented endpoints
    await testImplementedEndpoints();
    
    // Test missing endpoints
    await testMissingEndpoints();
    
    // Generate comprehensive report
    generateReport();
    
    // Save results to file
    const fs = require('fs');
    const reportData = {
      timestamp: new Date().toISOString(),
      testResults,
      apiBaseUrl: API_BASE_URL
    };
    
    fs.writeFileSync('stock-api-test-results.json', JSON.stringify(reportData, null, 2));
    log('\n📄 Test results saved to: stock-api-test-results.json', 'green');
    
  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red');
    console.error(error);
  }
};

// Export for use in other scripts
module.exports = {
  runComprehensiveTest,
  testEndpoint,
  testResults
};

// Run if this script is executed directly
if (require.main === module) {
  runComprehensiveTest();
}
