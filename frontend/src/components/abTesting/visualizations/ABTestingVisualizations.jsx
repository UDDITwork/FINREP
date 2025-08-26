import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Target, 
  AlertTriangle,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  DollarSign,
  TrendingDown,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut, Radar, Scatter } from 'react-chartjs-2';
import abTestingSuite2API from '../../../services/abTestingSuite2API';
import { clientAPI } from '../../../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

const ABTestingVisualizations = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load client data
      const clientResponse = await clientAPI.getClientById(clientId);
      if (clientResponse) {
        setClient(clientResponse);
      }

      // Load AB testing sessions for this client
      const sessionsResponse = await abTestingSuite2API.getClientSessions(clientId);
      if (sessionsResponse.success) {
        setSessions(sessionsResponse.sessions);
        if (sessionsResponse.sessions.length > 0) {
          setSelectedSession(sessionsResponse.sessions[0]);
        }
      }
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
      console.error('Error loading visualization data:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Chart data preparation functions
  const prepareRiskProfileData = () => {
    if (!sessions.length) return null;

    const riskCategories = ['Conservative', 'Moderate', 'Aggressive', 'Very Aggressive'];
    const counts = riskCategories.map(category => 
      sessions.filter(session => 
        session.riskProfile?.calculatedRiskScore?.riskCategory === category
      ).length
    );

    return {
      labels: riskCategories,
      datasets: [{
        data: counts,
        backgroundColor: [
          '#10B981', // Green for Conservative
          '#3B82F6', // Blue for Moderate
          '#F59E0B', // Orange for Aggressive
          '#EF4444'  // Red for Very Aggressive
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  const prepareAssetAllocationData = () => {
    if (!selectedSession?.scenarios?.length) return null;

    const scenario = selectedSession.scenarios[0]; // Use first scenario
    return {
      labels: ['Equity', 'Debt', 'Alternatives'],
      datasets: [{
        data: [
          scenario.parameters?.equityAllocation || 0,
          scenario.parameters?.debtAllocation || 0,
          scenario.parameters?.alternativesAllocation || 0
        ],
        backgroundColor: [
          '#3B82F6', // Blue for Equity
          '#10B981', // Green for Debt
          '#8B5CF6'  // Purple for Alternatives
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  const prepareProjectedReturnsData = () => {
    if (!selectedSession?.scenarios?.length) return null;

    const scenarios = selectedSession.scenarios;
    const years = ['1 Year', '3 Years', '5 Years', '10 Years', '15 Years', '20 Years'];
    
    const datasets = scenarios.map((scenario, index) => ({
      label: scenario.scenarioName,
      data: [
        scenario.projectedReturns?.year1 || 0,
        scenario.projectedReturns?.year3 || 0,
        scenario.projectedReturns?.year5 || 0,
        scenario.projectedReturns?.year10 || 0,
        scenario.projectedReturns?.year15 || 0,
        scenario.projectedReturns?.year20 || 0
      ],
      borderColor: [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6'
      ][index % 5],
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    }));

    return {
      labels: years,
      datasets
    };
  };

  const prepareSessionStatusData = () => {
    const statuses = ['in_progress', 'completed', 'abandoned', 'archived'];
    const counts = statuses.map(status => 
      sessions.filter(session => session.status === status).length
    );

    return {
      labels: ['In Progress', 'Completed', 'Abandoned', 'Archived'],
      datasets: [{
        data: counts,
        backgroundColor: [
          '#3B82F6', // Blue for In Progress
          '#10B981', // Green for Completed
          '#F59E0B', // Orange for Abandoned
          '#6B7280'  // Gray for Archived
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  const prepareMonteCarloData = () => {
    if (!selectedSession?.simulationResults?.length) return null;

    const simulation = selectedSession.simulationResults[0];
    if (!simulation?.portfolioValueDistribution) return null;

    const { portfolioValueDistribution } = simulation;
    
    return {
      labels: ['P10', 'P25', 'P50', 'P75', 'P90'],
      datasets: [{
        label: 'Portfolio Value Distribution',
        data: [
          portfolioValueDistribution.p10,
          portfolioValueDistribution.p25,
          portfolioValueDistribution.p50,
          portfolioValueDistribution.p75,
          portfolioValueDistribution.p90
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3B82F6',
        borderWidth: 2
      }]
    };
  };

  const prepareGoalAnalysisData = () => {
    if (!selectedSession?.simulationResults?.length) return null;

    const simulation = selectedSession.simulationResults[0];
    if (!simulation?.goalAnalysis?.length) return null;

    const goals = simulation.goalAnalysis;
    
    return {
      labels: goals.map(goal => goal.goalName),
      datasets: [{
        label: 'Success Rate (%)',
        data: goals.map(goal => goal.successRate),
        backgroundColor: goals.map(goal => 
          goal.successRate > 80 ? '#10B981' : 
          goal.successRate > 60 ? '#F59E0B' : '#EF4444'
        ),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  const prepareStressTestData = () => {
    if (!selectedSession?.stressTestResults?.length) return null;

    const stressTest = selectedSession.stressTestResults[0];
    if (!stressTest?.crisisScenarios?.length) return null;

    const scenarios = stressTest.crisisScenarios;
    
    return {
      labels: scenarios.map(scenario => scenario.crisisName),
      datasets: [{
        label: 'Portfolio Loss (%)',
        data: scenarios.map(scenario => scenario.immediateImpact.portfolioLossPercentage),
        backgroundColor: scenarios.map(scenario => 
          scenario.immediateImpact.portfolioLossPercentage > 30 ? '#EF4444' :
          scenario.immediateImpact.portfolioLossPercentage > 15 ? '#F59E0B' : '#10B981'
        ),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    }
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading visualizations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/ab-testing-suite-2')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to A/B Testing
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Client Visualizations
                </h1>
                {client && (
                  <p className="text-sm text-gray-600">
                    {client.firstName} {client.lastName} • {sessions.length} sessions
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {sessions.length > 0 && (
                <select
                  value={selectedSession?._id || ''}
                  onChange={(e) => {
                    const session = sessions.find(s => s._id === e.target.value);
                    setSelectedSession(session);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {sessions.map(session => (
                    <option key={session._id} value={session._id}>
                      Session {session.sessionId} - {session.status}
                    </option>
                  ))}
                </select>
              )}
              
              <button
                onClick={loadData}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'risk', name: 'Risk Analysis', icon: Shield },
              { id: 'scenarios', name: 'Scenarios', icon: Target },
              { id: 'simulation', name: 'Monte Carlo', icon: TrendingUp },
              { id: 'stress', name: 'Stress Testing', icon: AlertTriangle },
              { id: 'goals', name: 'Goal Analysis', icon: Target }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Found</h3>
            <p className="text-gray-600">
              This client doesn't have any A/B testing sessions yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Risk Profile Distribution */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Profile Distribution</h3>
                  <div className="h-80">
                    {prepareRiskProfileData() && (
                      <Doughnut data={prepareRiskProfileData()} options={chartOptions} />
                    )}
                  </div>
                </div>

                {/* Session Status Distribution */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Status</h3>
                  <div className="h-80">
                    {prepareSessionStatusData() && (
                      <Doughnut data={prepareSessionStatusData()} options={chartOptions} />
                    )}
                  </div>
                </div>

                {/* Asset Allocation */}
                {selectedSession && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation</h3>
                    <div className="h-80">
                      {prepareAssetAllocationData() && (
                        <Doughnut data={prepareAssetAllocationData()} options={chartOptions} />
                      )}
                    </div>
                  </div>
                )}

                {/* Projected Returns */}
                {selectedSession && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Projected Returns</h3>
                    <div className="h-80">
                      {prepareProjectedReturnsData() && (
                        <Line data={prepareProjectedReturnsData()} options={lineChartOptions} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Risk Analysis Tab */}
            {activeTab === 'risk' && selectedSession && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment Results</h3>
                  <div className="space-y-4">
                    {selectedSession.riskProfile?.calculatedRiskScore && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Risk Score</span>
                          <span className="text-lg font-bold text-blue-600">
                            {selectedSession.riskProfile.calculatedRiskScore.riskPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${selectedSession.riskProfile.calculatedRiskScore.riskPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Category: {selectedSession.riskProfile.calculatedRiskScore.riskCategory}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Profile Distribution</h3>
                  <div className="h-80">
                    {prepareRiskProfileData() && (
                      <Doughnut data={prepareRiskProfileData()} options={chartOptions} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Scenarios Tab */}
            {activeTab === 'scenarios' && selectedSession && (
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Scenarios Comparison</h3>
                  <div className="h-96">
                    {prepareProjectedReturnsData() && (
                      <Line data={prepareProjectedReturnsData()} options={lineChartOptions} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation by Scenario</h3>
                    <div className="h-80">
                      {prepareAssetAllocationData() && (
                        <Doughnut data={prepareAssetAllocationData()} options={chartOptions} />
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Scenario Details</h3>
                    <div className="space-y-4">
                                             {selectedSession.scenarios?.map((scenario) => (
                         <div key={scenario.scenarioId} className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{scenario.scenarioName}</h4>
                          <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Expected Return:</span>
                              <p className="font-medium text-green-600">
                                {scenario.parameters?.expectedReturn?.toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Risk Level:</span>
                              <p className="font-medium text-blue-600">
                                {scenario.parameters?.riskLevel}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Monte Carlo Tab */}
            {activeTab === 'simulation' && selectedSession && (
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monte Carlo Simulation Results</h3>
                  <div className="h-96">
                    {prepareMonteCarloData() && (
                      <Bar data={prepareMonteCarloData()} options={chartOptions} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Value Distribution</h3>
                    <div className="space-y-4">
                      {selectedSession.simulationResults?.[0]?.portfolioValueDistribution && (
                        <div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">P10 (Worst Case):</span>
                              <p className="font-medium text-red-600">
                                ₹{selectedSession.simulationResults[0].portfolioValueDistribution.p10?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">P50 (Median):</span>
                              <p className="font-medium text-blue-600">
                                ₹{selectedSession.simulationResults[0].portfolioValueDistribution.p50?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">P90 (Best Case):</span>
                              <p className="font-medium text-green-600">
                                ₹{selectedSession.simulationResults[0].portfolioValueDistribution.p90?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Expected Value:</span>
                              <p className="font-medium text-purple-600">
                                ₹{selectedSession.simulationResults[0].portfolioValueDistribution.mean?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Metrics</h3>
                    <div className="space-y-4">
                      {selectedSession.simulationResults?.[0]?.riskMetrics && (
                        <div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Volatility:</span>
                              <p className="font-medium text-blue-600">
                                {selectedSession.simulationResults[0].riskMetrics.volatility?.toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Max Drawdown:</span>
                              <p className="font-medium text-red-600">
                                {selectedSession.simulationResults[0].riskMetrics.maxDrawdown?.toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Sharpe Ratio:</span>
                              <p className="font-medium text-green-600">
                                {selectedSession.simulationResults[0].riskMetrics.sharpeRatio?.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Success Rate:</span>
                              <p className="font-medium text-purple-600">
                                {selectedSession.simulationResults[0].riskMetrics.successRate?.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stress Testing Tab */}
            {activeTab === 'stress' && selectedSession && (
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Crisis Scenario Impact</h3>
                  <div className="h-96">
                    {prepareStressTestData() && (
                      <Bar data={prepareStressTestData()} options={chartOptions} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Crisis Scenario Details</h3>
                    <div className="space-y-4">
                      {selectedSession.stressTestResults?.[0]?.crisisScenarios?.map((crisis) => (
                        <div key={crisis.crisisId} className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{crisis.crisisName}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                            <div>
                              <span className="text-gray-500">Portfolio Loss:</span>
                              <p className="font-medium text-red-600">
                                {crisis.immediateImpact.portfolioLossPercentage?.toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Recovery Time:</span>
                              <p className="font-medium text-blue-600">
                                {crisis.recoveryAnalysis.timeToRecoveryMonths} months
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Analysis</h3>
                    <div className="space-y-4">
                      {selectedSession.stressTestResults?.[0]?.crisisScenarios?.map((crisis) => (
                        <div key={crisis.crisisId} className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{crisis.crisisName}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                            <div>
                              <span className="text-gray-500">Final Recovery:</span>
                              <p className="font-medium text-green-600">
                                ₹{crisis.recoveryAnalysis.finalRecoveryValue?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Total Recovery Gain:</span>
                              <p className="font-medium text-purple-600">
                                ₹{crisis.recoveryAnalysis.totalRecoveryGain?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Goal Analysis Tab */}
            {activeTab === 'goals' && selectedSession && (
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Achievement Success Rates</h3>
                  <div className="h-96">
                    {prepareGoalAnalysisData() && (
                      <Bar data={prepareGoalAnalysisData()} options={chartOptions} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Details</h3>
                    <div className="space-y-4">
                      {selectedSession.simulationResults?.[0]?.goalAnalysis?.map((goal, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{goal.goalName}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                            <div>
                              <span className="text-gray-500">Target Amount:</span>
                              <p className="font-medium text-blue-600">
                                ₹{goal.targetAmount?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Success Rate:</span>
                              <p className={`font-medium ${
                                goal.successRate > 80 ? 'text-green-600' :
                                goal.successRate > 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {goal.successRate?.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Average Shortfall:</span>
                              <p className="font-medium text-red-600">
                                ₹{goal.averageShortfall?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Time to Goal:</span>
                              <p className="font-medium text-purple-600">
                                {goal.timeToGoal} years
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Goals Summary</h3>
                    <div className="space-y-4">
                      {selectedSession.clientDataSnapshot?.goals?.map((goal, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{goal.goalName}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                            <div>
                              <span className="text-gray-500">Target Amount:</span>
                              <p className="font-medium text-blue-600">
                                ₹{goal.targetAmount?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Target Year:</span>
                              <p className="font-medium text-green-600">
                                {goal.targetYear}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Priority:</span>
                              <p className={`font-medium ${
                                goal.priority === 'High' ? 'text-red-600' :
                                goal.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {goal.priority}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ABTestingVisualizations;
