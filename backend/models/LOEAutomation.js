/**
 * FILE LOCATION: backend/models/LOEAutomation.js
 * 
 * PURPOSE: Simplified LOE Automation model for quick LOE creation and sending
 * 
 * FUNCTIONALITY: Create and manage LOEs without meeting dependencies
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const LOEAutomationSchema = new mongoose.Schema({
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'signed', 'expired'],
    default: 'draft'
  },
  accessToken: {
    type: String,
    unique: true,
    sparse: true
  },
  clientAccessUrl: {
    type: String
  },
  content: {
    customNotes: {
      type: String,
      default: ''
    },
    services: {
      type: [String],
      default: [
        'Comprehensive Financial Planning and Analysis',
        'Investment Advisory and Portfolio Management',
        'Risk Assessment and Management Strategies',
        'Retirement Planning and Wealth Preservation',
        'Tax-Efficient Investment Strategies',
        'Regular Portfolio Reviews and Rebalancing'
      ]
    },
    fees: {
      type: [String],
      default: [
        'Initial Financial Planning Fee: $5,000',
        'Ongoing Advisory Fee: 1% of assets under management',
        'Reduced fee of 0.75% for assets above $1,000,000',
        'Quarterly billing in advance'
      ]
    }
  },
  signatures: {
    client: {
      data: String,
      signedAt: Date,
      ipAddress: String,
      userAgent: String
    }
  },
  sentAt: Date,
  viewedAt: Date,
  signedAt: Date,
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from creation
    }
  },
  signedPdfUrl: String
}, {
  timestamps: true
});

// Generate access token before saving
LOEAutomationSchema.pre('save', function(next) {
  if (!this.accessToken) {
    this.accessToken = crypto.randomBytes(32).toString('hex');
    this.clientAccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/loe-automation/sign/${this.accessToken}`;
  }
  next();
});

// Static method to find LOE by access token
LOEAutomationSchema.statics.findByToken = function(token) {
  return this.findOne({ accessToken: token })
    .populate('advisorId', 'firstName lastName email phone firmName');
};

// Instance method to mark as sent
LOEAutomationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

// Instance method to mark as viewed
LOEAutomationSchema.methods.markAsViewed = function(ipAddress, userAgent) {
  if (this.status === 'sent') {
    this.status = 'viewed';
    this.viewedAt = new Date();
  }
  return this.save();
};

// Instance method to save signature
LOEAutomationSchema.methods.saveSignature = function(signatureData, ipAddress, userAgent) {
  this.signatures.client = {
    data: signatureData,
    signedAt: new Date(),
    ipAddress: ipAddress,
    userAgent: userAgent
  };
  this.status = 'signed';
  this.signedAt = new Date();
  return this.save();
};

// Check if LOE is expired
LOEAutomationSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

module.exports = mongoose.model('LOEAutomation', LOEAutomationSchema);
