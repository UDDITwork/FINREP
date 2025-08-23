// File: backend/routes/vaultRoutes.js
const express = require('express');
const router = express.Router();
const { auth: authenticateToken } = require('../middleware/auth');
const {
  getVaultData,
  updateVaultData,
  addCertification,
  updateCertification,
  deleteCertification,
  addMembership,
  updateMembership,
  deleteMembership
} = require('../controllers/vaultController');

// Apply authentication to all vault routes
router.use(authenticateToken);

// ============================================================================
// VAULT DATA ROUTES
// ============================================================================

/**
 * Get vault data for advisor
 * GET /api/vault
 */
router.get('/', getVaultData);

/**
 * Update vault data
 * PUT /api/vault
 */
router.put('/', updateVaultData);

// ============================================================================
// CERTIFICATION ROUTES
// ============================================================================

/**
 * Add new certification
 * POST /api/vault/certifications
 */
router.post('/certifications', addCertification);

/**
 * Update certification
 * PUT /api/vault/certifications/:certId
 */
router.put('/certifications/:certId', updateCertification);

/**
 * Delete certification
 * DELETE /api/vault/certifications/:certId
 */
router.delete('/certifications/:certId', deleteCertification);

// ============================================================================
// MEMBERSHIP ROUTES
// ============================================================================

/**
 * Add new membership
 * POST /api/vault/memberships
 */
router.post('/memberships', addMembership);

/**
 * Update membership
 * PUT /api/vault/memberships/:membershipId
 */
router.put('/memberships/:membershipId', updateMembership);

/**
 * Delete membership
 * DELETE /api/vault/memberships/:membershipId
 */
router.delete('/memberships/:membershipId', deleteMembership);

module.exports = router;
