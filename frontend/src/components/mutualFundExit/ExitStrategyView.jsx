/**
 * FILE LOCATION: frontend/src/components/mutualFundExit/ExitStrategyView.jsx
 * 
 * PURPOSE: Component for viewing a completed mutual fund exit strategy
 * 
 * FUNCTIONALITY:
 * - Displays comprehensive details of a saved exit strategy
 * - Shows all strategy components in an organized, readable format
 * - Provides action buttons for editing, printing, and sharing
 * - Implements responsive design for different screen sizes
 * - Handles strategy status updates and workflow progression
 * 
 * DATA DISPLAY:
 * - Strategy overview and status information
 * - Primary exit analysis and fund details
 * - Timing strategy and market conditions
 * - Tax implications and optimization details
 * - Alternative investment recommendations
 * - Financial goal assessment and risk analysis
 * - Execution action plan with progress tracking
 * - Cost-benefit analysis and net benefit calculation
 * - Advisor certification and client acknowledgment
 * 
 * USER INTERACTIONS:
 * - View strategy details in organized sections
 * - Edit strategy if in draft or pending status
 * - Print strategy as PDF document
 * - Share strategy with client or team
 * - Update strategy status and progress
 * - Track execution steps and milestones
 * 
 * DATA FLOW:
 * - Receives: Complete strategy data from parent component
 * - Processes: Strategy display and status management
 * - Sends: Edit requests and status updates to parent
 * - Displays: Formatted strategy information with visual indicators
 * 
 * COMPONENT INTEGRATION:
 * - Receives props: strategy (object), onBack (function), onEdit (function)
 * - Sends: Action requests via callback functions
 * - Integrates: With parent MutualFundExitSuite component
 * - Uses: mutualFundExitAPI service for utility functions
 * 
 * VISUAL DESIGN:
 * - Card-based layout for different strategy sections
 * - Color-coded status indicators and progress bars
 * - Icons and visual elements for enhanced readability
 * - Responsive grid layout for different screen sizes
 * - Consistent styling with the overall application theme
 */

import React, { useState } from 'react';
import { 
  ArrowLeft,
  Edit,
  Printer,
  Share2,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingDown,
  Calendar,
  DollarSign,
  Shield,
  Target,
  BarChart3,
  FileText,
  Users,
  Eye,
  Calculator
} from 'lucide-react';
import mutualFundExitAPI from '../../services/mutualFundExitAPI';

const ExitStrategyView = ({ 
  strategy, 
  onBack, 
  onEdit 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-5 h-5 text-gray-500" />;
      case 'pending_approval':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_execution':
        return <BarChart3 className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'in_execution':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value) => {
    if (!value || value <= 0) return '₹0';
    
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else {
      return `₹${value.toLocaleString('en-IN')}`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'analysis', label: 'Exit Analysis', icon: TrendingDown },
    { id: 'timing', label: 'Timing Strategy', icon: Calendar },
    { id: 'tax', label: 'Tax Implications', icon: DollarSign },
    { id: 'alternatives', label: 'Alternatives', icon: Target },
    { id: 'goals', label: 'Goal Assessment', icon: Shield },
    { id: 'risk', label: 'Risk Analysis', icon: AlertCircle },
    { id: 'execution', label: 'Execution Plan', icon: BarChart3 },
    { id: 'costs', label: 'Cost Analysis', icon: Calculator }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Strategy Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Fund Name</div>
                  <div className="text-lg font-semibold text-gray-900">{strategy.fundName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Fund Category</div>
                  <div className="text-lg font-semibold text-gray-900">{strategy.fundCategory}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Current Value</div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(strategy.primaryExitAnalysis?.currentValue)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Exit Rationale</div>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {strategy.primaryExitAnalysis?.exitRationale?.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Recommended Exit Date</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(strategy.timingStrategy?.recommendedExitDate)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Net Benefit</div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(strategy.costBenefitAnalysis?.netBenefit)}
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Progress */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-3">
                    {getStatusIcon(strategy.status)}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className={`text-lg font-semibold px-3 py-1 rounded-full inline-block ${getStatusColor(strategy.status)}`}>
                    {strategy.status?.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-3">
                    <Target className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="text-sm text-gray-600">Priority</div>
                  <div className={`text-lg font-semibold px-3 py-1 rounded-full inline-block ${getPriorityColor(strategy.priority)}`}>
                    {strategy.priority?.toUpperCase()}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-3">
                    <BarChart3 className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-sm text-gray-600">Version</div>
                  <div className="text-lg font-semibold text-gray-900">v{strategy.version}</div>
                </div>
              </div>
            </div>

            {/* Execution Steps */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Steps</h3>
              <div className="space-y-4">
                {strategy.executionActionPlan?.steps?.map((step, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step.status === 'completed' ? 'bg-green-100 text-green-600' :
                      step.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.stepNumber}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{step.action}</div>
                      <div className="text-sm text-gray-600">
                        Timeline: {step.timeline} • Responsible: {step.responsible}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      step.status === 'completed' ? 'bg-green-100 text-green-800' :
                      step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {step.status?.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Exit Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Current Value</div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(strategy.primaryExitAnalysis?.currentValue)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Units</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {strategy.primaryExitAnalysis?.units?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">NAV</div>
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{strategy.primaryExitAnalysis?.nav?.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Exit Rationale</div>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {strategy.primaryExitAnalysis?.exitRationale?.replace('_', ' ')}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="text-sm text-gray-600 mb-2">Detailed Reason</div>
                <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {strategy.primaryExitAnalysis?.detailedReason || 'Not specified'}
                </div>
              </div>
              
              <div className="mt-6">
                <div className="text-sm text-gray-600 mb-2">Performance Analysis</div>
                <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {strategy.primaryExitAnalysis?.performanceAnalysis || 'Not specified'}
                </div>
              </div>
            </div>
          </div>
        );

      case 'timing':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timing Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Recommended Exit Date</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(strategy.timingStrategy?.recommendedExitDate)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Urgency Level</div>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {strategy.timingStrategy?.urgency?.replace('_', ' ')}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="text-sm text-gray-600 mb-2">Market Conditions</div>
                <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {strategy.timingStrategy?.marketConditions || 'Not specified'}
                </div>
              </div>
            </div>
          </div>
        );

      case 'tax':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Implications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Holding Period</div>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {strategy.taxImplications?.holdingPeriod?.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tax Rate</div>
                  <div className="text-lg font-semibold text-red-600">
                    {strategy.taxImplications?.taxRate}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tax Amount</div>
                  <div className="text-lg font-semibold text-red-600">
                    {formatCurrency(strategy.taxImplications?.taxAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Loss Harvesting</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {strategy.taxImplications?.lossHarvesting ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="text-sm text-gray-600 mb-2">Tax Optimization Strategy</div>
                <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {strategy.taxImplications?.taxOptimization || 'Not specified'}
                </div>
              </div>
            </div>
          </div>
        );

      case 'alternatives':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alternative Investment Strategy</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Portfolio Rebalancing Strategy</div>
                  <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {strategy.alternativeInvestmentStrategy?.portfolioRebalancing || 'Not specified'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">Risk Adjustment Strategy</div>
                  <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {strategy.alternativeInvestmentStrategy?.riskAdjustment || 'Not specified'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">Diversification Benefits</div>
                  <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {strategy.alternativeInvestmentStrategy?.diversificationBenefits || 'Not specified'}
                  </div>
                </div>
                
                {/* Recommended Funds */}
                {strategy.alternativeInvestmentStrategy?.recommendedFunds && 
                 strategy.alternativeInvestmentStrategy.recommendedFunds.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-3">Recommended Alternative Funds</div>
                    <div className="space-y-3">
                      {strategy.alternativeInvestmentStrategy.recommendedFunds.map((fund, index) => (
                        <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-gray-600">Fund Name</div>
                              <div className="font-medium text-gray-900">{fund.fundName}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Category</div>
                              <div className="font-medium text-gray-900">{fund.fundCategory}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Allocation</div>
                              <div className="font-medium text-blue-600">{fund.allocation}%</div>
                            </div>
                          </div>
                          {fund.rationale && (
                            <div className="mt-3">
                              <div className="text-sm text-gray-600">Rationale</div>
                              <div className="text-sm text-gray-900">{fund.rationale}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Goal Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Risk Tolerance</div>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {strategy.financialGoalAssessment?.riskTolerance}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Timeline Impact</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {strategy.financialGoalAssessment?.timelineAdjustment ? 'Adjusted' : 'No Change'}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Goal Impact Analysis</div>
                  <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {strategy.financialGoalAssessment?.goalImpact || 'Not specified'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">Timeline Adjustment</div>
                  <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {strategy.financialGoalAssessment?.timelineAdjustment || 'Not specified'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">Liquidity Needs</div>
                  <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {strategy.financialGoalAssessment?.liquidityNeeds || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'risk':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Current Risk Level</div>
                  <div className={`text-lg font-semibold px-3 py-1 rounded-full inline-block ${
                    strategy.riskAnalysis?.currentRiskLevel === 'high' ? 'bg-red-100 text-red-800' :
                    strategy.riskAnalysis?.currentRiskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {strategy.riskAnalysis?.currentRiskLevel?.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Risk Factors Count</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {strategy.riskAnalysis?.exitRiskFactors?.length || 0}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-6">
                {/* Risk Factors */}
                {strategy.riskAnalysis?.exitRiskFactors && 
                 strategy.riskAnalysis.exitRiskFactors.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-3">Identified Risk Factors</div>
                    <div className="flex flex-wrap gap-2">
                      {strategy.riskAnalysis.exitRiskFactors.map((risk, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          {risk.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">Mitigation Strategies</div>
                  <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {strategy.riskAnalysis?.mitigationStrategies || 'Not specified'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">Stress Test Results</div>
                  <div className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {strategy.riskAnalysis?.stressTestResults || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'execution':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Action Plan</h3>
              
              {/* Execution Steps */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Execution Steps</h4>
                {strategy.executionActionPlan?.steps?.map((step, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step.status === 'completed' ? 'bg-green-100 text-green-600' :
                      step.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.stepNumber}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{step.action}</div>
                      <div className="text-sm text-gray-600">
                        Timeline: {step.timeline} • Responsible: {step.responsible}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      step.status === 'completed' ? 'bg-green-100 text-green-800' :
                      step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {step.status?.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Prerequisites */}
              {strategy.executionActionPlan?.prerequisites && 
               strategy.executionActionPlan.prerequisites.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Prerequisites</h4>
                  <div className="space-y-2">
                    {strategy.executionActionPlan.prerequisites.map((prereq, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <CheckCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-gray-900">{prereq}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Contingencies */}
              {strategy.executionActionPlan?.contingencies && 
               strategy.executionActionPlan.contingencies.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Contingency Plans</h4>
                  <div className="space-y-2">
                    {strategy.executionActionPlan.contingencies.map((contingency, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-gray-900">{contingency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Monitoring Points */}
              {strategy.executionActionPlan?.monitoringPoints && 
               strategy.executionActionPlan.monitoringPoints.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Monitoring Points</h4>
                  <div className="space-y-2">
                    {strategy.executionActionPlan.monitoringPoints.map((point, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-900">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'costs':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost-Benefit Analysis</h3>
              
              {/* Cost Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h4 className="text-md font-semibold text-red-900 mb-3">Costs</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Exit Load:</span>
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(strategy.costBenefitAnalysis?.exitLoad)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Transaction Costs:</span>
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(strategy.costBenefitAnalysis?.transactionCosts)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Opportunity Cost:</span>
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(strategy.costBenefitAnalysis?.opportunityCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="text-md font-semibold text-green-900 mb-3">Benefits</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tax Savings:</span>
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(strategy.costBenefitAnalysis?.taxSavings)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Net Benefit Summary */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Net Benefit</div>
                  <div className={`text-3xl font-bold ${
                    strategy.costBenefitAnalysis?.netBenefit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(strategy.costBenefitAnalysis?.netBenefit)}
                  </div>
                  <div className={`text-sm font-medium mt-2 ${
                    strategy.costBenefitAnalysis?.netBenefit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {strategy.costBenefitAnalysis?.netBenefit >= 0 ? 'Positive Impact' : 'Negative Impact'}
                  </div>
                </div>
              </div>
              
              {/* Cost-Benefit Chart Placeholder */}
              <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Cost-Benefit Visualization</h4>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Cost-benefit chart visualization would be displayed here</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Strategy View Complete</h3>
            <p className="text-gray-600">
              All strategy details are now available for viewing and analysis.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Funds</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Exit Strategy</h2>
              <p className="text-gray-600">
                {strategy.fundName} • {strategy.fundCategory}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {strategy.status === 'draft' && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 inline mr-2" />
                Edit Strategy
              </button>
            )}
            
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4 inline mr-2" />
              Print
            </button>
            
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4 inline mr-2" />
              Share
            </button>
            
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4 inline mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Strategy Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(strategy.primaryExitAnalysis?.currentValue)}
            </div>
            <div className="text-sm text-gray-500">Current Value</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(strategy.costBenefitAnalysis?.netBenefit)}
            </div>
            <div className="text-sm text-gray-500">Net Benefit</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {strategy.executionActionPlan?.steps?.length || 0}
            </div>
            <div className="text-sm text-gray-500">Execution Steps</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatDate(strategy.timingStrategy?.recommendedExitDate)}
            </div>
            <div className="text-sm text-gray-500">Exit Date</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ExitStrategyView;
