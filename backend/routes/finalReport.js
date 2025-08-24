/**
 * FILE LOCATION: backend/routes/finalReport.js
 * 
 * PURPOSE: Routes for comprehensive final report generation
 * 
 * FUNCTIONALITY: API endpoints for fetching complete client data from all models
 */

const express = require('express');
const router = express.Router();
const { auth: authenticateToken } = require('../middleware/auth');
const { getAdvisorClients, getComprehensiveData, getComprehensiveSummary } = require('../controllers/finalReportController');

// Apply authentication to all routes
router.use(authenticateToken);

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Final Report router is working!' });
});

/**
 * Get all clients for an advisor (for client selection)
 * GET /api/final-report/clients
 */
router.get('/clients', getAdvisorClients);

/**
 * Get comprehensive data for final report generation
 * GET /api/final-report/data/:clientId
 */
router.get('/data/:clientId', getComprehensiveData);

/**
 * Get comprehensive data summary (lightweight version)
 * GET /api/final-report/summary/:clientId
 */
router.get('/summary/:clientId', getComprehensiveSummary);

module.exports = router;
