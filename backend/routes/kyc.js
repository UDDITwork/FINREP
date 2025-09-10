/**
 * FILE LOCATION: backend/routes/kyc.js
 * 
 * PURPOSE: Express router for KYC verification API endpoints
 * 
 * FUNCTIONALITY:
 * - Defines REST API routes for KYC verification operations
 * - Applies authentication middleware to protected endpoints
 * - Routes requests to appropriate controller methods
 * 
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getClientsForKYC,
  getKYCStatus,
  startKYCWorkflow,
  resetKYCVerification,
  handleWebhook,
  checkKYCStatusManually
} = require('../controllers/kycController');

// Get all clients for KYC verification (advisor's clients)
router.get('/clients', auth, getClientsForKYC);

// Get KYC status for a specific client
router.get('/status/:clientId', auth, getKYCStatus);

// Start KYC workflow for a client
router.post('/workflow/:clientId', auth, startKYCWorkflow);

// Reset KYC verification for a client
router.post('/reset/:clientId', auth, resetKYCVerification);

// Manual status check (simplified approach without webhooks)
router.get('/check-status/:clientId', auth, checkKYCStatusManually);

// Webhook endpoint for Digio notifications (optional - can be disabled)
router.post('/webhook', handleWebhook);

module.exports = router;
