// File: backend/models/ABTestSession.js
const mongoose = require('mongoose');
const { logger, logDatabase } = require('../utils/logger');

const abTestSessionSchema = new mongoose.Schema({
  // Session metadata
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // References
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
  
  // Session status and timing
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned', 'archived'],
    default: 'in_progress'
  },
  sessionStartTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  sessionEndTime: {
    type: Date
  },
  sessionDurationMinutes: {
    type: Number
  },
  
  // Client data snapshot at session start
  clientDataSnapshot: {
    personalInfo: {
      firstName: String,
      lastName: String,
      age: Number,
      email: String,
      phoneNumber: String
    },
    financialInfo: {
      totalMonthlyIncome: Number,
      totalMonthlyExpenses: Number,
      incomeType: String,
      netWorth: Number
    },
    existingInvestments: {
      totalValue: Number,
      breakdown: mongoose.Schema.Types.Mixed
    },
    goals: [{
      goalName: String,
      targetAmount: Number,
      targetYear: Number,
      priority: String
    }]
  },
  
  // Risk assessment results
  riskProfile: {
    responses: [{
      questionId: String,
      category: String,
      selectedOption: {
        optionId: Number,
        text: String,
        score: Number,
        description: String
      }
    }],
    calculatedRiskScore: {
      totalScore: Number,
      maxPossibleScore: Number,
      riskPercentage: Number,
      riskCategory: {
        type: String,
        enum: ['Conservative', 'Moderate', 'Aggressive', 'Very Aggressive']
      },
      riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Very High']
      }
    },
    recommendedAllocation: {
      equity: Number,
      debt: Number,
      alternatives: Number
    },
    warnings: [String],
    assessmentTimestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  // Generated investment scenarios
  scenarios: [{
    scenarioId: String,
    scenarioName: String,
    scenarioType: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive', 'ultra_aggressive', 'custom']
    },
    description: String,
    parameters: {
      equityAllocation: Number,
      debtAllocation: Number,
      alternativesAllocation: Number,
      expectedReturn: Number,
      volatility: Number,
      maxDrawdown: Number,
      sharpeRatio: Number,
      rebalancingFrequency: String,
      riskLevel: String
    },
    monthlyInvestment: Number,
    suitabilityScore: Number,
    isSelected: {
      type: Boolean,
      default: false
    },
    projectedReturns: {
      year1: Number,
      year3: Number,
      year5: Number,
      year10: Number,
      year15: Number,
      year20: Number
    }
  }],
  
  // Monte Carlo simulation results
  simulationResults: [{
    scenarioId: String,
    simulationMetadata: {
      simulationCount: Number,
      yearsSimulated: Number,
      totalInvested: Number,
      calculationTimestamp: Date
    },
    portfolioValueDistribution: {
      p10: Number,
      p25: Number,
      p50: Number,
      p75: Number,
      p90: Number,
      mean: Number
    },
    returnAnalysis: {
      p10: Number,
      p25: Number,
      p50: Number,
      p75: Number,
      p90: Number,
      expected: Number
    },
    riskMetrics: {
      volatility: Number,
      maxDrawdown: Number,
      valueAtRisk95: Number,
      sharpeRatio: Number,
      successRate: Number
    },
    goalAnalysis: [{
      goalName: String,
      targetAmount: Number,
      successRate: Number,
      averageShortfall: Number,
      medianAchievement: Number,
      timeToGoal: Number
    }],
    wealthMetrics: {
      medianMultiplier: Number,
      probabilityOfLoss: Number,
      averageGains: Number,
      compoundGrowthRate: Number
    }
  }],
  
  // Stress testing results
  stressTestResults: [{
    scenarioId: String,
    crisisScenarios: [{
      crisisId: String,
      crisisName: String,
      immediateImpact: {
        portfolioLossPercentage: Number,
        portfolioLossAmount: Number,
        portfolioValueAfterCrisis: Number,
        originalValue: Number
      },
      recoveryAnalysis: {
        timeToRecoveryMonths: Number,
        finalRecoveryValue: Number,
        totalRecoveryGain: Number
      },
      goalImpacts: [{
        goalName: String,
        delayMonths: Number,
        additionalSIPRequired: Number,
        severity: String
      }],
      behavioralConsiderations: {
        likelyClientReaction: String,
        recommendedAction: String,
        emotionalSupportRequired: Boolean,
        keyMessages: [String]
      },
      riskMetrics: {
        maxDrawdownFromPeak: Number,
        timeToBreakeven: Number,
        additionalSIPRequired: Number
      }
    }]
  }],
  
  // Final recommendations and selections
  finalRecommendations: {
    recommendedScenario: String,
    reasonForRecommendation: String,
    alternativeScenarios: [String],
    keyInsights: [String],
    actionItems: [String],
    riskWarnings: [String],
    nextReviewDate: Date
  },
  
  // User interactions and feedback
  userInteractions: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    interactionType: {
      type: String,
      enum: [
        // Original enum values
        'scenario_select',
        'parameter_adjust', 
        'feedback_submit',
        'question_ask',
        'export_request',
        
        // NEW: Missing enum values that controller uses
        'risk_assessment_complete',
        'scenarios_generated',
        'scenario_selection_updated',
        'simulation_completed',
        'stress_testing_completed',
        'session_completed'
      ]
    },
    details: mongoose.Schema.Types.Mixed
  }],
  
  // AI recommendations and insights
  aiAnalysis: {
    overallRecommendation: String,
    riskAnalysis: String,
    goalAchievabilityAnalysis: String,
    portfolioOptimizationSuggestions: [String],
    behavioralGuidance: String,
    marketOutlookConsiderations: String,
    confidenceScore: Number
  },
  
  // Session completion data
  completionData: {
    selectedScenario: String,
    clientFeedback: String,
    advisorNotes: String,
    implementationTimeline: String,
    nextSteps: [String]
  },
  
  // Export and sharing
  exports: [{
    exportType: {
      type: String,
      enum: ['pdf_report', 'excel_summary', 'presentation_slides']
    },
    exportTimestamp: Date,
    fileMetadata: {
      fileName: String,
      fileSize: Number,
      downloadCount: Number
    }
  }],
  
  // Performance tracking
  performanceMetrics: {
    clientEngagementScore: Number,
    sessionCompletionRate: Number,
    timeSpentOnEachStep: [{
      stepName: String,
      timeSpentMinutes: Number
    }],
    decisionsChangedCount: Number,
    questionsAskedCount: Number
  },
  
  // Session notes and comments
  sessionNotes: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    noteType: {
      type: String,
      enum: ['advisor_note', 'system_note', 'client_feedback', 'calculation_note']
    },
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Advisor'
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
abTestSessionSchema.index({ advisorId: 1, status: 1 });
abTestSessionSchema.index({ clientId: 1, status: 1 });
abTestSessionSchema.index({ sessionStartTime: -1 });
abTestSessionSchema.index({ 'riskProfile.calculatedRiskScore.riskCategory': 1 });
abTestSessionSchema.index({ sessionId: 1 }, { unique: true });

// Virtual for session duration in real-time
abTestSessionSchema.virtual('currentDurationMinutes').get(function() {
  if (this.sessionEndTime) {
    return Math.round((this.sessionEndTime - this.sessionStartTime) / (1000 * 60));
  }
  return Math.round((new Date() - this.sessionStartTime) / (1000 * 60));
});

// Virtual for completion percentage
abTestSessionSchema.virtual('completionPercentage').get(function() {
  let completedSteps = 0;
  const totalSteps = 5;
  
  if (this.clientDataSnapshot && Object.keys(this.clientDataSnapshot).length > 0) completedSteps++;
  if (this.riskProfile && this.riskProfile.calculatedRiskScore) completedSteps++;
  if (this.scenarios && this.scenarios.length > 0) completedSteps++;
  if (this.simulationResults && this.simulationResults.length > 0) completedSteps++;
  if (this.stressTestResults && this.stressTestResults.length > 0) completedSteps++;
  
  return Math.round((completedSteps / totalSteps) * 100);
});

// Virtual for selected scenarios count
abTestSessionSchema.virtual('selectedScenariosCount').get(function() {
  return this.scenarios ? this.scenarios.filter(s => s.isSelected).length : 0;
});

// Methods
abTestSessionSchema.methods.addUserInteraction = function(interactionType, details) {
  this.userInteractions.push({
    interactionType,
    details,
    timestamp: new Date()
  });
  return this.save();
};

abTestSessionSchema.methods.addSessionNote = function(noteType, content, authorId) {
  this.sessionNotes.push({
    noteType,
    content,
    author: authorId,
    timestamp: new Date()
  });
  return this.save();
};

abTestSessionSchema.methods.updateRiskProfile = function(riskProfileData) {
  this.riskProfile = {
    ...this.riskProfile,
    ...riskProfileData,
    assessmentTimestamp: new Date()
  };
  return this.save();
};

abTestSessionSchema.methods.addScenario = function(scenarioData) {
  this.scenarios.push({
    ...scenarioData,
    scenarioId: `scenario_${Date.now()}_${this.scenarios.length + 1}`
  });
  return this.save();
};

abTestSessionSchema.methods.updateScenarioSelection = function(scenarioId, isSelected) {
  const scenario = this.scenarios.find(s => s.scenarioId === scenarioId);
  if (scenario) {
    scenario.isSelected = isSelected;
    return this.save();
  }
  throw new Error('Scenario not found');
};

abTestSessionSchema.methods.addSimulationResults = function(scenarioId, results) {
  this.simulationResults.push({
    scenarioId,
    ...results,
    calculationTimestamp: new Date()
  });
  return this.save();
};

abTestSessionSchema.methods.addStressTestResults = function(stressTestResults) {
  // Handle both object format {scenarioId: [results]} and direct calls
  if (typeof stressTestResults === 'object' && !Array.isArray(stressTestResults)) {
    // Frontend sends: {scenarioId1: [...], scenarioId2: [...]}
    for (const [scenarioId, results] of Object.entries(stressTestResults)) {
      this.stressTestResults.push({
        scenarioId,
        crisisScenarios: results
      });
    }
  } else {
    // Direct call with scenarioId and results
    const scenarioId = arguments[0];
    const results = arguments[1];
    this.stressTestResults.push({
      scenarioId,
      crisisScenarios: results
    });
  }
  return this.save();
};

abTestSessionSchema.methods.completeSession = function(completionData) {
  this.status = 'completed';
  this.sessionEndTime = new Date();
  this.sessionDurationMinutes = Math.round((this.sessionEndTime - this.sessionStartTime) / (1000 * 60));
  this.completionData = completionData;
  return this.save();
};

abTestSessionSchema.methods.addExport = function(exportType, fileMetadata) {
  this.exports.push({
    exportType,
    fileMetadata,
    exportTimestamp: new Date()
  });
  return this.save();
};

// Pre-save middleware
abTestSessionSchema.pre('save', function(next) {
  const startTime = Date.now();
  this._startTime = startTime;
  
  logger.debug(`DB Operation started: ABTestSession.save for ID: ${this._id || 'new'}`);
  next();
});

abTestSessionSchema.post('save', function(doc, next) {
  const duration = Date.now() - this._startTime;
  const operation = doc.isNew ? 'create' : 'update';
  
  logDatabase.queryExecution('ABTestSession', operation, duration);
  logger.info(`DB Operation completed: ABTestSession.${operation} for ID: ${doc._id} in ${duration}ms`);
  
  next();
});

abTestSessionSchema.post('save', function(error, doc, next) {
  if (error) {
    logDatabase.operationError('ABTestSession.save', error);
    logger.error(`DB Operation failed: ABTestSession.save for ID: ${doc?._id || 'unknown'} - ${error.message}`);
  }
  next(error);
});

// Find operations logging
abTestSessionSchema.pre(/^find/, function() {
  this._startTime = Date.now();
  logger.debug(`DB Operation started: ABTestSession.${this.getOptions().op || 'find'}`);
});

abTestSessionSchema.post(/^find/, function(result) {
  const duration = Date.now() - this._startTime;
  const operation = this.getOptions().op || 'find';
  const resultCount = Array.isArray(result) ? result.length : (result ? 1 : 0);
  
  logDatabase.queryExecution('ABTestSession', operation, duration);
  logger.debug(`DB Operation completed: ABTestSession.${operation} returned ${resultCount} document(s) in ${duration}ms`);
});

abTestSessionSchema.post(/^find/, function(error, result, next) {
  if (error) {
    const operation = this.getOptions().op || 'find';
    logDatabase.operationError(`ABTestSession.${operation}`, error);
    logger.error(`DB Operation failed: ABTestSession.${operation} - ${error.message}`);
  }
  if (next) next(error);
});

// Ensure virtual fields are serialized
abTestSessionSchema.set('toJSON', { virtuals: true });
abTestSessionSchema.set('toObject', { virtuals: true });

// Security: Remove sensitive data from JSON output
abTestSessionSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  // Remove internal fields
  delete obj.__v;
  delete obj._startTime;
  
  return obj;
};

module.exports = mongoose.model('ABTestSession', abTestSessionSchema);