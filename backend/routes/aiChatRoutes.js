// File: backend/routes/aiChatRoutes.js
/**
 * API routes for AI chat functionality including client AI chat endpoints,
 * conversation management, and AI-powered financial advice generation.
 * This module handles all AI-related chat operations for the financial platform.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const claudeAiService = require('../services/claudeAiService');
const Client = require('../models/Client');

/**
 * @route   POST /api/clients/ai-chat
 * @desc    Chat with AI about a specific client's financial situation
 * @access  Private (Advisor only)
 */
router.post('/ai-chat', protect, async (req, res) => {
  try {
    const { clientId, message } = req.body;
    const advisorId = req.user.id;

    console.log('🤖 [AI Chat] Received chat request:', {
      advisorId,
      clientId,
      messageLength: message?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Validate input
    if (!clientId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Client ID and message are required'
      });
    }

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Get client data with comprehensive information
    console.log('📋 [AI Chat] Fetching client data...');
    const client = await Client.findOne({ 
      _id: clientId, 
      advisorId: advisorId 
    }).lean();

    if (!client) {
      console.log('❌ [AI Chat] Client not found:', { clientId, advisorId });
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }

    console.log('✅ [AI Chat] Client found:', {
      clientId,
      clientName: `${client.firstName} ${client.lastName}`,
      hasFinancialData: !!(client.totalMonthlyIncome || client.assets),
      hasDebts: !!client.debtsAndLiabilities,
      hasGoals: !!client.enhancedFinancialGoals
    });

    // Create system prompt for conversational AI
    const systemPrompt = `You are RichieAI, a helpful and knowledgeable financial advisor assistant. You have access to comprehensive financial information about the client and can provide personalized advice, recommendations, and answer questions about their financial situation.

IMPORTANT GUIDELINES:
- Be conversational, friendly, and professional
- Provide specific, actionable advice based on the client's actual financial data
- Use exact numbers from their portfolio when relevant
- Explain financial concepts in simple terms
- Always consider their risk profile and goals when making recommendations
- If asked about specific investments, reference their actual holdings
- Suggest concrete next steps they can take
- Be encouraging but realistic about their financial situation

You can discuss:
- Investment strategies and portfolio optimization
- Debt management and EMI restructuring
- Goal-based financial planning
- Tax planning and optimization
- Risk assessment and insurance needs
- Emergency fund planning
- Retirement planning strategies
- Specific mutual fund recommendations based on their profile

Remember: You're having a conversation with their financial advisor, so provide insights that help the advisor give better advice to their client.`;

    // Format client context for the AI
    const clientContext = formatClientContextForChat(client, message);

    console.log('🧠 [AI Chat] Sending request to Claude AI...');
    
    // Make request to Claude AI
    const aiResponse = await claudeAiService.makeRequest(
      systemPrompt,
      clientContext,
      0.7 // Higher temperature for more conversational responses
    );

    if (!aiResponse.success) {
      console.error('❌ [AI Chat] Claude AI request failed:', aiResponse.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get AI response',
        error: aiResponse.error
      });
    }

    console.log('✅ [AI Chat] AI response received:', {
      responseLength: aiResponse.content?.length || 0,
      hasUsage: !!aiResponse.usage
    });

    // Return the AI response
    res.json({
      success: true,
      response: aiResponse.content,
      usage: aiResponse.usage,
      clientInfo: {
        id: client._id,
        name: `${client.firstName} ${client.lastName}`,
        riskProfile: client.riskProfile || 'Not assessed'
      }
    });

  } catch (error) {
    console.error('❌ [AI Chat] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Format client data and user message for conversational AI chat
 */
function formatClientContextForChat(client, userMessage) {
  // Calculate key financial metrics
  const monthlyIncome = client.totalMonthlyIncome || 
                       client.calculatedFinancials?.totalMonthlyIncome || 0;
  const monthlyExpenses = client.totalMonthlyExpenses || 
                         client.calculatedFinancials?.totalMonthlyExpenses || 0;
  const monthlySurplus = monthlyIncome - monthlyExpenses;

  // Calculate total debts and EMIs
  let totalEMIs = 0;
  let totalOutstanding = 0;
  let activeDebts = [];

  if (client.debtsAndLiabilities) {
    Object.entries(client.debtsAndLiabilities).forEach(([debtType, debt]) => {
      if (debt && (debt.hasLoan || debt.hasDebt)) {
        const emi = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
        const outstanding = parseFloat(debt.outstandingAmount) || 0;
        const interestRate = parseFloat(debt.interestRate) || 0;
        
        if (emi > 0 || outstanding > 0) {
          totalEMIs += emi;
          totalOutstanding += outstanding;
          activeDebts.push({
            type: debtType,
            emi,
            outstanding,
            interestRate
          });
        }
      }
    });
  }

  const availableForInvestment = monthlySurplus - totalEMIs;

  // Calculate investment portfolio value
  let totalInvestments = 0;
  if (client.assets?.investments) {
    const investments = client.assets.investments;
    if (investments.equity) {
      totalInvestments += (investments.equity.mutualFunds || 0) + 
                         (investments.equity.directStocks || 0) + 
                         (investments.equity.elss || 0);
    }
    if (investments.fixedIncome) {
      totalInvestments += (investments.fixedIncome.ppf || 0) + 
                         (investments.fixedIncome.epf || 0) + 
                         (investments.fixedIncome.nps || 0) + 
                         (investments.fixedIncome.fixedDeposits || 0);
    }
  }

  // Format CAS portfolio data if available
  let portfolioSummary = '';
  if (client.portfolioSummary && client.portfolioSummary.totalValue > 0) {
    portfolioSummary = `
CURRENT PORTFOLIO (from CAS data):
- Total Portfolio Value: ₹${client.portfolioSummary.totalValue.toLocaleString('en-IN')}
- Total Holdings: ${client.portfolioSummary.totalFunds || 0} mutual funds
- Top Holdings: ${client.portfolioSummary.topHoldings?.slice(0, 3)?.map(h => 
  `${h.fundName} (₹${h.currentValue?.toLocaleString('en-IN')})`).join(', ') || 'N/A'}`;
  }

  // Format goals context
  let goalsContext = '';
  if (client.enhancedFinancialGoals) {
    const goals = client.enhancedFinancialGoals;
    goalsContext = `
CLIENT'S FINANCIAL GOALS:
${goals.emergencyFund?.targetAmount ? `- Emergency Fund: ₹${goals.emergencyFund.targetAmount.toLocaleString('en-IN')}` : ''}
${goals.childEducation?.isApplicable ? `- Child Education: ${goals.childEducation.details?.targetAmount ? `₹${goals.childEducation.details.targetAmount.toLocaleString('en-IN')} by ${goals.childEducation.details.targetYear}` : 'Planning required'}` : ''}
${goals.homePurchase?.isApplicable ? `- Home Purchase: ${goals.homePurchase.details?.targetAmount ? `₹${goals.homePurchase.details.targetAmount.toLocaleString('en-IN')} by ${goals.homePurchase.details.targetYear}` : 'Planning required'}` : ''}
${goals.customGoals?.length > 0 ? goals.customGoals.map(g => `- ${g.goalName}: ₹${g.targetAmount?.toLocaleString('en-IN')} by ${g.targetYear}`).join('\n') : ''}`;
  }

  return `FINANCIAL CONSULTATION CONTEXT:

CLIENT PROFILE:
- Name: ${client.firstName} ${client.lastName}
- Age: ${client.age || 'Not specified'}
- Risk Profile: ${client.riskProfile || client.enhancedRiskProfile?.riskTolerance || 'Not assessed'}
- Investment Experience: ${client.enhancedRiskProfile?.investmentExperience || 'Not specified'}

CURRENT FINANCIAL SITUATION:
- Monthly Income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Monthly Expenses: ₹${monthlyExpenses.toLocaleString('en-IN')}
- Monthly Surplus: ₹${monthlySurplus.toLocaleString('en-IN')}
- Monthly EMIs: ₹${totalEMIs.toLocaleString('en-IN')}
- Available for Investment: ₹${availableForInvestment.toLocaleString('en-IN')}

DEBT PORTFOLIO:
${activeDebts.length > 0 ? 
  activeDebts.map(debt => `- ${debt.type}: EMI ₹${debt.emi.toLocaleString('en-IN')}, Outstanding ₹${debt.outstanding.toLocaleString('en-IN')}, Rate ${debt.interestRate}%`).join('\n') : 
  '- No active debts (Excellent financial position)'}

INVESTMENT PORTFOLIO:
- Cash & Savings: ₹${(client.assets?.cashBankSavings || 0).toLocaleString('en-IN')}
- Total Investments: ₹${totalInvestments.toLocaleString('en-IN')}
${portfolioSummary}

${goalsContext}

ADVISOR QUESTION/CONSULTATION:
"${userMessage}"

Please provide a helpful, personalized response based on this client's specific financial situation. Be conversational but professional, and give actionable advice that the advisor can discuss with their client.`;
}

module.exports = router;