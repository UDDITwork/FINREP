/**
 * FILE LOCATION: backend/controllers/claudeController.js
 * 
 * Claude AI controller for handling market analysis, insights,
 * and AI-powered financial recommendations.
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

class ClaudeController {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.apiUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
  }

  /**
   * Generate Claude AI response
   * @param {string} prompt - User prompt
   * @param {string} systemPrompt - System prompt
   * @param {Object} context - Additional context data
   * @returns {Promise<Object>} Claude response
   */
  async generateResponse(prompt, systemPrompt, context = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('Claude API key not configured');
      }

      logger.info('🤖 [Claude] Generating response for prompt:', prompt.substring(0, 100) + '...');

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: `${prompt}\n\nContext: ${JSON.stringify(context)}`
            }
          ],
          system: systemPrompt
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      logger.info('✅ [Claude] Response generated successfully');
      
      return {
        success: true,
        data: {
          content: response.data.content[0].text,
          usage: response.data.usage,
          model: response.data.model
        }
      };
    } catch (error) {
      logger.error('❌ [Claude] Error generating response:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Analyze market data and provide insights
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async analyzeMarket(req, res) {
    try {
      const { prompt, marketData, systemPrompt } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required'
        });
      }

      const defaultSystemPrompt = `You are an expert financial analyst specializing in Indian markets. Provide clear, actionable insights with the following guidelines:

1. Analyze market trends and provide data-driven insights
2. Include risk assessments and market sentiment
3. Provide specific recommendations when appropriate
4. Use professional financial terminology
5. Format responses in a clear, structured manner
6. Include relevant market indicators and their implications
7. Consider both technical and fundamental analysis
8. Provide balanced perspectives with risk warnings

Always maintain a professional tone and include appropriate disclaimers.`;

      const result = await this.generateResponse(
        prompt,
        systemPrompt || defaultSystemPrompt,
        marketData
      );

      if (result.success) {
        // Parse the response to extract structured data
        const analysis = this.parseAnalysisResponse(result.data.content);
        
        res.json({
          success: true,
          data: analysis,
          message: 'Market analysis generated successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to generate market analysis',
          error: result.error
        });
      }
    } catch (error) {
      logger.error('❌ [Claude] Error in market analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Analyze market sentiment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async analyzeSentiment(req, res) {
    try {
      const { stocks, systemPrompt } = req.body;

      const prompt = `Analyze the market sentiment for the following stocks: ${stocks.join(', ')}. 
      Provide sentiment analysis including:
      1. Overall market sentiment (bullish/bearish/neutral)
      2. Key factors influencing sentiment
      3. Risk factors to consider
      4. Short-term outlook
      5. Recommendations for investors`;

      const defaultSystemPrompt = `You are a market sentiment analyst. Provide accurate, balanced sentiment analysis with the following focus:

1. Analyze technical and fundamental indicators
2. Consider market momentum and volume patterns
3. Evaluate news sentiment and market reactions
4. Assess risk factors and market volatility
5. Provide actionable insights for different investor profiles
6. Include both positive and negative factors
7. Consider sector-specific trends and correlations

Format your response with clear sections and actionable insights.`;

      const result = await this.generateResponse(prompt, systemPrompt || defaultSystemPrompt);

      if (result.success) {
        const sentiment = this.parseSentimentResponse(result.data.content);
        
        res.json({
          success: true,
          data: sentiment,
          message: 'Sentiment analysis generated successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to generate sentiment analysis',
          error: result.error
        });
      }
    } catch (error) {
      logger.error('❌ [Claude] Error in sentiment analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Generate stock recommendations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateRecommendations(req, res) {
    try {
      const { sector, riskProfile, systemPrompt } = req.body;

      const prompt = `Generate stock recommendations for ${sector || 'general market'} with ${riskProfile || 'medium'} risk profile. 
      Include:
      1. Top 5 stock picks with rationale
      2. Risk assessment for each recommendation
      3. Investment horizon and target returns
      4. Key factors driving the recommendations
      5. Portfolio allocation suggestions
      6. Risk management strategies`;

      const defaultSystemPrompt = `You are a senior investment advisor with expertise in Indian markets. Provide comprehensive stock recommendations with the following approach:

1. Consider fundamental analysis (P/E, P/B, ROE, debt levels)
2. Evaluate technical indicators and price momentum
3. Assess sector trends and market positioning
4. Consider macroeconomic factors and policy impacts
5. Provide risk-adjusted return expectations
6. Include both growth and value opportunities
7. Consider market capitalization and liquidity
8. Provide clear entry and exit strategies

Always include risk warnings and disclaimers. Recommendations should be suitable for the specified risk profile.`;

      const result = await this.generateResponse(prompt, systemPrompt || defaultSystemPrompt);

      if (result.success) {
        const recommendations = this.parseRecommendationsResponse(result.data.content);
        
        res.json({
          success: true,
          data: recommendations,
          message: 'Stock recommendations generated successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to generate recommendations',
          error: result.error
        });
      }
    } catch (error) {
      logger.error('❌ [Claude] Error in recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Analyze mutual funds
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async analyzeMutualFunds(req, res) {
    try {
      const { category, systemPrompt } = req.body;

      const prompt = `Analyze ${category || 'equity'} mutual funds and provide investment insights. Include:
      1. Top performing funds in the category
      2. Risk-return analysis
      3. Fund selection criteria
      4. Investment strategies for different goals
      5. SIP vs lump sum recommendations
      6. Tax implications and considerations
      7. Market outlook for the category`;

      const defaultSystemPrompt = `You are a mutual fund expert specializing in Indian mutual funds. Provide comprehensive analysis with the following focus:

1. Evaluate fund performance across different time periods
2. Analyze expense ratios and fund management quality
3. Consider risk metrics (Sharpe ratio, beta, alpha)
4. Assess fund manager track record and strategy
5. Evaluate portfolio composition and diversification
6. Consider tax efficiency and exit load implications
7. Provide recommendations based on investment goals
8. Include both active and passive fund options

Always consider the investor's risk profile and investment horizon.`;

      const result = await this.generateResponse(prompt, systemPrompt || defaultSystemPrompt);

      if (result.success) {
        const analysis = this.parseMutualFundResponse(result.data.content);
        
        res.json({
          success: true,
          data: analysis,
          message: 'Mutual fund analysis generated successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to generate mutual fund analysis',
          error: result.error
        });
      }
    } catch (error) {
      logger.error('❌ [Claude] Error in mutual fund analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Generate market outlook
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateMarketOutlook(req, res) {
    try {
      const { timeframe, systemPrompt } = req.body;

      const prompt = `Generate a ${timeframe || 'short-term'} market outlook for Indian markets. Include:
      1. Key market drivers and trends
      2. Sector rotation analysis
      3. Risk factors and concerns
      4. Investment opportunities
      5. Market sentiment indicators
      6. Economic factors impact
      7. Global market correlations
      8. Specific recommendations`;

      const defaultSystemPrompt = `You are a senior market strategist with deep knowledge of Indian markets. Provide comprehensive market outlook with the following approach:

1. Analyze macroeconomic indicators and policy impacts
2. Evaluate sector-specific trends and opportunities
3. Consider global market correlations and FII/DII flows
4. Assess technical indicators and market momentum
5. Evaluate earnings growth and valuation metrics
6. Consider geopolitical and policy risks
7. Provide actionable investment strategies
8. Include both bullish and bearish scenarios

Maintain a balanced perspective and include appropriate risk warnings.`;

      const result = await this.generateResponse(prompt, systemPrompt || defaultSystemPrompt);

      if (result.success) {
        const outlook = this.parseOutlookResponse(result.data.content);
        
        res.json({
          success: true,
          data: outlook,
          message: 'Market outlook generated successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to generate market outlook',
          error: result.error
        });
      }
    } catch (error) {
      logger.error('❌ [Claude] Error in market outlook:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Parse analysis response into structured format
   * @param {string} content - Claude response content
   * @returns {Object} Parsed analysis
   */
  parseAnalysisResponse(content) {
    try {
      // Extract key insights and recommendations
      const analysis = content.split('\n\n')[0] || content;
      const recommendations = content.includes('Recommendations:') 
        ? content.split('Recommendations:')[1]?.split('\n').filter(line => line.trim().startsWith('-'))
        : [];

      return {
        analysis: analysis,
        recommendations: recommendations.map(rec => rec.replace('-', '').trim()),
        summary: analysis.substring(0, 200) + '...',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ [Claude] Error parsing analysis response:', error);
      return {
        analysis: content,
        recommendations: [],
        summary: content.substring(0, 200) + '...',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Parse sentiment response
   * @param {string} content - Claude response content
   * @returns {Object} Parsed sentiment
   */
  parseSentimentResponse(content) {
    try {
      return {
        sentiment: content,
        summary: content.substring(0, 200) + '...',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ [Claude] Error parsing sentiment response:', error);
      return {
        sentiment: content,
        summary: content.substring(0, 200) + '...',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Parse recommendations response
   * @param {string} content - Claude response content
   * @returns {Object} Parsed recommendations
   */
  parseRecommendationsResponse(content) {
    try {
      return {
        recommendations: content,
        summary: content.substring(0, 200) + '...',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ [Claude] Error parsing recommendations response:', error);
      return {
        recommendations: content,
        summary: content.substring(0, 200) + '...',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Parse mutual fund response
   * @param {string} content - Claude response content
   * @returns {Object} Parsed mutual fund analysis
   */
  parseMutualFundResponse(content) {
    try {
      return {
        analysis: content,
        summary: content.substring(0, 200) + '...',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ [Claude] Error parsing mutual fund response:', error);
      return {
        analysis: content,
        summary: content.substring(0, 200) + '...',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Parse outlook response
   * @param {string} content - Claude response content
   * @returns {Object} Parsed outlook
   */
  parseOutlookResponse(content) {
    try {
      return {
        outlook: content,
        summary: content.substring(0, 200) + '...',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ [Claude] Error parsing outlook response:', error);
      return {
        outlook: content,
        summary: content.substring(0, 200) + '...',
        timestamp: new Date().toISOString()
      };
    }
  }
}

const claudeController = new ClaudeController();

module.exports = {
  analyzeMarket: (req, res) => claudeController.analyzeMarket(req, res),
  analyzeSentiment: (req, res) => claudeController.analyzeSentiment(req, res),
  generateRecommendations: (req, res) => claudeController.generateRecommendations(req, res),
  analyzeMutualFunds: (req, res) => claudeController.analyzeMutualFunds(req, res),
  generateMarketOutlook: (req, res) => claudeController.generateMarketOutlook(req, res)
};
