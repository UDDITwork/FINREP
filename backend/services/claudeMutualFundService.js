/**
 * FILE LOCATION: backend/services/claudeMutualFundService.js
 * 
 * PURPOSE: Service for integrating with Claude AI API to fetch mutual fund details
 * 
 * FUNCTIONALITY:
 * - Sends fund name and fund house to Claude AI
 * - Receives comprehensive fund information
 * - Parses and structures the response
 * - Handles API errors and rate limiting
 * - Caches responses for performance
 * 
 * CLAUDE AI INTEGRATION:
 * - Uses CLAUDE_API_KEY from environment variables
 * - Sends structured prompts for accurate responses
 * - Forces direct, factual responses without long paragraphs
 * - Searches relevant financial data sources
 * 
 * RESPONSE STRUCTURE:
 * - Fund category and launch date
 * - AUM, NAV, and performance metrics
 * - Fund managers and benchmark
 * - Risk profile and investment details
 * - Tax implications and expense ratios
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

// Get Claude API configuration from environment
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

/**
 * Generate a comprehensive system prompt for Claude AI
 * @param {string} fundName - Name of the mutual fund
 * @param {string} fundHouseName - Name of the fund house
 * @returns {string} - Formatted system prompt
 */
const generateSystemPrompt = (fundName, fundHouseName) => {
  return `You are a financial data expert specializing in Indian mutual funds. Your task is to provide accurate, factual information about the specified mutual fund.

FUND TO ANALYZE:
- Fund Name: ${fundName}
- Fund House: ${fundHouseName}

REQUIRED RESPONSE FORMAT (respond ONLY with the exact format below, no additional text):

Fund Name: [Exact fund name]
Category: [Equity - Large Cap/Mid Cap/Small Cap, Debt, Hybrid, etc.]
Launch Date: [DD-MMM-YYYY format]
AUM: [₹X,XXX.XX Cr format]
Latest NAV: [₹XXX.XX (DD-MMM-YYYY) format]
Fund Managers: [Name1, Name2, Name3]
Benchmark: [Benchmark name]
Risk: [Very High/High/Moderate/Low]
Returns (1Y/3Y/5Y): [X.XX% / X.XX% / X.XX% format]
Top 5 Holdings: [Company1, Company2, Company3, Company4, Company5]
Top 3 Sectors: [Sector1, Sector2, Sector3]
Min Investment (Lumpsum/SIP): [₹X / ₹X format]
Exit Load: [X% (if <X year) format]
Expense Ratio (Direct/Regular): [X.XX% / X.XX% format]
STCG Tax: [X% (<X year) format]
LTCG Tax: [X% (>₹X.XX lakh/year) format]
Investment Objective: [One sentence objective]
Suitable For: [Target investor profile, X+ year horizon]

IMPORTANT REQUIREMENTS:
1. Search for the most current and accurate data
2. If exact fund not found, provide closest match with clear indication
3. Use official fund house websites, AMFI, or SEBI sources
4. Provide actual numbers, not estimates
5. If any data is unavailable, mark as "Not Available"
6. Ensure all percentages and amounts are accurate
7. Use Indian Rupee (₹) format for all amounts
8. Keep responses factual and data-driven

RESPONSE RULES:
- NO long paragraphs or explanations
- NO generic advice or recommendations
- ONLY factual data in the exact format specified
- Use actual fund data, not examples
- If fund doesn't exist, clearly state "Fund Not Found"`;
};

/**
 * Fetch mutual fund details from Claude AI
 * @param {string} fundName - Name of the mutual fund
 * @param {string} fundHouseName - Name of the fund house
 * @returns {Object} - Structured fund information
 */
const fetchMutualFundDetails = async (fundName, fundHouseName) => {
  try {
    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY not configured');
    }

    logger.info(`Fetching mutual fund details for: ${fundName} (${fundHouseName})`);

    const systemPrompt = generateSystemPrompt(fundName, fundHouseName);
    
    const requestData = {
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for factual responses
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Please provide detailed information about the mutual fund: ${fundName} by ${fundHouseName}. Focus on current, accurate data from official sources.`
        }
      ]
    };

    const response = await axios.post(CLAUDE_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      timeout: 30000 // 30 second timeout
    });

    if (!response.data || !response.data.content || !response.data.content[0]) {
      throw new Error('Invalid response structure from Claude AI');
    }

    const content = response.data.content[0].text;
    logger.info(`Received response from Claude AI for ${fundName}`);

    // Return the raw content for parsing by the caller
    return {
      success: true,
      data: content
    };

  } catch (error) {
    logger.error(`Error fetching mutual fund details for ${fundName}:`, error);
    
    if (error.response) {
      // Claude API error
      return {
        success: false,
        error: `Claude AI API Error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`,
        statusCode: error.response.status
      };
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      return {
        success: false,
        error: 'Request timeout - Claude AI took too long to respond'
      };
    } else {
      // Other errors
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }
};

/**
 * Parse Claude AI response into structured data
 * @param {string} content - Raw response content from Claude AI
 * @returns {Object} - Parsed and structured fund data
 */
const parseClaudeResponse = (content) => {
  try {
    // Handle different response formats
    let lines;
    if (typeof content === 'string') {
      lines = content.split('\n').filter(line => line.trim());
    } else if (Array.isArray(content)) {
      lines = content;
    } else {
      throw new Error('Invalid content format');
    }
    
    const parsed = {};

    lines.forEach(line => {
      // Handle different line formats
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return;
      
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
        
        switch (key.trim()) {
          case 'Fund Name':
            parsed.fundName = value;
            break;
          case 'Category':
            parsed.category = value;
            break;
          case 'Launch Date':
            parsed.launchDate = value;
            break;
          case 'AUM':
            parsed.aum = value;
            break;
          case 'Latest NAV':
            parsed.latestNAV = value;
            break;
          case 'Fund Managers':
            parsed.fundManagers = value.split(',').map(m => m.trim());
            break;
          case 'Benchmark':
            parsed.benchmark = value;
            break;
          case 'Risk':
            parsed.risk = value;
            break;
          case 'Returns (1Y/3Y/5Y)':
            const returns = value.split('/').map(r => r.trim());
            parsed.returns = {
              oneYear: returns[0] || 'Not Available',
              threeYear: returns[1] || 'Not Available',
              fiveYear: returns[2] || 'Not Available'
            };
            break;
          case 'Top 5 Holdings':
            parsed.topHoldings = value.split(',').map(h => h.trim());
            break;
          case 'Top 3 Sectors':
            parsed.topSectors = value.split(',').map(s => s.trim());
            break;
          case 'Min Investment (Lumpsum/SIP)':
            const investment = value.split('/').map(i => i.trim());
            parsed.minInvestment = {
              lumpsum: investment[0] || 'Not Available',
              sip: investment[1] || 'Not Available'
            };
            break;
          case 'Exit Load':
            parsed.exitLoad = value;
            break;
          case 'Expense Ratio (Direct/Regular)':
            const expense = value.split('/').map(e => e.trim());
            parsed.expenseRatio = {
              direct: expense[0] || 'Not Available',
              regular: expense[1] || 'Not Available'
            };
            break;
          case 'STCG Tax':
            parsed.stcgTax = value;
            break;
          case 'LTCG Tax':
            parsed.ltcgTax = value;
            break;
          case 'Investment Objective':
            parsed.investmentObjective = value;
            break;
          case 'Suitable For':
            parsed.suitableFor = value;
            break;
        }
    });

    // Extract NAV date if available
    if (parsed.latestNAV && parsed.latestNAV.includes('(')) {
      const navMatch = parsed.latestNAV.match(/\((.*?)\)/);
      if (navMatch) {
        parsed.navDate = navMatch[1];
        parsed.latestNAV = parsed.latestNAV.replace(/\s*\(.*?\)/, '').trim();
      }
    }

    logger.info(`Successfully parsed Claude AI response for fund: ${parsed.fundName || 'Unknown'}`);
    logger.info(`Parsed data keys: ${Object.keys(parsed).join(', ')}`);
    return parsed;

  } catch (error) {
    logger.error('Error parsing Claude AI response:', error);
    logger.error('Content that failed to parse:', content);
    throw new Error(`Failed to parse Claude AI response: ${error.message}`);
  }
};

/**
 * Validate mutual fund data completeness
 * @param {Object} fundData - Parsed fund data
 * @returns {Object} - Validation result with missing fields
 */
const validateFundData = (fundData) => {
  const requiredFields = [
    'fundName', 'category', 'aum', 'latestNAV', 'fundManagers',
    'benchmark', 'risk', 'returns', 'topHoldings', 'topSectors'
  ];

  const missingFields = requiredFields.filter(field => {
    if (field === 'returns') {
      return !fundData.returns || !fundData.returns.oneYear;
    }
    if (field === 'topHoldings') {
      return !fundData.topHoldings || fundData.topHoldings.length === 0;
    }
    if (field === 'topSectors') {
      return !fundData.topSectors || fundData.topSectors.length === 0;
    }
    return !fundData[field];
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
    completeness: ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
  };
};

module.exports = {
  fetchMutualFundDetails,
  parseClaudeResponse,
  validateFundData,
  generateSystemPrompt
};
