/**
 * FILE LOCATION: backend/models/MutualFundRecommend.js
 * 
 * PURPOSE: Mongoose model for storing mutual fund recommendations
 * 
 * FUNCTIONALITY:
 * - Defines schema for mutual fund recommendations by advisors
 * - Stores advisor input details (fund name, fund house, SIP amount, etc.)
 * - Stores Claude AI API responses with fund details
 * - Links recommendations to specific clients and advisors
 * - Tracks recommendation status and history
 * 
 * DATA STRUCTURE:
 * - Basic recommendation details (fund name, fund house, SIP amount)
 * - Investment parameters (start date, exit date, exit conditions)
 * - Risk profile and investment goals
 * - Claude AI response data (AUM, NAV, returns, holdings, etc.)
 * - Status tracking and audit trail
 * 
 * RELATIONSHIPS:
 * - Links to Client model via clientId
 * - Links to Advisor model via advisorId
 * - Tracks recommendation history and updates
 * 
 * VALIDATION:
 * - Required fields for essential recommendation components
 * - Date validation for SIP and exit dates
 * - Numeric validation for amounts and percentages
 * - Enum validation for risk profiles and investment goals
 * 
 * INDEXING:
 * - Client ID for efficient client-based queries
 * - Advisor ID for advisor-specific access
 * - Fund name for fund-specific searches
 * - Created date for chronological ordering
 */

const mongoose = require('mongoose');

const mutualFundRecommendSchema = new mongoose.Schema({
  // Primary identification
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: true,
    index: true
  },
  
  // Advisor Input Fields
  fundName: {
    type: String,
    required: true,
    trim: true
  },
  fundHouseName: {
    type: String,
    required: true,
    trim: true
  },
  recommendedMonthlySIP: {
    type: Number,
    required: true,
    min: 100
  },
  sipStartDate: {
    type: Date,
    required: true
  },
  expectedExitDate: {
    type: Date,
    required: true
  },
  exitConditions: {
    type: String,
    required: true,
    trim: true
  },
  reasonForRecommendation: {
    type: String,
    required: true,
    trim: true
  },
  riskProfile: {
    type: String,
    enum: ['Conservative', 'Moderate', 'Aggressive'],
    required: true
  },
  investmentGoal: {
    type: String,
    enum: ['Wealth Creation', 'Retirement', 'Child Education', 'Emergency Fund', 'Other Reason'],
    required: true
  },
  
  // Claude AI Response Fields
  claudeResponse: {
    category: String,
    launchDate: String,
    aum: String,
    latestNAV: String,
    navDate: String,
    fundManagers: [String],
    benchmark: String,
    risk: String,
    returns: {
      oneYear: String,
      threeYear: String,
      fiveYear: String
    },
    topHoldings: [String],
    topSectors: [String],
    minInvestment: {
      lumpsum: String,
      sip: String
    },
    exitLoad: String,
    expenseRatio: {
      direct: String,
      regular: String
    },
    tax: {
      stcg: String,
      ltcg: String
    },
    investmentObjective: String,
    suitableFor: String
  },
  
  // Status and tracking
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'on_hold'],
    default: 'active'
  },
  
  // Audit trail
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Additional metadata
  notes: String,
  tags: [String]
}, {
  timestamps: true
});

// Pre-save middleware to update updatedAt
mutualFundRecommendSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient querying
mutualFundRecommendSchema.index({ clientId: 1, createdAt: -1 });
mutualFundRecommendSchema.index({ advisorId: 1, createdAt: -1 });
mutualFundRecommendSchema.index({ fundName: 1, fundHouseName: 1 });

// Virtual for calculating SIP duration
mutualFundRecommendSchema.virtual('sipDuration').get(function() {
  if (this.sipStartDate && this.expectedExitDate) {
    const start = new Date(this.sipStartDate);
    const exit = new Date(this.expectedExitDate);
    const diffTime = Math.abs(exit - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return { years, months, totalDays: diffDays };
  }
  return null;
});

// Method to get formatted recommendation summary
mutualFundRecommendSchema.methods.getSummary = function() {
  return {
    id: this._id,
    fundName: this.fundName,
    fundHouseName: this.fundHouseName,
    monthlySIP: this.recommendedMonthlySIP,
    riskProfile: this.riskProfile,
    investmentGoal: this.investmentGoal,
    status: this.status,
    createdAt: this.createdAt,
    sipDuration: this.sipDuration
  };
};

const MutualFundRecommend = mongoose.model('MutualFundRecommend', mutualFundRecommendSchema);

module.exports = MutualFundRecommend;
