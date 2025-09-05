/**
 * FILE LOCATION: backend/services/claudeAIFallbackService.js
 * 
 * Claude AI Fallback Service that provides alternative responses when
 * the Indian Stock API fails or doesn't provide sufficient data.
 * Acts as a web scraping agent to gather financial information.
 */

require('dotenv').config();
const axios = require('axios');

class ClaudeAIFallbackService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.apiUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    
    if (!this.apiKey) {
      console.error('❌ CLAUDE_API_KEY not found in environment variables');
      throw new Error('Claude AI API key is required');
    }

    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate fallback response for stock data
   * @param {string} companyName - Company name
   * @param {string} dataType - Type of data needed
   * @param {Object} originalError - Original API error
   * @returns {Promise<Object>} Fallback data
   */
  async getStockFallback(companyName, dataType = 'basic', originalError = null) {
    const prompt = this.buildStockPrompt(companyName, dataType, originalError);
    
    try {
      console.log(`🤖 [Claude AI] Generating fallback for ${companyName} - ${dataType}`);
      
      const response = await this.client.post('', {
        model: this.model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const fallbackData = this.parseStockResponse(response.data.content[0].text, companyName, dataType);
      
      console.log(`✅ [Claude AI] Fallback generated successfully for ${companyName}`);
      return {
        success: true,
        data: fallbackData,
        source: 'claude_ai_fallback',
        originalError: originalError?.message || 'API unavailable'
      };
      
    } catch (error) {
      console.error(`❌ [Claude AI] Error generating fallback:`, error.message);
      return {
        success: false,
        data: null,
        error: error.message,
        source: 'claude_ai_fallback'
      };
    }
  }

  /**
   * Generate fallback response for market data
   * @param {string} dataType - Type of market data needed
   * @param {Object} originalError - Original API error
   * @returns {Promise<Object>} Fallback data
   */
  async getMarketDataFallback(dataType, originalError = null) {
    const prompt = this.buildMarketDataPrompt(dataType, originalError);
    
    try {
      console.log(`🤖 [Claude AI] Generating market data fallback for ${dataType}`);
      
      const response = await this.client.post('', {
        model: this.model,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const fallbackData = this.parseMarketDataResponse(response.data.content[0].text, dataType);
      
      console.log(`✅ [Claude AI] Market data fallback generated successfully`);
      return {
        success: true,
        data: fallbackData,
        source: 'claude_ai_fallback',
        originalError: originalError?.message || 'API unavailable'
      };
      
    } catch (error) {
      console.error(`❌ [Claude AI] Error generating market data fallback:`, error.message);
      return {
        success: false,
        data: null,
        error: error.message,
        source: 'claude_ai_fallback'
      };
    }
  }

  /**
   * Generate fallback response for news data - TEMPORARILY DISABLED
   * @param {Object} originalError - Original API error
   * @returns {Promise<Object>} Fallback data
   */
  async getNewsFallback(originalError = null) {
    console.log(`🚫 [Claude AI] News fallback temporarily disabled`);
    
    // Return empty news data instead of calling Claude
    return {
      success: true,
      data: [],
      source: 'disabled',
      originalError: 'News service temporarily disabled'
    };
  }

  /**
   * Build prompt for stock data
   */
  buildStockPrompt(companyName, dataType, originalError) {
    const basePrompt = `You are a financial data web scraping agent. Provide accurate financial information for ${companyName} in JSON format.`;

    const dataRequirements = {
      basic: `Include: company name, ticker symbol, current price estimate, industry, market cap estimate, and a brief company description.`,
      detailed: `Include: company name, ticker symbol, current price estimate, 52-week high/low estimates, P/E ratio estimate, market cap estimate, industry, sector, and comprehensive company profile.`,
      technical: `Include: company name, ticker symbol, current price estimate, technical indicators (RSI, MACD estimates), support/resistance levels, and trading volume estimates.`,
      mutualFund: `Include: fund name, NAV estimate, fund category, asset allocation, expense ratio estimate, and fund manager information. Format as mutual fund data structure.`
    };

    const errorContext = originalError ? `\n\nNote: The primary API failed with error: ${originalError.message}. Provide alternative data based on publicly available information.` : '';

    return `${basePrompt}

${dataRequirements[dataType] || dataRequirements.basic}

${errorContext}

IMPORTANT: 
- Provide realistic estimates based on current market conditions
- Use Indian Rupees (₹) for prices
- Format response as valid JSON
- Include timestamp of when this data was generated
- Limit response to essential information only
- Be conservative with estimates and clearly mark them as such
- For mutual funds, focus on fund characteristics rather than stock data

Respond only with valid JSON, no additional text.`;
  }

  /**
   * Build prompt for market data
   */
  buildMarketDataPrompt(dataType, originalError) {
    const dataRequirements = {
      trending: 'Provide top 5 trending stocks with estimated price changes, volume, and market sentiment.',
      ipo: 'Provide upcoming and recent IPOs with estimated issue prices, lot sizes, and company details.',
      mostActive: 'Provide most active stocks by volume with estimated prices and percentage changes.',
      priceShockers: 'Provide stocks with significant price movements and estimated volatility metrics.',
      overview: 'Provide comprehensive market overview including indices, sector performance, and market sentiment.'
    };

    const errorContext = originalError ? `\n\nNote: The primary API failed with error: ${originalError.message}. Provide alternative data based on publicly available information.` : '';

    return `You are a financial data web scraping agent. Provide ${dataType} market data in JSON format.

${dataRequirements[dataType] || 'Provide comprehensive market overview data.'}

${errorContext}

IMPORTANT:
- Focus on Indian stock market (NSE/BSE)
- Use Indian Rupees (₹) for prices
- Format response as valid JSON
- Include timestamp of when this data was generated
- Limit response to essential information only
- Be conservative with estimates and clearly mark them as such
- For price shockers, focus on stocks with >5% price movements

Respond only with valid JSON, no additional text.`;
  }

  /**
   * Build prompt for news data
   */
  buildNewsPrompt(originalError) {
    const errorContext = originalError ? `\n\nNote: The primary API failed with error: ${originalError.message}. Provide alternative financial news based on publicly available information.` : '';

    return `You are a financial news web scraping agent. Provide latest financial news in JSON format.

Include 5-7 recent financial news articles with:
- Title
- Summary (2-3 sentences)
- Source (e.g., "Financial Times", "Economic Times", "Business Standard")
- Estimated publication date (within last 24 hours)
- Topics/categories
- URL placeholder

${errorContext}

IMPORTANT:
- Focus on Indian financial markets and economy
- Format response as valid JSON
- Include timestamp of when this data was generated
- Limit response to essential information only
- Be conservative with estimates and clearly mark them as such

Respond only with valid JSON, no additional text.`;
  }

  /**
   * Parse stock response from Claude AI
   */
  parseStockResponse(responseText, companyName, dataType) {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Handle mutual fund data differently
      if (dataType === 'mutualFund') {
        return this.formatMutualFundData(parsedData, companyName);
      }
      
      // Standardize the stock response format
      return {
        companyName: parsedData.companyName || companyName,
        tickerId: parsedData.tickerSymbol || parsedData.tickerId || 'N/A',
        currentPrice: {
          BSE: parsedData.currentPrice || parsedData.price || 'N/A',
          NSE: parsedData.currentPrice || parsedData.price || 'N/A'
        },
        percentChange: parsedData.percentChange || 0,
        yearHigh: parsedData.yearHigh || parsedData['52WeekHigh'] || 'N/A',
        yearLow: parsedData.yearLow || parsedData['52WeekLow'] || 'N/A',
        industry: parsedData.industry || parsedData.sector || 'N/A',
        keyMetrics: {
          marketCap: parsedData.marketCap || 'N/A',
          peRatio: parsedData.peRatio || 'N/A'
        },
        companyProfile: {
          description: parsedData.description || parsedData.companyProfile || 'N/A'
        },
        timestamp: parsedData.timestamp || new Date().toISOString(),
        source: 'claude_ai_fallback'
      };
      
    } catch (error) {
      console.error('Error parsing Claude AI stock response:', error);
      return this.getDefaultStockData(companyName, dataType);
    }
  }

  /**
   * Format mutual fund data from Claude AI response
   */
  formatMutualFundData(parsedData, fundName) {
    return {
      fundName: parsedData.fundName || fundName,
      nav: parsedData.nav || parsedData.currentNav || 'N/A',
      category: parsedData.category || parsedData.fundCategory || 'N/A',
      assetAllocation: parsedData.assetAllocation || parsedData.allocation || 'N/A',
      expenseRatio: parsedData.expenseRatio || parsedData.expense || 'N/A',
      fundManager: parsedData.fundManager || parsedData.manager || 'N/A',
      fundHouse: parsedData.fundHouse || parsedData.amc || 'N/A',
      timestamp: parsedData.timestamp || new Date().toISOString(),
      source: 'claude_ai_fallback'
    };
  }

  /**
   * Parse market data response from Claude AI
   */
  parseMarketDataResponse(responseText, dataType) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Standardize based on data type
      switch (dataType) {
        case 'trending':
          return {
            topGainers: parsedData.topGainers || [],
            topLosers: parsedData.topLosers || [],
            timestamp: parsedData.timestamp || new Date().toISOString()
          };
        case 'ipo':
          return {
            upcoming: parsedData.upcoming || [],
            active: parsedData.active || [],
            listed: parsedData.listed || [],
            closed: parsedData.closed || [],
            timestamp: parsedData.timestamp || new Date().toISOString()
          };
        case 'mostActive':
          return {
            nse: parsedData.nse || [],
            bse: parsedData.bse || [],
            timestamp: parsedData.timestamp || new Date().toISOString()
          };
        case 'priceShockers':
          return {
            shockers: parsedData.shockers || [],
            timestamp: parsedData.timestamp || new Date().toISOString()
          };
        case 'overview':
          return {
            indices: parsedData.indices || [],
            sectors: parsedData.sectors || [],
            marketSentiment: parsedData.marketSentiment || 'neutral',
            timestamp: parsedData.timestamp || new Date().toISOString()
          };
        default:
          return parsedData;
      }
      
    } catch (error) {
      console.error('Error parsing Claude AI market data response:', error);
      return this.getDefaultMarketData(dataType);
    }
  }

  /**
   * Parse news response from Claude AI
   */
  parseNewsResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Standardize news format
      const news = Array.isArray(parsedData.news) ? parsedData.news : 
                   Array.isArray(parsedData.articles) ? parsedData.articles : 
                   Array.isArray(parsedData) ? parsedData : [];

      return news.map(item => ({
        title: item.title || 'N/A',
        summary: item.summary || item.description || 'N/A',
        source: item.source || 'Claude AI',
        pub_date: item.pub_date || item.date || new Date().toISOString(),
        topics: item.topics || item.categories || ['General'],
        url: item.url || '#',
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Error parsing Claude AI news response:', error);
      return this.getDefaultNewsData();
    }
  }

  /**
   * Get default stock data when parsing fails
   */
  getDefaultStockData(companyName, dataType) {
    if (dataType === 'mutualFund') {
      return this.getDefaultMutualFundData(companyName);
    }
    
    return {
      companyName: companyName,
      tickerId: 'N/A',
      currentPrice: { BSE: 'N/A', NSE: 'N/A' },
      percentChange: 0,
      yearHigh: 'N/A',
      yearLow: 'N/A',
      industry: 'N/A',
      keyMetrics: { marketCap: 'N/A', peRatio: 'N/A' },
      companyProfile: { description: 'Data temporarily unavailable' },
      timestamp: new Date().toISOString(),
      source: 'claude_ai_fallback_default'
    };
  }

  /**
   * Get default mutual fund data when parsing fails
   */
  getDefaultMutualFundData(fundName) {
    return {
      fundName: fundName,
      nav: 'N/A',
      category: 'N/A',
      assetAllocation: 'N/A',
      expenseRatio: 'N/A',
      fundManager: 'N/A',
      fundHouse: 'N/A',
      timestamp: new Date().toISOString(),
      source: 'claude_ai_fallback_default'
    };
  }

  /**
   * Get default market data when parsing fails
   */
  getDefaultMarketData(dataType) {
    const timestamp = new Date().toISOString();
    
    switch (dataType) {
      case 'trending':
        return { 
          topGainers: [
            { name: 'Sample Stock 1', change: '+2.5%', volume: 'N/A' },
            { name: 'Sample Stock 2', change: '+1.8%', volume: 'N/A' }
          ], 
          topLosers: [
            { name: 'Sample Stock 3', change: '-1.2%', volume: 'N/A' },
            { name: 'Sample Stock 4', change: '-0.9%', volume: 'N/A' }
          ], 
          timestamp 
        };
      case 'ipo':
        return { 
          upcoming: [
            { name: 'Sample IPO 1', issuePrice: '₹100-110', lotSize: 'N/A' },
            { name: 'Sample IPO 2', issuePrice: '₹50-60', lotSize: 'N/A' }
          ], 
          active: [], 
          listed: [], 
          closed: [], 
          timestamp 
        };
      case 'mostActive':
        return { 
          nse: [
            { name: 'Sample NSE Stock', volume: 'N/A', change: 'N/A' }
          ], 
          bse: [
            { name: 'Sample BSE Stock', volume: 'N/A', change: 'N/A' }
          ], 
          timestamp 
        };
      case 'priceShockers':
        return { 
          shockers: [
            { name: 'Sample Shock Stock', change: '+8.5%', reason: 'N/A' }
          ], 
          timestamp 
        };
      case 'overview':
        return { 
          indices: [
            { name: 'NIFTY 50', value: 'N/A', change: 'N/A' },
            { name: 'SENSEX', value: 'N/A', change: 'N/A' }
          ], 
          sectors: [
            { name: 'Banking', performance: 'N/A' },
            { name: 'IT', performance: 'N/A' }
          ], 
          marketSentiment: 'neutral', 
          timestamp 
        };
      default:
        return { timestamp };
    }
  }

  /**
   * Get default news data when parsing fails
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
   * Health check for Claude AI service
   */
  async healthCheck() {
    try {
      const response = await this.client.post('', {
        model: this.model,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Respond with "OK" only.'
          }
        ]
      });

      return {
        success: true,
        status: 'healthy',
        responseTime: response.headers['x-response-time'] || 'N/A'
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const claudeAIFallbackService = new ClaudeAIFallbackService();

module.exports = claudeAIFallbackService;
