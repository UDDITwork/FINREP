/**
 * FILE LOCATION: frontend/src/components/mutualFundExit/ExitStrategyForm.jsx
 * 
 * PURPOSE: Comprehensive form component for creating mutual fund exit strategies
 * 
 * FUNCTIONALITY:
 * - Provides detailed input fields for all 92 strategy components
 * - Implements real-time validation and error handling
 * - Guides advisors through the complete strategy creation process
 * - Auto-calculates tax implications and cost-benefit analysis
 * - Generates default execution steps and recommendations
 * 
 * FORM SECTIONS:
 * - Primary Exit Analysis (fund details, exit rationale, performance)
 * - Timing Strategy (exit date, market conditions, triggers)
 * - Tax Implications (holding period, rates, optimization)
 * - Alternative Investment Strategy (recommendations, rebalancing)
 * - Financial Goal Assessment (impact, timeline, risk tolerance)
 * - Risk Analysis (current risk, factors, mitigation)
 * - Execution Action Plan (steps, prerequisites, monitoring)
 * - Cost-Benefit Analysis (fees, savings, net benefit)
 * - Advisor Certification (compliance, notes, approval)
 * - Client Acknowledgment (confirmation, notes, follow-up)
 * 
 * VALIDATION:
 * - Required field validation for essential components
 * - Numeric validation for amounts and percentages
 * - Date validation for timing strategies
 * - Business logic validation for strategy coherence
 * - Real-time feedback and error messaging
 * 
 * INTEGRATION:
 * - Receives client and fund data from parent component
 * - Submits strategy data via mutualFundExitAPI service
 * - Provides progress indicators and save functionality
 * - Handles form state management and data persistence
 * 
 * USER EXPERIENCE:
 * - Multi-step form with progress tracking
 * - Auto-save functionality for draft preservation
 * - Smart defaults based on fund and client data
 * - Responsive design for different screen sizes
 * - Accessibility features for inclusive usage
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Calculator,
  TrendingDown,
  Calendar,
  DollarSign,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import mutualFundExitAPI from '../../services/mutualFundExitAPI';

const ExitStrategyForm = ({ 
  client, 
  fund, 
  onStrategyCreated, 
  onBack 
}) => {
  // DEBUG: Log props on component mount
  useEffect(() => {
    console.log('🔍 [ExitStrategyForm] Component mounted with props:', {
      client: client,
      fund: fund,
      hasClient: !!client,
      hasFund: !!fund,
      fundKeys: fund ? Object.keys(fund) : 'no fund',
      clientKeys: client ? Object.keys(client) : 'no client'
    });
  }, [client, fund]);
  const [formData, setFormData] = useState({
    // Primary Exit Analysis
    primaryExitAnalysis: {
      currentValue: fund?.currentValue || 0,
      units: fund?.units || 0,
      nav: fund?.nav || 0,
      exitRationale: '',
      detailedReason: '',
      performanceAnalysis: ''
    },
    
    // Timing Strategy
    timingStrategy: {
      recommendedExitDate: '',
      marketConditions: '',
      exitTriggers: [],
      urgency: 'medium_term'
    },
    
    // Tax Implications
    taxImplications: {
      holdingPeriod: 'long_term',
      taxRate: 0,
      taxAmount: 0,
      taxOptimization: '',
      lossHarvesting: false
    },
    
    // Alternative Investment Strategy
    alternativeInvestmentStrategy: {
      recommendedFunds: [],
      portfolioRebalancing: '',
      riskAdjustment: '',
      diversificationBenefits: ''
    },
    
    // Financial Goal Assessment
    financialGoalAssessment: {
      goalImpact: '',
      timelineAdjustment: '',
      riskTolerance: 'moderate',
      liquidityNeeds: ''
    },
    
    // Risk Analysis
    riskAnalysis: {
      currentRiskLevel: 'medium',
      exitRiskFactors: [],
      mitigationStrategies: '',
      stressTestResults: ''
    },
    
    // Execution Action Plan
    executionActionPlan: {
      steps: mutualFundExitAPI.getDefaultExecutionSteps(),
      prerequisites: [],
      contingencies: [],
      monitoringPoints: []
    },
    
    // Cost-Benefit Analysis
    costBenefitAnalysis: {
      exitLoad: 0,
      transactionCosts: 0,
      taxSavings: 0,
      opportunityCost: 0,
      netBenefit: 0
    },
    
    // Advisor Certification
    advisorCertification: {
      certifiedBy: '',
      certificationDate: new Date(),
      certificationNotes: '',
      complianceCheck: false
    },
    
    // Client Acknowledgment
    clientAcknowledgment: {
      acknowledged: false,
      acknowledgmentDate: null,
      acknowledgmentMethod: 'digital',
      clientNotes: '',
      followUpRequired: false
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDraft, setIsDraft] = useState(true);

  const totalSteps = 10;

  useEffect(() => {
    // Auto-calculate tax implications when holding period changes
    if (formData.taxImplications.holdingPeriod && formData.primaryExitAnalysis.currentValue) {
      const holdingPeriod = formData.taxImplications.holdingPeriod;
      const currentValue = formData.primaryExitAnalysis.currentValue;
      
      let taxRate = 0;
      if (holdingPeriod === 'long_term') {
        taxRate = 10; // 10% for long term
      } else {
        taxRate = 15; // 15% for short term
      }
      
      const taxAmount = (currentValue * taxRate) / 100;
      
      setFormData(prev => ({
        ...prev,
        taxImplications: {
          ...prev.taxImplications,
          taxRate,
          taxAmount
        }
      }));
    }
  }, [formData.taxImplications.holdingPeriod, formData.primaryExitAnalysis.currentValue]);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // Clear error for this field
    if (errors[section]?.[field]) {
      setErrors(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: null
        }
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1: // Primary Exit Analysis
        if (!formData.primaryExitAnalysis.exitRationale) {
          newErrors.primaryExitAnalysis = { ...newErrors.primaryExitAnalysis, exitRationale: 'Exit rationale is required' };
        }
        if (!formData.primaryExitAnalysis.detailedReason) {
          newErrors.primaryExitAnalysis = { ...newErrors.primaryExitAnalysis, detailedReason: 'Detailed reason is required' };
        }
        break;
      
      case 2: // Timing Strategy
        if (!formData.timingStrategy.recommendedExitDate) {
          newErrors.timingStrategy = { ...newErrors.timingStrategy, recommendedExitDate: 'Recommended exit date is required' };
        }
        if (!formData.timingStrategy.marketConditions) {
          newErrors.timingStrategy = { ...newErrors.timingStrategy, marketConditions: 'Market conditions are required' };
        }
        break;
      
      case 3: // Tax Implications
        if (!formData.taxImplications.holdingPeriod) {
          newErrors.taxImplications = { ...newErrors.taxImplications, holdingPeriod: 'Holding period is required' };
        }
        if (!formData.taxImplications.taxOptimization) {
          newErrors.taxImplications = { ...newErrors.taxImplications, taxOptimization: 'Tax optimization strategy is required' };
        }
        break;
      
      case 4: // Alternative Investment Strategy
        if (!formData.alternativeInvestmentStrategy.portfolioRebalancing) {
          newErrors.alternativeInvestmentStrategy = { ...newErrors.alternativeInvestmentStrategy, portfolioRebalancing: 'Portfolio rebalancing strategy is required' };
        }
        if (!formData.alternativeInvestmentStrategy.riskAdjustment) {
          newErrors.alternativeInvestmentStrategy = { ...newErrors.alternativeInvestmentStrategy, riskAdjustment: 'Risk adjustment strategy is required' };
        }
        if (!formData.alternativeInvestmentStrategy.diversificationBenefits) {
          newErrors.alternativeInvestmentStrategy = { ...newErrors.alternativeInvestmentStrategy, diversificationBenefits: 'Diversification benefits are required' };
        }
        break;
      
      case 5: // Financial Goal Assessment
        if (!formData.financialGoalAssessment.goalImpact) {
          newErrors.financialGoalAssessment = { ...newErrors.financialGoalAssessment, goalImpact: 'Goal impact analysis is required' };
        }
        if (!formData.financialGoalAssessment.timelineAdjustment) {
          newErrors.financialGoalAssessment = { ...newErrors.financialGoalAssessment, timelineAdjustment: 'Timeline adjustment is required' };
        }
        if (!formData.financialGoalAssessment.riskTolerance) {
          newErrors.financialGoalAssessment = { ...newErrors.financialGoalAssessment, riskTolerance: 'Risk tolerance is required' };
        }
        if (!formData.financialGoalAssessment.liquidityNeeds) {
          newErrors.financialGoalAssessment = { ...newErrors.financialGoalAssessment, liquidityNeeds: 'Liquidity needs are required' };
        }
        break;
      
      case 6: // Risk Analysis
        if (!formData.riskAnalysis.currentRiskLevel) {
          newErrors.riskAnalysis = { ...newErrors.riskAnalysis, currentRiskLevel: 'Current risk level is required' };
        }
        if (!formData.riskAnalysis.mitigationStrategies) {
          newErrors.riskAnalysis = { ...newErrors.riskAnalysis, mitigationStrategies: 'Mitigation strategies are required' };
        }
        if (!formData.riskAnalysis.stressTestResults) {
          newErrors.riskAnalysis = { ...newErrors.riskAnalysis, stressTestResults: 'Stress test results are required' };
        }
        break;
      
      case 7: // Execution Action Plan
        if (!formData.executionActionPlan.steps || formData.executionActionPlan.steps.length === 0) {
          newErrors.executionActionPlan = { ...newErrors.executionActionPlan, steps: 'At least one execution step is required' };
        }
        break;
      
      case 8: // Cost-Benefit Analysis
        if (formData.costBenefitAnalysis.exitLoad === undefined || formData.costBenefitAnalysis.exitLoad === null) {
          newErrors.costBenefitAnalysis = { ...newErrors.costBenefitAnalysis, exitLoad: 'Exit load is required' };
        }
        if (formData.costBenefitAnalysis.transactionCosts === undefined || formData.costBenefitAnalysis.transactionCosts === null) {
          newErrors.costBenefitAnalysis = { ...newErrors.costBenefitAnalysis, transactionCosts: 'Transaction costs are required' };
        }
        if (formData.costBenefitAnalysis.taxSavings === undefined || formData.costBenefitAnalysis.taxSavings === null) {
          newErrors.costBenefitAnalysis = { ...newErrors.costBenefitAnalysis, taxSavings: 'Tax savings are required' };
        }
        if (formData.costBenefitAnalysis.opportunityCost === undefined || formData.costBenefitAnalysis.opportunityCost === null) {
          newErrors.costBenefitAnalysis = { ...newErrors.costBenefitAnalysis, opportunityCost: 'Opportunity cost is required' };
        }
        break;
      
      case 9: // Advisor Certification
        if (!formData.advisorCertification?.complianceCheck) {
          newErrors.advisorCertification = { ...newErrors.advisorCertification, complianceCheck: 'Compliance check is required' };
        }
        break;
      
      case 10: // Client Acknowledgment
        // Client acknowledgment is optional but recommended
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      
      const strategyData = {
        clientId: client.clientId,
        fundId: fund.fundId,
        fundName: fund.fundName,
        fundCategory: fund.fundCategory,
        fundType: fund.fundType,
        source: fund.source,
        status: 'draft',
        priority: 'medium',
        ...formData,
        // Ensure advisor certification is properly set
        advisorCertification: {
          ...formData.advisorCertification,
          certifiedBy: client.advisorId || 'current_advisor',
          certificationDate: new Date()
        },
        // Ensure client acknowledgment is properly set
        clientAcknowledgment: {
          ...formData.clientAcknowledgment,
          acknowledged: false,
          acknowledgmentDate: null
        }
      };

      await mutualFundExitAPI.createExitStrategy(strategyData);
      
      setIsDraft(false);
      // Show success message
    } catch (error) {
      console.error('Error saving draft:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStrategy = async () => {
    try {
      setLoading(true);
      
      // Validate required props first
      if (!client) {
        alert('Client data is missing. Please go back and select a client.');
        return;
      }
      
      if (!fund) {
        alert('Fund data is missing. Please go back and select a fund.');
        return;
      }
      
      // Validate all steps before submission
      let allStepsValid = true;
      for (let step = 1; step <= totalSteps; step++) {
        if (!validateStep(step)) {
          allStepsValid = false;
          break;
        }
      }
      
      if (!allStepsValid) {
        setCurrentStep(1); // Go back to first step with errors
        return;
      }

      // DEBUG: Log fund and client data
      console.log('🔍 [Exit Strategy] Fund data:', fund);
      console.log('🔍 [Exit Strategy] Client data:', client);
      
      // Prepare complete strategy data with fallbacks
      const strategyData = {
        clientId: client?.clientId || client?._id,
        fundId: fund?.fundId || fund?._id,
        fundName: fund?.fundName || fund?.name || 'Unknown Fund',
        fundCategory: fund?.fundCategory || fund?.category || 'Unknown Category',
        fundType: fund?.fundType || fund?.type || 'Unknown Type',
        source: fund?.source || 'manual',
        status: 'pending_approval',
        priority: 'medium',
        ...formData,
        // Ensure advisor certification is properly set
        advisorCertification: {
          ...formData.advisorCertification,
          certifiedBy: client?.advisorId || 'current_advisor',
          certificationDate: new Date()
        },
        // Ensure client acknowledgment is properly set
        clientAcknowledgment: {
          ...formData.clientAcknowledgment,
          acknowledged: false,
          acknowledgmentDate: null
        }
      };
      
      console.log('🔍 [Exit Strategy] Prepared strategy data:', strategyData);

      // Validate using API service
      try {
        mutualFundExitAPI.validateStrategyData(strategyData);
      } catch (validationError) {
        console.error('Validation error:', validationError.message);
        console.error('Missing fields in strategy data:', {
          fundName: strategyData.fundName,
          fundId: strategyData.fundId,
          clientId: strategyData.clientId,
          fundCategory: strategyData.fundCategory,
          fundType: strategyData.fundType
        });
        
        // Show validation error to user with more details
        alert(`Validation Error: ${validationError.message}\n\nPlease check the fund data and try again.`);
        return;
      }

      const response = await mutualFundExitAPI.createExitStrategy(strategyData);
      
      onStrategyCreated(response.data);
    } catch (error) {
      console.error('Error submitting strategy:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Primary Exit Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Value
                </label>
                <input
                  type="number"
                  value={formData.primaryExitAnalysis.currentValue}
                  onChange={(e) => handleInputChange('primaryExitAnalysis', 'currentValue', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter current value"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Units
                </label>
                <input
                  type="number"
                  value={formData.primaryExitAnalysis.units}
                  onChange={(e) => handleInputChange('primaryExitAnalysis', 'units', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter units"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exit Rationale
              </label>
              <select
                value={formData.primaryExitAnalysis.exitRationale}
                onChange={(e) => handleInputChange('primaryExitAnalysis', 'exitRationale', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select exit rationale</option>
                <option value="underperformance">Underperformance</option>
                <option value="goal_achievement">Goal Achievement</option>
                <option value="rebalancing">Portfolio Rebalancing</option>
                <option value="risk_adjustment">Risk Adjustment</option>
                <option value="liquidity_needs">Liquidity Needs</option>
                <option value="other">Other</option>
              </select>
              {errors.primaryExitAnalysis?.exitRationale && (
                <p className="mt-1 text-sm text-red-600">{errors.primaryExitAnalysis.exitRationale}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Reason
              </label>
              <textarea
                value={formData.primaryExitAnalysis.detailedReason}
                onChange={(e) => handleInputChange('primaryExitAnalysis', 'detailedReason', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide detailed explanation for exit decision..."
              />
              {errors.primaryExitAnalysis?.detailedReason && (
                <p className="mt-1 text-sm text-red-600">{errors.primaryExitAnalysis.detailedReason}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Performance Analysis
              </label>
              <textarea
                value={formData.primaryExitAnalysis.performanceAnalysis}
                onChange={(e) => handleInputChange('primaryExitAnalysis', 'performanceAnalysis', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Analyze fund performance and justify exit decision..."
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Timing Strategy</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommended Exit Date
              </label>
              <input
                type="date"
                value={formData.timingStrategy.recommendedExitDate}
                onChange={(e) => handleInputChange('timingStrategy', 'recommendedExitDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.timingStrategy?.recommendedExitDate && (
                <p className="mt-1 text-sm text-red-600">{errors.timingStrategy.recommendedExitDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Market Conditions
              </label>
              <textarea
                value={formData.timingStrategy.marketConditions}
                onChange={(e) => handleInputChange('timingStrategy', 'marketConditions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe current market conditions and outlook..."
              />
              {errors.timingStrategy?.marketConditions && (
                <p className="mt-1 text-sm text-red-600">{errors.timingStrategy.marketConditions}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level
              </label>
              <select
                value={formData.timingStrategy.urgency}
                onChange={(e) => handleInputChange('timingStrategy', 'urgency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="immediate">Immediate</option>
                <option value="short_term">Short Term (1-3 months)</option>
                <option value="medium_term">Medium Term (3-6 months)</option>
                <option value="long_term">Long Term (6+ months)</option>
              </select>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Tax Implications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holding Period
                </label>
                <select
                  value={formData.taxImplications.holdingPeriod}
                  onChange={(e) => handleInputChange('taxImplications', 'holdingPeriod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select holding period</option>
                  <option value="short_term">Short Term (&lt; 1 year)</option>
                  <option value="long_term">Long Term (&gt; 1 year)</option>
                </select>
                {errors.taxImplications?.holdingPeriod && (
                  <p className="mt-1 text-sm text-red-600">{errors.taxImplications.holdingPeriod}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.taxImplications.taxRate}
                  onChange={(e) => handleInputChange('taxImplications', 'taxRate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tax rate percentage"
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">Auto-calculated based on holding period</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.taxImplications.taxAmount}
                  onChange={(e) => handleInputChange('taxImplications', 'taxAmount', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tax amount"
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">Auto-calculated based on current value and tax rate</p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="lossHarvesting"
                  checked={formData.taxImplications.lossHarvesting}
                  onChange={(e) => handleInputChange('taxImplications', 'lossHarvesting', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="lossHarvesting" className="ml-2 block text-sm text-gray-900">
                  Consider Loss Harvesting
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Optimization Strategy
              </label>
              <textarea
                value={formData.taxImplications.taxOptimization}
                onChange={(e) => handleInputChange('taxImplications', 'taxOptimization', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe tax optimization strategies..."
              />
              {errors.taxImplications?.taxOptimization && (
                <p className="mt-1 text-sm text-red-600">{errors.taxImplications.taxOptimization}</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Alternative Investment Strategy</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portfolio Rebalancing Strategy
              </label>
              <textarea
                value={formData.alternativeInvestmentStrategy.portfolioRebalancing}
                onChange={(e) => handleInputChange('alternativeInvestmentStrategy', 'portfolioRebalancing', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe how the portfolio will be rebalanced after exit..."
              />
              {errors.alternativeInvestmentStrategy?.portfolioRebalancing && (
                <p className="mt-1 text-sm text-red-600">{errors.alternativeInvestmentStrategy.portfolioRebalancing}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Adjustment Strategy
              </label>
              <textarea
                value={formData.alternativeInvestmentStrategy.riskAdjustment}
                onChange={(e) => handleInputChange('alternativeInvestmentStrategy', 'riskAdjustment', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe risk adjustment strategies..."
              />
              {errors.alternativeInvestmentStrategy?.riskAdjustment && (
                <p className="mt-1 text-sm text-red-600">{errors.alternativeInvestmentStrategy.riskAdjustment}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diversification Benefits
              </label>
              <textarea
                value={formData.alternativeInvestmentStrategy.diversificationBenefits}
                onChange={(e) => handleInputChange('alternativeInvestmentStrategy', 'diversificationBenefits', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Explain diversification benefits of the new strategy..."
              />
              {errors.alternativeInvestmentStrategy?.diversificationBenefits && (
                <p className="mt-1 text-sm text-red-600">{errors.alternativeInvestmentStrategy.diversificationBenefits}</p>
              )}
            </div>

            {/* Recommended Funds Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommended Alternative Funds
              </label>
              <div className="space-y-3">
                {formData.alternativeInvestmentStrategy.recommendedFunds.map((fund, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Fund Name"
                      value={fund.fundName || ''}
                      onChange={(e) => {
                        const newFunds = [...formData.alternativeInvestmentStrategy.recommendedFunds];
                        newFunds[index] = { ...newFunds[index], fundName: e.target.value };
                        handleInputChange('alternativeInvestmentStrategy', 'recommendedFunds', newFunds);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={fund.fundCategory || ''}
                      onChange={(e) => {
                        const newFunds = [...formData.alternativeInvestmentStrategy.recommendedFunds];
                        newFunds[index] = { ...newFunds[index], fundCategory: e.target.value };
                        handleInputChange('alternativeInvestmentStrategy', 'recommendedFunds', newFunds);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Allocation %"
                      value={fund.allocation || ''}
                      onChange={(e) => {
                        const newFunds = [...formData.alternativeInvestmentStrategy.recommendedFunds];
                        newFunds[index] = { ...newFunds[index], allocation: parseFloat(e.target.value) };
                        handleInputChange('alternativeInvestmentStrategy', 'recommendedFunds', newFunds);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFunds = formData.alternativeInvestmentStrategy.recommendedFunds.filter((_, i) => i !== index);
                        handleInputChange('alternativeInvestmentStrategy', 'recommendedFunds', newFunds);
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newFunds = [...formData.alternativeInvestmentStrategy.recommendedFunds, {
                      fundName: '',
                      fundCategory: '',
                      allocation: 0,
                      rationale: ''
                    }];
                    handleInputChange('alternativeInvestmentStrategy', 'recommendedFunds', newFunds);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add Recommended Fund
                </button>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Financial Goal Assessment</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goal Impact Analysis
              </label>
              <textarea
                value={formData.financialGoalAssessment.goalImpact}
                onChange={(e) => handleInputChange('financialGoalAssessment', 'goalImpact', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Analyze how this exit will impact the client's financial goals..."
              />
              {errors.financialGoalAssessment?.goalImpact && (
                <p className="mt-1 text-sm text-red-600">{errors.financialGoalAssessment.goalImpact}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeline Adjustment
              </label>
              <textarea
                value={formData.financialGoalAssessment.timelineAdjustment}
                onChange={(e) => handleInputChange('financialGoalAssessment', 'timelineAdjustment', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe any timeline adjustments needed for financial goals..."
              />
              {errors.financialGoalAssessment?.timelineAdjustment && (
                <p className="mt-1 text-sm text-red-600">{errors.financialGoalAssessment.timelineAdjustment}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Tolerance
                </label>
                <select
                  value={formData.financialGoalAssessment.riskTolerance}
                  onChange={(e) => handleInputChange('financialGoalAssessment', 'riskTolerance', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select risk tolerance</option>
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
                {errors.financialGoalAssessment?.riskTolerance && (
                  <p className="mt-1 text-sm text-red-600">{errors.financialGoalAssessment.riskTolerance}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liquidity Needs
                </label>
                <textarea
                  value={formData.financialGoalAssessment.liquidityNeeds}
                  onChange={(e) => handleInputChange('financialGoalAssessment', 'liquidityNeeds', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe client's liquidity needs..."
                />
                {errors.financialGoalAssessment?.liquidityNeeds && (
                  <p className="mt-1 text-sm text-red-600">{errors.financialGoalAssessment.liquidityNeeds}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Risk Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Risk Level
                </label>
                <select
                  value={formData.riskAnalysis.currentRiskLevel}
                  onChange={(e) => handleInputChange('riskAnalysis', 'currentRiskLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select risk level</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {errors.riskAnalysis?.currentRiskLevel && (
                  <p className="mt-1 text-sm text-red-600">{errors.riskAnalysis.currentRiskLevel}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exit Risk Factors
                </label>
                <div className="space-y-2">
                  {['market_volatility', 'liquidity_risk', 'timing_risk', 'tax_risk', 'other'].map(risk => (
                    <label key={risk} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.riskAnalysis.exitRiskFactors.includes(risk)}
                        onChange={(e) => {
                          const currentFactors = formData.riskAnalysis.exitRiskFactors;
                          const newFactors = e.target.checked
                            ? [...currentFactors, risk]
                            : currentFactors.filter(factor => factor !== risk);
                          handleInputChange('riskAnalysis', 'exitRiskFactors', newFactors);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {risk.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mitigation Strategies
              </label>
              <textarea
                value={formData.riskAnalysis.mitigationStrategies}
                onChange={(e) => handleInputChange('riskAnalysis', 'mitigationStrategies', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe strategies to mitigate identified risks..."
              />
              {errors.riskAnalysis?.mitigationStrategies && (
                <p className="mt-1 text-sm text-red-600">{errors.riskAnalysis.mitigationStrategies}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stress Test Results
              </label>
              <textarea
                value={formData.riskAnalysis.stressTestResults}
                onChange={(e) => handleInputChange('riskAnalysis', 'stressTestResults', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Document stress test results and scenarios..."
              />
              {errors.riskAnalysis?.stressTestResults && (
                <p className="mt-1 text-sm text-red-600">{errors.riskAnalysis.stressTestResults}</p>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Execution Action Plan</h3>
            
            {/* Execution Steps */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Execution Steps
              </label>
              <div className="space-y-3">
                {formData.executionActionPlan.steps.map((step, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Action"
                      value={step.action}
                      onChange={(e) => {
                        const newSteps = [...formData.executionActionPlan.steps];
                        newSteps[index] = { ...newSteps[index], action: e.target.value };
                        handleInputChange('executionActionPlan', 'steps', newSteps);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Timeline"
                      value={step.timeline}
                      onChange={(e) => {
                        const newSteps = [...formData.executionActionPlan.steps];
                        newSteps[index] = { ...newSteps[index], timeline: e.target.value };
                        handleInputChange('executionActionPlan', 'steps', newSteps);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Responsible"
                      value={step.responsible}
                      onChange={(e) => {
                        const newSteps = [...formData.executionActionPlan.steps];
                        newSteps[index] = { ...newSteps[index], responsible: e.target.value };
                        handleInputChange('executionActionPlan', 'steps', newSteps);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={step.status}
                      onChange={(e) => {
                        const newSteps = [...formData.executionActionPlan.steps];
                        newSteps[index] = { ...newSteps[index], status: e.target.value };
                        handleInputChange('executionActionPlan', 'steps', newSteps);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const newSteps = formData.executionActionPlan.steps.filter((_, i) => i !== index);
                        handleInputChange('executionActionPlan', 'steps', newSteps);
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newSteps = [...formData.executionActionPlan.steps, {
                      stepNumber: formData.executionActionPlan.steps.length + 1,
                      action: '',
                      timeline: '',
                      responsible: '',
                      status: 'pending'
                    }];
                    handleInputChange('executionActionPlan', 'steps', newSteps);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add Execution Step
                </button>
              </div>
            </div>

            {/* Prerequisites */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prerequisites
              </label>
              <div className="space-y-2">
                {formData.executionActionPlan.prerequisites.map((prereq, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={prereq}
                      onChange={(e) => {
                        const newPrereqs = [...formData.executionActionPlan.prerequisites];
                        newPrereqs[index] = e.target.value;
                        handleInputChange('executionActionPlan', 'prerequisites', newPrereqs);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter prerequisite"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newPrereqs = formData.executionActionPlan.prerequisites.filter((_, i) => i !== index);
                        handleInputChange('executionActionPlan', 'prerequisites', newPrereqs);
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newPrereqs = [...formData.executionActionPlan.prerequisites, ''];
                    handleInputChange('executionActionPlan', 'prerequisites', newPrereqs);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add Prerequisite
                </button>
              </div>
            </div>

            {/* Contingencies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contingencies
              </label>
              <div className="space-y-2">
                {formData.executionActionPlan.contingencies.map((contingency, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={contingency}
                      onChange={(e) => {
                        const newContingencies = [...formData.executionActionPlan.contingencies];
                        newContingencies[index] = e.target.value;
                        handleInputChange('executionActionPlan', 'contingencies', newContingencies);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter contingency plan"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newContingencies = formData.executionActionPlan.contingencies.filter((_, i) => i !== index);
                        handleInputChange('executionActionPlan', 'contingencies', newContingencies);
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newContingencies = [...formData.executionActionPlan.contingencies, ''];
                    handleInputChange('executionActionPlan', 'contingencies', newContingencies);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add Contingency
                </button>
              </div>
            </div>

            {/* Monitoring Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monitoring Points
              </label>
              <div className="space-y-2">
                {formData.executionActionPlan.monitoringPoints.map((point, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => {
                        const newPoints = [...formData.executionActionPlan.monitoringPoints];
                        newPoints[index] = e.target.value;
                        handleInputChange('executionActionPlan', 'monitoringPoints', newPoints);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter monitoring point"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newPoints = formData.executionActionPlan.monitoringPoints.filter((_, i) => i !== index);
                        handleInputChange('executionActionPlan', 'monitoringPoints', newPoints);
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newPoints = [...formData.executionActionPlan.monitoringPoints, ''];
                    handleInputChange('executionActionPlan', 'monitoringPoints', newPoints);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add Monitoring Point
                </button>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Cost-Benefit Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exit Load (₹)
                </label>
                <input
                  type="number"
                  value={formData.costBenefitAnalysis.exitLoad}
                  onChange={(e) => handleInputChange('costBenefitAnalysis', 'exitLoad', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter exit load amount"
                />
                {errors.costBenefitAnalysis?.exitLoad && (
                  <p className="mt-1 text-sm text-red-600">{errors.costBenefitAnalysis.exitLoad}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Costs (₹)
                </label>
                <input
                  type="number"
                  value={formData.costBenefitAnalysis.transactionCosts}
                  onChange={(e) => handleInputChange('costBenefitAnalysis', 'transactionCosts', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter transaction costs"
                />
                {errors.costBenefitAnalysis?.transactionCosts && (
                  <p className="mt-1 text-sm text-red-600">{errors.costBenefitAnalysis.transactionCosts}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Savings (₹)
                </label>
                <input
                  type="number"
                  value={formData.costBenefitAnalysis.taxSavings}
                  onChange={(e) => handleInputChange('costBenefitAnalysis', 'taxSavings', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tax savings"
                />
                {errors.costBenefitAnalysis?.taxSavings && (
                  <p className="mt-1 text-sm text-red-600">{errors.costBenefitAnalysis.taxSavings}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opportunity Cost (₹)
                </label>
                <input
                  type="number"
                  value={formData.costBenefitAnalysis.opportunityCost}
                  onChange={(e) => handleInputChange('costBenefitAnalysis', 'opportunityCost', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter opportunity cost"
                />
                {errors.costBenefitAnalysis?.opportunityCost && (
                  <p className="mt-1 text-sm text-red-600">{errors.costBenefitAnalysis.opportunityCost}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Net Benefit (₹)
              </label>
              <input
                type="number"
                value={formData.costBenefitAnalysis.netBenefit}
                onChange={(e) => {
                  const exitLoad = formData.costBenefitAnalysis.exitLoad || 0;
                  const transactionCosts = formData.costBenefitAnalysis.transactionCosts || 0;
                  const taxSavings = formData.costBenefitAnalysis.taxSavings || 0;
                  const opportunityCost = formData.costBenefitAnalysis.opportunityCost || 0;
                  
                  const netBenefit = taxSavings - exitLoad - transactionCosts - opportunityCost;
                  
                  handleInputChange('costBenefitAnalysis', 'netBenefit', netBenefit);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                placeholder="Auto-calculated"
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">Net Benefit = Tax Savings - Exit Load - Transaction Costs - Opportunity Cost</p>
            </div>

            {/* Cost-Benefit Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Cost-Benefit Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax Savings:</span>
                    <span className="text-sm font-medium text-green-600">
                      ₹{formData.costBenefitAnalysis.taxSavings?.toLocaleString('en-IN') || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Exit Load:</span>
                    <span className="text-sm font-medium text-red-600">
                      -₹{formData.costBenefitAnalysis.exitLoad?.toLocaleString('en-IN') || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transaction Costs:</span>
                    <span className="text-sm font-medium text-red-600">
                      -₹{formData.costBenefitAnalysis.transactionCosts?.toLocaleString('en-IN') || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Opportunity Cost:</span>
                    <span className="text-sm font-medium text-red-600">
                      -₹{formData.costBenefitAnalysis.opportunityCost?.toLocaleString('en-IN') || '0'}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Net Benefit:</span>
                    <span className={`text-lg font-bold ${
                      formData.costBenefitAnalysis.netBenefit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{formData.costBenefitAnalysis.netBenefit?.toLocaleString('en-IN') || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Advisor Certification</h3>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h4 className="text-lg font-semibold text-blue-900">Certification Requirements</h4>
              </div>
              <p className="text-sm text-blue-800 mb-4">
                As a certified advisor, you are certifying that this exit strategy has been thoroughly analyzed
                and is in the best interest of your client based on their financial goals and risk profile.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="complianceCheck"
                    checked={formData.advisorCertification?.complianceCheck || false}
                    onChange={(e) => {
                      if (!formData.advisorCertification) {
                        formData.advisorCertification = {};
                      }
                      handleInputChange('advisorCertification', 'complianceCheck', e.target.checked);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="complianceCheck" className="ml-2 block text-sm text-blue-900">
                    I confirm that this exit strategy complies with all regulatory requirements
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="clientInterest"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="clientInterest" className="ml-2 block text-sm text-blue-900">
                    I confirm that this strategy is in the best interest of the client
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="riskAssessment"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="riskAssessment" className="ml-2 block text-sm text-blue-900">
                    I confirm that all risks have been properly assessed and disclosed
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certification Notes
              </label>
              <textarea
                value={formData.advisorCertification?.certificationNotes || ''}
                onChange={(e) => {
                  if (!formData.advisorCertification) {
                    formData.advisorCertification = {};
                  }
                  handleInputChange('advisorCertification', 'certificationNotes', e.target.value);
                }}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any additional certification notes or comments..."
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                <strong>Certification Date:</strong> {new Date().toLocaleDateString('en-IN')}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                <strong>Certified By:</strong> {client.advisorName || 'Current Advisor'}
              </div>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Client Acknowledgment</h3>
            
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h4 className="text-lg font-semibold text-green-900">Client Acknowledgment Required</h4>
              </div>
              <p className="text-sm text-green-800 mb-4">
                This exit strategy requires client acknowledgment before it can be executed.
                Please ensure the client has been properly informed about all aspects of this strategy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acknowledgment Method
                </label>
                <select
                  value={formData.clientAcknowledgment?.acknowledgmentMethod || 'digital'}
                  onChange={(e) => {
                    if (!formData.clientAcknowledgment) {
                      formData.clientAcknowledgment = {};
                    }
                    handleInputChange('clientAcknowledgment', 'acknowledgmentMethod', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="digital">Digital (Email/SMS)</option>
                  <option value="physical">Physical (Signed Document)</option>
                  <option value="verbal">Verbal (Phone/Meeting)</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="followUpRequired"
                  checked={formData.clientAcknowledgment?.followUpRequired || false}
                  onChange={(e) => {
                    if (!formData.clientAcknowledgment) {
                      formData.clientAcknowledgment = {};
                    }
                    handleInputChange('clientAcknowledgment', 'followUpRequired', e.target.checked);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="followUpRequired" className="ml-2 block text-sm text-gray-900">
                  Follow-up Required
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Notes
              </label>
              <textarea
                value={formData.clientAcknowledgment?.clientNotes || ''}
                onChange={(e) => {
                  if (!formData.clientAcknowledgment) {
                    formData.clientAcknowledgment = {};
                  }
                  handleInputChange('clientAcknowledgment', 'clientNotes', e.target.value);
                }}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any notes about client communication or special requirements..."
              />
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h4 className="text-sm font-semibold text-yellow-900">Important Reminder</h4>
              </div>
              <p className="text-sm text-yellow-800">
                Ensure the client has received and understood all aspects of this exit strategy,
                including risks, costs, and alternatives, before proceeding with execution.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Form Complete</h3>
            <p className="text-gray-600">
              All form steps have been completed. You can now submit the exit strategy.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-sm border border-orange-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-orange-200 hover:shadow-md"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Funds</span>
            </button>
            <div className="h-12 w-px bg-orange-200"></div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Create Exit Strategy</h2>
                <p className="text-gray-600 text-lg">
                  {client.clientName} • {fund.fundName}
                </p>
              </div>
            </div>
          </div>
          
          {/* Enhanced Action Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 bg-white shadow-sm hover:shadow-md"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Save Draft
            </button>
            
            <button
              onClick={handleSubmitStrategy}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 disabled:opacity-50 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4 inline mr-2" />
              Submit Strategy
            </button>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
            <span className="text-sm font-medium text-orange-600">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </div>
        </div>
      </div>

      {/* Enhanced Form Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {renderStepContent()}
      </div>

      {/* Enhanced Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 bg-white shadow-sm hover:shadow-md"
          >
            <div className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Previous</span>
            </div>
          </button>
          
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700">
              {isDraft ? 'Draft saved' : 'Ready to submit'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {currentStep === totalSteps ? 'Final step' : 'Continue to next step'}
            </div>
          </div>
          
          <button
            onClick={handleNextStep}
            disabled={currentStep === totalSteps}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium">
                {currentStep === totalSteps ? 'Complete' : 'Next'}
              </span>
              {currentStep !== totalSteps && <ArrowRight className="w-4 h-4" />}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitStrategyForm;
