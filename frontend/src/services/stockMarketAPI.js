/**
 * FILE LOCATION: frontend/src/services/stockMarketAPI.js
 * 
 * Frontend service for Stock Market API that provides access to
 * real-time stock data, mutual funds, IPOs, and market analytics.
 * Handles API calls, data formatting, and error handling for the dashboard.
 */

import api from './api';

// ============================================================================
// STOCK SEARCH & INFORMATION FUNCTIONS
// ============================================================================

/**
 * Search for stock information by company name
 * @param {string} companyName - Company name to search for
 * @returns {Promise<Object>} Stock data with success status
 */
export const searchStock = async (companyName) => {
  try {
    console.log(`🔍 [Stock Market API] Searching for stock: ${companyName}`);
    
    const response = await api.get('/stock-market/search-stock', {
      params: { companyName }
    });
    
    console.log(`✅ [Stock Market API] Stock data retrieved for: ${companyName}`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error searching stock:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve stock data',
      error: error.message
    };
  }
};

/**
 * Search for mutual funds by name or AMC
 * @param {string} query - Search query for mutual fund
 * @returns {Promise<Object>} Mutual fund data with success status
 */
export const searchMutualFund = async (query) => {
  try {
    console.log(`🔍 [Stock Market API] Searching for mutual fund: ${query}`);
    
    const response = await api.get('/stock-market/search-mutual-fund', {
      params: { query }
    });
    
    console.log(`✅ [Stock Market API] Mutual fund data retrieved for: ${query}`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error searching mutual fund:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve mutual fund data',
      error: error.message
    };
  }
};

/**
 * Get comprehensive mutual funds data by category
 * @returns {Promise<Object>} Mutual funds data with success status
 */
export const getMutualFunds = async () => {
  try {
    console.log(`📊 [Stock Market API] Fetching mutual funds data`);
    
    const response = await api.get('/stock-market/mutual-funds');
    
    console.log(`✅ [Stock Market API] Mutual funds data retrieved successfully`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error fetching mutual funds:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve mutual funds data',
      error: error.message
    };
  }
};

// ============================================================================
// IPO & MARKET DATA FUNCTIONS
// ============================================================================

/**
 * Get IPO data (upcoming, active, listed, closed)
 * @returns {Promise<Object>} IPO data with success status
 */
export const getIPOData = async () => {
  try {
    console.log(`📊 [Stock Market API] Fetching IPO data`);
    
    const response = await api.get('/stock-market/ipo');
    
    console.log(`✅ [Stock Market API] IPO data retrieved successfully`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error fetching IPO data:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve IPO data',
      error: error.message
    };
  }
};

/**
 * Get latest financial news
 * @returns {Promise<Object>} News data with success status
 */
export const getNews = async () => {
  try {
    console.log(`📰 [Stock Market API] Fetching news data`);
    
    const response = await api.get('/stock-market/news');
    
    console.log(`✅ [Stock Market API] News data retrieved successfully`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error fetching news data:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve news data',
      error: error.message
    };
  }
};

/**
 * Get trending stocks (top gainers/losers)
 * @returns {Promise<Object>} Trending stocks data with success status
 */
export const getTrendingStocks = async () => {
  try {
    console.log(`📊 [Stock Market API] Fetching trending stocks`);
    
    const response = await api.get('/stock-market/trending');
    
    console.log(`✅ [Stock Market API] Trending stocks data retrieved successfully`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error fetching trending stocks:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve trending stocks data',
      error: error.message
    };
  }
};

/**
 * Get 52-week high/low data
 * @returns {Promise<Object>} 52-week high/low data with success status
 */
export const get52WeekHighLow = async () => {
  try {
    console.log(`📊 [Stock Market API] Fetching 52-week high/low data`);
    
    const response = await api.get('/stock-market/52-week-high-low');
    
    console.log(`✅ [Stock Market API] 52-week high/low data retrieved successfully`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error fetching 52-week high/low data:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve 52-week high/low data',
      error: error.message
    };
  }
};

/**
 * Get most active stocks by exchange
 * @param {string} exchange - Exchange type ('nse', 'bse', or 'both')
 * @returns {Promise<Object>} Most active stocks data with success status
 */
export const getMostActiveStocks = async (exchange = 'both') => {
  try {
    console.log(`📊 [Stock Market API] Fetching most active stocks for exchange: ${exchange}`);
    
    const response = await api.get('/stock-market/most-active', {
      params: { exchange }
    });
    
    console.log(`✅ [Stock Market API] Most active stocks data retrieved successfully`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error fetching most active stocks:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve most active stocks data',
      error: error.message
    };
  }
};

/**
 * Get price shockers (stocks with significant price movements)
 * @returns {Promise<Object>} Price shockers data with success status
 */
export const getPriceShockers = async () => {
  try {
    console.log(`📊 [Stock Market API] Fetching price shockers`);
    
    const response = await api.get('/stock-market/price-shockers');
    
    console.log(`✅ [Stock Market API] Price shockers data retrieved successfully`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error fetching price shockers:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve price shockers data',
      error: error.message
    };
  }
};

// ============================================================================
// HISTORICAL DATA & ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Get historical data for a stock
 * @param {string} stockName - Stock symbol/name
 * @param {string} period - Time period (1m, 6m, 1yr, 3yr, 5yr, 10yr, max)
 * @param {string} filter - Data filter (price, pe, sm, evebitda, ptb, mcs)
 * @returns {Promise<Object>} Historical data with success status
 */
export const getHistoricalData = async (stockName, period = '1yr', filter = 'price') => {
  try {
    console.log(`📊 [Stock Market API] Fetching historical data for: ${stockName}, period: ${period}, filter: ${filter}`);
    
    const response = await api.get('/stock-market/historical-data', {
      params: { stockName, period, filter }
    });
    
    console.log(`✅ [Stock Market API] Historical data retrieved for: ${stockName}`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error fetching historical data:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve historical data',
      error: error.message
    };
  }
};

/**
 * Get analyst target prices for a stock
 * @param {string} stockId - Stock ID
 * @returns {Promise<Object>} Target price data with success status
 */
export const getStockTargetPrice = async (stockId) => {
  try {
    console.log(`📊 [Stock Market API] Fetching target price for stock ID: ${stockId}`);
    
    const response = await api.get('/stock-market/stock-target-price', {
      params: { stockId }
    });
    
    console.log(`✅ [Stock Market API] Target price data retrieved for stock ID: ${stockId}`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error fetching target price:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve target price data',
      error: error.message
    };
  }
};

// ============================================================================
// MARKET OVERVIEW & UTILITY FUNCTIONS
// ============================================================================

/**
 * Get comprehensive market overview (combines multiple endpoints)
 * @returns {Promise<Object>} Market overview data with success status
 */
export const getMarketOverview = async () => {
  try {
    console.log(`📊 [Stock Market API] Fetching comprehensive market overview`);
    
    const response = await api.get('/stock-market/overview');
    
    console.log(`✅ [Stock Market API] Market overview retrieved successfully`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error fetching market overview:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve market overview',
      error: error.message
    };
  }
};

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics with success status
 */
export const getCacheStats = async () => {
  try {
    console.log(`📊 [Stock Market API] Fetching cache statistics`);
    
    const response = await api.get('/stock-market/cache-stats');
    
    console.log(`✅ [Stock Market API] Cache statistics retrieved successfully`);
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error fetching cache statistics:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to retrieve cache statistics',
      error: error.message
    };
  }
};

/**
 * Clear cache
 * @param {string} pattern - Optional pattern to clear specific cache entries
 * @returns {Promise<Object>} Cache clear result with success status
 */
export const clearCache = async (pattern = null) => {
  try {
    console.log(`🗑️ [Stock Market API] Clearing cache${pattern ? ` for pattern: ${pattern}` : ''}`);
    
    const response = await api.post('/stock-market/clear-cache', {
      pattern
    });
    
    console.log(`✅ [Stock Market API] Cache cleared successfully`);
    
    return {
      success: true,
      data: response.data.cacheStats,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Error clearing cache:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to clear cache',
      error: error.message
    };
  }
};

/**
 * Health check for stock market API
 * @returns {Promise<Object>} Health check result with success status
 */
export const checkStockMarketHealth = async () => {
  try {
    console.log(`🏥 [Stock Market API] Checking health status`);
    
    const response = await api.get('/stock-market/health');
    
    console.log(`✅ [Stock Market API] Health check successful`);
    
    return {
      success: true,
      data: response.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`❌ [Stock Market API] Health check failed:`, error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Stock Market API health check failed',
      error: error.message
    };
  }
};

// ============================================================================
// DATA FORMATTING UTILITIES
// ============================================================================

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'INR')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (!amount || isNaN(amount)) return `${currency === 'INR' ? '₹' : '$'}0`;
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format percentage for display
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 2) => {
  // Handle null, undefined, empty string, or non-numeric values
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
    return '0%';
  }
  
  // Convert to number and ensure it's valid
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return '0%';
  }
  
  // Handle edge cases
  if (!isFinite(numValue)) {
    return '0%';
  }
  
  return `${numValue.toFixed(decimals)}%`;
};

/**
 * Format large numbers with K, M, B suffixes
 * @param {number} value - Number to format
 * @returns {string} Formatted number string
 */
export const formatLargeNumber = (value) => {
  // Handle null, undefined, empty string, or non-numeric values
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
    return '0';
  }
  
  // Convert to number and ensure it's valid
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return '0';
  }
  
  // Handle edge cases
  if (!isFinite(numValue)) {
    return '0';
  }
  
  if (numValue >= 1000000000) {
    return `${(numValue / 1000000000).toFixed(2)}B`;
  } else if (numValue >= 1000000) {
    return `${(numValue / 1000000).toFixed(2)}M`;
  } else if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(2)}K`;
  }
  
  return numValue.toString();
};

/**
 * Get color class based on percentage change
 * @param {number} change - Percentage change value
 * @returns {string} Tailwind CSS color class
 */
export const getChangeColor = (change) => {
  // Handle null, undefined, empty string, or non-numeric values
  if (change === null || change === undefined || change === '' || isNaN(Number(change))) {
    return 'text-gray-500';
  }
  
  // Convert to number and ensure it's valid
  const numChange = Number(change);
  if (isNaN(numChange)) {
    return 'text-gray-500';
  }
  
  // Handle edge cases
  if (!isFinite(numChange)) {
    return 'text-gray-500';
  }
  
  if (numChange > 0) return 'text-green-600';
  if (numChange < 0) return 'text-red-600';
  return 'text-gray-500';
};

/**
 * Get trend icon based on percentage change
 * @param {number} change - Percentage change value
 * @returns {string} Icon name
 */
export const getTrendIcon = (change) => {
  // Handle null, undefined, empty string, or non-numeric values
  if (change === null || change === undefined || change === '' || isNaN(Number(change))) {
    return 'Minus';
  }
  
  // Convert to number and ensure it's valid
  const numChange = Number(change);
  if (isNaN(numChange)) {
    return 'Minus';
  }
  
  // Handle edge cases
  if (!isFinite(numChange)) {
    return 'Minus';
  }
  
  if (numChange > 0) return 'TrendingUp';
  if (numChange < 0) return 'TrendingDown';
  return 'Minus';
};

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const stockMarketAPI = {
  // Search functions
  searchStock,
  searchMutualFund,
  getMutualFunds,
  
  // Market data functions
  getIPOData,
  getNews,
  getTrendingStocks,
  get52WeekHighLow,
  getMostActiveStocks,
  getPriceShockers,
  
  // Analytics functions
  getHistoricalData,
  getStockTargetPrice,
  
  // Overview functions
  getMarketOverview,
  
  // Utility functions
  getCacheStats,
  clearCache,
  checkStockMarketHealth,
  
  // Formatting utilities
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
  getChangeColor,
  getTrendIcon
};

export default stockMarketAPI;
