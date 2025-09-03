/**
 * FILE LOCATION: backend/routes/mutualFundRecommend.js
 * 
 * PURPOSE: Express router for mutual fund recommendation API endpoints
 * 
 * FUNCTIONALITY:
 * - Defines REST API routes for managing mutual fund recommendations
 * - Applies authentication middleware for secure access
 * - Handles CRUD operations for recommendations
 * - Provides client-specific recommendation management
 * - Implements advisor-specific access control
 * 
 * API ENDPOINTS:
 * - GET /client/:clientId: Get all recommendations for a client
 * - POST /: Create new recommendation
 * - PUT /:id: Update existing recommendation
 * - DELETE /:id: Delete recommendation
 * - GET /summary: Get recommendations summary for advisor
 * - GET /:id: Get specific recommendation by ID
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
const mutualFundRecommendController = require('../controllers/mutualFundRecommendController');
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
 * GET /client/:clientId
 * Get all mutual fund recommendations for a specific client
 * Requires client ownership verification
 */
router.get('/client/:clientId', async (req, res) => {
  try {
    await mutualFundRecommendController.getClientRecommendations(req, res);
  } catch (error) {
    logger.error('Error in client recommendations route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /
 * Create a new mutual fund recommendation
 * Requires client ownership verification and advisor authentication
 */
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = [
      'clientId',
      'fundName',
      'fundHouseName',
      'recommendedMonthlySIP',
      'sipStartDate',
      'expectedExitDate',
      'exitConditions',
      'reasonForRecommendation',
      'riskProfile',
      'investmentGoal'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    await mutualFundRecommendController.createRecommendation(req, res);
  } catch (error) {
    logger.error('Error in create recommendation route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * PUT /:id
 * Update an existing mutual fund recommendation
 * Requires recommendation ownership verification
 */
router.put('/:id', async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Recommendation ID is required'
      });
    }

    await mutualFundRecommendController.updateRecommendation(req, res);
  } catch (error) {
    logger.error('Error in update recommendation route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * DELETE /:id
 * Delete a mutual fund recommendation
 * Requires recommendation ownership verification
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Recommendation ID is required'
      });
    }

    await mutualFundRecommendController.deleteRecommendation(req, res);
  } catch (error) {
    logger.error('Error in delete recommendation route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /summary
 * Get recommendations summary for the authenticated advisor
 * Provides statistics and overview data
 */
router.get('/summary', async (req, res) => {
  try {
    await mutualFundRecommendController.getRecommendationsSummary(req, res);
  } catch (error) {
    logger.error('Error in recommendations summary route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /claude/fund-details
 * Fetch mutual fund details from Claude AI
 * Requires fund name and fund house name
 */
router.post('/claude/fund-details', async (req, res) => {
  try {
    const { fundName, fundHouseName } = req.body;
    
    if (!fundName || !fundHouseName) {
      return res.status(400).json({
        success: false,
        message: 'Fund name and fund house name are required'
      });
    }

    await mutualFundRecommendController.fetchFundDetailsFromClaude(req, res);
  } catch (error) {
    logger.error('Error in Claude AI fund details route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /:id
 * Get a specific recommendation by ID
 * Requires recommendation ownership verification
 */
router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Recommendation ID is required'
      });
    }

    await mutualFundRecommendController.getRecommendationById(req, res);
  } catch (error) {
    logger.error('Error in get recommendation by ID route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Export the router
module.exports = router;
