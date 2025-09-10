// File: backend/routes/clients.js
/**
 * FILE LOCATION: backend/routes/clients.js
 * 
 * Client management API routes including CRUD operations, onboarding, CAS uploads,
 * AI chat functionality, and comprehensive client data management. This module
 * handles all client-related API endpoints for the financial advisor platform.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Import enhanced controllers
const {
  getClients,
  getClientById,
  sendClientInvitation,
  sendClientOnboardingWithMeeting,
  getClientInvitations,
  updateClient,
  deleteClient,
  getClientOnboardingForm,
  submitClientOnboardingForm,
  saveClientFormDraft,
  getClientFormDraft,
  uploadClientCAS,
  parseClientCAS,
  getClientCASData,
  deleteClientCAS,
  getDashboardStats,
  getClientFinancialSummary,
  bulkImportClients
} = require('../controllers/clientController');

const { OnboardingCASController, upload } = require('../controllers/OnboardingCASController');

// Import middleware
const auth = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { casEventLogger } = require('../utils/casEventLogger');

// Configure multer for CAS uploads in main client flow
const casStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/cas');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const clientId = req.params.id || 'unknown';
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `client_${clientId}_${timestamp}_${sanitizedName}`);
  }
});

const casFileFilter = (req, file, cb) => {
  casEventLogger.logInfo('CAS_FILE_UPLOAD_ATTEMPT', {
    clientId: req.params.id,
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size
  });

  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    const error = new Error('Only PDF files are allowed for CAS upload');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const casUpload = multer({
  storage: casStorage,
  fileFilter: casFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

// Configure multer for bulk import files
const bulkImportStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/temp');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const advisorId = req.user?.id || 'unknown';
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `bulk_import_${advisorId}_${timestamp}_${sanitizedName}`);
  }
});

const bulkImportFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.csv', '.json', '.xlsx', '.xls'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    const error = new Error('Only CSV, JSON, or Excel files are allowed for bulk import');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const bulkImportUpload = multer({
  storage: bulkImportStorage,
  fileFilter: bulkImportFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for bulk import files
    files: 1 // Only one file at a time
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    casEventLogger.logError('CAS_UPLOAD_MULTER_ERROR', error, {
      clientId: req.params.id,
      code: error.code
    });

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed.'
      });
    }
  }
  
  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: 'Only PDF files are allowed.'
    });
  }
  
  next(error);
};

// ============================================================================
// PROTECTED ROUTES (Require advisor authentication)
// ============================================================================

// Enhanced Client Management Routes
router.get('/manage', auth, getClients);
router.get('/manage/invitations', auth, getClientInvitations);
router.post('/manage/invitations', auth, sendClientInvitation);
router.post('/manage/onboard-with-meeting', auth, sendClientOnboardingWithMeeting);
router.get('/manage/:id', auth, getClientById);
router.put('/manage/:id', auth, updateClient);
router.delete('/manage/:id', auth, deleteClient);

// NEW: Enhanced Dashboard and Analytics Routes
router.get('/manage/dashboard/stats', auth, getDashboardStats);
router.get('/manage/:id/financial-summary', auth, getClientFinancialSummary);

// Bulk Import Route
router.post('/manage/bulk-import', auth, bulkImportUpload.single('file'), handleMulterError, bulkImportClients);

// Enhanced CAS Management Routes for existing clients
router.post('/manage/:id/cas/upload', auth, casUpload.single('casFile'), handleMulterError, uploadClientCAS);
router.post('/manage/:id/cas/parse', auth, parseClientCAS);
router.get('/manage/:id/cas', auth, getClientCASData);
router.delete('/manage/:id/cas', auth, deleteClientCAS);

// ============================================================================
// PUBLIC ROUTES (Enhanced 5-Stage Client onboarding - no authentication required)
// ============================================================================

// Enhanced Client Onboarding Routes
router.get('/onboarding/:token', getClientOnboardingForm);

// NEW: Draft Management Routes for 5-Stage Form
router.post('/onboarding/:token/draft', saveClientFormDraft);
router.get('/onboarding/:token/draft', getClientFormDraft);

// Enhanced CAS Upload Routes for onboarding flow (keeping existing CAS logic)
router.post('/onboarding/:token/cas/upload', upload.single('casFile'), handleMulterError, OnboardingCASController.uploadCAS);
router.post('/onboarding/:token/cas/parse', OnboardingCASController.parseCAS);
router.get('/onboarding/:token/cas/status', OnboardingCASController.getCASStatus);

// ============================================================================
// UTILITY ROUTES
// ============================================================================

// Enhanced health check for comprehensive functionality
router.get('/health', (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, '../uploads/cas');
    const uploadsExist = fs.existsSync(uploadsPath);
    
    casEventLogger.logInfo('ENHANCED_HEALTH_CHECK', {
      uploadsDirectoryExists: uploadsExist,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Enhanced client management system is operational',
      data: {
        uploadsDirectory: uploadsExist,
        maxFileSize: '10MB',
        supportedFormats: ['PDF'],
        supportedCASTypes: ['CDSL', 'NSDL'],
        features: {
          fiveStageOnboarding: true,
          enhancedFinancialTracking: true,
          comprehensiveGoalPlanning: true,
          advancedDashboardAnalytics: true,
          casIntegration: true,
          draftSaving: true,
          financialHealthScoring: true
        },
        formStages: [
          { stage: 1, name: 'Personal Information & KYC' },
          { stage: 2, name: 'Income & Employment Analysis' },
          { stage: 3, name: 'Financial Goals & Retirement' },
          { stage: 4, name: 'Assets & Liabilities Mapping' },
          { stage: 5, name: 'Investment Profile & CAS Upload' }
        ],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    casEventLogger.logError('ENHANCED_HEALTH_CHECK_FAILED', error);
    
    res.status(500).json({
      success: false,
      message: 'Enhanced health check failed',
      error: error.message
    });
  }
});

// Enhanced debug route for comprehensive testing (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/form-structure', (req, res) => {
    res.json({
      success: true,
      message: 'Enhanced 5-Stage Form Structure',
      data: {
        formConfiguration: {
          totalStages: 5,
          estimatedTime: '15-20 minutes',
          features: [
            'Real-time financial calculations',
            'Automatic net worth computation',
            'Goal feasibility analysis',
            'CAS portfolio import',
            'Draft saving capability',
            'Progress tracking',
            'Financial health scoring'
          ]
        },
        stageDetails: {
          stage1: {
            title: 'Personal Information & KYC',
            fields: [
              'firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 
              'gender', 'panNumber', 'address'
            ],
            estimatedTime: '3-4 minutes',
            required: true
          },
          stage2: {
            title: 'Income & Employment Analysis',
            fields: [
              'occupation', 'employerBusinessName', 'annualIncome', 'additionalIncome',
              'monthlyExpenses', 'annualTaxes', 'annualVacationExpenses'
            ],
            estimatedTime: '4-5 minutes',
            calculations: ['monthlyIncome', 'totalExpenses', 'savingsRate'],
            required: true
          },
          stage3: {
            title: 'Financial Goals & Retirement Planning',
            fields: [
              'retirementPlanning', 'majorGoals', 'customGoals'
            ],
            estimatedTime: '3-4 minutes',
            calculations: ['goalFeasibility', 'requiredSavings'],
            required: true
          },
          stage4: {
            title: 'Assets & Liabilities Assessment',
            fields: [
              'assets.cashBankSavings', 'assets.realEstate', 'assets.investments',
              'liabilities.loans', 'liabilities.creditCardDebt'
            ],
            estimatedTime: '4-5 minutes',
            calculations: ['totalAssets', 'totalLiabilities', 'netWorth'],
            required: true
          },
          stage5: {
            title: 'Investment Profile & CAS Upload',
            fields: [
              'investmentExperience', 'riskTolerance', 'investmentGoals',
              'monthlySavingsTarget', 'casUpload'
            ],
            estimatedTime: '2-3 minutes',
            optional: ['casUpload'],
            required: false
          }
        },
        dataProcessing: {
          realTimeCalculations: true,
          automaticValidation: true,
          progressTracking: true,
          draftSaving: true,
          casIntegration: true
        }
      }
    });
  });

  router.post('/debug/test-submission', async (req, res) => {
    const debugStartTime = Date.now();
    const debugEventId = casEventLogger.logInfo('DEBUG_FORM_SUBMISSION_TEST', {
      hasData: !!req.body,
      dataSize: JSON.stringify(req.body).length
    });

    try {
      // Simulate form processing
      const { formData } = req.body;
      
      console.log(`\n🔧 DEBUG: Testing enhanced form submission...`);
      console.log(`📋 Form Data Keys: ${Object.keys(formData || {}).join(', ')}`);
      
      // Validate each stage
      const stageValidation = {
        stage1: !!(formData?.firstName && formData?.lastName && formData?.email),
        stage2: !!(formData?.occupation && formData?.annualIncome),
        stage3: !!(formData?.retirementPlanning?.targetRetirementAge),
        stage4: !!(formData?.assets),
        stage5: !!(formData?.investmentExperience && formData?.riskTolerance)
      };
      
      const debugDuration = Date.now() - debugStartTime;

      casEventLogger.logInfo('DEBUG_FORM_SUBMISSION_SUCCESS', {
        stageValidation,
        debugDuration: `${debugDuration}ms`,
        eventId: debugEventId
      });

      console.log(`✅ DEBUG: Form validation completed in ${debugDuration}ms`);

      res.json({
        success: true,
        message: 'Enhanced form submission test completed',
        data: {
          stageValidation,
          processingTime: debugDuration,
          formCompleteness: Object.values(stageValidation).filter(Boolean).length,
          totalStages: 5,
          debug: true
        }
      });

    } catch (error) {
      const debugDuration = Date.now() - debugStartTime;
      
      casEventLogger.logError('DEBUG_FORM_SUBMISSION_FAILED', error, {
        debugDuration: `${debugDuration}ms`,
        eventId: debugEventId
      });

      console.log(`❌ DEBUG: Form test failed after ${debugDuration}ms: ${error.message}`);

      res.status(400).json({
        success: false,
        message: 'Enhanced form submission test failed',
        error: error.message,
        debug: true
      });
    }
  });

  // CAS debug route (keeping existing logic)
  router.post('/cas/debug/parse', casUpload.single('casFile'), handleMulterError, async (req, res) => {
    const debugStartTime = Date.now();
    const debugEventId = casEventLogger.logInfo('CAS_DEBUG_PARSE_STARTED', {
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      hasPassword: !!req.body.casPassword
    });

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CAS file uploaded for debug parsing'
        });
      }

      const CASParser = require('../services/cas-parser');
      const casParser = new CASParser();
      
      console.log(`\n🔧 DEBUG: Starting CAS parse...`);
      console.log(`📁 File: ${req.file.originalname}`);
      console.log(`📊 Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
      
      const parsedData = await casParser.parseCASFile(req.file.path, req.body.casPassword || '');
      
      // Cleanup debug file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      const debugDuration = Date.now() - debugStartTime;

      casEventLogger.logInfo('CAS_DEBUG_PARSE_SUCCESS', {
        fileName: req.file.originalname,
        debugDuration: `${debugDuration}ms`,
        totalValue: parsedData.summary?.total_value || 0,
        eventId: debugEventId
      });

      console.log(`✅ DEBUG: Parse completed in ${debugDuration}ms`);

      res.json({
        success: true,
        message: 'CAS file parsed successfully (debug mode)',
        data: {
          fileName: req.file.originalname,
          parseTime: debugDuration,
          parsedData: parsedData,
          debug: true
        }
      });

    } catch (error) {
      const debugDuration = Date.now() - debugStartTime;
      
      // Cleanup debug file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      casEventLogger.logError('CAS_DEBUG_PARSE_FAILED', error, {
        fileName: req.file?.originalname,
        debugDuration: `${debugDuration}ms`,
        eventId: debugEventId
      });

      console.log(`❌ DEBUG: Parse failed after ${debugDuration}ms: ${error.message}`);

      res.status(400).json({
        success: false,
        message: 'CAS debug parsing failed',
        error: error.message,
        debug: true
      });
    }
  });
}

// ============================================================================
// ENHANCED FORM VALIDATION MIDDLEWARE
// ============================================================================

// Middleware to validate essential form data
const validateEnhancedFormData = (req, res, next) => {
  try {
    const formData = req.body;
    const errors = [];
    
    // Essential fields validation (flexible for different form structures)
    if (!formData.firstName || formData.firstName.trim() === '') {
      errors.push('First name is required');
    }
    
    if (!formData.lastName || formData.lastName.trim() === '') {
      errors.push('Last name is required');
    }
    
    if (!formData.email || formData.email.trim() === '') {
      errors.push('Email is required');
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.push('Invalid email format');
    }
    
    // Optional validations (only if data is provided)
    if (formData.panNumber && formData.panNumber.trim() !== '' && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      errors.push('Invalid PAN number format');
    }
    
    if (formData.annualIncome && formData.annualIncome !== '' && (isNaN(formData.annualIncome) || Number(formData.annualIncome) < 0)) {
      errors.push('Annual income must be a positive number');
    }
    
    // Log form data for debugging (excluding sensitive info)
    console.log('🔍 FORM VALIDATION DEBUG:', {
      hasFirstName: !!formData.firstName,
      hasLastName: !!formData.lastName,
      hasEmail: !!formData.email,
      hasIncomeType: !!formData.incomeType,
      hasInvestmentExperience: !!formData.investmentExperience,
      investmentExperienceValue: formData.investmentExperience,
      formDataKeys: Object.keys(formData),
      errors: errors
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Form validation failed',
        errors: errors
      });
    }
    
    next();
  } catch (error) {
    logger.error('Form validation middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Form validation error',
      error: error.message
    });
  }
};

// Apply validation middleware to form submission
router.post('/onboarding/:token', validateEnhancedFormData, submitClientOnboardingForm);

// ============================================================================
// ENHANCED ERROR HANDLING
// ============================================================================

// Global error handler for this router
router.use((error, req, res, next) => {
  casEventLogger.logError('ENHANCED_CLIENT_ROUTES_ERROR', error, {
    path: req.path,
    method: req.method,
    clientId: req.params.id,
    token: req.params.token,
    stage: req.body?.currentStep || 'unknown'
  });

  logger.error('Enhanced client routes error:', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
    formStage: req.body?.currentStep
  });

  // Enhanced error responses based on route type
  let message = 'An error occurred processing your request';
  let statusCode = 500;
  
  if (req.path.includes('/onboarding/')) {
    message = 'An error occurred during the onboarding process. Please try again.';
    if (error.name === 'ValidationError') {
      message = 'Please check your form data and try again.';
      statusCode = 400;
    }
  } else if (req.path.includes('/cas/')) {
    message = 'An error occurred processing your CAS file. Please try again.';
  } else if (req.path.includes('/dashboard/')) {
    message = 'An error occurred loading dashboard data. Please refresh the page.';
  }
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      success: false,
      message: message
    });
  } else {
    res.status(statusCode).json({
      success: false,
      message: message,
      error: error.message,
      stack: error.stack,
      debug: {
        path: req.path,
        method: req.method,
        formStage: req.body?.currentStep,
        hasToken: !!req.params.token,
        hasClientId: !!req.params.id
      }
    });
  }
});

// ============================================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================================

// Enhanced request logging for better debugging
router.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  casEventLogger.logInfo('ENHANCED_REQUEST_START', {
    method: req.method,
    path: req.path,
    token: req.params.token,
    clientId: req.params.id,
    hasBody: !!req.body && Object.keys(req.body).length > 0,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stage: req.body?.currentStep || req.query?.stepNumber
  });
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    casEventLogger.logInfo('ENHANCED_REQUEST_COMPLETE', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: data?.success,
      token: req.params.token,
      clientId: req.params.id,
      stage: req.body?.currentStep || req.query?.stepNumber
    });
    
    return originalJson.call(this, data);
  };
  
  next();
});

// AI Chat Route
const claudeAiService = require('../services/claudeAiService');
const Client = require('../models/Client');

/**
 * @route   POST /api/clients/ai-chat
 * @desc    Chat with AI about a specific client's financial situation
 * @access  Private (Advisor only)
 */
router.post('/ai-chat', auth, async (req, res) => {
  try {
    const { clientId, message } = req.body;
    const advisorId = req.advisor.id;

    console.log('🤖 [AI Chat] Received chat request:', {
      advisorId,
      clientId,
      messageLength: message?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Validate input
    if (!clientId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Client ID and message are required'
      });
    }

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Get client data with comprehensive information
    console.log('📋 [AI Chat] Fetching client data...');
    const client = await Client.findOne({ 
      _id: new mongoose.Types.ObjectId(clientId),  // 🔥 Fixed: String ko ObjectId banaya
      advisorId: advisorId 
    }).lean();

    if (!client) {
      console.log('❌ [AI Chat] Client not found:', { clientId, advisorId });
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }

    console.log('✅ [AI Chat] Client found:', {
      clientId,
      clientName: `${client.firstName} ${client.lastName}`,
      hasFinancialData: !!(client.totalMonthlyIncome || client.assets),
      hasDebts: !!client.debtsAndLiabilities,
      hasGoals: !!client.enhancedFinancialGoals
    });

    // Create system prompt for conversational AI
    const systemPrompt = `You are RichieAI, a helpful and knowledgeable financial advisor assistant. You have access to comprehensive financial information about the client and can provide personalized advice, recommendations, and answer questions about their financial situation.

IMPORTANT GUIDELINES:
- Be conversational, friendly, and professional
- Provide specific, actionable advice based on the client's actual financial data
- Use exact numbers from their portfolio when relevant
- Explain financial concepts in simple terms
- Always consider their risk profile and goals when making recommendations
- If asked about specific investments, reference their actual holdings
- Suggest concrete next steps they can take
- Be encouraging but realistic about their financial situation

You can discuss:
- Investment strategies and portfolio optimization
- Debt management and EMI restructuring
- Goal-based financial planning
- Tax planning and optimization
- Risk assessment and insurance needs
- Emergency fund planning
- Retirement planning strategies
- Specific mutual fund recommendations based on their profile

Remember: You're having a conversation with their financial advisor, so provide insights that help the advisor give better advice to their client.`;

    // Format client context for the AI
    const clientContext = formatClientContextForChat(client, message);

    console.log('🧠 [AI Chat] Sending request to Claude AI...');
    
    // Make request to Claude AI
    const aiResponse = await claudeAiService.makeRequest(
      systemPrompt,
      clientContext,
      0.7 // Higher temperature for more conversational responses
    );

    if (!aiResponse.success) {
      console.error('❌ [AI Chat] Claude AI request failed:', aiResponse.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get AI response',
        error: aiResponse.error
      });
    }

    console.log('✅ [AI Chat] AI response received:', {
      responseLength: aiResponse.content?.length || 0,
      hasUsage: !!aiResponse.usage
    });

    // Return the AI response
    res.json({
      success: true,
      response: aiResponse.content,
      usage: aiResponse.usage,
      clientInfo: {
        id: client._id,
        name: `${client.firstName} ${client.lastName}`,
        riskProfile: client.riskProfile || 'Not assessed'
      }
    });

  } catch (error) {
    console.error('❌ [AI Chat] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Format client data and user message for conversational AI chat
 */
function formatClientContextForChat(client, userMessage) {
  // Calculate key financial metrics
  const monthlyIncome = client.totalMonthlyIncome || 
                       client.calculatedFinancials?.totalMonthlyIncome || 0;
  const monthlyExpenses = client.totalMonthlyExpenses || 
                         client.calculatedFinancials?.totalMonthlyExpenses || 0;
  const monthlySurplus = monthlyIncome - monthlyExpenses;

  // Calculate total debts and EMIs
  let totalEMIs = 0;
  let totalOutstanding = 0;
  let activeDebts = [];

  if (client.debtsAndLiabilities) {
    Object.entries(client.debtsAndLiabilities).forEach(([debtType, debt]) => {
      if (debt && (debt.hasLoan || debt.hasDebt)) {
        const emi = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
        const outstanding = parseFloat(debt.outstandingAmount) || 0;
        const interestRate = parseFloat(debt.interestRate) || 0;
        
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
  }

  const availableForInvestment = monthlySurplus - totalEMIs;

  // Calculate investment portfolio value
  let totalInvestments = 0;
  if (client.assets?.investments) {
    const investments = client.assets.investments;
    if (investments.equity) {
      totalInvestments += (investments.equity.mutualFunds || 0) + 
                         (investments.equity.directStocks || 0) + 
                         (investments.equity.elss || 0);
    }
    if (investments.fixedIncome) {
      totalInvestments += (investments.fixedIncome.ppf || 0) + 
                         (investments.fixedIncome.epf || 0) + 
                         (investments.fixedIncome.nps || 0) + 
                         (investments.fixedIncome.fixedDeposits || 0);
    }
  }

  // Format CAS portfolio data if available
  let portfolioSummary = '';
  if (client.portfolioSummary && client.portfolioSummary.totalValue > 0) {
    portfolioSummary = `
CURRENT PORTFOLIO (from CAS data):
- Total Portfolio Value: ₹${client.portfolioSummary.totalValue.toLocaleString('en-IN')}
- Total Holdings: ${client.portfolioSummary.totalFunds || 0} mutual funds
- Top Holdings: ${client.portfolioSummary.topHoldings?.slice(0, 3)?.map(h => 
  `${h.fundName} (₹${h.currentValue?.toLocaleString('en-IN')})`).join(', ') || 'N/A'}`;
  }

  // Format goals context
  let goalsContext = '';
  if (client.enhancedFinancialGoals) {
    const goals = client.enhancedFinancialGoals;
    goalsContext = `
CLIENT'S FINANCIAL GOALS:
${goals.emergencyFund?.targetAmount ? `- Emergency Fund: ₹${goals.emergencyFund.targetAmount.toLocaleString('en-IN')}` : ''}
${goals.childEducation?.isApplicable ? `- Child Education: ${goals.childEducation.details?.targetAmount ? `₹${goals.childEducation.details.targetAmount.toLocaleString('en-IN')} by ${goals.childEducation.details.targetYear}` : 'Planning required'}` : ''}
${goals.homePurchase?.isApplicable ? `- Home Purchase: ${goals.homePurchase.details?.targetAmount ? `₹${goals.homePurchase.details.targetAmount.toLocaleString('en-IN')} by ${goals.homePurchase.details.targetYear}` : 'Planning required'}` : ''}
${goals.customGoals?.length > 0 ? goals.customGoals.map(g => `- ${g.goalName}: ₹${g.targetAmount?.toLocaleString('en-IN')} by ${g.targetYear}`).join('\n') : ''}`;
  }

  return `FINANCIAL CONSULTATION CONTEXT:

CLIENT PROFILE:
- Name: ${client.firstName} ${client.lastName}
- Age: ${client.age || 'Not specified'}
- Risk Profile: ${client.riskProfile || client.enhancedRiskProfile?.riskTolerance || 'Not assessed'}
- Investment Experience: ${client.enhancedRiskProfile?.investmentExperience || 'Not specified'}

CURRENT FINANCIAL SITUATION:
- Monthly Income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Monthly Expenses: ₹${monthlyExpenses.toLocaleString('en-IN')}
- Monthly Surplus: ₹${monthlySurplus.toLocaleString('en-IN')}
- Monthly EMIs: ₹${totalEMIs.toLocaleString('en-IN')}
- Available for Investment: ₹${availableForInvestment.toLocaleString('en-IN')}

DEBT PORTFOLIO:
${activeDebts.length > 0 ? 
  activeDebts.map(debt => `- ${debt.type}: EMI ₹${debt.emi.toLocaleString('en-IN')}, Outstanding ₹${debt.outstanding.toLocaleString('en-IN')}, Rate ${debt.interestRate}%`).join('\n') : 
  '- No active debts (Excellent financial position)'}

INVESTMENT PORTFOLIO:
- Cash & Savings: ₹${(client.assets?.cashBankSavings || 0).toLocaleString('en-IN')}
- Total Investments: ₹${totalInvestments.toLocaleString('en-IN')}
${portfolioSummary}

${goalsContext}

ADVISOR QUESTION/CONSULTATION:
"${userMessage}"

Please provide a helpful, personalized response based on this client's specific financial situation. Be conversational but professional, and give actionable advice that the advisor can discuss with their client.`;
}

module.exports = router;