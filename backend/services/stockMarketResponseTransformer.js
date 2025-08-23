/**
 * FILE LOCATION: backend/services/stockMarketResponseTransformer.js
 * 
 * Response transformer service that ensures consistent data format
 * regardless of whether data comes from Indian Stock API or Claude AI fallback.
 * This service normalizes all responses to match the expected frontend schema.
 */

class StockMarketResponseTransformer {
  /**
   * Transform stock search response to consistent format
   * @param {Object} data - Raw API response data
   * @param {string} source - Data source ('indian_api' or 'claude_ai_fallback')
   * @returns {Object} Normalized stock data
   */
  transformStockResponse(data, source = 'indian_api') {
    try {
      if (source === 'claude_ai_fallback') {
        return this.transformClaudeAIStockData(data);
      }
      
      // Transform Indian Stock API response
      return this.transformIndianAPIStockData(data);
    } catch (error) {
      console.error('❌ [Response Transformer] Error transforming stock response:', error);
      return this.getDefaultStockData();
    }
  }

  /**
   * Transform mutual fund response to consistent format
   * @param {Object} data - Raw API response data
   * @param {string} source - Data source ('indian_api' or 'claude_ai_fallback')
   * @returns {Object} Normalized mutual fund data
   */
  transformMutualFundResponse(data, source = 'indian_api') {
    try {
      if (source === 'claude_ai_fallback') {
        return this.transformClaudeAIMutualFundData(data);
      }
      
      // Transform Indian Stock API response
      return this.transformIndianAPIMutualFundData(data);
    } catch (error) {
      console.error('❌ [Response Transformer] Error transforming mutual fund response:', error);
      return this.getDefaultMutualFundData();
    }
  }

  /**
   * Transform news response to consistent format
   * @param {Array} data - Raw API response data
   * @param {string} source - Data source ('indian_api' or 'claude_ai_fallback')
   * @returns {Array} Normalized news data
   */
  transformNewsResponse(data, source = 'indian_api') {
    try {
      if (source === 'claude_ai_fallback') {
        return this.transformClaudeAINewsData(data);
      }
      
      // Transform Indian Stock API response
      return this.transformIndianAPINewsData(data);
    } catch (error) {
      console.error('❌ [Response Transformer] Error transforming news response:', error);
      return this.getDefaultNewsData();
    }
  }

  /**
   * Transform market data response to consistent format
   * @param {Object} data - Raw API response data
   * @param {string} dataType - Type of market data
   * @param {string} source - Data source ('indian_api' or 'claude_ai_fallback')
   * @returns {Object} Normalized market data
   */
  transformMarketDataResponse(data, dataType, source = 'indian_api') {
    try {
      if (source === 'claude_ai_fallback') {
        return this.transformClaudeAIMarketData(data, dataType);
      }
      
      // Transform Indian Stock API response
      return this.transformIndianAPIMarketData(data, dataType);
    } catch (error) {
      console.error('❌ [Response Transformer] Error transforming market data response:', error);
      return this.getDefaultMarketData(dataType);
    }
  }

  /**
   * Transform Claude AI stock data to consistent format
   */
  transformClaudeAIStockData(data) {
    return {
      companyName: data.companyName || 'N/A',
      tickerId: data.tickerId || 'N/A',
      currentPrice: {
        BSE: data.currentPrice?.BSE || data.currentPrice || 'N/A',
        NSE: data.currentPrice?.NSE || data.currentPrice || 'N/A'
      },
      percentChange: data.percentChange || 0,
      yearHigh: data.yearHigh || 'N/A',
      yearLow: data.yearLow || 'N/A',
      industry: data.industry || 'N/A',
      keyMetrics: {
        marketCap: data.keyMetrics?.marketCap || 'N/A',
        peRatio: data.keyMetrics?.peRatio || 'N/A'
      },
      companyProfile: {
        description: data.companyProfile?.description || 'N/A'
      },
      timestamp: data.timestamp || new Date().toISOString(),
      source: 'claude_ai_fallback'
    };
  }

  /**
   * Transform Claude AI mutual fund data to consistent format
   */
  transformClaudeAIMutualFundData(data) {
    return {
      fundName: data.fundName || 'N/A',
      nav: data.nav || 'N/A',
      category: data.category || 'N/A',
      assetAllocation: data.assetAllocation || 'N/A',
      expenseRatio: data.expenseRatio || 'N/A',
      fundManager: data.fundManager || 'N/A',
      fundHouse: data.fundHouse || 'N/A',
      timestamp: data.timestamp || new Date().toISOString(),
      source: 'claude_ai_fallback'
    };
  }

  /**
   * Transform Claude AI news data to consistent format
   */
  transformClaudeAINewsData(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }

    return data.map(item => ({
      title: item.title || 'N/A',
      summary: item.summary || 'N/A',
      source: item.source || 'Claude AI',
      pub_date: item.pub_date || item.date || new Date().toISOString(),
      topics: item.topics || item.categories || ['General'],
      url: item.url || '#',
      timestamp: item.timestamp || new Date().toISOString()
    }));
  }

  /**
   * Transform Claude AI market data to consistent format
   */
  transformClaudeAIMarketData(data, dataType) {
    const timestamp = data.timestamp || new Date().toISOString();
    
    switch (dataType) {
      case 'trending':
        return {
          topGainers: data.topGainers || [],
          topLosers: data.topLosers || [],
          timestamp
        };
      case 'ipo':
        return {
          upcoming: data.upcoming || [],
          active: data.active || [],
          listed: data.listed || [],
          closed: data.closed || [],
          timestamp
        };
      case 'mostActive':
        return {
          nse: data.nse || [],
          bse: data.bse || [],
          timestamp
        };
      case 'priceShockers':
        return {
          shockers: data.shockers || [],
          timestamp
        };
      case 'overview':
        return {
          indices: data.indices || [],
          sectors: data.sectors || [],
          marketSentiment: data.marketSentiment || 'neutral',
          timestamp
        };
      default:
        return { ...data, timestamp };
    }
  }

  /**
   * Transform Indian Stock API stock data to consistent format
   */
  transformIndianAPIStockData(data) {
    // This would contain the logic to transform Indian Stock API responses
    // For now, return as-is since we're focusing on fallback integration
    return {
      ...data,
      source: 'indian_stock_api',
      timestamp: data.timestamp || new Date().toISOString()
    };
  }

  /**
   * Transform Indian Stock API mutual fund data to consistent format
   */
  transformIndianAPIMutualFundData(data) {
    return {
      ...data,
      source: 'indian_stock_api',
      timestamp: data.timestamp || new Date().toISOString()
    };
  }

  /**
   * Transform Indian Stock API news data to consistent format
   */
  transformIndianAPINewsData(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }

    return data.map(item => ({
      ...item,
      source: item.source || 'Indian Stock API',
      timestamp: item.timestamp || new Date().toISOString()
    }));
  }

  /**
   * Transform Indian Stock API market data to consistent format
   */
  transformIndianAPIMarketData(data, dataType) {
    return {
      ...data,
      source: 'indian_stock_api',
      timestamp: data.timestamp || new Date().toISOString()
    };
  }

  /**
   * Get default stock data when transformation fails
   */
  getDefaultStockData() {
    return {
      companyName: 'N/A',
      tickerId: 'N/A',
      currentPrice: { BSE: 'N/A', NSE: 'N/A' },
      percentChange: 0,
      yearHigh: 'N/A',
      yearLow: 'N/A',
      industry: 'N/A',
      keyMetrics: { marketCap: 'N/A', peRatio: 'N/A' },
      companyProfile: { description: 'Data temporarily unavailable' },
      timestamp: new Date().toISOString(),
      source: 'transformer_default'
    };
  }

  /**
   * Get default mutual fund data when transformation fails
   */
  getDefaultMutualFundData() {
    return {
      fundName: 'N/A',
      nav: 'N/A',
      category: 'N/A',
      assetAllocation: 'N/A',
      expenseRatio: 'N/A',
      fundManager: 'N/A',
      fundHouse: 'N/A',
      timestamp: new Date().toISOString(),
      source: 'transformer_default'
    };
  }

  /**
   * Get default news data when transformation fails
   */
  getDefaultNewsData() {
    return [{
      title: 'Financial News Temporarily Unavailable',
      summary: 'We are experiencing technical difficulties. Please try again later.',
      source: 'System',
      pub_date: new Date().toISOString(),
      topics: ['General'],
      url: '#',
      timestamp: new Date().toISOString()
    }];
  }

  /**
   * Get default market data when transformation fails
   */
  getDefaultMarketData(dataType) {
    const timestamp = new Date().toISOString();
    
    switch (dataType) {
      case 'trending':
        return { 
          topGainers: [], 
          topLosers: [], 
          timestamp 
        };
      case 'ipo':
        return { 
          upcoming: [], 
          active: [], 
          listed: [], 
          closed: [], 
          timestamp 
        };
      case 'mostActive':
        return { 
          nse: [], 
          bse: [], 
          timestamp 
        };
      case 'priceShockers':
        return { 
          shockers: [], 
          timestamp 
        };
      case 'overview':
        return { 
          indices: [], 
          sectors: [], 
          marketSentiment: 'neutral', 
          timestamp 
        };
      default:
        return { timestamp };
    }
  }
}

// Create singleton instance
const stockMarketResponseTransformer = new StockMarketResponseTransformer();

module.exports = stockMarketResponseTransformer;
