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
  handleWebhook
} = require('../controllers/kycController');

// Get all clients for KYC verification (advisor's clients)
router.get('/clients', auth, getClientsForKYC);

// Get KYC status for a specific client
router.get('/status/:clientId', auth, getKYCStatus);

// Start KYC workflow for a client
router.post('/workflow/:clientId', auth, startKYCWorkflow);

// Reset KYC verification for a client
router.post('/reset/:clientId', auth, resetKYCVerification);

// Webhook endpoint for Digio notifications (no auth required for webhooks)
router.post('/webhook', handleWebhook);

module.exports = router;
