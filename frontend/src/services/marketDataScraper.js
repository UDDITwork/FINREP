/**
 * FILE LOCATION: frontend/src/services/marketDataScraper.js
 * 
 * PURPOSE: Real-time NSE/BSE market data scraping service
 * 
 * FUNCTIONALITY: Scrape market data from public sources without API keys
 * - NIFTY 50, SENSEX, Bank Nifty
 * - Top gainers and losers
 * - Most active stocks
 * - Market indices
 */

// Market data scraping service
export const marketDataScraper = {
  /**
   * Get NIFTY 50 real-time data
   * @returns {Promise<Object>} NIFTY data
   */
  async getNifty50Data() {
    try {
      console.log('📊 [Market Scraper] Fetching NIFTY 50 data...');
      
      // Using Yahoo Finance proxy or public data sources
      const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1m&range=1d');
      const data = await response.json();
      
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators.quote[0];
        
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        return {
          success: true,
          data: {
            symbol: 'NIFTY 50',
            currentPrice: currentPrice.toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2),
            previousClose: previousClose.toFixed(2),
            high: Math.max(...quote.high.filter(Boolean)).toFixed(2),
            low: Math.min(...quote.low.filter(Boolean)).toFixed(2),
            volume: quote.volume[quote.volume.length - 1] || 0,
            timestamp: new Date().toISOString(),
            source: 'yahoo_finance'
          }
        };
      }
      
      throw new Error('Invalid data format received');
    } catch (error) {
      console.error('❌ [Market Scraper] Error fetching NIFTY 50:', error);
      return this.getFallbackNiftyData();
    }
  },

  /**
   * Get SENSEX real-time data
   * @returns {Promise<Object>} SENSEX data
   */
  async getSensexData() {
    try {
      console.log('📊 [Market Scraper] Fetching SENSEX data...');
      
      const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN?interval=1m&range=1d');
      const data = await response.json();
      
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators.quote[0];
        
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        return {
          success: true,
          data: {
            symbol: 'SENSEX',
            currentPrice: currentPrice.toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2),
            previousClose: previousClose.toFixed(2),
            high: Math.max(...quote.high.filter(Boolean)).toFixed(2),
            low: Math.min(...quote.low.filter(Boolean)).toFixed(2),
            volume: quote.volume[quote.volume.length - 1] || 0,
            timestamp: new Date().toISOString(),
            source: 'yahoo_finance'
          }
        };
      }
      
      throw new Error('Invalid data format received');
    } catch (error) {
      console.error('❌ [Market Scraper] Error fetching SENSEX:', error);
      return this.getFallbackSensexData();
    }
  },

  /**
   * Get Bank Nifty data
   * @returns {Promise<Object>} Bank Nifty data
   */
  async getBankNiftyData() {
    try {
      console.log('📊 [Market Scraper] Fetching Bank Nifty data...');
      
      const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEBANK?interval=1m&range=1d');
      const data = await response.json();
      
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators.quote[0];
        
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        return {
          success: true,
          data: {
            symbol: 'BANK NIFTY',
            currentPrice: currentPrice.toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2),
            previousClose: previousClose.toFixed(2),
            high: Math.max(...quote.high.filter(Boolean)).toFixed(2),
            low: Math.min(...quote.low.filter(Boolean)).toFixed(2),
            volume: quote.volume[quote.volume.length - 1] || 0,
            timestamp: new Date().toISOString(),
            source: 'yahoo_finance'
          }
        };
      }
      
      throw new Error('Invalid data format received');
    } catch (error) {
      console.error('❌ [Market Scraper] Error fetching Bank Nifty:', error);
      return this.getFallbackBankNiftyData();
    }
  },

  /**
   * Get comprehensive market overview
   * @returns {Promise<Object>} Market overview data
   */
  async getMarketOverview() {
    try {
      console.log('📊 [Market Scraper] Fetching market overview...');
      
      const [niftyResult, sensexResult, bankNiftyResult] = await Promise.allSettled([
        this.getNifty50Data(),
        this.getSensexData(),
        this.getBankNiftyData()
      ]);

      const overview = {
        success: true,
        data: {
          indices: [
            niftyResult.status === 'fulfilled' ? niftyResult.value.data : null,
            sensexResult.status === 'fulfilled' ? sensexResult.value.data : null,
            bankNiftyResult.status === 'fulfilled' ? bankNiftyResult.value.data : null
          ].filter(Boolean),
          marketStatus: this.getMarketStatus(),
          timestamp: new Date().toISOString(),
          source: 'market_scraper'
        }
      };

      console.log('✅ [Market Scraper] Market overview fetched successfully');
      return overview;
    } catch (error) {
      console.error('❌ [Market Scraper] Error fetching market overview:', error);
      return this.getFallbackMarketOverview();
    }
  },

  /**
   * Get top gainers and losers (mock data for now)
   * @returns {Promise<Object>} Top gainers and losers
   */
  async getTopGainersLosers() {
    try {
      console.log('📊 [Market Scraper] Fetching top gainers and losers...');
      
      // Mock data - in real implementation, this would be scraped from NSE website
      const mockData = {
        success: true,
        data: {
          topGainers: [
            { symbol: 'RELIANCE', name: 'Reliance Industries', change: '+5.2%', price: '2,450.50' },
            { symbol: 'TCS', name: 'Tata Consultancy', change: '+4.8%', price: '3,890.25' },
            { symbol: 'HDFC', name: 'HDFC Bank', change: '+4.1%', price: '1,650.80' },
            { symbol: 'INFY', name: 'Infosys', change: '+3.9%', price: '1,420.60' },
            { symbol: 'ICICIBANK', name: 'ICICI Bank', change: '+3.5%', price: '980.45' }
          ],
          topLosers: [
            { symbol: 'WIPRO', name: 'Wipro', change: '-2.8%', price: '450.30' },
            { symbol: 'TECHM', name: 'Tech Mahindra', change: '-2.3%', price: '1,180.90' },
            { symbol: 'HCLTECH', name: 'HCL Technologies', change: '-2.1%', price: '1,050.75' },
            { symbol: 'LT', name: 'Larsen & Toubro', change: '-1.9%', price: '2,890.40' },
            { symbol: 'AXISBANK', name: 'Axis Bank', change: '-1.7%', price: '890.20' }
          ],
          timestamp: new Date().toISOString(),
          source: 'mock_data'
        }
      };

      return mockData;
    } catch (error) {
      console.error('❌ [Market Scraper] Error fetching top gainers/losers:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  /**
   * Get most active stocks
   * @returns {Promise<Object>} Most active stocks
   */
  async getMostActiveStocks() {
    try {
      console.log('📊 [Market Scraper] Fetching most active stocks...');
      
      // Mock data - in real implementation, this would be scraped from NSE website
      const mockData = {
        success: true,
        data: {
          mostActive: [
            { symbol: 'RELIANCE', name: 'Reliance Industries', volume: '45.2M', price: '2,450.50', change: '+5.2%' },
            { symbol: 'TCS', name: 'Tata Consultancy', volume: '38.7M', price: '3,890.25', change: '+4.8%' },
            { symbol: 'HDFC', name: 'HDFC Bank', volume: '32.1M', price: '1,650.80', change: '+4.1%' },
            { symbol: 'INFY', name: 'Infosys', volume: '28.9M', price: '1,420.60', change: '+3.9%' },
            { symbol: 'ICICIBANK', name: 'ICICI Bank', volume: '25.4M', price: '980.45', change: '+3.5%' }
          ],
          timestamp: new Date().toISOString(),
          source: 'mock_data'
        }
      };

      return mockData;
    } catch (error) {
      console.error('❌ [Market Scraper] Error fetching most active stocks:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  /**
   * Get market status
   * @returns {string} Market status
   */
  getMarketStatus() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay();
    
    // Market hours: Monday to Friday, 9:15 AM to 3:30 PM IST
    if (day === 0 || day === 6) {
      return 'closed'; // Weekend
    }
    
    const currentTime = hour * 60 + minute;
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    
    if (currentTime >= marketOpen && currentTime <= marketClose) {
      return 'open';
    } else if (currentTime < marketOpen) {
      return 'pre_market';
    } else {
      return 'closed';
    }
  },

  // Fallback data methods
  getFallbackNiftyData() {
    return {
      success: false,
      data: {
        symbol: 'NIFTY 50',
        currentPrice: '22,150.00',
        change: '+125.50',
        changePercent: '+0.57',
        previousClose: '22,024.50',
        high: '22,200.00',
        low: '21,950.00',
        volume: 0,
        timestamp: new Date().toISOString(),
        source: 'fallback_data'
      }
    };
  },

  getFallbackSensexData() {
    return {
      success: false,
      data: {
        symbol: 'SENSEX',
        currentPrice: '73,250.00',
        change: '+450.75',
        changePercent: '+0.62',
        previousClose: '72,799.25',
        high: '73,400.00',
        low: '72,600.00',
        volume: 0,
        timestamp: new Date().toISOString(),
        source: 'fallback_data'
      }
    };
  },

  getFallbackBankNiftyData() {
    return {
      success: false,
      data: {
        symbol: 'BANK NIFTY',
        currentPrice: '48,750.00',
        change: '+325.80',
        changePercent: '+0.67',
        previousClose: '48,424.20',
        high: '48,900.00',
        low: '48,300.00',
        volume: 0,
        timestamp: new Date().toISOString(),
        source: 'fallback_data'
      }
    };
  },

  getFallbackMarketOverview() {
    return {
      success: false,
      data: {
        indices: [
          this.getFallbackNiftyData().data,
          this.getFallbackSensexData().data,
          this.getFallbackBankNiftyData().data
        ],
        marketStatus: 'unknown',
        timestamp: new Date().toISOString(),
        source: 'fallback_data'
      }
    };
  }
};

export default marketDataScraper;
