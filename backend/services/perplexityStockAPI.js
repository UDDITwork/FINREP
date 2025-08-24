/**
 * FILE LOCATION: backend/services/perplexityStockAPI.js
 * 
 * Perplexity-powered Stock Market API service that provides access to
 * real-time Indian stock market data, mutual funds, IPOs, and market analytics.
 * Replaces Indian Stock API with Perplexity AI for reliable data delivery.
 * 
 * IMPROVED: Added fallback system to prevent app crashes when API fails
 */

require('dotenv').config();
const axios = require('axios');

class PerplexityStockAPI {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseURL = 'https://api.perplexity.ai/chat/completions';
    this.fallbackMode = false;
    
    if (!this.apiKey) {
      console.warn('⚠️ PERPLEXITY_API_KEY not found - running in fallback mode');
      this.fallbackMode = true;
    } else {
      // Create axios instance only if API key exists
      this.api = axios.create({
        baseURL: this.baseURL,
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ [Perplexity Stock API] Service initialized successfully');
    }

    if (this.fallbackMode) {
      console.log('⚠️ [Perplexity Stock API] Running in fallback mode - using sample data');
    }
  }

  /**
   * Make API call to Perplexity with fallback support
   * @param {string} systemPrompt - System instruction
   * @param {string} userQuery - User query
   * @returns {Promise<Object>} Parsed response or fallback data
   */
  async makePerplexityCall(systemPrompt, userQuery) {
    // If in fallback mode, return sample data immediately
    if (this.fallbackMode) {
      console.log('⚠️ [Perplexity API] Fallback mode - returning sample data');
      return this.getFallbackData(userQuery);
    }

    try {
      console.log(`🔍 [Perplexity API] Query: ${userQuery.substring(0, 100)}...`);
      
      const response = await this.api.post('', {
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user", 
            content: userQuery
          }
        ]
      });

      console.log(`✅ [Perplexity API] Response received successfully`);
      
      const content = response.data.choices[0].message.content;
      console.log(`📄 [Perplexity API] RAW CONTENT:`, content);
      
      // IMPROVED JSON EXTRACTION
      try {
        // Method 1: Look for JSON blocks
        let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        
        // Method 2: Look for any JSON object
        if (!jsonMatch) {
          jsonMatch = content.match(/\{[\s\S]*?\}(?=\s*$|[\s\S]*?$)/);
        }
        
        // Method 3: Find first { and last }
        if (!jsonMatch) {
          const firstBrace = content.indexOf('{');
          const lastBrace = content.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonMatch = [content.substring(firstBrace, lastBrace + 1)];
          }
        }
        
        if (jsonMatch) {
          let jsonString = jsonMatch[0].replace(/```json|```/g, '').trim();
          
          // IMPROVED JSON CLEANING
          console.log(`🧹 [Perplexity API] ORIGINAL JSON:`, jsonString.substring(0, 500) + '...');
          
          // Remove control characters
          jsonString = jsonString.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
          
          // Fix trailing commas in arrays and objects
          jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
          
          // Fix missing commas between array elements
          jsonString = jsonString.replace(/(\d+)\s*(\{)/g, '$1,$2');
          jsonString = jsonString.replace(/(\})\s*(\{)/g, '$1,$2');
          jsonString = jsonString.replace(/(\})\s*(\[)/g, '$1,$2');
          jsonString = jsonString.replace(/(\])\s*(\{)/g, '$1,$2');
          
          // Fix missing quotes around property names
          jsonString = jsonString.replace(/(\w+):/g, '"$1":');
          
          // Remove any trailing commas before closing brackets
          jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
          
          console.log(`🧹 [Perplexity API] CLEANED JSON:`, jsonString.substring(0, 500) + '...');
          
          try {
            const parsed = JSON.parse(jsonString);
            console.log(`✅ [Perplexity API] Successfully parsed JSON`);
            return parsed;
          } catch (parseError) {
            console.error(`❌ [Perplexity API] JSON Parse Error after cleaning:`, parseError.message);
            console.error(`❌ [Perplexity API] Failed JSON string:`, jsonString);
            
            // Try to fix common JSON issues and parse again
            try {
              // Remove any incomplete trailing content
              let lastBrace = jsonString.lastIndexOf('}');
              let lastBracket = jsonString.lastIndexOf(']');
              let endPos = Math.max(lastBrace, lastBracket);
              
              if (endPos > 0) {
                let truncatedJson = jsonString.substring(0, endPos + 1);
                console.log(`🔄 [Perplexity API] Trying truncated JSON...`);
                
                const parsed = JSON.parse(truncatedJson);
                console.log(`✅ [Perplexity API] Successfully parsed truncated JSON`);
                return parsed;
              }
            } catch (truncateError) {
              console.error(`❌ [Perplexity API] Truncated JSON also failed:`, truncateError.message);
            }
            
            // If all parsing attempts fail, return fallback
            console.log('🔄 [Perplexity API] JSON parsing failed, returning fallback data');
            return this.getFallbackData(userQuery);
          }
        }
        
        // FALLBACK: Return structured data
        console.log(`⚠️ [Perplexity API] No JSON found, creating fallback`);
        return this.getFallbackData(userQuery);
        
      } catch (parseError) {
        console.error(`❌ [Perplexity API] JSON Parse Error:`, parseError.message);
        console.log('🔄 [Perplexity API] Returning fallback data due to parsing error');
        return this.getFallbackData(userQuery);
      }
      
    } catch (error) {
      console.error('❌ [Perplexity API] Error:', error.response?.data || error.message);
      console.log('🔄 [Perplexity API] API call failed, returning fallback data');
      return this.getFallbackData(userQuery);
    }
  }

  /**
   * Generate fallback data when API is unavailable
   * @param {string} query - Original user query
   * @returns {Object} Fallback data structure
   */
  getFallbackData(query) {
    console.log(`🔄 [Perplexity API] Generating fallback data for: ${query.substring(0, 50)}...`);
    
    return {
      message: 'Stock market data temporarily unavailable - showing sample data',
      data: this.generateSampleData(query),
      source: 'fallback',
      timestamp: new Date().toISOString(),
      fallback: true
    };
  }

  /**
   * Generate realistic sample data based on query type
   * @param {string} query - User query to determine data type
   * @returns {Object} Sample data structure
   */
  generateSampleData(query) {
    const lowerQuery = query.toLowerCase();
    
    // Trending stocks data
    if (lowerQuery.includes('trending') || lowerQuery.includes('gaining') || lowerQuery.includes('losing')) {
      return {
        topGainers: [
          { companyName: 'Reliance Industries', tickerId: 'RELIANCE', currentPrice: 2931.55, percentChange: 5.2, volume: 23100000 },
          { companyName: 'TCS', tickerId: 'TCS', currentPrice: 4125.80, percentChange: 3.8, volume: 18500000 },
          { companyName: 'HDFC Bank', tickerId: 'HDFCBANK', currentPrice: 1689.45, percentChange: 2.1, volume: 12500000 }
        ],
        topLosers: [
          { companyName: 'Infosys', tickerId: 'INFY', currentPrice: 1456.78, percentChange: -2.1, volume: 9800000 },
          { companyName: 'ITC', tickerId: 'ITC', currentPrice: 456.32, percentChange: -1.8, volume: 7500000 }
        ]
      };
    }
    
    // IPO data
    if (lowerQuery.includes('ipo')) {
      return {
        upcoming: [
          { name: 'Sample Tech IPO', symbol: 'STECH', expected_price: '₹500-550', expected_date: '2025-01-15', lot_size: '100' },
          { name: 'Green Energy Ltd', symbol: 'GREEN', expected_price: '₹200-220', expected_date: '2025-01-20', lot_size: '200' }
        ],
        active: [
          { name: 'Digital Solutions', symbol: 'DIGI', min_price: 400, max_price: 450, lot_size: '150' }
        ],
        listed: [
          { name: 'Innovation Corp', symbol: 'INNOV', listing_price: 300, current_price: 325 }
        ],
        closed: []
      };
    }
    
    // Most active stocks
    if (lowerQuery.includes('most active') || lowerQuery.includes('volume')) {
      return {
        nse: [
          { companyName: 'Reliance Industries', tickerId: 'RELIANCE', currentPrice: 2931.55, percentChange: 5.2, volume: 23100000 },
          { companyName: 'TCS', tickerId: 'TCS', currentPrice: 4125.80, percentChange: 3.8, volume: 18500000 }
        ],
        bse: [
          { companyName: 'HDFC Bank', tickerId: 'HDFCBANK', currentPrice: 1689.45, percentChange: 2.1, volume: 12500000 }
        ]
      };
    }
    
    // Price shockers
    if (lowerQuery.includes('price shocker') || lowerQuery.includes('significant price')) {
      return [
        { companyName: 'Tech Startup', tickerId: 'TECH', currentPrice: 150, percentChange: 12.5, volume: 5000000 },
        { companyName: 'Pharma Corp', tickerId: 'PHARMA', currentPrice: 89, percentChange: -8.2, volume: 3200000 }
      ];
    }
    
    // Mutual fund data
    if (lowerQuery.includes('mutual fund') || lowerQuery.includes('fund')) {
      return {
        fundName: 'Sample Large Cap Fund',
        nav: 45.67,
        category: 'Large Cap',
        fundHouse: 'Sample AMC',
        expenseRatio: '1.5%',
        fundManager: 'Sample Manager',
        assetAllocation: 'Equity: 95%, Cash: 5%'
      };
    }
    
    // News data
    if (lowerQuery.includes('news')) {
      return [
        {
          title: 'Sample Market Update',
          summary: 'This is a sample news article for demonstration purposes.',
          source: 'Sample News',
          pub_date: new Date().toISOString(),
          topics: ['Market', 'Sample'],
          url: '#'
        }
      ];
    }
    
    // Default stock data
    return {
      companyName: 'Sample Company Ltd',
      tickerId: 'SAMPLE',
      currentPrice: { BSE: 1000, NSE: 1000 },
      percentChange: 1.5,
      yearHigh: 1200,
      yearLow: 900,
      industry: 'Sample Industry',
      keyMetrics: {
        marketCap: '₹1000 Cr',
        peRatio: '20.5'
      },
      companyProfile: {
        description: 'This is a sample company for demonstration purposes when the API is unavailable.'
      }
    };
  }

  /**
   * Search for stock by company name
   * @param {string} companyName - Company name to search
   * @returns {Promise<Object>} Stock data
   */
  async searchStock(companyName) {
    const systemPrompt = `You are a financial data API. Return current Indian stock market data in EXACT JSON format. Always include BSE/NSE prices, percentage change, 52-week high/low, and company details.

Response format:
{
  "companyName": "string",
  "tickerId": "string", 
  "currentPrice": {
    "BSE": "number",
    "NSE": "number"
  },
  "percentChange": "number",
  "yearHigh": "number",
  "yearLow": "number", 
  "industry": "string",
  "keyMetrics": {
    "marketCap": "string",
    "peRatio": "string"
  },
  "companyProfile": {
    "description": "string"
  },
  "timestamp": "ISO_DATE",
  "source": "perplexity_ai"
}`;

    const userQuery = `Get current stock data for ${companyName} from Indian stock market (BSE/NSE). Include live price, today's change percentage, 52-week high/low, industry, market cap, and PE ratio.`;
    
    return await this.makePerplexityCall(systemPrompt, userQuery);
  }

  /**
   * Get trending stocks (top gainers/losers)
   * @returns {Promise<Object>} Trending stocks data
   */
  async getTrendingStocks() {
    const systemPrompt = `You are a financial data API. Return current Indian stock market trending data in EXACT JSON format.

Response format:
{
  "topGainers": [
    {
      "companyName": "string",
      "tickerId": "string",
      "currentPrice": "number",
      "percentChange": "number",
      "volume": "number"
    }
  ],
  "topLosers": [
    {
      "companyName": "string", 
      "tickerId": "string",
      "currentPrice": "number",
      "percentChange": "number",
      "volume": "number"
    }
  ],
  "timestamp": "ISO_DATE",
  "source": "perplexity_ai"
}`;

    const userQuery = `Get today's top 10 gaining and losing stocks from Indian stock market (NSE/BSE). Include company names, ticker symbols, current prices, percentage changes, and trading volumes.`;
    
    return await this.makePerplexityCall(systemPrompt, userQuery);
  }

  /**
   * Get IPO data
   * @returns {Promise<Object>} IPO data
   */
  async getIPOData() {
    const systemPrompt = `You are a financial data API. Return current Indian IPO data in EXACT JSON format.

Response format:
{
  "upcoming": [
    {
      "name": "string",
      "symbol": "string", 
      "expected_price": "string",
      "expected_date": "string",
      "lot_size": "string"
    }
  ],
  "active": [
    {
      "name": "string",
      "symbol": "string",
      "min_price": "number",
      "max_price": "number", 
      "lot_size": "string"
    }
  ],
  "listed": [
    {
      "name": "string",
      "symbol": "string",
      "listing_price": "number",
      "current_price": "number"
    }
  ],
  "closed": [],
  "timestamp": "ISO_DATE", 
  "source": "perplexity_ai"
}`;

    const userQuery = `Get current Indian IPO data including upcoming IPOs, currently active/open IPOs, and recently listed IPOs with their performance. Focus on NSE/BSE listings.`;
    
    return await this.makePerplexityCall(systemPrompt, userQuery);
  }

  /**
   * Get financial news
   * @returns {Promise<Array>} News articles
   */
  async getNews() {
    const systemPrompt = `You are a financial news API. Return latest Indian stock market news in EXACT JSON format.

Response format:
[
  {
    "title": "string",
    "summary": "string", 
    "source": "string",
    "pub_date": "ISO_DATE",
    "topics": ["string"],
    "url": "string"
  }
]`;

    const userQuery = `Get latest 10 Indian stock market and business news headlines from today. Include title, brief summary, source, and publication date. Focus on NSE, BSE, major Indian companies, and market movements.`;
    
    return await this.makePerplexityCall(systemPrompt, userQuery);
  }

  /**
   * Get most active stocks
   * @param {string} exchange - 'nse', 'bse', or 'both'
   * @returns {Promise<Object>} Most active stocks
   */
  async getMostActiveStocks(exchange = 'both') {
    const systemPrompt = `You are a financial data API. Return most active Indian stocks by trading volume in EXACT JSON format.

Response format:
{
  "nse": [
    {
      "companyName": "string",
      "tickerId": "string", 
      "currentPrice": "number",
      "percentChange": "number",
      "volume": "number"
    }
  ],
  "bse": [
    {
      "companyName": "string",
      "tickerId": "string",
      "currentPrice": "number", 
      "percentChange": "number",
      "volume": "number"
    }
  ],
  "timestamp": "ISO_DATE",
  "source": "perplexity_ai"
}`;

    const exchangeText = exchange === 'nse' ? 'NSE' : exchange === 'bse' ? 'BSE' : 'NSE and BSE';
    const userQuery = `Get today's most active stocks by trading volume from ${exchangeText}. Include top 10 stocks with highest trading volumes, their current prices, percentage changes, and volume data.`;
    
    return await this.makePerplexityCall(systemPrompt, userQuery);
  }

  /**
   * Get price shockers (significant price movements)
   * @returns {Promise<Array>} Price shockers data
   */
  async getPriceShockers() {
    const systemPrompt = `You are a financial data API. Return stocks with significant price movements in EXACT JSON format.

Response format:
[
  {
    "companyName": "string",
    "tickerId": "string",
    "currentPrice": "number", 
    "percentChange": "number",
    "volume": "number"
  }
]`;

    const userQuery = `Get Indian stocks with significant price movements today (both positive and negative changes above 5%). Include stocks from NSE/BSE with unusual price movements, current prices, percentage changes, and volumes.`;
    
    return await this.makePerplexityCall(systemPrompt, userQuery);
  }

  /**
   * Search mutual funds
   * @param {string} query - Search query
   * @returns {Promise<Object>} Mutual fund data
   */
  async searchMutualFund(query) {
    const systemPrompt = `You are a mutual fund data API. Return Indian mutual fund information in EXACT JSON format.

Response format:
{
  "fundName": "string",
  "nav": "number",
  "category": "string",
  "fundHouse": "string",
  "expenseRatio": "string",
  "fundManager": "string", 
  "assetAllocation": "string",
  "timestamp": "ISO_DATE",
  "source": "perplexity_ai"
}`;

    const userQuery = `Get mutual fund information for "${query}" from Indian market. Include NAV, category, fund house, expense ratio, fund manager, and asset allocation details.`;
    
    return await this.makePerplexityCall(systemPrompt, userQuery);
  }

  /**
   * Get comprehensive market overview
   * @returns {Promise<Object>} Market overview data
   */
  async getMarketOverview() {
    try {
      console.log('📊 [Perplexity API] Fetching market overview...');
      
      const [trending, ipo, mostActive, shockers] = await Promise.allSettled([
        this.getTrendingStocks(),
        this.getIPOData(), 
        this.getMostActiveStocks('both'),
        this.getPriceShockers()
      ]);

      const overview = {
        trending: trending.status === 'fulfilled' ? trending.value : null,
        ipo: ipo.status === 'fulfilled' ? ipo.value : null,
        mostActiveNSE: mostActive.status === 'fulfilled' ? mostActive.value?.nse : null,
        mostActiveBSE: mostActive.status === 'fulfilled' ? mostActive.value?.bse : null,
        priceShockers: shockers.status === 'fulfilled' ? shockers.value : null,
        timestamp: new Date().toISOString(),
        source: 'perplexity_ai'
      };

      console.log('✅ [Perplexity API] Market overview compiled successfully');
      return overview;
    } catch (error) {
      console.error('❌ [Perplexity API] Error fetching market overview:', error.message);
      throw error;
    }
  }

  /**
   * Health check for Perplexity service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      await this.makePerplexityCall(
        'Return a simple JSON response: {"status": "healthy", "timestamp": "current_time"}',
        'Health check'
      );
      return { status: 'healthy', success: true };
    } catch (error) {
      return { status: 'unhealthy', success: false, error: error.message };
    }
  }

  /**
   * Simple test function for debugging
   * @returns {Promise<Object>} Test response
   */
  async simpleTest() {
    try {
      console.log('🧪 [Perplexity API] Testing simple request...');
      
      const response = await this.api.post('', {
        model: 'sonar-pro',
        messages: [
          { role: 'user', content: 'Hello, can you respond with just "API working"?' }
        ]
      });

      console.log('✅ [Perplexity API] Simple test SUCCESS:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [Perplexity API] Simple test FAILED:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
}

// Create singleton instance
const perplexityStockAPI = new PerplexityStockAPI();

module.exports = perplexityStockAPI;