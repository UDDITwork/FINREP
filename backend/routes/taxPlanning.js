// File: backend/routes/taxPlanning.js
/**
 * Tax Planning Routes
 * API endpoints for tax planning functionality
 */

const express = require('express');
const router = express.Router();
const {
  getClientTaxPlanningData,
  generateAIRecommendations,
  saveManualAdvisorInputs,
  getTaxPlanningHistory
} = require('../controllers/taxPlanningController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route GET /api/tax-planning/client/:clientId
 * @desc Get comprehensive tax planning data for a client
 * @access Private (Advisor only)
 */
router.get('/client/:clientId', getClientTaxPlanningData);

/**
 * @route POST /api/tax-planning/client/:clientId/ai-recommendations
 * @desc Generate AI tax planning recommendations
 * @access Private (Advisor only)
 */
router.post('/client/:clientId/ai-recommendations', generateAIRecommendations);

/**
 * @route POST /api/tax-planning/client/:clientId/manual-inputs
 * @desc Save manual advisor inputs and recommendations
 * @access Private (Advisor only)
 */
router.post('/client/:clientId/manual-inputs', saveManualAdvisorInputs);

/**
 * @route GET /api/tax-planning/client/:clientId/history
 * @desc Get tax planning history for a client
 * @access Private (Advisor only)
 */
router.get('/client/:clientId/history', getTaxPlanningHistory);

module.exports = router;
