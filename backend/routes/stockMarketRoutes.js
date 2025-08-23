/**
 * FILE LOCATION: backend/routes/stockMarketRoutes.js
 * 
 * Simplified Stock Market Routes using Perplexity AI with official 'sonar-pro' model.
 * Removed complex fallback system, monitoring, and rate limiting
 * for quick implementation. Same endpoints maintained for frontend compatibility.
 */

require('dotenv').config();
const express = require('express');
const router = express.Router();

// ============================================================================
// DEBUG ENDPOINT - NO AUTH (AT THE VERY TOP - BEFORE MIDDLEWARE)
// ============================================================================
router.get('/debug-perplexity', async (req, res) => {
  try {
    console.log('🧪 [DEBUG] Testing Perplexity API directly...');
    
    const axios = require('axios');
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    console.log('🔑 [DEBUG] API Key present:', !!apiKey);
    console.log('🔑 [DEBUG] API Key length:', apiKey?.length);
    console.log('🔑 [DEBUG] API Key starts with:', apiKey?.substring(0, 10));
    
    const requestPayload = {
      model: 'sonar-pro',
      messages: [
        { role: 'user', content: 'Hello, just respond with "API working"' }
      ]
    };
    
    console.log('📤 [DEBUG] Request payload:', JSON.stringify(requestPayload, null, 2));
    
    const response = await axios.post('https://api.perplexity.ai/chat/completions', requestPayload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ [DEBUG] Response received:', response.data);
    res.json({ success: true, data: response.data });
    
  } catch (error) {
    console.error('❌ [DEBUG] DETAILED ERROR:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    res.json({ 
      success: false, 
      error: error.message,
      status: error.response?.status,
      details: error.response?.data 
    });
  }
});

// NOW IMPORT MIDDLEWARE AFTER DEBUG ENDPOINT
const { auth: authenticateToken } = require('../middleware/auth');

// Import controllers
const {
  searchStock,
  searchMutualFund,
  getMutualFunds,
  getIPOData,
  getNews,
  getTrendingStocks,
  get52WeekHighLow,
  getMostActiveStocks,
  getPriceShockers,
  getHistoricalData,
  getStockTargetPrice,
  getMarketOverview,
  clearCache,
  getCacheStats,
  testPerplexity
} = require('../controllers/stockMarketController');

// Apply authentication to all routes EXCEPT debug endpoint
router.use((req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/test-') || req.path === '/debug-perplexity') {
    return next();
  }
  return authenticateToken(req, res, next);
});

// ============================================================================
// TEST ENDPOINTS FOR PERPLEXITY API
// ============================================================================

/**
 * Test endpoint for Perplexity stock search
 * GET /api/stock-market/test-perplexity-stock
 */
router.get('/test-perplexity-stock', async (req, res) => {
  try {
    console.log('🧪 [Test] Testing Perplexity stock search...');
    
    // Test with a popular stock
    req.query = { companyName: 'Reliance Industries' };
    await searchStock(req, res);
    
  } catch (error) {
    console.error('❌ [Test] Perplexity stock test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Perplexity stock test failed',
      error: error.message
    });
  }
});

/**
 * Test endpoint for Perplexity trending stocks
 * GET /api/stock-market/test-perplexity-trending
 */
router.get('/test-perplexity-trending', async (req, res) => {
  try {
    console.log('🧪 [Test] Testing Perplexity trending stocks...');
    
    await getTrendingStocks(req, res);
    
  } catch (error) {
    console.error('❌ [Test] Perplexity trending test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Perplexity trending test failed',
      error: error.message
    });
  }
});

/**
 * Test endpoint for Perplexity IPO data
 * GET /api/stock-market/test-perplexity-ipo
 */
router.get('/test-perplexity-ipo', async (req, res) => {
  try {
    console.log('🧪 [Test] Testing Perplexity IPO data...');
    await getIPOData(req, res);
  } catch (error) {
    console.error('❌ [Test] Perplexity IPO test failed:', error.message);
    res.status(500).json({ success: false, message: 'Perplexity IPO test failed', error: error.message });
  }
});

/**
 * Test endpoint for Perplexity API connection
 * GET /api/stock-market/test-perplexity
 */
router.get('/test-perplexity', testPerplexity);

// ============================================================================
// STOCK SEARCH & INFORMATION ROUTES
// ============================================================================

/**
 * Search for stock information by company name
 * GET /api/stock-market/search-stock?companyName=RELIANCE
 */
router.get('/search-stock', searchStock);

/**
 * Search for mutual funds by name or AMC
 * GET /api/stock-market/search-mutual-fund?query=SBI
 */
router.get('/search-mutual-fund', searchMutualFund);

/**
 * Get comprehensive mutual funds data by category
 * GET /api/stock-market/mutual-funds
 */
router.get('/mutual-funds', getMutualFunds);

// ============================================================================
// IPO & MARKET DATA ROUTES
// ============================================================================

/**
 * Get IPO data (upcoming, active, listed, closed)
 * GET /api/stock-market/ipo
 */
router.get('/ipo', getIPOData);

/**
 * Get latest financial news
 * GET /api/stock-market/news
 */
router.get('/news', getNews);

/**
 * Get trending stocks (top gainers/losers)
 * GET /api/stock-market/trending
 */
router.get('/trending', getTrendingStocks);

/**
 * Get 52-week high/low data
 * GET /api/stock-market/52-week-high-low
 */
router.get('/52-week-high-low', get52WeekHighLow);

/**
 * Get most active stocks by exchange
 * GET /api/stock-market/most-active?exchange=nse
 * GET /api/stock-market/most-active?exchange=bse
 * GET /api/stock-market/most-active?exchange=both
 */
router.get('/most-active', getMostActiveStocks);

/**
 * Get price shockers (stocks with significant price movements)
 * GET /api/stock-market/price-shockers
 */
router.get('/price-shockers', getPriceShockers);

// ============================================================================
// HISTORICAL DATA & ANALYTICS ROUTES
// ============================================================================

/**
 * Get historical data for a stock (placeholder implementation)
 * GET /api/stock-market/historical-data?stockName=RELIANCE&period=1yr&filter=price
 */
router.get('/historical-data', getHistoricalData);

/**
 * Get analyst target prices for a stock (placeholder implementation)
 * GET /api/stock-market/stock-target-price?stockId=RELIANCE
 */
router.get('/stock-target-price', getStockTargetPrice);

// ============================================================================
// MARKET OVERVIEW & UTILITY ROUTES
// ============================================================================

/**
 * Get comprehensive market overview (combines multiple endpoints)
 * GET /api/stock-market/overview
 */
router.get('/overview', getMarketOverview);

/**
 * Get cache statistics (simplified - no caching implemented)
 * GET /api/stock-market/cache-stats
 */
router.get('/cache-stats', getCacheStats);

/**
 * Clear cache (simplified - no caching implemented)
 * POST /api/stock-market/clear-cache
 */
router.post('/clear-cache', clearCache);

// ============================================================================
// HEALTH CHECK ROUTE
// ============================================================================

/**
 * Health check for stock market API
 * GET /api/stock-market/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Stock Market API is healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    status: {
      primary: 'operational',
      dataSource: 'perplexity_ai',
      fallback: 'not_needed'
    },
    endpoints: {
      test: '/test-perplexity-stock, /test-perplexity-trending, /test-perplexity-ipo',
      search: '/search-stock, /search-mutual-fund',
      market: '/ipo, /trending, /52-week-high-low, /most-active, /price-shockers',
      analytics: '/historical-data, /stock-target-price',
      overview: '/overview, /mutual-funds, /news',
      utility: '/cache-stats, /clear-cache, /health'
    },
    features: {
      perplexityIntegration: true,
      realTimeData: true,
      indianMarketFocus: true,
      noAuthenticationRequired: 'test endpoints only',
      consistentResponseFormat: true
    },
    removedFeatures: {
      complexFallbackSystem: 'simplified to single Perplexity source',
      rateLimiting: 'removed for quick implementation',
      complexCaching: 'using real-time data only',
      monitoring: 'removed for simplicity'
    }
  });
});

module.exports = router;
