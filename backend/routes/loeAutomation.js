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
const fs = require('fs');
const path = require('path');

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

// Serve LOE PDF files with Cloudinary fallback
router.get('/pdf/:filename', 
  logLOEAutomationRequest('Serve LOE PDF file'), 
  async (req, res) => {
    const { filename } = req.params;
    
    try {
      // First, try to find the LOE record to get Cloudinary URL
      const Meeting = require('../models/Meeting');
      const LOEAutomation = require('../models/LOEAutomation');
      
      // Look for LOE records with this filename
      const loeRecord = await LOEAutomation.findOne({
        $or: [
          { 'signedPdfUrl': { $regex: filename } },
          { 'cloudinaryPdfUrl': { $exists: true, $ne: null } }
        ]
      }).populate('advisorId', 'firstName lastName');
      
      // If Cloudinary URL exists, redirect to it
      if (loeRecord?.cloudinaryPdfUrl) {
        logger.info('🔄 Redirecting to Cloudinary PDF', {
          filename,
          cloudinaryUrl: loeRecord.cloudinaryPdfUrl
        });
        return res.redirect(loeRecord.cloudinaryPdfUrl);
      }
      
      // Fallback to local file
      const filePath = path.join(__dirname, '../uploads/loe', filename);
      
      // Debug logging
      console.log('🔍 [LOE PDF Route] Fallback to local file:', {
        filename,
        filePath,
        fileExists: fs.existsSync(filePath),
        hasCloudinaryUrl: !!loeRecord?.cloudinaryPdfUrl
      });
      
      // Check if local file exists
      if (!fs.existsSync(filePath)) {
        logger.error('LOE PDF file not found in local storage', { 
          filename, 
          filePath,
          hasCloudinaryUrl: !!loeRecord?.cloudinaryPdfUrl
        });
        return res.status(404).json({
          success: false,
          error: 'PDF file not found',
          debug: {
            filename,
            filePath,
            hasCloudinaryUrl: !!loeRecord?.cloudinaryPdfUrl,
            cloudinaryUrl: loeRecord?.cloudinaryPdfUrl || 'none'
          }
        });
      }
      
      // Set appropriate headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      
      // Stream the local file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
    } catch (error) {
      logger.error('❌ Error serving LOE PDF', {
        filename,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to serve PDF file',
        details: error.message
      });
    }
  }
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
