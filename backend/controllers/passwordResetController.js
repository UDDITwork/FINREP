// File: backend/controllers/passwordResetController.js
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Advisor = require('../models/Advisor');
const PasswordResetToken = require('../models/PasswordResetToken');
const { createEmailTransporter, sendEmail, verifyEmailTransporter } = require('../utils/emailService');
const { logger, logAuth } = require('../utils/logger');

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const requestPasswordReset = async (req, res) => {
  const startTime = Date.now();
  const { email } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  try {
    // Log reset request attempt
    logAuth.passwordResetRequest(email, clientIp);

    // Validate email
    if (!email) {
      logAuth.passwordResetFailed(email || 'unknown', 'Missing email', clientIp);
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if advisor exists
    const advisor = await Advisor.findOne({ email: email.toLowerCase() });
    if (!advisor) {
      // Don't reveal if email exists or not for security
      logAuth.passwordResetFailed(email, 'Email not found', clientIp);
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Check if advisor account is active
    if (advisor.status !== 'active') {
      logAuth.passwordResetFailed(email, `Account status: ${advisor.status}`, clientIp);
      return res.status(400).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    // Invalidate any existing tokens for this advisor
    await PasswordResetToken.invalidateAdvisorTokens(advisor._id);

    // Create new password reset token
    const resetToken = new PasswordResetToken({
      advisor: advisor._id,
      email: email.toLowerCase(),
      requestedFrom: clientIp,
      userAgent: userAgent
    });

    await resetToken.save();

    // Generate reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken.token}`;

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(advisor, resetUrl, resetToken.expiresAt);

    if (!emailResult.success) {
      logger.error('Failed to send password reset email:', {
        email: advisor.email,
        error: emailResult.error,
        tokenId: resetToken._id
      });

      // Delete the token if email failed
      await PasswordResetToken.findByIdAndDelete(resetToken._id);

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    const duration = Date.now() - startTime;
    logAuth.passwordResetEmailSent(email, advisor._id, clientIp);

    logger.info('Password reset email sent successfully', {
      email: advisor.email,
      advisorId: advisor._id,
      tokenId: resetToken._id,
      duration
    });

    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
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

// @desc    Verify reset token
// @route   GET /api/auth/verify-reset-token/:token
// @access  Public
const verifyResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    // Find the reset token
    const resetToken = await PasswordResetToken.findOne({ token }).populate('advisor', 'firstName lastName email');

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Check if token is valid
    if (!resetToken.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired or has already been used'
      });
    }

    // Check if advisor still exists and is active
    if (!resetToken.advisor || resetToken.advisor.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Account is no longer active'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        email: resetToken.email,
        advisorName: `${resetToken.advisor.firstName} ${resetToken.advisor.lastName}`,
        expiresAt: resetToken.expiresAt
      }
    });

  } catch (error) {
    logger.error('Token verification failed:', {
      error: error.message,
      token,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the token'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const startTime = Date.now();
  const { token, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  try {
    // Validate input
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Find the reset token
    const resetToken = await PasswordResetToken.findOne({ token }).populate('advisor');

    if (!resetToken) {
      logAuth.passwordResetFailed('unknown', 'Invalid token', clientIp);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Check if token is valid
    if (!resetToken.isValid) {
      logAuth.passwordResetFailed(resetToken.email, 'Token expired or used', clientIp);
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired or has already been used'
      });
    }

    // Check if advisor still exists and is active
    if (!resetToken.advisor || resetToken.advisor.status !== 'active') {
      logAuth.passwordResetFailed(resetToken.email, 'Account inactive', clientIp);
      return res.status(400).json({
        success: false,
        message: 'Account is no longer active'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, number and special character'
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update advisor password
    resetToken.advisor.password = hashedPassword;
    await resetToken.advisor.save();

    // Mark token as used
    resetToken.used = true;
    resetToken.usedAt = new Date();
    await resetToken.save();

    // Invalidate all other tokens for this advisor
    await PasswordResetToken.invalidateAdvisorTokens(resetToken.advisor._id);

    const duration = Date.now() - startTime;
    logAuth.passwordResetSuccess(resetToken.email, resetToken.advisor._id, clientIp);

    logger.info('Password reset completed successfully', {
      email: resetToken.email,
      advisorId: resetToken.advisor._id,
      tokenId: resetToken._id,
      duration
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Password reset failed:', {
      error: error.message,
      token,
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

// Helper function to send password reset email
const sendPasswordResetEmail = async (advisor, resetUrl, expiresAt) => {
  try {
    logger.info('📧 [PASSWORD_RESET] Starting email send process', {
      advisorEmail: advisor.email,
      advisorName: `${advisor.firstName} ${advisor.lastName}`
    });

    // Create and verify email transporter
    const transporter = createEmailTransporter();
    
    // Verify email configuration before sending
    const isVerified = await verifyEmailTransporter(transporter);
    if (!isVerified) {
      logger.error('❌ [PASSWORD_RESET] Email transporter verification failed');
      return {
        success: false,
        error: 'Email service configuration error'
      };
    }

    // Generate email template
    const emailTemplate = getPasswordResetEmailTemplate(
      advisor,
      resetUrl,
      expiresAt
    );
    
    // Prepare email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: advisor.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };

    // Send email
    const result = await sendEmail(transporter, mailOptions);
    
    if (result.success) {
      logger.info('✅ [PASSWORD_RESET] Password reset email sent successfully', {
        messageId: result.messageId,
        advisorEmail: advisor.email
      });
      return { success: true, messageId: result.messageId };
    } else {
      logger.error('❌ [PASSWORD_RESET] Email send failed', {
        error: result.error,
        advisorEmail: advisor.email
      });
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    logger.error('❌ [PASSWORD_RESET] Failed to send password reset email', {
      error: error.message,
      stack: error.stack,
      advisorEmail: advisor.email
    });
    return { success: false, error: error.message };
  }
};

// Email template for password reset
const getPasswordResetEmailTemplate = (advisor, resetUrl, expiresAt) => {
  const advisorName = `${advisor.firstName} ${advisor.lastName}`;
  const expiryTime = new Date(expiresAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    subject: 'Reset Your Richie AI Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Richie AI</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Password Reset Request</p>
        </div>
        
        <div style="padding: 40px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${advisorName},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your Richie AI account. If you didn't make this request, you can safely ignore this email.
          </p>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Security Notice:</strong> This password reset link will expire in 1 hour for your security.
            </p>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
              Reset My Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
            <strong>Link expires:</strong> ${expiryTime}
          </p>
          
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
            If the button above doesn't work, copy and paste this link into your browser:
          </p>
          
          <p style="color: #667eea; font-size: 14px; word-break: break-all; background-color: #f8f9fa; padding: 15px; border-radius: 4px;">
            ${resetUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <div style="color: #666; font-size: 12px;">
            <p><strong>Security Tips:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Never share your password with anyone</li>
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication if available</li>
              <li>Keep your email account secure</li>
            </ul>
            
            <p style="margin-top: 20px;">
              If you have any questions or concerns, please contact our support team.
            </p>
            
            <p style="margin-top: 20px; font-style: italic;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">© 2024 Richie AI. All rights reserved.</p>
        </div>
      </div>
    `
  };
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
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character')
];

module.exports = {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  validateForgotPassword,
  validateResetPassword
};
