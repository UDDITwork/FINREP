/**
 * FILE LOCATION: backend/services/apiMonitoringService.js
 * 
 * API Monitoring Service that tracks the health and performance of all
 * Indian Stock API endpoints and provides comprehensive monitoring data.
 */

const indianStockAPI = require('./indianStockAPI');
const claudeAIFallbackService = require('./claudeAIFallbackService');

class APIMonitoringService {
  constructor() {
    this.endpoints = [
      { name: 'search-stock', path: '/stock', category: 'search', required: true },
      { name: 'search-mutual-fund', path: '/mutual_fund_search', category: 'search', required: true },
      { name: 'mutual-funds', path: '/mutual_funds', category: 'market', required: true },
      { name: 'ipo', path: '/ipo', category: 'market', required: true },
      { name: 'news', path: '/news', category: 'news', required: true },
      { name: 'trending', path: '/trending', category: 'market', required: true },
      { name: '52-week-high-low', path: '/fetch_52_week_high_low_data', category: 'analytics', required: false },
      { name: 'nse-most-active', path: '/NSE_most_active', category: 'market', required: false },
      { name: 'bse-most-active', path: '/BSE_most_active', category: 'market', required: false },
      { name: 'price-shockers', path: '/price_shockers', category: 'analytics', required: false },
      { name: 'historical-data', path: '/historical_data', category: 'analytics', required: false },
      { name: 'stock-target-price', path: '/stock_target_price', category: 'analytics', required: false }
    ];

    this.healthStatus = new Map();
    this.performanceMetrics = new Map();
    this.errorLog = [];
    this.lastCheck = null;
    
    // Initialize health status
    this.endpoints.forEach(endpoint => {
      this.healthStatus.set(endpoint.name, {
        status: 'unknown',
        lastCheck: null,
        responseTime: null,
        errorCount: 0,
        successCount: 0,
        lastError: null,
        lastSuccess: null
      });
    });
  }

  /**
   * Run comprehensive health check on all endpoints
   */
  async runFullHealthCheck() {
    console.log('🏥 [API Monitoring] Starting comprehensive health check...');
    
    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      totalEndpoints: this.endpoints.length,
      healthy: 0,
      unhealthy: 0,
      unknown: 0,
      endpoints: [],
      summary: {},
      claudeAIStatus: null
    };

    // Check Claude AI service health
    try {
      results.claudeAIStatus = await claudeAIFallbackService.healthCheck();
    } catch (error) {
      results.claudeAIStatus = { success: false, status: 'unhealthy', error: error.message };
    }

    // Check each endpoint
    for (const endpoint of this.endpoints) {
      const result = await this.checkEndpointHealth(endpoint);
      results.endpoints.push(result);
      
      if (result.status === 'healthy') results.healthy++;
      else if (result.status === 'unhealthy') results.unhealthy++;
      else results.unknown++;
    }

    // Generate summary
    results.summary = {
      overallHealth: this.calculateOverallHealth(results),
      criticalIssues: this.identifyCriticalIssues(results),
      recommendations: this.generateRecommendations(results),
      totalResponseTime: Date.now() - startTime
    };

    this.lastCheck = results.timestamp;
    console.log(`✅ [API Monitoring] Health check completed in ${results.summary.totalResponseTime}ms`);
    
    return results;
  }

  /**
   * Check health of a specific endpoint
   */
  async checkEndpointHealth(endpoint) {
    const startTime = Date.now();
    const result = {
      name: endpoint.name,
      path: endpoint.path,
      category: endpoint.category,
      required: endpoint.required,
      status: 'unknown',
      responseTime: null,
      lastCheck: new Date().toISOString(),
      error: null,
      data: null,
      fallbackAvailable: false,
      fallbackData: null
    };

    try {
      console.log(`🔍 [API Monitoring] Checking endpoint: ${endpoint.name}`);
      
      // Test the endpoint with sample data
      const testData = await this.testEndpoint(endpoint);
      
      if (testData.success) {
        result.status = 'healthy';
        result.data = testData.data;
        result.responseTime = Date.now() - startTime;
        
        // Update health status
        this.updateHealthStatus(endpoint.name, 'healthy', result.responseTime);
        
        console.log(`✅ [API Monitoring] ${endpoint.name} is healthy (${result.responseTime}ms)`);
      } else {
        throw new Error(testData.error || 'Unknown error');
      }
      
    } catch (error) {
      result.status = 'unhealthy';
      result.error = error.message;
      result.responseTime = Date.now() - startTime;
      
      // Update health status
      this.updateHealthStatus(endpoint.name, 'unhealthy', result.responseTime, error.message);
      
      console.log(`❌ [API Monitoring] ${endpoint.name} is unhealthy: ${error.message}`);
      
      // Try Claude AI fallback
      try {
        result.fallbackAvailable = true;
        result.fallbackData = await this.getFallbackData(endpoint, error);
      } catch (fallbackError) {
        console.log(`⚠️ [API Monitoring] Fallback also failed for ${endpoint.name}: ${fallbackError.message}`);
      }
    }

    return result;
  }

  /**
   * Test a specific endpoint with appropriate test data
   */
  async testEndpoint(endpoint) {
    const testParams = this.getTestParameters(endpoint);
    
    try {
      let response;
      
      switch (endpoint.name) {
        case 'search-stock':
          response = await indianStockAPI.searchStock('RELIANCE');
          break;
        case 'search-mutual-fund':
          response = await indianStockAPI.searchMutualFund('SBI');
          break;
        case 'mutual-funds':
          response = await indianStockAPI.getMutualFunds();
          break;
        case 'ipo':
          response = await indianStockAPI.getIPOData();
          break;
        case 'news':
          response = await indianStockAPI.getNews();
          break;
        case 'trending':
          response = await indianStockAPI.getTrendingStocks();
          break;
        case '52-week-high-low':
          response = await indianStockAPI.get52WeekHighLow();
          break;
        case 'nse-most-active':
          response = await indianStockAPI.getNSEMostActive();
          break;
        case 'bse-most-active':
          response = await indianStockAPI.getBSEMostActive();
          break;
        case 'price-shockers':
          response = await indianStockAPI.getPriceShockers();
          break;
        case 'historical-data':
          response = await indianStockAPI.getHistoricalData('RELIANCE', '1m', 'price');
          break;
        case 'stock-target-price':
          response = await indianStockAPI.getStockTargetPrice('RELIANCE');
          break;
        default:
          throw new Error('Unknown endpoint');
      }
      
      return { success: true, data: response };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get test parameters for an endpoint
   */
  getTestParameters(endpoint) {
    const testParams = {
      'search-stock': { companyName: 'RELIANCE' },
      'search-mutual-fund': { query: 'SBI' },
      'historical-data': { stockName: 'RELIANCE', period: '1m', filter: 'price' },
      'stock-target-price': { stockId: 'RELIANCE' }
    };
    
    return testParams[endpoint.name] || {};
  }

  /**
   * Get fallback data from Claude AI
   */
  async getFallbackData(endpoint, originalError) {
    try {
      switch (endpoint.category) {
        case 'search':
          if (endpoint.name === 'search-stock') {
            return await claudeAIFallbackService.getStockFallback('RELIANCE', 'basic', originalError);
          } else if (endpoint.name === 'search-mutual-fund') {
            return await claudeAIFallbackService.getMarketDataFallback('mutualfund', originalError);
          }
          break;
        case 'market':
          if (endpoint.name === 'ipo') {
            return await claudeAIFallbackService.getMarketDataFallback('ipo', originalError);
          } else if (endpoint.name === 'trending') {
            return await claudeAIFallbackService.getMarketDataFallback('trending', originalError);
          } else if (endpoint.name.includes('most-active')) {
            return await claudeAIFallbackService.getMarketDataFallback('mostActive', originalError);
          }
          break;
        case 'news':
          return await claudeAIFallbackService.getNewsFallback(originalError);
        case 'analytics':
          return await claudeAIFallbackService.getMarketDataFallback('analytics', originalError);
        default:
          return null;
      }
    } catch (error) {
      console.error(`❌ [API Monitoring] Fallback failed for ${endpoint.name}:`, error.message);
      return null;
    }
  }

  /**
   * Update health status for an endpoint
   */
  updateHealthStatus(endpointName, status, responseTime, error = null) {
    if (!this.healthStatus.has(endpointName)) {
      this.healthStatus.set(endpointName, {
        status: 'unknown',
        lastCheck: null,
        responseTime: null,
        errorCount: 0,
        successCount: 0,
        lastError: null,
        lastSuccess: null
      });
    }

    const health = this.healthStatus.get(endpointName);
    health.status = status;
    health.lastCheck = new Date().toISOString();
    health.responseTime = responseTime;

    if (status === 'healthy') {
      health.successCount++;
      health.lastSuccess = new Date().toISOString();
    } else if (status === 'unhealthy') {
      health.errorCount++;
      health.lastError = error;
    }

    this.healthStatus.set(endpointName, health);
  }

  /**
   * Calculate overall health score
   */
  calculateOverallHealth(results) {
    const total = results.totalEndpoints;
    const healthy = results.healthy;
    const required = results.endpoints.filter(e => e.required).length;
    const requiredHealthy = results.endpoints.filter(e => e.required && e.status === 'healthy').length;
    
    const overallScore = Math.round((healthy / total) * 100);
    const requiredScore = Math.round((requiredHealthy / required) * 100);
    
    let status = 'excellent';
    if (overallScore < 80) status = 'good';
    if (overallScore < 60) status = 'fair';
    if (overallScore < 40) status = 'poor';
    if (overallScore < 20) status = 'critical';
    
    return {
      score: overallScore,
      requiredScore: requiredScore,
      status: status,
      healthy: healthy,
      total: total,
      required: required,
      requiredHealthy: requiredHealthy
    };
  }

  /**
   * Identify critical issues
   */
  identifyCriticalIssues(results) {
    const issues = [];
    
    // Check required endpoints
    const requiredUnhealthy = results.endpoints.filter(e => e.required && e.status === 'unhealthy');
    if (requiredUnhealthy.length > 0) {
      issues.push({
        type: 'critical',
        message: `${requiredUnhealthy.length} required endpoints are unhealthy`,
        endpoints: requiredUnhealthy.map(e => e.name)
      });
    }
    
    // Check response times
    const slowEndpoints = results.endpoints.filter(e => e.responseTime && e.responseTime > 5000);
    if (slowEndpoints.length > 0) {
      issues.push({
        type: 'warning',
        message: `${slowEndpoints.length} endpoints are responding slowly (>5s)`,
        endpoints: slowEndpoints.map(e => ({ name: e.name, responseTime: e.responseTime }))
      });
    }
    
    // Check Claude AI fallback
    if (results.claudeAIStatus && !results.claudeAIStatus.success) {
      issues.push({
        type: 'warning',
        message: 'Claude AI fallback service is unavailable',
        details: results.claudeAIStatus.error
      });
    }
    
    return issues;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(results) {
    const recommendations = [];
    
    if (results.healthy < results.totalEndpoints * 0.8) {
      recommendations.push('Consider implementing retry logic and circuit breakers for failing endpoints');
    }
    
    if (results.endpoints.some(e => e.responseTime > 5000)) {
      recommendations.push('Optimize slow endpoints or implement caching strategies');
    }
    
    if (results.claudeAIStatus && !results.claudeAIStatus.success) {
      recommendations.push('Investigate Claude AI service connectivity issues');
    }
    
    const unhealthyRequired = results.endpoints.filter(e => e.required && e.status === 'unhealthy');
    if (unhealthyRequired.length > 0) {
      recommendations.push('Prioritize fixing required endpoints as they are critical for core functionality');
    }
    
    return recommendations;
  }

  /**
   * Get current health status
   */
  getCurrentHealthStatus() {
    return {
      lastCheck: this.lastCheck,
      endpoints: Array.from(this.healthStatus.entries()).map(([name, status]) => ({
        name,
        ...status
      })),
      summary: {
        total: this.endpoints.length,
        healthy: Array.from(this.healthStatus.values()).filter(s => s.status === 'healthy').length,
        unhealthy: Array.from(this.healthStatus.values()).filter(s => s.status === 'unhealthy').length,
        unknown: Array.from(this.healthStatus.values()).filter(s => s.status === 'unknown').length
      }
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const metrics = Array.from(this.performanceMetrics.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
    
    return {
      totalRequests: metrics.reduce((sum, m) => sum + m.requestCount, 0),
      averageResponseTime: metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length || 0,
      successRate: metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length || 0,
      endpoints: metrics
    };
  }

  /**
   * Log error for monitoring
   */
  logError(endpoint, error, responseTime = null) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      endpoint: endpoint,
      error: error.message || error,
      responseTime: responseTime,
      stack: error.stack
    };
    
    this.errorLog.push(errorLog);
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
    
    console.error(`❌ [API Monitoring] Error logged for ${endpoint}:`, error.message);
  }

  /**
   * Get error log
   */
  getErrorLog(limit = 50) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
    console.log('🗑️ [API Monitoring] Error log cleared');
  }
}

// Create singleton instance
const apiMonitoringService = new APIMonitoringService();

module.exports = apiMonitoringService;
