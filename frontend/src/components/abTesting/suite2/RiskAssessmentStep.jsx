import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, ArrowLeft, CheckCircle, TrendingDown, Clock, Target, DollarSign } from 'lucide-react';

const RiskAssessmentStep = ({ client, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [riskProfile, setRiskProfile] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const riskQuestions = [
    {
      id: 'loss_tolerance',
      category: 'Loss Tolerance',
      question: 'If your ₹1 lakh investment becomes ₹70,000 in 6 months, what would you do?',
      icon: TrendingDown,
      options: [
        { id: 1, text: 'Sell immediately to avoid further loss', score: 2, description: 'Risk-averse approach - prioritizes capital preservation' },
        { id: 2, text: 'Hold and wait for recovery', score: 5, description: 'Moderate approach - believes in market recovery' },
        { id: 3, text: 'Invest more money at lower prices', score: 8, description: 'Opportunistic approach - views dips as buying opportunities' },
        { id: 4, text: "Don't care, it's long-term investment", score: 10, description: 'Long-term focused - unaffected by short-term volatility' }
      ]
    },
    {
      id: 'market_volatility',
      category: 'Market Volatility',
      question: 'How comfortable are you with market ups and downs?',
      icon: Target,
      options: [
        { id: 1, text: 'Very uncomfortable, prefer stable returns', score: 2, description: 'Prefers predictable, steady returns over market exposure' },
        { id: 2, text: 'Somewhat comfortable with minor fluctuations', score: 4, description: 'Accepts small volatility for potentially better returns' },
        { id: 3, text: 'Comfortable with moderate volatility', score: 7, description: 'Understands risk-return relationship in investing' },
        { id: 4, text: 'Very comfortable, volatility creates opportunity', score: 10, description: 'Views volatility as natural and potentially profitable' }
      ]
    },
    {
      id: 'investment_horizon',
      category: 'Investment Timeline',
      question: 'When will you need this invested money?',
      icon: Clock,
      options: [
        { id: 1, text: 'Within 2 years', score: 2, description: 'Short-term goals require more conservative approach' },
        { id: 2, text: '3-5 years', score: 4, description: 'Medium-term allows for some equity exposure' },
        { id: 3, text: '6-10 years', score: 7, description: 'Long-term horizon supports growth-oriented strategy' },
        { id: 4, text: 'More than 10 years', score: 10, description: 'Very long-term allows maximum growth potential' }
      ]
    },
    {
      id: 'financial_priority',
      category: 'Financial Priority',
      question: 'What is your primary investment objective?',
      icon: Target,
      options: [
        { id: 1, text: 'Capital preservation with minimal risk', score: 2, description: 'Safety first - protecting existing wealth' },
        { id: 2, text: 'Steady income generation', score: 4, description: 'Regular income through dividends/interest' },
        { id: 3, text: 'Balanced growth with moderate income', score: 7, description: 'Combination of growth and income objectives' },
        { id: 4, text: 'Maximum capital appreciation', score: 10, description: 'Aggressive growth - maximizing wealth creation' }
      ]
    },
    {
      id: 'income_stability',
      category: 'Income Stability',
      question: 'How would you describe your income stability?',
      icon: DollarSign,
      options: [
        { id: 1, text: 'Highly variable/uncertain income', score: 2, description: 'Irregular income requires more conservative approach' },
        { id: 2, text: 'Somewhat stable with occasional variations', score: 4, description: 'Generally stable with minor fluctuations' },
        { id: 3, text: 'Very stable and predictable', score: 7, description: 'Consistent income allows for higher risk tolerance' },
        { id: 4, text: 'Multiple income sources, very secure', score: 10, description: 'Diversified income provides investment flexibility' }
      ]
    },
    {
      id: 'investment_experience',
      category: 'Investment Experience',
      question: 'What is your investment experience level?',
      icon: CheckCircle,
      options: [
        { id: 1, text: 'Beginner - mostly savings accounts and FDs', score: 2, description: 'Limited exposure to market instruments' },
        { id: 2, text: 'Basic - some mutual funds or insurance', score: 4, description: 'Familiar with basic investment products' },
        { id: 3, text: 'Intermediate - stocks, bonds, various funds', score: 7, description: 'Good understanding of different asset classes' },
        { id: 4, text: 'Advanced - complex products and strategies', score: 10, description: 'Sophisticated investor with market knowledge' }
      ]
    }
  ];

  const handleResponseSelect = (optionId) => {
    const selectedOption = riskQuestions[currentQuestion].options.find(opt => opt.id === optionId);
    
    setResponses(prev => ({
      ...prev,
      [riskQuestions[currentQuestion].id]: {
        questionId: riskQuestions[currentQuestion].id,
        optionId: optionId,
        score: selectedOption.score,
        text: selectedOption.text,
        description: selectedOption.description,
        category: riskQuestions[currentQuestion].category
      }
    }));
  };

  const calculateRiskProfile = () => {
    const totalScore = Object.values(responses).reduce((sum, response) => sum + response.score, 0);
    const maxPossibleScore = riskQuestions.length * 10;
    const riskPercentage = (totalScore / maxPossibleScore) * 100;

    let riskCategory, riskLevel, recommendedAllocation, description, warnings;

    if (riskPercentage <= 35) {
      riskCategory = 'Conservative';
      riskLevel = 'Low';
      recommendedAllocation = { equity: 30, debt: 60, alternatives: 10 };
      description = 'You prefer stability and capital preservation over high returns. Focus on debt instruments with minimal equity exposure.';
      warnings = ['Market volatility may cause significant stress', 'Emergency fund should be 12+ months of expenses'];
    } else if (riskPercentage <= 60) {
      riskCategory = 'Moderate';
      riskLevel = 'Medium';
      recommendedAllocation = { equity: 60, debt: 35, alternatives: 5 };
      description = 'You seek balanced growth with acceptable risk levels. Suitable for long-term wealth building with diversified portfolio.';
      warnings = ['Be prepared for 15-20% portfolio swings', 'Review and rebalance annually'];
    } else if (riskPercentage <= 80) {
      riskCategory = 'Aggressive';
      riskLevel = 'High';
      recommendedAllocation = { equity: 80, debt: 15, alternatives: 5 };
      description = 'You are comfortable with volatility to achieve superior long-term returns. Suitable for wealth maximization goals.';
      warnings = ['Expect 25-30% portfolio volatility', 'Requires 7+ year investment horizon', 'Regular review needed during market downturns'];
    } else {
      riskCategory = 'Very Aggressive';
      riskLevel = 'Very High';
      recommendedAllocation = { equity: 90, debt: 5, alternatives: 5 };
      description = 'You seek maximum growth and are comfortable with high volatility. Suitable only for very long-term goals.';
      warnings = ['Portfolio may swing 40%+ annually', 'Requires 10+ year commitment', 'Strong emotional discipline needed', 'Consider reducing allocation as you approach goals'];
    }

    return {
      totalScore,
      maxPossibleScore,
      riskPercentage: Math.round(riskPercentage),
      riskCategory,
      riskLevel,
      recommendedAllocation,
      description,
      warnings,
      responses,
      timestamp: new Date().toISOString(),
      clientAge: client.age || 25,
      assessmentBasis: 'Comprehensive 6-factor questionnaire'
    };
  };

  const handleNext = () => {
    if (currentQuestion < riskQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const profile = calculateRiskProfile();
      setRiskProfile(profile);
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleComplete = () => {
    onComplete(riskProfile);
  };

  if (showResults) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Risk Assessment Results</h2>
          <p className="text-gray-600">
            Based on your responses, here's your comprehensive risk profile for {client.firstName} {client.lastName}
          </p>
        </div>

        {/* Risk Profile Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Risk Score Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Risk Score</h3>
              <div className={`w-4 h-4 rounded-full ${
                riskProfile.riskLevel === 'Low' ? 'bg-green-500' :
                riskProfile.riskLevel === 'Medium' ? 'bg-yellow-500' :
                riskProfile.riskLevel === 'High' ? 'bg-orange-500' : 'bg-red-500'
              }`} />
            </div>
            <div className="text-3xl font-bold text-blue-900 mb-2">
              {riskProfile.riskPercentage}%
            </div>
            <div className="text-sm text-blue-700">
              {riskProfile.totalScore} out of {riskProfile.maxPossibleScore} points
            </div>
          </div>

          {/* Risk Category Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-900">Risk Category</h3>
              <AlertTriangle className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900 mb-2">
              {riskProfile.riskCategory}
            </div>
            <div className="text-sm text-purple-700">
              {riskProfile.riskLevel} Risk Tolerance
            </div>
          </div>

          {/* Recommended Allocation Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Recommended Allocation</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-green-700">Equity:</span>
                <span className="font-semibold text-green-900">{riskProfile.recommendedAllocation.equity}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700">Debt:</span>
                <span className="font-semibold text-green-900">{riskProfile.recommendedAllocation.debt}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700">Alternatives:</span>
                <span className="font-semibold text-green-900">{riskProfile.recommendedAllocation.alternatives}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Profile Description */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Investment Personality</h4>
          <p className="text-gray-700 leading-relaxed">{riskProfile.description}</p>
        </div>

        {/* Warnings and Considerations */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Important Considerations
          </h4>
          <ul className="space-y-2">
            {riskProfile.warnings.map((warning, index) => (
              <li key={index} className="text-yellow-800 flex items-start">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                {warning}
              </li>
            ))}
          </ul>
        </div>

        {/* Response Summary */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Responses Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(riskProfile.responses).map((response, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border">
                <h5 className="font-medium text-gray-900 mb-2">{response.category}</h5>
                <p className="text-sm text-gray-700 mb-2">{response.text}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{response.description}</span>
                  <span className="text-sm font-semibold text-blue-600">{response.score}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowResults(false)}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retake Assessment
          </button>
          
          <button
            onClick={handleComplete}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Generate Investment Scenarios
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  const question = riskQuestions[currentQuestion];
  const selectedResponse = responses[question.id];
  const Icon = question.icon;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Risk Assessment</h2>
        <p className="text-gray-600">
          Answer these questions to determine your investment risk profile and generate personalized strategies.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestion + 1} of {riskQuestions.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentQuestion + 1) / riskQuestions.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / riskQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border-2 border-gray-100 rounded-xl p-8 mb-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{question.category}</h3>
            <p className="text-gray-600">Investment behavior assessment</p>
          </div>
        </div>

        <h4 className="text-xl font-medium text-gray-900 mb-6 leading-relaxed">
          {question.question}
        </h4>

        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleResponseSelect(option.id)}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md
                ${selectedResponse?.optionId === option.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">{option.text}</p>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
                <div className="ml-4 flex items-center">
                  <span className="text-sm font-semibold text-blue-600">{option.score}/10</span>
                  {selectedResponse?.optionId === option.id && (
                    <CheckCircle className="w-5 h-5 text-blue-600 ml-2" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className={`
            flex items-center px-4 py-2 rounded-lg transition-colors
            ${currentQuestion === 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }
          `}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!selectedResponse}
          className={`
            flex items-center px-6 py-2 rounded-lg font-medium transition-all duration-200
            ${selectedResponse
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {currentQuestion === riskQuestions.length - 1 ? 'Calculate Risk Profile' : 'Next Question'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default RiskAssessmentStep;