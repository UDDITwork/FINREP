/**
 * FILE LOCATION: backend/models/TaxPlanning.js
 * 
 * PURPOSE: Mongoose model for storing comprehensive tax planning strategies and recommendations
 * 
 * FUNCTIONALITY:
 * - Defines schema for detailed tax planning analysis and recommendations
 * - Stores AI-generated tax recommendations and manual advisor inputs
 * - Tracks tax optimization strategies, deductions, and compliance requirements
 * - Maintains tax planning metadata, review dates, and advisor certifications
 * - Records client acknowledgments and implementation status
 * 
 * DATA STRUCTURE:
 * - Personal tax information and compliance data
 * - Income analysis and tax slab calculations
 * - Tax-saving investments and deduction optimization
 * - Capital gains analysis and tax implications
 * - Estate tax planning and wealth transfer strategies
 * - Business tax considerations and professional income
 * - AI recommendations and manual advisor inputs
 * - Implementation tracking and compliance monitoring
 * 
 * RELATIONSHIPS:
 * - Links to Client model via clientId
 * - Links to Advisor model via advisorId
 * - References financial plans and CAS data for comprehensive analysis
 * - Tracks tax planning history and version control
 * 
 * VALIDATION:
 * - Required fields for essential tax planning components
 * - Date validation for tax years and review dates
 * - Numeric validation for amounts, percentages, and tax calculations
 * - Status validation for workflow states and compliance tracking
 * 
 * INDEXING:
 * - Client ID for efficient client-based queries
 * - Advisor ID for advisor-specific access
 * - Tax year for chronological tax planning
 * - Status for workflow management
 * - Created date for chronological ordering
 */

const mongoose = require('mongoose');

const taxPlanningSchema = new mongoose.Schema({
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
  taxYear: {
    type: String,
    required: true,
    default: () => new Date().getFullYear().toString()
  },

  // PERSONAL TAX INFORMATION
  personalTaxInfo: {
    panNumber: String,
    aadharNumber: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    dateOfBirth: Date,
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed'],
      default: 'single'
    },
    numberOfDependents: { type: Number, default: 0 },
    taxResidency: {
      type: String,
      enum: ['resident', 'non-resident', 'resident-not-ordinarily-resident'],
      default: 'resident'
    },
    seniorCitizenStatus: {
      type: String,
      enum: ['normal', 'senior_citizen', 'super_senior_citizen'],
      default: 'normal'
    }
  },

  // INCOME ANALYSIS
  incomeAnalysis: {
    totalAnnualIncome: { type: Number, default: 0 },
    monthlyIncome: { type: Number, default: 0 },
    incomeType: {
      type: String,
      enum: ['salaried', 'business', 'professional', 'mixed'],
      default: 'salaried'
    },
    employerBusinessName: String,
    additionalIncome: { type: Number, default: 0 },
    otherIncomeSources: [{
      source: String,
      amount: Number,
      taxDeducted: Number
    }],
    tdsDetails: [{
      deductor: String,
      amount: Number,
      tdsAmount: Number,
      form16: String
    }]
  },

  // TAX-SAVING INVESTMENTS & DEDUCTIONS
  taxSavingInvestments: {
    // Section 80C (₹1.5L limit)
    section80C: {
      ppf: { type: Number, default: 0 },
      epf: { type: Number, default: 0 },
      elss: { type: Number, default: 0 },
      nsc: { type: Number, default: 0 },
      lifeInsurance: { type: Number, default: 0 },
      tuitionFees: { type: Number, default: 0 },
      principalRepayment: { type: Number, default: 0 },
      total80C: { type: Number, default: 0 }
    },
    // Section 80CCD(1B) - NPS additional ₹50K
    section80CCD1B: {
      npsAdditional: { type: Number, default: 0 }
    },
    // Section 80D - Medical Insurance
    section80D: {
      selfFamily: { type: Number, default: 0 },
      parents: { type: Number, default: 0 },
      seniorCitizen: { type: Number, default: 0 },
      total80D: { type: Number, default: 0 }
    },
    // Section 80E - Education Loan Interest
    section80E: {
      educationLoanInterest: { type: Number, default: 0 }
    },
    // Section 24(b) - Home Loan Interest
    section24B: {
      homeLoanInterest: { type: Number, default: 0 },
      selfOccupied: { type: Number, default: 0 },
      letOut: { type: Number, default: 0 }
    },
    // Section 80EE - First Time Home Buyer
    section80EE: {
      additionalDeduction: { type: Number, default: 0 }
    },
    // Section 80G - Donations
    section80G: {
      donations: { type: Number, default: 0 }
    },
    // HRA Exemption
    hraExemption: {
      rentPaid: { type: Number, default: 0 },
      hraReceived: { type: Number, default: 0 },
      exemptionAmount: { type: Number, default: 0 }
    }
  },

  // CAPITAL GAINS ANALYSIS
  capitalGainsAnalysis: {
    equityInvestments: {
      directStocks: {
        currentValue: { type: Number, default: 0 },
        purchaseValue: { type: Number, default: 0 },
        ltcg: { type: Number, default: 0 },
        stcg: { type: Number, default: 0 }
      },
      mutualFunds: {
        currentValue: { type: Number, default: 0 },
        purchaseValue: { type: Number, default: 0 },
        ltcg: { type: Number, default: 0 },
        stcg: { type: Number, default: 0 }
      }
    },
    debtInvestments: {
      bondsDebentures: {
        currentValue: { type: Number, default: 0 },
        purchaseValue: { type: Number, default: 0 },
        ltcg: { type: Number, default: 0 },
        stcg: { type: Number, default: 0 }
      }
    },
    realEstate: {
      properties: [{
        propertyType: String,
        currentValue: { type: Number, default: 0 },
        purchaseValue: { type: Number, default: 0 },
        improvementCost: { type: Number, default: 0 },
        holdingPeriod: String,
        ltcg: { type: Number, default: 0 },
        stcg: { type: Number, default: 0 }
      }]
    },
    totalLTCG: { type: Number, default: 0 },
    totalSTCG: { type: Number, default: 0 }
  },

  // BUSINESS TAX CONSIDERATIONS
  businessTaxConsiderations: {
    businessIncome: { type: Number, default: 0 },
    businessExpenses: { type: Number, default: 0 },
    depreciation: { type: Number, default: 0 },
    professionalIncome: { type: Number, default: 0 },
    professionalExpenses: { type: Number, default: 0 },
    presumptiveTax: {
      applicable: { type: Boolean, default: false },
      section: String,
      income: { type: Number, default: 0 }
    }
  },

  // TAX CALCULATIONS
  taxCalculations: {
    grossTotalIncome: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    taxableIncome: { type: Number, default: 0 },
    taxSlab: String,
    taxBeforeRebate: { type: Number, default: 0 },
    rebate87A: { type: Number, default: 0 },
    taxAfterRebate: { type: Number, default: 0 },
    cess: { type: Number, default: 0 },
    totalTaxLiability: { type: Number, default: 0 },
    tdsCredits: { type: Number, default: 0 },
    advanceTax: { type: Number, default: 0 },
    selfAssessmentTax: { type: Number, default: 0 },
    refundDue: { type: Number, default: 0 }
  },

  // AI RECOMMENDATIONS
  aiRecommendations: {
    generatedAt: { type: Date, default: Date.now },
    recommendations: [{
      category: {
        type: String,
        enum: ['deduction_optimization', 'investment_strategy', 'capital_gains', 'business_tax', 'estate_planning', 'compliance']
      },
      priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      },
      title: String,
      description: String,
      potentialSavings: Number,
      implementationSteps: [String],
      deadline: Date,
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
      }
    }],
    summary: String,
    totalPotentialSavings: { type: Number, default: 0 },
    confidenceScore: { type: Number, min: 0, max: 100, default: 0 }
  },

  // MANUAL ADVISOR INPUTS
  manualAdvisorInputs: {
    recommendations: [{
      category: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      },
      title: String,
      description: String,
      rationale: String,
      implementationNotes: String,
      expectedOutcome: String,
      timeline: String,
      responsible: String,
      status: {
        type: String,
        enum: ['draft', 'pending', 'in_progress', 'completed', 'cancelled'],
        default: 'draft'
      },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }],
    notes: String,
    followUpActions: [String],
    clientInstructions: String
  },

  // COMPLIANCE & FILING
  complianceFiling: {
    itrFilingStatus: {
      type: String,
      enum: ['not_filed', 'filed', 'pending', 'under_review'],
      default: 'not_filed'
    },
    filingDate: Date,
    acknowledgmentNumber: String,
    verificationStatus: {
      type: String,
      enum: ['not_verified', 'verified', 'pending'],
      default: 'not_verified'
    },
    verificationDate: Date,
    refundStatus: {
      type: String,
      enum: ['no_refund', 'refund_processed', 'refund_pending'],
      default: 'no_refund'
    },
    refundAmount: { type: Number, default: 0 },
    refundDate: Date,
    notices: [{
      noticeType: String,
      noticeDate: Date,
      description: String,
      status: String,
      responseRequired: { type: Boolean, default: false },
      responseDate: Date
    }]
  },

  // IMPLEMENTATION TRACKING
  implementationTracking: {
    actionItems: [{
      item: String,
      assignedTo: String,
      dueDate: Date,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'overdue'],
        default: 'pending'
      },
      completionDate: Date,
      notes: String
    }],
    milestones: [{
      milestone: String,
      targetDate: Date,
      achievedDate: Date,
      status: {
        type: String,
        enum: ['pending', 'achieved', 'delayed'],
        default: 'pending'
      }
    }],
    progressPercentage: { type: Number, min: 0, max: 100, default: 0 }
  },

  // ADVISOR CERTIFICATION
  advisorCertification: {
    certifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Advisor',
      required: true
    },
    certificationDate: { type: Date, default: Date.now },
    certificationNotes: String,
    complianceCheck: { type: Boolean, default: false },
    reviewRequired: { type: Boolean, default: true },
    nextReviewDate: Date
  },

  // CLIENT ACKNOWLEDGMENT
  clientAcknowledgment: {
    acknowledged: { type: Boolean, default: false },
    acknowledgmentDate: Date,
    acknowledgmentMethod: {
      type: String,
      enum: ['digital', 'physical', 'verbal'],
      default: 'digital'
    },
    clientNotes: String,
    questions: [String],
    followUpRequired: { type: Boolean, default: false },
    followUpDate: Date
  },

  // STATUS AND WORKFLOW
  status: {
    type: String,
    enum: ['draft', 'under_review', 'approved', 'in_implementation', 'completed', 'archived'],
    default: 'draft',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // METADATA
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor'
  },
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  lastReviewed: { type: Date, default: Date.now },
  nextReviewDate: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
taxPlanningSchema.index({ clientId: 1, taxYear: 1 }, { unique: true });
taxPlanningSchema.index({ advisorId: 1, status: 1 });
taxPlanningSchema.index({ taxYear: 1, status: 1 });
taxPlanningSchema.index({ createdAt: -1 });
taxPlanningSchema.index({ status: 1, priority: 1 });
taxPlanningSchema.index({ nextReviewDate: 1 });

// Virtual for total tax savings
taxPlanningSchema.virtual('totalTaxSavings').get(function() {
  const aiSavings = this.aiRecommendations?.totalPotentialSavings || 0;
  const manualSavings = this.manualAdvisorInputs?.recommendations?.reduce((total, rec) => {
    return total + (rec.potentialSavings || 0);
  }, 0) || 0;
  return aiSavings + manualSavings;
});

// Virtual for completion percentage
taxPlanningSchema.virtual('completionPercentage').get(function() {
  return this.implementationTracking?.progressPercentage || 0;
});

// Pre-save middleware
taxPlanningSchema.pre('save', function(next) {
  // Calculate senior citizen status based on age
  if (this.personalTaxInfo?.dateOfBirth) {
    const age = new Date().getFullYear() - new Date(this.personalTaxInfo.dateOfBirth).getFullYear();
    if (age >= 80) {
      this.personalTaxInfo.seniorCitizenStatus = 'super_senior_citizen';
    } else if (age >= 60) {
      this.personalTaxInfo.seniorCitizenStatus = 'senior_citizen';
    } else {
      this.personalTaxInfo.seniorCitizenStatus = 'normal';
    }
  }

  // Calculate total 80C deductions
  if (this.taxSavingInvestments?.section80C) {
    const section80C = this.taxSavingInvestments.section80C;
    section80C.total80C = Math.min(
      (section80C.ppf || 0) + 
      (section80C.epf || 0) + 
      (section80C.elss || 0) + 
      (section80C.nsc || 0) + 
      (section80C.lifeInsurance || 0) + 
      (section80C.tuitionFees || 0) + 
      (section80C.principalRepayment || 0),
      150000 // 80C limit
    );
  }

  // Calculate total 80D deductions
  if (this.taxSavingInvestments?.section80D) {
    const section80D = this.taxSavingInvestments.section80D;
    section80D.total80D = (section80D.selfFamily || 0) + (section80D.parents || 0) + (section80D.seniorCitizen || 0);
  }

  // Update next review date
  if (this.isModified('status') && this.status === 'approved') {
    this.nextReviewDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
  }

  next();
});

// Static method to find tax planning by client
taxPlanningSchema.statics.findByClient = function(clientId, taxYear = null) {
  const query = { clientId, isActive: true };
  if (taxYear) {
    query.taxYear = taxYear;
  }
  return this.find(query).populate('advisorId', 'name email').sort({ taxYear: -1 });
};

// Static method to find tax planning by advisor
taxPlanningSchema.statics.findByAdvisor = function(advisorId, taxYear = null) {
  const query = { advisorId, isActive: true };
  if (taxYear) {
    query.taxYear = taxYear;
  }
  return this.find(query).populate('clientId', 'firstName lastName email phone').sort({ taxYear: -1 });
};

// Instance method to calculate tax liability
taxPlanningSchema.methods.calculateTaxLiability = function() {
  const income = this.taxCalculations.taxableIncome;
  const age = this.personalTaxInfo?.seniorCitizenStatus;
  
  let tax = 0;
  
  if (age === 'super_senior_citizen') {
    // Super Senior Citizen (80+ years)
    if (income > 1000000) tax += (income - 1000000) * 0.3;
    if (income > 500000) tax += Math.min(income - 500000, 500000) * 0.2;
  } else if (age === 'senior_citizen') {
    // Senior Citizen (60-79 years)
    if (income > 1000000) tax += (income - 1000000) * 0.3;
    if (income > 500000) tax += Math.min(income - 500000, 500000) * 0.2;
    if (income > 300000) tax += Math.min(income - 300000, 200000) * 0.1;
  } else {
    // Normal taxpayer
    if (income > 1000000) tax += (income - 1000000) * 0.3;
    if (income > 500000) tax += Math.min(income - 500000, 500000) * 0.2;
    if (income > 250000) tax += Math.min(income - 250000, 250000) * 0.1;
  }
  
  this.taxCalculations.taxBeforeRebate = tax;
  
  // Apply rebate 87A if applicable
  if (income <= 500000) {
    this.taxCalculations.rebate87A = Math.min(tax, 12500);
    tax = Math.max(0, tax - this.taxCalculations.rebate87A);
  }
  
  this.taxCalculations.taxAfterRebate = tax;
  this.taxCalculations.cess = tax * 0.04; // 4% cess
  this.taxCalculations.totalTaxLiability = tax + this.taxCalculations.cess;
  
  return this.taxCalculations;
};

module.exports = mongoose.model('TaxPlanning', taxPlanningSchema);
