/**
 * FILE LOCATION: backend/routes/stockMarketFallbackRoutes.js
 * 
 * Fallback Routes that provide financial data via Claude AI when the main
 * Indian Stock API fails. These routes ensure users always get data.
 */

const express = require('express');
const router = express.Router();
const {
  searchStockWithFallback,
  searchMutualFundWithFallback,
  getIPODataWithFallback,
  getNewsWithFallback,
  getTrendingStocksWithFallback,
  getMostActiveStocksWithFallback,
  getPriceShockersWithFallback,
  getMarketOverviewWithFallback,
  getFallbackHealth
} = require('../controllers/stockMarketFallbackController');

// ============================================================================
// FALLBACK ROUTES (No authentication required)
// ============================================================================

/**
 * Fallback stock search via Claude AI
 * GET /api/stock-market/fallback/search-stock?companyName=RELIANCE
 */
router.get('/search-stock', searchStockWithFallback);

/**
 * Fallback mutual fund search via Claude AI
 * GET /api/stock-market/fallback/search-mutual-fund?query=SBI
 */
router.get('/search-mutual-fund', searchMutualFundWithFallback);

/**
 * Fallback IPO data via Claude AI
 * GET /api/stock-market/fallback/ipo
 */
router.get('/ipo', getIPODataWithFallback);

/**
 * Fallback news data via Claude AI
 * GET /api/stock-market/fallback/news
 */
router.get('/news', getNewsWithFallback);

/**
 * Fallback trending stocks via Claude AI
 * GET /api/stock-market/fallback/trending
 */
router.get('/trending', getTrendingStocksWithFallback);

/**
 * Fallback most active stocks via Claude AI
 * GET /api/stock-market/fallback/most-active?exchange=both
 */
router.get('/most-active', getMostActiveStocksWithFallback);

/**
 * Fallback price shockers via Claude AI
 * GET /api/stock-market/fallback/price-shockers
 */
router.get('/price-shockers', getPriceShockersWithFallback);

/**
 * Fallback market overview via Claude AI
 * GET /api/stock-market/fallback/overview
 */
router.get('/overview', getMarketOverviewWithFallback);

/**
 * Fallback system health check
 * GET /api/stock-market/fallback/health
 */
router.get('/health', getFallbackHealth);

/**
 * Fallback system information
 * GET /api/stock-market/fallback/info
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'Stock Market Fallback System',
    description: 'This system provides financial data via Claude AI when the main API fails',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'Claude AI Fallback',
    endpoints: {
      search: '/fallback/search-stock, /fallback/search-mutual-fund',
      market: '/fallback/ipo, /fallback/trending, /fallback/most-active, /fallback/price-shockers',
      overview: '/fallback/overview, /fallback/news',
      system: '/fallback/health, /fallback/info'
    },
    features: [
      'Automatic fallback when main API fails',
      'Real-time financial data generation',
      'Indian market focused information',
      'No authentication required',
      'Fast response times'
    ]
  });
});

module.exports = router;
