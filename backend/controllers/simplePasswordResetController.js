// File: backend/controllers/simplePasswordResetController.js
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Advisor = require('../models/Advisor');
const { logger, logAuth } = require('../utils/logger');

// @desc    Request password reset (simple - no email verification)
// @route   POST /api/auth/forgot-password
// @access  Public
const requestPasswordReset = async (req, res) => {
  const startTime = Date.now();
  const { email } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  console.log('\n🔍 [PASSWORD RESET DEBUG] ==========================================');
  console.log(`📧 Forgot Password Request - Email: ${email}`);
  console.log(`🌐 Client IP: ${clientIp}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  try {
    // Log reset request attempt
    logAuth.passwordResetRequest(email, clientIp);

    // Validate email
    if (!email) {
      console.log('❌ [DEBUG] Email validation failed: Missing email');
      logAuth.passwordResetFailed(email || 'unknown', 'Missing email', clientIp);
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log(`🔍 [DEBUG] Searching for advisor with email: ${email.toLowerCase()}`);

    // Check if advisor exists
    const advisor = await Advisor.findOne({ email: email.toLowerCase() });
    
    if (advisor) {
      console.log(`✅ [DEBUG] Advisor found: ${advisor.firstName} ${advisor.lastName} (ID: ${advisor._id})`);
      console.log(`📊 [DEBUG] Current status: ${advisor.status}`);
      
      // Update advisor with reset request flag
      advisor.passwordResetRequested = true;
      advisor.passwordResetAt = new Date();
      await advisor.save();

      console.log(`✅ [DEBUG] Database updated - passwordResetRequested: true, passwordResetAt: ${advisor.passwordResetAt}`);

      logAuth.passwordResetEmailSent(email, advisor._id, clientIp);
      
      logger.info('Password reset requested successfully', {
        email: advisor.email,
        advisorId: advisor._id,
        duration: Date.now() - startTime
      });

      console.log(`✅ [DEBUG] Password reset request processed successfully`);
    } else {
      console.log(`❌ [DEBUG] No advisor found with email: ${email}`);
      // Don't reveal if email exists or not for security
      logAuth.passwordResetFailed(email, 'Email not found', clientIp);
    }

    // Always return success message (don't reveal if email exists)
    console.log(`📤 [DEBUG] Sending response: Generic success message`);
    console.log('🔍 [PASSWORD RESET DEBUG] ==========================================\n');

    res.json({
      success: true,
      message: 'If an account with this email exists, you can proceed to reset your password.'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ [DEBUG] Error occurred: ${error.message}`);
    console.log(`⏱️ [DEBUG] Duration: ${duration}ms`);
    console.log('🔍 [PASSWORD RESET DEBUG] ==========================================\n');

    logger.error('Password reset request failed:', {
      error: error.message,
      email,
      clientIp,
      duration,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request. Please try again later.'
    });
  }
};

// @desc    Reset password (simple - no token verification)
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const startTime = Date.now();
  const { email, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  console.log('\n🔍 [PASSWORD RESET DEBUG] ==========================================');
  console.log(`📧 Reset Password Request - Email: ${email}`);
  console.log(`🔑 New Password: ${password ? '***' + password.slice(-4) : 'NOT PROVIDED'}`);
  console.log(`🌐 Client IP: ${clientIp}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  try {
    // Validate input
    if (!email || !password) {
      console.log('❌ [DEBUG] Validation failed: Missing email or password');
      console.log(`📧 Email provided: ${!!email}`);
      console.log(`🔑 Password provided: ${!!password}`);
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required'
      });
    }

    console.log(`🔍 [DEBUG] Searching for advisor with email: ${email.toLowerCase()}`);

    // Find advisor by email
    const advisor = await Advisor.findOne({ email: email.toLowerCase() });

    if (!advisor) {
      console.log(`❌ [DEBUG] No advisor found with email: ${email}`);
      logAuth.passwordResetFailed(email, 'Email not found', clientIp);
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    console.log(`✅ [DEBUG] Advisor found: ${advisor.firstName} ${advisor.lastName} (ID: ${advisor._id})`);
    console.log(`📊 [DEBUG] Current status: ${advisor.status}`);

    // Check if advisor account is active
    if (advisor.status !== 'active') {
      console.log(`❌ [DEBUG] Account not active: ${advisor.status}`);
      logAuth.passwordResetFailed(email, `Account status: ${advisor.status}`, clientIp);
      return res.status(400).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      console.log(`❌ [DEBUG] Password too short: ${password.length} characters`);
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    console.log(`✅ [DEBUG] Password length validation passed: ${password.length} characters`);

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      console.log(`❌ [DEBUG] Password complexity validation failed`);
      console.log(`🔍 [DEBUG] Password contains lowercase: ${/[a-z]/.test(password)}`);
      console.log(`🔍 [DEBUG] Password contains uppercase: ${/[A-Z]/.test(password)}`);
      console.log(`🔍 [DEBUG] Password contains number: ${/\d/.test(password)}`);
      console.log(`🔍 [DEBUG] Password contains special char: ${/[@$!%*?&]/.test(password)}`);
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, number and special character'
      });
    }

    console.log(`✅ [DEBUG] Password complexity validation passed`);

    // Hash the new password
    console.log(`🔐 [DEBUG] Hashing password with bcrypt (salt rounds: 12)`);
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(`✅ [DEBUG] Password hashed successfully`);
    console.log(`🔍 [DEBUG] Hash starts with: ${hashedPassword.substring(0, 20)}...`);

    // Update advisor password and clear reset flags
    console.log(`💾 [DEBUG] Updating database with new password and clearing reset flags`);
    const oldPasswordHash = advisor.password.substring(0, 20) + '...';
    
    advisor.password = hashedPassword;
    advisor.passwordResetRequested = false;
    advisor.passwordResetAt = null;
    await advisor.save();

    console.log(`✅ [DEBUG] Database updated successfully`);
    console.log(`🔍 [DEBUG] Old password hash: ${oldPasswordHash}`);
    console.log(`🔍 [DEBUG] New password hash: ${hashedPassword.substring(0, 20)}...`);
    console.log(`🔍 [DEBUG] passwordResetRequested: ${advisor.passwordResetRequested}`);
    console.log(`🔍 [DEBUG] passwordResetAt: ${advisor.passwordResetAt}`);

    const duration = Date.now() - startTime;
    logAuth.passwordResetSuccess(email, advisor._id, clientIp);

    logger.info('Password reset completed successfully', {
      email: advisor.email,
      advisorId: advisor._id,
      duration
    });

    console.log(`✅ [DEBUG] Password reset completed successfully in ${duration}ms`);
    console.log('🔍 [PASSWORD RESET DEBUG] ==========================================\n');

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ [DEBUG] Error occurred: ${error.message}`);
    console.log(`⏱️ [DEBUG] Duration: ${duration}ms`);
    console.log(`📋 [DEBUG] Stack trace: ${error.stack}`);
    console.log('🔍 [PASSWORD RESET DEBUG] ==========================================\n');

    logger.error('Password reset failed:', {
      error: error.message,
      email,
      clientIp,
      duration,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password. Please try again.'
    });
  }
};

// Validation middleware for forgot password
const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address')
];

// Validation middleware for reset password
const validateResetPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character')
];

module.exports = {
  requestPasswordReset,
  resetPassword,
  validateForgotPassword,
  validateResetPassword
};
