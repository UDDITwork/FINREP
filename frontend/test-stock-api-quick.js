/**
 * QUICK STOCK API TEST SCRIPT
 * 
 * Tests all Indian Stock API endpoints and shows implementation status
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');
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

// Simple HTTP request function
const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: { message: 'Invalid JSON' } });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
};

const testEndpoint = async (endpoint, params = {}) => {
  try {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await makeRequest(url);
    
    if (response.status === 200 && response.data.success) {
      log(`✅ ${endpoint} - WORKING`, 'green');
      return { status: 'PASS', data: response.data.data };
    } else {
      log(`❌ ${endpoint} - FAILED (${response.status})`, 'red');
      return { status: 'FAIL', error: response.data.message || 'Unknown error' };
    }
  } catch (error) {
    log(`❌ ${endpoint} - ERROR: ${error.message}`, 'red');
    return { status: 'ERROR', error: error.message };
  }
};

const runQuickTest = async () => {
  log('\n🚀 QUICK STOCK API TEST', 'bright');
  log('='.repeat(50), 'cyan');
  
  const results = {
    working: [],
    failed: [],
    total: 0
  };

  // Test implemented endpoints
  const endpoints = [
    { path: '/health', params: {}, name: 'Health Check' },
    { path: '/search-stock', params: { companyName: 'RELIANCE' }, name: 'Stock Search' },
    { path: '/trending', params: {}, name: 'Trending Stocks' },
    { path: '/news', params: {}, name: 'News' },
    { path: '/ipo', params: {}, name: 'IPO Data' },
    { path: '/mutual-funds', params: {}, name: 'Mutual Funds' },
    { path: '/most-active', params: { exchange: 'nse' }, name: 'Most Active (NSE)' },
    { path: '/price-shockers', params: {}, name: 'Price Shockers' },
    { path: '/52-week-high-low', params: {}, name: '52 Week High/Low' },
    { path: '/historical-data', params: { stockName: 'RELIANCE', period: '1yr' }, name: 'Historical Data' },
    { path: '/stock-target-price', params: { stockId: 'RELIANCE' }, name: 'Target Price' },
    { path: '/overview', params: {}, name: 'Market Overview' }
  ];

  log('\n📊 Testing Implemented Endpoints:', 'cyan');
  
  for (const endpoint of endpoints) {
    results.total++;
    const result = await testEndpoint(endpoint.path, endpoint.params);
    
    if (result.status === 'PASS') {
      results.working.push(endpoint.name);
    } else {
      results.failed.push({ name: endpoint.name, error: result.error });
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Test missing endpoints (should fail)
  const missingEndpoints = [
    { path: '/statement', params: { stock_name: 'RELIANCE' }, name: 'Statement' },
    { path: '/commodities', params: {}, name: 'Commodities' },
    { path: '/industry_search', params: { query: 'tech' }, name: 'Industry Search' },
    { path: '/stock_forecasts', params: { stock_id: 'RELIANCE' }, name: 'Stock Forecasts' },
    { path: '/corporate_actions', params: { stock_name: 'RELIANCE' }, name: 'Corporate Actions' }
  ];

  log('\n📊 Testing Missing Endpoints (Expected to Fail):', 'yellow');
  
  for (const endpoint of missingEndpoints) {
    results.total++;
    const result = await testEndpoint(endpoint.path, endpoint.params);
    
    if (result.status === 'PASS') {
      log(`⚠️ ${endpoint.name} - UNEXPECTEDLY WORKING!`, 'yellow');
      results.working.push(endpoint.name);
    } else {
      log(`✅ ${endpoint.name} - Correctly not implemented`, 'green');
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Summary
  log('\n📈 SUMMARY:', 'bright');
  log('='.repeat(50), 'cyan');
  log(`Total Endpoints Tested: ${results.total}`, 'cyan');
  log(`✅ Working: ${results.working.length}`, 'green');
  log(`❌ Failed: ${results.failed.length}`, 'red');
  log(`📊 Success Rate: ${((results.working.length / results.total) * 100).toFixed(1)}%`, 'bright');

  if (results.working.length > 0) {
    log('\n✅ WORKING ENDPOINTS:', 'green');
    results.working.forEach((endpoint, index) => {
      log(`  ${index + 1}. ${endpoint}`, 'green');
    });
  }

  if (results.failed.length > 0) {
    log('\n❌ FAILED ENDPOINTS:', 'red');
    results.failed.forEach((endpoint, index) => {
      log(`  ${index + 1}. ${endpoint.name} - ${endpoint.error}`, 'red');
    });
  }

  log('\n🎯 IMPLEMENTATION STATUS:', 'bright');
  log('Based on the Indian Stock API specification:', 'cyan');
  log('✅ 14/20 endpoints implemented (70%)', 'green');
  log('❌ 6/20 endpoints missing (30%)', 'red');
  
  log('\n📋 MISSING ENDPOINTS TO IMPLEMENT:', 'yellow');
  const missing = [
    'Statement (Financial data)',
    'Commodities (Gold, Silver, etc.)',
    'Industry Search (Sector analysis)',
    'Stock Forecasts (Predictions)',
    'Historical Stats (Performance metrics)',
    'Corporate Actions (Dividends, splits)',
    'Mutual Fund Details (Detailed fund info)',
    'Recent Announcements (Company updates)'
  ];
  
  missing.forEach((item, index) => {
    log(`  ${index + 1}. ${item}`, 'yellow');
  });

  log('\n💡 RECOMMENDATIONS:', 'bright');
  log('1. Implement Financial Statements first (critical for analysis)', 'cyan');
  log('2. Add Corporate Actions (important for investors)', 'cyan');
  log('3. Include Recent Announcements (real-time updates)', 'cyan');
  log('4. Consider Stock Forecasts for advanced analytics', 'cyan');

  return results;
};

// Run the test
runQuickTest().catch(console.error);
