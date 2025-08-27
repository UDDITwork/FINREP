/**
 * FILE LOCATION: backend/services/finalReportService.js
 * 
 * PURPOSE: Comprehensive service layer for final report data aggregation
 * 
 * FUNCTIONALITY: Fetches complete client data from ALL models:
 * - Client (personal & financial data)
 * - Advisor (firm information)
 * - FinancialPlan (planning data)
 * - KYCVerification (verification status)
 * - Meeting (consultation history)
 * - LOE (letters of engagement)
 * - LOEAutomation (automated LOE)
 * - ClientInvitation (onboarding data)
 * - MutualFundExitStrategy (investment strategies)
 * - ChatHistory (AI chat interactions)
 * - Transcription (meeting transcripts)
 * - ABTestComparison (A/B testing data)
 * - Vault (secure document storage)
 * 
 * FEATURES:
 * - Parallel data fetching for performance
 * - Comprehensive error handling
 * - Detailed logging with correlation IDs
 * - Data validation and sanitization
 * - Performance monitoring
 * - Security compliance
 */

const mongoose = require('mongoose');
const Client = require('../models/Client');
const Advisor = require('../models/Advisor');
const FinancialPlan = require('../models/FinancialPlan');
const KYCVerification = require('../models/KYCVerification');
const Meeting = require('../models/Meeting');
const LOE = require('../models/LOE');
const LOEAutomation = require('../models/LOEAutomation');
const ClientInvitation = require('../models/ClientInvitation');
const MutualFundExitStrategy = require('../models/MutualFundExitStrategy');
const ChatHistory = require('../models/ChatHistory');
const Transcription = require('../models/Transcription');
const ABTestComparison = require('../models/ABTestComparison');
const Vault = require('../models/Vault');
const { logger } = require('../utils/logger');

class FinalReportService {
  /**
   * Get all clients for an advisor with basic information
   */
  async getClientsForReport(advisorId, correlationId) {
    const startTime = Date.now();
    
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching clients for advisor: ${advisorId}`);
      
      const clients = await Client.find({ advisor: advisorId })
        .select('firstName lastName email phoneNumber status netWorth onboardingStep casData casStatus')
        .lean();
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Retrieved ${clients.length} clients in ${duration}ms`);
      
      return {
        clients: clients.map(client => ({
          _id: client._id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phoneNumber: client.phoneNumber,
          status: client.status,
          netWorth: client.netWorth || 0,
          onboardingProgress: this.getOnboardingProgress(client.onboardingStep),
          hasCASData: client.casData && client.casStatus !== 'not_uploaded',
          portfolioValue: this.getPortfolioValue(client)
        })),
        totalClients: clients.length
      };
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching clients: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate that an advisor has access to a specific client
   */
  async validateClientAccess(clientId, advisorId, correlationId) {
    try {
      logger.debug(`[${correlationId}] [SERVICE] Validating client access - Client: ${clientId}, Advisor: ${advisorId}`);
      
      const client = await Client.findOne({ _id: clientId, advisor: advisorId }).lean();
      return !!client;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error validating client access: ${error.message}`);
      throw error;
    }
  }

  /**
   * Main function to aggregate comprehensive client data from all models
   */
  async aggregateClientData(clientId, advisorId, correlationId) {
    const startTime = Date.now();
    const reportId = `REP_${Date.now()}_${clientId.toString().substring(0, 8)}`;
    
    try {
      logger.info(`[${correlationId}] [SERVICE] Starting comprehensive data aggregation for client: ${clientId}`);
      
      // Parallel data fetching for optimal performance
      const [
        clientData,
        advisorData,
        financialPlans,
        kycData,
        meetings,
        loeDocuments,
        loeAutomation,
        clientInvitations,
        mutualFundStrategies,
        chatHistory,
        transcriptions,
        abTestComparisons,
        vaultData
      ] = await Promise.all([
        this.fetchClientPersonalData(clientId, correlationId),
        this.fetchAdvisorData(advisorId, correlationId),
        this.fetchFinancialPlans(clientId, correlationId),
        this.fetchKYCVerification(clientId, correlationId),
        this.fetchMeetings(clientId, correlationId),
        this.fetchLOEDocuments(clientId, correlationId),
        this.fetchLOEAutomation(clientId, correlationId),
        this.fetchClientInvitations(clientId, correlationId),
        this.fetchMutualFundStrategies(clientId, correlationId),
        this.fetchChatHistory(clientId, correlationId),
        this.fetchTranscriptions(clientId, correlationId),
        this.fetchABTestComparisons(clientId, correlationId),
        this.fetchVaultData(clientId, correlationId)
      ]);

      // Calculate summary metrics
      const summary = this.calculateSummaryMetrics({
        financialPlans,
        kycData,
        meetings,
        loeDocuments,
        loeAutomation,
        clientInvitations,
        mutualFundStrategies,
        chatHistory,
        transcriptions,
        abTestComparisons,
        vaultData,
        clientData
      });

      const comprehensiveData = {
        header: {
          reportId,
          generatedAt: new Date().toISOString(),
          clientName: `${clientData.firstName} ${clientData.lastName}`,
          advisor: {
            firstName: advisorData.firstName,
            lastName: advisorData.lastName,
            email: advisorData.email,
            phoneNumber: advisorData.phoneNumber,
            sebiRegNumber: advisorData.sebiRegNumber,
            arnNumber: advisorData.arnNumber
          },
          firm: {
            firmName: advisorData.firmName,
            address: this.formatAdvisorAddress(advisorData),
            phone: advisorData.phoneNumber
          }
        },
        client: {
          personal: {
            firstName: clientData.firstName,
            lastName: clientData.lastName,
            email: clientData.email,
            phoneNumber: clientData.phoneNumber,
            panNumber: clientData.panNumber,
            dateOfBirth: clientData.dateOfBirth,
            maritalStatus: clientData.maritalStatus,
            numberOfDependents: clientData.numberOfDependents,
            gender: clientData.gender,
            occupation: clientData.occupation,
            employerBusinessName: clientData.employerBusinessName
          },
          financial: {
            totalMonthlyIncome: clientData.totalMonthlyIncome || 0,
            totalMonthlyExpenses: clientData.totalMonthlyExpenses || 0,
            netWorth: clientData.netWorth || 0,
            totalAssets: this.calculateTotalAssets(clientData.assets),
            totalLiabilities: this.calculateTotalLiabilities(clientData.debtsAndLiabilities),
            monthlySavings: (clientData.totalMonthlyIncome || 0) - (clientData.totalMonthlyExpenses || 0)
          },
          address: clientData.address,
          casData: this.sanitizeCASData(clientData.casData),
          retirementPlanning: clientData.retirementPlanning,
          majorGoals: clientData.majorGoals,
          enhancedFinancialGoals: clientData.enhancedFinancialGoals,
          enhancedRiskProfile: clientData.enhancedRiskProfile,
          insuranceCoverage: clientData.insuranceCoverage
        },
        services: {
          financialPlans: {
            count: financialPlans.length,
            plans: financialPlans
          },
          kyc: {
            count: kycData.length,
            verifications: kycData
          },
          meetings: {
            count: meetings.length,
            meetings: meetings
          },
          loeDocuments: {
            count: loeDocuments.length,
            documents: loeDocuments
          },
          loeAutomation: {
            count: loeAutomation.length,
            documents: loeAutomation
          },
          clientInvitations: {
            count: clientInvitations.length,
            invitations: clientInvitations
          },
          mutualFundStrategies: {
            count: mutualFundStrategies.length,
            strategies: mutualFundStrategies
          },
          chatHistory: {
            count: chatHistory.length,
            sessions: chatHistory
          },
          transcriptions: {
            count: transcriptions.length,
            transcripts: transcriptions
          },
          abTestComparisons: {
            count: abTestComparisons.length,
            comparisons: abTestComparisons
          },
          vaultData: {
            count: vaultData.length,
            items: vaultData
          }
        },
        summary
      };

      const totalDuration = Date.now() - startTime;
      logger.info(`[${correlationId}] [SERVICE] Comprehensive data aggregation completed in ${totalDuration}ms`);
      logger.info(`[${correlationId}] [SERVICE] Data summary - Total Services: ${summary.totalServices}, Portfolio Value: ${summary.portfolioValue}`);

      return comprehensiveData;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      logger.error(`[${correlationId}] [SERVICE] Error in comprehensive data aggregation after ${totalDuration}ms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch client personal and financial data
   */
  async fetchClientPersonalData(clientId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching client personal data`);
      
      const client = await Client.findById(clientId).lean();
      if (!client) {
        throw new Error('Client not found');
      }
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Client personal data retrieved in ${duration}ms`);
      
      return client;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching client personal data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch advisor data
   */
  async fetchAdvisorData(advisorId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching advisor data`);
      
      const advisor = await Advisor.findById(advisorId).lean();
      if (!advisor) {
        throw new Error('Advisor not found');
      }
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Advisor data retrieved in ${duration}ms`);
      
      return advisor;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching advisor data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch financial plans for a client
   */
  async fetchFinancialPlans(clientId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching financial plans`);
      
      const plans = await FinancialPlan.find({ clientId })
        .select('-__v')
        .sort({ createdAt: -1 })
        .lean();
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Retrieved ${plans.length} financial plans in ${duration}ms`);
      
      return plans;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching financial plans: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch KYC verification data
   */
  async fetchKYCVerification(clientId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching KYC verification`);
      
      const kyc = await KYCVerification.find({ clientId })
        .select('-__v')
        .sort({ createdAt: -1 })
        .lean();
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Retrieved ${kyc.length} KYC records in ${duration}ms`);
      
      return kyc;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching KYC verification: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch meetings for a client
   */
  async fetchMeetings(clientId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching meetings`);
      
      const meetings = await Meeting.find({ clientId })
        .select('-__v')
        .sort({ scheduledAt: -1 })
        .lean();
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Retrieved ${meetings.length} meetings in ${duration}ms`);
      
      return meetings;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching meetings: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch LOE documents
   */
  async fetchLOEDocuments(clientId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching LOE documents`);
      
      const loe = await LOE.find({ clientId })
        .select('-__v')
        .sort({ createdAt: -1 })
        .lean();
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Retrieved ${loe.length} LOE documents in ${duration}ms`);
      
      return loe;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching LOE documents: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch LOE automation data
   */
  async fetchLOEAutomation(clientId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching LOE automation`);
      
      const loeAuto = await LOEAutomation.find({ clientId })
        .select('-__v')
        .sort({ createdAt: -1 })
        .lean();
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Retrieved ${loeAuto.length} LOE automation records in ${duration}ms`);
      
      return loeAuto;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching LOE automation: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch client invitations
   */
  async fetchClientInvitations(clientId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching client invitations`);
      
      const invitations = await ClientInvitation.find({ clientId })
        .select('-__v')
        .sort({ createdAt: -1 })
        .lean();
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Retrieved ${invitations.length} client invitations in ${duration}ms`);
      
      return invitations;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching client invitations: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch mutual fund exit strategies
   */
  async fetchMutualFundStrategies(clientId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching mutual fund strategies`);
      
      const strategies = await MutualFundExitStrategy.find({ clientId })
        .select('-__v')
        .sort({ createdAt: -1 })
        .lean();
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Retrieved ${strategies.length} mutual fund strategies in ${duration}ms`);
      
      return strategies;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching mutual fund strategies: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch chat history
   */
  async fetchChatHistory(clientId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching chat history`);
      
      const chatSessions = await ChatHistory.find({ clientId })
        .select('-__v')
        .sort({ createdAt: -1 })
        .limit(50) // Limit to prevent huge responses
        .lean();
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Retrieved ${chatSessions.length} chat sessions in ${duration}ms`);
      
      return chatSessions;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching chat history: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch transcriptions
   */
  async fetchTranscriptions(clientId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching transcriptions`);
      
      const transcriptions = await Transcription.find({ clientId })
        .select('-__v')
        .sort({ createdAt: -1 })
        .limit(20) // Limit to prevent huge responses
        .lean();
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Retrieved ${transcriptions.length} transcriptions in ${duration}ms`);
      
      return transcriptions;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching transcriptions: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch AB test comparisons
   */
  async fetchABTestComparisons(clientId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching AB test comparisons`);
      
      const comparisons = await ABTestComparison.find({ clientId })
        .select('-__v')
        .sort({ createdAt: -1 })
        .lean();
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Retrieved ${comparisons.length} AB test comparisons in ${duration}ms`);
      
      return comparisons;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching AB test comparisons: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch vault data
   */
  async fetchVaultData(clientId, correlationId) {
    const startTime = Date.now();
    try {
      logger.debug(`[${correlationId}] [SERVICE] Fetching vault data`);
      
      const vaultItems = await Vault.find({ clientId })
        .select('-__v')
        .sort({ createdAt: -1 })
        .lean();
      
      const duration = Date.now() - startTime;
      logger.debug(`[${correlationId}] [SERVICE] Retrieved ${vaultItems.length} vault items in ${duration}ms`);
      
      return vaultItems;
    } catch (error) {
      logger.error(`[${correlationId}] [SERVICE] Error fetching vault data: ${error.message}`);
      return [];
    }
  }

  /**
   * Calculate summary metrics from all services
   */
  calculateSummaryMetrics(data) {
    const totalServices = 
      data.financialPlans.length +
      data.kycData.length +
      data.meetings.length +
      data.loeDocuments.length +
      data.loeAutomation.length +
      data.clientInvitations.length +
      data.mutualFundStrategies.length +
      data.chatHistory.length +
      data.transcriptions.length +
      data.abTestComparisons.length +
      data.vaultData.length;

    const activeServices = this.countActiveServices(data);
    const portfolioValue = this.calculatePortfolioValue(data.clientData);
    const onboardingProgress = this.getOnboardingProgress(data.clientData.onboardingStep);

    return {
      totalServices,
      activeServices,
      portfolioValue,
      onboardingProgress
    };
  }

  /**
   * Count active services across all models
   */
  countActiveServices(data) {
    let activeCount = 0;
    
    // Count active financial plans
    activeCount += data.financialPlans.filter(plan => plan.status === 'active').length;
    
    // Count completed KYC
    activeCount += data.kycData.filter(kyc => kyc.overallStatus === 'verified').length;
    
    // Count upcoming/completed meetings
    activeCount += data.meetings.filter(meeting => 
      meeting.status === 'scheduled' || meeting.status === 'completed'
    ).length;
    
    // Count active LOE documents
    activeCount += data.loeDocuments.filter(loe => loe.status === 'signed').length;
    
    // Count active mutual fund strategies
    activeCount += data.mutualFundStrategies.filter(strategy => 
      strategy.status === 'active' || strategy.status === 'pending'
    ).length;
    
    return activeCount;
  }

  /**
   * Calculate portfolio value from CAS data or client assets
   */
  calculatePortfolioValue(clientData) {
    // First try to get from CAS data
    if (clientData.casData?.parsedData?.summary?.total_value) {
      return clientData.casData.parsedData.summary.total_value;
    }
    
    // Fallback to calculated assets
    const totalAssets = this.calculateTotalAssets(clientData.assets);
    return totalAssets || clientData.netWorth || 0;
  }

  /**
   * Calculate total assets from client asset structure
   */
  calculateTotalAssets(assets) {
    if (!assets) return 0;
    
    let total = 0;
    total += assets.cashBankSavings || 0;
    total += assets.realEstate || 0;
    
    if (assets.investments) {
      // Equity investments
      if (assets.investments.equity) {
        total += assets.investments.equity.mutualFunds || 0;
        total += assets.investments.equity.directStocks || 0;
      }
      
      // Fixed income investments
      if (assets.investments.fixedIncome) {
        total += assets.investments.fixedIncome.ppf || 0;
        total += assets.investments.fixedIncome.epf || 0;
        total += assets.investments.fixedIncome.nps || 0;
        total += assets.investments.fixedIncome.fixedDeposits || 0;
        total += assets.investments.fixedIncome.bondsDebentures || 0;
        total += assets.investments.fixedIncome.nsc || 0;
      }
      
      // Other investments
      if (assets.investments.other) {
        total += assets.investments.other.ulip || 0;
        total += assets.investments.other.otherInvestments || 0;
      }
    }
    
    return total;
  }

  /**
   * Calculate total liabilities from client debt structure
   */
  calculateTotalLiabilities(debtsAndLiabilities) {
    if (!debtsAndLiabilities) return 0;
    
    let total = 0;
    
    // Sum all loan outstanding amounts
    const loanTypes = ['homeLoan', 'personalLoan', 'carLoan', 'educationLoan', 'goldLoan', 'businessLoan', 'otherLoans'];
    loanTypes.forEach(loanType => {
      if (debtsAndLiabilities[loanType]?.hasLoan) {
        total += debtsAndLiabilities[loanType].outstandingAmount || 0;
      }
    });
    
    // Add credit card debt
    if (debtsAndLiabilities.creditCards?.hasDebt) {
      total += debtsAndLiabilities.creditCards.totalOutstanding || 0;
    }
    
    return total;
  }

  /**
   * Get onboarding progress description
   */
  getOnboardingProgress(onboardingStep) {
    const steps = {
      0: 'Not Started',
      1: 'Personal Information',
      2: 'Financial Details',
      3: 'Goals Setting',
      4: 'Risk Assessment',
      5: 'Document Upload',
      6: 'Verification',
      7: 'Completed'
    };
    
    return steps[onboardingStep] || 'Unknown';
  }

  /**
   * Format advisor address for display
   */
  formatAdvisorAddress(advisor) {
    // This would need to be implemented based on your address structure
    return 'Address information not available';
  }

  /**
   * Sanitize CAS data for security
   */
  sanitizeCASData(casData) {
    if (!casData) return null;
    
    // Create a sanitized copy
    const sanitized = { ...casData };
    
    // Remove sensitive file information
    if (sanitized.casFile) {
      delete sanitized.casFile.password;
      delete sanitized.casFile.iv;
    }
    
    // Mask sensitive investor data
    if (sanitized.parsedData?.investor) {
      if (sanitized.parsedData.investor.pan) {
        sanitized.parsedData.investor.pan = sanitized.parsedData.investor.pan.replace(/\w(?=\w{4})/g, '*');
      }
      if (sanitized.parsedData.investor.aadharNumber) {
        sanitized.parsedData.investor.aadharNumber = sanitized.parsedData.investor.aadharNumber.replace(/\d(?=\d{4})/g, '*');
      }
    }
    
    return sanitized;
  }

  /**
   * Get portfolio value for client list display
   */
  getPortfolioValue(client) {
    if (client.casData?.parsedData?.summary?.total_value) {
      return client.casData.parsedData.summary.total_value;
    }
    return client.netWorth || 0;
  }
}

module.exports = new FinalReportService();
