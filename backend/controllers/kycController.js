/**
 * FILE LOCATION: backend/controllers/kycController.js
 * 
 * PURPOSE: Production-level KYC verification controller
 * 
 * FUNCTIONALITY: Proper auth middleware integration and error handling
 */

const KYCVerification = require('../models/KYCVerification');
const Client = require('../models/Client');
const digioService = require('../services/digioService');
const {logger}= require('../utils/logger');

/**
 * Extract advisor ID from request object
 * Handles different auth middleware implementations and ObjectId formats
 */
const extractAdvisorId = (req) => {
  // DEBUG: Log the actual request object structure
  console.log('🔍 DEBUG Request Object:', {
    hasUser: !!req.user,
    hasAdvisor: !!req.advisor,
    userKeys: req.user ? Object.keys(req.user) : 'none',
    advisorKeys: req.advisor ? Object.keys(req.advisor) : 'none',
    
    // Check both id and _id formats
    advisor_id: req.advisor?.id,
    advisor_objectId: req.advisor?._id,
    user_id: req.user?.id,
    user_objectId: req.user?._id
  });

  // Try both _id and id formats (MongoDB vs JSON)
  const possiblePaths = [
    req.advisor?._id,     // MongoDB ObjectId format (most likely)
    req.advisor?.id,      // JSON converted format
    req.user?._id,        // User ObjectId format
    req.user?.id,         // User JSON format
    req.advisorId,        // Direct property
    req.userId            // Direct user property
  ];

  // Find the first valid ID and convert ObjectId to string if needed
  let foundAdvisorId = null;
  
  for (const id of possiblePaths) {
    if (!id) continue;
    
    // If it's a MongoDB ObjectId, convert to string
    if (id.toString && typeof id.toString === 'function') {
      foundAdvisorId = id.toString();
      break;
    }
    
    // If it's already a string and not empty
    if (typeof id === 'string' && id.length > 0) {
      foundAdvisorId = id;
      break;
    }
  }
  
  console.log('🔍 DEBUG Final Result:', {
    foundAdvisorId,
    pathResults: possiblePaths.map((path, index) => ({
      index,
      value: path,
      type: typeof path,
      isObjectId: path?.toString && typeof path.toString === 'function',
      stringValue: path?.toString ? path.toString() : path
    }))
  });

  if (!foundAdvisorId) {
    logger.error('Advisor ID extraction failed', {
      userKeys: req.user ? Object.keys(req.user) : 'undefined',
      advisorKeys: req.advisor ? Object.keys(req.advisor) : 'undefined',
      directProps: {
        userId: req.userId,
        advisorId: req.advisorId
      },
      requestPath: req.path,
      method: req.method
    });
  }

  return foundAdvisorId;
};

/**
 * Normalize client data fields
 * Handles different Client model structures
 */
const normalizeClientData = (client) => {
  const clientObj = client.toObject ? client.toObject() : client;
  
  return {
    _id: clientObj._id,
    firstName: clientObj.firstName || 
              clientObj.personalInfo?.firstName || 
              clientObj.name?.split(' ')[0] || 
              '',
    lastName: clientObj.lastName || 
             clientObj.personalInfo?.lastName || 
             clientObj.name?.split(' ').slice(1).join(' ') || 
             '',
    email: clientObj.email || 
           clientObj.personalInfo?.email || 
           clientObj.contactInfo?.email || 
           '',
    phoneNumber: clientObj.phoneNumber || 
                clientObj.personalInfo?.phoneNumber || 
                clientObj.contactInfo?.phoneNumber || 
                clientObj.phone || 
                ''
  };
};

// Get clients for KYC verification
const getClientsForKYC = async (req, res) => {
  try {
    const advisorId = extractAdvisorId(req);
    
    if (!advisorId) {
      logger.warn('KYC request without valid advisor ID', {
        path: req.path,
        method: req.method,
        headers: req.headers.authorization ? 'present' : 'missing'
      });
      
      return res.status(401).json({
        success: false,
        error: 'Authentication required: Advisor ID not found'
      });
    }

    logger.info('Fetching clients for KYC verification', { advisorId });

    // Query clients with proper error handling
    const clients = await Client.find({ advisor: advisorId }).lean();
    
    if (!clients || clients.length === 0) {
      logger.info('No clients found for advisor', { advisorId });
      return res.json({
        success: true,
        data: []
      });
    }

    logger.info('Clients found for KYC processing', { 
      advisorId, 
      clientCount: clients.length 
    });

    // Process clients with KYC status
    const clientsWithKYC = await Promise.all(
      clients.map(async (client) => {
        try {
          const kycStatus = await KYCVerification.findOne({ 
            clientId: client._id 
          }).lean();
          
          const normalizedClient = normalizeClientData(client);
          
          return {
            ...normalizedClient,
            kycStatus: kycStatus?.overallStatus || 'not_started',
            aadharStatus: kycStatus?.aadharStatus || 'not_started',
            panStatus: kycStatus?.panStatus || 'not_started',
            lastVerificationAttempt: kycStatus?.lastVerificationAttempt || null
          };
        } catch (clientError) {
          logger.error('Error processing individual client for KYC', {
            clientId: client._id,
            error: clientError.message
          });
          
          // Return client with default KYC status on error
          const normalizedClient = normalizeClientData(client);
          return {
            ...normalizedClient,
            kycStatus: 'not_started',
            aadharStatus: 'not_started',
            panStatus: 'not_started',
            lastVerificationAttempt: null
          };
        }
      })
    );

    logger.info('KYC client data processed successfully', {
      advisorId,
      totalClients: clientsWithKYC.length
    });

    res.json({
      success: true,
      data: clientsWithKYC
    });

  } catch (error) {
    logger.error('Failed to fetch clients for KYC', {
      error: error.message,
      stack: error.stack,
      path: req.path
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients for KYC verification',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
};

// Get KYC status for a specific client
const getKYCStatus = async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = extractAdvisorId(req);

    if (!advisorId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!clientId || !clientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client ID format'
      });
    }

    // Verify client belongs to advisor
    const client = await Client.findOne({ 
      _id: clientId, 
      advisor: advisorId 
    }).lean();
    
    if (!client) {
      logger.warn('Client not found or access denied', {
        clientId,
        advisorId
      });
      
      return res.status(404).json({
        success: false,
        error: 'Client not found or access denied'
      });
    }

    // Get or create KYC status
    let kycStatus = await KYCVerification.findOne({ clientId });
    
    if (!kycStatus) {
      kycStatus = new KYCVerification({
        clientId,
        advisorId,
        aadharStatus: 'not_started',
        panStatus: 'not_started',
        overallStatus: 'not_started'
      });
      await kycStatus.save();
      
      logger.info('Created new KYC record', { clientId, advisorId });
    }

    // Check for live status from Digio if verification is in progress
    if (kycStatus.aadharVerificationId || kycStatus.panVerificationId) {
      try {
        const digioRequestId = kycStatus.aadharVerificationId || kycStatus.panVerificationId;
        const digioStatus = await digioService.getVerificationStatus(digioRequestId);
        
        if (digioStatus.success) {
          // Update local status with Digio response
          const wasUpdated = (
            kycStatus.aadharStatus !== digioStatus.data.aadharStatus ||
            kycStatus.panStatus !== digioStatus.data.panStatus ||
            kycStatus.overallStatus !== digioStatus.data.overallStatus
          );

          if (wasUpdated) {
            kycStatus.aadharStatus = digioStatus.data.aadharStatus;
            kycStatus.panStatus = digioStatus.data.panStatus;
            kycStatus.overallStatus = digioStatus.data.overallStatus;
            await kycStatus.save();
            
            logger.info('Updated KYC status from Digio', {
              clientId,
              digioRequestId,
              newStatus: digioStatus.data.overallStatus
            });
          }
        }
      } catch (digioError) {
        logger.error('Error fetching status from Digio', {
          clientId,
          error: digioError.message
        });
        // Continue with local status if Digio fails
      }
    }

    const normalizedClient = normalizeClientData(client);

    res.json({
      success: true,
      data: {
        client: {
          ...normalizedClient,
          name: `${normalizedClient.firstName} ${normalizedClient.lastName}`.trim(),
          phone: normalizedClient.phoneNumber
        },
        kycStatus: {
          aadharStatus: kycStatus.aadharStatus,
          panStatus: kycStatus.panStatus,
          overallStatus: kycStatus.overallStatus,
          lastVerificationAttempt: kycStatus.lastVerificationAttempt,
          verificationAttempts: kycStatus.verificationAttempts?.aadhar || 0
        }
      }
    });

  } catch (error) {
    logger.error('Failed to fetch KYC status', {
      clientId: req.params.clientId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch KYC status',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
};

// Start KYC workflow for a client
const startKYCWorkflow = async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = extractAdvisorId(req);

    if (!advisorId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify client belongs to advisor
    const client = await Client.findOne({ 
      _id: clientId, 
      advisor: advisorId 
    }).lean();
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found or access denied'
      });
    }

    const normalizedClient = normalizeClientData(client);
    
    // Validate required client data
    const customerIdentifier = normalizedClient.phoneNumber || normalizedClient.email;
    if (!customerIdentifier) {
      return res.status(400).json({
        success: false,
        error: 'Client must have either phone number or email for KYC verification'
      });
    }

    const customerName = `${normalizedClient.firstName} ${normalizedClient.lastName}`.trim();
    if (!customerName) {
      return res.status(400).json({
        success: false,
        error: 'Client must have a name for KYC verification'
      });
    }

    // Get or create KYC status
    let kycStatus = await KYCVerification.findOne({ clientId });
    if (!kycStatus) {
      kycStatus = new KYCVerification({
        clientId,
        advisorId,
        aadharStatus: 'not_started',
        panStatus: 'not_started',
        overallStatus: 'not_started'
      });
    }

    // Create Digio workflow request
    const referenceId = `KYC_${clientId}_${Date.now()}`;
    const transactionId = `TXN_${clientId}_${Date.now()}`;
    
    logger.info('Starting KYC workflow with Digio', {
      clientId,
      advisorId,
      customerIdentifier,
      customerName,
      referenceId
    });

    const digioResponse = await digioService.createKYCWorkflowRequest(
      customerIdentifier,
      customerName,
      referenceId,
      transactionId,
      'SURENDRA', // template name
      true, // notify customer
      true  // generate access token
    );

    if (digioResponse.success) {
      // Update KYC status with Digio request ID
      kycStatus.aadharVerificationId = digioResponse.digioRequestId;
      kycStatus.panVerificationId = digioResponse.digioRequestId;
      kycStatus.aadharStatus = 'requested';
      kycStatus.panStatus = 'requested';
      kycStatus.overallStatus = 'in_progress';
      kycStatus.lastVerificationAttempt = new Date();
      
      if (!kycStatus.verificationAttempts) {
        kycStatus.verificationAttempts = { aadhar: 0, pan: 0 };
      }
      kycStatus.verificationAttempts.aadhar += 1;
      kycStatus.verificationAttempts.pan += 1;
      
      await kycStatus.save();

      logger.info('KYC workflow started successfully', {
        clientId,
        digioRequestId: digioResponse.digioRequestId,
        advisorId
      });

      res.json({
        success: true,
        data: {
          digioRequestId: digioResponse.digioRequestId,
          accessToken: digioResponse.accessToken,
          message: 'KYC workflow initiated successfully'
        }
      });
    } else {
      logger.error('Digio workflow creation failed', {
        clientId,
        advisorId,
        error: digioResponse.error
      });
      
      res.status(400).json({
        success: false,
        error: digioResponse.error || 'Failed to initiate KYC workflow with Digio'
      });
    }
  } catch (error) {
    logger.error('Failed to start KYC workflow', {
      clientId: req.params.clientId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to start KYC workflow',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
};

// Reset KYC verification for a client
const resetKYCVerification = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { documentType = 'both' } = req.body;
    const advisorId = extractAdvisorId(req);

    if (!advisorId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Validate document type
    const validDocumentTypes = ['aadhar', 'pan', 'both'];
    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document type. Must be: aadhar, pan, or both'
      });
    }

    // Verify client belongs to advisor
    const client = await Client.findOne({ 
      _id: clientId, 
      advisor: advisorId 
    }).lean();
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found or access denied'
      });
    }

    // Get KYC status
    const kycStatus = await KYCVerification.findOne({ clientId });
    if (!kycStatus) {
      return res.status(404).json({
        success: false,
        error: 'KYC verification record not found'
      });
    }

    // Reset based on document type
    if (documentType === 'aadhar' || documentType === 'both') {
      kycStatus.aadharStatus = 'not_started';
      kycStatus.aadharVerificationId = null;
    }
    
    if (documentType === 'pan' || documentType === 'both') {
      kycStatus.panStatus = 'not_started';
      kycStatus.panVerificationId = null;
    }

    // Update overall status
    if (kycStatus.aadharStatus === 'not_started' && kycStatus.panStatus === 'not_started') {
      kycStatus.overallStatus = 'not_started';
    } else if (kycStatus.aadharStatus === 'verified' && kycStatus.panStatus === 'verified') {
      kycStatus.overallStatus = 'verified';
    } else {
      kycStatus.overallStatus = 'in_progress';
    }

    await kycStatus.save();

    logger.info('KYC verification reset successfully', {
      clientId,
      advisorId,
      documentType,
      newStatus: {
        aadhar: kycStatus.aadharStatus,
        pan: kycStatus.panStatus,
        overall: kycStatus.overallStatus
      }
    });

    res.json({
      success: true,
      message: `KYC verification reset successfully for ${documentType}`,
      data: {
        aadharStatus: kycStatus.aadharStatus,
        panStatus: kycStatus.panStatus,
        overallStatus: kycStatus.overallStatus
      }
    });
  } catch (error) {
    logger.error('Failed to reset KYC verification', {
      clientId: req.params.clientId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to reset KYC verification',
      ...(process.env.NODE_ENV === 'development' && { 
        details: error.message 
      })
    });
  }
};

// Handle Digio webhook events
const handleWebhook = async (req, res) => {
  try {
    logger.info('Digio webhook received', {
      event: req.body.event,
      timestamp: new Date().toISOString()
    });
    
    const { event, entities, payload } = req.body;
    
    // Handle different webhook events
    switch (event) {
      case 'KYC_REQUEST_CREATED':
        logger.info('KYC Request Created', { requestId: payload.KYC_REQUEST?.id });
        break;
        
      case 'KYC_REQUEST_COMPLETED':
        logger.info('KYC Request Completed', { requestId: payload.KYC_REQUEST?.id });
        await updateKYCStatusFromWebhook(payload.KYC_REQUEST, 'completed');
        break;
        
      case 'KYC_REQUEST_APPROVED':
        logger.info('KYC Request Approved', { requestId: payload.KYC_REQUEST?.id });
        await updateKYCStatusFromWebhook(payload.KYC_REQUEST, 'approved');
        break;
        
      case 'KYC_REQUEST_REJECTED':
        logger.info('KYC Request Rejected', { requestId: payload.KYC_REQUEST?.id });
        await updateKYCStatusFromWebhook(payload.KYC_REQUEST, 'rejected');
        break;
        
      case 'KYC_ACTION_COMPLETED':
        logger.info('KYC Action Completed', { 
          requestId: payload.KYC_ACTION?.kyc_request_id,
          actionType: payload.KYC_ACTION?.type 
        });
        await updateKYCActionStatus(payload.KYC_ACTION);
        break;
        
      default:
        logger.warn('Unknown webhook event received', { event });
    }
    
    // Always return 200 to acknowledge receipt
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });
    
  } catch (error) {
    logger.error('Error processing Digio webhook', {
      error: error.message,
      event: req.body.event
    });
    
    // Still return 200 to prevent webhook failures
    res.status(200).json({ 
      success: false, 
      error: 'Error processing webhook' 
    });
  }
};

// Helper function to update KYC status from webhook
const updateKYCStatusFromWebhook = async (kycRequest, status) => {
  try {
    const kycRecord = await KYCVerification.findOne({
      aadharVerificationId: kycRequest.id
    });

    if (kycRecord) {
      if (status === 'completed') {
        kycRecord.overallStatus = 'in_progress';
      } else if (status === 'approved') {
        kycRecord.aadharStatus = 'verified';
        kycRecord.panStatus = 'verified';
        kycRecord.overallStatus = 'verified';
      } else if (status === 'rejected') {
        kycRecord.aadharStatus = 'failed';
        kycRecord.panStatus = 'failed';
        kycRecord.overallStatus = 'failed';
      }

      await kycRecord.save();
      
      logger.info('KYC status updated from webhook', {
        requestId: kycRequest.id,
        newStatus: status,
        clientId: kycRecord.clientId
      });
    } else {
      logger.warn('KYC record not found for webhook update', {
        digioRequestId: kycRequest.id
      });
    }
  } catch (error) {
    logger.error('Error updating KYC status from webhook', {
      requestId: kycRequest.id,
      error: error.message
    });
  }
};

// Helper function to update KYC action status
const updateKYCActionStatus = async (kycAction) => {
  try {
    const kycRecord = await KYCVerification.findOne({
      aadharVerificationId: kycAction.kyc_request_id
    });

    if (kycRecord) {
      if (kycAction.type === 'aadhaar_offline' || kycAction.type === 'aadhaar') {
        kycRecord.aadharStatus = kycAction.status;
      } else if (kycAction.type === 'digilocker' || kycAction.type === 'pan') {
        kycRecord.panStatus = kycAction.status;
      }

      await kycRecord.save();
      
      logger.info('KYC action status updated', {
        requestId: kycAction.kyc_request_id,
        actionType: kycAction.type,
        newStatus: kycAction.status
      });
    } else {
      logger.warn('KYC record not found for action update', {
        digioRequestId: kycAction.kyc_request_id
      });
    }
  } catch (error) {
    logger.error('Error updating KYC action status', {
      requestId: kycAction.kyc_request_id,
      error: error.message
    });
  }
};

module.exports = {
  getClientsForKYC,
  getKYCStatus,
  startKYCWorkflow,
  resetKYCVerification,
  handleWebhook
};