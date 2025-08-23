// File: backend/controllers/chatController.js
/**
 * Chat Controller for AI-powered financial advisory conversations
 * Handles client selection, conversation management, and AI interaction
 */

const mongoose = require('mongoose');
const ChatHistory = require('../models/ChatHistory');
const Client = require('../models/Client');
const Advisor = require('../models/Advisor');
const claudeAiService = require('../services/claudeAiService');
const { logger } = require('../utils/logger');

/**
 * Get all clients for chat selection
 * @route GET /api/chat/clients
 * @access Private (Advisor only)
 */
const getChatClients = async (req, res) => {
  const startTime = Date.now();
  const advisorId = req.advisor.id;
  
  try {
    console.log('📋 [CHAT] Loading clients for advisor:', {
      advisorId,
      timestamp: new Date().toISOString()
    });
    
    // Fetch all clients for this advisor with essential info only
    const clients = await Client.find(
      { advisor: advisorId },
      {
        firstName: 1,
        lastName: 1,
        email: 1,
        totalMonthlyIncome: 1,
        riskTolerance: 1,
        'enhancedRiskProfile.riskTolerance': 1,
        status: 1,
        'casData.parsedData.summary.total_value': 1,
        'portfolioSummary.totalValue': 1,
        createdAt: 1
      }
    ).sort({ firstName: 1, lastName: 1 });
    
    const duration = Date.now() - startTime;
    
    // Format clients for chat selection
    const formattedClients = clients.map(client => ({
      _id: client._id,
      id: client._id, // Backward compatibility
      name: `${client.firstName} ${client.lastName}`,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      monthlyIncome: client.totalMonthlyIncome || 0,
      portfolioValue: client.casData?.parsedData?.summary?.total_value || 
                     client.portfolioSummary?.totalValue || 0,
      riskProfile: client.enhancedRiskProfile?.riskTolerance || 
                   client.riskTolerance || 'Not assessed',
      status: client.status,
      onboardedAt: client.createdAt
    }));
    
    console.log('✅ [CHAT] Clients loaded successfully:', {
      advisorId,
      clientCount: formattedClients.length,
      duration: `${duration}ms`,
      sampleClient: formattedClients[0] ? {
        name: formattedClients[0].name,
        email: formattedClients[0].email,
        hasIncome: !!formattedClients[0].monthlyIncome,
        hasPortfolio: !!formattedClients[0].portfolioValue
      } : null
    });
    
    res.json({
      success: true,
      data: {
        clients: formattedClients,
        count: formattedClients.length
      },
      metadata: {
        advisorId,
        fetchTime: duration,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ [CHAT] Error loading clients:', {
      advisorId,
      error: error.message,
      duration: `${duration}ms`,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to load clients for chat',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get complete client financial context for AI
 * @route GET /api/chat/clients/:clientId/context
 * @access Private (Advisor only)
 */
const getClientContext = async (req, res) => {
  const startTime = Date.now();
  const advisorId = req.advisor.id;
  const { clientId } = req.params;
  
  try {
    console.log('🔍 [CHAT] Fetching client financial context:', {
      advisorId,
      clientId,
      timestamp: new Date().toISOString()
    });
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
    }
    
    // Fetch complete client data
    const client = await Client.findOne({
      _id: clientId,
      advisor: advisorId
    }).lean();
    
    if (!client) {
      console.log('❌ [CHAT] Client not found:', { advisorId, clientId });
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }
    
    const duration = Date.now() - startTime;
    
    // Calculate financial metrics
    const monthlyIncome = client.totalMonthlyIncome || 
                         (client.annualIncome || 0) / 12 + 
                         (client.additionalIncome || 0) / 12;
    
    const monthlyExpenses = client.totalMonthlyExpenses || 
                           calculateTotalExpenses(client.monthlyExpenses || {});
    
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    
    // Calculate total debts and EMIs
    const debtSummary = calculateDebtSummary(client.debtsAndLiabilities || {});
    
    // Calculate investment portfolio
    const investmentSummary = calculateInvestmentSummary(client.assets || {});
    
    // Portfolio value from CAS data
    const portfolioValue = client.casData?.parsedData?.summary?.total_value || 
                          client.portfolioSummary?.totalValue || 0;
    
    // Prepare financial context
    const financialContext = {
      clientInfo: {
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        age: calculateAge(client.dateOfBirth),
        riskProfile: client.enhancedRiskProfile?.riskTolerance || 
                    client.riskTolerance || 'Not assessed',
        investmentExperience: client.enhancedRiskProfile?.investmentExperience || 
                             client.investmentExperience || 'Not specified'
      },
      
      financialSituation: {
        monthlyIncome: Math.round(monthlyIncome),
        monthlyExpenses: Math.round(monthlyExpenses),
        monthlySurplus: Math.round(monthlySurplus),
        savingsRate: monthlyIncome > 0 ? Math.round((monthlySurplus / monthlyIncome) * 100) : 0
      },
      
      debtPortfolio: {
        totalEMIs: debtSummary.totalEMIs,
        totalOutstanding: debtSummary.totalOutstanding,
        activeDebts: debtSummary.activeDebts,
        debtToIncomeRatio: monthlyIncome > 0 ? 
          Math.round((debtSummary.totalEMIs / monthlyIncome) * 100) : 0
      },
      
      investmentPortfolio: {
        totalAssets: investmentSummary.totalAssets,
        cashSavings: client.assets?.cashBankSavings || 0,
        realEstate: client.assets?.realEstate || 0,
        portfolioValue: portfolioValue,
        assetBreakdown: investmentSummary.breakdown
      },
      
      financialGoals: formatFinancialGoals(client.enhancedFinancialGoals || {}),
      
      netWorth: investmentSummary.totalAssets - debtSummary.totalOutstanding,
      
      availableForInvestment: monthlySurplus - debtSummary.totalEMIs
    };
    
    console.log('✅ [CHAT] Client context prepared:', {
      clientId,
      clientName: financialContext.clientInfo.name,
      monthlyIncome: financialContext.financialSituation.monthlyIncome,
      monthlyExpenses: financialContext.financialSituation.monthlyExpenses,
      totalAssets: financialContext.investmentPortfolio.totalAssets,
      totalDebts: financialContext.debtPortfolio.totalOutstanding,
      netWorth: financialContext.netWorth,
      portfolioValue: financialContext.investmentPortfolio.portfolioValue,
      duration: `${duration}ms`
    });
    
    res.json({
      success: true,
      data: {
        clientContext: financialContext,
        fullClientData: client // Include full data for advanced use cases
      },
      metadata: {
        advisorId,
        clientId,
        contextGeneratedAt: new Date().toISOString(),
        processingTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ [CHAT] Error fetching client context:', {
      advisorId,
      clientId,
      error: error.message,
      duration: `${duration}ms`,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client financial context',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Send message to AI and get response
 * @route POST /api/chat/clients/:clientId/message
 * @access Private (Advisor only)
 */
const sendChatMessage = async (req, res) => {
  const startTime = Date.now();
  const advisorId = req.advisor.id;
  const { clientId } = req.params;
  const { message, conversationId } = req.body;
  
  try {
    console.log('💬 [CHAT] Processing message:', {
      advisorId,
      clientId,
      conversationId,
      messageLength: message?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    // Validate input
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
    }
    
    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await ChatHistory.findOne({
        conversationId,
        advisor: advisorId,
        client: clientId
      }).populate('client', 'firstName lastName email');
    }
    
    if (!conversation) {
      console.log('🆕 [CHAT] Creating new conversation');
      conversation = await ChatHistory.findOrCreateConversation(advisorId, clientId);
    }
    
    // Get complete client context
    const client = await Client.findOne({
      _id: clientId,
      advisor: advisorId
    }).lean();
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }
    
    // Add user message to conversation
    const userMessage = conversation.addMessage('advisor', message);
    
    // Format client context for AI
    const clientContext = formatClientContextForAI(client, message);
    
    // Create system prompt
    const systemPrompt = createFinancialAdvisorSystemPrompt();
    
    console.log('🤖 [CHAT] Sending to AI:', {
      conversationId: conversation.conversationId,
      systemPromptLength: systemPrompt.length,
      clientContextLength: clientContext.length,
      previousMessages: conversation.messages.length,
      clientName: `${client.firstName} ${client.lastName}`
    });
    
    // Send to AI
    const aiStartTime = Date.now();
    const aiResponse = await claudeAiService.makeRequest(
      systemPrompt,
      clientContext,
      0.7 // Temperature for conversational responses
    );
    const aiDuration = Date.now() - aiStartTime;
    
    if (!aiResponse.success) {
      console.error('❌ [CHAT] AI request failed:', {
        conversationId: conversation.conversationId,
        error: aiResponse.error,
        aiDuration: `${aiDuration}ms`
      });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to get AI response',
        error: aiResponse.error
      });
    }
    
    // Add AI response to conversation
    const aiMessage = conversation.addMessage('ai', aiResponse.content, {
      tokens: aiResponse.usage?.total_tokens || 0,
      processingTime: aiDuration,
      contextLength: clientContext.length,
      aiModel: 'claude-3-5-sonnet-20241022'
    });
    
    // Save conversation
    await conversation.save();
    
    const totalDuration = Date.now() - startTime;
    
    console.log('✅ [CHAT] Message processed successfully:', {
      conversationId: conversation.conversationId,
      userMessageId: userMessage.messageId,
      aiMessageId: aiMessage.messageId,
      aiDuration: `${aiDuration}ms`,
      totalDuration: `${totalDuration}ms`,
      tokensUsed: aiResponse.usage?.total_tokens || 0,
      conversationLength: conversation.messages.length
    });
    
    res.json({
      success: true,
      data: {
        conversationId: conversation.conversationId,
        response: aiResponse.content,
        userMessage: {
          messageId: userMessage.messageId,
          content: message,
          timestamp: userMessage.timestamp
        },
        aiMessage: {
          messageId: aiMessage.messageId,
          content: aiResponse.content,
          timestamp: aiMessage.timestamp
        },
        usage: aiResponse.usage,
        conversationStats: conversation.stats
      },
      metadata: {
        advisorId,
        clientId,
        aiProcessingTime: aiDuration,
        totalProcessingTime: totalDuration,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    
    console.error('❌ [CHAT] Error processing message:', {
      advisorId,
      clientId,
      conversationId,
      error: error.message,
      totalDuration: `${totalDuration}ms`,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get chat history for a client
 * @route GET /api/chat/clients/:clientId/history
 * @access Private (Advisor only)
 */
const getChatHistory = async (req, res) => {
  const startTime = Date.now();
  const advisorId = req.advisor.id;
  const { clientId } = req.params;
  const { limit = 1, includeArchived = false } = req.query;
  
  try {
    console.log('📚 [CHAT] Loading chat history:', {
      advisorId,
      clientId,
      limit: parseInt(limit),
      includeArchived,
      timestamp: new Date().toISOString()
    });
    
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
    }
    
    // Build query
    const query = {
      advisor: advisorId,
      client: clientId
    };
    
    if (!includeArchived) {
      query.status = { $ne: 'archived' };
    }
    
    // Find conversations
    const conversations = await ChatHistory.find(query)
      .populate('client', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));
    
    const duration = Date.now() - startTime;
    
    // Format response
    const formattedConversations = conversations.map(conv => ({
      conversationId: conv.conversationId,
      title: conv.title,
      status: conv.status,
      messageCount: conv.stats.totalMessages,
      lastActivity: conv.stats.lastActivity,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      recentMessages: conv.getRecentMessages(5), // Last 5 messages for preview
      summary: conv.summary
    }));
    
    console.log('✅ [CHAT] Chat history loaded:', {
      advisorId,
      clientId,
      conversationsFound: formattedConversations.length,
      duration: `${duration}ms`,
      totalMessages: formattedConversations.reduce((sum, conv) => sum + conv.messageCount, 0)
    });
    
    res.json({
      success: true,
      data: {
        conversations: formattedConversations,
        count: formattedConversations.length
      },
      metadata: {
        advisorId,
        clientId,
        fetchTime: duration,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ [CHAT] Error loading chat history:', {
      advisorId,
      clientId,
      error: error.message,
      duration: `${duration}ms`,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to load chat history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get detailed conversation messages
 * @route GET /api/chat/conversations/:conversationId
 * @access Private (Advisor only)
 */
const getConversationMessages = async (req, res) => {
  const startTime = Date.now();
  const advisorId = req.advisor.id;
  const { conversationId } = req.params;
  
  try {
    console.log('📖 [CHAT] Loading conversation messages:', {
      advisorId,
      conversationId,
      timestamp: new Date().toISOString()
    });
    
    const conversation = await ChatHistory.findOne({
      conversationId,
      advisor: advisorId
    }).populate('client', 'firstName lastName email');
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied'
      });
    }
    
    const duration = Date.now() - startTime;
    
    console.log('✅ [CHAT] Conversation messages loaded:', {
      conversationId,
      messageCount: conversation.messages.length,
      clientName: conversation.clientName,
      duration: `${duration}ms`
    });
    
    res.json({
      success: true,
      data: {
        conversation: {
          conversationId: conversation.conversationId,
          title: conversation.title,
          status: conversation.status,
          clientName: conversation.clientName,
          messages: conversation.messages,
          stats: conversation.stats,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        }
      },
      metadata: {
        advisorId,
        fetchTime: duration,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ [CHAT] Error loading conversation:', {
      advisorId,
      conversationId,
      error: error.message,
      duration: `${duration}ms`,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to load conversation messages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total monthly expenses from expense breakdown
 */
function calculateTotalExpenses(expenses) {
  return (expenses.housingRent || 0) +
         (expenses.groceriesUtilitiesFood || 0) +
         (expenses.transportation || 0) +
         (expenses.education || 0) +
         (expenses.healthcare || 0) +
         (expenses.entertainment || 0) +
         (expenses.insurancePremiums || 0) +
         (expenses.loanEmis || 0) +
         (expenses.otherExpenses || 0);
}

/**
 * Calculate debt summary from debts and liabilities
 */
function calculateDebtSummary(debtsAndLiabilities) {
  let totalEMIs = 0;
  let totalOutstanding = 0;
  let activeDebts = [];
  
  Object.entries(debtsAndLiabilities).forEach(([debtType, debt]) => {
    if (debt && (debt.hasLoan || debt.hasDebt)) {
      const emi = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
      const outstanding = parseFloat(debt.outstandingAmount) || parseFloat(debt.totalOutstanding) || 0;
      const interestRate = parseFloat(debt.interestRate) || parseFloat(debt.averageInterestRate) || 0;
      
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
  
  return { totalEMIs, totalOutstanding, activeDebts };
}

/**
 * Calculate investment summary from assets
 */
function calculateInvestmentSummary(assets) {
  let totalAssets = assets.cashBankSavings || 0;
  totalAssets += assets.realEstate || 0;
  
  const breakdown = {
    cash: assets.cashBankSavings || 0,
    realEstate: assets.realEstate || 0,
    equity: 0,
    debt: 0,
    other: 0
  };
  
  if (assets.investments) {
    if (assets.investments.equity) {
      breakdown.equity = (assets.investments.equity.mutualFunds || 0) + 
                        (assets.investments.equity.directStocks || 0);
      totalAssets += breakdown.equity;
    }
    
    if (assets.investments.fixedIncome) {
      breakdown.debt = (assets.investments.fixedIncome.ppf || 0) +
                      (assets.investments.fixedIncome.epf || 0) +
                      (assets.investments.fixedIncome.nps || 0) +
                      (assets.investments.fixedIncome.fixedDeposits || 0) +
                      (assets.investments.fixedIncome.bondsDebentures || 0) +
                      (assets.investments.fixedIncome.nsc || 0);
      totalAssets += breakdown.debt;
    }
    
    if (assets.investments.other) {
      breakdown.other = (assets.investments.other.ulip || 0) +
                       (assets.investments.other.otherInvestments || 0);
      totalAssets += breakdown.other;
    }
  }
  
  return { totalAssets, breakdown };
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Format financial goals for AI context
 */
function formatFinancialGoals(enhancedFinancialGoals) {
  const goals = [];
  
  if (enhancedFinancialGoals.emergencyFund?.targetAmount) {
    goals.push(`Emergency Fund: ₹${enhancedFinancialGoals.emergencyFund.targetAmount.toLocaleString('en-IN')}`);
  }
  
  if (enhancedFinancialGoals.childEducation?.isApplicable) {
    goals.push(`Child Education: ${enhancedFinancialGoals.childEducation.targetAmount ? 
      `₹${enhancedFinancialGoals.childEducation.targetAmount.toLocaleString('en-IN')} by ${enhancedFinancialGoals.childEducation.targetYear}` : 
      'Planning required'}`);
  }
  
  if (enhancedFinancialGoals.homePurchase?.isApplicable) {
    goals.push(`Home Purchase: ${enhancedFinancialGoals.homePurchase.targetAmount ? 
      `₹${enhancedFinancialGoals.homePurchase.targetAmount.toLocaleString('en-IN')} by ${enhancedFinancialGoals.homePurchase.targetYear}` : 
      'Planning required'}`);
  }
  
  if (enhancedFinancialGoals.customGoals?.length > 0) {
    enhancedFinancialGoals.customGoals.forEach(goal => {
      goals.push(`${goal.goalName}: ₹${goal.targetAmount?.toLocaleString('en-IN')} by ${goal.targetYear}`);
    });
  }
  
  return goals;
}

/**
 * Create system prompt for financial advisor AI
 */
function createFinancialAdvisorSystemPrompt() {
  return `You are RichieAI, a highly knowledgeable and experienced financial advisor assistant with expertise in Indian financial markets, tax planning, investment strategies, and comprehensive financial planning. You help financial advisors provide personalized advice to their clients.

IMPORTANT GUIDELINES:
- Be conversational, professional, and empathetic in your responses
- Provide specific, actionable advice based on the client's actual financial data
- Use exact numbers from their financial profile when making recommendations
- Explain financial concepts in clear, simple terms that clients can understand
- Always consider their risk profile, investment goals, and life stage when making suggestions
- Reference their actual holdings, debts, and financial situation in your advice
- Suggest concrete next steps they can take to improve their financial health
- Be encouraging but realistic about their financial situation and goals
- Focus on Indian financial products, regulations, and market conditions

YOUR EXPERTISE INCLUDES:
- Investment strategy and portfolio optimization
- Debt management and restructuring strategies
- Goal-based financial planning and SIP calculations
- Tax planning and optimization under Indian tax laws
- Risk assessment and insurance planning
- Emergency fund planning and liquid investments
- Retirement planning with EPF, PPF, NPS considerations
- Mutual fund selection and asset allocation
- Real estate investment analysis
- Estate planning basics

COMMUNICATION STYLE:
- Use a warm, advisory tone like a trusted financial counselor
- Provide step-by-step action plans when appropriate
- Include specific numbers and calculations in your recommendations
- Acknowledge both strengths and areas for improvement in their finances
- Ask clarifying questions when you need more context for better advice

Remember: You're assisting a financial advisor in providing better counsel to their client, so your insights should help the advisor deliver more personalized and effective guidance.`;
}

/**
 * Format client context for AI consumption
 */
function formatClientContextForAI(client, userMessage) {
  // Calculate financial metrics (reuse helper functions)
  const monthlyIncome = client.totalMonthlyIncome || 
                       (client.annualIncome || 0) / 12 + 
                       (client.additionalIncome || 0) / 12;
  
  const monthlyExpenses = client.totalMonthlyExpenses || 
                         calculateTotalExpenses(client.monthlyExpenses || {});
  
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const debtSummary = calculateDebtSummary(client.debtsAndLiabilities || {});
  const investmentSummary = calculateInvestmentSummary(client.assets || {});
  const availableForInvestment = monthlySurplus - debtSummary.totalEMIs;
  
  // Portfolio value from CAS
  const portfolioValue = client.casData?.parsedData?.summary?.total_value || 0;
  
  // Goals context
  const goalsContext = formatFinancialGoals(client.enhancedFinancialGoals || {});
  
  return `FINANCIAL CONSULTATION CONTEXT:

CLIENT PROFILE:
- Name: ${client.firstName} ${client.lastName}
- Age: ${calculateAge(client.dateOfBirth) || 'Not specified'}
- Risk Profile: ${client.enhancedRiskProfile?.riskTolerance || client.riskTolerance || 'Not assessed'}
- Investment Experience: ${client.enhancedRiskProfile?.investmentExperience || client.investmentExperience || 'Not specified'}
- Occupation: ${client.occupation || 'Not specified'}

CURRENT FINANCIAL SITUATION:
- Monthly Income: ₹${Math.round(monthlyIncome).toLocaleString('en-IN')}
- Monthly Expenses: ₹${Math.round(monthlyExpenses).toLocaleString('en-IN')}
- Monthly Surplus: ₹${Math.round(monthlySurplus).toLocaleString('en-IN')}
- Savings Rate: ${monthlyIncome > 0 ? Math.round((monthlySurplus / monthlyIncome) * 100) : 0}%

DEBT PORTFOLIO:
${debtSummary.activeDebts.length > 0 ? 
  debtSummary.activeDebts.map(debt => 
    `- ${debt.type}: EMI ₹${debt.emi.toLocaleString('en-IN')}, Outstanding ₹${debt.outstanding.toLocaleString('en-IN')}, Rate ${debt.interestRate}%`
  ).join('\n') : 
  '- No active debts (Excellent financial position)'}
- Total Monthly EMIs: ₹${Math.round(debtSummary.totalEMIs).toLocaleString('en-IN')}
- Total Outstanding Debt: ₹${Math.round(debtSummary.totalOutstanding).toLocaleString('en-IN')}

INVESTMENT PORTFOLIO:
- Cash & Savings: ₹${(client.assets?.cashBankSavings || 0).toLocaleString('en-IN')}
- Equity Investments: ₹${Math.round(investmentSummary.breakdown.equity).toLocaleString('en-IN')}
- Debt Investments: ₹${Math.round(investmentSummary.breakdown.debt).toLocaleString('en-IN')}
- Real Estate: ₹${Math.round(investmentSummary.breakdown.realEstate).toLocaleString('en-IN')}
- Other Investments: ₹${Math.round(investmentSummary.breakdown.other).toLocaleString('en-IN')}
- Total Assets: ₹${Math.round(investmentSummary.totalAssets).toLocaleString('en-IN')}
${portfolioValue > 0 ? `- CAS Portfolio Value: ₹${portfolioValue.toLocaleString('en-IN')}` : ''}

FINANCIAL GOALS:
${goalsContext.length > 0 ? goalsContext.map(goal => `- ${goal}`).join('\n') : '- No specific goals documented'}

FINANCIAL HEALTH METRICS:
- Net Worth: ₹${Math.round(investmentSummary.totalAssets - debtSummary.totalOutstanding).toLocaleString('en-IN')}
- Available for Investment: ₹${Math.round(availableForInvestment).toLocaleString('en-IN')}
- Debt-to-Income Ratio: ${monthlyIncome > 0 ? Math.round((debtSummary.totalEMIs / monthlyIncome) * 100) : 0}%

ADVISOR QUESTION/CONSULTATION:
"${userMessage}"

Please provide personalized, actionable financial advice based on this client's specific situation. Use their actual numbers and circumstances to give targeted recommendations that the advisor can discuss with their client.`;
}

module.exports = {
  getChatClients,
  getClientContext,
  sendChatMessage,
  getChatHistory,
  getConversationMessages
};