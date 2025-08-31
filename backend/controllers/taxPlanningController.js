// File: backend/controllers/taxPlanningController.js
/**
 * Tax Planning Controller
 * Handles tax planning data aggregation, analysis, and AI recommendations for clients
 */

const Client = require('../models/Client');
const FinancialPlan = require('../models/FinancialPlan');
const ClientInvitation = require('../models/ClientInvitation');
const EstateInformation = require('../models/EstateInformation');
const TaxPlanning = require('../models/TaxPlanning');
const { logger } = require('../utils/logger');

/**
 * Get comprehensive tax planning data for a specific client
 * @route GET /api/tax-planning/client/:clientId
 * @access Private (Advisor only)
 */
const getClientTaxPlanningData = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { taxYear } = req.query;
    const advisorId = req.advisor.id;

    console.log('💰 [Tax Planning] Fetching data for client:', {
      clientId,
      advisorId,
      taxYear: taxYear || 'current',
      timestamp: new Date().toISOString()
    });

    // Validate client ID
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    // Get client data with comprehensive information
    const client = await Client.findOne({
      _id: clientId,
      advisor: advisorId
    }).lean();

    if (!client) {
      console.log('❌ [Tax Planning] Client not found:', { clientId, advisorId });
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }

    // Get client's financial plans
    const financialPlans = await FinancialPlan.find({
      clientId: clientId,
      advisorId: advisorId
    }).sort({ createdAt: -1 }).lean();

    // Get client invitation data if available
    const clientInvitation = await ClientInvitation.findOne({
      clientData: clientId
    }).lean();

    // Get estate information if available
    const estateInformation = await EstateInformation.findOne({
      clientId: clientId
    }).lean();

    // Get existing tax planning data
    const existingTaxPlanning = await TaxPlanning.findOne({
      clientId: clientId,
      taxYear: taxYear || new Date().getFullYear().toString()
    }).lean();

    console.log('✅ [Tax Planning] Data found:', {
      clientId,
      hasClient: !!client,
      hasFinancialPlans: financialPlans.length > 0,
      hasClientInvitation: !!clientInvitation,
      hasEstateInformation: !!estateInformation,
      hasExistingTaxPlanning: !!existingTaxPlanning
    });

    // Aggregate comprehensive tax planning data
    const taxPlanningData = await aggregateTaxPlanningData(
      client,
      financialPlans,
      clientInvitation,
      estateInformation,
      existingTaxPlanning
    );

    res.json({
      success: true,
      message: 'Tax planning data retrieved successfully',
      data: {
        clientInfo: {
          id: client._id,
          name: `${client.firstName} ${client.lastName}`,
          email: client.email,
          phone: client.phone,
          dateOfBirth: client.dateOfBirth,
          maritalStatus: client.maritalStatus,
          address: client.address
        },
        taxPlanningData,
        existingTaxPlanning
      }
    });

  } catch (error) {
    console.error('❌ [Tax Planning] Error fetching client data:', error);
    logger.error('Tax Planning Data Fetch Error', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.clientId,
      advisorId: req.advisor?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch tax planning data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Aggregate comprehensive tax planning data from multiple sources
 */
const aggregateTaxPlanningData = async (client, financialPlans, clientInvitation, estateInformation, existingTaxPlanning) => {
  try {
    // Personal Information
    const personalInfo = {
      panNumber: client.panNumber || '',
      aadharNumber: client.aadharNumber || '',
      address: client.address || {},
      dateOfBirth: client.dateOfBirth,
      maritalStatus: client.maritalStatus || 'single',
      numberOfDependents: client.numberOfDependents || 0,
      occupation: client.occupation || '',
      employerBusinessName: client.employerBusinessName || ''
    };

    // Income Analysis
    const incomeAnalysis = {
      totalMonthlyIncome: client.totalMonthlyIncome || 0,
      annualIncome: (client.totalMonthlyIncome || 0) * 12,
      incomeType: client.incomeType || 'salaried',
      additionalIncome: client.additionalIncome || 0,
      employerBusinessName: client.employerBusinessName || ''
    };

    // Tax-Saving Investments
    const taxSavingInvestments = {
      section80C: {
        ppf: client.investments?.fixedIncome?.ppf || 0,
        epf: client.investments?.fixedIncome?.epf || 0,
        elss: client.investments?.equity?.elss?.currentValue || 0,
        nsc: client.investments?.fixedIncome?.nsc || 0,
        lifeInsurance: client.lifeInsurance?.annualPremium || 0,
        tuitionFees: client.monthlyExpenses?.education || 0,
        principalRepayment: client.debtsAndLiabilities?.homeLoan?.principalAmount || 0
      },
      section80CCD1B: {
        npsAdditional: client.investments?.fixedIncome?.nps || 0
      },
      section80D: {
        selfFamily: client.healthInsurance?.annualPremium || 0,
        parents: 0, // Would need additional data
        seniorCitizen: 0 // Would need additional data
      },
      section80E: {
        educationLoanInterest: client.monthlyExpenses?.education || 0
      },
      section24B: {
        homeLoanInterest: client.debtsAndLiabilities?.homeLoan?.interestRate || 0,
        selfOccupied: 0, // Would need property details
        letOut: 0 // Would need property details
      },
      hraExemption: {
        rentPaid: client.monthlyExpenses?.housingRent || 0,
        hraReceived: 0, // Would need salary structure
        exemptionAmount: 0
      }
    };

    // Capital Gains Analysis
    const capitalGainsAnalysis = {
      equityInvestments: {
        directStocks: {
          currentValue: client.investments?.equity?.directStocks?.currentValue || 0,
          purchaseValue: client.investments?.equity?.directStocks?.purchaseValue || 0
        },
        mutualFunds: {
          currentValue: client.investments?.equity?.mutualFunds?.currentValue || 0,
          purchaseValue: client.investments?.equity?.mutualFunds?.purchaseValue || 0
        }
      },
      debtInvestments: {
        bondsDebentures: {
          currentValue: client.investments?.fixedIncome?.bondsDebentures?.currentValue || 0,
          purchaseValue: client.investments?.fixedIncome?.bondsDebentures?.purchaseValue || 0
        }
      },
      realEstate: {
        properties: estateInformation?.realEstateProperties?.map(property => ({
          propertyType: property.propertyType || 'residential',
          currentValue: property.financialDetails?.currentMarketValue || 0,
          purchaseValue: property.financialDetails?.purchasePrice || 0,
          improvementCost: property.financialDetails?.improvementCost || 0,
          holdingPeriod: 'long_term' // Would need purchase date calculation
        })) || []
      }
    };

    // Business Tax Considerations
    const businessTaxConsiderations = {
      businessIncome: client.incomeType === 'business' ? (client.totalMonthlyIncome || 0) * 12 : 0,
      businessExpenses: 0, // Would need detailed business data
      professionalIncome: client.incomeType === 'professional' ? (client.totalMonthlyIncome || 0) * 12 : 0,
      professionalExpenses: 0 // Would need detailed professional data
    };

    // CAS Data Analysis
    const casData = clientInvitation?.casParsedData ? {
      totalValue: clientInvitation.casParsedData.summary?.total_value || 0,
      assetAllocation: clientInvitation.casParsedData.summary?.asset_allocation || {},
      mutualFunds: clientInvitation.casParsedData.mutual_funds || [],
      dematAccounts: clientInvitation.casParsedData.demat_accounts || []
    } : null;

    // Financial Plan Analysis
    const financialPlanAnalysis = financialPlans.length > 0 ? {
      latestPlan: financialPlans[0],
      totalPlans: financialPlans.length,
      netWorth: financialPlans[0]?.clientDataSnapshot?.calculatedMetrics?.netWorth || 0,
      savingsRate: financialPlans[0]?.clientDataSnapshot?.calculatedMetrics?.savingsRate || 0
    } : null;

    // Estate Tax Planning
    const estateTaxPlanning = estateInformation ? {
      estimatedNetEstate: estateInformation.estateMetadata?.estimatedNetEstate || 0,
      realEstateProperties: estateInformation.realEstateProperties || [],
      personalAssets: estateInformation.personalAssets || {},
      businessAssets: estateInformation.estatePreferences?.businessSuccession?.businessDetails || {}
    } : null;

    return {
      personalInfo,
      incomeAnalysis,
      taxSavingInvestments,
      capitalGainsAnalysis,
      businessTaxConsiderations,
      casData,
      financialPlanAnalysis,
      estateTaxPlanning,
      dataCompleteness: calculateDataCompleteness(client, clientInvitation, estateInformation),
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ [Tax Planning] Error aggregating data:', error);
    throw error;
  }
};

/**
 * Calculate data completeness percentage
 */
const calculateDataCompleteness = (client, clientInvitation, estateInformation) => {
  let totalFields = 0;
  let completedFields = 0;

  // Personal Information (20 points)
  const personalFields = [
    'panNumber', 'aadharNumber', 'dateOfBirth', 'maritalStatus', 
    'numberOfDependents', 'occupation', 'totalMonthlyIncome', 'address'
  ];
  totalFields += personalFields.length;
  completedFields += personalFields.filter(field => client[field]).length;

  // Investment Data (15 points)
  const investmentFields = [
    'investments.fixedIncome.ppf', 'investments.fixedIncome.epf',
    'investments.equity.elss', 'lifeInsurance.annualPremium',
    'healthInsurance.annualPremium'
  ];
  totalFields += investmentFields.length;
  completedFields += investmentFields.filter(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], client);
    return value && value > 0;
  }).length;

  // CAS Data (10 points)
  if (clientInvitation?.casParsedData) {
    completedFields += 10;
  }
  totalFields += 10;

  // Estate Data (5 points)
  if (estateInformation) {
    completedFields += 5;
  }
  totalFields += 5;

  return Math.round((completedFields / totalFields) * 100);
};

/**
 * Generate AI tax planning recommendations
 * @route POST /api/tax-planning/client/:clientId/ai-recommendations
 * @access Private (Advisor only)
 */
const generateAIRecommendations = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { taxYear } = req.body;
    const advisorId = req.advisor.id;

    console.log('🤖 [Tax Planning AI] Generating recommendations:', {
      clientId,
      advisorId,
      taxYear: taxYear || 'current',
      timestamp: new Date().toISOString()
    });

    // Get client data directly (avoid double response)
    const client = await Client.findOne({
      _id: clientId,
      advisor: advisorId
    }).lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }

    // Get related data
    const financialPlans = await FinancialPlan.find({
      clientId: clientId,
      advisorId: advisorId
    }).sort({ createdAt: -1 }).lean();

    const clientInvitation = await ClientInvitation.findOne({
      clientData: clientId
    }).lean();

    const estateInformation = await EstateInformation.findOne({
      clientId: clientId
    }).lean();

    // Aggregate tax planning data
    console.log('📊 [Tax Planning AI] Aggregating tax planning data...');
    const taxPlanningData = await aggregateTaxPlanningData(
      client,
      financialPlans,
      clientInvitation,
      estateInformation,
      null
    );
    console.log('✅ [Tax Planning AI] Tax planning data aggregated:', {
      hasPersonalInfo: !!taxPlanningData.personalInfo,
      hasIncomeAnalysis: !!taxPlanningData.incomeAnalysis,
      hasTaxSavingInvestments: !!taxPlanningData.taxSavingInvestments,
      dataCompleteness: taxPlanningData.dataCompleteness
    });

    // Generate AI recommendations using Claude API with fallback
    console.log('🤖 [Tax Planning AI] Generating Claude recommendations...');
    let aiRecommendations;
    try {
      aiRecommendations = await generateClaudeTaxRecommendations(taxPlanningData);
      console.log('✅ [Tax Planning AI] Claude recommendations generated:', {
        recommendationsCount: aiRecommendations.recommendations?.length || 0,
        totalSavings: aiRecommendations.totalPotentialSavings || 0
      });
    } catch (claudeError) {
      console.error('❌ [Tax Planning AI] Claude API failed, using fallback:', claudeError.message);
      
      // Check if it's a credit exhaustion error
      if (claudeError.message.includes('credits exhausted')) {
        console.log('💳 [Tax Planning AI] Claude API credits exhausted - using fallback recommendations');
        aiRecommendations = getFallbackRecommendations();
        aiRecommendations.creditExhausted = true;
        aiRecommendations.creditExhaustedMessage = 'Claude API credits exhausted. Showing fallback recommendations.';
      } else {
        console.log('🔄 [Tax Planning AI] Claude API error - using fallback recommendations');
        aiRecommendations = getFallbackRecommendations();
        aiRecommendations.apiError = true;
        aiRecommendations.apiErrorMessage = claudeError.message;
      }
      
      console.log('✅ [Tax Planning AI] Fallback recommendations generated:', {
        recommendationsCount: aiRecommendations.recommendations?.length || 0,
        totalSavings: aiRecommendations.totalPotentialSavings || 0,
        creditExhausted: aiRecommendations.creditExhausted || false,
        apiError: aiRecommendations.apiError || false
      });
    }

    // Normalize AI recommendations to match schema enums
    console.log('🔧 [Tax Planning AI] Normalizing AI recommendations...');
    const normalizedRecommendations = aiRecommendations.recommendations?.map(rec => {
      // Map categories to valid enum values
      const categoryMapping = {
        'data_completion': 'compliance',
        'health_insurance': 'deduction_optimization',
        'retirement_planning': 'investment_strategy',
        'deduction_optimization': 'deduction_optimization',
        'investment_strategy': 'investment_strategy',
        'capital_gains': 'capital_gains',
        'business_tax': 'business_tax',
        'estate_planning': 'estate_planning',
        'compliance': 'compliance'
      };
      
      // Map priorities to valid enum values
      const priorityMapping = {
        'critical': 'high',
        'high': 'high',
        'medium': 'medium',
        'low': 'low'
      };
      
      return {
        ...rec,
        category: categoryMapping[rec.category] || 'compliance',
        priority: priorityMapping[rec.priority] || 'medium'
      };
    }) || [];
    
    const normalizedAiRecommendations = {
      ...aiRecommendations,
      recommendations: normalizedRecommendations
    };
    
    console.log('✅ [Tax Planning AI] Recommendations normalized:', {
      originalCount: aiRecommendations.recommendations?.length || 0,
      normalizedCount: normalizedRecommendations.length
    });

    // Save or update tax planning with AI recommendations
    console.log('💾 [Tax Planning AI] Saving tax planning data...');
    const taxPlanning = await TaxPlanning.findOneAndUpdate(
      { 
        clientId: clientId,
        taxYear: taxYear || new Date().getFullYear().toString()
      },
      {
        clientId: clientId,
        advisorId: advisorId,
        taxYear: taxYear || new Date().getFullYear().toString(),
        personalTaxInfo: {
          panNumber: taxPlanningData.personalInfo.panNumber,
          aadharNumber: taxPlanningData.personalInfo.aadharNumber,
          address: taxPlanningData.personalInfo.address,
          dateOfBirth: taxPlanningData.personalInfo.dateOfBirth,
          maritalStatus: taxPlanningData.personalInfo.maritalStatus?.toLowerCase() || 'single',
          numberOfDependents: taxPlanningData.personalInfo.numberOfDependents
        },
        incomeAnalysis: {
          totalAnnualIncome: taxPlanningData.incomeAnalysis.annualIncome,
          monthlyIncome: taxPlanningData.incomeAnalysis.totalMonthlyIncome,
          incomeType: taxPlanningData.incomeAnalysis.incomeType?.toLowerCase() || 'salaried',
          employerBusinessName: taxPlanningData.incomeAnalysis.employerBusinessName,
          additionalIncome: taxPlanningData.incomeAnalysis.additionalIncome
        },
        taxSavingInvestments: taxPlanningData.taxSavingInvestments,
        capitalGainsAnalysis: taxPlanningData.capitalGainsAnalysis,
        businessTaxConsiderations: taxPlanningData.businessTaxConsiderations,
        aiRecommendations: normalizedAiRecommendations,
        createdBy: advisorId,
        updatedBy: advisorId
      },
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    );
    console.log('✅ [Tax Planning AI] Tax planning data saved:', taxPlanning._id);

    // Generate visualization data for BEFORE vs AFTER comparison
    console.log('📊 [Tax Planning AI] Generating visualization data...');
    const visualizationData = generateTaxPlanningVisualization(
      taxPlanningData,
      normalizedAiRecommendations,
      taxPlanning
    );
    console.log('✅ [Tax Planning AI] Visualization data generated:', {
      hasBeforeAfter: !!visualizationData.beforeAfterComparison,
      hasCharts: !!visualizationData.charts,
      totalSavings: visualizationData.beforeAfterComparison?.totalSavings || 0
    });

    console.log('✅ [Tax Planning AI] Recommendations generated and saved:', {
      clientId,
      taxPlanningId: taxPlanning._id,
      recommendationsCount: aiRecommendations.recommendations.length,
      totalSavings: aiRecommendations.totalPotentialSavings
    });

    res.json({
      success: true,
      message: 'AI tax planning recommendations generated successfully',
      data: {
        taxPlanning: {
          ...taxPlanning.toObject(),
          aiRecommendations: normalizedAiRecommendations
        },
        visualizationData: visualizationData,
        // Include error information if applicable
        ...(aiRecommendations.creditExhausted && {
          warning: {
            type: 'credit_exhausted',
            message: aiRecommendations.creditExhaustedMessage,
            showFallback: true
          }
        }),
        ...(aiRecommendations.apiError && !aiRecommendations.creditExhausted && {
          warning: {
            type: 'api_error',
            message: aiRecommendations.apiErrorMessage,
            showFallback: true
          }
        })
      }
    });

  } catch (error) {
    console.error('❌ [Tax Planning AI] Error generating recommendations:', error);
    console.error('❌ [Tax Planning AI] Error details:', {
      message: error.message,
      stack: error.stack,
      clientId: req.params.clientId,
      advisorId: req.advisor?.id,
      timestamp: new Date().toISOString()
    });
    
    logger.error('Tax Planning AI Recommendations Error', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.clientId,
      advisorId: req.advisor?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate AI recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? {
        clientId: req.params.clientId,
        advisorId: req.advisor?.id,
        timestamp: new Date().toISOString()
      } : undefined
    });
  }
};

/**
 * Generate Claude AI tax planning recommendations
 */
const generateClaudeTaxRecommendations = async (taxPlanningData) => {
  try {
    console.log('🔑 [Claude] Checking API key...');
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      console.error('❌ [Claude] API key not configured');
      throw new Error('Claude API key not configured. Please set CLAUDE_API_KEY environment variable.');
    }
    if (!claudeApiKey.startsWith('sk-ant-')) {
      console.error('❌ [Claude] API key format appears incorrect');
      throw new Error('Claude API key format appears incorrect. Should start with "sk-ant-"');
    }
    console.log('✅ [Claude] API key found and format validated');

    // Get current date and tax year information (dynamic calculation)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-based to 1-based
    const currentDay = currentDate.getDate();
    
    // Calculate financial year dynamically
    // If current month is April (4) to March (3), FY is current year to next year
    // If current month is Jan (1) to March (3), FY is previous year to current year
    let financialYearStart, financialYearEnd, nextFinancialYearEnd;
    
    if (currentMonth >= 4) {
      // April to December: FY is current year to next year
      financialYearStart = currentYear;
      financialYearEnd = `${currentYear + 1}-03-31`;
      nextFinancialYearEnd = `${currentYear + 2}-03-31`;
    } else {
      // January to March: FY is previous year to current year
      financialYearStart = currentYear - 1;
      financialYearEnd = `${currentYear}-03-31`;
      nextFinancialYearEnd = `${currentYear + 1}-03-31`;
    }
    
    // Calculate days remaining in current financial year
    const fyEndDate = new Date(financialYearEnd);
    const daysRemaining = Math.ceil((fyEndDate - currentDate) / (1000 * 60 * 60 * 24));
    
    // Calculate months remaining
    const monthsRemaining = Math.ceil(daysRemaining / 30);
    
    // Prepare comprehensive prompt for Claude
    const prompt = `You are a tax planning expert AI assistant. Analyze the following client data and provide comprehensive tax planning recommendations.

IMPORTANT: Current Date Information (Auto-calculated):
- Today's Date: ${currentDate.toISOString().split('T')[0]} (${currentDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
- Current Financial Year: ${financialYearStart}-${financialYearStart + 1}
- Financial Year End: ${financialYearEnd}
- Next Financial Year End: ${nextFinancialYearEnd}
- Current Month: ${currentMonth} (${currentDate.toLocaleDateString('en-IN', { month: 'long' })})
- Days Remaining in Current FY: ${daysRemaining} days
- Months Remaining in Current FY: ${monthsRemaining} months

CLIENT DATA:
Personal Information:
- PAN: ${taxPlanningData.personalInfo.panNumber || 'Not provided'}
- Date of Birth: ${taxPlanningData.personalInfo.dateOfBirth || 'Not provided'}
- Marital Status: ${taxPlanningData.personalInfo.maritalStatus || 'Not provided'}
- Dependents: ${taxPlanningData.personalInfo.numberOfDependents || 0}
- Occupation: ${taxPlanningData.personalInfo.occupation || 'Not provided'}

Income Analysis:
- Annual Income: ₹${taxPlanningData.incomeAnalysis.annualIncome || 0}
- Monthly Income: ₹${taxPlanningData.incomeAnalysis.totalMonthlyIncome || 0}
- Income Type: ${taxPlanningData.incomeAnalysis.incomeType || 'Not specified'}
- Additional Income: ₹${taxPlanningData.incomeAnalysis.additionalIncome || 0}

Tax-Saving Investments (Current):
- PPF: ₹${taxPlanningData.taxSavingInvestments.section80C.ppf || 0}
- EPF: ₹${taxPlanningData.taxSavingInvestments.section80C.epf || 0}
- ELSS: ₹${taxPlanningData.taxSavingInvestments.section80C.elss || 0}
- NSC: ₹${taxPlanningData.taxSavingInvestments.section80C.nsc || 0}
- Life Insurance: ₹${taxPlanningData.taxSavingInvestments.section80C.lifeInsurance || 0}
- NPS Additional: ₹${taxPlanningData.taxSavingInvestments.section80CCD1B.npsAdditional || 0}
- Health Insurance: ₹${taxPlanningData.taxSavingInvestments.section80D.selfFamily || 0}

Capital Gains:
- Equity Investments: ₹${taxPlanningData.capitalGainsAnalysis.equityInvestments.directStocks.currentValue + taxPlanningData.capitalGainsAnalysis.equityInvestments.mutualFunds.currentValue || 0}
- Debt Investments: ₹${taxPlanningData.capitalGainsAnalysis.debtInvestments.bondsDebentures.currentValue || 0}
- Real Estate Properties: ${taxPlanningData.capitalGainsAnalysis.realEstate.properties.length} properties

Business/Professional Income: ₹${taxPlanningData.businessTaxConsiderations.businessIncome + taxPlanningData.businessTaxConsiderations.professionalIncome || 0}

Data Completeness: ${taxPlanningData.dataCompleteness}%

IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any text before or after the JSON. The response must be parseable JSON.

Provide comprehensive tax planning recommendations in this exact JSON format:

{
  "recommendations": [
    {
      "category": "deduction_optimization",
      "priority": "high",
      "title": "Maximize Section 80C Deductions",
      "description": "Detailed explanation of the recommendation with specific steps and benefits",
      "potentialSavings": 15000,
      "implementationSteps": ["Step 1: Review current investments", "Step 2: Calculate shortfall", "Step 3: Invest in suitable instruments"],
      "deadline": "2024-12-31",
      "riskLevel": "low"
    }
  ],
  "summary": "Overall tax planning strategy summary focusing on key opportunities",
  "totalPotentialSavings": 15000,
  "confidenceScore": 85
}

CRITICAL: Use the current date information provided above to set appropriate deadlines:
- For current financial year (${financialYearStart}-${financialYearStart + 1}): Set deadlines before ${financialYearEnd}
- For next financial year: Set deadlines before ${nextFinancialYearEnd}
- Consider the current month (${currentMonth}) and remaining time (${monthsRemaining} months) when setting realistic timelines
- NEVER recommend deadlines in the past (before ${currentDate.toISOString().split('T')[0]})
- For urgent tax-saving investments: If ${monthsRemaining} months or less remain, recommend deadlines within 1-2 months from today
- For long-term planning: If ${monthsRemaining} months or more remain, recommend deadlines for current financial year end
- Always consider the urgency based on remaining time in current financial year

Focus on:
1. Maximizing tax deductions under various sections (80C, 80D, 80E, 24B, etc.)
2. Optimizing capital gains tax through proper timing and tax-loss harvesting
3. Business tax optimization if applicable
4. Estate tax planning strategies
5. Compliance requirements and deadlines (using current date context)
6. Risk assessment for each recommendation

Provide 3-5 specific, actionable recommendations with realistic savings estimates and appropriate deadlines based on current date. Return ONLY the JSON object.`;

    // Call Claude API with timeout
    console.log('🌐 [Claude] Making API call...');
    console.log('🔑 [Claude] Using API key:', claudeApiKey ? 'Present' : 'Missing');
    console.log('📅 [Claude] Dynamic date context:', {
      currentDate: currentDate.toISOString().split('T')[0],
      currentYear: currentYear,
      currentMonth: currentMonth,
      financialYear: `${financialYearStart}-${financialYearStart + 1}`,
      financialYearEnd: financialYearEnd,
      nextFinancialYearEnd: nextFinancialYearEnd,
      daysRemaining: daysRemaining,
      monthsRemaining: monthsRemaining
    });
    console.log('📝 [Claude] Prompt length:', prompt.length);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('📡 [Claude] API response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Claude] API error:', response.status, errorText);
        
        // Parse error response to get specific error details
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
        } catch (parseError) {
          errorDetails = { error: { message: errorText } };
        }
        
        // Handle specific Claude API errors
        if (response.status === 401) {
          throw new Error('Claude API authentication failed. Please check your API key.');
        } else if (response.status === 402) {
          throw new Error('Claude API credits exhausted. Please add credits to your account.');
        } else if (response.status === 429) {
          throw new Error('Claude API rate limit exceeded. Please try again later.');
        } else if (response.status === 500) {
          throw new Error('Claude API server error. Please try again later.');
        } else if (response.status === 503) {
          throw new Error('Claude API service unavailable. Please try again later.');
        } else {
          const errorMessage = errorDetails?.error?.message || errorDetails?.error || errorText;
          throw new Error(`Claude API error (${response.status}): ${errorMessage}`);
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ [Claude] API call timed out after 60 seconds');
        throw new Error('Claude API call timed out. Please try again.');
      }
      console.error('❌ [Claude] Fetch error:', fetchError);
      throw new Error(`Claude API fetch error: ${fetchError.message}`);
    }

    const claudeResponse = await response.json();
    console.log('✅ [Claude] API response received');
    console.log('📊 [Claude] Response structure:', {
      hasContent: !!claudeResponse.content,
      contentLength: claudeResponse.content?.length || 0,
      hasUsage: !!claudeResponse.usage,
      hasStopReason: !!claudeResponse.stop_reason
    });
    
    // Validate response structure
    if (!claudeResponse.content || !Array.isArray(claudeResponse.content) || claudeResponse.content.length === 0) {
      console.error('❌ [Claude] Invalid response structure:', claudeResponse);
      throw new Error('Invalid Claude API response structure - missing content array');
    }
    
    const content = claudeResponse.content[0].text;
    console.log('📝 [Claude] Response content length:', content.length);
    console.log('📄 [Claude] Raw response preview:', content.substring(0, 200) + '...');

    // Parse Claude's response
    let recommendations;
    try {
      console.log('🔍 [Claude] Parsing response...');
      
      // Try to find JSON in the response - look for the main JSON object
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      
      // If no match, try to find JSON between code blocks
      if (!jsonMatch) {
        jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch = [jsonMatch[1]];
        }
      }
      
      // If still no match, try to find JSON after "```" or similar markers
      if (!jsonMatch) {
        jsonMatch = content.match(/```\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch = [jsonMatch[1]];
        }
      }
      
      if (jsonMatch) {
        console.log('🔍 [Claude] Found JSON match, parsing...');
        recommendations = JSON.parse(jsonMatch[0]);
        console.log('✅ [Claude] Successfully parsed recommendations:', {
          recommendationsCount: recommendations.recommendations?.length || 0,
          hasSummary: !!recommendations.summary,
          totalSavings: recommendations.totalPotentialSavings || 0
        });
      } else {
        console.error('❌ [Claude] No valid JSON found in response');
        console.log('📄 [Claude] Full response:', content);
        throw new Error('No valid JSON found in Claude response');
      }
    } catch (parseError) {
      console.error('❌ [Claude] Error parsing response:', parseError);
      console.log('📄 [Claude] Full response for debugging:', content);
      throw new Error(`Failed to parse Claude response: ${parseError.message}. Response: ${content.substring(0, 500)}`);
    }

    return {
      generatedAt: new Date(),
      ...recommendations
    };

  } catch (error) {
    console.error('❌ [Claude Tax Planning] Error:', error);
    throw error; // Re-throw the error to be handled by the calling function
  }
};

/**
 * Get fallback tax planning recommendations when Claude API fails
 */
const getFallbackRecommendations = () => {
  console.log('🔄 [Fallback] Generating fallback recommendations');
  return {
    generatedAt: new Date(),
    recommendations: [
      {
        category: 'deduction_optimization',
        priority: 'high',
        title: 'Maximize Section 80C Deductions',
        description: 'Consider increasing PPF, EPF, or ELSS investments to reach the ₹1.5L limit for maximum tax savings.',
        potentialSavings: 15000,
        implementationSteps: [
          'Review current 80C investments',
          'Calculate shortfall to reach ₹1.5L limit',
          'Invest in suitable instruments (PPF, EPF, ELSS)',
          'Complete investments before March 31st'
        ],
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        riskLevel: 'low'
      },
      {
        category: 'deduction_optimization',
        priority: 'medium',
        title: 'Optimize Health Insurance Deductions',
        description: 'Review and potentially increase health insurance coverage to maximize Section 80D deductions.',
        potentialSavings: 8000,
        implementationSteps: [
          'Review current health insurance coverage',
          'Check if parents are covered under senior citizen category',
          'Consider additional coverage if needed',
          'Ensure timely premium payments'
        ],
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        riskLevel: 'low'
      },
      {
        category: 'investment_strategy',
        priority: 'medium',
        title: 'Consider NPS Additional Contribution',
        description: 'Evaluate additional NPS contribution under Section 80CCD(1B) for additional ₹50,000 deduction.',
        potentialSavings: 5000,
        implementationSteps: [
          'Check current NPS contribution',
          'Evaluate additional ₹50,000 contribution',
          'Consider long-term retirement planning benefits',
          'Complete contribution before financial year end'
        ],
        deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        riskLevel: 'medium'
      }
    ],
    summary: 'Basic tax planning recommendations based on available data. Focus on maximizing tax deductions and optimizing investment strategy for better tax efficiency.',
    totalPotentialSavings: 28000,
    confidenceScore: 75
  };
};

/**
 * Create or update tax planning with manual advisor inputs
 * @route POST /api/tax-planning/client/:clientId/manual-inputs
 * @access Private (Advisor only)
 */
const saveManualAdvisorInputs = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { taxYear, manualInputs } = req.body;
    const advisorId = req.advisor.id;

    console.log('✍️ [Tax Planning Manual] Saving advisor inputs:', {
      clientId,
      advisorId,
      taxYear: taxYear || 'current',
      hasManualInputs: !!manualInputs,
      timestamp: new Date().toISOString()
    });

    // Validate input
    if (!manualInputs) {
      return res.status(400).json({
        success: false,
        message: 'Manual inputs are required'
      });
    }

    // Update tax planning with manual inputs (preserve existing AI recommendations)
    const taxPlanning = await TaxPlanning.findOneAndUpdate(
      { 
        clientId: clientId,
        taxYear: taxYear || new Date().getFullYear().toString()
      },
      {
        $set: {
          manualAdvisorInputs: {
            ...manualInputs,
            recommendations: manualInputs.recommendations?.map(rec => ({
              ...rec,
              updatedAt: new Date()
            })) || []
          },
          updatedBy: advisorId,
          lastReviewed: new Date()
        }
      },
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    );

    console.log('✅ [Tax Planning Manual] Advisor inputs saved:', {
      clientId,
      taxPlanningId: taxPlanning._id,
      recommendationsCount: manualInputs.recommendations?.length || 0
    });

    res.json({
      success: true,
      message: 'Manual advisor inputs saved successfully',
      data: {
        taxPlanning
      }
    });

  } catch (error) {
    console.error('❌ [Tax Planning Manual] Error saving inputs:', error);
    logger.error('Tax Planning Manual Inputs Error', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.clientId,
      advisorId: req.advisor?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to save manual advisor inputs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get tax planning history for a client
 * @route GET /api/tax-planning/client/:clientId/history
 * @access Private (Advisor only)
 */
const getTaxPlanningHistory = async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = req.advisor.id;

    console.log('📊 [Tax Planning History] Fetching history:', {
      clientId,
      advisorId,
      timestamp: new Date().toISOString()
    });

    // Get all tax planning records for the client
    const taxPlanningHistory = await TaxPlanning.find({
      clientId: clientId,
      advisorId: advisorId,
      isActive: true
    })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ taxYear: -1, createdAt: -1 })
    .lean();

    console.log('✅ [Tax Planning History] History retrieved:', {
      clientId,
      recordsCount: taxPlanningHistory.length
    });

    res.json({
      success: true,
      message: 'Tax planning history retrieved successfully',
      data: {
        taxPlanningHistory
      }
    });

  } catch (error) {
    console.error('❌ [Tax Planning History] Error:', error);
    logger.error('Tax Planning History Error', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.clientId,
      advisorId: req.advisor?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tax planning history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Generate comprehensive tax planning visualization data
 */
const generateTaxPlanningVisualization = (taxPlanningData, aiRecommendations, taxPlanning) => {
  try {
    console.log('📊 [Visualization] Generating BEFORE vs AFTER comparison...');
    
    // Calculate current tax scenario
    const currentScenario = calculateCurrentTaxScenario(taxPlanningData);
    
    // Calculate optimized tax scenario
    const optimizedScenario = calculateOptimizedTaxScenario(taxPlanningData, aiRecommendations);
    
    // Generate chart data
    const charts = generateChartData(currentScenario, optimizedScenario, aiRecommendations);
    
    // Generate implementation timeline
    const implementationTimeline = generateImplementationTimeline(aiRecommendations);
    
    return {
      beforeAfterComparison: {
        current: currentScenario,
        optimized: optimizedScenario,
        totalSavings: currentScenario.totalTaxLiability - optimizedScenario.totalTaxLiability,
        savingsPercentage: ((currentScenario.totalTaxLiability - optimizedScenario.totalTaxLiability) / currentScenario.totalTaxLiability * 100).toFixed(1)
      },
      charts: charts,
      implementationTimeline: implementationTimeline,
      summary: {
        totalRecommendations: aiRecommendations.recommendations?.length || 0,
        highPriorityRecommendations: aiRecommendations.recommendations?.filter(r => r.priority === 'high').length || 0,
        estimatedImplementationTime: calculateImplementationTime(aiRecommendations),
        riskLevel: calculateOverallRiskLevel(aiRecommendations)
      }
    };
    
  } catch (error) {
    console.error('❌ [Visualization] Error generating visualization data:', error);
    return {
      beforeAfterComparison: null,
      charts: null,
      implementationTimeline: null,
      error: error.message
    };
  }
};

/**
 * Calculate current tax scenario
 */
const calculateCurrentTaxScenario = (taxPlanningData) => {
  const annualIncome = taxPlanningData.incomeAnalysis.annualIncome || 0;
  const currentDeductions = calculateCurrentDeductions(taxPlanningData);
  const taxableIncome = Math.max(0, annualIncome - currentDeductions);
  const taxLiability = calculateTaxLiability(taxableIncome, taxPlanningData.personalInfo);
  
  return {
    annualIncome: annualIncome,
    currentDeductions: currentDeductions,
    taxableIncome: taxableIncome,
    totalTaxLiability: taxLiability,
    effectiveTaxRate: annualIncome > 0 ? (taxLiability / annualIncome * 100).toFixed(2) : 0,
    deductionUtilization: {
      section80C: Math.min(currentDeductions.section80C, 150000),
      section80D: Math.min(currentDeductions.section80D, 25000),
      section80CCD1B: Math.min(currentDeductions.section80CCD1B, 50000),
      total: currentDeductions.total
    }
  };
};

/**
 * Calculate optimized tax scenario
 */
const calculateOptimizedTaxScenario = (taxPlanningData, aiRecommendations) => {
  const annualIncome = taxPlanningData.incomeAnalysis.annualIncome || 0;
  const currentDeductions = calculateCurrentDeductions(taxPlanningData);
  const additionalDeductions = calculateAdditionalDeductions(aiRecommendations);
  const optimizedDeductions = {
    section80C: Math.min(currentDeductions.section80C + additionalDeductions.section80C, 150000),
    section80D: Math.min(currentDeductions.section80D + additionalDeductions.section80D, 25000),
    section80CCD1B: Math.min(currentDeductions.section80CCD1B + additionalDeductions.section80CCD1B, 50000),
    total: currentDeductions.total + additionalDeductions.total
  };
  
  const taxableIncome = Math.max(0, annualIncome - optimizedDeductions.total);
  const taxLiability = calculateTaxLiability(taxableIncome, taxPlanningData.personalInfo);
  
  return {
    annualIncome: annualIncome,
    optimizedDeductions: optimizedDeductions,
    additionalDeductions: additionalDeductions,
    taxableIncome: taxableIncome,
    totalTaxLiability: taxLiability,
    effectiveTaxRate: annualIncome > 0 ? (taxLiability / annualIncome * 100).toFixed(2) : 0,
    deductionUtilization: {
      section80C: optimizedDeductions.section80C,
      section80D: optimizedDeductions.section80D,
      section80CCD1B: optimizedDeductions.section80CCD1B,
      total: optimizedDeductions.total
    }
  };
};

/**
 * Calculate current deductions from client data
 */
const calculateCurrentDeductions = (taxPlanningData) => {
  const investments = taxPlanningData.taxSavingInvestments;
  
  const section80C = Math.min(
    (investments.section80C.ppf || 0) +
    (investments.section80C.epf || 0) +
    (investments.section80C.elss || 0) +
    (investments.section80C.nsc || 0) +
    (investments.section80C.lifeInsurance || 0) +
    (investments.section80C.tuitionFees || 0) +
    (investments.section80C.principalRepayment || 0),
    150000
  );
  
  const section80D = Math.min(
    (investments.section80D.selfFamily || 0) +
    (investments.section80D.parents || 0) +
    (investments.section80D.seniorCitizen || 0),
    25000
  );
  
  const section80CCD1B = Math.min(investments.section80CCD1B.npsAdditional || 0, 50000);
  
  return {
    section80C: section80C,
    section80D: section80D,
    section80CCD1B: section80CCD1B,
    total: section80C + section80D + section80CCD1B
  };
};

/**
 * Calculate additional deductions from AI recommendations
 */
const calculateAdditionalDeductions = (aiRecommendations) => {
  let additionalDeductions = {
    section80C: 0,
    section80D: 0,
    section80CCD1B: 0,
    total: 0
  };
  
  aiRecommendations.recommendations?.forEach(rec => {
    if (rec.category === 'deduction_optimization') {
      if (rec.title.toLowerCase().includes('80c') || rec.title.toLowerCase().includes('ppf') || rec.title.toLowerCase().includes('elss')) {
        additionalDeductions.section80C += rec.potentialSavings || 0;
      } else if (rec.title.toLowerCase().includes('80d') || rec.title.toLowerCase().includes('health')) {
        additionalDeductions.section80D += rec.potentialSavings || 0;
      } else if (rec.title.toLowerCase().includes('nps') || rec.title.toLowerCase().includes('80ccd')) {
        additionalDeductions.section80CCD1B += rec.potentialSavings || 0;
      }
    }
  });
  
  additionalDeductions.total = additionalDeductions.section80C + additionalDeductions.section80D + additionalDeductions.section80CCD1B;
  
  return additionalDeductions;
};

/**
 * Calculate tax liability based on income and personal info
 */
const calculateTaxLiability = (taxableIncome, personalInfo) => {
  const age = personalInfo?.dateOfBirth ? 
    new Date().getFullYear() - new Date(personalInfo.dateOfBirth).getFullYear() : 30;
  
  let tax = 0;
  
  if (age >= 80) {
    // Super Senior Citizen (80+ years)
    if (taxableIncome > 1000000) tax += (taxableIncome - 1000000) * 0.3;
    if (taxableIncome > 500000) tax += Math.min(taxableIncome - 500000, 500000) * 0.2;
  } else if (age >= 60) {
    // Senior Citizen (60-79 years)
    if (taxableIncome > 1000000) tax += (taxableIncome - 1000000) * 0.3;
    if (taxableIncome > 500000) tax += Math.min(taxableIncome - 500000, 500000) * 0.2;
    if (taxableIncome > 300000) tax += Math.min(taxableIncome - 300000, 200000) * 0.1;
  } else {
    // Normal taxpayer
    if (taxableIncome > 1000000) tax += (taxableIncome - 1000000) * 0.3;
    if (taxableIncome > 500000) tax += Math.min(taxableIncome - 500000, 500000) * 0.2;
    if (taxableIncome > 250000) tax += Math.min(taxableIncome - 250000, 250000) * 0.1;
  }
  
  // Apply rebate 87A if applicable
  if (taxableIncome <= 500000) {
    tax = Math.max(0, tax - 12500);
  }
  
  // Add 4% cess
  tax += tax * 0.04;
  
  return Math.round(tax);
};

/**
 * Generate chart data for visualizations
 */
const generateChartData = (currentScenario, optimizedScenario, aiRecommendations) => {
  return {
    taxLiabilityComparison: {
      type: 'bar',
      title: 'Tax Liability: Before vs After',
      data: {
        labels: ['Current Tax', 'Optimized Tax', 'Savings'],
        datasets: [{
          label: 'Amount (₹)',
          data: [
            currentScenario.totalTaxLiability,
            optimizedScenario.totalTaxLiability,
            currentScenario.totalTaxLiability - optimizedScenario.totalTaxLiability
          ],
          backgroundColor: ['#ef4444', '#10b981', '#3b82f6'],
          borderColor: ['#dc2626', '#059669', '#2563eb'],
          borderWidth: 2
        }]
      }
    },
    deductionUtilization: {
      type: 'doughnut',
      title: 'Deduction Utilization',
      data: {
        labels: ['Section 80C', 'Section 80D', 'Section 80CCD(1B)', 'Unused'],
        datasets: [{
          data: [
            optimizedScenario.deductionUtilization.section80C,
            optimizedScenario.deductionUtilization.section80D,
            optimizedScenario.deductionUtilization.section80CCD1B,
            Math.max(0, 225000 - optimizedScenario.deductionUtilization.total)
          ],
          backgroundColor: ['#8b5cf6', '#06b6d4', '#f59e0b', '#e5e7eb'],
          borderWidth: 2
        }]
      }
    },
    savingsBreakdown: {
      type: 'pie',
      title: 'Savings by Category',
      data: {
        labels: aiRecommendations.recommendations?.map(r => r.title) || [],
        datasets: [{
          data: aiRecommendations.recommendations?.map(r => r.potentialSavings) || [],
          backgroundColor: [
            '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
            '#3b82f6', '#8b5cf6', '#ec4899', '#84cc16', '#f59e0b'
          ],
          borderWidth: 2
        }]
      }
    },
    implementationTimeline: {
      type: 'line',
      title: 'Implementation Timeline',
      data: {
        labels: ['Month 1', 'Month 2', 'Month 3', 'Month 6', 'Month 12'],
        datasets: [{
          label: 'Cumulative Savings (₹)',
          data: [0, 5000, 15000, 25000, 35000], // This would be calculated based on recommendations
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }]
      }
    }
  };
};

/**
 * Generate implementation timeline
 */
const generateImplementationTimeline = (aiRecommendations) => {
  const timeline = [];
  const currentDate = new Date();
  
  aiRecommendations.recommendations?.forEach((rec, index) => {
    const deadline = rec.deadline ? new Date(rec.deadline) : new Date(currentDate.getTime() + (30 * (index + 1) * 24 * 60 * 60 * 1000));
    
    timeline.push({
      id: index + 1,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      deadline: deadline.toISOString().split('T')[0],
      potentialSavings: rec.potentialSavings,
      status: 'pending',
      category: rec.category,
      riskLevel: rec.riskLevel
    });
  });
  
  return timeline.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
};

/**
 * Calculate implementation time
 */
const calculateImplementationTime = (aiRecommendations) => {
  const recommendations = aiRecommendations.recommendations || [];
  if (recommendations.length === 0) return '0 months';
  
  const deadlines = recommendations.map(r => r.deadline).filter(d => d);
  if (deadlines.length === 0) return '3-6 months';
  
  const maxDeadline = new Date(Math.max(...deadlines.map(d => new Date(d))));
  const currentDate = new Date();
  const diffMonths = (maxDeadline.getFullYear() - currentDate.getFullYear()) * 12 + 
                     (maxDeadline.getMonth() - currentDate.getMonth());
  
  return `${Math.max(1, diffMonths)} months`;
};

/**
 * Calculate overall risk level
 */
const calculateOverallRiskLevel = (aiRecommendations) => {
  const recommendations = aiRecommendations.recommendations || [];
  if (recommendations.length === 0) return 'low';
  
  const riskCounts = recommendations.reduce((acc, rec) => {
    acc[rec.riskLevel] = (acc[rec.riskLevel] || 0) + 1;
    return acc;
  }, {});
  
  if (riskCounts.high > 0) return 'high';
  if (riskCounts.medium > 0) return 'medium';
  return 'low';
};

module.exports = {
  getClientTaxPlanningData,
  generateAIRecommendations,
  saveManualAdvisorInputs,
  getTaxPlanningHistory
};
