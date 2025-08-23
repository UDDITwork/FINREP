// File: backend/routes/finalReport.js
const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

// Import all database models
const Vault = require('../models/Vault');
const Client = require('../models/Client');
const Advisor = require('../models/Advisor');
const FinancialPlan = require('../models/FinancialPlan');
const KYCVerification = require('../models/KYCVerification');
const Meeting = require('../models/Meeting');
const ChatHistory = require('../models/ChatHistory');
const MutualFundExitStrategy = require('../models/MutualFundExitStrategy');
const ABTestSession = require('../models/ABTestSession');
const LOE = require('../models/LOE');
const LOEAutomation = require('../models/LOEAutomation');
const Transcription = require('../models/Transcription');
const ClientInvitation = require('../models/ClientInvitation');

// Middleware to verify advisor authentication
const authMiddleware = require('../middleware/auth');

// GET /api/final-report/clients/:advisorId
// Fetch all clients for advisor selection
router.get('/clients/:advisorId', authMiddleware, async (req, res) => {
  try {
    const { advisorId } = req.params;
    
    logger.info('📋 [FinalReport] Fetching clients for advisor', { 
      advisorId,
      authenticatedAdvisorId: req.advisor.id,
      authenticatedAdvisorEmail: req.advisor.email,
      typeComparison: {
        reqAdvisorIdType: typeof req.advisor.id,
        advisorIdType: typeof advisorId,
        reqAdvisorIdValue: req.advisor.id,
        advisorIdValue: advisorId
      }
    });

    // Verify the authenticated user is requesting their own data
    // Handle both string and ObjectId comparisons
    const authenticatedId = req.advisor.id.toString();
    const requestedId = advisorId.toString();
    
    if (authenticatedId !== requestedId) {
      logger.warn('🔒 [FinalReport] Unauthorized access attempt', {
        authenticatedAdvisorId: req.advisor.id,
        requestedAdvisorId: advisorId,
        advisorEmail: req.advisor.email,
        comparison: {
          authenticatedId,
          requestedId,
          authenticatedIdType: typeof req.advisor.id,
          requestedIdType: typeof advisorId
        }
      });
      
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to advisor data'
      });
    }

    // Fetch all clients for this advisor
    const clients = await Client.find({ advisor: advisorId })
      .select('firstName lastName email phoneNumber status onboardingStep lastActiveDate')
      .lean();

    // Add portfolio value from CAS data
    const clientsWithPortfolio = clients.map(client => ({
      ...client,
      totalPortfolioValue: client.casData?.parsedData?.summary?.total_value || 0,
      hasCASData: client.casData && client.casData.casStatus !== 'not_uploaded'
    }));

    logger.info('✅ [FinalReport] Clients fetched successfully', {
      advisorId,
      clientCount: clientsWithPortfolio.length
    });

    res.json({
      success: true,
      clients: clientsWithPortfolio,
      count: clientsWithPortfolio.length
    });

  } catch (error) {
    logger.error('❌ [FinalReport] Error fetching clients', {
      advisorId: req.params.advisorId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/final-report/data/:advisorId/:clientId
// Fetch ALL comprehensive data for PDF generation from all 13 models
router.get('/data/:advisorId/:clientId', authMiddleware, async (req, res) => {
  try {
    const { advisorId, clientId } = req.params;
    
    logger.info('📊 [FinalReport] Fetching comprehensive data for PDF generation', { 
      advisorId,
      clientId,
      authenticatedAdvisorId: req.advisor.id,
      authenticatedAdvisorEmail: req.advisor.email,
      typeComparison: {
        reqAdvisorIdType: typeof req.advisor.id,
        advisorIdType: typeof advisorId,
        reqAdvisorIdValue: req.advisor.id,
        advisorIdValue: advisorId
      }
    });

    // Verify the authenticated user is requesting their own data
    // Handle both string and ObjectId comparisons
    const authenticatedId = req.advisor.id.toString();
    const requestedId = advisorId.toString();
    
    if (authenticatedId !== requestedId) {
      logger.warn('🔒 [FinalReport] Unauthorized access attempt', {
        authenticatedAdvisorId: req.advisor.id,
        requestedAdvisorId: advisorId,
        advisorEmail: req.advisor.email,
        comparison: {
          authenticatedId,
          requestedId,
          authenticatedIdType: typeof req.advisor.id,
          requestedIdType: typeof advisorId
        }
      });
      
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to advisor data'
      });
    }

    // Verify client belongs to advisor
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found or unauthorized access'
      });
    }

    // Fetch data from ALL 13 models in parallel for performance
    const [
      vault,
      advisorData,
      financialPlans,
      kycVerifications,
      meetings,
      chatHistory,
      mutualFundStrategies,
      abTestSessions,
      loeDocuments,
      loeAutomation,
      transcriptions,
      clientInvitations
    ] = await Promise.all([
      // 1. Vault (Advisor branding and professional details)
      Vault.findOne({ advisorId }).lean(),
      
      // 2. Advisor (Basic advisor information)
      Advisor.findById(advisorId).select('-password').lean(),
      
      // 3. Financial Plans
      FinancialPlan.find({ clientId, advisorId }).lean(),
      
      // 4. KYC Verifications
      KYCVerification.find({ clientId, advisorId }).lean(),
      
      // 5. Meetings
      Meeting.find({ clientId, advisorId }).lean(),
      
      // 6. Chat History
      ChatHistory.find({ client: clientId, advisor: advisorId }).lean(),
      
      // 7. Mutual Fund Exit Strategies
      MutualFundExitStrategy.find({ clientId, advisorId }).lean(),
      
      // 8. AB Test Sessions
      ABTestSession.find({ clientId, advisorId }).lean(),
      
      // 9. LOE Documents
      LOE.find({ clientId, advisorId }).lean(),
      
      // 10. LOE Automation
      LOEAutomation.find({ clientId, advisorId }).lean(),
      
      // 11. Transcriptions
      Transcription.find({ clientId, advisorId }).lean(),
      
      // 12. Client Invitations
      ClientInvitation.find({ clientId, advisorId }).lean()
    ]);

    // Generate report metadata
    const reportId = `REP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const generatedAt = new Date();

    // Calculate summary statistics
    const totalServices = [
      financialPlans.length,
      kycVerifications.length,
      meetings.length,
      chatHistory.length,
      mutualFundStrategies.length,
      abTestSessions.length,
      loeDocuments.length,
      loeAutomation.length,
      transcriptions.length,
      clientInvitations.length
    ].reduce((sum, count) => sum + count, 0);

    const activeServices = [
      financialPlans.filter(p => p.status === 'active').length,
      kycVerifications.filter(k => k.overallStatus === 'completed').length,
      meetings.filter(m => m.status === 'completed').length,
      chatHistory.filter(c => c.status === 'active').length,
      mutualFundStrategies.filter(s => s.status === 'approved').length,
      abTestSessions.filter(a => a.status === 'completed').length,
      loeDocuments.filter(l => l.status === 'signed').length,
      loeAutomation.filter(l => l.status === 'signed').length,
      transcriptions.filter(t => t.status === 'completed').length,
      clientInvitations.filter(i => i.status === 'completed').length
    ].reduce((sum, count) => sum + count, 0);

    const portfolioValue = client.casData?.parsedData?.summary?.total_value || 0;

    // Compile comprehensive data structure
    const comprehensiveData = {
      header: {
        advisor: advisorData || {},
        firm: vault || {},
        reportId,
        generatedAt,
        clientName: `${client.firstName} ${client.lastName}`
      },
      client: {
        personal: {
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phoneNumber: client.phoneNumber,
          dateOfBirth: client.dateOfBirth,
          panNumber: client.panNumber,
          maritalStatus: client.maritalStatus,
          numberOfDependents: client.numberOfDependents,
          occupation: client.occupation,
          employerBusinessName: client.employerBusinessName,
          address: client.address
        },
        financial: {
          totalMonthlyIncome: client.totalMonthlyIncome,
          totalMonthlyExpenses: client.totalMonthlyExpenses,
          incomeType: client.incomeType,
          expenseBreakdown: client.expenseBreakdown,
          assets: client.assets,
          debtsAndLiabilities: client.debtsAndLiabilities,
          insuranceCoverage: client.insuranceCoverage,
          netWorth: client.netWorth
        },
        goals: {
          retirementPlanning: client.retirementPlanning,
          majorGoals: client.majorGoals,
          enhancedFinancialGoals: client.enhancedFinancialGoals,
          enhancedRiskProfile: client.enhancedRiskProfile
        },
        casData: client.casData
      },
      services: {
        financialPlans: {
          count: financialPlans.length,
          plans: financialPlans
        },
        kyc: {
          count: kycVerifications.length,
          verifications: kycVerifications
        },
        meetings: {
          count: meetings.length,
          meetings: meetings
        },
        chatHistory: {
          count: chatHistory.length,
          conversations: chatHistory
        },
        mutualFundStrategies: {
          count: mutualFundStrategies.length,
          strategies: mutualFundStrategies
        },
        abTestSessions: {
          count: abTestSessions.length,
          sessions: abTestSessions
        },
        loeDocuments: {
          count: loeDocuments.length,
          documents: loeDocuments
        },
        loeAutomation: {
          count: loeAutomation.length,
          documents: loeAutomation
        },
        transcriptions: {
          count: transcriptions.length,
          transcriptions: transcriptions
        },
        clientInvitations: {
          count: clientInvitations.length,
          invitations: clientInvitations
        }
      },
      summary: {
        totalServices,
        activeServices,
        portfolioValue,
        clientSince: client.createdAt,
        lastActivity: client.lastActiveDate,
        onboardingProgress: client.onboardingStep
      }
    };

    logger.info('✅ [FinalReport] Comprehensive data fetched successfully', {
      advisorId,
      clientId,
      reportId,
      totalServices,
      activeServices,
      portfolioValue
    });

    res.json({
      success: true,
      data: comprehensiveData
    });

  } catch (error) {
    logger.error('❌ [FinalReport] Error fetching comprehensive data', {
      advisorId: req.params.advisorId,
      clientId: req.params.clientId,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch comprehensive data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'final-report',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    models: [
      'Vault', 'Client', 'Advisor', 'FinancialPlan', 'KYCVerification',
      'Meeting', 'ChatHistory', 'MutualFundExitStrategy', 'ABTestSession',
      'LOE', 'LOEAutomation', 'Transcription', 'ClientInvitation'
    ]
  });
});

// Test endpoint to check authentication (no auth required)
router.get('/test-auth', (req, res) => {
  const authHeader = req.header('Authorization');
  const hasToken = !!authHeader && authHeader.startsWith('Bearer ');
  
  res.json({
    success: true,
    message: 'Authentication test endpoint',
    hasAuthHeader: !!authHeader,
    hasBearerToken: hasToken,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check authentication context (requires auth)
router.get('/debug-auth', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication debug endpoint',
    advisor: {
      id: req.advisor.id,
      idType: typeof req.advisor.id,
      idString: req.advisor.id.toString(),
      email: req.advisor.email,
      firstName: req.advisor.firstName,
      lastName: req.advisor.lastName
    },
    headers: {
      authorization: req.header('Authorization') ? 'Present' : 'Missing',
      userAgent: req.header('User-Agent'),
      contentType: req.header('Content-Type')
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
