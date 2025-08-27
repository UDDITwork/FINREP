/**
 * FILE LOCATION: backend/controllers/finalReportController.js
 * 
 * PURPOSE: Comprehensive final report controller that fetches data from ALL models
 * 
 * FUNCTIONALITY: Fetch complete client data from:
 * - Vault (Advisor profile & branding)
 * - ClientInvitation (Onboarding data)
 * - LOE & LOEAutomation (Letters of engagement)
 * - FinancialPlan (All planning data)
 * - Meeting (Meeting history & transcripts)
 * - MutualFundExitStrategy (Investment strategies)
 * - Client (Basic client information)
 * - KYCVerification (KYC status)
 * - ChatHistory (AI chat interactions)
 * - Transcription (Meeting transcripts)
 * - ABTestComparison (A/B testing data)
 */

const finalReportService = require('../services/finalReportService');
const { logger } = require('../utils/logger');

/**
 * Get all clients for an advisor (for client selection)
 * GET /api/final-report/clients
 */
const getAdvisorClients = async (req, res) => {
  const correlationId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const advisorId = req.advisor.id;
  
  try {
    if (!advisorId) {
      logger.warn(`[${correlationId}] [FINAL_REPORT] Missing advisor ID in request`);
      return res.status(400).json({
        success: false,
        message: 'Advisor ID is required',
        correlationId
      });
    }

    logger.info(`[${correlationId}] [FINAL_REPORT] Fetching clients for advisor: ${advisorId}`);

    // Use the service layer for data fetching
    const result = await finalReportService.getClientsForReport(advisorId, correlationId);
    
    logger.info(`[${correlationId}] [FINAL_REPORT] Successfully retrieved ${result.clients.length} clients for advisor: ${advisorId}`);

    res.json({
      success: true,
      data: result,
      correlationId,
      message: 'Clients retrieved successfully'
    });

  } catch (error) {
    logger.error(`[${correlationId}] [FINAL_REPORT] Error fetching advisor clients:`, error);
    
    // Enhanced error handling
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid advisor ID format',
        correlationId
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve clients',
      correlationId,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get comprehensive data for final report generation
 * GET /api/final-report/data/:clientId
 */
const getComprehensiveData = async (req, res) => {
  const correlationId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { clientId } = req.params;
  const advisorId = req.advisor.id;
  
  try {
    if (!clientId) {
      logger.warn(`[${correlationId}] [FINAL_REPORT] Missing client ID in request`);
      return res.status(400).json({
        success: false,
        message: 'Client ID is required',
        correlationId
      });
    }

    if (!advisorId) {
      logger.warn(`[${correlationId}] [FINAL_REPORT] Missing advisor ID in request`);
      return res.status(400).json({
        success: false,
        message: 'Advisor ID is required',
        correlationId
      });
    }

    logger.info(`[${correlationId}] [FINAL_REPORT] Fetching comprehensive data for advisor: ${advisorId}, client: ${clientId}`);

    // Validate client access first
    const hasAccess = await finalReportService.validateClientAccess(clientId, advisorId, correlationId);
    if (!hasAccess) {
      logger.warn(`[${correlationId}] [FINAL_REPORT] Unauthorized access attempt - Client: ${clientId}, Advisor: ${advisorId}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to client data',
        correlationId
      });
    }

    // Get comprehensive data using the service layer
    const comprehensiveData = await finalReportService.aggregateClientData(clientId, advisorId, correlationId);
    
    logger.info(`[${correlationId}] [FINAL_REPORT] Successfully retrieved comprehensive data for client: ${clientId}`);

    res.json({
      success: true,
      data: comprehensiveData,
      correlationId,
      message: 'Comprehensive data retrieved successfully'
    });

  } catch (error) {
    logger.error(`[${correlationId}] [FINAL_REPORT] Error fetching comprehensive data:`, error);
    
    // Enhanced error handling with specific error types
    if (error.name === 'CastError' || error.message.includes('Invalid client ID')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID provided',
        correlationId
      });
    }
    
    if (error.message.includes('Client not found')) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
        correlationId
      });
    }
    
    if (error.message.includes('Advisor not found')) {
      return res.status(404).json({
        success: false,
        message: 'Advisor not found',
        correlationId
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comprehensive client data',
      correlationId,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get comprehensive data summary (lightweight version)
 * GET /api/final-report/summary/:clientId
 */
const getComprehensiveSummary = async (req, res) => {
  const correlationId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { clientId } = req.params;
  const advisorId = req.advisor.id;
  
  try {
    if (!clientId) {
      logger.warn(`[${correlationId}] [FINAL_REPORT] Missing client ID in request`);
      return res.status(400).json({
        success: false,
        message: 'Client ID is required',
        correlationId
      });
    }

    if (!advisorId) {
      logger.warn(`[${correlationId}] [FINAL_REPORT] Missing advisor ID in request`);
      return res.status(400).json({
        success: false,
        message: 'Advisor ID is required',
        correlationId
      });
    }

    logger.info(`[${correlationId}] [FINAL_REPORT] Fetching summary for advisor: ${advisorId}, client: ${clientId}`);

    // Validate client access first
    const hasAccess = await finalReportService.validateClientAccess(clientId, advisorId, correlationId);
    if (!hasAccess) {
      logger.warn(`[${correlationId}] [FINAL_REPORT] Unauthorized access attempt - Client: ${clientId}, Advisor: ${advisorId}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to client data',
        correlationId
      });
    }

    // Get comprehensive data and extract summary
    const comprehensiveData = await finalReportService.aggregateClientData(clientId, advisorId, correlationId);
    
    const summary = {
      totalServices: comprehensiveData.summary.totalServices,
      activeServices: comprehensiveData.summary.activeServices,
      portfolioValue: comprehensiveData.summary.portfolioValue,
      onboardingProgress: comprehensiveData.summary.onboardingProgress,
      breakdown: {
        financialPlans: comprehensiveData.services.financialPlans.count,
        kyc: comprehensiveData.services.kyc.count,
        meetings: comprehensiveData.services.meetings.count,
        loeDocuments: comprehensiveData.services.loeDocuments.count,
        loeAutomation: comprehensiveData.services.loeAutomation.count,
        clientInvitations: comprehensiveData.services.clientInvitations.count,
        mutualFundStrategies: comprehensiveData.services.mutualFundStrategies.count,
        chatHistory: comprehensiveData.services.chatHistory.count,
        transcriptions: comprehensiveData.services.transcriptions.count,
        abTestComparisons: comprehensiveData.services.abTestComparisons.count,
        vaultData: comprehensiveData.services.vaultData.count
      }
    };

    logger.info(`[${correlationId}] [FINAL_REPORT] Successfully retrieved summary for client: ${clientId}`);

    res.json({
      success: true,
      data: summary,
      correlationId,
      message: 'Summary retrieved successfully'
    });

  } catch (error) {
    logger.error(`[${correlationId}] [FINAL_REPORT] Error fetching summary:`, error);
    
    // Enhanced error handling
    if (error.name === 'CastError' || error.message.includes('Invalid client ID')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID provided',
        correlationId
      });
    }
    
    if (error.message.includes('Client not found')) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
        correlationId
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve summary',
      correlationId,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAdvisorClients,
  getComprehensiveData,
  getComprehensiveSummary
};
