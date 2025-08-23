import React, { useState, useEffect } from 'react';
import { Target, ArrowRight, ArrowLeft, AlertTriangle, TrendingDown, Clock, Shield, Zap } from 'lucide-react';
// ✅ Fixed PDF generation imports
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StressTestingStep = ({ client, scenarios, simulationResults, onComplete }) => {
  const [stressTestResults, setStressTestResults] = useState({});
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedCrisis, setSelectedCrisis] = useState('covid_2020');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Prevent multiple submissions
  const [submitError, setSubmitError] = useState(null); // ✅ Track submission errors

  const historicalScenarios = {
    covid_2020: {
      name: 'COVID-19 Pandemic (2020)',
      marketCrashPercentage: -25,
      recoveryTimeMonths: 18,
      inflationSpike: 4,
      interestRateChange: -2,
      unemploymentSpike: 8,
      description: 'Global pandemic causing market volatility and economic uncertainty',
      sectorImpacts: {
        technology: -10,
        healthcare: 5,
        travel: -50,
        realEstate: -20,
        energy: -35,
        financials: -30
      },
      behavioralImpact: 'High panic selling, flight to safety assets'
    },
    financial_crisis_2008: {
      name: 'Global Financial Crisis (2008)',
      marketCrashPercentage: -40,
      recoveryTimeMonths: 36,
      inflationSpike: 2,
      interestRateChange: -3,
      unemploymentSpike: 12,
      description: 'Banking crisis leading to global recession and market collapse',
      sectorImpacts: {
        banking: -60,
        realEstate: -45,
        technology: -30,
        consumerGoods: -25,
        energy: -40,
        healthcare: -15
      },
      behavioralImpact: 'Extreme risk aversion, credit market freeze'
    },
    high_inflation_1980s: {
      name: 'High Inflation Period (1980s)',
      marketCrashPercentage: -15,
      recoveryTimeMonths: 42,
      inflationSpike: 8,
      interestRateChange: 5,
      unemploymentSpike: 6,
      description: 'Persistent high inflation leading to monetary policy tightening',
      sectorImpacts: {
        commodities: 20,
        realEstate: 10,
        bonds: -30,
        growthStocks: -40,
        financials: 15,
        utilities: -20
      },
      behavioralImpact: 'Focus on inflation hedges, bond market volatility'
    },
    dot_com_bubble_2000: {
      name: 'Dot-Com Bubble Burst (2000)',
      marketCrashPercentage: -30,
      recoveryTimeMonths: 30,
      inflationSpike: 1,
      interestRateChange: -2,
      unemploymentSpike: 4,
      description: 'Technology sector collapse after speculative bubble',
      sectorImpacts: {
        technology: -70,
        telecommunications: -60,
        media: -45,
        utilities: 5,
        healthcare: -10,
        consumerGoods: -15
      },
      behavioralImpact: 'Tech sector avoidance, value investing preference'
    }
  };

  useEffect(() => {
    runStressTests();
  }, [scenarios, simulationResults]);

  useEffect(() => {
    if (scenarios.length > 0) {
      setSelectedScenario(scenarios[0].id);
    }
  }, [scenarios]);

  const runStressTests = async () => {
    setIsCalculating(true);
    const results = {};
    
    for (const scenario of scenarios) {
      results[scenario.id] = [];  // ✅ Changed to array format to match backend expectation
      
      for (const [crisisId, crisisData] of Object.entries(historicalScenarios)) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate calculation time
        
        const stressTestResult = calculateStressTestImpact(
          scenario,
          crisisData,
          simulationResults[scenario.id],
          client
        );
        
        // ✅ Format data properly for backend
        results[scenario.id].push({
          crisisId: crisisId,
          ...stressTestResult
        });
      }
    }
    
    setStressTestResults(results);
    setIsCalculating(false);
  };

  const calculateStressTestImpact = (scenario, crisis, simulationResult, client) => {
    const { marketCrashPercentage, recoveryTimeMonths, sectorImpacts } = crisis;
    const currentPortfolioValue = simulationResult.portfolioValue.p50;
    const monthlyInvestment = scenario.monthlyInvestment;
    
    // Calculate immediate portfolio impact based on asset allocation
    const equityAllocation = scenario.parameters.equityAllocation / 100;
    const debtAllocation = scenario.parameters.debtAllocation / 100;
    const alternativesAllocation = scenario.parameters.alternativesAllocation / 100;
    
    // Apply crisis impact to different asset classes
    const equityImpact = marketCrashPercentage * 1.2; // Equity hit harder
    const debtImpact = marketCrashPercentage * 0.3; // Debt more stable
    const alternativesImpact = marketCrashPercentage * 0.6; // Alternatives moderate impact
    
    const immediatePortfolioLoss = (
      (equityAllocation * equityImpact) +
      (debtAllocation * debtImpact) +
      (alternativesAllocation * alternativesImpact)
    );
    
    const portfolioValueAfterCrisis = currentPortfolioValue * (1 + immediatePortfolioLoss / 100);
    const actualLossAmount = currentPortfolioValue - portfolioValueAfterCrisis;
    
    // Calculate recovery trajectory
    const recoveryTrajectory = calculateRecoveryPath(
      portfolioValueAfterCrisis,
      currentPortfolioValue,
      recoveryTimeMonths,
      monthlyInvestment,
      scenario.parameters.expectedReturn
    );
    
    // Analyze impact on client goals
    const goalImpacts = analyzeGoalImpacts(
      client,
      actualLossAmount,
      recoveryTimeMonths,
      monthlyInvestment
    );
    
    // Determine behavioral considerations
    const behavioralAnalysis = analyzeBehavioralImpact(
      immediatePortfolioLoss,
      client,
      scenario,
      crisis
    );
    
    return {
      crisisName: crisis.name,
      immediateImpact: {
        portfolioLossPercentage: Math.round(Math.abs(immediatePortfolioLoss) * 100) / 100,
        portfolioLossAmount: Math.round(actualLossAmount),
        portfolioValueAfterCrisis: Math.round(portfolioValueAfterCrisis),
        originalValue: Math.round(currentPortfolioValue)
      },
      recoveryAnalysis: {
        timeToRecoveryMonths: recoveryTimeMonths,
        recoveryTrajectory: recoveryTrajectory,
        finalRecoveryValue: Math.round(recoveryTrajectory[recoveryTrajectory.length - 1].value),
        totalRecoveryGain: Math.round(recoveryTrajectory[recoveryTrajectory.length - 1].value - portfolioValueAfterCrisis)
      },
      goalImpacts: goalImpacts,
      behavioralConsiderations: behavioralAnalysis,
      riskMetrics: {
        maxDrawdownFromPeak: Math.round(Math.abs(immediatePortfolioLoss) * 100) / 100,
        timeToBreakeven: Math.ceil(recoveryTimeMonths * 0.8),
        additionalSIPRequired: calculateAdditionalSIPForRecovery(
          actualLossAmount,
          recoveryTimeMonths,
          scenario.parameters.expectedReturn
        )
      }
    };
  };

  const calculateRecoveryPath = (startValue, targetValue, recoveryMonths, monthlyInvestment, expectedReturn) => {
    const path = [];
    const monthlyReturn = expectedReturn / 100 / 12;
    let currentValue = startValue;
    
    for (let month = 1; month <= recoveryMonths; month++) {
      // Apply market recovery (gradual return to normal growth)
      const recoveryFactor = Math.min(1, month / recoveryMonths);
      const adjustedReturn = monthlyReturn * recoveryFactor;
      
      currentValue = currentValue * (1 + adjustedReturn) + monthlyInvestment;
      
      path.push({
        month,
        value: currentValue,
        recoveryPercentage: Math.min(100, ((currentValue - startValue) / (targetValue - startValue)) * 100)
      });
    }
    
    return path;
  };

  const analyzeGoalImpacts = (client, lossAmount, recoveryMonths, monthlyInvestment) => {
    const impacts = [];
    
    // Retirement impact
    if (client.retirementPlanning?.targetRetirementCorpus) {
      const retirementDelay = Math.ceil(lossAmount / (monthlyInvestment * 12));
      impacts.push({
        goalName: 'Retirement Planning',
        delayMonths: Math.max(0, retirementDelay),
        additionalSIPRequired: Math.round(lossAmount / (retirementDelay * 12)),
        severity: retirementDelay > 2 ? 'High' : retirementDelay > 1 ? 'Medium' : 'Low'
      });
    }
    
    // Other major goals
    if (client.majorGoals) {
      client.majorGoals.forEach(goal => {
        const goalDelay = Math.ceil(lossAmount / (monthlyInvestment * 6)); // Assume 50% allocation to this goal
        impacts.push({
          goalName: goal.goalName,
          delayMonths: Math.max(0, goalDelay),
          additionalSIPRequired: Math.round(lossAmount / (goalDelay * 12)),
          severity: goalDelay > 1 ? 'High' : goalDelay > 0.5 ? 'Medium' : 'Low'
        });
      });
    }
    
    return impacts;
  };

  const analyzeBehavioralImpact = (portfolioLoss, client, scenario, crisis) => {
    const lossPercentage = Math.abs(portfolioLoss);
    const riskTolerance = scenario.parameters.riskLevel;
    
    let likelyReaction, recommendedAction, emotionalSupportRequired;
    
    if (lossPercentage > 25 || riskTolerance === 'Low') {
      likelyReaction = 'Panic Sell';
      recommendedAction = 'Hold steady, increase emergency fund, consider reducing equity allocation by 10-15%';
      emotionalSupportRequired = true;
    } else if (lossPercentage > 15 || riskTolerance === 'Medium') {
      likelyReaction = 'Hold Steady';
      recommendedAction = 'Continue SIPs, review asset allocation, prepare for volatility';
      emotionalSupportRequired = true;
    } else {
      likelyReaction = 'Buy More';
      recommendedAction = 'Consider increasing SIP by 20-30% during crisis for better returns';
      emotionalSupportRequired = false;
    }
    
    return {
      likelyClientReaction: likelyReaction,
      recommendedAction: recommendedAction,
      emotionalSupportRequired: emotionalSupportRequired,
      keyMessages: [
        'Market downturns are temporary and part of normal cycles',
        'Continuing investments during crisis often yields better long-term returns',
        'Focus on long-term goals rather than short-term volatility',
        'Emergency fund should be maintained separately from investments'
      ]
    };
  };

  const calculateAdditionalSIPForRecovery = (lossAmount, recoveryMonths, expectedReturn) => {
    if (recoveryMonths === 0) return 0;
    
    const monthlyReturn = expectedReturn / 100 / 12;
    const requiredAdditional = lossAmount / (recoveryMonths * 0.8); // Recover in 80% of time
    
    return Math.round(requiredAdditional);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-orange-600 bg-orange-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // ✅ Simple PDF Generation Function (No autoTable dependency)
  const generateAndDownloadPDF = async () => {
    try {
      console.log('🔄 Starting PDF generation...');
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      let yPosition = 20;
      const leftMargin = 20;
      const rightMargin = pageWidth - 20;

      console.log('✅ PDF instance created successfully');

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('A/B Testing Suite 2.0 - Complete Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Client Info
      pdf.setFontSize(14);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Client: ${client?.firstName || 'Unknown'} ${client?.lastName || 'Client'}`, leftMargin, yPosition);
      yPosition += 10;
      pdf.text(`Report Generated: ${new Date().toLocaleDateString('en-IN')}`, leftMargin, yPosition);
      yPosition += 20;

      console.log('✅ Header added to PDF');

      // Risk Profile Summary
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Risk Profile Summary', leftMargin, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(12);
      pdf.setTextColor(60, 60, 60);
      
      // Risk profile data as simple text
      const riskData = [
        'Risk Category: Very Aggressive',
        'Risk Score: 87%',
        'Risk Level: Very High'
      ];
      
      riskData.forEach(text => {
        pdf.text(`• ${text}`, leftMargin + 5, yPosition);
        yPosition += 8;
      });
      yPosition += 15;

      console.log('✅ Risk profile added');

      // Investment Scenarios
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Investment Scenarios Tested', leftMargin, yPosition);
      yPosition += 15;

      if (scenarios && scenarios.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 60);
        
        scenarios.forEach((scenario, index) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(14);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${index + 1}. ${scenario.name || 'Unnamed Scenario'}`, leftMargin, yPosition);
          yPosition += 10;
          
          pdf.setFontSize(11);
          pdf.setTextColor(80, 80, 80);
          
          const scenarioDetails = [
            `Equity Allocation: ${scenario.parameters?.equityAllocation || 0}%`,
            `Debt Allocation: ${scenario.parameters?.debtAllocation || 0}%`,
            `Expected Return: ${scenario.parameters?.expectedReturn || 0}%`,
            `Monthly SIP: ₹${(scenario.monthlyInvestment || 0).toLocaleString()}`
          ];
          
          scenarioDetails.forEach(detail => {
            pdf.text(`   • ${detail}`, leftMargin + 5, yPosition);
            yPosition += 6;
          });
          yPosition += 10;
        });
        
        console.log('✅ Scenarios added');
      } else {
        pdf.setFontSize(12);
        pdf.setTextColor(150, 150, 150);
        pdf.text('No scenarios available', leftMargin, yPosition);
        console.log('⚠️ No scenarios found');
      }

      // Add stress test summary if available
      if (Object.keys(stressTestResults).length > 0) {
        yPosition += 20;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Stress Test Summary', leftMargin, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 60);
        pdf.text(`• Total scenarios tested: ${scenarios?.length || 0}`, leftMargin, yPosition);
        yPosition += 8;
        pdf.text(`• Crisis scenarios analyzed: ${Object.keys(historicalScenarios).length}`, leftMargin, yPosition);
        yPosition += 8;
        pdf.text('• Historical crisis periods: COVID-19, 2008 Financial Crisis, 1980s Inflation, Dot-Com Bubble', leftMargin, yPosition);
        yPosition += 15;
        
        console.log('✅ Stress test summary added');
      }

      // Footer
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = pageHeight - 30;
      } else {
        yPosition = pageHeight - 30;
      }
      
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Generated by FINREP A/B Testing Suite 2.0', pageWidth / 2, yPosition, { align: 'center' });

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const clientName = client?.firstName || 'Client';
      const fileName = `AB_Testing_Report_${clientName}_${timestamp}.pdf`;
      
      console.log('🔄 Attempting to download PDF:', fileName);
      
      // Save PDF
      pdf.save(fileName);
      
      console.log('✅ PDF download initiated successfully');
      
      // Show success message
      setTimeout(() => {
        alert('✅ PDF report downloaded successfully!');
      }, 500);
      
    } catch (error) {
      console.error('❌ PDF Generation Error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        clientData: client,
        scenariosCount: scenarios?.length
      });
      setSubmitError(`Failed to generate PDF report: ${error.message}`);
    }
  };

  // ✅ Separate Download Button Function
  const downloadPDFOnly = async () => {
    try {
      await generateAndDownloadPDF();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setSubmitError('Failed to download PDF report');
    }
  };

  // ✅ Enhanced handleComplete with PDF download
  const handleComplete = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      console.log('Submitting stress test results:', stressTestResults);
      
      // 1. Save data to database
      await onComplete(stressTestResults);
      
      // 2. Generate and download PDF report
      await generateAndDownloadPDF();
      
    } catch (error) {
      console.error('Error submitting stress test results:', error);
      setSubmitError(error.message || 'Failed to submit stress test results');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCalculating) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Running Stress Tests</h2>
            <p className="text-gray-600">
              Testing {scenarios.length} scenarios against {Object.keys(historicalScenarios).length} historical crisis situations...
            </p>
          </div>
          
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          
          <div className="bg-red-50 rounded-lg p-4 max-w-lg mx-auto">
            <h4 className="font-semibold text-red-900 mb-2">Crisis Scenarios Being Tested:</h4>
            <ul className="text-sm text-red-800 space-y-1">
              {Object.values(historicalScenarios).map((crisis, index) => (
                <li key={index}>• {crisis.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Updated to work with new array format
  const selectedScenarioResults = selectedScenario ? stressTestResults[selectedScenario] : null;
  const selectedCrisisResult = selectedScenarioResults ? 
    selectedScenarioResults.find(result => result.crisisId === selectedCrisis) : null;
  const scenario = scenarios.find(s => s.id === selectedScenario);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Stress Testing Results</h2>
        <p className="text-gray-600">
          Analysis of how your investment scenarios would perform during historical crisis situations
        </p>
      </div>

      {/* ✅ Show submission error if any */}
      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h4 className="text-red-800 font-medium">Submission Error</h4>
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
            <button
              onClick={() => setSubmitError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Scenario Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Investment Scenario</label>
          <select
            value={selectedScenario || ''}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </div>

        {/* Crisis Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Crisis Scenario</label>
          <select
            value={selectedCrisis}
            onChange={(e) => setSelectedCrisis(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(historicalScenarios).map(([id, crisis]) => (
              <option key={id} value={id}>
                {crisis.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCrisisResult && (
        <>
          {/* Crisis Overview */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-red-900">
                {historicalScenarios[selectedCrisis].name}
              </h3>
            </div>
            <p className="text-red-800 mb-4">{historicalScenarios[selectedCrisis].description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-red-700">Market Crash:</span>
                <span className="ml-2 font-semibold text-red-900">
                  {historicalScenarios[selectedCrisis].marketCrashPercentage}%
                </span>
              </div>
              <div>
                <span className="text-red-700">Recovery Time:</span>
                <span className="ml-2 font-semibold text-red-900">
                  {historicalScenarios[selectedCrisis].recoveryTimeMonths} months
                </span>
              </div>
              <div>
                <span className="text-red-700">Unemployment Spike:</span>
                <span className="ml-2 font-semibold text-red-900">
                  +{historicalScenarios[selectedCrisis].unemploymentSpike}%
                </span>
              </div>
            </div>
          </div>

          {/* Impact Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-red-900">Immediate Loss</h3>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-900 mb-1">
                {selectedCrisisResult.immediateImpact.portfolioLossPercentage}%
              </div>
              <div className="text-sm text-red-700">
                {formatCurrency(selectedCrisisResult.immediateImpact.portfolioLossAmount)} loss
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-orange-900">Recovery Time</h3>
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-900 mb-1">
                {selectedCrisisResult.recoveryAnalysis.timeToRecoveryMonths}
              </div>
              <div className="text-sm text-orange-700">
                months to recover
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-blue-900">Portfolio After Crisis</h3>
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-blue-900 mb-1">
                {formatCurrency(selectedCrisisResult.immediateImpact.portfolioValueAfterCrisis)}
              </div>
              <div className="text-sm text-blue-700">
                from {formatCurrency(selectedCrisisResult.immediateImpact.originalValue)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-purple-900">Additional SIP Needed</h3>
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-purple-900 mb-1">
                {formatCurrency(selectedCrisisResult.riskMetrics.additionalSIPRequired)}
              </div>
              <div className="text-sm text-purple-700">
                per month for recovery
              </div>
            </div>
          </div>

          {/* Goal Impact Analysis */}
          {selectedCrisisResult.goalImpacts.length > 0 && (
            <div className="bg-white border rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact on Financial Goals</h3>
              <div className="space-y-4">
                {selectedCrisisResult.goalImpacts.map((impact, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">{impact.goalName}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(impact.severity)}`}>
                        {impact.severity} Impact
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Potential Delay:</span>
                        <span className="ml-2 font-medium">
                          {impact.delayMonths > 0 ? `${impact.delayMonths} months` : 'No significant delay'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Additional SIP Required:</span>
                        <span className="ml-2 font-medium">
                          {formatCurrency(impact.additionalSIPRequired)}/month
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behavioral Analysis */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Behavioral Considerations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Likely Client Reaction</h4>
                <p className={`text-sm font-medium mb-3 ${
                  selectedCrisisResult.behavioralConsiderations.likelyClientReaction === 'Panic Sell' ? 'text-red-700' :
                  selectedCrisisResult.behavioralConsiderations.likelyClientReaction === 'Hold Steady' ? 'text-orange-700' : 'text-green-700'
                }`}>
                  {selectedCrisisResult.behavioralConsiderations.likelyClientReaction}
                </p>
                
                <h5 className="font-medium text-yellow-800 mb-2">Recommended Action</h5>
                <p className="text-sm text-yellow-700">
                  {selectedCrisisResult.behavioralConsiderations.recommendedAction}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Key Messages for Client</h4>
                <ul className="space-y-1 text-sm text-yellow-700">
                  {selectedCrisisResult.behavioralConsiderations.keyMessages.map((message, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 mr-2 flex-shrink-0" />
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {selectedCrisisResult.behavioralConsiderations.emotionalSupportRequired && (
              <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ High emotional support required during this crisis scenario
                </p>
              </div>
            )}
          </div>

          {/* Scenario Comparison Table */}
          <div className="bg-white border rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cross-Scenario Stress Test Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Investment Scenario</th>
                    <th className="text-center p-2">Immediate Loss %</th>
                    <th className="text-center p-2">Recovery Time</th>
                    <th className="text-center p-2">Additional SIP Required</th>
                    <th className="text-center p-2">Resilience Score</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((scenario) => {
                    const scenarioResults = stressTestResults[scenario.id];
                    const result = scenarioResults ? scenarioResults.find(r => r.crisisId === selectedCrisis) : null;
                    if (!result) return null;
                    
                    const resilienceScore = Math.round(
                      100 - (result.immediateImpact.portfolioLossPercentage * 2) - 
                      (result.recoveryAnalysis.timeToRecoveryMonths / 6)
                    );
                    
                    return (
                      <tr key={scenario.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{scenario.name}</td>
                        <td className="p-2 text-center text-red-600">
                          {result.immediateImpact.portfolioLossPercentage}%
                        </td>
                        <td className="p-2 text-center">
                          {result.recoveryAnalysis.timeToRecoveryMonths}m
                        </td>
                        <td className="p-2 text-center">
                          {formatCurrency(result.riskMetrics.additionalSIPRequired)}
                        </td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            resilienceScore >= 80 ? 'bg-green-100 text-green-800' :
                            resilienceScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {Math.max(0, resilienceScore)}/100
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ✅ Updated Action Buttons with PDF functionality */}
      <div className="flex justify-between items-center">
        <button
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Simulation Results
        </button>
        
        <div className="flex gap-3">
          {/* ✅ Download PDF Button */}
          <button
            onClick={downloadPDFOnly}
            disabled={isSubmitting}
            className={`
              flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 border-2
              ${isSubmitting
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed border-gray-400'
                : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
              }
            `}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF Report
          </button>
          
          {/* ✅ Enhanced Green Button */}
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className={`
              flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${isSubmitting
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
              }
            `}
          >
            {isSubmitting ? 'Processing...' : 'Complete & Download Report'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StressTestingStep;