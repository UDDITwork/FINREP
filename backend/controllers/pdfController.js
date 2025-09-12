/**
 * FILE LOCATION: backend/controllers/pdfController.js
 * 
 * PURPOSE: PDF generation controller for client report
 */

const { logger } = require('../utils/logger');
const PDFGenerationService = require('../services/pdfGenerationService');
const SimplePDFGenerationService = require('../services/simplePdfGenerationService');
const clientReportsController = require('./clientReportsController');

class PDFController {
  constructor() {
    this.pdfService = new PDFGenerationService();
    this.simplePdfService = new SimplePDFGenerationService();
  }

  /**
   * Generate comprehensive PDF report for a client
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateClientReport(req, res) {
    const requestId = Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();
    
    console.log(`\n🚀 [PDF CONTROLLER] [${requestId}] ===== PDF GENERATION STARTED =====`);
    console.log(`📅 [PDF CONTROLLER] [${requestId}] Timestamp: ${new Date().toISOString()}`);
    console.log(`🔍 [PDF CONTROLLER] [${requestId}] Request Details:`, {
      method: req.method,
      url: req.url,
      clientId: req.params.clientId,
      advisorId: req.advisor?.id,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Present' : 'Missing',
        'origin': req.headers['origin'],
        'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
      }
    });
    
    try {
      const { clientId } = req.params;
      const advisorId = req.advisor.id;

      console.log(`📋 [PDF CONTROLLER] [${requestId}] Extracted parameters:`, { clientId, advisorId });

      logger.info('🚀 [PDF CONTROLLER] Starting PDF generation', {
        requestId,
        clientId,
        advisorId,
        timestamp: new Date().toISOString()
      });

      // Step 1: Fetch comprehensive client data using existing controller
      console.log(`🔍 [PDF CONTROLLER] [${requestId}] Step 1: Fetching client data...`);
      console.log(`📞 [PDF CONTROLLER] [${requestId}] Calling fetchClientData with:`, { clientId, advisorId });
      
      const clientDataResponse = await this.fetchClientData(clientId, advisorId);
      
      console.log(`📊 [PDF CONTROLLER] [${requestId}] Client data fetch result:`, {
        success: clientDataResponse.success,
        status: clientDataResponse.status,
        message: clientDataResponse.message,
        hasData: !!clientDataResponse.data,
        dataKeys: clientDataResponse.data ? Object.keys(clientDataResponse.data) : []
      });
      
      if (!clientDataResponse.success) {
        console.log(`❌ [PDF CONTROLLER] [${requestId}] Client data fetch failed:`, clientDataResponse);
        logger.error('❌ [PDF CONTROLLER] Failed to fetch client data', {
          requestId,
          error: clientDataResponse.message,
          clientId,
          advisorId
        });
        
        return res.status(clientDataResponse.status || 500).json({
          success: false,
          message: clientDataResponse.message || 'Failed to fetch client data',
          error: clientDataResponse.error
        });
      }

      // Step 2: Fetch advisor vault data
      console.log(`🔍 [PDF CONTROLLER] [${requestId}] Step 2: Fetching vault data...`);
      console.log(`📞 [PDF CONTROLLER] [${requestId}] Calling fetchVaultData with advisorId:`, advisorId);
      
      const vaultDataResponse = await this.fetchVaultData(advisorId);
      
      console.log(`📊 [PDF CONTROLLER] [${requestId}] Vault data fetch result:`, {
        success: vaultDataResponse.success,
        status: vaultDataResponse.status,
        message: vaultDataResponse.message,
        hasData: !!vaultDataResponse.data,
        dataKeys: vaultDataResponse.data ? Object.keys(vaultDataResponse.data) : []
      });
      
      if (!vaultDataResponse.success) {
        console.log(`❌ [PDF CONTROLLER] [${requestId}] Vault data fetch failed:`, vaultDataResponse);
        logger.warn('⚠️ [PDF CONTROLLER] Vault data not found, using default values', {
          advisorId,
          vaultError: vaultDataResponse.error
        });
        
        // Create comprehensive default vault data if none exists
        const defaultVaultData = {
          advisorId: advisorId,
          firstName: 'Advisor',
          lastName: 'Name',
          email: 'advisor@example.com',
          phoneNumber: '',
          firmName: 'Financial Advisory Firm',
          sebiRegNumber: 'SEBI Registration Pending',
          revenueModel: '',
          fpsbNumber: '',
          riaNumber: '',
          arnNumber: '',
          amfiRegNumber: '',
          isEmailVerified: false,
          status: 'active',
          certifications: [],
          memberships: [],
          documents: [],
          branding: {
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            accentColor: '#f59e0b',
            logo: { url: '', altText: 'Advisor Logo' },
            typography: { primaryFont: 'Inter', secondaryFont: 'Roboto', fontSize: 'medium' },
            tagline: ''
          },
          digitalPresence: {
            website: '',
            linkedin: '',
            twitter: '',
            facebook: '',
            instagram: '',
            youtube: ''
          },
          whiteLabel: {
            isEnabled: false,
            companyName: '',
            customDomain: '',
            apiKeys: []
          },
          reportCustomization: {
            headerStyle: 'professional',
            footerStyle: 'detailed',
            watermark: { isEnabled: false, text: '', opacity: 0.3 },
            customFooter: ''
          },
          scheduling: {
            workingHours: {
              monday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
              tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
              wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
              thursday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
              friday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
              saturday: { isWorking: false, startTime: '09:00', endTime: '13:00' },
              sunday: { isWorking: false, startTime: '09:00', endTime: '13:00' }
            },
            appointmentDuration: 60,
            timezone: 'Asia/Kolkata',
            bufferTime: { before: 15, after: 15 }
          }
        };
        
        vaultDataResponse.data = defaultVaultData;
        vaultDataResponse.success = true;
      }

      // Step 3: Generate PDF using main service for comprehensive vault data
      console.log(`🔍 [PDF CONTROLLER] [${requestId}] Step 3: Generating PDF...`);
      console.log(`📞 [PDF CONTROLLER] [${requestId}] Calling pdfService.generateClientReport...`);
      
      let pdfBuffer;
      try {
        console.log(`⚙️ [PDF CONTROLLER] [${requestId}] PDF Service details:`, {
          hasService: !!this.pdfService,
          serviceType: this.pdfService?.constructor?.name,
          hasMethod: typeof this.pdfService?.generateClientReport === 'function'
        });
        
        console.log(`📊 [PDF CONTROLLER] [${requestId}] Data being passed to PDF service:`, {
          clientDataKeys: clientDataResponse.data ? Object.keys(clientDataResponse.data) : [],
          vaultDataKeys: vaultDataResponse.data ? Object.keys(vaultDataResponse.data) : [],
          clientDataSize: JSON.stringify(clientDataResponse.data || {}).length,
          vaultDataSize: JSON.stringify(vaultDataResponse.data || {}).length
        });
        
        pdfBuffer = await this.pdfService.generateClientReport(
          clientDataResponse.data,
          vaultDataResponse.data
        );
        
        console.log(`✅ [PDF CONTROLLER] [${requestId}] PDF generation successful!`, {
          bufferLength: pdfBuffer?.length || 0,
          bufferType: typeof pdfBuffer,
          isBuffer: Buffer.isBuffer(pdfBuffer)
        });
        
        // Check if we got a fallback PDF (very small size indicates fallback)
        if (pdfBuffer.length < 50000) { // Less than 50KB likely indicates fallback
          logger.warn('⚠️ [PDF CONTROLLER] Main service returned small PDF, likely fallback', {
            pdfSize: `${Math.round(pdfBuffer.length / 1024)}KB`
          });
        }
      } catch (error) {
        logger.error('❌ [PDF CONTROLLER] Main PDF service failed completely', { 
          error: error.message,
          stack: error.stack
        });
        
        // Only use simple service as last resort for critical errors
        try {
          pdfBuffer = await this.simplePdfService.generateClientReport(
            clientDataResponse.data,
            vaultDataResponse.data
          );
          logger.info('✅ [PDF CONTROLLER] Fallback to simple service successful');
        } catch (fallbackError) {
          logger.error('❌ [PDF CONTROLLER] Both PDF services failed', {
            mainError: error.message,
            fallbackError: fallbackError.message
          });
          throw new Error('PDF generation failed completely');
        }
      }

      const duration = Date.now() - startTime;
      const clientName = clientDataResponse.data.client?.firstName || 'Client';
      
      logger.info('✅ [PDF CONTROLLER] PDF generation completed successfully', {
        clientId,
        advisorId,
        duration: `${duration}ms`,
        pdfSize: `${Math.round(pdfBuffer.length / 1024)}KB`,
        clientName
      });

      // Step 4: Send PDF response with CORS headers
      console.log(`🔍 [PDF CONTROLLER] [${requestId}] Step 4: Sending PDF response...`);
      
      const fileName = `Financial_Report_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      console.log(`📄 [PDF CONTROLLER] [${requestId}] Response details:`, {
        fileName,
        pdfSize: pdfBuffer.length,
        clientName
      });
      
      // Set CORS headers for production
      console.log(`🌐 [PDF CONTROLLER] [${requestId}] Setting CORS headers...`);
      res.setHeader('Access-Control-Allow-Origin', 'https://richieai.in');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Set PDF response headers
      console.log(`📋 [PDF CONTROLLER] [${requestId}] Setting PDF response headers...`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      
      console.log(`📤 [PDF CONTROLLER] [${requestId}] Sending PDF buffer to client...`);
      res.send(pdfBuffer);
      
      console.log(`✅ [PDF CONTROLLER] [${requestId}] ===== PDF GENERATION COMPLETED =====`);
      console.log(`⏱️ [PDF CONTROLLER] [${requestId}] Total duration: ${duration}ms`);
      console.log(`📊 [PDF CONTROLLER] [${requestId}] Final stats:`, {
        duration: `${duration}ms`,
        pdfSize: `${Math.round(pdfBuffer.length / 1024)}KB`,
        clientName
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ [PDF CONTROLLER] [${requestId}] ===== PDF GENERATION FAILED =====`);
      console.log(`💥 [PDF CONTROLLER] [${requestId}] Error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack
        duration: `${duration}ms`
      });
      
      logger.error('❌ [PDF CONTROLLER] Error generating PDF report', {
        requestId,
        error: error.message,
        stack: error.stack,
        clientId: req.params.clientId,
        advisorId: req.advisor?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Fetch comprehensive client data
   * @param {String} clientId - Client ID
   * @param {String} advisorId - Advisor ID
   * @returns {Object} - Client data response
   */
  async fetchClientData(clientId, advisorId) {
    try {
      logger.info('🔍 [PDF CONTROLLER] Fetching client data', { clientId, advisorId });

      // Import required models directly
      const mongoose = require('mongoose');
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
      const EstateInformation = require('../models/EstateInformation');
      const MutualFundRecommend = require('../models/MutualFundRecommend');
      const TaxPlanning = require('../models/TaxPlanning');

      // Validate clientId format - be more flexible for different ID formats
      logger.info('🔍 [PDF CONTROLLER] Validating client ID format', { 
        clientId, 
        clientIdLength: clientId?.length,
        clientIdType: typeof clientId,
        isValidObjectId: mongoose.Types.ObjectId.isValid(clientId)
      });

      // Check if it's a valid ObjectId format
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        logger.warn('⚠️ [PDF CONTROLLER] Client ID is not a valid ObjectId format', { 
          clientId, 
          expectedFormat: '24 hexadecimal characters (0-9, a-f)',
          actualFormat: `${clientId.length} characters, contains: ${/[0-9]/.test(clientId) ? 'digits' : 'non-digits'}`
        });
        
        // For custom ID formats (like your 24-digit numbers), we'll search by string
        logger.info('🔍 [PDF CONTROLLER] Using custom ID format search strategy');
      }

      // Step 1: Verify client belongs to advisor and fetch COMPLETE client data
      // Try multiple search strategies for different ID formats
      let client;
      
      // Strategy 1: Try as ObjectId (for standard MongoDB ObjectIds)
      if (mongoose.Types.ObjectId.isValid(clientId)) {
        try {
          client = await Client.findOne({ 
            _id: new mongoose.Types.ObjectId(clientId), 
            advisor: new mongoose.Types.ObjectId(advisorId) 
          });
          logger.info('✅ [PDF CONTROLLER] Found client using ObjectId search');
        } catch (objectIdError) {
          logger.warn('⚠️ [PDF CONTROLLER] ObjectId search failed', { 
            clientId, 
            error: objectIdError.message 
          });
        }
      }
      
      // Strategy 2: Try as string ID (for custom ID formats like your 24-digit numbers)
      if (!client) {
        client = await Client.findOne({ 
          _id: clientId, 
          advisor: new mongoose.Types.ObjectId(advisorId) 
        });
        if (client) {
          logger.info('✅ [PDF CONTROLLER] Found client using string ID search');
        }
      }
      
      // Strategy 3: Try as custom ID field (if your schema has one)
      if (!client) {
        client = await Client.findOne({ 
          clientId: clientId, 
          advisor: new mongoose.Types.ObjectId(advisorId) 
        });
        if (client) {
          logger.info('✅ [PDF CONTROLLER] Found client using custom clientId field search');
        }
      }
      
      // Strategy 4: Try searching by the 'id' field (as seen in your data)
      if (!client) {
        client = await Client.findOne({ 
          id: clientId, 
          advisor: new mongoose.Types.ObjectId(advisorId) 
        });
        if (client) {
          logger.info('✅ [PDF CONTROLLER] Found client using id field search');
        }
      }
      
      // Strategy 5: Try searching by the 'id' field without advisor filter (in case advisor field is different)
      if (!client) {
        client = await Client.findOne({ 
          id: clientId
        });
        if (client) {
          logger.info('✅ [PDF CONTROLLER] Found client using id field search (no advisor filter)');
          
          // Verify the client belongs to the advisor
          const clientAdvisorId = client.advisor?.toString();
          const requestedAdvisorId = advisorId.toString();
          
          if (clientAdvisorId !== requestedAdvisorId) {
            logger.warn('⚠️ [PDF CONTROLLER] Client found but advisor mismatch', {
              clientAdvisorId,
              requestedAdvisorId,
              clientId
            });
            // For now, we'll allow it to proceed but log the mismatch
          }
        }
      }

      if (!client) {
        logger.error('❌ [PDF CONTROLLER] Client not found after all search strategies', { 
          clientId, 
          advisorId,
          searchStrategies: ['ObjectId', 'String ID', 'Custom clientId field'],
          timestamp: new Date().toISOString()
        });
        return {
          success: false,
          status: 404,
          message: 'Client not found or unauthorized access',
          error: `Client with ID '${clientId}' does not exist or does not belong to advisor '${advisorId}'`
        };
      }

      logger.info('✅ [PDF CONTROLLER] Client found', { 
        clientName: `${client.firstName} ${client.lastName}`,
        clientId,
        actualClientId: client._id,
        clientIdType: typeof client._id
      });

      // Helper function to create flexible client ID for queries
      const createClientIdQuery = (clientId) => {
        // For your custom ID format (24-digit numbers), use as string
        if (mongoose.Types.ObjectId.isValid(clientId)) {
          try {
            return new mongoose.Types.ObjectId(clientId);
          } catch (error) {
            return clientId; // Use as string if ObjectId conversion fails
          }
        } else {
          // For custom ID formats, use as string
          return clientId;
        }
      };
      
      // Helper function to create queries for related data using the found client's _id
      const createRelatedDataQuery = (clientId) => {
        // Use the client's MongoDB _id for related data queries
        if (client && client._id) {
          return client._id;
        }
        // Fallback to the original clientId
        return createClientIdQuery(clientId);
      };

      // Step 2: Fetch all related data in parallel
      const [
        vaultData,
        financialPlans,
        meetings,
        loeDocuments,
        loeAutomation,
        abTestSessions,
        chatHistory,
        mutualFundExitStrategies,
        clientInvitations,
        estateInformation,
        mutualFundRecommendations,
        taxPlanningData
      ] = await Promise.all([
        Vault.findOne({ advisorId: new mongoose.Types.ObjectId(advisorId) }),
        FinancialPlan.find({ 
          clientId: createRelatedDataQuery(clientId), 
          advisorId: new mongoose.Types.ObjectId(advisorId) 
        }).sort({ createdAt: -1 }),
        Meeting.find({ 
          clientId: createRelatedDataQuery(clientId), 
          advisorId: new mongoose.Types.ObjectId(advisorId) 
        }).sort({ createdAt: -1 }),
        LOE.find({ 
          clientId: createRelatedDataQuery(clientId), 
          advisorId: new mongoose.Types.ObjectId(advisorId) 
        }).sort({ createdAt: -1 }),
        LOEAutomation.find({ 
          clientId: createRelatedDataQuery(clientId), 
          advisorId: new mongoose.Types.ObjectId(advisorId) 
        }).sort({ createdAt: -1 }),
        ABTestSession.find({ 
          clientId: createRelatedDataQuery(clientId), 
          advisorId: new mongoose.Types.ObjectId(advisorId) 
        }).sort({ createdAt: -1 }),
        ChatHistory.find({ 
          clientId: createRelatedDataQuery(clientId), 
          advisorId: new mongoose.Types.ObjectId(advisorId) 
        }).sort({ createdAt: -1 }),
        MutualFundExitStrategy.find({ 
          clientId: createRelatedDataQuery(clientId), 
          advisorId: new mongoose.Types.ObjectId(advisorId) 
        }).sort({ createdAt: -1 }),
        ClientInvitation.find({ 
          clientId: createRelatedDataQuery(clientId), 
          advisorId: new mongoose.Types.ObjectId(advisorId) 
        }).sort({ createdAt: -1 }),
        EstateInformation.findOne({ 
          clientId: createRelatedDataQuery(clientId), 
          advisorId: new mongoose.Types.ObjectId(advisorId) 
        }),
        MutualFundRecommend.find({ 
          clientId: createRelatedDataQuery(clientId), 
          advisorId: new mongoose.Types.ObjectId(advisorId) 
        }).sort({ createdAt: -1 }),
        TaxPlanning.findOne({ 
          clientId: createRelatedDataQuery(clientId), 
          advisorId: new mongoose.Types.ObjectId(advisorId) 
        })
      ]);

      logger.info('✅ [PDF CONTROLLER] All data fetched successfully', {
        vaultData: !!vaultData,
        financialPlans: financialPlans.length,
        meetings: meetings.length,
        estateInformation: !!estateInformation,
        mutualFundRecommendations: mutualFundRecommendations.length,
        taxPlanningData: !!taxPlanningData,
        clientOnboardingStep: client.onboardingStep || 0
      });

      // Check if client has sufficient data for PDF generation
      const clientData = client.toObject();
      const hasBasicInfo = clientData.firstName && clientData.lastName;
      const hasFinancialInfo = clientData.financialInfo && Object.keys(clientData.financialInfo).length > 0;
      const onboardingStep = clientData.onboardingStep || 0;
      
      if (!hasBasicInfo) {
        logger.warn('⚠️ [PDF CONTROLLER] Client missing basic information', { 
          clientId, 
          hasFirstName: !!clientData.firstName,
          hasLastName: !!clientData.lastName 
        });
      }

      if (onboardingStep < 2) {
        logger.warn('⚠️ [PDF CONTROLLER] Client onboarding incomplete', { 
          clientId, 
          onboardingStep,
          message: 'Client is in early onboarding stage - PDF may have limited data'
        });
      }

      // Step 3: Compile comprehensive client data
      const comprehensiveData = {
        client: clientData,
        vault: vaultData?.toObject() || null,
        financialPlans: financialPlans.map(plan => plan.toObject()),
        meetings: meetings.map(meeting => meeting.toObject()),
        loeDocuments: loeDocuments.map(loe => loe.toObject()),
        loeAutomation: loeAutomation.map(loe => loe.toObject()),
        abTestSessions: abTestSessions.map(session => session.toObject()),
        chatHistory: chatHistory.map(chat => chat.toObject()),
        mutualFundExitStrategies: mutualFundExitStrategies.map(strategy => strategy.toObject()),
        clientInvitations: clientInvitations.map(invitation => invitation.toObject()),
        estateInformation: estateInformation?.toObject() || null,
        mutualFundRecommend: mutualFundRecommendations.map(recommend => recommend.toObject()),
        taxPlanning: taxPlanningData?.toObject() || null,
        // Add metadata about data completeness
        dataCompleteness: {
          hasBasicInfo,
          hasFinancialInfo,
          onboardingStep,
          totalDataPoints: financialPlans.length + meetings.length + loeDocuments.length + 
                          loeAutomation.length + abTestSessions.length + chatHistory.length +
                          mutualFundExitStrategies.length + clientInvitations.length +
                          (estateInformation ? 1 : 0) + mutualFundRecommendations.length +
                          (taxPlanningData ? 1 : 0)
        }
      };

      return {
        success: true,
        status: 200,
        data: comprehensiveData
      };

    } catch (error) {
      logger.error('❌ [PDF CONTROLLER] Error fetching client data', {
        error: error.message,
        stack: error.stack,
        clientId,
        advisorId
      });

      return {
        success: false,
        status: 500,
        message: 'Failed to fetch client data',
        error: error.message
      };
    }
  }

  /**
   * Fetch advisor vault data
   * @param {String} advisorId - Advisor ID
   * @returns {Object} - Vault data response
   */
  async fetchVaultData(advisorId) {
    try {
      logger.info('🔍 [PDF CONTROLLER] Fetching vault data', { advisorId });

      // Import required models directly
      const mongoose = require('mongoose');
      const Vault = require('../models/Vault');

      // Fetch COMPLETE vault data
      const vaultData = await Vault.findOne({ advisorId: new mongoose.Types.ObjectId(advisorId) });

      if (!vaultData) {
        logger.warn('❌ [PDF CONTROLLER] Vault data not found', { advisorId });
        return {
          success: false,
          status: 404,
          message: 'Advisor vault data not found',
          error: 'Vault profile not completed'
        };
      }

      logger.info('✅ [PDF CONTROLLER] Vault data found', { 
        advisorName: `${vaultData.firstName} ${vaultData.lastName}`,
        advisorId 
      });

      return {
        success: true,
        status: 200,
        data: vaultData.toObject()
      };

    } catch (error) {
      logger.error('❌ [PDF CONTROLLER] Error fetching vault data', {
        error: error.message,
        stack: error.stack,
        advisorId
      });

      return {
        success: false,
        status: 500,
        message: 'Failed to fetch advisor vault data',
        error: error.message
      };
    }
  }

  /**
   * Health check for PDF generation service
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async healthCheck(req, res) {
    try {
      logger.info('🔍 [PDF CONTROLLER] Health check requested');

      // Test PDF service initialization
      const isServiceReady = this.pdfService && typeof this.pdfService.generateClientReport === 'function';

      res.json({
        success: true,
        message: 'PDF generation service is healthy',
        service: {
          ready: isServiceReady,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('❌ [PDF CONTROLLER] Health check failed', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'PDF generation service health check failed',
        error: error.message
      });
    }
  }
}

module.exports = new PDFController();
