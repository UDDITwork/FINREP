/**
 * FILE LOCATION: backend/services/perplexityStockAPI.js
 * 
 * Perplexity-powered Stock Market API service that provides access to
 * real-time Indian stock market data, mutual funds, IPOs, and market analytics.
 * Replaces Indian Stock API with Perplexity AI for reliable data delivery.
 */

require('dotenv').config();
const axios = require('axios');

class PerplexityStockAPI {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseURL = 'https://api.perplexity.ai/chat/completions';
    
    if (!this.apiKey) {
      console.error('❌ PERPLEXITY_API_KEY not is found in environment variables');
      throw new Error('Perplexity API key is required');
    }

    // Create axios instance - EXACTLY like documentation
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

  /**
   * Make API call to Perplexity
   * @param {string} systemPrompt - System instruction
   * @param {string} userQuery - User query
   * @returns {Promise<Object>} Parsed response
   */
  async makePerplexityCall(systemPrompt, userQuery) {
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
          
          // Clean up common issues
          jsonString = jsonString.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
          jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
          
          console.log(`🧹 [Perplexity API] CLEANED JSON:`, jsonString.substring(0, 500) + '...');
          
          const parsed = JSON.parse(jsonString);
          console.log(`✅ [Perplexity API] Successfully parsed JSON`);
          return parsed;
        }
        
        // FALLBACK: Return structured data
        console.log(`⚠️ [Perplexity API] No JSON found, creating fallback`);
        return {
          content: content,
          source: 'perplexity_ai',
          timestamp: new Date().toISOString(),
          fallback: true
        };
        
      } catch (parseError) {
        console.error(`❌ [Perplexity API] JSON Parse Error:`, parseError.message);
        
        return {
          content: content,
          source: 'perplexity_ai', 
          timestamp: new Date().toISOString(),
          parseError: parseError.message,
          fallback: true
        };
      }
      
    } catch (error) {
      console.error('❌ [Perplexity API] Error:', error.response?.data || error.message);
      throw new Error(`Perplexity API failed: ${error.message}`);
    }
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