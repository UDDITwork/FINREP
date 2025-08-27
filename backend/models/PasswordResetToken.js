// File: backend/models/PasswordResetToken.js
const mongoose = require('mongoose');
const crypto = require('crypto');
const { logger, logDatabase } = require('../utils/logger');

const passwordResetTokenSchema = new mongoose.Schema({
  // Advisor reference
  advisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: [true, 'Advisor reference is required']
  },

  // Email for verification
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },

  // Secure reset token
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true,
    index: true
  },

  // Token expiry
  expiresAt: {
    type: Date,
    required: [true, 'Expiry date is required'],
    index: true
  },

  // Usage tracking
  used: {
    type: Boolean,
    default: false
  },

  usedAt: {
    type: Date
  },

  // IP address for security tracking
  requestedFrom: {
    type: String
  },

  // User agent for security tracking
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for performance and cleanup
passwordResetTokenSchema.index({ token: 1 }, { unique: true });
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
passwordResetTokenSchema.index({ advisor: 1, used: 1 });

// Generate secure token and set expiry before saving
passwordResetTokenSchema.pre('save', function(next) {
  const startTime = Date.now();
  
  // Generate secure token if not provided
  if (this.isNew && !this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  
  // Set expiry if not set (default 1 hour)
  if (this.isNew && !this.expiresAt) {
    const expiryHours = process.env.PASSWORD_RESET_EXPIRY_HOURS || 1;
    this.expiresAt = new Date(Date.now() + (expiryHours * 60 * 60 * 1000));
  }
  
  // Log the operation
  const isNew = this.isNew;
  const operation = isNew ? 'create' : 'update';
  const tokenId = this._id || 'new';
  
  logger.debug(`DB Operation started: PasswordResetToken.${operation} for ID: ${tokenId}`);
  
  // Store start time for post middleware
  this._startTime = startTime;
  
  next();
});

// Virtual for checking if token is expired
passwordResetTokenSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual for checking if token is valid (not expired and not used)
passwordResetTokenSchema.virtual('isValid').get(function() {
  return !this.isExpired && !this.used;
});

// Mongoose middleware for logging database operations
passwordResetTokenSchema.post('save', function(doc, next) {
  const duration = Date.now() - this._startTime;
  const operation = doc.isNew ? 'create' : 'update';
  
  logDatabase.queryExecution('PasswordResetToken', operation, duration);
  logger.info(`DB Operation completed: PasswordResetToken.${operation} for ID: ${doc._id} in ${duration}ms`);
  
  next();
});

passwordResetTokenSchema.post('save', function(error, doc, next) {
  if (error) {
    logDatabase.operationError('PasswordResetToken.save', error);
    logger.error(`DB Operation failed: PasswordResetToken.save for ID: ${doc?._id || 'unknown'} - ${error.message}`);
  }
  next(error);
});

// Log find operations
passwordResetTokenSchema.pre(/^find/, function() {
  this._startTime = Date.now();
  logger.debug(`DB Operation started: PasswordResetToken.${this.getOptions().op || 'find'}`);
});

passwordResetTokenSchema.post(/^find/, function(result) {
  const duration = Date.now() - this._startTime;
  const operation = this.getOptions().op || 'find';
  const resultCount = Array.isArray(result) ? result.length : (result ? 1 : 0);
  
  logDatabase.queryExecution('PasswordResetToken', operation, duration);
  logger.debug(`DB Operation completed: PasswordResetToken.${operation} returned ${resultCount} document(s) in ${duration}ms`);
});

passwordResetTokenSchema.post(/^find/, function(error, result, next) {
  if (error) {
    const operation = this.getOptions().op || 'find';
    logDatabase.operationError(`PasswordResetToken.${operation}`, error);
    logger.error(`DB Operation failed: PasswordResetToken.${operation} - ${error.message}`);
  }
  if (next) next(error);
});

// Log remove operations
passwordResetTokenSchema.pre('remove', function() {
  this._startTime = Date.now();
  logger.debug(`DB Operation started: PasswordResetToken.remove for ID: ${this._id}`);
});

passwordResetTokenSchema.post('remove', function(doc) {
  const duration = Date.now() - this._startTime;
  logDatabase.queryExecution('PasswordResetToken', 'remove', duration);
  logger.info(`DB Operation completed: PasswordResetToken.remove for ID: ${doc._id} in ${duration}ms`);
});

// Static method to clean up expired tokens
passwordResetTokenSchema.statics.cleanupExpiredTokens = async function() {
  try {
    const result = await this.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    logger.info(`Cleaned up ${result.deletedCount} expired password reset tokens`);
    return result.deletedCount;
  } catch (error) {
    logger.error('Failed to cleanup expired password reset tokens:', error);
    throw error;
  }
};

// Static method to invalidate all tokens for an advisor
passwordResetTokenSchema.statics.invalidateAdvisorTokens = async function(advisorId) {
  try {
    const result = await this.updateMany(
      { advisor: advisorId, used: false },
      { used: true, usedAt: new Date() }
    );
    
    logger.info(`Invalidated ${result.modifiedCount} password reset tokens for advisor: ${advisorId}`);
    return result.modifiedCount;
  } catch (error) {
    logger.error('Failed to invalidate advisor tokens:', error);
    throw error;
  }
};

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
