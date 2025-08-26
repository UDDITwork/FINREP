import axios from 'axios';

const API_BASE_URL = '/api/ab-testing-suite-2';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for long calculations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const abTestingSuite2API = {
  // Session Management
  createSession: async (clientId) => {
    try {
      const response = await api.post('/sessions', { clientId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create session');
    }
  },

  getSession: async (sessionId) => {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch session');
    }
  },

  getAdvisorSessions: async (params = {}) => {
    try {
      const { page = 1, limit = 10, status, clientId } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(clientId && { clientId })
      });

      const response = await api.get(`/sessions?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sessions');
    }
  },

  getClientSessions: async (clientId) => {
    try {
      const response = await api.get(`/sessions?clientId=${clientId}&limit=50`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch client sessions');
    }
  },

  // Risk Assessment
  updateRiskProfile: async (sessionId, riskProfile) => {
    try {
      const response = await api.put(`/sessions/${sessionId}/risk-profile`, {
        riskProfile
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update risk profile');
    }
  },

  // Scenario Management
  addScenarios: async (sessionId, scenarios) => {
    try {
      const response = await api.put(`/sessions/${sessionId}/scenarios`, {
        scenarios
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add scenarios');
    }
  },

  updateScenarioSelection: async (sessionId, selectedScenarios) => {
    try {
      const response = await api.put(`/sessions/${sessionId}/scenario-selection`, {
        selectedScenarios
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update scenario selection');
    }
  },

  // Simulation Results
  addSimulationResults: async (sessionId, simulationResults) => {
    try {
      const response = await api.put(`/sessions/${sessionId}/simulation-results`, {
        simulationResults
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add simulation results');
    }
  },

  // Stress Testing
  addStressTestResults: async (sessionId, stressTestResults) => {
    try {
      const response = await api.put(`/sessions/${sessionId}/stress-test-results`, {
        stressTestResults
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add stress test results');
    }
  },

  // Session Completion
  completeSession: async (sessionId, completionData) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/complete`, {
        completionData
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to complete session');
    }
  },

  // Session Notes
  addSessionNote: async (sessionId, noteType, content) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/notes`, {
        noteType,
        content
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add session note');
    }
  },

  // Export
  exportSession: async (sessionId, exportType = 'pdf_report') => {
    try {
      const response = await api.post(`/sessions/${sessionId}/export`, {
        exportType
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to export session');
    }
  },

  // Session Deletion
  deleteSession: async (sessionId) => {
    try {
      const response = await api.delete(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete session');
    }
  },

  // Analytics
  getAnalytics: async (period = 'month', clientId = null) => {
    try {
      const queryParams = new URLSearchParams({
        period,
        ...(clientId && { clientId })
      });

      const response = await api.get(`/analytics?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics');
    }
  },

  // Health Check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Health check failed');
    }
  },

  // Utility functions for data processing
  processSimulationData: (rawResults) => {
    // Process and format simulation results for charts
    const processedData = {};
    
    Object.entries(rawResults).forEach(([scenarioId, results]) => {
      processedData[scenarioId] = {
        ...results,
        formattedPortfolioValues: {
          pessimistic: results.portfolioValue.p10,
          conservative: results.portfolioValue.p25,
          median: results.portfolioValue.p50,
          optimistic: results.portfolioValue.p75,
          veryOptimistic: results.portfolioValue.p90
        },
        riskLevel: results.riskMetrics.volatility > 20 ? 'High' :
                   results.riskMetrics.volatility > 15 ? 'Medium' : 'Low',
        successProbability: results.riskMetrics.successRate,
        expectedReturn: results.returns.p50
      };
    });
    
    return processedData;
  },

  processStressTestData: (rawResults) => {
    // Process stress test results for visualization
    const processedData = {};
    
    Object.entries(rawResults).forEach(([scenarioId, scenarioResults]) => {
      processedData[scenarioId] = {};
      
      scenarioResults.forEach(crisisResult => {
        const crisisId = crisisResult.crisisId || Object.keys(crisisResult)[0];
        const crisisData = crisisResult[crisisId] || crisisResult;
        
        processedData[scenarioId][crisisId] = {
          ...crisisData,
          resilienceScore: Math.max(0, 100 - 
            (crisisData.immediateImpact?.portfolioLossPercentage * 2) - 
            (crisisData.recoveryAnalysis?.timeToRecoveryMonths / 6)
          ),
          severity: crisisData.immediateImpact?.portfolioLossPercentage > 30 ? 'High' :
                   crisisData.immediateImpact?.portfolioLossPercentage > 15 ? 'Medium' : 'Low'
        };
      });
    });
    
    return processedData;
  },

  generateRecommendations: (sessionData) => {
    // Generate AI-powered recommendations based on session data
    const { scenarios, simulationResults, stressTestResults, riskProfile } = sessionData;
    
    if (!scenarios || !simulationResults) {
      return { recommendations: [], warnings: [] };
    }

    const recommendations = [];
    const warnings = [];

    // Analyze scenario performance
    const performanceRanking = scenarios
      .filter(s => s.isSelected)
      .map(scenario => {
        const simResult = simulationResults.find(r => r.scenarioId === scenario.scenarioId);
        const stressResult = stressTestResults?.find(r => r.scenarioId === scenario.scenarioId);
        
        return {
          scenario,
          performance: simResult?.riskMetrics?.successRate || 0,
          resilience: stressResult ? calculateResilienceScore(stressResult) : 0,
          overall: (simResult?.riskMetrics?.successRate || 0) * 0.7 + 
                  (stressResult ? calculateResilienceScore(stressResult) : 0) * 0.3
        };
      })
      .sort((a, b) => b.overall - a.overall);

    if (performanceRanking.length > 0) {
      const topScenario = performanceRanking[0];
      recommendations.push({
        type: 'primary',
        title: 'Recommended Strategy',
        description: `${topScenario.scenario.scenarioName} shows the best balance of returns and risk management`,
        action: 'Consider implementing this strategy for optimal results'
      });

      // Risk-specific recommendations
      const riskCategory = riskProfile?.calculatedRiskScore?.riskCategory;
      if (riskCategory === 'Conservative' && topScenario.scenario.parameters.equityAllocation > 50) {
        warnings.push({
          type: 'risk_mismatch',
          title: 'Risk Profile Mismatch',
          description: 'Recommended strategy has higher equity allocation than typical for conservative investors',
          suggestion: 'Consider reducing equity allocation by 10-15%'
        });
      }
    }

    return { recommendations, warnings };
  }
};

// Helper function for resilience calculation
function calculateResilienceScore(stressResults) {
  if (!stressResults.crisisScenarios || stressResults.crisisScenarios.length === 0) {
    return 50; // Default score
  }

  const avgLoss = stressResults.crisisScenarios.reduce((sum, crisis) => 
    sum + (crisis.immediateImpact?.portfolioLossPercentage || 0), 0
  ) / stressResults.crisisScenarios.length;

  const avgRecovery = stressResults.crisisScenarios.reduce((sum, crisis) => 
    sum + (crisis.recoveryAnalysis?.timeToRecoveryMonths || 36), 0
  ) / stressResults.crisisScenarios.length;

  return Math.max(0, 100 - (avgLoss * 2) - (avgRecovery / 6));
}

export default abTestingSuite2API;