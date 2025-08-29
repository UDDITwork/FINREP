/**
 * FILE LOCATION: backend/routes/clientReports.js
 * 
 * PURPOSE: Routes for comprehensive client reports functionality
 * 
 * FUNCTIONALITY:
 * - GET /api/client-reports/vault - Get advisor vault data for header
 * - GET /api/client-reports/clients - Get client list for advisor
 * - GET /api/client-reports/clients/:clientId - Get comprehensive client report
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const { auth } = require('../middleware/auth');
const clientReportsController = require('../controllers/clientReportsController');

// Get advisor's vault data for header
router.get('/vault', auth, clientReportsController.getAdvisorVaultData);

// Get client list for advisor
router.get('/clients', auth, clientReportsController.getClientList);

// Get comprehensive client report
router.get('/clients/:clientId', auth, clientReportsController.getClientReport);

// Log route registration
logger.info('📋 [CLIENT REPORTS] Routes registered:');
logger.info('   • GET /api/client-reports/vault');
logger.info('   • GET /api/client-reports/clients');
logger.info('   • GET /api/client-reports/clients/:clientId');

module.exports = router;
