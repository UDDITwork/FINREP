// File: backend/routes/clientInvitations.js
const express = require('express');
const router = express.Router();
const ClientInvitation = require('../models/ClientInvitation');
const auth = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Apply authentication middleware to all routes
router.use(auth);

// Get client invitation data by client ID
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = req.user.id;

    logger.info(`[ClientInvitations] Fetching invitation data for client: ${clientId} by advisor: ${advisorId}`);

    // Find client invitation by client ID and advisor
    const invitation = await ClientInvitation.findOne({
      clientData: clientId,
      advisor: advisorId
    }).populate('clientData', 'firstName lastName email phoneNumber');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Client invitation not found'
      });
    }

    // Return invitation data
    res.json({
      success: true,
      data: {
        clientEmail: invitation.clientEmail,
        clientFirstName: invitation.clientFirstName,
        clientLastName: invitation.clientLastName,
        status: invitation.status,
        sentAt: invitation.sentAt,
        openedAt: invitation.openedAt,
        completedAt: invitation.completedAt,
        expiresAt: invitation.expiresAt,
        casUploadData: invitation.casUploadData,
        casParsedData: invitation.casParsedData,
        invitationSource: invitation.invitationSource,
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt
      }
    });

  } catch (error) {
    logger.error(`[ClientInvitations] Error fetching client invitation: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client invitation data',
      error: error.message
    });
  }
});

// Get all client invitations for an advisor
router.get('/advisor/all', async (req, res) => {
  try {
    const advisorId = req.user.id;

    logger.info(`[ClientInvitations] Fetching all invitations for advisor: ${advisorId}`);

    const invitations = await ClientInvitation.find({
      advisor: advisorId
    }).populate('clientData', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: invitations,
      count: invitations.length
    });

  } catch (error) {
    logger.error(`[ClientInvitations] Error fetching advisor invitations: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client invitations',
      error: error.message
    });
  }
});

// Get client invitation by token (for client onboarding)
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    logger.info(`[ClientInvitations] Fetching invitation by token: ${token}`);

    const invitation = await ClientInvitation.findOne({
      token: token
    }).populate('advisor', 'firstName lastName email');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation token'
      });
    }

    // Check if invitation is expired
    if (invitation.isExpired) {
      return res.status(410).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    res.json({
      success: true,
      data: {
        clientEmail: invitation.clientEmail,
        clientFirstName: invitation.clientFirstName,
        clientLastName: invitation.clientLastName,
        advisor: invitation.advisor,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        timeRemaining: invitation.timeRemaining
      }
    });

  } catch (error) {
    logger.error(`[ClientInvitations] Error fetching invitation by token: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation',
      error: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Client Invitations API is healthy',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /api/client-invitations/client/:clientId',
      'GET /api/client-invitations/advisor/all',
      'GET /api/client-invitations/token/:token',
      'GET /api/client-invitations/health'
    ]
  });
});

module.exports = router;
