/**
 * FILE LOCATION: backend/models/KYCVerification.js
 * 
 * PURPOSE: MongoDB schema for storing KYC (Know Your Customer) verification data
 * 
 * FUNCTIONALITY:
 * - Defines the data structure for KYC verification records
 * - Stores verification status for both Aadhar and PAN documents
 * - Tracks Digio API request IDs and access tokens
 * - Maintains verification history and attempt counts
 * - Implements automatic overall status calculation
 * 
 * DATA STRUCTURE:
 * - clientId: Links to Client model (ObjectId)
 * - advisorId: Links to Advisor model (ObjectId) 
 * - aadharStatus: Enum ['not_started', 'requested', 'in_progress', 'verified', 'failed']
 * - panStatus: Enum ['not_started', 'requested', 'in_progress', 'verified', 'failed']
 * - overallStatus: Auto-calculated based on individual document statuses
 * - aadharVerificationId: Digio API request ID for Aadhar verification
 * - panVerificationId: Digio API request ID for PAN verification
 * - verificationAttempts: Count of verification attempts
 * - lastVerificationAttempt: Timestamp of last verification attempt
 * 
 * CONNECTIVITY:
 * - Connected to Client model via clientId reference
 * - Connected to Advisor model via advisorId reference
 * - Receives data from KYC controller operations
 * - Sends data to frontend via KYC API endpoints
 * 
 * API INTERACTIONS:
 * - Receives: Verification status updates from Digio webhooks
 * - Sends: KYC status data to frontend components
 * - Stores: Digio request IDs and access tokens for SDK integration
 * 
 * DATA FLOW:
 * 1. Controller creates/updates KYC records
 * 2. Webhook handler updates status from Digio events
 * 3. Frontend fetches status via API endpoints
 * 4. Status changes trigger automatic overall status recalculation
 */

const mongoose = require('mongoose');

const kycVerificationSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    unique: true
  },
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: true
  },
  aadharNumber: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        return !v || /^\d{12}$/.test(v);
      },
      message: 'Aadhar number must be 12 digits'
    }
  },
  aadharStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'not_started'],
    default: 'not_started'
  },
  aadharVerificationId: {
    type: String,
    required: false
  },
  aadharVerificationData: {
    type: Object,
    required: false
  },
  panNumber: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        return !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
      },
      message: 'PAN number must be in correct format (e.g., ABCDE1234F)'
    }
  },
  panStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'not_started'],
    default: 'not_started'
  },
  panVerificationId: {
    type: String,
    required: false
  },
  panVerificationData: {
    type: Object,
    required: false
  },
  overallStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'not_started'],
    default: 'not_started'
  },
  verificationAttempts: {
    aadhar: { type: Number, default: 0 },
    pan: { type: Number, default: 0 }
  },
  lastVerificationAttempt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
kycVerificationSchema.index({ clientId: 1, advisorId: 1 });
kycVerificationSchema.index({ overallStatus: 1 });

// Pre-save middleware to update overall status
kycVerificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update overall status based on individual document statuses
  if (this.aadharStatus === 'verified' && this.panStatus === 'verified') {
    this.overallStatus = 'verified';
  } else if (this.aadharStatus === 'failed' || this.panStatus === 'failed') {
    this.overallStatus = 'failed';
  } else if (this.aadharStatus === 'pending' || this.panStatus === 'pending') {
    this.overallStatus = 'pending';
  } else {
    this.overallStatus = 'not_started';
  }
  
  next();
});

module.exports = mongoose.model('KYCVerification', kycVerificationSchema);
