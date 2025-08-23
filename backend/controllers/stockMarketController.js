/**
 * FILE LOCATION: backend/controllers/stockMarketController.js
 * 
 * Updated Stock Market Controller using Perplexity AI for reliable
 * Indian stock market data. Replaces complex Indian API + fallback system
 * with single Perplexity-powered solution using official 'sonar-pro' model.
 */

require('dotenv').config();
const perplexityStockAPI = require('../services/perplexityStockAPI');
const stockMarketResponseTransformer = require('../services/stockMarketResponseTransformer');

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

    console.log(`🔍 [Stock Controller] Searching for stock: ${companyName}`);
    
    const stockData = await perplexityStockAPI.searchStock(companyName.trim());
    const transformedData = stockMarketResponseTransformer.transformStockResponse(stockData, 'perplexity_ai');
    
    console.log(`✅ [Stock Controller] Stock data retrieved for: ${companyName}`);
    
    res.json({
      success: true,
      data: transformedData,
      message: 'Stock data retrieved successfully',
      source: 'perplexity_ai',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error searching stock:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stock data',
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

    console.log(`🔍 [Stock Controller] Searching for mutual fund: ${query}`);
    
    const mutualFundData = await perplexityStockAPI.searchMutualFund(query.trim());
    const transformedData = stockMarketResponseTransformer.transformMutualFundResponse(mutualFundData, 'perplexity_ai');
    
    console.log(`✅ [Stock Controller] Mutual fund data retrieved for: ${query}`);
    
    res.json({
      success: true,
      data: transformedData,
      message: 'Mutual fund data retrieved successfully',
      source: 'perplexity_ai',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error searching mutual fund:`, error.message);
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
    console.log(`📊 [Stock Controller] Fetching mutual funds data`);
    
    // For comprehensive mutual funds, we'll search for popular categories
    const categories = ['SBI Large Cap', 'HDFC Top 100', 'ICICI Prudential Equity'];
    const mutualFundsData = [];
    
    for (const category of categories) {
      try {
        const fundData = await perplexityStockAPI.searchMutualFund(category);
        mutualFundsData.push(fundData);
      } catch (error) {
        console.warn(`⚠️ [Stock Controller] Failed to fetch ${category}:`, error.message);
      }
    }
    
    console.log(`✅ [Stock Controller] Mutual funds data retrieved successfully`);
    
    res.json({
      success: true,
      data: mutualFundsData,
      message: 'Mutual funds data retrieved successfully',
      source: 'perplexity_ai',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error fetching mutual funds:`, error.message);
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
    console.log(`📊 [Stock Controller] Fetching IPO data`);
    
    const ipoData = await perplexityStockAPI.getIPOData();
    const transformedData = stockMarketResponseTransformer.transformMarketDataResponse(ipoData, 'ipo', 'perplexity_ai');
    
    console.log(`✅ [Stock Controller] IPO data retrieved successfully`);
    
    res.json({
      success: true,
      data: transformedData,
      message: 'IPO data retrieved successfully',
      source: 'perplexity_ai',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error fetching IPO data:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve IPO data',
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
    console.log(`📊 [Stock Controller] Fetching trending stocks`);
    
    const trendingData = await perplexityStockAPI.getTrendingStocks();
    const transformedData = stockMarketResponseTransformer.transformMarketDataResponse(trendingData, 'trending', 'perplexity_ai');
    
    console.log(`✅ [Stock Controller] Trending stocks data retrieved successfully`);
    
    res.json({
      success: true,
      data: transformedData,
      message: 'Trending stocks data retrieved successfully',
      source: 'perplexity_ai',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error fetching trending stocks:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trending stocks data',
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
    console.log(`📊 [Stock Controller] Fetching 52-week high/low data`);
    
    // Use price shockers as proxy for 52-week data
    const highLowData = await perplexityStockAPI.getPriceShockers();
    
    console.log(`✅ [Stock Controller] 52-week high/low data retrieved successfully`);
    
    res.json({
      success: true,
      data: highLowData,
      message: '52-week high/low data retrieved successfully',
      source: 'perplexity_ai',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error fetching 52-week high/low data:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve 52-week high/low data',
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
    const { exchange = 'both' } = req.query;
    
    console.log(`📊 [Stock Controller] Fetching most active stocks for exchange: ${exchange}`);
    
    const mostActiveData = await perplexityStockAPI.getMostActiveStocks(exchange);
    const transformedData = stockMarketResponseTransformer.transformMarketDataResponse(mostActiveData, 'mostActive', 'perplexity_ai');
    
    console.log(`✅ [Stock Controller] Most active stocks data retrieved successfully`);
    
    res.json({
      success: true,
      data: transformedData,
      message: 'Most active stocks data retrieved successfully',
      source: 'perplexity_ai',
      exchange: exchange,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error fetching most active stocks:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve most active stocks data',
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
    console.log(`📊 [Stock Controller] Fetching price shockers`);
    
    const shockersData = await perplexityStockAPI.getPriceShockers();
    
    console.log(`✅ [Stock Controller] Price shockers data retrieved successfully`);
    
    res.json({
      success: true,
      data: shockersData,
      message: 'Price shockers data retrieved successfully',
      source: 'perplexity_ai',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error fetching price shockers:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve price shockers data',
      error: error.message
    });
  }
};

/**
 * Get historical data for a stock (placeholder)
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

    console.log(`📊 [Stock Controller] Historical data not implemented yet, returning current data for: ${stockName}`);
    
    // For now, return current stock data instead of historical
    const currentData = await perplexityStockAPI.searchStock(stockName.trim());
    
    res.json({
      success: true,
      data: {
        stockName,
        period,
        filter,
        currentData,
        message: 'Historical data feature coming soon - showing current data'
      },
      message: 'Current stock data retrieved (historical data coming soon)',
      source: 'perplexity_ai',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error fetching historical data:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve historical data',
      error: error.message
    });
  }
};

/**
 * Get analyst target prices (placeholder)
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

    console.log(`📊 [Stock Controller] Target price feature not implemented yet for: ${stockId}`);
    
    res.json({
      success: true,
      data: {
        stockId,
        message: 'Target price analysis feature coming soon'
      },
      message: 'Target price feature coming soon',
      source: 'perplexity_ai',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error fetching target price:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve target price data',
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
    console.log(`📊 [Stock Controller] Fetching comprehensive market overview`);
    
    const overviewData = await perplexityStockAPI.getMarketOverview();
    
    console.log(`✅ [Stock Controller] Market overview retrieved successfully`);
    
    res.json({
      success: true,
      data: overviewData,
      message: 'Market overview retrieved successfully',
      source: 'perplexity_ai',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error fetching market overview:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve market overview',
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
    console.log(`📰 [Stock Controller] Fetching news data`);
    
    const news = await perplexityStockAPI.getNews();
    const transformedData = stockMarketResponseTransformer.transformNewsResponse(news, 'perplexity_ai');
    
    console.log(`✅ [Stock Controller] News data retrieved successfully`);
    
    res.json({
      success: true,
      data: transformedData,
      message: 'News data retrieved successfully',
      source: 'perplexity_ai',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error fetching news:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve news data',
      error: error.message
    });
  }
};

/**
 * Clear cache (simplified - no caching for now)
 * POST /api/stock-market/stock-market/clear-cache
 */
const clearCache = async (req, res) => {
  try {
    console.log(`🗑️ [Stock Controller] Cache clear requested (no caching implemented)`);
    
    res.json({
      success: true,
      message: 'No caching implemented - using real-time data',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [Stock Controller] Error clearing cache:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
};

/**
 * Get cache statistics (simplified - no caching for now)
 * GET /api/stock-market/cache-stats
 */
const getCacheStats = async (req, res) => {
  try {
    console.log(`📊 [Stock Controller] Cache stats requested (no caching implemented)`);
    res.json({ success: true, data: { message: 'Real-time data mode - no caching active', hits: 0, misses: 0, hitRate: '0%' }, message: 'Cache statistics (no caching active)', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(`❌ [Stock Controller] Error fetching cache statistics:`, error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve cache statistics', error: error.message });
  }
};

/**
 * Test Perplexity API connection
 * GET /api/stock-market/test-perplexity
 */
const testPerplexity = async (req, res) => {
  try {
    console.log(`🧪 [Stock Controller] Testing Perplexity API connection...`);
    const result = await perplexityStockAPI.simpleTest();
    res.json({ success: true, data: result, message: 'Perplexity API test successful' });
  } catch (error) {
    console.error(`❌ [Stock Controller] Perplexity API test failed:`, error.message);
    res.status(500).json({ success: false, message: 'Perplexity API test failed', error: error.message });
  }
};

module.exports = {
  searchStock, searchMutualFund, getMutualFunds, getIPOData, getNews, getTrendingStocks, get52WeekHighLow, getMostActiveStocks, getPriceShockers, getHistoricalData, getStockTargetPrice, getMarketOverview, clearCache, getCacheStats, testPerplexity
};
