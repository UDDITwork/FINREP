/**
 * FILE LOCATION: backend/controllers/stockMarketController.js
 * 
 * Stock Market API controller that provides endpoints for accessing
 * real-time stock data, mutual funds, IPOs, and market analytics.
 * Handles data validation, error responses, and rate limiting.
 */

// Load environment variables
require('dotenv').config();

const indianStockAPI = require('../services/indianStockAPI');

// Rate limiting map to prevent API abuse
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute

/**
 * Rate limiting middleware
 */
const checkRateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    const clientData = rateLimitMap.get(clientIP);
    
    if (now > clientData.resetTime) {
      // Reset window
      clientData.count = 1;
      clientData.resetTime = now + RATE_LIMIT_WINDOW;
    } else if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    } else {
      clientData.count++;
    }
  }
  
  next();
};

/**
 * Search for stock information
 * GET /api/stock-market/search-stock
 */
const searchStock = async (req, res) => {
  try {
    const { companyName } = req.query;
    
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required and must be a non-empty string'
      });
    }

    console.log(`🔍 [Stock Market] Searching for stock: ${companyName}`);
    
    const stockData = await indianStockAPI.searchStock(companyName.trim());
    
    console.log(`✅ [Stock Market] Stock data retrieved for: ${companyName}`);
    
    res.json({
      success: true,
      data: stockData,
      message: 'Stock data retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error searching stock:`, error.message);
    const status = error.status === 400 ? 404 : (error.status || 500);
    const message = error.status === 400 ? 'Symbol or company not found' : 'Failed to retrieve stock data';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Search for mutual funds
 * GET /api/stock-market/search-mutual-fund
 */
const searchMutualFund = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required and must be a non-empty string'
      });
    }

    console.log(`🔍 [Stock Market] Searching for mutual fund: ${query}`);
    
    const mutualFundData = await indianStockAPI.searchMutualFund(query.trim());
    
    console.log(`✅ [Stock Market] Mutual fund data retrieved for: ${query}`);
    
    res.json({
      success: true,
      data: mutualFundData,
      message: 'Mutual fund data retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error searching mutual fund:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve mutual fund data',
      error: error.message
    });
  }
};

/**
 * Get comprehensive mutual funds data
 * GET /api/stock-market/mutual-funds
 */
const getMutualFunds = async (req, res) => {
  try {
    console.log(`📊 [Stock Market] Fetching mutual funds data`);
    
    const mutualFundsData = await indianStockAPI.getMutualFunds();
    
    console.log(`✅ [Stock Market] Mutual funds data retrieved successfully`);
    
    res.json({
      success: true,
      data: mutualFundsData,
      message: 'Mutual funds data retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error fetching mutual funds:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve mutual funds data',
      error: error.message
    });
  }
};

/**
 * Get IPO data
 * GET /api/stock-market/ipo
 */
const getIPOData = async (req, res) => {
  try {
    console.log(`📊 [Stock Market] Fetching IPO data`);
    
    const ipoData = await indianStockAPI.getIPOData();
    
    console.log(`✅ [Stock Market] IPO data retrieved successfully`);
    
    res.json({
      success: true,
      data: ipoData,
      message: 'IPO data retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error fetching IPO data:`, error.message);
    
    const status = error.status || 500;
    const message = error.status === 400 ? 'IPO data temporarily unavailable' : 'Failed to retrieve IPO data';
    
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Get trending stocks
 * GET /api/stock-market/trending
 */
const getTrendingStocks = async (req, res) => {
  try {
    console.log(`📊 [Stock Market] Fetching trending stocks`);
    
    const trendingData = await indianStockAPI.getTrendingStocks();
    
    console.log(`✅ [Stock Market] Trending stocks data retrieved successfully`);
    
    res.json({
      success: true,
      data: trendingData,
      message: 'Trending stocks data retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error fetching trending stocks:`, error.message);
    
    const status = error.status || 500;
    const message = error.status === 400 ? 'Trending data temporarily unavailable' : 'Failed to retrieve trending stocks data';
    
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Get 52-week high/low data
 * GET /api/stock-market/52-week-high-low
 */
const get52WeekHighLow = async (req, res) => {
  try {
    console.log(`📊 [Stock Market] Fetching 52-week high/low data`);
    
    const highLowData = await indianStockAPI.get52WeekHighLow();
    
    console.log(`✅ [Stock Market] 52-week high/low data retrieved successfully`);
    
    res.json({
      success: true,
      data: highLowData,
      message: '52-week high/low data retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error fetching 52-week high/low data:`, error.message);
    
    const status = error.status || 500;
    const message = error.status === 400 ? '52-week data temporarily unavailable' : 'Failed to retrieve 52-week high/low data';
    
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Get most active stocks
 * GET /api/stock-market/most-active
 */
const getMostActiveStocks = async (req, res) => {
  try {
    const { exchange = 'both' } = req.query; // 'nse', 'bse', or 'both'
    
    console.log(`📊 [Stock Market] Fetching most active stocks for exchange: ${exchange}`);
    
    let mostActiveData = {};
    
    if (exchange === 'nse' || exchange === 'both') {
      mostActiveData.nse = await indianStockAPI.getNSEMostActive();
    }
    
    if (exchange === 'bse' || exchange === 'both') {
      mostActiveData.bse = await indianStockAPI.getBSEMostActive();
    }
    
    console.log(`✅ [Stock Market] Most active stocks data retrieved successfully`);
    
    res.json({
      success: true,
      data: mostActiveData,
      message: 'Most active stocks data retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error fetching most active stocks:`, error.message);
    
    const status = error.status || 500;
    const message = error.status === 400 ? 'Most active data temporarily unavailable' : 'Failed to retrieve most active stocks data';
    
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Get price shockers
 * GET /api/stock-market/price-shockers
 */
const getPriceShockers = async (req, res) => {
  try {
    console.log(`📊 [Stock Market] Fetching price shockers`);
    
    const shockersData = await indianStockAPI.getPriceShockers();
    
    console.log(`✅ [Stock Market] Price shockers data retrieved successfully`);
    
    res.json({
      success: true,
      data: shockersData,
      message: 'Price shockers data retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error fetching price shockers:`, error.message);
    
    const status = error.status || 500;
    const message = error.status === 400 ? 'Price shockers data temporarily unavailable' : 'Failed to retrieve price shockers data';
    
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Get historical data for a stock
 * GET /api/stock-market/historical-data
 */
const getHistoricalData = async (req, res) => {
  try {
    const { stockName, period = '1yr', filter = 'price' } = req.query;
    
    if (!stockName || typeof stockName !== 'string' || stockName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock name is required and must be a non-empty string'
      });
    }

    console.log(`📊 [Stock Market] Fetching historical data for: ${stockName}, period: ${period}, filter: ${filter}`);
    
    const historicalData = await indianStockAPI.getHistoricalData(stockName.trim(), period, filter);
    
    console.log(`✅ [Stock Market] Historical data retrieved for: ${stockName}`);
    
    res.json({
      success: true,
      data: historicalData,
      message: 'Historical data retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error fetching historical data:`, error.message);
    
    const status = error.status || 500;
    const message = error.status === 400 ? 'Historical data not available for this stock' : 'Failed to retrieve historical data';
    
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Get analyst target prices for a stock
 * GET /api/stock-market/stock-target-price
 */
const getStockTargetPrice = async (req, res) => {
  try {
    const { stockId } = req.query;
    
    if (!stockId || typeof stockId !== 'string' || stockId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock ID is required and must be a non-empty string'
      });
    }

    console.log(`📊 [Stock Market] Fetching target price for stock ID: ${stockId}`);
    
    const targetPriceData = await indianStockAPI.getStockTargetPrice(stockId.trim());
    
    console.log(`✅ [Stock Market] Target price data retrieved for stock ID: ${stockId}`);
    
    res.json({
      success: true,
      data: targetPriceData,
      message: 'Target price data retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error fetching target price:`, error.message);
    
    const status = error.status || 500;
    const message = error.status === 400 ? 'Target price data not available for this stock' : 'Failed to retrieve target price data';
    
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Get comprehensive market overview
 * GET /api/stock-market/overview
 */
const getMarketOverview = async (req, res) => {
  try {
    console.log(`📊 [Stock Market] Fetching comprehensive market overview`);
    
    const overviewData = await indianStockAPI.getMarketOverview();
    
    console.log(`✅ [Stock Market] Market overview retrieved successfully`);
    
    res.json({
      success: true,
      data: overviewData,
      message: 'Market overview retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error fetching market overview:`, error.message);
    
    const status = error.status || 500;
    const message = error.status === 400 ? 'Market overview temporarily unavailable' : 'Failed to retrieve market overview';
    
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
};

/**
 * Clear cache
 * POST /api/stock-market/clear-cache
 */
const clearCache = async (req, res) => {
  try {
    const { pattern } = req.body;
    
    console.log(`🗑️ [Stock Market] Clearing cache${pattern ? ` for pattern: ${pattern}` : ''}`);
    
    indianStockAPI.clearCache(pattern);
    
    const cacheStats = indianStockAPI.getCacheStats();
    
    console.log(`✅ [Stock Market] Cache cleared successfully`);
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      cacheStats
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error clearing cache:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
};

/**
 * Get cache statistics
 * GET /api/stock-market/cache-stats
 */
const getCacheStats = async (req, res) => {
  try {
    console.log(`📊 [Stock Market] Fetching cache statistics`);
    
    const cacheStats = indianStockAPI.getCacheStats();
    
    console.log(`✅ [Stock Market] Cache statistics retrieved successfully`);
    
    res.json({
      success: true,
      data: cacheStats,
      message: 'Cache statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error fetching cache statistics:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache statistics',
      error: error.message
    });
  }
};

/**
 * Get latest financial news
 * GET /api/stock-market/news
 */
const getNews = async (req, res) => {
  try {
    console.log(`📰 [Stock Market] Fetching news data`);
    
    const news = await indianStockAPI.getNews();
    
    console.log(`✅ [Stock Market] News data retrieved successfully`);
    
    res.json({
      success: true,
      data: news,
      message: 'News data retrieved successfully'
    });
    
  } catch (error) {
    console.error(`❌ [Stock Market] Error fetching news:`, error.message);
    
    const status = error.status || 500;
    const message = error.status === 400 ? 'News data temporarily unavailable' : 'Failed to retrieve news data';
    
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
};

module.exports = {
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
};
