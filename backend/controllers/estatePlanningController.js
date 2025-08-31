// File: backend/controllers/estatePlanningController.js
/**
 * Estate Planning Controller
 * Handles estate planning data aggregation and analysis for clients
 */

const Client = require('../models/Client');
const FinancialPlan = require('../models/FinancialPlan');
const ClientInvitation = require('../models/ClientInvitation');
const EstateInformation = require('../models/EstateInformation');
const { logger } = require('../utils/logger');

/**
 * Get comprehensive estate planning data for a specific client
 * @route GET /api/estate-planning/client/:clientId
 * @access Private (Advisor only)
 */
const getClientEstatePlanningData = async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = req.advisor.id;

    console.log('🏛️ [Estate Planning] Fetching data for client:', {
      clientId,
      advisorId,
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
      console.log('❌ [Estate Planning] Client not found:', { clientId, advisorId });
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

    console.log('✅ [Estate Planning] Data found:', {
      clientId,
      clientName: `${client.firstName} ${client.lastName}`,
      hasFinancialPlans: financialPlans.length > 0,
      hasInvitationData: !!clientInvitation,
      hasCASData: !!client.casData?.parsedData
    });

    // Aggregate estate planning data
    const estatePlanningData = await aggregateEstatePlanningData(client, financialPlans, clientInvitation);

    res.json({
      success: true,
      data: {
        clientInfo: {
          id: client._id,
          name: `${client.firstName} ${client.lastName}`,
          email: client.email,
          phoneNumber: client.phoneNumber,
          dateOfBirth: client.dateOfBirth,
          panNumber: client.panNumber,
          maritalStatus: client.maritalStatus,
          numberOfDependents: client.numberOfDependents
        },
        estatePlanningData
      }
    });

  } catch (error) {
    console.error('❌ [Estate Planning] Error:', error);
    logger.error('Estate Planning Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch estate planning data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Aggregate comprehensive estate planning data from multiple sources
 */
const aggregateEstatePlanningData = async (client, financialPlans, clientInvitation) => {
  try {
    // Get the most recent financial plan for current data
    const latestPlan = financialPlans.length > 0 ? financialPlans[0] : null;

    // Personal Information for Estate Planning
    const personalInfo = {
      fullName: `${client.firstName} ${client.lastName}`,
      email: client.email,
      phoneNumber: client.phoneNumber,
      dateOfBirth: client.dateOfBirth,
      age: client.dateOfBirth ? calculateAge(client.dateOfBirth) : null,
      panNumber: client.panNumber,
      maritalStatus: client.maritalStatus,
      numberOfDependents: client.numberOfDependents,
      address: client.address
    };

    // Financial Assets Analysis
    const financialAssets = analyzeFinancialAssets(client, latestPlan);

    // Liabilities Analysis
    const liabilities = analyzeLiabilities(client, latestPlan);

    // Income & Cash Flow Analysis
    const incomeAnalysis = analyzeIncomeAndCashFlow(client, latestPlan);

    // Investment Portfolio Analysis
    const investmentPortfolio = analyzeInvestmentPortfolio(client, latestPlan);

    // Risk Assessment
    const riskAssessment = analyzeRiskProfile(client, latestPlan);

    // Estate Planning Recommendations
    const recommendations = generateEstatePlanningRecommendations(
      personalInfo,
      financialAssets,
      liabilities,
      incomeAnalysis,
      investmentPortfolio,
      riskAssessment
    );

    // CAS Data Integration (if available)
    const casData = client.casData?.parsedData ? {
      totalPortfolioValue: client.casData.parsedData.summary?.total_value || 0,
      dematAccounts: client.casData.parsedData.demat_accounts?.length || 0,
      mutualFunds: client.casData.parsedData.mutual_funds?.length || 0,
      assetAllocation: client.casData.parsedData.summary?.asset_allocation || {},
      lastUpdated: client.casData.lastParsedAt
    } : null;

    return {
      personalInfo,
      financialAssets,
      liabilities,
      incomeAnalysis,
      investmentPortfolio,
      riskAssessment,
      casData,
      recommendations,
      dataSources: {
        hasFinancialPlan: !!latestPlan,
        hasCASData: !!client.casData?.parsedData,
        hasInvitationData: !!clientInvitation,
        lastUpdated: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ [Estate Planning] Data aggregation error:', error);
    throw error;
  }
};

/**
 * Analyze financial assets for estate planning
 */
const analyzeFinancialAssets = (client, latestPlan) => {
  const assets = {
    liquidAssets: 0,
    investmentAssets: 0,
    realEstateAssets: 0,
    retirementAssets: 0,
    totalAssets: 0,
    breakdown: {}
  };

  // Cash and Bank Savings
  assets.liquidAssets = client.assets?.cashBankSavings || 0;
  assets.breakdown.cashBankSavings = assets.liquidAssets;

  // Real Estate
  assets.realEstateAssets = client.assets?.realEstate || 0;
  assets.breakdown.realEstate = assets.realEstateAssets;

  // Investment Assets
  if (client.assets?.investments) {
    const investments = client.assets.investments;
    
    // Equity Investments
    const equityValue = (investments.equity?.mutualFunds || 0) + (investments.equity?.directStocks || 0);
    assets.investmentAssets += equityValue;
    assets.breakdown.equityMutualFunds = investments.equity?.mutualFunds || 0;
    assets.breakdown.directStocks = investments.equity?.directStocks || 0;

    // Fixed Income Investments
    const fixedIncomeValue = (investments.fixedIncome?.ppf || 0) + 
                           (investments.fixedIncome?.epf || 0) + 
                           (investments.fixedIncome?.nps || 0) + 
                           (investments.fixedIncome?.fixedDeposits || 0) + 
                           (investments.fixedIncome?.bondsDebentures || 0) + 
                           (investments.fixedIncome?.nsc || 0);
    
    assets.investmentAssets += fixedIncomeValue;
    assets.breakdown.ppf = investments.fixedIncome?.ppf || 0;
    assets.breakdown.epf = investments.fixedIncome?.epf || 0;
    assets.breakdown.nps = investments.fixedIncome?.nps || 0;
    assets.breakdown.fixedDeposits = investments.fixedIncome?.fixedDeposits || 0;
    assets.breakdown.bondsDebentures = investments.fixedIncome?.bondsDebentures || 0;
    assets.breakdown.nsc = investments.fixedIncome?.nsc || 0;

    // Other Investments
    const otherInvestments = (investments.other?.ulip || 0) + (investments.other?.otherInvestments || 0);
    assets.investmentAssets += otherInvestments;
    assets.breakdown.ulip = investments.other?.ulip || 0;
    assets.breakdown.otherInvestments = investments.other?.otherInvestments || 0;
  }

  // Retirement Assets (from financial plan if available)
  if (latestPlan?.clientDataSnapshot?.investments) {
    const planInvestments = latestPlan.clientDataSnapshot.investments;
    assets.retirementAssets = (planInvestments.ppf?.currentBalance || 0) + 
                             (planInvestments.epf?.currentBalance || 0) + 
                             (planInvestments.nps?.currentBalance || 0);
  }

  // Calculate total assets
  assets.totalAssets = assets.liquidAssets + assets.investmentAssets + assets.realEstateAssets + assets.retirementAssets;

  return assets;
};

/**
 * Analyze liabilities for estate planning
 */
const analyzeLiabilities = (client, latestPlan) => {
  const liabilities = {
    securedDebt: 0,
    unsecuredDebt: 0,
    totalLiabilities: 0,
    monthlyEMIs: 0,
    breakdown: {}
  };

  if (client.debtsAndLiabilities) {
    const debts = client.debtsAndLiabilities;

    // Secured Debts (Home Loan, Car Loan)
    if (debts.homeLoan?.hasLoan) {
      liabilities.securedDebt += debts.homeLoan.outstandingAmount || 0;
      liabilities.monthlyEMIs += debts.homeLoan.monthlyEMI || 0;
      liabilities.breakdown.homeLoan = {
        outstandingAmount: debts.homeLoan.outstandingAmount || 0,
        monthlyEMI: debts.homeLoan.monthlyEMI || 0,
        interestRate: debts.homeLoan.interestRate || 0,
        remainingTenure: debts.homeLoan.remainingTenure || 0
      };
    }

    if (debts.carLoan?.hasLoan) {
      liabilities.securedDebt += debts.carLoan.outstandingAmount || 0;
      liabilities.monthlyEMIs += debts.carLoan.monthlyEMI || 0;
      liabilities.breakdown.carLoan = {
        outstandingAmount: debts.carLoan.outstandingAmount || 0,
        monthlyEMI: debts.carLoan.monthlyEMI || 0,
        interestRate: debts.carLoan.interestRate || 0
      };
    }

    // Unsecured Debts (Personal Loan, Credit Cards, etc.)
    if (debts.personalLoan?.hasLoan) {
      liabilities.unsecuredDebt += debts.personalLoan.outstandingAmount || 0;
      liabilities.monthlyEMIs += debts.personalLoan.monthlyEMI || 0;
      liabilities.breakdown.personalLoan = {
        outstandingAmount: debts.personalLoan.outstandingAmount || 0,
        monthlyEMI: debts.personalLoan.monthlyEMI || 0,
        interestRate: debts.personalLoan.interestRate || 0
      };
    }

    if (debts.creditCards?.hasDebt) {
      liabilities.unsecuredDebt += debts.creditCards.totalOutstanding || 0;
      liabilities.monthlyEMIs += debts.creditCards.monthlyPayment || 0;
      liabilities.breakdown.creditCards = {
        totalOutstanding: debts.creditCards.totalOutstanding || 0,
        monthlyPayment: debts.creditCards.monthlyPayment || 0,
        averageInterestRate: debts.creditCards.averageInterestRate || 0
      };
    }

    if (debts.educationLoan?.hasLoan) {
      liabilities.unsecuredDebt += debts.educationLoan.outstandingAmount || 0;
      liabilities.monthlyEMIs += debts.educationLoan.monthlyEMI || 0;
      liabilities.breakdown.educationLoan = {
        outstandingAmount: debts.educationLoan.outstandingAmount || 0,
        monthlyEMI: debts.educationLoan.monthlyEMI || 0,
        interestRate: debts.educationLoan.interestRate || 0
      };
    }

    if (debts.otherLoans?.hasLoan) {
      liabilities.unsecuredDebt += debts.otherLoans.outstandingAmount || 0;
      liabilities.monthlyEMIs += debts.otherLoans.monthlyEMI || 0;
      liabilities.breakdown.otherLoans = {
        outstandingAmount: debts.otherLoans.outstandingAmount || 0,
        monthlyEMI: debts.otherLoans.monthlyEMI || 0,
        interestRate: debts.otherLoans.interestRate || 0,
        loanType: debts.otherLoans.loanType || 'Other'
      };
    }
  }

  liabilities.totalLiabilities = liabilities.securedDebt + liabilities.unsecuredDebt;

  return liabilities;
};

/**
 * Analyze income and cash flow for estate planning
 */
const analyzeIncomeAndCashFlow = (client, latestPlan) => {
  const incomeAnalysis = {
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySurplus: 0,
    annualIncome: 0,
    incomeStability: 'Unknown',
    expenseBreakdown: {},
    cashFlowHealth: 'Unknown'
  };

  // Get income data
  if (latestPlan?.clientDataSnapshot?.financialInfo) {
    const financialInfo = latestPlan.clientDataSnapshot.financialInfo;
    incomeAnalysis.monthlyIncome = financialInfo.totalMonthlyIncome || 0;
    incomeAnalysis.monthlyExpenses = financialInfo.totalMonthlyExpenses || 0;
    incomeAnalysis.expenseBreakdown = financialInfo.expenseBreakdown || {};
    incomeAnalysis.incomeType = financialInfo.incomeType || 'Unknown';
  } else {
    // Fallback to client data
    incomeAnalysis.monthlyIncome = client.totalMonthlyIncome || 0;
    incomeAnalysis.monthlyExpenses = client.totalMonthlyExpenses || 0;
    incomeAnalysis.incomeType = client.incomeType || 'Unknown';
  }

  // Calculate derived metrics
  incomeAnalysis.monthlySurplus = incomeAnalysis.monthlyIncome - incomeAnalysis.monthlyExpenses;
  incomeAnalysis.annualIncome = incomeAnalysis.monthlyIncome * 12;

  // Assess income stability
  if (incomeAnalysis.incomeType === 'Salaried') {
    incomeAnalysis.incomeStability = 'Stable';
  } else if (incomeAnalysis.incomeType === 'Business') {
    incomeAnalysis.incomeStability = 'Variable';
  } else if (incomeAnalysis.incomeType === 'Freelance') {
    incomeAnalysis.incomeStability = 'Unstable';
  }

  // Assess cash flow health
  const surplusRatio = incomeAnalysis.monthlyIncome > 0 ? 
    (incomeAnalysis.monthlySurplus / incomeAnalysis.monthlyIncome) * 100 : 0;
  
  if (surplusRatio >= 20) {
    incomeAnalysis.cashFlowHealth = 'Excellent';
  } else if (surplusRatio >= 10) {
    incomeAnalysis.cashFlowHealth = 'Good';
  } else if (surplusRatio >= 0) {
    incomeAnalysis.cashFlowHealth = 'Fair';
  } else {
    incomeAnalysis.cashFlowHealth = 'Poor';
  }

  return incomeAnalysis;
};

/**
 * Analyze investment portfolio for estate planning
 */
const analyzeInvestmentPortfolio = (client, latestPlan) => {
  const portfolio = {
    totalValue: 0,
    assetAllocation: {},
    riskLevel: 'Unknown',
    diversification: 'Unknown',
    growthPotential: 'Unknown',
    liquidity: 'Unknown'
  };

  // Get portfolio data from financial plan if available
  if (latestPlan?.planDetails?.cashFlowPlan?.investmentRecommendations) {
    const investments = latestPlan.planDetails.cashFlowPlan.investmentRecommendations;
    
    portfolio.totalValue = investments.totalMonthlyInvestment * 12; // Annual investment
    portfolio.assetAllocation = investments.assetAllocation || {};
    
    // Assess risk level based on asset allocation
    const equityPercentage = portfolio.assetAllocation.equity || 0;
    if (equityPercentage >= 70) {
      portfolio.riskLevel = 'High';
    } else if (equityPercentage >= 40) {
      portfolio.riskLevel = 'Medium';
    } else {
      portfolio.riskLevel = 'Low';
    }

    // Assess diversification
    const assetTypes = Object.keys(portfolio.assetAllocation).length;
    if (assetTypes >= 4) {
      portfolio.diversification = 'Well Diversified';
    } else if (assetTypes >= 2) {
      portfolio.diversification = 'Moderately Diversified';
    } else {
      portfolio.diversification = 'Concentrated';
    }
  }

  // Assess growth potential
  if (portfolio.riskLevel === 'High') {
    portfolio.growthPotential = 'High';
  } else if (portfolio.riskLevel === 'Medium') {
    portfolio.growthPotential = 'Medium';
  } else {
    portfolio.growthPotential = 'Low';
  }

  // Assess liquidity
  const liquidAssets = client.assets?.cashBankSavings || 0;
  const totalAssets = portfolio.totalValue + liquidAssets;
  
  if (totalAssets > 0) {
    const liquidityRatio = (liquidAssets / totalAssets) * 100;
    if (liquidityRatio >= 20) {
      portfolio.liquidity = 'High';
    } else if (liquidityRatio >= 10) {
      portfolio.liquidity = 'Medium';
    } else {
      portfolio.liquidity = 'Low';
    }
  }

  return portfolio;
};

/**
 * Analyze risk profile for estate planning
 */
const analyzeRiskProfile = (client, latestPlan) => {
  const riskProfile = {
    investmentExperience: client.enhancedRiskProfile?.investmentExperience || 'Not specified',
    riskTolerance: client.enhancedRiskProfile?.riskTolerance || 'Not specified',
    monthlyInvestmentCapacity: client.enhancedRiskProfile?.monthlyInvestmentCapacity || 0,
    overallRiskScore: 0,
    riskFactors: []
  };

  // Calculate overall risk score
  let riskScore = 0;

  // Investment experience factor
  if (riskProfile.investmentExperience.includes('Expert')) {
    riskScore += 3;
  } else if (riskProfile.investmentExperience.includes('Experienced')) {
    riskScore += 2;
  } else if (riskProfile.investmentExperience.includes('Intermediate')) {
    riskScore += 1;
  }

  // Risk tolerance factor
  if (riskProfile.riskTolerance === 'Aggressive') {
    riskScore += 3;
  } else if (riskProfile.riskTolerance === 'Moderate') {
    riskScore += 2;
  } else if (riskProfile.riskTolerance === 'Conservative') {
    riskScore += 1;
  }

  // Investment capacity factor
  if (riskProfile.monthlyInvestmentCapacity >= 50000) {
    riskScore += 2;
  } else if (riskProfile.monthlyInvestmentCapacity >= 25000) {
    riskScore += 1;
  }

  riskProfile.overallRiskScore = Math.min(riskScore, 8); // Max score of 8

  // Identify risk factors
  if (riskProfile.investmentExperience === 'Not specified') {
    riskProfile.riskFactors.push('Limited investment experience');
  }
  if (riskProfile.riskTolerance === 'Not specified') {
    riskProfile.riskFactors.push('Risk tolerance not assessed');
  }
  if (riskProfile.monthlyInvestmentCapacity === 0) {
    riskProfile.riskFactors.push('No investment capacity identified');
  }

  return riskProfile;
};

/**
 * Generate estate planning recommendations
 */
const generateEstatePlanningRecommendations = (personalInfo, financialAssets, liabilities, incomeAnalysis, investmentPortfolio, riskAssessment) => {
  const recommendations = {
    immediateActions: [],
    shortTermGoals: [],
    longTermGoals: [],
    riskMitigation: [],
    taxOptimization: [],
    estateProtection: []
  };

  // Immediate Actions
  if (financialAssets.totalAssets === 0) {
    recommendations.immediateActions.push('Start building emergency fund equivalent to 6 months of expenses');
  }

  if (liabilities.totalLiabilities > 0) {
    recommendations.immediateActions.push('Review and prioritize debt repayment strategy');
  }

  if (!personalInfo.panNumber) {
    recommendations.immediateActions.push('Complete KYC documentation including PAN card');
  }

  // Short Term Goals
  if (financialAssets.liquidAssets < (incomeAnalysis.monthlyExpenses * 6)) {
    recommendations.shortTermGoals.push('Build emergency fund to cover 6 months of expenses');
  }

  if (liabilities.unsecuredDebt > 0) {
    recommendations.shortTermGoals.push('Focus on clearing high-interest unsecured debts');
  }

  // Long Term Goals
  if (personalInfo.maritalStatus === 'Married' && personalInfo.numberOfDependents > 0) {
    recommendations.longTermGoals.push('Consider life insurance coverage for family protection');
    recommendations.longTermGoals.push('Plan for children\'s education and marriage expenses');
  }

  if (investmentPortfolio.totalValue === 0) {
    recommendations.longTermGoals.push('Start systematic investment plan for wealth creation');
  }

  // Risk Mitigation
  if (riskAssessment.overallRiskScore < 3) {
    recommendations.riskMitigation.push('Consider conservative investment approach with focus on capital preservation');
  }

  if (liabilities.totalLiabilities > (financialAssets.totalAssets * 0.5)) {
    recommendations.riskMitigation.push('High debt-to-asset ratio - focus on debt reduction');
  }

  // Tax Optimization
  if (financialAssets.breakdown.ppf === 0 && financialAssets.breakdown.epf === 0) {
    recommendations.taxOptimization.push('Consider tax-saving investments like PPF, EPF, ELSS');
  }

  if (incomeAnalysis.annualIncome > 1000000) {
    recommendations.taxOptimization.push('Explore advanced tax planning strategies for high-income individuals');
  }

  // Estate Protection
  if (personalInfo.maritalStatus === 'Married') {
    recommendations.estateProtection.push('Consider creating a will and estate plan');
    recommendations.estateProtection.push('Review beneficiary nominations on all investments');
  }

  if (financialAssets.totalAssets > 5000000) {
    recommendations.estateProtection.push('Consider estate planning strategies to minimize inheritance tax');
  }

  return recommendations;
};

/**
 * Helper function to calculate age
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Create or update estate information for a client
 * @route POST /api/estate-planning/client/:clientId/information
 * @access Private (Advisor only)
 */
const createOrUpdateEstateInformation = async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = req.advisor.id;
    const estateData = req.body;

    console.log('🏛️ [Estate Information] Creating/Updating estate information:', {
      clientId,
      advisorId,
      hasEstateData: !!estateData,
      timestamp: new Date().toISOString()
    });

    // Validate client ID
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    // Verify client belongs to advisor
    const client = await Client.findOne({
      _id: clientId,
      advisor: advisorId
    });

    if (!client) {
      console.log('❌ [Estate Information] Client not found:', { clientId, advisorId });
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }

    // Create or update estate information
    const estateInformation = await EstateInformation.findOneAndUpdate(
      { clientId: clientId },
      { 
        clientId: clientId,
        ...estateData,
        'estateMetadata.lastReviewed': new Date()
      },
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    );

    console.log('✅ [Estate Information] Estate information saved:', {
      clientId,
      estateInfoId: estateInformation._id,
      hasFamilyStructure: !!estateInformation.familyStructure,
      hasRealEstate: estateInformation.realEstateProperties?.length > 0,
      hasLegalDocs: !!estateInformation.legalDocumentsStatus
    });

    res.json({
      success: true,
      message: 'Estate information saved successfully',
      data: {
        estateInformation
      }
    });

  } catch (error) {
    console.error('❌ [Estate Information] Error:', error);
    logger.error('Estate Information Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to save estate information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get estate information for a specific client
 * @route GET /api/estate-planning/client/:clientId/information
 * @access Private (Advisor only)
 */
const getEstateInformation = async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = req.advisor.id;

    console.log('🏛️ [Estate Information] Fetching estate information:', {
      clientId,
      advisorId,
      timestamp: new Date().toISOString()
    });

    // Validate client ID
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    // Verify client belongs to advisor
    const client = await Client.findOne({
      _id: clientId,
      advisor: advisorId
    });

    if (!client) {
      console.log('❌ [Estate Information] Client not found:', { clientId, advisorId });
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }

    // Get estate information
    const estateInformation = await EstateInformation.findOne({ clientId: clientId });

    if (!estateInformation) {
      console.log('ℹ️ [Estate Information] No estate information found for client:', { clientId });
      return res.json({
        success: true,
        message: 'No estate information found',
        data: {
          estateInformation: null,
          clientInfo: {
            id: client._id,
            name: `${client.firstName} ${client.lastName}`,
            email: client.email
          }
        }
      });
    }

    console.log('✅ [Estate Information] Estate information fetched:', {
      clientId,
      estateInfoId: estateInformation._id,
      hasFamilyStructure: !!estateInformation.familyStructure,
      hasRealEstate: estateInformation.realEstateProperties?.length > 0,
      hasLegalDocs: !!estateInformation.legalDocumentsStatus
    });

    res.json({
      success: true,
      data: {
        estateInformation,
        clientInfo: {
          id: client._id,
          name: `${client.firstName} ${client.lastName}`,
          email: client.email
        }
      }
    });

  } catch (error) {
    console.error('❌ [Estate Information] Error:', error);
    logger.error('Estate Information Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch estate information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Create or update will content for a client
 * @route POST /api/estate-planning/client/:clientId/will
 * @access Private (Advisor only)
 */
const createOrUpdateWill = async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = req.advisor.id;
    const { willContent, willType = 'unregistered', executorDetails, witnesses } = req.body;

    console.log('📜 [Will Management] Creating/Updating will:', {
      clientId,
      advisorId,
      willType,
      hasContent: !!willContent,
      hasExecutor: !!executorDetails,
      hasWitnesses: !!witnesses,
      timestamp: new Date().toISOString()
    });

    // Validate client ID
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    // Verify client belongs to advisor
    const client = await Client.findOne({
      _id: clientId,
      advisor: advisorId
    });

    if (!client) {
      console.log('❌ [Will Management] Client not found:', { clientId, advisorId });
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }

    // Prepare will data
    const willData = {
      hasWill: true,
      willType,
      dateOfWill: new Date(),
      willContent: willContent || '',
      executorDetails: executorDetails || {},
      witnesses: witnesses || [],
      lastUpdated: new Date(),
      updateRequired: false
    };

    // Update estate information with will details
    const estateInformation = await EstateInformation.findOneAndUpdate(
      { clientId: clientId },
      { 
        $set: { 
          'legalDocumentsStatus.willDetails': willData,
          'estateMetadata.lastReviewed': new Date()
        }
      },
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    );

    console.log('✅ [Will Management] Will saved successfully:', {
      clientId,
      estateInfoId: estateInformation._id,
      willType,
      contentLength: willContent?.length || 0
    });

    res.json({
      success: true,
      message: 'Will saved successfully',
      data: {
        willDetails: estateInformation.legalDocumentsStatus.willDetails,
        clientInfo: {
          id: client._id,
          name: `${client.firstName} ${client.lastName}`,
          email: client.email
        }
      }
    });

  } catch (error) {
    console.error('❌ [Will Management] Error:', error);
    logger.error('Will Management Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to save will',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get will content for a specific client
 * @route GET /api/estate-planning/client/:clientId/will
 * @access Private (Advisor only)
 */
const getWill = async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = req.advisor.id;

    console.log('📜 [Will Management] Fetching will:', {
      clientId,
      advisorId,
      timestamp: new Date().toISOString()
    });

    // Validate client ID
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    // Verify client belongs to advisor
    const client = await Client.findOne({
      _id: clientId,
      advisor: advisorId
    });

    if (!client) {
      console.log('❌ [Will Management] Client not found:', { clientId, advisorId });
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }

    // Get estate information
    const estateInformation = await EstateInformation.findOne({ clientId: clientId });

    if (!estateInformation || !estateInformation.legalDocumentsStatus?.willDetails?.hasWill) {
      console.log('ℹ️ [Will Management] No will found for client:', { clientId });
      return res.json({
        success: true,
        message: 'No will found',
        data: {
          willDetails: null,
          clientInfo: {
            id: client._id,
            name: `${client.firstName} ${client.lastName}`,
            email: client.email
          }
        }
      });
    }

    console.log('✅ [Will Management] Will fetched successfully:', {
      clientId,
      hasWill: estateInformation.legalDocumentsStatus.willDetails.hasWill,
      willType: estateInformation.legalDocumentsStatus.willDetails.willType,
      contentLength: estateInformation.legalDocumentsStatus.willDetails.willContent?.length || 0
    });

    res.json({
      success: true,
      data: {
        willDetails: estateInformation.legalDocumentsStatus.willDetails,
        clientInfo: {
          id: client._id,
          name: `${client.firstName} ${client.lastName}`,
          email: client.email
        }
      }
    });

  } catch (error) {
    console.error('❌ [Will Management] Error:', error);
    logger.error('Will Management Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch will',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getClientEstatePlanningData,
  createOrUpdateEstateInformation,
  getEstateInformation,
  createOrUpdateWill,
  getWill
};
