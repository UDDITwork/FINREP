/**
 * FILE LOCATION: backend/services/indianStockAPI.js
 * 
 * Comprehensive Indian Stock Market API service that provides access to
 * real-time stock data, mutual funds, IPOs, and market analytics.
 * Handles authentication, rate limiting, data caching, and seamless Claude AI fallback.
 */

// Load environment variables
require('dotenv').config();

const axios = require('axios');
const NodeCache = require('node-cache');
const claudeAIFallbackService = require('./claudeAIFallbackService');
const stockMarketResponseTransformer = require('./stockMarketResponseTransformer');
const stockMarketMonitoringService = require('./stockMarketMonitoringService');

// Initialize cache with 5-minute TTL for most data, 1-minute for real-time data
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default
  checkperiod: 60 // Check for expired keys every minute
});

class IndianStockAPI {
  constructor() {
    this.baseURL = 'https://stock.indianapi.in';
    this.apiKey = process.env.INDIAN_API;
    
    if (!this.apiKey) {
      console.error('❌ _INDIAN_API key not found in environment variables');
      throw new Error('Indian Stock API key is required');
    }

    // Create axios instance with default configuration
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'FinancialPlanner/1.0'
      }
    });

    // Add request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🚀 [Indian Stock API] Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ [Indian Stock API] Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ [Indian Stock API] Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ [Indian Stock API] Response Error: ${error.response?.status} ${error.config?.url}`, {
          message: error.response?.data?.message || error.message,
          status: error.response?.status
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make a cached API request with automatic Claude AI fallback
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {number} ttl - Cache TTL in seconds (default: 300)
   * @param {string} fallbackType - Type of fallback data needed
   * @returns {Promise<Object>} API response data
   */
  async makeCachedRequest(endpoint, params = {}, ttl = 300, fallbackType = 'basic') {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    const startTime = Date.now();
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`📦 [Indian Stock API] Cache hit for: ${endpoint}`);
      stockMarketMonitoringService.recordCachePerformance(true, Date.now() - startTime);
      return cachedData;
    }
    
    stockMarketMonitoringService.recordCachePerformance(false, Date.now() - startTime);

    try {
      console.log(`🌐 [Indian Stock API] Fetching fresh data: ${endpoint}`);
      const apiStartTime = Date.now();
      stockMarketMonitoringService.recordAPICall('indian', endpoint, apiStartTime);
      
      const response = await this.api.get(endpoint, { params });
      
      // Record successful API call
      stockMarketMonitoringService.recordAPISuccess('indian', endpoint);
      
      // Transform and cache the successful response
      const transformedData = this.transformResponse(response.data, endpoint, fallbackType, 'indian_api');
      cache.set(cacheKey, transformedData, ttl);
      
      // Assess data quality
      const isDataValid = this.assessDataQuality(transformedData, endpoint);
      stockMarketMonitoringService.recordDataQuality('indian', isDataValid, isDataValid ? 90 : 60);
      
      return transformedData;
    } catch (error) {
      console.warn(`⚠️ [Indian Stock API] Primary API failed for ${endpoint}, attempting Claude AI fallback...`);
      
      // Record API failure
      const failureReason = error.response?.status ? `HTTP ${error.response.status}` : error.message;
      stockMarketMonitoringService.recordAPIFailure('indian', endpoint, failureReason);
      
      // Attempt Claude AI fallback
      try {
        const fallbackStartTime = Date.now();
        stockMarketMonitoringService.recordAPICall('claude', endpoint, fallbackStartTime);
        
        const fallbackData = await this.getClaudeAIFallback(endpoint, params, fallbackType, error);
        
        if (fallbackData.success) {
          console.log(`✅ [Indian Stock API] Claude AI fallback successful for: ${endpoint}`);
          
          // Record successful fallback
          stockMarketMonitoringService.recordAPISuccess('claude', endpoint);
          
          // Transform fallback data and cache with shorter TTL
          const transformedFallbackData = this.transformResponse(fallbackData.data, endpoint, fallbackType, 'claude_ai_fallback');
          const fallbackTTL = Math.min(ttl, 180); // Max 3 minutes for fallback data
          cache.set(cacheKey, transformedFallbackData, fallbackTTL);
          
          // Assess fallback data quality
          const isFallbackDataValid = this.assessDataQuality(transformedFallbackData, endpoint);
          stockMarketMonitoringService.recordDataQuality('claude', isFallbackDataValid, isFallbackDataValid ? 85 : 70);
          
          return transformedFallbackData;
        } else {
          throw new Error(`Claude AI fallback failed: ${fallbackData.error}`);
        }
      } catch (fallbackError) {
        console.error(`❌ [Indian Stock API] Both primary API and Claude AI fallback failed for ${endpoint}:`, fallbackError.message);
        
        // Record fallback failure
        stockMarketMonitoringService.recordAPIFailure('claude', endpoint, fallbackError.message);
        
        // Return cached data if available (even if expired)
        const expiredData = cache.get(cacheKey);
        if (expiredData) {
          console.log(`📦 [Indian Stock API] Serving expired cached data for: ${endpoint}`);
          return expiredData;
        }
        
        // Re-throw the original error if no fallback or cache available
        const status = error?.response?.status || 500;
        const upstreamMessage = error?.response?.data?.message || error.message;
        const wrappedError = new Error(upstreamMessage);
        wrappedError.status = status;
        wrappedError.upstream = true;
        wrappedError.details = error?.response?.data;
        throw wrappedError;
      }
    }
  }

  /**
   * Transform response data to ensure consistent format
   * @param {Object} data - Raw response data
   * @param {string} endpoint - API endpoint
   * @param {string} fallbackType - Type of fallback data
   * @param {string} source - Data source ('indian_api' or 'claude_ai_fallback')
   * @returns {Object} Transformed data
   */
  transformResponse(data, endpoint, fallbackType, source) {
    try {
      // Map endpoints to appropriate transformation methods
      if (endpoint === '/stock') {
        return stockMarketResponseTransformer.transformStockResponse(data, source);
      } else if (endpoint === '/mutual_fund_search') {
        return stockMarketResponseTransformer.transformMutualFundResponse(data, source);
      } else if (endpoint === '/news') {
        return stockMarketResponseTransformer.transformNewsResponse(data, source);
      } else if (['/trending', '/ipo', '/NSE_most_active', '/BSE_most_active', '/price_shockers', '/mutual_funds'].includes(endpoint)) {
        const dataType = this.getDataTypeFromEndpoint(endpoint);
        return stockMarketResponseTransformer.transformMarketDataResponse(data, dataType, source);
      } else {
        // For other endpoints, return as-is with source tagging
        return {
          ...data,
          source: source,
          timestamp: data.timestamp || new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`❌ [Indian Stock API] Error transforming response for ${endpoint}:`, error);
      // Return default data based on endpoint type
      return this.getDefaultDataForEndpoint(endpoint, fallbackType);
    }
  }

  /**
   * Get data type from endpoint for transformation
   * @param {string} endpoint - API endpoint
   * @returns {string} Data type
   */
  getDataTypeFromEndpoint(endpoint) {
    switch (endpoint) {
      case '/trending':
        return 'trending';
      case '/ipo':
        return 'ipo';
      case '/NSE_most_active':
      case '/BSE_most_active':
        return 'mostActive';
      case '/price_shockers':
        return 'priceShockers';
      case '/mutual_funds':
        return 'overview';
      default:
        return 'overview';
    }
  }

  /**
   * Get default data for endpoint when transformation fails
   * @param {string} endpoint - API endpoint
   * @param {string} fallbackType - Type of fallback data
   * @returns {Object} Default data
   */
  getDefaultDataForEndpoint(endpoint, fallbackType) {
    switch (endpoint) {
      case '/stock':
        return stockMarketResponseTransformer.getDefaultStockData();
      case '/mutual_fund_search':
        return stockMarketResponseTransformer.getDefaultMutualFundData();
      case '/news':
        return stockMarketResponseTransformer.getDefaultNewsData();
      case '/trending':
        return stockMarketResponseTransformer.getDefaultMarketData('trending');
      case '/ipo':
        return stockMarketResponseTransformer.getDefaultMarketData('ipo');
      case '/NSE_most_active':
      case '/BSE_most_active':
        return stockMarketResponseTransformer.getDefaultMarketData('mostActive');
      case '/price_shockers':
        return stockMarketResponseTransformer.getDefaultMarketData('priceShockers');
      case '/mutual_funds':
        return stockMarketResponseTransformer.getDefaultMarketData('overview');
      default:
        return { timestamp: new Date().toISOString(), source: 'transformer_default' };
    }
  }

  /**
   * Get Claude AI fallback data based on endpoint and parameters
   * @param {string} endpoint - API endpoint that failed
   * @param {Object} params - Query parameters
   * @param {string} fallbackType - Type of fallback data needed
   * @param {Error} originalError - Original API error
   * @returns {Promise<Object>} Fallback data
   */
  async getClaudeAIFallback(endpoint, params, fallbackType, originalError) {
    try {
      // Map endpoints to appropriate fallback methods
      if (endpoint === '/stock' && params.name) {
        return await claudeAIFallbackService.getStockFallback(params.name, fallbackType, originalError);
      } else if (endpoint === '/news') {
        return await claudeAIFallbackService.getNewsFallback(originalError);
      } else if (endpoint === '/trending') {
        return await claudeAIFallbackService.getMarketDataFallback('trending', originalError);
      } else if (endpoint === '/ipo') {
        return await claudeAIFallbackService.getMarketDataFallback('ipo', originalError);
      } else if (endpoint === '/NSE_most_active' || endpoint === '/BSE_most_active') {
        return await claudeAIFallbackService.getMarketDataFallback('mostActive', originalError);
      } else if (endpoint === '/price_shockers') {
        return await claudeAIFallbackService.getMarketDataFallback('priceShockers', originalError);
      } else if (endpoint === '/mutual_fund_search' && params.query) {
        // For mutual funds, use stock fallback with mutual fund context
        return await claudeAIFallbackService.getStockFallback(params.query, 'mutualFund', originalError);
      } else {
        // Generic fallback for other endpoints
        return await claudeAIFallbackService.getMarketDataFallback('overview', originalError);
      }
    } catch (fallbackError) {
      console.error(`❌ [Indian Stock API] Claude AI fallback error:`, fallbackError.message);
      return {
        success: false,
        error: fallbackError.message
      };
    }
  }

  /**
   * Assess data quality for monitoring purposes
   * @param {Object} data - Response data
   * @param {string} endpoint - API endpoint
   * @returns {boolean} Whether data is valid
   */
  assessDataQuality(data, endpoint) {
    try {
      if (!data) return false;
      
      // Basic validation based on endpoint type
      switch (endpoint) {
        case '/stock':
          return data.companyName && data.currentPrice && data.industry;
        case '/news':
          return Array.isArray(data) && data.length > 0 && data[0].title;
        case '/trending':
          return data.topGainers || data.topLosers;
        case '/ipo':
          return data.upcoming || data.active || data.listed || data.closed;
        case '/mutual_fund_search':
          return data.fundName || data.nav;
        default:
          return true; // Assume valid for other endpoints
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Search for stock information by company name
   * @param {string} companyName - Company name to search for
   * @returns {Promise<Object>} Stock data
   */
  async searchStock(companyName) {
    if (!companyName || typeof companyName !== 'string') {
      throw new Error('Company name is required and must be a string');
    }

    return this.makeCachedRequest('/stock', { name: companyName }, 180, 'detailed');
  }

  /**
   * Search for mutual funds
   * @param {string} query - Search query for mutual fund
   * @returns {Promise<Array>} Array of matching mutual funds
   */
  async searchMutualFund(query) {
    if (!query || typeof query !== 'string') {
      throw new Error('Search query is required and must be a string');
    }

    return this.makeCachedRequest('/mutual_fund_search', { query }, 600, 'mutualFund');
  }

  /**
   * Get comprehensive mutual funds data
   * @returns {Promise<Object>} Mutual funds data by category
   */
  async getMutualFunds() {
    return this.makeCachedRequest('/mutual_funds', {}, 1800, 'overview');
  }

  /**
   * Get IPO data (upcoming, active, listed, closed)
   * @returns {Promise<Object>} IPO data by status
   */
  async getIPOData() {
    return this.makeCachedRequest('/ipo', {}, 300, 'ipo');
  }

  /**
   * Get latest financial news
   * @returns {Promise<Array>} Latest news articles
   */
  async getNews() {
    return this.makeCachedRequest('/news', {}, 180, 'news');
  }

  /**
   * Get trending stocks (top gainers/losers)
   * @returns {Promise<Object>} Trending stocks data
   */
  async getTrendingStocks() {
    return this.makeCachedRequest('/trending', {}, 120, 'trending');
  }

  /**
   * Get 52-week high/low data
   * @returns {Promise<Object>} 52-week high/low stocks
   */
  async get52WeekHighLow() {
    return this.makeCachedRequest('/fetch_52_week_high_low_data', {}, 600, 'overview');
  }

  /**
   * Get most active stocks on NSE
   * @returns {Promise<Array>} Most active NSE stocks
   */
  async getNSEMostActive() {
    return this.makeCachedRequest('/NSE_most_active', {}, 120, 'mostActive');
  }

  /**
   * Get most active stocks on BSE
   * @returns {Promise<Array>} Most active BSE stocks
   */
  async getBSEMostActive() {
    return this.makeCachedRequest('/BSE_most_active', {}, 120, 'mostActive');
  }

  /**
   * Get price shockers (stocks with significant price movements)
   * @returns {Promise<Array>} Price shockers data
   */
  async getPriceShockers() {
    return this.makeCachedRequest('/price_shockers', {}, 180, 'priceShockers');
  }

  /**
   * Get historical data for a stock
   * @param {string} stockName - Stock symbol/name
   * @param {string} period - Time period (1m, 6m, 1yr, 3yr, 5yr, 10yr, max)
   * @param {string} filter - Data filter (price, pe, sm, evebitda, ptb, mcs)
   * @returns {Promise<Object>} Historical data
   */
  async getHistoricalData(stockName, period = '1yr', filter = 'price') {
    if (!stockName) {
      throw new Error('Stock name is required');
    }

    const validPeriods = ['1m', '6m', '1yr', '3yr', '5yr', '10yr', 'max'];
    const validFilters = ['price', 'pe', 'sm', 'evebitda', 'ptb', 'mcs'];

    if (!validPeriods.includes(period)) {
      throw new Error(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
    }

    if (!validFilters.includes(filter)) {
      throw new Error(`Invalid filter. Must be one of: ${validFilters.join(', ')}`);
    }

    return this.makeCachedRequest('/historical_data', {
      stock_name: stockName,
      period,
      filter
    }, 1800); // 30 minutes cache for historical data
  }

  /**
   * Get analyst target prices for a stock
   * @param {string} stockId - Stock ID
   * @returns {Promise<Object>} Analyst recommendations and target prices
   */
  async getStockTargetPrice(stockId) {
    if (!stockId) {
      throw new Error('Stock ID is required');
    }

    return this.makeCachedRequest('/stock_target_price', { stock_id: stockId }, 3600); // 1 hour cache
  }

  /**
   * Get market overview data (combines multiple endpoints)
   * @returns {Promise<Object>} Comprehensive market overview
   */
  async getMarketOverview() {
    try {
      console.log('📊 [Indian Stock API] Fetching market overview...');
      
      const [trending, ipoData, mostActiveNSE, mostActiveBSE] = await Promise.allSettled([
        this.getTrendingStocks(),
        this.getIPOData(),
        this.getNSEMostActive(),
        this.getBSEMostActive()
      ]);

      const overview = {
        trending: trending.status === 'fulfilled' ? trending.value : null,
        ipo: ipoData.status === 'fulfilled' ? ipoData.value : null,
        mostActiveNSE: mostActiveNSE.status === 'fulfilled' ? mostActiveNSE.value : null,
        mostActiveBSE: mostActiveBSE.status === 'fulfilled' ? mostActiveBSE.value : null,
        timestamp: new Date().toISOString()
      };

      console.log('✅ [Indian Stock API] Market overview fetched successfully');
      return overview;
    } catch (error) {
      console.error('❌ [Indian Stock API] Error fetching market overview:', error.message);
      throw error;
    }
  }

  /**
   * Clear cache for specific endpoint or all cache
   * @param {string} pattern - Cache key pattern to clear (optional)
   */
  clearCache(pattern = null) {
    if (pattern) {
      const keys = cache.keys().filter(key => key.includes(pattern));
      keys.forEach(key => cache.del(key));
      console.log(`🗑️ [Indian Stock API] Cleared ${keys.length} cache entries for pattern: ${pattern}`);
    } else {
      cache.flushAll();
      console.log('🗑️ [Indian Stock API] Cleared all cache');
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return cache.getStats();
  }
}

// Create singleton instance
const indianStockAPI = new IndianStockAPI();

module.exports = indianStockAPI;
