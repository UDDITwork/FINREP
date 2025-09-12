/**
 * FILE LOCATION: backend/routes/pdfRoutes.js
 * 
 * PURPOSE: Routes for PDF generation functionality
 * 
 * FUNCTIONALITY:
 * - POST /api/pdf/generate-client-report/:clientId - Generate comprehensive PDF report
 * - GET /api/pdf/health - Health check for PDF service
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const { auth } = require('../middleware/auth');
const pdfController = require('../controllers/pdfController');

// Handle OPTIONS request for CORS preflight
router.options('/generate-client-report/:clientId', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://richieai.in');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

// Generate comprehensive PDF report for a client
router.post('/generate-client-report/:clientId', auth, async (req, res) => {
  const routeRequestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`\n🛣️ [PDF ROUTES] [${routeRequestId}] ===== ROUTE HANDLER STARTED =====`);
  console.log(`📋 [PDF ROUTES] [${routeRequestId}] Route: POST /api/pdf/generate-client-report/:clientId`);
  console.log(`🔍 [PDF ROUTES] [${routeRequestId}] Route params:`, {
    clientId: req.params.clientId,
    advisorId: req.advisor?.id,
    method: req.method,
    url: req.originalUrl
  });
  
  try {
    console.log(`📞 [PDF ROUTES] [${routeRequestId}] Calling pdfController.generateClientReport...`);
    await pdfController.generateClientReport(req, res);
    console.log(`✅ [PDF ROUTES] [${routeRequestId}] Route handler completed successfully`);
  } catch (error) {
    console.log(`❌ [PDF ROUTES] [${routeRequestId}] ===== ROUTE HANDLER FAILED =====`);
    console.log(`💥 [PDF ROUTES] [${routeRequestId}] Route error details:`, {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    
    logger.error('❌ [PDF ROUTES] Error in PDF generation route', {
      routeRequestId,
      error: error.message,
      stack: error.stack,
      clientId: req.params.clientId,
      advisorId: req.advisor?.id
    });

    res.status(500).json({
      success: false,
      message: 'PDF generation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Health check for PDF generation service
router.get('/health', async (req, res) => {
  try {
    await pdfController.healthCheck(req, res);
  } catch (error) {
    logger.error('❌ [PDF ROUTES] Error in health check route', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Debug endpoint to list available client IDs
router.get('/debug/clients', auth, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Client = require('../models/Client');
    
    const advisorId = req.advisor.id;
    const clients = await Client.find({ 
      advisor: new mongoose.Types.ObjectId(advisorId) 
    }).select('_id id firstName lastName onboardingStep').limit(10);
    
    res.json({
      success: true,
      message: 'Available clients for PDF generation',
      advisorId,
      clients: clients.map(client => ({
        _id: client._id,
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        onboardingStep: client.onboardingStep,
        isValidObjectId: mongoose.Types.ObjectId.isValid(client._id),
        hasCustomId: !!client.id
      }))
    });
  } catch (error) {
    logger.error('❌ [PDF ROUTES] Error in debug clients route', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Debug clients failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Debug endpoint to find specific client by custom ID
router.get('/debug/client/:customId', auth, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Client = require('../models/Client');
    
    const { customId } = req.params;
    const advisorId = req.advisor.id;
    
    // Try to find client by custom ID
    const client = await Client.findOne({ 
      id: customId,
      advisor: new mongoose.Types.ObjectId(advisorId) 
    }).select('_id id firstName lastName onboardingStep');
    
    if (client) {
      res.json({
        success: true,
        message: 'Client found',
        client: {
          _id: client._id,
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
          onboardingStep: client.onboardingStep,
          isValidObjectId: mongoose.Types.ObjectId.isValid(client._id),
          mongoIdString: client._id.toString()
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Client not found',
        customId,
        advisorId
      });
    }
  } catch (error) {
    logger.error('❌ [PDF ROUTES] Error in debug client route', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Debug client failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Test endpoint to generate PDF with mock data (for debugging)
router.post('/test-generate', async (req, res) => {
  try {
    logger.info('🧪 [PDF ROUTES] Testing PDF generation with mock data');
    
    // Create mock client data for testing
    const mockClientData = {
      client: {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        onboardingStep: 5,
        financialInfo: {
          totalMonthlyIncome: 100000,
          totalMonthlyExpenses: 60000,
          monthlyExpenses: {
            housing: 20000,
            food: 15000,
            transportation: 10000,
            healthcare: 5000,
            entertainment: 10000
          }
        },
        assets: [
          { name: 'Savings Account', value: 500000, type: 'liquid' },
          { name: 'Mutual Funds', value: 800000, type: 'investment' },
          { name: 'Real Estate', value: 2000000, type: 'property' }
        ],
        liabilities: [
          { name: 'Home Loan', amount: 1500000, type: 'secured' },
          { name: 'Credit Card', amount: 50000, type: 'unsecured' }
        ],
        majorGoals: [
          { goalName: 'Retirement Planning', targetAmount: 10000000, timeframe: '20 years' },
          { goalName: 'Children Education', targetAmount: 2000000, timeframe: '10 years' }
        ]
      },
      vault: {
        firmName: 'Test Financial Advisory',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@testfirm.com',
        sebiRegNumber: 'SEBI123456',
        phoneNumber: '+1234567890',
        address: '123 Financial District, Mumbai',
        certifications: ['CFA', 'CFP']
      },
      financialPlans: [],
      meetings: [],
      loeDocuments: [],
      loeAutomation: [],
      abTestSessions: [],
      chatHistory: [],
      mutualFundExitStrategies: [],
      clientInvitations: [],
      estateInformation: null,
      mutualFundRecommend: [],
      taxPlanning: null
    };
    
    // Generate PDF using the simple service directly
    const SimplePDFGenerationService = require('../services/simplePdfGenerationService');
    const pdfService = new SimplePDFGenerationService();
    
    const pdfBuffer = await pdfService.generateClientReport(mockClientData, mockClientData.vault);
    
    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test-client-report.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
    
    logger.info('✅ [PDF ROUTES] Test PDF generated successfully', {
      pdfSize: pdfBuffer.length
    });
    
  } catch (error) {
    logger.error('❌ [PDF ROUTES] Error in test PDF generation', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Test PDF generation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PDF Diagnostic endpoint
router.get('/diagnostic/:clientId', auth, async (req, res) => {
  try {
    const diagnosticController = require('../controllers/pdfDiagnosticController');
    await diagnosticController.runDiagnostics(req, res);
  } catch (error) {
    logger.error('❌ [PDF ROUTES] Error in diagnostic route', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.clientId,
      advisorId: req.advisor?.id
    });

    res.status(500).json({
      success: false,
      message: 'PDF diagnostic failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Log route registration
logger.info('📄 [PDF ROUTES] Routes registered:');
logger.info('   • POST /api/pdf/generate-client-report/:clientId');
logger.info('   • GET /api/pdf/health');
logger.info('   • GET /api/pdf/diagnostic/:clientId');
logger.info('   • GET /api/pdf/debug/clients');
logger.info('   • GET /api/pdf/debug/client/:customId');
logger.info('   • POST /api/pdf/test-generate');

module.exports = router;
