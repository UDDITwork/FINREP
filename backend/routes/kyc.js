/**
 * FILE LOCATION: backend/routes/kyc.js
 * 
 * PURPOSE: Express router for KYC verification API endpoints
 * 
 * FUNCTIONALITY:
 * - Defines REST API routes for KYC verification operations
 * - Applies authentication middleware to protected endpoints
 * - Routes requests to appropriate controller methods
 * - Handles webhook endpoint without authentication (Digio requirement)
 * 
 * API ROUTES DEFINED:
 * - GET /api/kyc/clients: Get advisor's clients for KYC selection
 * - GET /api/kyc/status/:clientId: Get KYC status for specific client
 * - POST /api/kyc/workflow/:clientId: Start KYC verification workflow
 * - POST /api/kyc/reset/:clientId: Reset KYC verification status
 * - POST /api/kyc/webhook: Receive Digio webhook notifications
 * 
 * MIDDLEWARE APPLIED:
 * - auth middleware: Protects all endpoints except webhook
 * - JWT token validation for advisor authentication
 * - Multi-tenant access control (advisors see only their clients)
 * 
 * CONNECTIVITY:
 * - Receives: HTTP requests from frontend components
 * - Routes: Requests to appropriate controller methods
 * - Sends: HTTP responses with KYC data and status
 * - Integrates: With authentication middleware for security
 * 
 * DATA FLOW:
 * - Frontend sends authenticated requests to KYC endpoints
 * - Routes validate authentication and forward to controllers
 * - Controllers process business logic and return responses
 * - Webhook endpoint receives real-time updates from Digio
 * 
 * SECURITY CONSIDERATIONS:
 * - All endpoints except webhook require valid JWT token
 * - Webhook endpoint accessible without auth (Digio requirement)
 * - Authentication middleware ensures advisor identity verification
 * - Routes don't contain business logic (delegated to controllers)
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
