/**
 * FILE LOCATION: backend/routes/mutualFundExitStrategies.js
 * 
 * PURPOSE: Express router for mutual fund exit strategy API endpoints
 * 
 * FUNCTIONALITY:
 * - Defines REST API routes for managing exit strategies
 * - Applies authentication middleware for secure access
 * - Handles CRUD operations for exit strategies
 * - Provides client fund data and strategy management
 * - Implements advisor-specific access control
 * 
 * API ENDPOINTS:
 * - GET /clients-with-funds: Get advisor's clients with mutual funds
 * - POST /strategies: Create new exit strategy
 * - GET /strategies/:id: Get specific exit strategy
 * - PUT /strategies/:id: Update exit strategy
 * - GET /strategies/client/:clientId: Get strategies for client
 * - GET /summary: Get advisor's exit strategies summary
 * 
 * MIDDLEWARE:
 * - Authentication required for all routes
 * - Advisor role validation
 * - Request logging and error handling
 * - Rate limiting and security headers
 * 
 * SECURITY:
 * - JWT token validation
 * - Multi-tenant data isolation
 * - Input validation and sanitization
 * - CORS and security headers
 * 
 * ERROR HANDLING:
 * - Centralized error handling
 * - Proper HTTP status codes
 * - Detailed error messages for debugging
 * - Logging for monitoring and audit
 */

const express = require('express');
const router = express.Router();
const mutualFundExitController = require('../controllers/mutualFundExitController');
const auth = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Apply authentication middleware to all routes
router.use(auth);

// Log all requests
router.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - Advisor: ${req.advisor?.id}`);
  next();
});

/**
 * GET /clients-with-funds
 * Get all clients with mutual funds for the authenticated advisor
 * Combines existing funds from CAS and recommended funds from financial plans
 */
router.get('/clients-with-funds', async (req, res) => {
  try {
    await mutualFundExitController.getClientsWithFunds(req, res);
  } catch (error) {
    logger.error('Error in clients-with-funds route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /strategies
 * Create a new mutual fund exit strategy
 * Requires client ownership verification and advisor authentication
 */
router.post('/strategies', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = [
      'clientId',
      'fundId',
      'fundName',
      'fundCategory',
      'fundType',
      'source',
      'primaryExitAnalysis',
      'timingStrategy',
      'taxImplications',
      'alternativeInvestmentStrategy',
      'financialGoalAssessment',
      'riskAnalysis',
      'executionActionPlan',
      'costBenefitAnalysis'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    await mutualFundExitController.createExitStrategy(req, res);
  } catch (error) {
    logger.error('Error in create strategy route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /strategies/:id
 * Get a specific exit strategy by ID
 * Verifies advisor access to the strategy
 */
router.get('/strategies/:id', async (req, res) => {
  try {
    // Validate strategy ID
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid strategy ID format'
      });
    }

    await mutualFundExitController.getExitStrategy(req, res);
  } catch (error) {
    logger.error('Error in get strategy route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * PUT /strategies/:id
 * Update an existing exit strategy
 * Maintains version control and audit trail
 */
router.put('/strategies/:id', async (req, res) => {
  try {
    // Validate strategy ID
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid strategy ID format'
      });
    }

    // Validate update data
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided'
      });
    }

    await mutualFundExitController.updateExitStrategy(req, res);
  } catch (error) {
    logger.error('Error in update strategy route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /strategies/client/:clientId
 * Get all exit strategies for a specific client
 * Verifies client ownership by the advisor
 */
router.get('/strategies/client/:clientId', async (req, res) => {
  try {
    // Validate client ID
    if (!req.params.clientId || !req.params.clientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
    }

    await mutualFundExitController.getClientExitStrategies(req, res);
  } catch (error) {
    logger.error('Error in client strategies route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /summary
 * Get exit strategies summary for advisor dashboard
 * Provides aggregated statistics and overview
 */
router.get('/summary', async (req, res) => {
  try {
    await mutualFundExitController.getAdvisorExitStrategiesSummary(req, res);
  } catch (error) {
    logger.error('Error in summary route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * DELETE /strategies/:id
 * Soft delete an exit strategy (mark as inactive)
 * Maintains data integrity and audit trail
 */
router.delete('/strategies/:id', async (req, res) => {
  try {
    const advisorId = req.user.id;
    const strategyId = req.params.id;

    // Validate strategy ID
    if (!strategyId || !strategyId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid strategy ID format'
      });
    }

    logger.info(`Soft deleting exit strategy: ${strategyId} by advisor: ${advisorId}`);

    // Find and soft delete the strategy
    const exitStrategy = await require('../models/MutualFundExitStrategy').findById(strategyId);

    if (!exitStrategy) {
      return res.status(404).json({
        success: false,
        message: 'Exit strategy not found'
      });
    }

    // Verify advisor has access to this strategy
    if (exitStrategy.advisorId.toString() !== advisorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this exit strategy'
      });
    }

    // Soft delete by marking as inactive
    exitStrategy.isActive = false;
    exitStrategy.updatedBy = advisorId;
    exitStrategy.status = 'cancelled';
    await exitStrategy.save();

    logger.info(`Exit strategy soft deleted successfully: ${strategyId}`);

    res.json({
      success: true,
      message: 'Exit strategy deleted successfully'
    });

  } catch (error) {
    logger.error('Error in delete strategy route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /health
 * Health check endpoint for monitoring
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mutual Fund Exit Strategies API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Global error handler for this router
router.use((error, req, res, next) => {
  logger.error('Unhandled error in mutual fund exit strategies router:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

module.exports = router;
