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

    // Get client tax planning data
    const taxPlanningResponse = await getClientTaxPlanningData(req, res);
    if (!taxPlanningResponse.success) {
      return res.status(400).json(taxPlanningResponse);
    }

    const { taxPlanningData } = taxPlanningResponse.data;

    // Generate AI recommendations using Claude API
    const aiRecommendations = await generateClaudeTaxRecommendations(taxPlanningData);

    // Save or update tax planning with AI recommendations
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
          maritalStatus: taxPlanningData.personalInfo.maritalStatus,
          numberOfDependents: taxPlanningData.personalInfo.numberOfDependents
        },
        incomeAnalysis: {
          totalAnnualIncome: taxPlanningData.incomeAnalysis.annualIncome,
          monthlyIncome: taxPlanningData.incomeAnalysis.totalMonthlyIncome,
          incomeType: taxPlanningData.incomeAnalysis.incomeType,
          employerBusinessName: taxPlanningData.incomeAnalysis.employerBusinessName,
          additionalIncome: taxPlanningData.incomeAnalysis.additionalIncome
        },
        taxSavingInvestments: taxPlanningData.taxSavingInvestments,
        capitalGainsAnalysis: taxPlanningData.capitalGainsAnalysis,
        businessTaxConsiderations: taxPlanningData.businessTaxConsiderations,
        aiRecommendations: aiRecommendations,
        createdBy: advisorId,
        updatedBy: advisorId
      },
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    );

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
        taxPlanning,
        aiRecommendations
      }
    });

  } catch (error) {
    console.error('❌ [Tax Planning AI] Error generating recommendations:', error);
    logger.error('Tax Planning AI Recommendations Error', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.clientId,
      advisorId: req.advisor?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate AI recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Generate Claude AI tax planning recommendations
 */
const generateClaudeTaxRecommendations = async (taxPlanningData) => {
  try {
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    // Prepare comprehensive prompt for Claude
    const prompt = `
You are a tax planning expert AI assistant. Analyze the following client data and provide comprehensive tax planning recommendations.

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

Please provide comprehensive tax planning recommendations in the following JSON format:

{
  "recommendations": [
    {
      "category": "deduction_optimization|investment_strategy|capital_gains|business_tax|estate_planning|compliance",
      "priority": "high|medium|low",
      "title": "Brief recommendation title",
      "description": "Detailed explanation of the recommendation",
      "potentialSavings": 0,
      "implementationSteps": ["Step 1", "Step 2", "Step 3"],
      "deadline": "2024-12-31",
      "riskLevel": "low|medium|high"
    }
  ],
  "summary": "Overall tax planning strategy summary",
  "totalPotentialSavings": 0,
  "confidenceScore": 85
}

Focus on:
1. Maximizing tax deductions under various sections (80C, 80D, 80E, 24B, etc.)
2. Optimizing capital gains tax through proper timing and tax-loss harvesting
3. Business tax optimization if applicable
4. Estate tax planning strategies
5. Compliance requirements and deadlines
6. Risk assessment for each recommendation

Provide specific, actionable recommendations with realistic savings estimates.
`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const claudeResponse = await response.json();
    const content = claudeResponse.content[0].text;

    // Parse Claude's response
    let recommendations;
    try {
      // Extract JSON from Claude's response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in Claude response');
      }
    } catch (parseError) {
      console.error('❌ [Claude] Error parsing response:', parseError);
      // Fallback recommendations
      recommendations = {
        recommendations: [
          {
            category: 'deduction_optimization',
            priority: 'high',
            title: 'Maximize Section 80C Deductions',
            description: 'Consider increasing PPF, EPF, or ELSS investments to reach the ₹1.5L limit for maximum tax savings.',
            potentialSavings: 15000,
            implementationSteps: ['Review current 80C investments', 'Calculate shortfall', 'Invest in suitable instruments'],
            deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            riskLevel: 'low'
          }
        ],
        summary: 'Focus on maximizing tax deductions and optimizing investment strategy for better tax efficiency.',
        totalPotentialSavings: 15000,
        confidenceScore: 75
      };
    }

    return {
      generatedAt: new Date(),
      ...recommendations
    };

  } catch (error) {
    console.error('❌ [Claude Tax Planning] Error:', error);
    
    // Return fallback recommendations
    return {
      generatedAt: new Date(),
      recommendations: [
        {
          category: 'deduction_optimization',
          priority: 'high',
          title: 'Review Tax-Saving Investments',
          description: 'Analyze current tax-saving investments and identify opportunities to maximize deductions.',
          potentialSavings: 10000,
          implementationSteps: ['Review 80C investments', 'Check 80D health insurance', 'Consider NPS additional contribution'],
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          riskLevel: 'low'
        }
      ],
      summary: 'Basic tax planning recommendations based on available data. Please review and customize as needed.',
      totalPotentialSavings: 10000,
      confidenceScore: 60
    };
  }
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

    // Update tax planning with manual inputs
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

module.exports = {
  getClientTaxPlanningData,
  generateAIRecommendations,
  saveManualAdvisorInputs,
  getTaxPlanningHistory
};
