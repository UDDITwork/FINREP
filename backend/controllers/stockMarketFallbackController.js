/**
 * FILE LOCATION: backend/controllers/stockMarketFallbackController.js
 * 
 * Fallback Controller that automatically uses Claude AI when the main
 * Indian Stock API fails, ensuring users always get financial data.
 */

const claudeAIFallbackService = require('../services/claudeAIFallbackService');

/**
 * Enhanced stock search with automatic fallback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchStockWithFallback = async (req, res) => {
  const { companyName } = req.query;
  
  if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Company name is required and must be a non-empty string'
    });
  }

  try {
    console.log(`🔍 [Fallback Controller] Searching for stock: ${companyName}`);
    
    // Try to get data from Claude AI fallback
    const fallbackData = await claudeAIFallbackService.getStockFallback(companyName.trim(), 'detailed');
    
    if (fallbackData.success) {
      console.log(`✅ [Fallback Controller] Stock data retrieved via Claude AI for: ${companyName}`);
      
      res.json({
        success: true,
        data: fallbackData.data,
        message: 'Stock data retrieved via Claude AI fallback',
        source: fallbackData.source,
        fallbackUsed: true,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(fallbackData.error || 'Claude AI fallback failed');
    }
    
  } catch (error) {
    console.error(`❌ [Fallback Controller] Error retrieving stock data:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stock data from all sources',
      error: error.message,
      fallbackUsed: false
    });
  }
};

/**
 * Enhanced mutual fund search with automatic fallback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchMutualFundWithFallback = async (req, res) => {
  const { query } = req.query;
  
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required and must be a non-empty string'
    });
  }

  try {
    console.log(`🔍 [Fallback Controller] Searching for mutual fund: ${query}`);
    
    // Try to get data from Claude AI fallback
    const fallbackData = await claudeAIFallbackService.getMarketDataFallback('mutualfund');
    
    if (fallbackData.success) {
      console.log(`✅ [Fallback Controller] Mutual fund data retrieved via Claude AI for: ${query}`);
      
      res.json({
        success: true,
        data: fallbackData.data,
        message: 'Mutual fund data retrieved via Claude AI fallback',
        source: fallbackData.source,
        fallbackUsed: true,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(fallbackData.error || 'Claude AI fallback failed');
    }
    
  } catch (error) {
    console.error(`❌ [Fallback Controller] Error retrieving mutual fund data:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve mutual fund data from all sources',
      error: error.message,
      fallbackUsed: false
    });
  }
};

/**
 * Enhanced IPO data with automatic fallback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getIPODataWithFallback = async (req, res) => {
  try {
    console.log(`📊 [Fallback Controller] Fetching IPO data via Claude AI`);
    
    // Try to get data from Claude AI fallback
    const fallbackData = await claudeAIFallbackService.getMarketDataFallback('ipo');
    
    if (fallbackData.success) {
      console.log(`✅ [Fallback Controller] IPO data retrieved via Claude AI successfully`);
      
      res.json({
        success: true,
        data: fallbackData.data,
        message: 'IPO data retrieved via Claude AI fallback',
        source: fallbackData.source,
        fallbackUsed: true,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(fallbackData.error || 'Claude AI fallback failed');
    }
    
  } catch (error) {
    console.error(`❌ [Fallback Controller] Error fetching IPO data:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve IPO data from all sources',
      error: error.message,
      fallbackUsed: false
    });
  }
};

/**
 * Enhanced news data with automatic fallback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNewsWithFallback = async (req, res) => {
  try {
    console.log(`📰 [Fallback Controller] Fetching news data via Claude AI`);
    
    // Try to get data from Claude AI fallback
    const fallbackData = await claudeAIFallbackService.getNewsFallback();
    
    if (fallbackData.success) {
      console.log(`✅ [Fallback Controller] News data retrieved via Claude AI successfully`);
      
      res.json({
        success: true,
        data: fallbackData.data,
        message: 'News data retrieved via Claude AI fallback',
        source: fallbackData.source,
        fallbackUsed: true,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(fallbackData.error || 'Claude AI fallback failed');
    }
    
  } catch (error) {
    console.error(`❌ [Fallback Controller] Error fetching news data:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve news data from all sources',
      error: error.message,
      fallbackUsed: false
    });
  }
};

/**
 * Enhanced trending stocks with automatic fallback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrendingStocksWithFallback = async (req, res) => {
  try {
    console.log(`📊 [Fallback Controller] Fetching trending stocks via Claude AI`);
    
    // Try to get data from Claude AI fallback
    const fallbackData = await claudeAIFallbackService.getMarketDataFallback('trending');
    
    if (fallbackData.success) {
      console.log(`✅ [Fallback Controller] Trending stocks data retrieved via Claude AI successfully`);
      
      res.json({
        success: true,
        data: fallbackData.data,
        message: 'Trending stocks data retrieved via Claude AI fallback',
        source: fallbackData.source,
        fallbackUsed: true,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(fallbackData.error || 'Claude AI fallback failed');
    }
    
  } catch (error) {
    console.error(`❌ [Fallback Controller] Error fetching trending stocks:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trending stocks data from all sources',
      error: error.message,
      fallbackUsed: false
    });
  }
};

/**
 * Enhanced most active stocks with automatic fallback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMostActiveStocksWithFallback = async (req, res) => {
  const { exchange = 'both' } = req.query;
  
  try {
    console.log(`📊 [Fallback Controller] Fetching most active stocks via Claude AI for exchange: ${exchange}`);
    
    // Try to get data from Claude AI fallback
    const fallbackData = await claudeAIFallbackService.getMarketDataFallback('mostActive');
    
    if (fallbackData.success) {
      console.log(`✅ [Fallback Controller] Most active stocks data retrieved via Claude AI successfully`);
      
      res.json({
        success: true,
        data: fallbackData.data,
        message: 'Most active stocks data retrieved via Claude AI fallback',
        source: fallbackData.source,
        fallbackUsed: true,
        exchange: exchange,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(fallbackData.error || 'Claude AI fallback failed');
    }
    
  } catch (error) {
    console.error(`❌ [Fallback Controller] Error fetching most active stocks:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve most active stocks data from all sources',
      error: error.message,
      fallbackUsed: false
    });
  }
};

/**
 * Enhanced price shockers with automatic fallback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPriceShockersWithFallback = async (req, res) => {
  try {
    console.log(`📊 [Fallback Controller] Fetching price shockers via Claude AI`);
    
    // Try to get data from Claude AI fallback
    const fallbackData = await claudeAIFallbackService.getMarketDataFallback('priceShockers');
    
    if (fallbackData.success) {
      console.log(`✅ [Fallback Controller] Price shockers data retrieved via Claude AI successfully`);
      
      res.json({
        success: true,
        data: fallbackData.data,
        message: 'Price shockers data retrieved via Claude AI fallback',
        source: fallbackData.source,
        fallbackUsed: true,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(fallbackData.error || 'Claude AI fallback failed');
    }
    
  } catch (error) {
    console.error(`❌ [Fallback Controller] Error fetching price shockers:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve price shockers data from all sources',
      error: error.message,
      fallbackUsed: false
    });
  }
};

/**
 * Enhanced market overview with automatic fallback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMarketOverviewWithFallback = async (req, res) => {
  try {
    console.log(`📊 [Fallback Controller] Fetching market overview via Claude AI`);
    
    // Try to get data from Claude AI fallback
    const fallbackData = await claudeAIFallbackService.getMarketDataFallback('overview');
    
    if (fallbackData.success) {
      console.log(`✅ [Fallback Controller] Market overview retrieved via Claude AI successfully`);
      
      res.json({
        success: true,
        data: fallbackData.data,
        message: 'Market overview retrieved via Claude AI fallback',
        source: fallbackData.source,
        fallbackUsed: true,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(fallbackData.error || 'Claude AI fallback failed');
    }
    
  } catch (error) {
    console.error(`❌ [Fallback Controller] Error fetching market overview:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve market overview from all sources',
      error: error.message,
      fallbackUsed: false
    });
  }
};

/**
 * Health check for fallback system
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFallbackHealth = async (req, res) => {
  try {
    console.log(`🏥 [Fallback Controller] Checking fallback system health...`);
    
    const healthStatus = await claudeAIFallbackService.healthCheck();
    
    res.json({
      success: true,
      message: 'Fallback system health check completed',
      fallbackSystem: {
        status: healthStatus.status,
        claudeAI: healthStatus.success ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
      },
      endpoints: {
        stockSearch: '/fallback/search-stock',
        mutualFunds: '/fallback/search-mutual-fund',
        ipo: '/fallback/ipo',
        news: '/fallback/news',
        trending: '/fallback/trending',
        mostActive: '/fallback/most-active',
        priceShockers: '/fallback/price-shockers',
        marketOverview: '/fallback/overview'
      }
    });
    
  } catch (error) {
    console.error(`❌ [Fallback Controller] Health check failed:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Fallback system health check failed',
      error: error.message
    });
  }
};

module.exports = {
  searchStockWithFallback,
  searchMutualFundWithFallback,
  getIPODataWithFallback,
  getNewsWithFallback,
  getTrendingStocksWithFallback,
  getMostActiveStocksWithFallback,
  getPriceShockersWithFallback,
  getMarketOverviewWithFallback,
  getFallbackHealth
};
