/**
 * FILE LOCATION: backend/services/stockMarketMonitoringService.js
 * 
 * Monitoring service for Stock Market API that tracks performance metrics,
 * fallback usage, and data quality without exposing this information to the frontend.
 * This service provides backend-only insights for system optimization.
 */

class StockMarketMonitoringService {
  constructor() {
    this.metrics = {
      apiCalls: {
        indian: { total: 0, success: 0, failed: 0, avgResponseTime: 0 },
        claude: { total: 0, success: 0, failed: 0, avgResponseTime: 0 }
      },
      fallbackUsage: {
        total: 0,
        byEndpoint: {},
        byReason: {}
      },
      cachePerformance: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      dataQuality: {
        indian: { valid: 0, invalid: 0, qualityScore: 0 },
        claude: { valid: 0, invalid: 0, qualityScore: 0 }
      },
      responseTimes: {
        indian: [],
        claude: [],
        cache: []
      }
    };
    
    this.startTime = Date.now();
    this.lastReset = Date.now();
    
    // Reset metrics every 24 hours
    setInterval(() => this.resetDailyMetrics(), 24 * 60 * 60 * 1000);
  }

  /**
   * Record API call attempt
   * @param {string} source - 'indian' or 'claude'
   * @param {string} endpoint - API endpoint
   * @param {number} startTime - Start timestamp
   */
  recordAPICall(source, endpoint, startTime) {
    this.metrics.apiCalls[source].total++;
    
    // Record response time
    const responseTime = Date.now() - startTime;
    this.metrics.responseTimes[source].push(responseTime);
    
    // Keep only last 100 response times for rolling average
    if (this.metrics.responseTimes[source].length > 100) {
      this.metrics.responseTimes[source].shift();
    }
    
    // Update average response time
    const avgTime = this.metrics.responseTimes[source].reduce((a, b) => a + b, 0) / this.metrics.responseTimes[source].length;
    this.metrics.apiCalls[source].avgResponseTime = Math.round(avgTime);
  }

  /**
   * Record API call success
   * @param {string} source - 'indian' or 'claude'
   * @param {string} endpoint - API endpoint
   */
  recordAPISuccess(source, endpoint) {
    this.metrics.apiCalls[source].success++;
  }

  /**
   * Record API call failure
   * @param {string} source - 'indian' or 'claude'
   * @param {string} endpoint - API endpoint
   * @param {string} reason - Failure reason
   */
  recordAPIFailure(source, endpoint, reason) {
    this.metrics.apiCalls[source].failed++;
    
    // Track fallback usage
    if (source === 'indian') {
      this.metrics.fallbackUsage.total++;
      
      // Track by endpoint
      if (!this.metrics.fallbackUsage.byEndpoint[endpoint]) {
        this.metrics.fallbackUsage.byEndpoint[endpoint] = 0;
      }
      this.metrics.fallbackUsage.byEndpoint[endpoint]++;
      
      // Track by reason
      if (!this.metrics.fallbackUsage.byReason[reason]) {
        this.metrics.fallbackUsage.byReason[reason] = 0;
      }
      this.metrics.fallbackUsage.byReason[reason]++;
    }
  }

  /**
   * Record cache performance
   * @param {boolean} isHit - Whether it was a cache hit
   * @param {number} responseTime - Response time in ms
   */
  recordCachePerformance(isHit, responseTime) {
    if (isHit) {
      this.metrics.cachePerformance.hits++;
    } else {
      this.metrics.cachePerformance.misses++;
    }
    
    // Update hit rate
    const total = this.metrics.cachePerformance.hits + this.metrics.cachePerformance.misses;
    this.metrics.cachePerformance.hitRate = total > 0 ? (this.metrics.cachePerformance.hits / total * 100).toFixed(2) : 0;
    
    // Record response time
    this.metrics.responseTimes.cache.push(responseTime);
    if (this.metrics.responseTimes.cache.length > 100) {
      this.metrics.responseTimes.cache.shift();
    }
  }

  /**
   * Record data quality assessment
   * @param {string} source - 'indian' or 'claude'
   * @param {boolean} isValid - Whether data is valid
   * @param {number} qualityScore - Quality score (0-100)
   */
  recordDataQuality(source, isValid, qualityScore = 50) {
    if (isValid) {
      this.metrics.dataQuality[source].valid++;
    } else {
      this.metrics.dataQuality[source].invalid++;
    }
    
    // Update quality score
    const total = this.metrics.dataQuality[source].valid + this.metrics.dataQuality[source].invalid;
    if (total > 0) {
      this.metrics.dataQuality[source].qualityScore = (this.metrics.dataQuality[source].valid / total * 100).toFixed(2);
    }
  }

  /**
   * Get comprehensive metrics report (backend only)
   * @returns {Object} Metrics report
   */
  getMetricsReport() {
    const uptime = Date.now() - this.startTime;
    const uptimeHours = Math.round(uptime / (1000 * 60 * 60));
    
    return {
      system: {
        uptime: `${uptimeHours} hours`,
        lastReset: new Date(this.lastReset).toISOString(),
        timestamp: new Date().toISOString()
      },
      apiPerformance: {
        indian: {
          ...this.metrics.apiCalls.indian,
          successRate: this.metrics.apiCalls.indian.total > 0 ? 
            (this.metrics.apiCalls.indian.success / this.metrics.apiCalls.indian.total * 100).toFixed(2) + '%' : '0%'
        },
        claude: {
          ...this.metrics.apiCalls.claude,
          successRate: this.metrics.apiCalls.claude.total > 0 ? 
            (this.metrics.apiCalls.claude.success / this.metrics.apiCalls.claude.total * 100).toFixed(2) + '%' : '0%'
        }
      },
      fallbackUsage: {
        ...this.metrics.fallbackUsage,
        fallbackRate: this.metrics.apiCalls.indian.total > 0 ? 
          (this.metrics.fallbackUsage.total / this.metrics.apiCalls.indian.total * 100).toFixed(2) + '%' : '0%'
      },
      cachePerformance: {
        ...this.metrics.cachePerformance,
        avgResponseTime: this.metrics.responseTimes.cache.length > 0 ? 
          Math.round(this.metrics.responseTimes.cache.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.cache.length) : 0
      },
      dataQuality: this.metrics.dataQuality,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate system recommendations based on metrics
   * @returns {Array} Array of recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Check fallback usage
    const fallbackRate = this.metrics.apiCalls.indian.total > 0 ? 
      (this.metrics.fallbackUsage.total / this.metrics.apiCalls.indian.total * 100) : 0;
    
    if (fallbackRate > 20) {
      recommendations.push({
        type: 'warning',
        message: `High fallback usage (${fallbackRate.toFixed(1)}%). Consider investigating Indian Stock API reliability.`,
        priority: 'high'
      });
    }
    
    // Check cache performance
    if (this.metrics.cachePerformance.hitRate < 50) {
      recommendations.push({
        type: 'info',
        message: `Low cache hit rate (${this.metrics.cachePerformance.hitRate}%). Consider adjusting cache TTL settings.`,
        priority: 'medium'
      });
    }
    
    // Check response times
    const avgIndianTime = this.metrics.apiCalls.indian.avgResponseTime;
    const avgClaudeTime = this.metrics.apiCalls.claude.avgResponseTime;
    
    if (avgIndianTime > 10000) {
      recommendations.push({
        type: 'warning',
        message: `Slow Indian Stock API response time (${avgIndianTime}ms). Consider optimizing API calls.`,
        priority: 'medium'
      });
    }
    
    if (avgClaudeTime > 15000) {
      recommendations.push({
        type: 'warning',
        message: `Slow Claude AI fallback response time (${avgClaudeTime}ms). Consider optimizing prompts.`,
        priority: 'medium'
      });
    }
    
    // Check data quality
    Object.entries(this.metrics.dataQuality).forEach(([source, quality]) => {
      if (quality.qualityScore < 80) {
        recommendations.push({
          type: 'warning',
          message: `Low data quality from ${source} (${quality.qualityScore}%). Consider improving data validation.`,
          priority: 'medium'
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Reset daily metrics
   */
  resetDailyMetrics() {
    this.lastReset = Date.now();
    
    // Reset counters but keep historical data
    this.metrics.apiCalls.indian = { total: 0, success: 0, failed: 0, avgResponseTime: 0 };
    this.metrics.apiCalls.claude = { total: 0, success: 0, failed: 0, avgResponseTime: 0 };
    this.metrics.fallbackUsage = { total: 0, byEndpoint: {}, byReason: {} };
    this.metrics.cachePerformance = { hits: 0, misses: 0, hitRate: 0 };
    this.metrics.dataQuality.indian = { valid: 0, invalid: 0, qualityScore: 0 };
    this.metrics.dataQuality.claude = { valid: 0, invalid: 0, qualityScore: 0 };
    
    console.log('📊 [Stock Market Monitoring] Daily metrics reset');
  }

  /**
   * Get endpoint-specific metrics
   * @param {string} endpoint - API endpoint
   * @returns {Object} Endpoint metrics
   */
  getEndpointMetrics(endpoint) {
    return {
      endpoint,
      fallbackCount: this.metrics.fallbackUsage.byEndpoint[endpoint] || 0,
      totalCalls: this.metrics.apiCalls.indian.total,
      fallbackRate: this.metrics.apiCalls.indian.total > 0 ? 
        ((this.metrics.fallbackUsage.byEndpoint[endpoint] || 0) / this.metrics.apiCalls.indian.total * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Export metrics for external monitoring systems
   * @returns {Object} Exportable metrics
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      summary: {
        totalAPICalls: this.metrics.apiCalls.indian.total + this.metrics.apiCalls.claude.total,
        totalFallbacks: this.metrics.fallbackUsage.total,
        overallSuccessRate: this.getOverallSuccessRate(),
        cacheEfficiency: this.metrics.cachePerformance.hitRate + '%'
      }
    };
  }

  /**
   * Get overall success rate across all APIs
   * @returns {string} Overall success rate
   */
  getOverallSuccessRate() {
    const totalCalls = this.metrics.apiCalls.indian.total + this.metrics.apiCalls.claude.total;
    const totalSuccess = this.metrics.apiCalls.indian.success + this.metrics.apiCalls.claude.success;
    
    return totalCalls > 0 ? (totalSuccess / totalCalls * 100).toFixed(2) + '%' : '0%';
  }
}

// Create singleton instance
const stockMarketMonitoringService = new StockMarketMonitoringService();

module.exports = stockMarketMonitoringService;
