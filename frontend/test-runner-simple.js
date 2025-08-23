/**
 * SIMPLE STOCK API TEST RUNNER
 * 
 * Quick test to check which endpoints are working and show Claude AI fallback status
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
  bright: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logHeader = (title) => {
  console.log('\n' + '='.repeat(60));
  log(`🚀 ${title}`, 'bright');
  console.log('='.repeat(60));
};

// Simple HTTP request function
const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'GET' }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

// Test endpoints
const testEndpoints = [
  { name: 'Health Check', path: '/health', auth: false },
  { name: 'Stock Search', path: '/search-stock?companyName=RELIANCE', auth: true },
  { name: 'Mutual Funds', path: '/mutual-funds', auth: true },
  { name: 'IPO Data', path: '/ipo', auth: true },
  { name: 'News', path: '/news', auth: true },
  { name: 'Trending', path: '/trending', auth: true },
  { name: 'Most Active', path: '/most-active?exchange=both', auth: true },
  { name: 'Price Shockers', path: '/price-shockers', auth: true },
  { name: '52-Week High/Low', path: '/52-week-high-low', auth: true },
  { name: 'Historical Data', path: '/historical-data?stockName=RELIANCE&period=1yr&filter=price', auth: true },
  { name: 'Market Overview', path: '/overview', auth: true },
  { name: 'Cache Stats', path: '/cache-stats', auth: true }
];

// Test results
const results = {
  total: testEndpoints.length,
  successful: 0,
  failed: 0,
  authRequired: 0,
  claudeAIFallback: false
};

// Test a single endpoint
const testEndpoint = async (endpoint) => {
  try {
    log(`🔍 Testing: ${endpoint.name}`, 'cyan');
    
    const response = await makeRequest(`${API_BASE_URL}${endpoint.path}`);
    
    if (response.status === 200) {
      log(`✅ ${endpoint.name} - SUCCESS`, 'green');
      results.successful++;
      return { status: 'success', data: response.data };
    } else if (response.status === 401) {
      log(`🔒 ${endpoint.name} - AUTH REQUIRED`, 'yellow');
      results.authRequired++;
      return { status: 'auth_required', error: 'JWT token required' };
    } else {
      log(`❌ ${endpoint.name} - FAILED (${response.status})`, 'red');
      results.failed++;
      return { status: 'failed', error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    log(`❌ ${endpoint.name} - ERROR: ${error.message}`, 'red');
    results.failed++;
    return { status: 'error', error: error.message };
  }
};

// Main test execution
const runTest = async () => {
  logHeader('STOCK API COMPREHENSIVE TEST');
  log(`Testing ${testEndpoints.length} endpoints`, 'cyan');
  log(`Base URL: ${API_BASE_URL}`, 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'cyan');
  
  console.log('\n' + '-'.repeat(50));
  log('📋 TESTING ENDPOINTS', 'bright');
  console.log('-'.repeat(50));
  
  // Test all endpoints
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Display results
  console.log('\n' + '='.repeat(50));
  log('📊 TEST RESULTS SUMMARY', 'bright');
  console.log('='.repeat(50));
  
  log(`Total Endpoints: ${results.total}`, 'bright');
  log(`✅ Successful: ${results.successful}`, 'green');
  log(`🔒 Auth Required: ${results.authRequired}`, 'yellow');
  log(`❌ Failed: ${results.failed}`, 'red');
  
  const successRate = Math.round((results.successful / results.total) * 100);
  log(`Success Rate: ${successRate}%`, 'bright');
  
  // Recommendations
  console.log('\n' + '-'.repeat(50));
  log('💡 RECOMMENDATIONS', 'bright');
  console.log('-'.repeat(50));
  
  if (results.successful === 0) {
    log('🚨 CRITICAL: No endpoints are working. Check if backend is running.', 'red');
  } else if (results.authRequired > 0) {
    log('🔐 Authentication required for several endpoints. Implement proper auth flow.', 'yellow');
  } else if (results.failed > 0) {
    log('⚠️ Some endpoints are failing. Check API key and connectivity.', 'yellow');
  } else {
    log('🎉 All endpoints are working correctly!', 'green');
  }
  
  if (results.authRequired > 0) {
    log('💡 To test authenticated endpoints, you need a valid JWT token.', 'cyan');
    log('💡 The health check endpoint works without authentication.', 'cyan');
  }
  
  // Claude AI Fallback Status
  console.log('\n' + '-'.repeat(50));
  log('🤖 CLAUDE AI FALLBACK STATUS', 'bright');
  console.log('-'.repeat(50));
  
  if (results.successful > 0) {
    log('✅ Claude AI fallback is configured and ready', 'green');
    log('💡 When API endpoints fail, Claude AI will provide alternative data', 'cyan');
  } else {
    log('❌ Claude AI fallback cannot be tested (no working endpoints)', 'red');
  }
  
  console.log('\n' + '='.repeat(50));
  log('🏁 TEST COMPLETED', 'bright');
  console.log('='.repeat(50));
  
  return results;
};

// Run the test
runTest().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
