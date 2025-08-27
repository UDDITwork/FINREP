/**
 * FILE LOCATION: backend/models/Payment.js
 * 
 * Payment model for storing payment transaction data.
 * Tracks payment history, status, and SMEPay integration details.
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Advisor reference
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Subscription reference
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },

  // Payment details
  amount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: 'INR'
  },

  plan: {
    type: String,
    required: true
  },

  // SMEPay integration details
  smepayOrderId: {
    type: String,
    required: true,
    unique: true
  },

  smepayOrderSlug: {
    type: String,
    required: true
  },

  smepayRefId: {
    type: String,
    default: null
  },

  // Payment status
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },

  // Customer details
  customerDetails: {
    name: String,
    email: String,
    mobile: String
  },

  // Payment method
  paymentMethod: {
    type: String,
    default: 'UPI'
  },

  // Transaction details
  transactionId: {
    type: String,
    default: null
  },

  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },

  completedAt: {
    type: Date,
    default: null
  },

  // Error tracking
  errorMessage: {
    type: String,
    default: null
  },

  // Retry tracking
  retryCount: {
    type: Number,
    default: 0
  },

  lastRetryAt: {
    type: Date,
    default: null
  },

  // Webhook tracking
  webhookReceived: {
    type: Boolean,
    default: false
  },

  webhookData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
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

// Indexes for efficient queries
paymentSchema.index({ advisorId: 1, status: 1 });
paymentSchema.index({ smepayOrderId: 1 });
paymentSchema.index({ smepayOrderSlug: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, initiatedAt: 1 });

// Virtual for payment duration
paymentSchema.virtual('duration').get(function() {
  if (!this.completedAt) return null;
  return this.completedAt - this.initiatedAt;
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toLocaleString('en-IN')}`;
});

// Method to mark payment as successful
paymentSchema.methods.markSuccess = function(transactionId = null) {
  this.status = 'success';
  this.completedAt = new Date();
  if (transactionId) {
    this.transactionId = transactionId;
  }
  return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markFailed = function(errorMessage = null) {
  this.status = 'failed';
  this.completedAt = new Date();
  if (errorMessage) {
    this.errorMessage = errorMessage;
  }
  return this.save();
};

// Method to increment retry count
paymentSchema.methods.incrementRetry = function() {
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  return this.save();
};

// Method to update webhook data
paymentSchema.methods.updateWebhookData = function(webhookData) {
  this.webhookReceived = true;
  this.webhookData = webhookData;
  return this.save();
};

// Static method to find pending payments
paymentSchema.statics.findPending = function() {
  return this.find({
    status: 'pending',
    initiatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  });
};

// Static method to find payments by advisor
paymentSchema.statics.findByAdvisor = function(advisorId, limit = 10) {
  return this.find({ advisorId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('subscriptionId');
};

// Static method to find payment by SMEPay order slug
paymentSchema.statics.findByOrderSlug = function(orderSlug) {
  return this.findOne({ smepayOrderSlug: orderSlug });
};

// Static method to get payment statistics
paymentSchema.statics.getStats = function(advisorId) {
  return this.aggregate([
    { $match: { advisorId: mongoose.Types.ObjectId(advisorId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);
