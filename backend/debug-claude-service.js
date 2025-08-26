#!/usr/bin/env node

/**
 * Claude AI Service Diagnostic Script
 * Run this to identify production issues with the Claude AI service
 */

require('dotenv').config();
const ClaudeAiService = require('./services/claudeAiService');

async function runDiagnostics() {
  console.log('🔍 Claude AI Service Diagnostics Starting...\n');
  
  try {
    // 1. Basic Configuration Check
    console.log('📋 Step 1: Configuration Validation');
    console.log('=====================================');
    const config = ClaudeAiService.validateAndLogConfiguration();
    console.log('Configuration Status:', config.isValid ? '✅ VALID' : '❌ INVALID');
    if (!config.isValid) {
      console.log('Issues found:', config.issues);
    }
    console.log('');

    // 2. Network Connectivity Test
    console.log('🌐 Step 2: Network Connectivity Test');
    console.log('=====================================');
    const networkTest = await ClaudeAiService.testNetworkConnectivity();
    console.log('Network Status:', networkTest.success ? '✅ CONNECTED' : '❌ DISCONNECTED');
    if (!networkTest.success) {
      console.log('Network Error:', networkTest.error);
    }
    console.log('');

    // 3. Service Health Check
    console.log('🏥 Step 3: Service Health Check');
    console.log('================================');
    const health = ClaudeAiService.getServiceHealth();
    console.log('Service Status:', health.status);
    console.log('Total Requests:', health.statistics.totalRequests);
    console.log('Total Errors:', health.statistics.errorStats.totalErrors);
    console.log('Last Error:', health.statistics.errorStats.lastError);
    console.log('Last Error Time:', health.statistics.errorStats.lastErrorTime);
    console.log('');

    // 4. Test API Request (if configuration is valid)
    if (config.isValid && networkTest.success) {
      console.log('🧪 Step 4: Test API Request');
      console.log('============================');
      
      const testResponse = await ClaudeAiService.makeRequest(
        'You are a helpful AI assistant.',
        'Please respond with "Hello, I am working correctly!" and nothing else.',
        0.1
      );
      
      if (testResponse.success) {
        console.log('✅ API Test: SUCCESS');
        console.log('Response:', testResponse.content);
        console.log('Request ID:', testResponse.requestId);
        console.log('Response Time:', testResponse.requestTime + 'ms');
      } else {
        console.log('❌ API Test: FAILED');
        console.log('Error:', testResponse.error);
        console.log('Request ID:', testResponse.requestId);
        console.log('Diagnostics:', testResponse.diagnostics);
      }
    } else {
      console.log('⏭️  Step 4: Skipped (configuration or network issues)');
    }

    // 5. Environment Variables Check
    console.log('\n🔧 Step 5: Environment Variables Check');
    console.log('======================================');
    const envVars = {
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ? 'SET (' + process.env.CLAUDE_API_KEY.substring(0, 10) + '...)' : 'MISSING',
      CLAUDE_API_URL: process.env.CLAUDE_API_URL || 'DEFAULT',
      CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'DEFAULT',
      PORT: process.env.PORT || 'NOT SET',
      LOG_LEVEL: process.env.LOG_LEVEL || 'NOT SET'
    };
    
    Object.entries(envVars).forEach(([key, value]) => {
      const status = value === 'MISSING' ? '❌' : '✅';
      console.log(`${status} ${key}: ${value}`);
    });

    // 6. Recommendations
    console.log('\n💡 Step 6: Recommendations');
    console.log('===========================');
    const recommendations = ClaudeAiService.generateConfigurationRecommendations(config, networkTest);
    if (recommendations.length > 0) {
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    } else {
      console.log('✅ No immediate issues detected. Service appears to be configured correctly.');
    }

    // 7. Summary
    console.log('\n📊 Summary');
    console.log('===========');
    const overallStatus = config.isValid && networkTest.success ? 'HEALTHY' : 'UNHEALTHY';
    console.log(`Overall Status: ${overallStatus}`);
    console.log(`Configuration: ${config.isValid ? '✅' : '❌'}`);
    console.log(`Network: ${networkTest.success ? '✅' : '❌'}`);
    console.log(`Total Errors: ${health.statistics.errorStats.totalErrors}`);
    
    if (overallStatus === 'UNHEALTHY') {
      console.log('\n🚨 CRITICAL ISSUES DETECTED:');
      if (!config.isValid) {
        console.log('- Configuration problems detected');
      }
      if (!networkTest.success) {
        console.log('- Network connectivity issues');
      }
      console.log('\nPlease fix the issues above before using the Claude AI service.');
      process.exit(1);
    } else {
      console.log('\n🎉 Service is healthy and ready to use!');
    }

  } catch (error) {
    console.error('\n💥 Diagnostic script failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run diagnostics if this script is executed directly
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { runDiagnostics };
