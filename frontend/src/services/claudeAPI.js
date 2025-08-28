/**
 * FILE LOCATION: frontend/src/services/claudeAPI.js
 * 
 * Claude API service for enhanced stock market insights, analysis,
 * and AI-powered market commentary. Provides intelligent market
 * analysis and recommendations.
 */

import api from './api';

// Claude API Configuration
const CLAUDE_API_KEY = import.meta.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// System prompt for Claude to act as a financial analyst
const SYSTEM_PROMPT = `You are an expert financial analyst and stock market advisor specializing in Indian markets. Your role is to:

1. Analyze stock market data and provide intelligent insights
2. Generate market commentary and trends analysis
3. Provide stock recommendations with risk assessment
4. Analyze mutual fund performance and suggest investment strategies
5. Monitor market indicators and provide technical analysis
6. Generate market sentiment analysis
7. Provide portfolio optimization suggestions

Key Responsibilities:
- Analyze NIFTY, SENSEX, and sectoral indices
- Monitor FII/DII flows and market sentiment
- Track global market correlations
- Provide risk-adjusted return analysis
- Monitor economic indicators and their impact
- Generate market outlook and predictions
- Analyze sector rotation and momentum

Always provide:
- Clear, actionable insights
- Risk warnings and disclaimers
- Data-driven analysis
- Balanced perspectives
- Professional financial advice tone

Format responses in JSON when requested for structured data.`;

/**
 * Get Claude AI market analysis
 * @param {string} prompt - Specific market analysis request
 * @param {Object} marketData - Current market data for context
 * @returns {Promise<Object>} Claude analysis with success status
 */
export const getClaudeAnalysis = async (prompt, marketData = {}) => {
  try {
    console.log('🤖 [Claude API] Requesting market analysis...');
    
    const response = await api.post('/claude/analyze', {
      prompt,
      marketData,
      systemPrompt: SYSTEM_PROMPT
    });
    
    console.log('✅ [Claude API] Market analysis received');
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('❌ [Claude API] Error getting analysis:', error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to get market analysis',
      error: error.message
    };
  }
};

/**
 * Get market sentiment analysis
 * @param {Array} stocks - Array of stock symbols
 * @returns {Promise<Object>} Sentiment analysis with success status
 */
export const getMarketSentiment = async (stocks = []) => {
  try {
    console.log('📊 [Claude API] Analyzing market sentiment...');
    
    const response = await api.post('/claude/sentiment', {
      stocks,
      systemPrompt: SYSTEM_PROMPT
    });
    
    console.log('✅ [Claude API] Sentiment analysis received');
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('❌ [Claude API] Error getting sentiment:', error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to get sentiment analysis',
      error: error.message
    };
  }
};

/**
 * Get stock recommendations
 * @param {string} sector - Sector to analyze (optional)
 * @param {string} riskProfile - Risk profile (low/medium/high)
 * @returns {Promise<Object>} Stock recommendations with success status
 */
export const getStockRecommendations = async (sector = '', riskProfile = 'medium') => {
  try {
    console.log('💡 [Claude API] Generating stock recommendations...');
    
    const response = await api.post('/claude/recommendations', {
      sector,
      riskProfile,
      systemPrompt: SYSTEM_PROMPT
    });
    
    console.log('✅ [Claude API] Recommendations received');
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('❌ [Claude API] Error getting recommendations:', error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to get recommendations',
      error: error.message
    };
  }
};

/**
 * Get mutual fund analysis
 * @param {string} category - Fund category (equity/debt/hybrid)
 * @returns {Promise<Object>} Mutual fund analysis with success status
 */
export const getMutualFundAnalysis = async (category = 'equity') => {
  try {
    console.log('📈 [Claude API] Analyzing mutual funds...');
    
    const response = await api.post('/claude/mutual-funds', {
      category,
      systemPrompt: SYSTEM_PROMPT
    });
    
    console.log('✅ [Claude API] Mutual fund analysis received');
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('❌ [Claude API] Error getting mutual fund analysis:', error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to get mutual fund analysis',
      error: error.message
    };
  }
};

/**
 * Get market outlook and predictions
 * @param {string} timeframe - Timeframe (short/medium/long term)
 * @returns {Promise<Object>} Market outlook with success status
 */
export const getMarketOutlook = async (timeframe = 'short') => {
  try {
    console.log('🔮 [Claude API] Generating market outlook...');
    
    const response = await api.post('/claude/outlook', {
      timeframe,
      systemPrompt: SYSTEM_PROMPT
    });
    
    console.log('✅ [Claude API] Market outlook received');
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('❌ [Claude API] Error getting market outlook:', error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to get market outlook',
      error: error.message
    };
  }
};

/**
 * Get technical analysis for a stock
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Technical analysis with success status
 */
export const getTechnicalAnalysis = async (symbol) => {
  try {
    console.log(`📊 [Claude API] Analyzing technical indicators for ${symbol}...`);
    
    const response = await api.post('/claude/technical-analysis', {
      symbol,
      systemPrompt: SYSTEM_PROMPT
    });
    
    console.log('✅ [Claude API] Technical analysis received');
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('❌ [Claude API] Error getting technical analysis:', error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to get technical analysis',
      error: error.message
    };
  }
};

/**
 * Get portfolio optimization suggestions
 * @param {Object} portfolio - Current portfolio data
 * @returns {Promise<Object>} Portfolio suggestions with success status
 */
export const getPortfolioSuggestions = async (portfolio) => {
  try {
    console.log('⚖️ [Claude API] Generating portfolio suggestions...');
    
    const response = await api.post('/claude/portfolio', {
      portfolio,
      systemPrompt: SYSTEM_PROMPT
    });
    
    console.log('✅ [Claude API] Portfolio suggestions received');
    
    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('❌ [Claude API] Error getting portfolio suggestions:', error);
    
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Failed to get portfolio suggestions',
      error: error.message
    };
  }
};

export default {
  getClaudeAnalysis,
  getMarketSentiment,
  getStockRecommendations,
  getMutualFundAnalysis,
  getMarketOutlook,
  getTechnicalAnalysis,
  getPortfolioSuggestions
};
