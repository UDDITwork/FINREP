// File: backend/routes/auth.js
const express = require('express');
const { auth, authRateLimit, logAPIUsage } = require('../middleware/auth');
const {
  registerAdvisor,
  loginAdvisor,
  getAdvisorProfile,
  updateAdvisorProfile,
  logoutAdvisor
} = require('../controllers/advisorController');
const {
  requestPasswordReset,
  resetPassword,
  validateForgotPassword,
  validateResetPassword
} = require('../controllers/simplePasswordResetController');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new advisor
// @access  Public
router.post('/register', authRateLimit(3, 15 * 60 * 1000), logAPIUsage, registerAdvisor);

// @route   POST /api/auth/login
// @desc    Login advisor
// @access  Public
router.post('/login', authRateLimit(5, 15 * 60 * 1000), logAPIUsage, loginAdvisor);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset (simple - no email verification)
// @access  Public
router.post('/forgot-password', authRateLimit(5, 60 * 60 * 1000), logAPIUsage, validateForgotPassword, requestPasswordReset);

// @route   POST /api/auth/reset-password
// @desc    Reset password (simple - no token verification)
// @access  Public
router.post('/reset-password', authRateLimit(5, 60 * 60 * 1000), logAPIUsage, validateResetPassword, resetPassword);

// @route   GET /api/auth/profile
// @desc    Get current advisor profile
// @access  Private
router.get('/profile', auth, logAPIUsage, getAdvisorProfile);

// @route   PUT /api/auth/profile
// @desc    Update advisor profile
// @access  Private
router.put('/profile', auth, logAPIUsage, updateAdvisorProfile);

// @route   POST /api/auth/logout
// @desc    Logout advisor
// @access  Private
router.post('/logout', auth, logAPIUsage, logoutAdvisor);

module.exports = router;