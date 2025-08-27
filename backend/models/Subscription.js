/**
 * FILE LOCATION: backend/models/Subscription.js
 * 
 * Subscription model for storing advisor subscription and payment data.
 * Handles subscription status, payment history, and billing information.
 * Includes 30-day free trial period support.
 */

const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // Advisor reference
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Subscription details
  plan: {
    type: String,
    required: true,
    enum: ['Monthly Professional', 'Yearly Professional', 'Enterprise'],
    default: 'Monthly Professional'
  },

  amount: {
    type: Number,
    required: true,
    default: 999
  },

  // Subscription status
  isActive: {
    type: Boolean,
    default: false
  },

  startDate: {
    type: Date,
    default: null
  },

  endDate: {
    type: Date,
    default: null
  },

  // Trial period tracking
  isTrialActive: {
    type: Boolean,
    default: true
  },

  trialStartDate: {
    type: Date,
    default: Date.now
  },

  trialEndDate: {
    type: Date,
    default: function() {
      // Set trial end date to 30 days from creation
      return new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));
    }
  },

  hasPaid: {
    type: Boolean,
    default: false
  },

  // Payment tracking
  lastPaymentDate: {
    type: Date,
    default: null
  },

  nextPaymentDate: {
    type: Date,
    default: null
  },

  // Auto-renewal settings
  autoRenew: {
    type: Boolean,
    default: true
  },

  // Status tracking
  status: {
    type: String,
    enum: ['trial', 'active', 'expired', 'cancelled', 'pending'],
    default: 'trial'
  },

  // Created and updated timestamps
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
subscriptionSchema.index({ advisorId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 'active' });
subscriptionSchema.index({ trialEndDate: 1, status: 'trial' });

// Virtual for checking if subscription is expired
subscriptionSchema.virtual('isExpired').get(function() {
  if (this.isTrialActive) {
    return new Date() > this.trialEndDate;
  }
  if (!this.endDate) return true;
  return new Date() > this.endDate;
});

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (this.isTrialActive) {
    const now = new Date();
    const end = new Date(this.trialEndDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  if (!this.endDate) return 0;
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for checking if trial is expired
subscriptionSchema.virtual('isTrialExpired').get(function() {
  if (!this.isTrialActive) return false;
  return new Date() > this.trialEndDate;
});

// Method to start trial period
subscriptionSchema.methods.startTrial = function() {
  this.isTrialActive = true;
  this.status = 'trial';
  this.isActive = true;
  this.trialStartDate = new Date();
  this.trialEndDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
  this.hasPaid = false;
  return this.save();
};

// Method to activate subscription after payment
subscriptionSchema.methods.activate = function() {
  this.isActive = true;
  this.isTrialActive = false;
  this.status = 'active';
  this.hasPaid = true;
  this.startDate = new Date();
  this.endDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
  this.lastPaymentDate = new Date();
  this.nextPaymentDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
  return this.save();
};

// Method to extend subscription
subscriptionSchema.methods.extend = function(days = 30) {
  const currentEndDate = this.endDate || new Date();
  this.endDate = new Date(currentEndDate.getTime() + (days * 24 * 60 * 60 * 1000));
  this.nextPaymentDate = new Date(this.endDate);
  this.lastPaymentDate = new Date();
  this.isActive = true;
  this.status = 'active';
  return this.save();
};

// Method to cancel subscription
subscriptionSchema.methods.cancel = function() {
  this.autoRenew = false;
  this.status = 'cancelled';
  return this.save();
};

// Static method to find active subscriptions (including trial)
subscriptionSchema.statics.findActiveByAdvisor = function(advisorId) {
  return this.findOne({
    advisorId,
    $or: [
      { status: 'active', endDate: { $gt: new Date() } },
      { status: 'trial', trialEndDate: { $gt: new Date() } }
    ]
  });
};

// Static method to find expired subscriptions
subscriptionSchema.statics.findExpired = function() {
  return this.find({
    $or: [
      { status: 'active', endDate: { $lte: new Date() } },
      { status: 'trial', trialEndDate: { $lte: new Date() } }
    ]
  });
};

// Static method to find subscriptions that need payment (trial expired)
subscriptionSchema.statics.findTrialExpired = function() {
  return this.find({
    status: 'trial',
    trialEndDate: { $lte: new Date() },
    hasPaid: false
  });
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
