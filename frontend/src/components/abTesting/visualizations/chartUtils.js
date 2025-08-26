// Chart utility functions for AB Testing Suite 2 visualizations

// Chart color schemes
export const chartColors = {
  primary: {
    blue: '#3B82F6',
    green: '#10B981',
    orange: '#F59E0B',
    red: '#EF4444',
    purple: '#8B5CF6',
    gray: '#6B7280',
    indigo: '#6366F1',
    pink: '#EC4899',
    yellow: '#EAB308',
    teal: '#14B8A6'
  },
  gradients: {
    blue: 'rgba(59, 130, 246, 0.1)',
    green: 'rgba(16, 185, 129, 0.1)',
    orange: 'rgba(245, 158, 11, 0.1)',
    red: 'rgba(239, 68, 68, 0.1)',
    purple: 'rgba(139, 92, 246, 0.1)'
  }
};

// Base chart options
export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#3B82F6',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0
            }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  }
};

// Line chart options
export const lineChartOptions = {
  ...baseChartOptions,
  scales: {
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 11
        },
        callback: function(value) {
          return '₹' + value.toLocaleString();
        }
      }
    }
  },
  elements: {
    line: {
      tension: 0.4
    },
    point: {
      radius: 4,
      hoverRadius: 6
    }
  }
};

// Bar chart options
export const barChartOptions = {
  ...baseChartOptions,
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 11
        },
        callback: function(value) {
          return value + '%';
        }
      }
    }
  }
};

// Doughnut chart options
export const doughnutChartOptions = {
  ...baseChartOptions,
  cutout: '60%',
  plugins: {
    ...baseChartOptions.plugins,
    tooltip: {
      ...baseChartOptions.plugins.tooltip,
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.parsed;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  }
};

// Data processing functions
export const processRiskProfileData = (sessions) => {
  if (!sessions || sessions.length === 0) return null;

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
        chartColors.primary.green,
        chartColors.primary.blue,
        chartColors.primary.orange,
        chartColors.primary.red
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverBorderWidth: 3
    }]
  };
};

export const processAssetAllocationData = (session) => {
  if (!session?.scenarios?.length) return null;

  const scenario = session.scenarios[0]; // Use first scenario
  const data = [
    scenario.parameters?.equityAllocation || 0,
    scenario.parameters?.debtAllocation || 0,
    scenario.parameters?.alternativesAllocation || 0
  ];

  return {
    labels: ['Equity', 'Debt', 'Alternatives'],
    datasets: [{
      data: data,
      backgroundColor: [
        chartColors.primary.blue,
        chartColors.primary.green,
        chartColors.primary.purple
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverBorderWidth: 3
    }]
  };
};

export const processProjectedReturnsData = (session) => {
  if (!session?.scenarios?.length) return null;

  const scenarios = session.scenarios;
  const years = ['1 Year', '3 Years', '5 Years', '10 Years', '15 Years', '20 Years'];
  const colors = [
    chartColors.primary.blue,
    chartColors.primary.green,
    chartColors.primary.orange,
    chartColors.primary.red,
    chartColors.primary.purple
  ];
  
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
    borderColor: colors[index % colors.length],
    backgroundColor: chartColors.gradients.blue,
    tension: 0.4,
    fill: false
  }));

  return {
    labels: years,
    datasets
  };
};

export const processSessionStatusData = (sessions) => {
  const statuses = ['in_progress', 'completed', 'abandoned', 'archived'];
  const statusLabels = ['In Progress', 'Completed', 'Abandoned', 'Archived'];
  const counts = statuses.map(status => 
    sessions.filter(session => session.status === status).length
  );

  return {
    labels: statusLabels,
    datasets: [{
      data: counts,
      backgroundColor: [
        chartColors.primary.blue,
        chartColors.primary.green,
        chartColors.primary.orange,
        chartColors.primary.gray
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverBorderWidth: 3
    }]
  };
};

export const processMonteCarloData = (session) => {
  if (!session?.simulationResults?.length) return null;

  const simulation = session.simulationResults[0];
  if (!simulation?.portfolioValueDistribution) return null;

  const { portfolioValueDistribution } = simulation;
  
  return {
    labels: ['P10 (Worst)', 'P25', 'P50 (Median)', 'P75', 'P90 (Best)'],
    datasets: [{
      label: 'Portfolio Value Distribution',
      data: [
        portfolioValueDistribution.p10,
        portfolioValueDistribution.p25,
        portfolioValueDistribution.p50,
        portfolioValueDistribution.p75,
        portfolioValueDistribution.p90
      ],
      backgroundColor: chartColors.gradients.blue,
      borderColor: chartColors.primary.blue,
      borderWidth: 2,
      borderRadius: 4
    }]
  };
};

export const processGoalAnalysisData = (session) => {
  if (!session?.simulationResults?.length) return null;

  const simulation = session.simulationResults[0];
  if (!simulation?.goalAnalysis?.length) return null;

  const goals = simulation.goalAnalysis;
  
  return {
    labels: goals.map(goal => goal.goalName),
    datasets: [{
      label: 'Success Rate (%)',
      data: goals.map(goal => goal.successRate),
      backgroundColor: goals.map(goal => 
        goal.successRate > 80 ? chartColors.primary.green : 
        goal.successRate > 60 ? chartColors.primary.orange : chartColors.primary.red
      ),
      borderWidth: 2,
      borderColor: '#ffffff',
      borderRadius: 4
    }]
  };
};

export const processStressTestData = (session) => {
  if (!session?.stressTestResults?.length) return null;

  const stressTest = session.stressTestResults[0];
  if (!stressTest?.crisisScenarios?.length) return null;

  const scenarios = stressTest.crisisScenarios;
  
  return {
    labels: scenarios.map(scenario => scenario.crisisName),
    datasets: [{
      label: 'Portfolio Loss (%)',
      data: scenarios.map(scenario => scenario.immediateImpact.portfolioLossPercentage),
      backgroundColor: scenarios.map(scenario => 
        scenario.immediateImpact.portfolioLossPercentage > 30 ? chartColors.primary.red :
        scenario.immediateImpact.portfolioLossPercentage > 15 ? chartColors.primary.orange : chartColors.primary.green
      ),
      borderWidth: 2,
      borderColor: '#ffffff',
      borderRadius: 4
    }]
  };
};

export const processPerformanceMetricsData = (session) => {
  if (!session?.performanceMetrics) return null;

  const metrics = session.performanceMetrics;
  
  return {
    labels: ['Client Engagement', 'Session Completion', 'Time Efficiency', 'Decision Changes'],
    datasets: [{
      label: 'Performance Score',
      data: [
        metrics.clientEngagementScore || 0,
        metrics.sessionCompletionRate || 0,
        calculateTimeEfficiency(metrics.timeSpentOnEachStep) || 0,
        calculateDecisionEfficiency(metrics.decisionsChangedCount, metrics.questionsAskedCount) || 0
      ],
      backgroundColor: [
        chartColors.primary.blue,
        chartColors.primary.green,
        chartColors.primary.orange,
        chartColors.primary.purple
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
      borderRadius: 4
    }]
  };
};

// Helper functions
const calculateTimeEfficiency = (timeSpentData) => {
  if (!timeSpentData || timeSpentData.length === 0) return 0;
  
  const totalTime = timeSpentData.reduce((sum, step) => sum + step.timeSpentMinutes, 0);
  const avgTimePerStep = totalTime / timeSpentData.length;
  
  // Efficiency score based on time spent (lower is better, but not too low)
  if (avgTimePerStep < 2) return 60; // Too rushed
  if (avgTimePerStep > 15) return 40; // Too slow
  return 100 - (avgTimePerStep - 5) * 5; // Optimal range 5-10 minutes
};

const calculateDecisionEfficiency = (decisionsChanged, questionsAsked) => {
  if (questionsAsked === 0) return 50; // Neutral if no questions
  
  const changeRate = decisionsChanged / questionsAsked;
  
  // Efficiency based on decision change rate
  if (changeRate < 0.1) return 30; // Too few changes
  if (changeRate > 0.5) return 70; // Good engagement
  return 50 + (changeRate * 40); // Scale to 50-90 range
};

// Export chart configurations
export const chartConfigs = {
  riskProfile: {
    type: 'doughnut',
    options: doughnutChartOptions,
    dataProcessor: processRiskProfileData
  },
  assetAllocation: {
    type: 'doughnut',
    options: doughnutChartOptions,
    dataProcessor: processAssetAllocationData
  },
  projectedReturns: {
    type: 'line',
    options: lineChartOptions,
    dataProcessor: processProjectedReturnsData
  },
  sessionStatus: {
    type: 'doughnut',
    options: doughnutChartOptions,
    dataProcessor: processSessionStatusData
  },
  monteCarlo: {
    type: 'bar',
    options: barChartOptions,
    dataProcessor: processMonteCarloData
  },
  goalAnalysis: {
    type: 'bar',
    options: barChartOptions,
    dataProcessor: processGoalAnalysisData
  },
  stressTest: {
    type: 'bar',
    options: barChartOptions,
    dataProcessor: processStressTestData
  },
  performanceMetrics: {
    type: 'bar',
    options: barChartOptions,
    dataProcessor: processPerformanceMetricsData
  }
};
