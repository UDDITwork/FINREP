/**
 * FILE LOCATION: backend/routes/loeAutomation.js
 * 
 * PURPOSE: LOE Automation routes for managing client LOE status
 * 
 * FUNCTIONALITY: API endpoints for LOE automation system
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loeAutomationController = require('../controllers/loeAutomationController');
const { logger } = require('../utils/logger');

// Middleware to log LOE Automation requests
const logLOEAutomationRequest = (action) => (req, res, next) => {
  logger.info(`🤖 [LOE Automation] ${action} request`, {
    advisorId: req.advisor?.id || req.advisor?._id,
    clientId: req.params?.clientId || req.body?.clientId,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
};

// Protected routes (require advisor authentication)

// Get all clients with LOE status for the logged-in advisor
router.get('/clients', 
  auth, 
  logLOEAutomationRequest('Get clients with LOE status'), 
  loeAutomationController.getClientsWithLOEStatus
);

// Get detailed LOE information for a specific client
router.get('/clients/:clientId/loe-details', 
  auth, 
  logLOEAutomationRequest('Get client LOE details'), 
  loeAutomationController.getClientLOEDetails
);

// Create a new LOE for a client
router.post('/clients/:clientId/create-loe', 
  auth, 
  logLOEAutomationRequest('Create LOE for client'), 
  loeAutomationController.createLOEForClient
);

// Client-facing routes (no authentication required)
// Get LOE data for client signing page
router.get('/client/:accessToken', 
  logLOEAutomationRequest('Get client LOE data'), 
  loeAutomationController.getClientLOEData
);

// Submit client signature
router.post('/client/:accessToken/sign', 
  logLOEAutomationRequest('Submit client signature'), 
  loeAutomationController.submitClientSignature
);

// Health check endpoint
router.get('/health', (req, res) => {
  logger.info('🏥 [LOE Automation] Health check requested');
  
  res.json({
    success: true,
    message: 'LOE Automation system is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      clientListing: true,
      loeStatusTracking: true,
      loeCreation: true,
      advisorAuthentication: true
    }
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('❌ [LOE Automation Routes] Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    advisorId: req.advisor?.id || req.advisor?._id
  });
  
  res.status(500).json({
    success: false,
    message: 'An error occurred in the LOE Automation system',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
