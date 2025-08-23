/**
 * FILE LOCATION: backend/services/stockMarketResponseTransformer.js
 * 
 * Simplified response transformer for Perplexity AI Stock Market data.
 * Ensures consistent data format for frontend components regardless
 * of Perplexity response variations. Uses official 'sonar-pro' model.
 */

class StockMarketResponseTransformer {
  
  /**
   * Transform stock search response to consistent format
   * @param {Object} data - Raw Perplexity response data
   * @param {string} source - Data source (always 'perplexity_ai')
   * @returns {Object} Normalized stock data
   */
  transformStockResponse(data, source = 'perplexity_ai') {
    try {
      // Handle if data is already in correct format
      if (data && data.companyName && data.currentPrice) {
        return {
          ...data,
          source: source,
          timestamp: data.timestamp || new Date().toISOString()
        };
      }

      // Handle various Perplexity response formats
      const transformedData = {
        companyName: data?.companyName || data?.name || 'N/A',
        tickerId: data?.tickerId || data?.symbol || data?.ticker || 'N/A',
        currentPrice: this.normalizePrice(data?.currentPrice),
        percentChange: this.normalizeNumber(data?.percentChange || data?.change || 0),
        yearHigh: this.normalizeNumber(data?.yearHigh || data?.high52Week || data?.fiftyTwoWeekHigh),
        yearLow: this.normalizeNumber(data?.yearLow || data?.low52Week || data?.fiftyTwoWeekLow),
        industry: data?.industry || data?.sector || 'N/A',
        keyMetrics: {
          marketCap: data?.keyMetrics?.marketCap || data?.marketCap || 'N/A',
          peRatio: data?.keyMetrics?.peRatio || data?.peRatio || data?.pe || 'N/A'
        },
        companyProfile: {
          description: data?.companyProfile?.description || data?.description || 'N/A'
        },
        timestamp: data?.timestamp || new Date().toISOString(),
        source: source
      };

      return transformedData;
    } catch (error) {
      console.error('❌ [Response Transformer] Error transforming stock response:', error);
      return this.getDefaultStockData();
    }
  }

  /**
   * Transform mutual fund response to consistent format
   * @param {Object} data - Raw Perplexity response data
   * @param {string} source - Data source
   * @returns {Object} Normalized mutual fund data
   */
  transformMutualFundResponse(data, source = 'perplexity_ai') {
    try {
      return {
        fundName: data?.fundName || data?.schemeName || data?.name || 'N/A',
        nav: this.normalizeNumber(data?.nav || data?.navValue || 0),
        category: data?.category || data?.schemeType || data?.type || 'N/A',
        fundHouse: data?.fundHouse || data?.amc || data?.assetManagementCompany || 'N/A',
        expenseRatio: data?.expenseRatio || data?.totalExpenseRatio || 'N/A',
        fundManager: data?.fundManager || data?.manager || 'N/A',
        assetAllocation: data?.assetAllocation || data?.allocation || 'N/A',
        timestamp: data?.timestamp || new Date().toISOString(),
        source: source
      };
    } catch (error) {
      console.error('❌ [Response Transformer] Error transforming mutual fund response:', error);
      return this.getDefaultMutualFundData();
    }
  }

  /**
   * Transform news response to consistent format
   * @param {Array|Object} data - Raw Perplexity response data
   * @param {string} source - Data source
   * @returns {Array} Normalized news data
   */
  transformNewsResponse(data, source = 'perplexity_ai') {
    try {
      // Ensure data is an array
      const newsArray = Array.isArray(data) ? data : [data];

      return newsArray.map((item, index) => ({
        title: item?.title || item?.headline || `News Item ${index + 1}`,
        summary: item?.summary || item?.description || item?.content || 'No summary available',
        source: item?.source || item?.sourceName || 'Perplexity AI',
        pub_date: item?.pub_date || item?.publishedAt || item?.date || new Date().toISOString(),
        topics: Array.isArray(item?.topics) ? item.topics : 
               Array.isArray(item?.categories) ? item.categories : 
               ['Market News'],
        url: item?.url || item?.link || '#',
        timestamp: item?.timestamp || new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ [Response Transformer] Error transforming news response:', error);
      return this.getDefaultNewsData();
    }
  }

  /**
   * Transform market data response to consistent format
   * @param {Object} data - Raw Perplexity response data
   * @param {string} dataType - Type of market data
   * @param {string} source - Data source
   * @returns {Object} Normalized market data
   */
  transformMarketDataResponse(data, dataType, source = 'perplexity_ai') {
    try {
      const timestamp = data?.timestamp || new Date().toISOString();
      
      switch (dataType) {
        case 'trending':
          return {
            topGainers: this.normalizeStockArray(data?.topGainers || []),
            topLosers: this.normalizeStockArray(data?.topLosers || []),
            timestamp,
            source
          };

        case 'ipo':
          return {
            upcoming: this.normalizeIPOArray(data?.upcoming || []),
            active: this.normalizeIPOArray(data?.active || []),
            listed: this.normalizeIPOArray(data?.listed || []),
            closed: this.normalizeIPOArray(data?.closed || []),
            timestamp,
            source
          };

        case 'mostActive':
          return {
            nse: this.normalizeStockArray(data?.nse || []),
            bse: this.normalizeStockArray(data?.bse || []),
            timestamp,
            source
          };

        case 'priceShockers':
          return Array.isArray(data) ? 
            this.normalizeStockArray(data) : 
            this.normalizeStockArray(data?.shockers || []);

        case 'overview':
          return {
            indices: this.normalizeIndicesArray(data?.indices || []),
            sectors: this.normalizeSectorsArray(data?.sectors || []),
            marketSentiment: data?.marketSentiment || 'neutral',
            timestamp,
            source
          };

        default:
          return { ...data, timestamp, source };
      }
    } catch (error) {
      console.error('❌ [Response Transformer] Error transforming market data response:', error);
      return this.getDefaultMarketData(dataType);
    }
  }

  /**
   * Normalize stock array data
   * @param {Array} stocks - Array of stock objects
   * @returns {Array} Normalized stock array
   */
  normalizeStockArray(stocks) {
    if (!Array.isArray(stocks)) return [];
    
    return stocks.map(stock => ({
      companyName: stock?.companyName || stock?.name || stock?.company || 'N/A',
      tickerId: stock?.tickerId || stock?.symbol || stock?.ticker || 'N/A',
      currentPrice: this.normalizeNumber(stock?.currentPrice || stock?.price || 0),
      percentChange: this.normalizeNumber(stock?.percentChange || stock?.change || 0),
      volume: this.normalizeNumber(stock?.volume || stock?.tradingVolume || 0)
    }));
  }

  /**
   * Normalize IPO array data
   * @param {Array} ipos - Array of IPO objects
   * @returns {Array} Normalized IPO array
   */
  normalizeIPOArray(ipos) {
    if (!Array.isArray(ipos)) return [];
    
    return ipos.map(ipo => ({
      name: ipo?.name || ipo?.companyName || 'N/A',
      symbol: ipo?.symbol || ipo?.tickerId || ipo?.ticker || 'N/A',
      expected_price: ipo?.expected_price || ipo?.priceRange || ipo?.price || 'TBA',
      expected_date: ipo?.expected_date || ipo?.listingDate || ipo?.date || 'TBA',
      min_price: this.normalizeNumber(ipo?.min_price || ipo?.minPrice || 0),
      max_price: this.normalizeNumber(ipo?.max_price || ipo?.maxPrice || 0),
      lot_size: ipo?.lot_size || ipo?.lotSize || ipo?.minimumLot || 'TBA',
      listing_price: this.normalizeNumber(ipo?.listing_price || ipo?.listingPrice || 0),
      current_price: this.normalizeNumber(ipo?.current_price || ipo?.currentPrice || 0)
    }));
  }

  /**
   * Normalize indices array data
   * @param {Array} indices - Array of index objects
   * @returns {Array} Normalized indices array
   */
  normalizeIndicesArray(indices) {
    if (!Array.isArray(indices)) return [];
    
    return indices.map(index => ({
      name: index?.name || 'N/A',
      value: this.normalizeNumber(index?.value || index?.points || 0),
      change: this.normalizeNumber(index?.change || index?.pointsChange || 0),
      changePercent: this.normalizeNumber(index?.changePercent || index?.percentChange || 0)
    }));
  }

  /**
   * Normalize sectors array data
   * @param {Array} sectors - Array of sector objects
   * @returns {Array} Normalized sectors array
   */
  normalizeSectorsArray(sectors) {
    if (!Array.isArray(sectors)) return [];
    
    return sectors.map(sector => ({
      name: sector?.name || sector?.sector || 'N/A',
      change: this.normalizeNumber(sector?.change || sector?.percentChange || 0)
    }));
  }

  /**
   * Normalize price data (handle different formats)
   * @param {any} price - Price data
   * @returns {Object|Number} Normalized price
   */
  normalizePrice(price) {
    if (typeof price === 'object' && price !== null) {
      return {
        BSE: this.normalizeNumber(price.BSE || price.bse || 0),
        NSE: this.normalizeNumber(price.NSE || price.nse || 0)
      };
    }
    return this.normalizeNumber(price);
  }

  /**
   * Normalize number values
   * @param {any} value - Value to normalize
   * @returns {Number} Normalized number
   */
  normalizeNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Get default stock data when transformation fails
   */
  getDefaultStockData() {
    return {
      companyName: 'N/A',
      tickerId: 'N/A',
      currentPrice: { BSE: 0, NSE: 0 },
      percentChange: 0,
      yearHigh: 0,
      yearLow: 0,
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
      nav: 0,
      category: 'N/A',
      fundHouse: 'N/A',
      expenseRatio: 'N/A',
      fundManager: 'N/A',
      assetAllocation: 'N/A',
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
        return { topGainers: [], topLosers: [], timestamp };
      case 'ipo':
        return { upcoming: [], active: [], listed: [], closed: [], timestamp };
      case 'mostActive':
        return { nse: [], bse: [], timestamp };
      case 'priceShockers':
        return [];
      case 'overview':
        return { indices: [], sectors: [], marketSentiment: 'neutral', timestamp };
      default:
        return { timestamp };
    }
  }
}

// Create singleton instance
const stockMarketResponseTransformer = new StockMarketResponseTransformer();

module.exports = stockMarketResponseTransformer;
