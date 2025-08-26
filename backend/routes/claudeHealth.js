const express = require('express');
const router = express.Router();
const ClaudeAiService = require('../services/claudeAiService');

/**
 * GET /claude/health
 * Comprehensive health check for Claude AI service
 */
router.get('/health', async (req, res) => {
  try {
    console.log('🏥 [ClaudeHealth] Health check request received');
    
    const health = ClaudeAiService.getServiceHealth();
    
    // Add response headers for monitoring
    res.set({
      'X-Claude-Service-Status': health.status,
      'X-Claude-Request-Count': health.statistics.totalRequests,
      'X-Claude-Error-Count': health.statistics.errorStats.totalErrors,
      'X-Claude-Last-Error': health.statistics.errorStats.lastError || 'none',
      'X-Claude-Uptime': Math.round(health.statistics.uptime)
    });

    // Return detailed health information
    res.json({
      service: 'Claude AI Service',
      status: health.status,
      timestamp: health.timestamp,
      uptime: {
        seconds: Math.round(health.statistics.uptime),
        formatted: formatUptime(health.statistics.uptime)
      },
      configuration: {
        isValid: health.configuration.isValid,
        issues: health.configuration.issues || [],
        hasApiKey: health.environment.hasApiKey,
        apiUrl: health.environment.apiUrl,
        model: health.environment.model
      },
      network: {
        status: health.network.success ? 'connected' : 'disconnected',
        hostname: health.network.hostname,
        error: health.network.error
      },
      statistics: {
        totalRequests: health.statistics.totalRequests,
        totalErrors: health.statistics.errorStats.totalErrors,
        errorBreakdown: {
          network: health.statistics.errorStats.networkErrors,
          api: health.statistics.errorStats.apiErrors,
          timeout: health.statistics.errorStats.timeoutErrors,
          auth: health.statistics.errorStats.authErrors
        },
        lastError: {
          type: health.statistics.errorStats.lastError,
          timestamp: health.statistics.errorStats.lastErrorTime
        }
      },
      environment: {
        nodeEnv: health.environment.nodeEnv,
        nodeVersion: health.statistics.nodeVersion,
        memoryUsage: {
          rss: Math.round(health.statistics.memoryUsage.rss / 1024 / 1024) + ' MB',
          heapUsed: Math.round(health.statistics.memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(health.statistics.memoryUsage.heapTotal / 1024 / 1024) + ' MB'
        }
      },
      recommendations: health.recommendations || []
    });

  } catch (error) {
    console.error('❌ [ClaudeHealth] Health check failed:', error);
    res.status(500).json({
      service: 'Claude AI Service',
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /claude/health/simple
 * Simple health check for load balancers
 */
router.get('/health/simple', async (req, res) => {
  try {
    const health = ClaudeAiService.getServiceHealth();
    const isHealthy = health.status === 'healthy';
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'Claude AI Service'
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'Claude AI Service'
    });
  }
});

/**
 * GET /claude/health/config
 * Configuration validation check
 */
router.get('/health/config', (req, res) => {
  try {
    const config = ClaudeAiService.validateAndLogConfiguration();
    
    res.json({
      service: 'Claude AI Service',
      configuration: {
        isValid: config.isValid,
        issues: config.issues || [],
        details: config.config
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      service: 'Claude AI Service',
      configuration: {
        isValid: false,
        issues: ['Configuration validation failed'],
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /claude/health/network
 * Network connectivity test
 */
router.get('/health/network', async (req, res) => {
  try {
    const networkTest = await ClaudeAiService.testNetworkConnectivity();
    
    res.json({
      service: 'Claude AI Service',
      network: networkTest,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      service: 'Claude AI Service',
      network: {
        success: false,
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /claude/health/test
 * Test API request to Claude
 */
router.post('/health/test', async (req, res) => {
  try {
    const { message = 'Hello, this is a health check test.' } = req.body;
    
    console.log('🧪 [ClaudeHealth] Test request received:', { message });
    
    const testResponse = await ClaudeAiService.makeRequest(
      'You are a helpful AI assistant. Respond briefly and clearly.',
      message,
      0.1
    );
    
    res.json({
      service: 'Claude AI Service',
      test: {
        success: testResponse.success,
        response: testResponse.content || testResponse.error,
        requestId: testResponse.requestId,
        requestTime: testResponse.requestTime,
        timestamp: testResponse.timestamp
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [ClaudeHealth] Test request failed:', error);
    res.status(500).json({
      service: 'Claude AI Service',
      test: {
        success: false,
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /claude/health/metrics
 * Prometheus-style metrics for monitoring
 */
router.get('/health/metrics', (req, res) => {
  try {
    const health = ClaudeAiService.getServiceHealth();
    
    const metrics = [
      `# HELP claude_service_status Claude AI service status (1=healthy, 0=unhealthy)`,
      `# TYPE claude_service_status gauge`,
      `claude_service_status{service="claude_ai"} ${health.status === 'healthy' ? 1 : 0}`,
      '',
      `# HELP claude_total_requests Total number of requests made to Claude API`,
      `# TYPE claude_total_requests counter`,
      `claude_total_requests{service="claude_ai"} ${health.statistics.totalRequests}`,
      '',
      `# HELP claude_total_errors Total number of errors encountered`,
      `# TYPE claude_total_errors counter`,
      `claude_total_errors{service="claude_ai"} ${health.statistics.errorStats.totalErrors}`,
      '',
      `# HELP claude_network_errors Network-related errors`,
      `# TYPE claude_network_errors counter`,
      `claude_network_errors{service="claude_ai"} ${health.statistics.errorStats.networkErrors}`,
      '',
      `# HELP claude_api_errors API-related errors`,
      `# TYPE claude_api_errors counter`,
      `claude_api_errors{service="claude_ai"} ${health.statistics.errorStats.apiErrors}`,
      '',
      `# HELP claude_timeout_errors Timeout errors`,
      `# TYPE claude_timeout_errors counter`,
      `claude_timeout_errors{service="claude_ai"} ${health.statistics.errorStats.timeoutErrors}`,
      '',
      `# HELP claude_auth_errors Authentication errors`,
      `# TYPE claude_auth_errors counter`,
      `claude_auth_errors{service="claude_ai"} ${health.statistics.errorStats.authErrors}`,
      '',
      `# HELP claude_service_uptime Service uptime in seconds`,
      `# TYPE claude_service_uptime gauge`,
      `claude_service_uptime{service="claude_ai"} ${Math.round(health.statistics.uptime)}`,
      '',
      `# HELP claude_memory_usage Memory usage in bytes`,
      `# TYPE claude_memory_usage gauge`,
      `claude_memory_usage{service="claude_ai",type="rss"} ${health.statistics.memoryUsage.rss}`,
      `claude_memory_usage{service="claude_ai",type="heap_used"} ${health.statistics.memoryUsage.heapUsed}`,
      `claude_memory_usage{service="claude_ai",type="heap_total"} ${health.statistics.memoryUsage.heapTotal}`
    ].join('\n');
    
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
    
  } catch (error) {
    res.status(500).send(`# ERROR: ${error.message}`);
  }
});

/**
 * Helper function to format uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

module.exports = router;
