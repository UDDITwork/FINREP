/**
 * FILE LOCATION: backend/routes/stockMarketRoutes.js
 * 
 * Stock Market API routes that provide access to real-time stock data,
 * mutual funds, IPOs, and market analytics. Includes rate limiting and
 * authentication middleware for secure access.
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const router = express.Router();
const { auth: authenticateToken } = require('../middleware/auth');
const claudeAIFallbackService = require('../services/claudeAIFallbackService');
const fallbackRoutes = require('./stockMarketFallbackRoutes');
const stockMarketMonitoringService = require('../services/stockMarketMonitoringService');
const {
  checkRateLimit,
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
  getCacheStats
} = require('../controllers/stockMarketController');

// Apply rate limiting to all stock market routes (except health check)
router.use((req, res, next) => {
  // Skip rate limiting for health check
  if (req.path === '/health') {
    return next();
  }
  return checkRateLimit(req, res, next);
});

// Apply authentication to all routes (except health check and test endpoints)
router.use((req, res, next) => {
  // Skip authentication for health check and test endpoints
  if (req.path === '/health' || req.path.startsWith('/test-')) {
    return next();
  }
  return authenticateToken(req, res, next);
});

// ============================================================================
// TEST ENDPOINTS WITH CLAUDE AI FALLBACK
// ============================================================================

/**
 * Test endpoint that demonstrates Claude AI fallback
 * GET /api/stock-market/test-claude-fallback
 */
router.get('/test-claude-fallback', async (req, res) => {
  try {
    console.log('🤖 [Test] Testing Claude AI fallback service...');
    
    // Test Claude AI with a simple stock query
    const fallbackData = await claudeAIFallbackService.getStockFallback('RELIANCE', 'basic');
    
    if (fallbackData.success) {
      console.log('✅ [Test] Claude AI fallback working successfully');
      res.json({
        success: true,
        message: 'Claude AI fallback service is working!',
        data: fallbackData.data,
        source: fallbackData.source,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(fallbackData.error || 'Claude AI fallback failed');
    }
    
  } catch (error) {
    console.error('❌ [Test] Claude AI fallback test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Claude AI fallback test failed',
      error: error.message
    });
  }
});

/**
 * Test endpoint for market data fallback
 * GET /api/stock-market/test-market-fallback
 */
router.get('/test-market-fallback', async (req, res) => {
  try {
    console.log('🤖 [Test] Testing Claude AI market data fallback...');
    
    const fallbackData = await claudeAIFallbackService.getMarketDataFallback('trending');
    
    if (fallbackData.success) {
      console.log('✅ [Test] Claude AI market data fallback working successfully');
      res.json({
        success: true,
        message: 'Claude AI market data fallback is working!',
        data: fallbackData.data,
        source: fallbackData.source,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(fallbackData.error || 'Claude AI market data fallback failed');
    }
    
  } catch (error) {
    console.error('❌ [Test] Claude AI market data fallback test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Claude AI market data fallback test failed',
      error: error.message
    });
  }
});

/**
 * Test endpoint for news fallback
 * GET /api/stock-market/test-news-fallback
 */
router.get('/test-news-fallback', async (req, res) => {
  try {
    console.log('🤖 [Test] Testing Claude AI news fallback...');
    
    const fallbackData = await claudeAIFallbackService.getNewsFallback();
    
    if (fallbackData.success) {
      console.log('✅ [Test] Claude AI news fallback working successfully');
      res.json({
        success: true,
        message: 'Claude AI news fallback is working!',
        data: fallbackData.data,
        source: fallbackData.source,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(fallbackData.error || 'Claude AI news fallback failed');
    }
    
  } catch (error) {
    console.error('❌ [Test] Claude AI news fallback test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Claude AI news fallback test failed',
      error: error.message
    });
  }
});

// ============================================================================
// FALLBACK ROUTES (No authentication required)
// ============================================================================

/**
 * Mount fallback routes
 * All fallback routes will be available at /api/stock-market/fallback/*
 */
router.use('/fallback', fallbackRoutes);

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
 * Get historical data for a stock
 * GET /api/stock-market/historical-data?stockName=RELIANCE&period=1yr&filter=price
 */
router.get('/historical-data', getHistoricalData);

/**
 * Get analyst target prices for a stock
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
 * Get cache statistics
 * GET /api/stock-market/cache-stats
 */
router.get('/cache-stats', getCacheStats);

/**
 * Get comprehensive system monitoring metrics (Admin only)
 * GET /api/stock-market/monitoring
 */
router.get('/monitoring', (req, res) => {
  try {
    // Check if user is admin (you can implement your own admin check logic)
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    console.log('📊 [Stock Market] Admin requested monitoring metrics');
    
    const metricsReport = stockMarketMonitoringService.getMetricsReport();
    
    res.json({
      success: true,
      message: 'Monitoring metrics retrieved successfully',
      data: metricsReport,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [Stock Market] Error retrieving monitoring metrics:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve monitoring metrics',
      error: error.message
    });
  }
});

/**
 * Get endpoint-specific metrics (Admin only)
 * GET /api/stock-market/monitoring/endpoint/:endpoint
 */
router.get('/monitoring/endpoint/:endpoint', (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { endpoint } = req.params;
    console.log(`📊 [Stock Market] Admin requested metrics for endpoint: ${endpoint}`);
    
    const endpointMetrics = stockMarketMonitoringService.getEndpointMetrics(endpoint);
    
    res.json({
      success: true,
      message: `Endpoint metrics retrieved for ${endpoint}`,
      data: endpointMetrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [Stock Market] Error retrieving endpoint metrics:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve endpoint metrics',
      error: error.message
    });
  }
});

/**
 * Export monitoring metrics (Admin only)
 * GET /api/stock-market/monitoring/export
 */
router.get('/monitoring/export', (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    console.log('📊 [Stock Market] Admin requested metrics export');
    
    const exportedMetrics = stockMarketMonitoringService.exportMetrics();
    
    res.json({
      success: true,
      message: 'Monitoring metrics exported successfully',
      data: exportedMetrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [Stock Market] Error exporting monitoring metrics:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to export monitoring metrics',
      error: error.message
    });
  }
});

/**
 * Clear cache (admin only)
 * POST /api/stock-market/clear-cache
 * Body: { "pattern": "optional_pattern_to_clear" }
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
    version: '1.0.0',
    status: {
      primary: 'operational',
      fallback: 'available',
      cache: 'active'
    },
    endpoints: {
      test: '/test-claude-fallback, /test-market-fallback, /test-news-fallback',
      fallback: '/fallback/* (No auth required)',
      search: '/search-stock, /search-mutual-fund',
      market: '/ipo, /trending, /52-week-high-low, /most-active, /price-shockers',
      analytics: '/historical-data, /stock-target-price',
      overview: '/overview, /mutual-funds',
      utility: '/cache-stats, /clear-cache, /health'
    },
    fallbackSystem: {
      status: 'active',
      description: 'Claude AI provides data when main API fails',
      endpoints: '/fallback/search-stock, /fallback/ipo, /fallback/news, etc.'
    },
    features: {
      automaticFallback: true,
      responseTransformation: true,
      intelligentCaching: true,
      dataQualityValidation: true
    }
  });
});

module.exports = router;
