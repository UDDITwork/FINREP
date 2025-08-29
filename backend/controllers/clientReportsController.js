/**
 * FILE LOCATION: backend/controllers/clientReportsController.js
 * 
 * PURPOSE: Comprehensive client reports controller - FETCHES ALL DATA
 * 
 * FUNCTIONALITY: 
 * - Fetches client list for advisor
 * - Retrieves COMPLETE client data from ALL models
 * - Provides detailed client report with ALL related information
 * - Comprehensive error logging and debugging
 */

const { logger, logDatabase } = require('../utils/logger');
const Client = require('../models/Client');
const Vault = require('../models/Vault');
const FinancialPlan = require('../models/FinancialPlan');
const Meeting = require('../models/Meeting');
const LOE = require('../models/LOE');
const LOEAutomation = require('../models/LOEAutomation');
const ABTestSession = require('../models/ABTestSession');
const ChatHistory = require('../models/ChatHistory');
const MutualFundExitStrategy = require('../models/MutualFundExitStrategy');
const ClientInvitation = require('../models/ClientInvitation');

// Helper function to ensure all fields have fallback values
const ensureFieldAvailability = (obj, fallback = 'Not Available') => {
  if (!obj || typeof obj !== 'object') return fallback;
  
  const processedObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined || value === '') {
      processedObj[key] = fallback;
    } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      processedObj[key] = ensureFieldAvailability(value, fallback);
    } else if (Array.isArray(value)) {
      processedObj[key] = value.length > 0 ? value : [fallback];
    } else {
      processedObj[key] = value;
    }
  }
  return processedObj;
};

// Enhanced logging function
const logDebug = (stage, data, error = null) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] 🔍 [CLIENT REPORTS DEBUG] ${stage}`);
  
  if (error) {
    console.error(`❌ ERROR:`, error.message);
    console.error(`Stack:`, error.stack);
    logger.error(`[CLIENT REPORTS] ${stage} - ERROR: ${error.message}`, { 
      error: error.stack,
      data: data || 'No data'
    });
  } else {
    console.log(`✅ SUCCESS:`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    logger.info(`[CLIENT REPORTS] ${stage} - SUCCESS`, { data });
  }
};

// Get advisor's vault data for header
const getAdvisorVaultData = async (req, res) => {
  try {
    const startTime = Date.now();
    const advisorId = req.advisor.id;

    logDebug('VAULT DATA FETCH START', { advisorId });

    // Fetch COMPLETE vault data (no select limitation)
    const vaultData = await Vault.findOne({ advisorId });

    if (!vaultData) {
      logDebug('VAULT DATA NOT FOUND', { advisorId });
      return res.status(404).json({
        success: false,
        message: 'Advisor vault data not found',
        needsVaultUpdate: true,
        prompt: 'Please complete your vault profile to access client reports'
      });
    }

    // Apply fallback values to ALL vault fields
    const processedVaultData = ensureFieldAvailability(vaultData.toObject());

    const duration = Date.now() - startTime;
    logDatabase.queryExecution('Vault', 'findOne', duration);
    
    logDebug('VAULT DATA FETCH COMPLETED', { 
      duration: `${duration}ms`,
      fieldsCount: Object.keys(processedVaultData).length
    });

    res.json({
      success: true,
      data: processedVaultData,
      needsVaultUpdate: !vaultData.firstName || !vaultData.lastName || !vaultData.email
    });

  } catch (error) {
    logDebug('VAULT DATA FETCH FAILED', { advisorId: req.advisor?.id }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advisor vault data',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get client list for advisor
const getClientList = async (req, res) => {
  try {
    const startTime = Date.now();
    const advisorId = req.advisor.id;

    logDebug('CLIENT LIST FETCH START', { advisorId });

    // Fetch COMPLETE client data (no select limitation)
    const clients = await Client.find({ advisor: advisorId })
      .sort({ createdAt: -1 });

    const duration = Date.now() - startTime;
    logDatabase.queryExecution('Client', 'find', duration);
    
    // Process each client to ensure all fields have fallbacks
    const processedClients = clients.map(client => {
      const clientObj = client.toObject();
      return ensureFieldAvailability(clientObj);
    });

    logDebug('CLIENT LIST FETCH COMPLETED', { 
      duration: `${duration}ms`,
      clientCount: clients.length,
      sampleClientFields: clients.length > 0 ? Object.keys(clients[0].toObject()).length : 0
    });

    res.json({
      success: true,
      data: processedClients,
      count: clients.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logDebug('CLIENT LIST FETCH FAILED', { advisorId: req.advisor?.id }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client list',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get comprehensive client report - COMPLETE IMPLEMENTATION
const getClientReport = async (req, res) => {
  try {
    const startTime = Date.now();
    const { clientId } = req.params;
    const advisorId = req.advisor.id;

    logDebug('COMPREHENSIVE REPORT START', { clientId, advisorId });

    // ENHANCED: Validate and clean clientId format
    if (!clientId) {
      logDebug('CLIENT ID MISSING', { clientId, advisorId });
      return res.status(400).json({
        success: false,
        message: 'Client ID is required',
        clientId,
        advisorId,
        timestamp: new Date().toISOString()
      });
    }

    // Check for common invalid formats
    if (clientId === '[object Object]' || 
        clientId === 'undefined' || 
        clientId === 'null' || 
        clientId.includes('[object') ||
        clientId.includes('Object]')) {
      logDebug('INVALID CLIENT ID FORMAT DETECTED', { 
        clientId, 
        advisorId,
        length: clientId.length,
        type: typeof clientId 
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID format detected',
        error: 'Client ID appears to be a malformed object reference',
        clientId,
        suggestion: 'Please return to client list and try again',
        timestamp: new Date().toISOString()
      });
    }

    // Validate ObjectID format (MongoDB ObjectIDs are 24 characters of hex)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(clientId)) {
      logDebug('CLIENT ID INVALID FORMAT', { 
        clientId, 
        advisorId,
        length: clientId.length,
        matchesPattern: objectIdPattern.test(clientId)
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID format',
        error: 'Client ID must be a valid MongoDB ObjectID (24 hex characters)',
        clientId,
        timestamp: new Date().toISOString()
      });
    }

    logDebug('CLIENT ID VALIDATION PASSED', { clientId, advisorId });

    // Step 1: Verify client belongs to advisor and fetch COMPLETE client data
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      logDebug('CLIENT NOT FOUND OR UNAUTHORIZED', { clientId, advisorId });
      return res.status(404).json({
        success: false,
        message: 'Client not found or unauthorized access',
        clientId,
        advisorId,
        timestamp: new Date().toISOString()
      });
    }

    logDebug('CLIENT FOUND', { 
      clientName: `${client.firstName} ${client.lastName}`,
      clientFields: Object.keys(client.toObject()).length
    });

    // Step 2: Fetch all related data in parallel
    logDebug('FETCHING RELATED DATA', { clientId });

    const [
      vaultData,
      financialPlans,
      meetings,
      loeDocuments,
      loeAutomation,
      abTestSessions,
      chatHistory,
      mutualFundExitStrategies,
      clientInvitations
    ] = await Promise.all([
      Vault.findOne({ advisorId }),
      FinancialPlan.find({ clientId, advisorId }).sort({ createdAt: -1 }),
      Meeting.find({ clientId, advisorId }).sort({ createdAt: -1 }),
      LOE.find({ clientId, advisorId }).sort({ createdAt: -1 }),
      LOEAutomation.find({ clientId, advisorId }).sort({ createdAt: -1 }),
      ABTestSession.find({ clientId, advisorId }).sort({ createdAt: -1 }),
      ChatHistory.find({ client: clientId, advisor: advisorId }).sort({ updatedAt: -1 }),
      MutualFundExitStrategy.find({ clientId, advisorId }).sort({ createdAt: -1 }),
      ClientInvitation.find({ clientData: clientId, advisor: advisorId }).sort({ createdAt: -1 })
    ]);

    const duration = Date.now() - startTime;
    logDatabase.queryExecution('ClientReport', 'comprehensive', duration);

    logDebug('RELATED DATA FETCHED', {
      vault: !!vaultData,
      financialPlans: financialPlans.length,
      meetings: meetings.length,
      loeDocuments: loeDocuments.length,
      loeAutomation: loeAutomation.length,
      abTestSessions: abTestSessions.length,
      chatHistory: chatHistory.length,
      mutualFundExitStrategies: mutualFundExitStrategies.length,
      clientInvitations: clientInvitations.length,
      totalDuration: `${duration}ms`
    });

    // Step 3: Process client data with ALL fields
    const clientData = client.toObject();
    const processedClient = ensureFieldAvailability(clientData);

    logDebug('CLIENT DATA PROCESSING', {
      originalFields: Object.keys(clientData).length,
      processedFields: Object.keys(processedClient).length,
      hasPersonalInfo: !!processedClient.firstName,
      hasFinancialInfo: !!processedClient.totalMonthlyIncome,
      hasAssets: !!processedClient.assets,
      hasDebts: !!processedClient.debtsAndLiabilities,
      hasInsurance: !!processedClient.insuranceCoverage,
      hasCASData: !!processedClient.casData
    });

    // Step 4: Build comprehensive report with ALL data
    const comprehensiveReport = {
      // Advisor vault data
      advisor: vaultData ? ensureFieldAvailability(vaultData.toObject()) : {},

      // COMPLETE CLIENT DATA - ALL FIELDS
      client: {
        // Basic Information - ALL fields
        basicInfo: {
          firstName: processedClient.firstName,
          lastName: processedClient.lastName,
          email: processedClient.email,
          phoneNumber: processedClient.phoneNumber,
          status: processedClient.status,
          onboardingStep: processedClient.onboardingStep,
          lastActiveDate: processedClient.lastActiveDate,
          dateOfBirth: processedClient.dateOfBirth,
          panNumber: processedClient.panNumber,
          aadharNumber: processedClient.aadharNumber,
          maritalStatus: processedClient.maritalStatus,
          numberOfDependents: processedClient.numberOfDependents,
          gender: processedClient.gender,
          occupation: processedClient.occupation,
          employerBusinessName: processedClient.employerBusinessName
        },

        // Address Information - ALL fields
        address: processedClient.address ? ensureFieldAvailability(processedClient.address) : {},

        // Financial Information - ALL fields
        financialInfo: {
          // Income details
          totalMonthlyIncome: processedClient.totalMonthlyIncome,
          totalMonthlyExpenses: processedClient.totalMonthlyExpenses,
          incomeType: processedClient.incomeType,
          annualIncome: processedClient.annualIncome,
          additionalIncome: processedClient.additionalIncome,
          
          // Expense breakdown - COMPLETE
          monthlyExpenses: processedClient.monthlyExpenses ? 
            ensureFieldAvailability(processedClient.monthlyExpenses) : {},
          expenseBreakdown: processedClient.expenseBreakdown ? 
            ensureFieldAvailability(processedClient.expenseBreakdown) : {},
          expenseNotes: processedClient.expenseNotes,
          
          // Annual expenses
          annualTaxes: processedClient.annualTaxes,
          annualVacationExpenses: processedClient.annualVacationExpenses,
          
          // Net worth and calculations
          netWorth: processedClient.netWorth,
          monthlySavingsTarget: processedClient.monthlySavingsTarget,
          calculatedFinancials: processedClient.calculatedFinancials || {}
        },

        // Retirement Planning - ALL fields
        retirementPlanning: processedClient.retirementPlanning ? 
          ensureFieldAvailability(processedClient.retirementPlanning) : {},

        // Major Goals - COMPLETE array
        majorGoals: Array.isArray(processedClient.majorGoals) ? 
          processedClient.majorGoals.map(goal => ensureFieldAvailability(goal)) : [],

        // Assets & Investments - COMPLETE breakdown
        assets: processedClient.assets ? ensureFieldAvailability(processedClient.assets) : {},

        // Debts and Liabilities - ALL loan types
        debtsAndLiabilities: processedClient.debtsAndLiabilities ? 
          ensureFieldAvailability(processedClient.debtsAndLiabilities) : {},

        // Insurance Coverage - ALL types
        insuranceCoverage: processedClient.insuranceCoverage ? 
          ensureFieldAvailability(processedClient.insuranceCoverage) : {},

        // Enhanced Financial Goals - COMPLETE
        enhancedFinancialGoals: processedClient.enhancedFinancialGoals ? 
          ensureFieldAvailability(processedClient.enhancedFinancialGoals) : {},

        // Risk Profile
        riskProfile: {
          investmentExperience: processedClient.investmentExperience,
          riskTolerance: processedClient.riskTolerance,
          enhancedRiskProfile: processedClient.enhancedRiskProfile ? 
            ensureFieldAvailability(processedClient.enhancedRiskProfile) : {}
        },

        // Investment Goals and Horizon
        investmentGoals: processedClient.investmentGoals || [],
        investmentHorizon: processedClient.investmentHorizon,

        // KYC Information
        kycInfo: {
          kycStatus: processedClient.kycStatus,
          kycDocuments: processedClient.kycDocuments || [],
          fatcaStatus: processedClient.fatcaStatus,
          crsStatus: processedClient.crsStatus
        },

        // CAS Data - COMPLETE structure
        casData: processedClient.casData ? ensureFieldAvailability(processedClient.casData) : {},

        // Bank Details
        bankDetails: processedClient.bankDetails ? 
          ensureFieldAvailability(processedClient.bankDetails) : {},

        // Form Progress
        formProgress: processedClient.formProgress ? 
          ensureFieldAvailability(processedClient.formProgress) : {},

        // Communication Preferences
        communicationPreferences: processedClient.communicationPreferences ? 
          ensureFieldAvailability(processedClient.communicationPreferences) : {},

        // Additional fields
        notes: processedClient.notes,
        draftData: processedClient.draftData || {}
      },

      // COMPLETE related data with processing
      financialPlans: {
        count: financialPlans.length,
        plans: financialPlans.map(plan => ensureFieldAvailability(plan.toObject()))
      },

      meetings: {
        count: meetings.length,
        meetings: meetings.map(meeting => ensureFieldAvailability(meeting.toObject()))
      },

      legalDocuments: {
        loeCount: loeDocuments.length,
        loeAutomationCount: loeAutomation.length,
        loeDocuments: loeDocuments.map(loe => ensureFieldAvailability(loe.toObject())),
        loeAutomation: loeAutomation.map(loe => ensureFieldAvailability(loe.toObject()))
      },

      abTesting: {
        count: abTestSessions.length,
        sessions: abTestSessions.map(session => ensureFieldAvailability(session.toObject()))
      },

      chatHistory: {
        count: chatHistory.length,
        conversations: chatHistory.map(chat => ensureFieldAvailability(chat.toObject()))
      },

      mutualFundExitStrategies: {
        count: mutualFundExitStrategies.length,
        strategies: mutualFundExitStrategies.map(strategy => ensureFieldAvailability(strategy.toObject()))
      },

      invitations: {
        count: clientInvitations.length,
        invitations: clientInvitations.map(invitation => ensureFieldAvailability(invitation.toObject()))
      },

      // Enhanced summary with detailed metrics
      summary: {
        dataCompleteness: {
          hasBasicInfo: !!(processedClient.firstName && processedClient.lastName && processedClient.email),
          hasFinancialInfo: !!(processedClient.totalMonthlyIncome),
          hasAssets: !!(processedClient.assets && Object.keys(processedClient.assets).length > 0),
          hasDebts: !!(processedClient.debtsAndLiabilities && Object.keys(processedClient.debtsAndLiabilities).length > 0),
          hasInsurance: !!(processedClient.insuranceCoverage && Object.keys(processedClient.insuranceCoverage).length > 0),
          hasCASData: !!(processedClient.casData && processedClient.casData.casStatus !== 'not_uploaded'),
          hasGoals: !!(processedClient.majorGoals && processedClient.majorGoals.length > 0)
        },
        counts: {
          totalFinancialPlans: financialPlans.length,
          totalMeetings: meetings.length,
          totalLegalDocuments: loeDocuments.length + loeAutomation.length,
          totalABTestSessions: abTestSessions.length,
          totalChatConversations: chatHistory.length,
          totalExitStrategies: mutualFundExitStrategies.length,
          totalInvitations: clientInvitations.length
        },
        status: {
          onboardingComplete: processedClient.onboardingStep >= 7,
          kycComplete: processedClient.kycStatus === 'completed',
          hasCASData: processedClient.casData?.casStatus === 'parsed'
        }
      }
    };

    logDebug('COMPREHENSIVE REPORT COMPLETED', {
      reportSize: JSON.stringify(comprehensiveReport).length,
      clientFieldsIncluded: Object.keys(comprehensiveReport.client).length,
      relatedDataIncluded: Object.keys(comprehensiveReport).length - 2, // minus client and advisor
      totalProcessingTime: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      data: comprehensiveReport,
      generatedAt: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
      dataIntegrity: 'complete'
    });

  } catch (error) {
    // Enhanced error logging with client ID details
    logDebug('COMPREHENSIVE REPORT FAILED', { 
      clientId: req.params?.clientId, 
      advisorId: req.advisor?.id,
      error: error.message,
      stack: error.stack
    }, error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate comprehensive client report',
      error: error.message,
      clientId: req.params?.clientId,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getAdvisorVaultData,
  getClientList,
  getClientReport
};