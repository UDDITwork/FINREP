/**
 * FILE LOCATION: backend/routes/billing.js
 * 
 * Billing routes for handling subscription and payment operations.
 * All routes require authentication and are protected by middleware.
 */

const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { auth: authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/billing/subscription-status
 * @desc    Get subscription status for the authenticated advisor
 * @access  Private
 */
router.get('/subscription-status', billingController.getSubscriptionStatus);

/**
 * @route   POST /api/billing/create-payment
 * @desc    Create a new payment order
 * @access  Private
 */
router.post('/create-payment', billingController.createPayment);

/**
 * @route   GET /api/billing/check-payment-status/:orderSlug
 * @desc    Check payment status for a specific order
 * @access  Private
 */
router.get('/check-payment-status/:orderSlug', billingController.checkPaymentStatus);

/**
 * @route   GET /api/billing/payment-history
 * @desc    Get payment history for the authenticated advisor
 * @access  Private
 */
router.get('/payment-history', billingController.getPaymentHistory);

/**
 * @route   POST /api/billing/webhook
 * @desc    SMEPay webhook handler (no authentication required)
 * @access  Public
 */
router.post('/webhook', billingController.webhookHandler);

/**
 * @route   POST /api/billing/cancel-subscription
 * @desc    Cancel the advisor's subscription
 * @access  Private
 */
router.post('/cancel-subscription', billingController.cancelSubscription);

/**
 * @route   GET /api/billing/stats
 * @desc    Get billing statistics for the authenticated advisor
 * @access  Private
 */
router.get('/stats', billingController.getBillingStats);

module.exports = router;
