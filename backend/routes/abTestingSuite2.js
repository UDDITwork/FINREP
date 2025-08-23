// File: backend/routes/abTestingSuite2.js
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');
const { 
  createSession,
  updateRiskProfile,
  addScenarios,
  updateScenarioSelection,  
  addSimulationResults,
  addStressTestResults,
  completeSession,
  getSession,
  getAdvisorSessions,
  addSessionNote,
  exportSession,
  deleteSession
} = require('../controllers/abTestingSuite2Controller');

// Apply authentication middleware to all routes
router.use(auth);

// Validation middleware
const validateCreateSession = [
  body('clientId')
    .isMongoId()
    .withMessage('Valid client ID is required'),
];

const validateUpdateRiskProfile = [
  param('sessionId').notEmpty().withMessage('Session ID is required'),
  body('riskProfile').isObject().withMessage('Risk profile data is required'),
  body('riskProfile.calculatedRiskScore').isObject().withMessage('Risk score is required'),
  body('riskProfile.calculatedRiskScore.riskPercentage')
    .isNumeric()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Risk percentage must be between 0 and 100'),
];

const validateAddScenarios = [
  param('sessionId').notEmpty().withMessage('Session ID is required'),
  body('scenarios').isArray({ min: 1 }).withMessage('At least one scenario is required'),
  body('scenarios.*.scenarioName').notEmpty().withMessage('Scenario name is required'),
  body('scenarios.*.scenarioType')
    .isIn(['conservative', 'moderate', 'aggressive', 'ultra_aggressive', 'custom'])
    .withMessage('Valid scenario type is required'),
  body('scenarios.*.parameters').isObject().withMessage('Scenario parameters are required'),
  body('scenarios.*.parameters.equityAllocation')
    .isNumeric()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Equity allocation must be between 0 and 100'),
  body('scenarios.*.parameters.debtAllocation')
    .isNumeric()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Debt allocation must be between 0 and 100'),
  body('scenarios.*.parameters.expectedReturn')
    .isNumeric()
    .isFloat({ min: 0, max: 50 })
    .withMessage('Expected return must be between 0 and 50'),
];

const validateScenarioSelection = [
  param('sessionId').notEmpty().withMessage('Session ID is required'),
  body('selectedScenarios').isArray().withMessage('Selected scenarios array is required'),
];

const validateSimulationResults = [
  param('sessionId').notEmpty().withMessage('Session ID is required'),
  body('simulationResults').isObject().withMessage('Simulation results are required'),
];

const validateStressTestResults = [
  param('sessionId').notEmpty().withMessage('Session ID is required'),
  body('stressTestResults').isObject().withMessage('Stress test results are required'),
];

const validateCompleteSession = [
  param('sessionId').notEmpty().withMessage('Session ID is required'),
  body('completionData').isObject().withMessage('Completion data is required'),
];

const validateSessionNote = [
  param('sessionId').notEmpty().withMessage('Session ID is required'),
  body('noteType')
    .isIn(['advisor_note', 'system_note', 'client_feedback', 'calculation_note'])
    .withMessage('Valid note type is required'),
  body('content').notEmpty().withMessage('Note content is required'),
];

const validateExportSession = [
  param('sessionId').notEmpty().withMessage('Session ID is required'),
  body('exportType')
    .optional()
    .isIn(['pdf_report', 'excel_summary', 'presentation_slides'])
    .withMessage('Valid export type is required'),
];

// Routes

// @route   POST /api/ab-testing-suite-2/sessions
// @desc    Create new A/B testing session
// @access  Private (Advisors only)
router.post('/sessions', validateCreateSession, createSession);

// @route   GET /api/ab-testing-suite-2/sessions
// @desc    Get all sessions for current advisor  
// @access  Private (Advisors only)
router.get('/sessions', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['in_progress', 'completed', 'abandoned', 'archived']).withMessage('Invalid status'),
  query('clientId').optional().isMongoId().withMessage('Valid client ID is required')
], getAdvisorSessions);

// @route   GET /api/ab-testing-suite-2/sessions/:sessionId
// @desc    Get specific session details
// @access  Private (Advisors only)
router.get('/sessions/:sessionId', [
  param('sessionId').notEmpty().withMessage('Session ID is required')
], getSession);

// @route   PUT /api/ab-testing-suite-2/sessions/:sessionId/risk-profile
// @desc    Update risk profile for session
// @access  Private (Advisors only)
router.put('/sessions/:sessionId/risk-profile', validateUpdateRiskProfile, updateRiskProfile);

// @route   PUT /api/ab-testing-suite-2/sessions/:sessionId/scenarios
// @desc    Add investment scenarios to session
// @access  Private (Advisors only)
router.put('/sessions/:sessionId/scenarios', validateAddScenarios, addScenarios);

// @route   PUT /api/ab-testing-suite-2/sessions/:sessionId/scenario-selection
// @desc    Update selected scenarios for testing
// @access  Private (Advisors only)
router.put('/sessions/:sessionId/scenario-selection', validateScenarioSelection, updateScenarioSelection);

// @route   PUT /api/ab-testing-suite-2/sessions/:sessionId/simulation-results
// @desc    Add Monte Carlo simulation results
// @access  Private (Advisors only)
router.put('/sessions/:sessionId/simulation-results', validateSimulationResults, addSimulationResults);

// @route   PUT /api/ab-testing-suite-2/sessions/:sessionId/stress-test-results
// @desc    Add stress testing results
// @access  Private (Advisors only)
router.put('/sessions/:sessionId/stress-test-results', validateStressTestResults, addStressTestResults);

// @route   POST /api/ab-testing-suite-2/sessions/:sessionId/complete
// @desc    Complete A/B testing session
// @access  Private (Advisors only)
router.post('/sessions/:sessionId/complete', validateCompleteSession, completeSession);

// @route   POST /api/ab-testing-suite-2/sessions/:sessionId/notes
// @desc    Add note to session
// @access  Private (Advisors only)
router.post('/sessions/:sessionId/notes', validateSessionNote, addSessionNote);

// @route   POST /api/ab-testing-suite-2/sessions/:sessionId/export
// @desc    Export session data
// @access  Private (Advisors only)
router.post('/sessions/:sessionId/export', validateExportSession, exportSession);

// @route   DELETE /api/ab-testing-suite-2/sessions/:sessionId
// @desc    Archive/delete session
// @access  Private (Advisors only)
router.delete('/sessions/:sessionId', [
  param('sessionId').notEmpty().withMessage('Session ID is required')
], deleteSession);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'A/B Testing Suite 2 API is healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Get analytics/statistics for advisor
router.get('/analytics', [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Invalid period'),
  query('clientId').optional().isMongoId().withMessage('Valid client ID is required')
], async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const { period = 'month', clientId } = req.query;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    const matchQuery = {
      advisorId,
      sessionStartTime: { $gte: startDate }
    };
    
    if (clientId) {
      matchQuery.clientId = clientId;
    }
    
    const ABTestSession = require('../models/ABTestSession');
    
    // Aggregate analytics data
    const analytics = await ABTestSession.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgSessionDuration: { $avg: '$sessionDurationMinutes' },
          totalClients: { $addToSet: '$clientId' },
          avgScenariosPerSession: { $avg: { $size: '$scenarios' } },
          mostCommonRiskCategory: { $first: '$riskProfile.calculatedRiskScore.riskCategory' }
        }
      },
      {
        $project: {
          _id: 0,
          totalSessions: 1,
          completedSessions: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completedSessions', '$totalSessions'] },
              100
            ]
          },
          avgSessionDuration: { $round: ['$avgSessionDuration', 1] },
          uniqueClients: { $size: '$totalClients' },
          avgScenariosPerSession: { $round: ['$avgScenariosPerSession', 1] },
          mostCommonRiskCategory: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      analytics: analytics[0] || {
        totalSessions: 0,
        completedSessions: 0,
        completionRate: 0,
        avgSessionDuration: 0,
        uniqueClients: 0,
        avgScenariosPerSession: 0,
        mostCommonRiskCategory: null
      },
      period,
      dateRange: {
        from: startDate,
        to: now
      }
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('A/B Testing Suite 2 API Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in A/B Testing Suite 2',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

module.exports = router;