// Location: backend/routes/casManagement.js

const express = require('express');
const router = express.Router();
const CASManagementController = require('../controllers/casManagementController');
const auth = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Apply authentication middleware to all routes
router.use(auth);

// Log all CAS management requests
router.use((req, res, next) => {
  logger.info('📋 [CAS Management Routes] Request received', {
    method: req.method,
    path: req.path,
    advisorId: req.advisor?.id
  });
  next();
});

/**
 * GET /api/cas-management/summary
 * Get CAS summary statistics for the advisor
 */
router.get('/summary', (req, res, next) => {
  logger.info('📈 [CAS Management Routes] Get CAS summary request', {
    advisorId: req.advisor?.id
  });
  next();
}, CASManagementController.getAdvisorCASSummary);

/**
 * GET /api/cas-management/clients
 * Get all clients of the advisor who have CAS data
 */
router.get('/clients', (req, res, next) => {
  logger.info('📋 [CAS Management Routes] Get clients with CAS request', {
    advisorId: req.advisor?.id
  });
  next();
}, CASManagementController.getAdvisorClientsWithCAS);

/**
 * GET /api/cas-management/clients/:clientId
 * Get detailed CAS information for a specific client
 */
router.get('/clients/:clientId', (req, res, next) => {
  logger.info('📊 [CAS Management Routes] Get client CAS details request', {
    advisorId: req.advisor?.id,
    clientId: req.params.clientId
  });
  next();
}, CASManagementController.getClientCASDetails);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CAS Management service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
