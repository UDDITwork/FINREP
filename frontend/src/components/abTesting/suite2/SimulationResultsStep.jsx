import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, ArrowLeft, TrendingUp, TrendingDown, Target, AlertCircle, BarChart3 } from 'lucide-react';

const SimulationResultsStep = ({ client, scenarios, onComplete }) => {
  const [simulationResults, setSimulationResults] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [calculationProgress, setCalculationProgress] = useState(0);

  useEffect(() => {
    runMonteCarloSimulation();
  }, [scenarios]);

  const runMonteCarloSimulation = async () => {
    setIsCalculating(true);
    setCalculationProgress(0);
    
    const results = {};
    const totalScenarios = scenarios.length;
    
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      setCalculationProgress(((i + 1) / totalScenarios) * 100);
      
      // Simulate delay for realistic calculation experience
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      results[scenario.id] = await simulateScenario(scenario, client);
    }
    
    setSimulationResults(results);
    setSelectedScenario(scenarios[0]?.id);
    setIsCalculating(false);
    setCalculationProgress(100);
  };

  const simulateScenario = async (scenario, client) => {
    const params = scenario.parameters;
    const monthlyInvestment = scenario.monthlyInvestment;
    const simulationCount = 5000; // Reduced for demo performance
    const yearsToSimulate = Math.min(30, Math.max(10, 65 - (client.age || 25)));
    
    const simulations = [];
    
    for (let sim = 0; sim < simulationCount; sim++) {
      const portfolioPath = simulatePortfolioPath(
        params,
        monthlyInvestment,
        yearsToSimulate
      );
      simulations.push(portfolioPath);
    }
    
    // ✅ FIXED: Pass monthlyInvestment as a separate parameter
    return analyzeSimulationResults(simulations, params, yearsToSimulate, monthlyInvestment);
  };

  const simulatePortfolioPath = (params, monthlyInvestment, years) => {
    const { expectedReturn, volatility } = params;
    const monthsToSimulate = years * 12;
    const path = [];
    let portfolioValue = 0;
    let peakValue = 0;
    let maxDrawdown = 0;
    
    for (let month = 0; month < monthsToSimulate; month++) {
      // Generate random return using normal distribution approximation
      const randomReturn = generateRandomReturn(expectedReturn / 100, volatility / 100);
      
      // Apply monthly return to existing portfolio
      portfolioValue = portfolioValue * (1 + randomReturn / 12);
      
      // Add monthly investment
      portfolioValue += monthlyInvestment;
      
      // Track drawdown
      if (portfolioValue > peakValue) {
        peakValue = portfolioValue;
      } else {
        const currentDrawdown = (peakValue - portfolioValue) / peakValue;
        maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
      }
      
      path.push({
        month,
        value: portfolioValue,
        invested: monthlyInvestment * (month + 1),
        gains: portfolioValue - (monthlyInvestment * (month + 1)),
        drawdown: (peakValue - portfolioValue) / peakValue
      });
    }
    
    return {
      path,
      finalValue: portfolioValue,
      totalInvested: monthlyInvestment * monthsToSimulate,
      totalGains: portfolioValue - (monthlyInvestment * monthsToSimulate),
      maxDrawdown: maxDrawdown * 100,
      annualizedReturn: Math.pow(portfolioValue / (monthlyInvestment * monthsToSimulate), 1 / years) - 1
    };
  };

  const generateRandomReturn = (meanReturn, volatility) => {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    return meanReturn + (volatility * z0);
  };

  // ✅ FIXED: Added monthlyInvestment parameter
  const analyzeSimulationResults = (simulations, params, years, monthlyInvestment) => {
    // Sort simulations by final value
    const sortedByFinalValue = simulations.sort((a, b) => a.finalValue - b.finalValue);
    const sortedByReturns = simulations.sort((a, b) => a.annualizedReturn - b.annualizedReturn);
    const drawdowns = simulations.map(s => s.maxDrawdown).sort((a, b) => a - b);
    
    // Calculate percentiles
    const getPercentile = (arr, percentile) => {
      const index = Math.floor((percentile / 100) * arr.length);
      return arr[Math.min(index, arr.length - 1)];
    };
    
    const finalValues = sortedByFinalValue.map(s => s.finalValue);
    const totalInvested = simulations[0].totalInvested;
    
    // Goal achievement analysis
    const clientGoals = extractClientGoals(client);
    const goalAnalysis = clientGoals.map(goal => {
      const successfulSims = simulations.filter(s => s.finalValue >= goal.targetAmount).length;
      const successRate = (successfulSims / simulations.length) * 100;
      
      const shortfallSims = simulations.filter(s => s.finalValue < goal.targetAmount);
      const averageShortfall = shortfallSims.length > 0 
        ? shortfallSims.reduce((sum, s) => sum + (goal.targetAmount - s.finalValue), 0) / shortfallSims.length
        : 0;
      
      return {
        goalName: goal.name,
        targetAmount: goal.targetAmount,
        successRate: Math.round(successRate),
        averageShortfall: Math.round(averageShortfall),
        medianAchievement: getPercentile(finalValues, 50),
        // ✅ FIXED: Now using the passed monthlyInvestment parameter
        timeToGoal: calculateTimeToGoal(goal.targetAmount, params, monthlyInvestment)
      };
    });
    
    return {
      scenarioName: params.name,
      simulationCount: simulations.length,
      yearsSimulated: years,
      totalInvested: Math.round(totalInvested),
      
      // Portfolio value percentiles
      portfolioValue: {
        p10: Math.round(getPercentile(finalValues, 10)),
        p25: Math.round(getPercentile(finalValues, 25)),
        p50: Math.round(getPercentile(finalValues, 50)),
        p75: Math.round(getPercentile(finalValues, 75)),
        p90: Math.round(getPercentile(finalValues, 90)),
        mean: Math.round(finalValues.reduce((sum, val) => sum + val, 0) / finalValues.length)
      },
      
      // Return analysis
      returns: {
        p10: Math.round(getPercentile(sortedByReturns.map(s => s.annualizedReturn * 100), 10) * 100) / 100,
        p25: Math.round(getPercentile(sortedByReturns.map(s => s.annualizedReturn * 100), 25) * 100) / 100,
        p50: Math.round(getPercentile(sortedByReturns.map(s => s.annualizedReturn * 100), 50) * 100) / 100,
        p75: Math.round(getPercentile(sortedByReturns.map(s => s.annualizedReturn * 100), 75) * 100) / 100,
        p90: Math.round(getPercentile(sortedByReturns.map(s => s.annualizedReturn * 100), 90) * 100) / 100,
        expected: params.expectedReturn
      },
      
      // Risk metrics
      riskMetrics: {
        volatility: params.volatility,
        maxDrawdown: Math.round(getPercentile(drawdowns, 95) * 100) / 100,
        valueAtRisk95: Math.round((1 - getPercentile(finalValues, 5) / getPercentile(finalValues, 50)) * 100 * 100) / 100,
        sharpeRatio: calculateSharpeRatio(sortedByReturns.map(s => s.annualizedReturn)),
        successRate: Math.round((simulations.filter(s => s.finalValue > totalInvested).length / simulations.length) * 100)
      },
      
      // Goal analysis
      goalAnalysis,
      
      // Wealth building metrics
      wealthMetrics: {
        medianMultiplier: Math.round((getPercentile(finalValues, 50) / totalInvested) * 100) / 100,
        probabilityOfLoss: Math.round((simulations.filter(s => s.finalValue < totalInvested).length / simulations.length) * 100),
        averageGains: Math.round(finalValues.reduce((sum, val) => sum + val, 0) / finalValues.length - totalInvested),
        compoundGrowthRate: Math.round(Math.pow(getPercentile(finalValues, 50) / totalInvested, 1 / years) * 100 - 100)
      }
    };
  };

  const extractClientGoals = (client) => {
    const goals = [];
    
    // Add retirement goal
    const retirementAge = client.retirementPlanning?.retirementAge || 60;
    const retirementCorpus = client.retirementPlanning?.targetRetirementCorpus || 10000000;
    goals.push({
      name: 'Retirement Planning',
      targetAmount: retirementCorpus,
      years: Math.max(1, retirementAge - (client.age || 25))
    });
    
    // Add major goals
    if (client.majorGoals && client.majorGoals.length > 0) {
      client.majorGoals.forEach(goal => {
        goals.push({
          name: goal.goalName,
          targetAmount: goal.targetAmount,
          years: Math.max(1, goal.targetYear - new Date().getFullYear())
        });
      });
    }
    
    // Add enhanced goals
    if (client.enhancedFinancialGoals) {
      const enhanced = client.enhancedFinancialGoals;
      
      if (enhanced.childEducation?.isApplicable) {
        goals.push({
          name: 'Child Education',
          targetAmount: enhanced.childEducation.targetAmount,
          years: Math.max(1, enhanced.childEducation.targetYear - new Date().getFullYear())
        });
      }
      
      if (enhanced.homePurchase?.isApplicable) {
        goals.push({
          name: 'Home Purchase',
          targetAmount: enhanced.homePurchase.targetAmount,
          years: Math.max(1, enhanced.homePurchase.targetYear - new Date().getFullYear())
        });
      }
    }
    
    return goals;
  };

  const calculateTimeToGoal = (targetAmount, params, monthlyInvestment) => {
    const monthlyReturn = params.expectedReturn / 100 / 12;
    
    if (monthlyReturn === 0) {
      return Math.ceil(targetAmount / monthlyInvestment / 12);
    }
    
    // Future value of annuity formula: FV = PMT * (((1 + r)^n - 1) / r)
    // Solving for n: n = log(1 + (FV * r) / PMT) / log(1 + r)
    const months = Math.log(1 + (targetAmount * monthlyReturn) / monthlyInvestment) / Math.log(1 + monthlyReturn);
    return Math.ceil(months / 12);
  };

  const calculateSharpeRatio = (returns) => {
    const riskFreeRate = 0.06; // 6% risk-free rate
    const excessReturns = returns.map(r => r - riskFreeRate);
    const avgExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
    const stdDev = Math.sqrt(excessReturns.reduce((sum, r) => sum + Math.pow(r - avgExcessReturn, 2), 0) / excessReturns.length);
    return Math.round((avgExcessReturn / stdDev) * 100) / 100;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleProceed = () => {
    onComplete(simulationResults);
  };

  if (isCalculating) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Running Monte Carlo Simulation</h2>
            <p className="text-gray-600">
              Analyzing {scenarios.length} investment scenarios with 5,000 market simulations each...
            </p>
          </div>
          
          <div className="max-w-md mx-auto mb-6">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${calculationProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{Math.round(calculationProgress)}% Complete</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 max-w-lg mx-auto">
            <h4 className="font-semibold text-blue-900 mb-2">What we're calculating:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Portfolio growth projections over {Math.min(30, Math.max(10, 65 - (client.age || 25)))} years</li>
              <li>• Risk metrics including maximum drawdown and volatility</li>
              <li>• Goal achievement probability analysis</li>
              <li>• Return distribution across multiple market scenarios</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const selectedResult = selectedScenario ? simulationResults[selectedScenario] : null;
  const scenario = scenarios.find(s => s.id === selectedScenario);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Monte Carlo Simulation Results</h2>
        <p className="text-gray-600">
          Comprehensive analysis of {scenarios.length} investment scenarios with probabilistic projections
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors
                ${selectedScenario === scenario.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {scenario.name}
            </button>
          ))}
        </div>
      </div>

      {selectedResult && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-green-900">Median Portfolio Value</h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-900 mb-1">
                {formatCurrency(selectedResult.portfolioValue.p50)}
              </div>
              <div className="text-sm text-green-700">
                {selectedResult.wealthMetrics.medianMultiplier}x invested amount
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-blue-900">Expected Return</h3>
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-1">
                {selectedResult.returns.p50}%
              </div>
              <div className="text-sm text-blue-700">
                Median annualized return
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-orange-900">Max Drawdown</h3>
                <TrendingDown className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-900 mb-1">
                {selectedResult.riskMetrics.maxDrawdown}%
              </div>
              <div className="text-sm text-orange-700">
                95th percentile loss
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-purple-900">Success Rate</h3>
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-900 mb-1">
                {selectedResult.riskMetrics.successRate}%
              </div>
              <div className="text-sm text-purple-700">
                Probability of positive returns
              </div>
            </div>
          </div>

          {/* Portfolio Value Distribution */}
          <div className="bg-white border rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Value Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{formatCurrency(selectedResult.portfolioValue.p10)}</div>
                <div className="text-sm text-gray-600">10th Percentile<br/>(Pessimistic)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(selectedResult.portfolioValue.p25)}</div>
                <div className="text-sm text-gray-600">25th Percentile<br/>(Conservative)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(selectedResult.portfolioValue.p50)}</div>
                <div className="text-sm text-gray-600">50th Percentile<br/>(Median)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedResult.portfolioValue.p75)}</div>
                <div className="text-sm text-gray-600">75th Percentile<br/>(Optimistic)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedResult.portfolioValue.p90)}</div>
                <div className="text-sm text-gray-600">90th Percentile<br/>(Very Optimistic)</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total Invested: {formatCurrency(selectedResult.totalInvested)}</span>
                <span>Average Gains: {formatCurrency(selectedResult.wealthMetrics.averageGains)}</span>
              </div>
            </div>
          </div>

          {/* Goal Achievement Analysis */}
          {selectedResult.goalAnalysis.length > 0 && (
            <div className="bg-white border rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Achievement Probability</h3>
              <div className="space-y-4">
                {selectedResult.goalAnalysis.map((goal, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{goal.goalName}</h4>
                        <p className="text-sm text-gray-600">Target: {formatCurrency(goal.targetAmount)}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          goal.successRate >= 80 ? 'text-green-600' :
                          goal.successRate >= 60 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {goal.successRate}%
                        </div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div 
                        className={`h-3 rounded-full ${
                          goal.successRate >= 80 ? 'bg-green-500' :
                          goal.successRate >= 60 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${goal.successRate}%` }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Expected Time to Goal:</span>
                        <span className="ml-2 font-medium">{goal.timeToGoal} years</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Average Shortfall:</span>
                        <span className="ml-2 font-medium">
                          {goal.averageShortfall > 0 ? formatCurrency(goal.averageShortfall) : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Analysis */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Risk Analysis & Warnings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Key Risk Metrics</h4>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>• Portfolio Volatility: {selectedResult.riskMetrics.volatility}%</li>
                  <li>• Maximum Drawdown: {selectedResult.riskMetrics.maxDrawdown}%</li>
                  <li>• Value at Risk (95%): {selectedResult.riskMetrics.valueAtRisk95}%</li>
                  <li>• Probability of Loss: {selectedResult.wealthMetrics.probabilityOfLoss}%</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Important Considerations</h4>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>• Results based on historical patterns, not guaranteed</li>
                  <li>• Market conditions can differ significantly from projections</li>
                  <li>• Regular review and rebalancing recommended</li>
                  <li>• Consider emergency fund before investing</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Scenarios
        </button>
        
        <button
          onClick={handleProceed}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Proceed to Stress Testing
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default SimulationResultsStep;