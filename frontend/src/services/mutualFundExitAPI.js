/**
 * FILE LOCATION: frontend/src/services/mutualFundExitAPI.js
 * 
 * PURPOSE: Frontend service layer for mutual fund exit strategy API operations
 * 
 * FUNCTIONALITY:
 * - Provides HTTP client interface for exit strategy endpoints
 * - Handles authentication headers and request formatting
 * - Manages API response processing and error handling
 * - Implements retry logic and fallback error messages
 * - Centralizes exit strategy API communication for frontend components
 * 
 * API ENDPOINTS CONSUMED:
 * - GET /api/mutual-fund-exit-strategies/clients-with-funds: Fetch advisor's clients with mutual funds
 * - POST /api/mutual-fund-exit-strategies/strategies: Create new exit strategy
 * - GET /api/mutual-fund-exit-strategies/strategies/:id: Get specific exit strategy
 * - PUT /api/mutual-fund-exit-strategies/strategies/:id: Update exit strategy
 * - GET /api/mutual-fund-exit-strategies/strategies/client/:clientId: Get strategies for client
 * - GET /api/mutual-fund-exit-strategies/summary: Get advisor's exit strategies summary
 * - DELETE /api/mutual-fund-exit-strategies/strategies/:id: Soft delete exit strategy
 * 
 * DATA TRANSMISSION:
 * - Sends: Client IDs, fund details, strategy data, update parameters
 * - Receives: Client fund lists, exit strategies, summary statistics
 * - Headers: Authorization Bearer token for authenticated requests
 * - Content-Type: application/json for all requests
 * 
 * CONNECTIVITY:
 * - Connects to backend exit strategy API endpoints via HTTP
 * - Uses axios instance with base URL configuration
 * - Implements automatic token inclusion from localStorage
 * - Handles CORS and network connectivity issues
 * 
 * AUTHENTICATION:
 * - Automatically includes JWT token from localStorage
 * - Token format: Bearer {token} in Authorization header
 * - Handles 401 responses by redirecting to login
 * - Maintains session state for authenticated requests
 * 
 * ERROR HANDLING:
 * - Catches and logs API errors with detailed information
 * - Provides user-friendly error messages for frontend display
 * - Implements graceful degradation for service failures
 * - Logs error details for debugging and monitoring
 * 
 * RESPONSE PROCESSING:
 * - Extracts data from API response structure
 * - Handles both success and error response formats
 * - Provides consistent error message format for components
 * - Implements response validation and data sanitization
 * 
 * INTEGRATION POINTS:
 * - Used by: MutualFundExitSuite, ClientSelection, MutualFundsList components
 * - Integrates with: Backend exit strategy API endpoints
 * - Depends on: Authentication context and token storage
 * - Provides: Promise-based async operations for components
 */

import api from './api';

class MutualFundExitAPI {
  /**
   * Get all clients with mutual funds for the authenticated advisor
   * Combines existing funds from CAS and recommended funds from financial plans
   */
  async getClientsWithFunds() {
    try {
      const response = await api.get('/mutual-fund-exit-strategies/clients-with-funds');
      return response.data;
    } catch (error) {
      console.error('Error fetching clients with mutual funds:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch clients with mutual funds'
      );
    }
  }

  /**
   * Create a new mutual fund exit strategy
   * @param {Object} strategyData - Complete exit strategy data
   */
  async createExitStrategy(strategyData) {
    try {
      const response = await api.post('/mutual-fund-exit-strategies/strategies', strategyData);
      return response.data;
    } catch (error) {
      console.error('Error creating exit strategy:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to create exit strategy'
      );
    }
  }

  /**
   * Get a specific exit strategy by ID
   * @param {string} strategyId - The ID of the exit strategy
   */
  async getExitStrategy(strategyId) {
    try {
      const response = await api.get(`/mutual-fund-exit-strategies/strategies/${strategyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exit strategy:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch exit strategy'
      );
    }
  }

  /**
   * Update an existing exit strategy
   * @param {string} strategyId - The ID of the exit strategy
   * @param {Object} updateData - Data to update
   */
  async updateExitStrategy(strategyId, updateData) {
    try {
      const response = await api.put(`/mutual-fund-exit-strategies/strategies/${strategyId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating exit strategy:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to update exit strategy'
      );
    }
  }

  /**
   * Get all exit strategies for a specific client
   * @param {string} clientId - The ID of the client
   */
  async getClientExitStrategies(clientId) {
    try {
      const response = await api.get(`/mutual-fund-exit-strategies/strategies/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client exit strategies:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch client exit strategies'
      );
    }
  }

  /**
   * Get exit strategies summary for advisor dashboard
   */
  async getExitStrategiesSummary() {
    try {
      const response = await api.get('/mutual-fund-exit-strategies/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching exit strategies summary:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch exit strategies summary'
      );
    }
  }

  /**
   * Soft delete an exit strategy (mark as inactive)
   * @param {string} strategyId - The ID of the exit strategy
   */
  async deleteExitStrategy(strategyId) {
    try {
      const response = await api.delete(`/mutual-fund-exit-strategies/strategies/${strategyId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting exit strategy:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to delete exit strategy'
      );
    }
  }

  /**
   * Health check for the exit strategies API
   */
  async healthCheck() {
    try {
      const response = await api.get('/mutual-fund-exit-strategies/health');
      return response.data;
    } catch (error) {
      console.error('Error checking API health:', error);
      throw new Error(
        error.response?.data?.message || 
        'API health check failed'
      );
    }
  }

  /**
   * Validate exit strategy data before submission
   * @param {Object} strategyData - The strategy data to validate
   */
  validateStrategyData(strategyData) {
    const requiredFields = [
      'clientId',
      'fundId',
      'fundName',
      'fundCategory',
      'fundType',
      'source',
      'primaryExitAnalysis',
      'timingStrategy',
      'taxImplications',
      'alternativeInvestmentStrategy',
      'financialGoalAssessment',
      'riskAnalysis',
      'executionActionPlan',
      'costBenefitAnalysis'
    ];

    const missingFields = requiredFields.filter(field => !strategyData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate primary exit analysis
    if (!strategyData.primaryExitAnalysis.currentValue || 
        strategyData.primaryExitAnalysis.currentValue <= 0) {
      throw new Error('Current value must be greater than 0');
    }

    if (!strategyData.primaryExitAnalysis.units || 
        strategyData.primaryExitAnalysis.units <= 0) {
      throw new Error('Units must be greater than 0');
    }

    // Validate timing strategy
    if (!strategyData.timingStrategy.recommendedExitDate) {
      throw new Error('Recommended exit date is required');
    }

    // Validate tax implications
    if (!strategyData.taxImplications.holdingPeriod) {
      throw new Error('Holding period is required');
    }

    return true;
  }

  /**
   * Format currency values for display
   * @param {number} value - The numeric value to format
   * @param {string} currency - The currency code (default: 'INR')
   */
  formatCurrency(value, currency = 'INR') {
    if (typeof value !== 'number' || isNaN(value)) {
      return '₹0.00';
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Format percentage values for display
   * @param {number} value - The numeric value to format
   * @param {number} decimals - Number of decimal places (default: 2)
   */
  formatPercentage(value, decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) {
      return '0.00%';
    }

    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Get status color for exit strategy status
   * @param {string} status - The status string
   */
  getStatusColor(status) {
    const statusColors = {
      draft: 'text-gray-600 bg-gray-100',
      pending_approval: 'text-yellow-600 bg-yellow-100',
      approved: 'text-green-600 bg-green-100',
      in_execution: 'text-blue-600 bg-blue-100',
      completed: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100'
    };

    return statusColors[status] || 'text-gray-600 bg-gray-100';
  }

  /**
   * Get priority color for exit strategy priority
   * @param {string} priority - The priority string
   */
  getPriorityColor(priority) {
    const priorityColors = {
      low: 'text-gray-600 bg-gray-100',
      medium: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100'
    };

    return priorityColors[priority] || 'text-gray-600 bg-gray-100';
  }

  /**
   * Calculate net benefit percentage
   * @param {number} netBenefit - The net benefit amount
   * @param {number} currentValue - The current fund value
   */
  calculateNetBenefitPercentage(netBenefit, currentValue) {
    if (!currentValue || currentValue <= 0) {
      return 0;
    }

    return (netBenefit / currentValue) * 100;
  }

  /**
   * Generate default execution steps for a new strategy
   */
  getDefaultExecutionSteps() {
    return [
      {
        stepNumber: 1,
        action: 'Review and approve exit strategy',
        timeline: 'Immediate',
        responsible: 'Advisor',
        status: 'pending'
      },
      {
        stepNumber: 2,
        action: 'Client acknowledgment',
        timeline: 'Within 24 hours',
        responsible: 'Client',
        status: 'pending'
      },
      {
        stepNumber: 3,
        action: 'Execute exit order',
        timeline: 'As per timing strategy',
        responsible: 'Advisor',
        status: 'pending'
      },
      {
        stepNumber: 4,
        action: 'Monitor execution',
        timeline: 'Ongoing',
        responsible: 'Advisor',
        status: 'pending'
      }
    ];
  }
}

export default new MutualFundExitAPI();
