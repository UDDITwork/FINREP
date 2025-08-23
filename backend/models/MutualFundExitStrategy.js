/**
 * FILE LOCATION: backend/models/MutualFundExitStrategy.js
 * 
 * PURPOSE: Mongoose model for storing comprehensive mutual fund exit strategies
 * 
 * FUNCTIONALITY:
 * - Defines schema for detailed exit recommendations and analysis
 * - Stores primary exit analysis, timing strategy, and tax implications
 * - Tracks alternative investment strategies and financial goal assessment
 * - Maintains risk analysis, execution plans, and cost-benefit analysis
 * - Records advisor certification and client acknowledgments
 * 
 * DATA STRUCTURE:
 * - Primary exit analysis with fund details and exit rationale
 * - Timing strategy with market conditions and exit triggers
 * - Tax implications and optimization strategies
 * - Alternative investment recommendations and portfolio rebalancing
 * - Financial goal assessment and impact analysis
 * - Risk analysis and mitigation strategies
 * - Execution action plan with step-by-step guidance
 * - Cost-benefit analysis with fee calculations
 * - Advisor certification and client acknowledgment tracking
 * 
 * RELATIONSHIPS:
 * - Links to Client model via clientId
 * - Links to Advisor model via advisorId
 * - References specific mutual fund via fundId
 * - Tracks CAS source and financial plan recommendations
 * 
 * VALIDATION:
 * - Required fields for essential strategy components
 * - Date validation for exit timing and execution
 * - Numeric validation for amounts and percentages
 * - Status validation for workflow states
 * 
 * INDEXING:
 * - Client ID for efficient client-based queries
 * - Advisor ID for advisor-specific access
 * - Fund ID for fund-specific strategies
 * - Status for workflow management
 * - Created date for chronological ordering
 */

const mongoose = require('mongoose');

const mutualFundExitStrategySchema = new mongoose.Schema({
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
  fundId: {
    type: String,
    required: true,
    index: true
  },
  fundName: {
    type: String,
    required: true
  },
  fundCategory: {
    type: String,
    required: true
  },
  fundType: {
    type: String,
    enum: ['existing', 'recommended'],
    required: true
  },
  source: {
    type: String,
    enum: ['cas', 'financial_plan'],
    required: true
  },

  // Primary Exit Analysis
  primaryExitAnalysis: {
    currentValue: {
      type: Number,
      required: true
    },
    units: {
      type: Number,
      required: true
    },
    nav: {
      type: Number,
      required: true
    },
    exitRationale: {
      type: String,
      required: true,
      enum: ['underperformance', 'goal_achievement', 'rebalancing', 'risk_adjustment', 'liquidity_needs', 'other']
    },
    detailedReason: {
      type: String,
      required: true
    },
    performanceAnalysis: {
      type: String,
      required: true
    }
  },

  // Timing Strategy
  timingStrategy: {
    recommendedExitDate: {
      type: Date,
      required: true
    },
    marketConditions: {
      type: String,
      required: true
    },
    exitTriggers: [{
      type: String,
      enum: ['target_achieved', 'stop_loss', 'time_based', 'market_condition', 'fund_performance', 'other']
    }],
    urgency: {
      type: String,
      enum: ['immediate', 'short_term', 'medium_term', 'long_term'],
      required: true
    }
  },

  // Tax Implications
  taxImplications: {
    holdingPeriod: {
      type: String,
      enum: ['short_term', 'long_term'],
      required: true
    },
    taxRate: {
      type: Number,
      required: true
    },
    taxAmount: {
      type: Number,
      required: true
    },
    taxOptimization: {
      type: String,
      required: true
    },
    lossHarvesting: {
      type: Boolean,
      default: false
    }
  },

  // Alternative Investment Strategy
  alternativeInvestmentStrategy: {
    recommendedFunds: [{
      fundName: String,
      fundCategory: String,
      allocation: Number,
      rationale: String
    }],
    portfolioRebalancing: {
      type: String,
      required: true
    },
    riskAdjustment: {
      type: String,
      required: true
    },
    diversificationBenefits: {
      type: String,
      required: true
    }
  },

  // Financial Goal Assessment
  financialGoalAssessment: {
    goalImpact: {
      type: String,
      required: true
    },
    timelineAdjustment: {
      type: String,
      required: true
    },
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      required: true
    },
    liquidityNeeds: {
      type: String,
      required: true
    }
  },

  // Risk Analysis
  riskAnalysis: {
    currentRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    exitRiskFactors: [{
      type: String,
      enum: ['market_volatility', 'liquidity_risk', 'timing_risk', 'tax_risk', 'other']
    }],
    mitigationStrategies: {
      type: String,
      required: true
    },
    stressTestResults: {
      type: String,
      required: true
    }
  },

  // Execution Action Plan
  executionActionPlan: {
    steps: [{
      stepNumber: Number,
      action: String,
      timeline: String,
      responsible: String,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
      }
    }],
    prerequisites: [String],
    contingencies: [String],
    monitoringPoints: [String]
  },

  // Cost-Benefit Analysis
  costBenefitAnalysis: {
    exitLoad: {
      type: Number,
      required: true
    },
    transactionCosts: {
      type: Number,
      required: true
    },
    taxSavings: {
      type: Number,
      required: true
    },
    opportunityCost: {
      type: Number,
      required: true
    },
    netBenefit: {
      type: Number,
      required: true
    }
  },

  // Advisor Certification
  advisorCertification: {
    certifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Advisor',
      required: true
    },
    certificationDate: {
      type: Date,
      required: true
    },
    certificationNotes: String,
    complianceCheck: {
      type: Boolean,
      default: false
    }
  },

  // Client Acknowledgment
  clientAcknowledgment: {
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgmentDate: Date,
    acknowledgmentMethod: {
      type: String,
      enum: ['digital', 'physical', 'verbal'],
      default: 'digital'
    },
    clientNotes: String,
    followUpRequired: {
      type: Boolean,
      default: false
    }
  },

  // Status and Workflow
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'in_execution', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor'
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
mutualFundExitStrategySchema.index({ clientId: 1, fundId: 1 });
mutualFundExitStrategySchema.index({ advisorId: 1, status: 1 });
mutualFundExitStrategySchema.index({ createdAt: -1 });
mutualFundExitStrategySchema.index({ status: 1, priority: 1 });

// Virtual for total value
mutualFundExitStrategySchema.virtual('totalValue').get(function() {
  return this.primaryExitAnalysis.currentValue;
});

// Virtual for net benefit percentage
mutualFundExitStrategySchema.virtual('netBenefitPercentage').get(function() {
  if (this.primaryExitAnalysis.currentValue > 0) {
    return (this.costBenefitAnalysis.netBenefit / this.primaryExitAnalysis.currentValue) * 100;
  }
  return 0;
});

// Pre-save middleware
mutualFundExitStrategySchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'approved') {
    this.advisorCertification.certificationDate = new Date();
  }
  next();
});

// Static method to find strategies by client
mutualFundExitStrategySchema.statics.findByClient = function(clientId) {
  return this.find({ clientId, isActive: true }).populate('advisorId', 'name email');
};

// Static method to find strategies by advisor
mutualFundExitStrategySchema.statics.findByAdvisor = function(advisorId) {
  return this.find({ advisorId, isActive: true }).populate('clientId', 'name email phone');
};

// Instance method to calculate tax implications
mutualFundExitStrategySchema.methods.calculateTaxImplications = function() {
  const holdingPeriod = this.taxImplications.holdingPeriod;
  const currentValue = this.primaryExitAnalysis.currentValue;
  
  // Simplified tax calculation (should be enhanced based on actual tax rules)
  if (holdingPeriod === 'long_term') {
    this.taxImplications.taxRate = 10; // 10% for long term
  } else {
    this.taxImplications.taxRate = 15; // 15% for short term
  }
  
  this.taxImplications.taxAmount = (currentValue * this.taxImplications.taxRate) / 100;
  return this.taxImplications;
};

module.exports = mongoose.model('MutualFundExitStrategy', mutualFundExitStrategySchema);
