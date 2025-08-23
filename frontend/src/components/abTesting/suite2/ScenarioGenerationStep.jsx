import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight, ArrowLeft, Settings, PieChart, BarChart3, Target, Zap } from 'lucide-react';

const ScenarioGenerationStep = ({ client, riskProfile, onComplete }) => {
  const [scenarios, setScenarios] = useState([]);
  const [customScenario, setCustomScenario] = useState(null);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState(new Set());

  useEffect(() => {
    generateAutomaticScenarios();
  }, [client, riskProfile]);

  const generateAutomaticScenarios = () => {
    const clientAge = client.age || 25;
    const riskScore = riskProfile.riskPercentage;
    const monthlyIncome = client.totalMonthlyIncome || 50000;
    const investmentHorizon = Math.max(1, 60 - clientAge); // Years to retirement

    const scenarioConfigs = [
      {
        id: 'conservative',
        name: 'Conservative Strategy',
        description: 'Capital preservation with steady, predictable returns',
        color: 'green',
        icon: Target,
        condition: true, // Always generate
        parameters: calculateConservativeParams(clientAge, riskScore, investmentHorizon)
      },
      {
        id: 'moderate',
        name: 'Moderate Growth',
        description: 'Balanced approach with moderate risk for steady growth',
        color: 'blue',
        icon: BarChart3,
        condition: riskScore >= 25,
        parameters: calculateModerateParams(clientAge, riskScore, investmentHorizon)
      },
      {
        id: 'aggressive',
        name: 'Aggressive Growth',
        description: 'High growth potential with higher volatility',
        color: 'orange',
        icon: TrendingUp,
        condition: riskScore >= 50 && clientAge < 50,
        parameters: calculateAggressiveParams(clientAge, riskScore, investmentHorizon)
      },
      {
        id: 'ultra_aggressive',
        name: 'Ultra Aggressive',
        description: 'Maximum growth focus for very long-term wealth building',
        color: 'red',
        icon: Zap,
        condition: riskScore >= 75 && clientAge < 40 && investmentHorizon > 15,
        parameters: calculateUltraAggressiveParams(clientAge, riskScore, investmentHorizon)
      }
    ];

    const validScenarios = scenarioConfigs
      .filter(scenario => scenario.condition)
      .map(scenario => ({
        ...scenario,
        monthlyInvestment: calculateOptimalSIP(monthlyIncome, scenario.parameters.riskLevel),
        projectedReturns: calculateProjectedReturns(scenario.parameters),
        suitabilityScore: calculateSuitabilityScore(scenario.parameters, riskProfile, client)
      }));

    setScenarios(validScenarios);
    
    // Auto-select top 3 scenarios by suitability
    const topScenarios = validScenarios
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
      .slice(0, 3)
      .map(s => s.id);
    
    setSelectedScenarios(new Set(topScenarios));
  };

  function calculateConservativeParams(age, riskScore, horizon) {
    return {
      equityAllocation: Math.min(40, Math.max(20, 60 - age)),
      debtAllocation: Math.max(50, Math.min(75, age + 20)),
      alternativesAllocation: Math.max(5, Math.min(15, 100 - (60 - age) - (age + 20))),
      expectedReturn: 7 + (age < 30 ? 1 : 0),
      volatility: 8 + (age < 40 ? 2 : 0),
      rebalancingFrequency: 'Quarterly',
      riskLevel: 'Low',
      maxDrawdown: 12,
      sharpeRatio: 0.85
    };
  }

  function calculateModerateParams(age, riskScore, horizon) {
    const equityBase = Math.min(70, Math.max(40, 100 - age));
    return {
      equityAllocation: equityBase,
      debtAllocation: Math.max(25, 90 - equityBase),
      alternativesAllocation: Math.max(5, 100 - equityBase - (90 - equityBase)),
      expectedReturn: 9 + (riskScore > 40 ? 1 : 0),
      volatility: 12 + (horizon > 10 ? 2 : 0),
      rebalancingFrequency: 'Semi-Annual',
      riskLevel: 'Medium',
      maxDrawdown: 18,
      sharpeRatio: 0.75
    };
  }

  function calculateAggressiveParams(age, riskScore, horizon) {
    const equityBase = Math.min(85, Math.max(60, 120 - age));
    return {
      equityAllocation: equityBase,
      debtAllocation: Math.max(10, 25 - (equityBase - 60) / 5),
      alternativesAllocation: Math.max(5, 100 - equityBase - Math.max(10, 25 - (equityBase - 60) / 5)),
      expectedReturn: 11 + (horizon > 15 ? 1 : 0),
      volatility: 16 + (riskScore > 70 ? 2 : 0),
      rebalancingFrequency: 'Annual',
      riskLevel: 'High',
      maxDrawdown: 25,
      sharpeRatio: 0.68
    };
  }

  function calculateUltraAggressiveParams(age, riskScore, horizon) {
    return {
      equityAllocation: Math.min(95, Math.max(80, 140 - age)),
      debtAllocation: Math.max(0, Math.min(15, age - 25)),
      alternativesAllocation: Math.max(5, Math.min(20, 15)),
      expectedReturn: 13 + (horizon > 20 ? 1 : 0),
      volatility: 20 + (riskScore > 85 ? 3 : 0),
      rebalancingFrequency: 'Annual',
      riskLevel: 'Very High',
      maxDrawdown: 35,
      sharpeRatio: 0.65
    };
  }

  function calculateOptimalSIP(monthlyIncome, riskLevel) {
    const basePercentage = {
      'Low': 0.15,
      'Medium': 0.20,
      'High': 0.25,
      'Very High': 0.30
    };
    
    return Math.round((monthlyIncome * basePercentage[riskLevel]) / 1000) * 1000;
  }

  function calculateProjectedReturns(params) {
    const { expectedReturn, volatility } = params;
    
    return {
      year1: expectedReturn * 0.8, // Conservative first year
      year3: expectedReturn * 0.9,
      year5: expectedReturn,
      year10: expectedReturn * 1.1,
      year15: expectedReturn * 1.05,
      year20: expectedReturn
    };
  }

  function calculateSuitabilityScore(params, riskProfile, client) {
    let score = 0;
    
    // Risk alignment (40% weight)
    const riskAlignment = 100 - Math.abs(riskProfile.riskPercentage - 
      (params.riskLevel === 'Low' ? 25 : 
       params.riskLevel === 'Medium' ? 50 : 
       params.riskLevel === 'High' ? 75 : 90));
    score += riskAlignment * 0.4;
    
    // Age appropriateness (30% weight)
    const clientAge = client.age || 25;
    const ageScore = params.equityAllocation <= (100 - clientAge) ? 100 : 
                    Math.max(0, 100 - (params.equityAllocation - (100 - clientAge)) * 2);
    score += ageScore * 0.3;
    
    // Expected return vs risk (20% weight)
    const returnRiskRatio = (params.expectedReturn / params.volatility) * 100;
    const returnScore = Math.min(100, returnRiskRatio * 10);
    score += returnScore * 0.2;
    
    // Diversification (10% weight)
    const diversificationScore = 100 - Math.abs(params.equityAllocation - 60);
    score += diversificationScore * 0.1;
    
    return Math.round(score);
  }

  const handleScenarioToggle = (scenarioId) => {
    const newSelected = new Set(selectedScenarios);
    if (newSelected.has(scenarioId)) {
      newSelected.delete(scenarioId);
    } else {
      newSelected.add(scenarioId);
    }
    setSelectedScenarios(newSelected);
  };

  const handleCustomScenarioCreate = () => {
    const newCustom = {
      id: 'custom',
      name: 'Custom Strategy',
      description: 'Personalized investment strategy',
      color: 'purple',
      icon: Settings,
      parameters: {
        equityAllocation: 60,
        debtAllocation: 35,
        alternativesAllocation: 5,
        expectedReturn: 10,
        volatility: 14,
        rebalancingFrequency: 'Semi-Annual',
        riskLevel: 'Medium',
        maxDrawdown: 20,
        sharpeRatio: 0.71
      },
      monthlyInvestment: calculateOptimalSIP(client.totalMonthlyIncome || 50000, 'Medium'),
      projectedReturns: calculateProjectedReturns({expectedReturn: 10, volatility: 14}),
      suitabilityScore: 85,
      isCustom: true
    };
    
    setCustomScenario(newCustom);
    setShowCustomBuilder(true);
  };

  const handleCustomScenarioSave = () => {
    if (customScenario) {
      setScenarios(prev => [...prev.filter(s => s.id !== 'custom'), customScenario]);
      setSelectedScenarios(prev => new Set([...prev, 'custom']));
      setShowCustomBuilder(false);
    }
  };

  const handleProceed = () => {
    const selectedScenarioData = scenarios.filter(s => selectedScenarios.has(s.id));
    onComplete(selectedScenarioData);
  };

  const getColorClasses = (color) => {
    const colors = {
      green: 'border-green-500 bg-green-50 text-green-900',
      blue: 'border-blue-500 bg-blue-50 text-blue-900',
      orange: 'border-orange-500 bg-orange-50 text-orange-900',
      red: 'border-red-500 bg-red-50 text-red-900',
      purple: 'border-purple-500 bg-purple-50 text-purple-900'
    };
    return colors[color] || colors.blue;
  };

  if (showCustomBuilder) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Custom Scenario Builder</h2>
          <p className="text-gray-600">
            Create a personalized investment strategy with your preferred allocation and parameters.
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equity Allocation: {customScenario?.parameters.equityAllocation}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={customScenario?.parameters.equityAllocation || 60}
                onChange={(e) => setCustomScenario(prev => ({
                  ...prev,
                  parameters: {
                    ...prev.parameters,
                    equityAllocation: parseInt(e.target.value)
                  }
                }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Debt Allocation: {customScenario?.parameters.debtAllocation}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={customScenario?.parameters.debtAllocation || 35}
                onChange={(e) => setCustomScenario(prev => ({
                  ...prev,
                  parameters: {
                    ...prev.parameters,
                    debtAllocation: parseInt(e.target.value)
                  }
                }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alternatives: {customScenario?.parameters.alternativesAllocation}%
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={customScenario?.parameters.alternativesAllocation || 5}
                onChange={(e) => setCustomScenario(prev => ({
                  ...prev,
                  parameters: {
                    ...prev.parameters,
                    alternativesAllocation: parseInt(e.target.value)
                  }
                }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Return: {customScenario?.parameters.expectedReturn}%
              </label>
              <input
                type="range"
                min="5"
                max="18"
                step="0.5"
                value={customScenario?.parameters.expectedReturn || 10}
                onChange={(e) => setCustomScenario(prev => ({
                  ...prev,
                  parameters: {
                    ...prev.parameters,
                    expectedReturn: parseFloat(e.target.value)
                  }
                }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volatility: {customScenario?.parameters.volatility}%
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="0.5"
                value={customScenario?.parameters.volatility || 14}
                onChange={(e) => setCustomScenario(prev => ({
                  ...prev,
                  parameters: {
                    ...prev.parameters,
                    volatility: parseFloat(e.target.value)
                  }
                }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setShowCustomBuilder(false)}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Scenarios
          </button>
          
          <button
            onClick={handleCustomScenarioSave}
            className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Save Custom Scenario
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Investment Scenario Generation</h2>
        <p className="text-gray-600">
          Based on {client.firstName}'s risk profile ({riskProfile.riskCategory}), we've generated optimized investment strategies.
        </p>
      </div>

      {/* Risk Profile Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Current Risk Profile</h3>
            <p className="text-gray-600">{riskProfile.riskCategory} • {riskProfile.riskPercentage}% Risk Score</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Recommended Base Allocation</p>
            <p className="font-medium">
              {riskProfile.recommendedAllocation.equity}% Equity, {riskProfile.recommendedAllocation.debt}% Debt
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          const isSelected = selectedScenarios.has(scenario.id);
          
          return (
            <div
              key={scenario.id}
              onClick={() => handleScenarioToggle(scenario.id)}
              className={`
                border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg
                ${isSelected 
                  ? getColorClasses(scenario.color) + ' shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {/* Scenario Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    isSelected ? 'bg-white bg-opacity-80' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${isSelected ? scenario.color === 'green' ? 'text-green-600' : 
                      scenario.color === 'blue' ? 'text-blue-600' :
                      scenario.color === 'orange' ? 'text-orange-600' :
                      scenario.color === 'red' ? 'text-red-600' : 'text-purple-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{scenario.name}</h3>
                    <p className={`text-sm ${isSelected ? 'opacity-80' : 'text-gray-600'}`}>
                      {scenario.description}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-white bg-white' : 'border-gray-400'
                  }`}>
                    {isSelected && (
                      <div className={`w-3 h-3 rounded-full ${
                        scenario.color === 'green' ? 'bg-green-600' :
                        scenario.color === 'blue' ? 'bg-blue-600' :
                        scenario.color === 'orange' ? 'bg-orange-600' :
                        scenario.color === 'red' ? 'bg-red-600' : 'bg-purple-600'
                      }`} />
                    )}
                  </div>
                </div>
              </div>

              {/* Asset Allocation */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Asset Allocation</h4>
                <div className="flex items-center space-x-2 mb-2">
                  <div 
                    className="h-3 bg-blue-500 rounded-full"
                    style={{ width: `${scenario.parameters.equityAllocation}%` }}
                  />
                  <div 
                    className="h-3 bg-green-500 rounded-full"
                    style={{ width: `${scenario.parameters.debtAllocation}%` }}
                  />
                  <div 
                    className="h-3 bg-yellow-500 rounded-full"
                    style={{ width: `${scenario.parameters.alternativesAllocation}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span>Equity: {scenario.parameters.equityAllocation}%</span>
                  <span>Debt: {scenario.parameters.debtAllocation}%</span>
                  <span>Alt: {scenario.parameters.alternativesAllocation}%</span>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs opacity-75">Expected Return</p>
                  <p className="font-semibold text-lg">{scenario.parameters.expectedReturn}%</p>
                </div>
                <div>
                  <p className="text-xs opacity-75">Volatility</p>
                  <p className="font-semibold text-lg">{scenario.parameters.volatility}%</p>
                </div>
                <div>
                  <p className="text-xs opacity-75">Max Drawdown</p>
                  <p className="font-semibold text-lg">{scenario.parameters.maxDrawdown}%</p>
                </div>
                <div>
                  <p className="text-xs opacity-75">Suitability Score</p>
                  <p className="font-semibold text-lg">{scenario.suitabilityScore}/100</p>
                </div>
              </div>

              {/* Monthly Investment */}
              <div className="pt-3 border-t border-opacity-20">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Recommended SIP:</span>
                  <span className="font-semibold">₹{scenario.monthlyInvestment.toLocaleString()}/month</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Scenario Option */}
      <div className="mb-6">
        <button
          onClick={handleCustomScenarioCreate}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200"
        >
          <div className="flex items-center justify-center">
            <Settings className="w-6 h-6 text-gray-400 mr-3" />
            <span className="text-gray-600 font-medium">Create Custom Scenario</span>
          </div>
        </button>
      </div>

      {/* Selection Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-900 mb-2">Selected Scenarios ({selectedScenarios.size})</h4>
        <div className="flex flex-wrap gap-2">
          {Array.from(selectedScenarios).map(id => {
            const scenario = scenarios.find(s => s.id === id);
            return scenario ? (
              <span key={id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {scenario.name}
              </span>
            ) : null;
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Risk Assessment
        </button>
        
        <button
          onClick={handleProceed}
          disabled={selectedScenarios.size === 0}
          className={`
            flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200
            ${selectedScenarios.size > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Run Monte Carlo Simulation ({selectedScenarios.size} scenarios)
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default ScenarioGenerationStep;