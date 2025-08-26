// File: backend/services/claudeAiService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

class ClaudeAiService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.apiUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.maxTokens = 4000;
    
    // Enhanced production debugging
    this.debugMode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    this.requestCounter = 0;
    this.errorStats = {
      totalErrors: 0,
      networkErrors: 0,
      apiErrors: 0,
      timeoutErrors: 0,
      authErrors: 0,
      lastError: null,
      lastErrorTime: null
    };
    
    // Validate configuration on startup
    this.validateAndLogConfiguration();
  }

  /**
   * Enhanced configuration validation with detailed logging
   */
  validateAndLogConfiguration() {
    console.log('🔧 [ClaudeAI] Configuration validation started...');
    
    const config = {
      nodeEnv: process.env.NODE_ENV || 'not_set',
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'none',
      apiUrl: this.apiUrl,
      model: this.model,
      maxTokens: this.maxTokens,
      debugMode: this.debugMode
    };

    console.log('📋 [ClaudeAI] Configuration details:', config);

    // Check for critical issues
    const issues = [];
    
    if (!this.apiKey) {
      issues.push('CRITICAL: CLAUDE_API_KEY environment variable is missing');
      console.error('❌ [ClaudeAI] MISSING API KEY - Service will not function!');
    } else if (this.apiKey.length < 50) {
      issues.push('WARNING: API key seems too short, may be invalid');
      console.warn('⚠️ [ClaudeAI] API key length seems insufficient');
    }

    if (!this.apiUrl.includes('anthropic.com')) {
      issues.push('WARNING: API URL may not be correct');
      console.warn('⚠️ [ClaudeAI] API URL validation failed');
    }

    if (this.debugMode === 'production') {
      console.log('🚀 [ClaudeAI] Running in PRODUCTION mode with enhanced debugging');
    }

    // Log environment variables for debugging
    console.log('🌍 [ClaudeAI] Environment variables check:', {
      NODE_ENV: process.env.NODE_ENV,
      CLAUDE_API_KEY: this.apiKey ? 'SET' : 'MISSING',
      CLAUDE_API_URL: process.env.CLAUDE_API_URL || 'DEFAULT',
      CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'DEFAULT',
      PORT: process.env.PORT,
      LOG_LEVEL: process.env.LOG_LEVEL
    });

    if (issues.length > 0) {
      console.error('❌ [ClaudeAI] Configuration issues found:', issues);
      logger.error('Claude AI service configuration issues', { issues, config });
    } else {
      console.log('✅ [ClaudeAI] Configuration validation passed');
    }

    return {
      isValid: issues.length === 0,
      issues,
      config
    };
  }

  /**
   * Enhanced request tracking and diagnostics
   */
  async makeRequest(systemPrompt, userMessage, temperature = 0.3) {
    this.requestCounter++;
    const requestId = `REQ-${this.requestCounter}-${Date.now()}`;
    const requestStartTime = Date.now();
    
    console.log(`📡 [ClaudeAI-${requestId}] Starting request #${this.requestCounter}...`);
    
    // Pre-request validation
    const preflightCheck = this.performPreflightCheck();
    if (!preflightCheck.success) {
      console.error(`❌ [ClaudeAI-${requestId}] Preflight check failed:`, preflightCheck.issues);
      return {
        success: false,
        error: `Preflight check failed: ${preflightCheck.issues.join(', ')}`,
        requestId,
        timestamp: new Date().toISOString()
      };
    }

    const requestPayload = {
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    };

    // Enhanced request logging
    console.log(`📤 [ClaudeAI-${requestId}] Request details:`, {
      apiUrl: this.apiUrl,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature,
      systemPromptLength: systemPrompt.length + ' chars',
      userMessageLength: userMessage.length + ' chars',
      payloadSize: JSON.stringify(requestPayload).length + ' chars',
      requestId,
      timestamp: new Date().toISOString()
    });

    // Network connectivity test
    const networkTest = await this.testNetworkConnectivity();
    if (!networkTest.success) {
      console.error(`❌ [ClaudeAI-${requestId}] Network connectivity test failed:`, networkTest);
      this.updateErrorStats('networkErrors');
      return {
        success: false,
        error: `Network connectivity issue: ${networkTest.error}`,
        requestId,
        timestamp: new Date().toISOString(),
        diagnostics: { networkTest }
      };
    }

    try {
      console.log(`🚀 [ClaudeAI-${requestId}] Sending request to Claude API...`);
      
      // Enhanced axios configuration with detailed error handling
      const axiosConfig = {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        maxRedirects: 0, // Prevent redirect loops
        maxContentLength: 50 * 1024 * 1024, // 50MB max response
        maxBodyLength: 50 * 1024 * 1024 // 50MB max request
      };

      const response = await axios.post(
        this.apiUrl,
        requestPayload,
        axiosConfig
      );

      const requestTime = Date.now() - requestStartTime;

      // Enhanced success logging
      console.log(`✅ [ClaudeAI-${requestId}] Request successful:`, {
        requestTime: requestTime + 'ms',
        status: response.status,
        statusText: response.statusText,
        model: this.model,
        hasContent: !!response.data.content,
        contentLength: response.data.content?.[0]?.text?.length + ' chars' || 0,
        hasUsage: !!response.data.usage,
        usage: response.data.usage,
        responseHeaders: Object.keys(response.headers),
        requestId
      });

      // Validate response structure
      const responseValidation = this.validateResponseStructure(response.data);
      if (!responseValidation.isValid) {
        console.warn(`⚠️ [ClaudeAI-${requestId}] Response structure validation warnings:`, responseValidation.issues);
      }

      logger.info('Claude AI API request successful', {
        requestId,
        model: this.model,
        usage: response.data.usage,
        requestTime
      });

      const result = {
        success: true,
        content: response.data.content[0].text,
        usage: response.data.usage,
        requestId,
        timestamp: new Date().toISOString(),
        requestTime,
        responseValidation
      };

      console.log(`📤 [ClaudeAI-${requestId}] Returning successful response:`, {
        hasContent: !!result.content,
        contentPreview: result.content?.substring(0, 100) + '...',
        hasUsage: !!result.usage,
        requestId
      });

      return result;

    } catch (error) {
      const requestTime = Date.now() - requestStartTime;
      
      // Enhanced error analysis and categorization
      const errorAnalysis = this.analyzeError(error, requestId);
      this.updateErrorStats(errorAnalysis.errorType);
      
      console.error(`❌ [ClaudeAI-${requestId}] Request failed:`, {
        requestTime: requestTime + 'ms',
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorCode: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestId,
        timestamp: new Date().toISOString(),
        errorAnalysis
      });

      // Log detailed error information
      logger.error('Claude AI API request failed', {
        requestId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        errorAnalysis,
        requestTime
      });

      const result = {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        requestId,
        timestamp: new Date().toISOString(),
        requestTime,
        errorAnalysis,
        diagnostics: {
          errorType: error.constructor.name,
          errorCode: error.code,
          status: error.response?.status,
          responseData: error.response?.data,
          networkTest,
          preflightCheck
        }
      };

      console.log(`📤 [ClaudeAI-${requestId}] Returning error response:`, result);

      return result;
    }
  }

  /**
   * Preflight check before making API request
   */
  performPreflightCheck() {
    const issues = [];
    
    if (!this.apiKey) {
      issues.push('API key not configured');
    }
    
    if (!this.apiUrl) {
      issues.push('API URL not configured');
    }
    
    if (!this.model) {
      issues.push('Model not configured');
    }
    
    // Check if API key format looks valid
    if (this.apiKey && !this.apiKey.startsWith('sk-ant-')) {
      issues.push('API key format appears invalid (should start with sk-ant-)');
    }
    
    return {
      success: issues.length === 0,
      issues
    };
  }

  /**
   * Test network connectivity to Claude API
   */
  async testNetworkConnectivity() {
    try {
      console.log('🌐 [ClaudeAI] Testing network connectivity...');
      
      // Test DNS resolution
      const url = new URL(this.apiUrl);
      const hostname = url.hostname;
      
      // Test basic connectivity with a simple HEAD request
      const testResponse = await axios.head(this.apiUrl, {
        timeout: 10000,
        validateStatus: () => true // Accept any status for connectivity test
      });
      
      console.log('✅ [ClaudeAI] Network connectivity test passed:', {
        hostname,
        status: testResponse.status,
        responseTime: testResponse.headers['x-response-time'] || 'unknown'
      });
      
      return {
        success: true,
        hostname,
        status: testResponse.status,
        responseTime: testResponse.headers['x-response-time'] || 'unknown'
      };
      
    } catch (error) {
      console.error('❌ [ClaudeAI] Network connectivity test failed:', {
        error: error.message,
        code: error.code,
        hostname: new URL(this.apiUrl).hostname
      });
      
      return {
        success: false,
        error: error.message,
        code: error.code,
        hostname: new URL(this.apiUrl).hostname
      };
    }
  }

  /**
   * Validate response structure from Claude API
   */
  validateResponseStructure(responseData) {
    const issues = [];
    
    if (!responseData) {
      issues.push('Response data is null or undefined');
      return { isValid: false, issues };
    }
    
    if (!responseData.content) {
      issues.push('Response missing content field');
    } else if (!Array.isArray(responseData.content)) {
      issues.push('Content field is not an array');
    } else if (responseData.content.length === 0) {
      issues.push('Content array is empty');
    } else if (!responseData.content[0].text) {
      issues.push('First content item missing text field');
    }
    
    if (!responseData.usage) {
      issues.push('Response missing usage information');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Enhanced error analysis and categorization
   */
  analyzeError(error, requestId) {
    let errorType = 'unknown';
    let severity = 'medium';
    let suggestedAction = 'Check logs and retry';
    
    if (error.code === 'ECONNABORTED') {
      errorType = 'timeout';
      severity = 'high';
      suggestedAction = 'Increase timeout or check network stability';
    } else if (error.code === 'ENOTFOUND') {
      errorType = 'dns';
      severity = 'high';
      suggestedAction = 'Check DNS resolution and network connectivity';
    } else if (error.code === 'ECONNREFUSED') {
      errorType = 'connection';
      severity = 'high';
      suggestedAction = 'Check if Claude API is accessible';
    } else if (error.response) {
      if (error.response.status === 401) {
        errorType = 'auth';
        severity = 'critical';
        suggestedAction = 'Check API key validity and permissions';
      } else if (error.response.status === 429) {
        errorType = 'rateLimit';
        severity = 'medium';
        suggestedAction = 'Implement rate limiting and retry with backoff';
      } else if (error.response.status >= 500) {
        errorType = 'server';
        severity = 'medium';
        suggestedAction = 'Retry later, issue may be on Claude side';
      } else {
        errorType = 'client';
        severity = 'low';
        suggestedAction = 'Check request payload and parameters';
      }
    } else if (error.request) {
      errorType = 'network';
      severity = 'high';
      suggestedAction = 'Check network connectivity and firewall settings';
    }
    
    return {
      errorType,
      severity,
      suggestedAction,
      requestId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Update error statistics
   */
  updateErrorStats(errorType) {
    this.errorStats.totalErrors++;
    this.errorStats.lastError = errorType;
    this.errorStats.lastErrorTime = new Date().toISOString();
    
    if (this.errorStats[errorType + 'Errors'] !== undefined) {
      this.errorStats[errorType + 'Errors']++;
    }
  }

  /**
   * Get comprehensive service health status
   */
  getServiceHealth() {
    const config = this.validateAndLogConfiguration();
    const networkStatus = this.testNetworkConnectivity();
    
    return {
      service: 'Claude AI Service',
      status: config.isValid && networkStatus.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      configuration: config,
      network: networkStatus,
      statistics: {
        totalRequests: this.requestCounter,
        errorStats: this.errorStats,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasApiKey: !!this.apiKey,
        apiUrl: this.apiUrl,
        model: this.model
      }
    };
  }

  /**
   * Enhanced prompt loading with better error handling
   */
  loadPrompt(promptPath) {
    try {
      const fullPath = path.join(__dirname, '..', 'prompts', promptPath);
      console.log(`📖 [ClaudeAI] Loading prompt from: ${fullPath}`);
      
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ [ClaudeAI] Prompt file not found: ${fullPath}`);
        logger.error(`Prompt file not found: ${promptPath}`, { fullPath });
        return null;
      }
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      console.log(`✅ [ClaudeAI] Prompt loaded successfully:`, {
        path: promptPath,
        size: content.length + ' chars',
        firstLine: content.split('\n')[0].substring(0, 100) + '...'
      });
      
      return content;
    } catch (error) {
      console.error(`❌ [ClaudeAI] Failed to load prompt: ${promptPath}`, {
        error: error.message,
        code: error.code,
        path: promptPath
      });
      logger.error(`Failed to load prompt: ${promptPath}`, { error: error.message, path: promptPath });
      return null;
    }
  }

  /**
   * Analyze client debt and liabilities for cash flow planning
   */
  async analyzeDebtStrategy(clientData) {
    const requestId = `DEBT-${Date.now()}`;
    console.log(`🧠 [ClaudeAI-${requestId}] Starting debt strategy analysis:`, {
      hasClientData: !!clientData,
      clientId: clientData._id || clientData.id || 'unknown',
      clientName: clientData ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() : 'N/A'
    });

    // Validate client data
    if (!clientData) {
      console.error(`❌ [ClaudeAI-${requestId}] No client data provided for debt analysis`);
      return {
        success: false,
        error: 'No client data provided',
        requestId,
        timestamp: new Date().toISOString()
      };
    }

    const systemPrompt = this.loadPrompt('debt-analysis.md');
    if (!systemPrompt) {
      console.log(`❌ [ClaudeAI-${requestId}] Debt analysis prompt not found`);
      return {
        success: false,
        error: 'Debt analysis prompt not found',
        requestId,
        timestamp: new Date().toISOString()
      };
    }

    console.log(`📋 [ClaudeAI-${requestId}] System prompt loaded:`, {
      promptLength: systemPrompt.length + ' chars',
      hasPrompt: !!systemPrompt
    });

    // Format client data for analysis
    console.log(`🔧 [ClaudeAI-${requestId}] Formatting client data for analysis...`);
    const clientContext = this.formatClientDataForAnalysis(clientData);
    
    console.log(`📊 [ClaudeAI-${requestId}] Client context formatted:`, {
      contextLength: clientContext.length + ' chars',
      totalDebts: this.countClientDebts(clientData),
      hasFinancialData: clientContext.includes('Monthly Income:'),
      hasDebtData: clientContext.includes('INDIVIDUAL DEBTS:')
    });
    
    const userMessage = `Please analyze this client's debt situation and provide strategic recommendations:

${clientContext}

Please provide:
1. Debt prioritization strategy
2. EMI optimization recommendations
3. Interest savings calculations
4. Cash flow impact analysis
5. Risk warnings if any
6. Specific action items

Format the response as structured JSON for easy parsing.`;

    console.log(`📝 [ClaudeAI-${requestId}] User message prepared:`, {
      messageLength: userMessage.length + ' chars',
      contextPreview: clientContext.substring(0, 200) + '...'
    });

    logger.info('Requesting debt analysis from Claude AI', {
      requestId,
      clientId: clientData._id,
      totalDebts: this.countClientDebts(clientData)
    });

    console.log(`📡 [ClaudeAI-${requestId}] Making request to Claude API...`);
    const response = await this.makeRequest(systemPrompt, userMessage, 0.3);
    
    console.log(`📥 [ClaudeAI-${requestId}] Claude API response received:`, {
      success: response.success,
      hasContent: !!response.content,
      contentLength: response.content ? response.content.length + ' chars' : 0,
      hasUsage: !!response.usage,
      error: response.error,
      usageDetails: response.usage,
      requestId: response.requestId
    });

    return response;
  }

  /**
   * Format client data for AI analysis with improved data extraction
   */
  formatClientDataForAnalysis(clientData) {
    const debts = clientData.debtsAndLiabilities || {};
    
    // Enhanced income field handling - check multiple possible sources
    let monthlyIncome = clientData.totalMonthlyIncome || 
                       clientData.calculatedFinancials?.totalMonthlyIncome ||
                       clientData.calculatedFinancials?.monthlyIncome;
                       
    // Fallback to annual income conversion
    if (!monthlyIncome && clientData.annualIncome) {
      monthlyIncome = Math.round(clientData.annualIncome / 12);
      console.log('🔄 [Claude AI] Converting annualIncome to monthly:', {
        annualIncome: clientData.annualIncome,
        monthlyIncome: monthlyIncome
      });
    }
    monthlyIncome = Math.max(0, monthlyIncome || 0);
    
    // Enhanced expense field handling
    const monthlyExpenses = Math.max(0, 
      clientData.totalMonthlyExpenses || 
      clientData.calculatedFinancials?.totalMonthlyExpenses || 
      0
    );
    
    let debtSummary = [];
    let totalEMI = 0;
    let totalOutstanding = 0;

    // Process each debt type with enhanced validation
    const debtTypes = ['homeLoan', 'personalLoan', 'carLoan', 'educationLoan', 'creditCards', 'businessLoan', 'goldLoan', 'otherLoans'];
    
    console.log('💳 [Claude AI] Processing debts:', {
      availableDebtTypes: Object.keys(debts),
      totalDebtEntries: Object.keys(debts).length
    });
    
    debtTypes.forEach(debtType => {
      const debt = debts[debtType];
      if (debt && (debt.hasLoan || debt.hasDebt)) {
        const emi = Math.max(0, parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0);
        const outstanding = Math.max(0, parseFloat(debt.outstandingAmount) || parseFloat(debt.totalOutstanding) || 0);
        const interestRate = Math.max(0, parseFloat(debt.interestRate) || parseFloat(debt.averageInterestRate) || 0);
        
        // Only include debts with meaningful financial impact
        if (emi > 100 || outstanding > 1000) { // Minimum thresholds to filter noise
          const debtInfo = {
            type: debtType,
            monthlyEMI: emi,
            outstandingAmount: outstanding,
            interestRate: interestRate,
            remainingTenure: debt.remainingTenure || null,
            loanProvider: debt.loanProvider || 'Not specified'
          };
          
          debtSummary.push(debtInfo);
          totalEMI += emi;
          totalOutstanding += outstanding;
          
          console.log(`📋 [Claude AI] Added ${debtType}:`, {
            emi: emi,
            outstanding: outstanding,
            interestRate: interestRate
          });
        }
      }
    });

    console.log('📊 [Claude AI] Debt summary completed:', {
      totalDebts: debtSummary.length,
      totalEMI,
      totalOutstanding,
      emiRatio: monthlyIncome > 0 ? ((totalEMI / monthlyIncome) * 100).toFixed(2) : 0
    });

    // Calculate key financial ratios
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    const availableCashFlow = monthlySurplus - totalEMI;
    const emiRatio = monthlyIncome > 0 ? ((totalEMI / monthlyIncome) * 100) : 0;
    const expenseRatio = monthlyIncome > 0 ? ((monthlyExpenses / monthlyIncome) * 100) : 0;
    const savingsRate = monthlyIncome > 0 ? ((availableCashFlow / monthlyIncome) * 100) : 0;

    // Enhanced formatting for AI analysis
    return `
CLIENT FINANCIAL PROFILE:
- Name: ${clientData.firstName || 'Not provided'} ${clientData.lastName || ''}
- Age: ${clientData.age || clientData.retirementPlanning?.currentAge || 'Not specified'}
- Employment: ${clientData.incomeType || clientData.occupation || 'Not specified'}
- Risk Tolerance: ${clientData.riskTolerance || clientData.enhancedRiskProfile?.riskTolerance || 'Not specified'}

INCOME & EXPENSES:
- Gross Monthly Income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Total Monthly Expenses: ₹${monthlyExpenses.toLocaleString('en-IN')}
- Monthly Surplus (before EMIs): ₹${monthlySurplus.toLocaleString('en-IN')}
- Expense Ratio: ${expenseRatio.toFixed(2)}%

DEBT PORTFOLIO ANALYSIS:
- Total Active Debts: ${debtSummary.length}
- Combined Monthly EMIs: ₹${totalEMI.toLocaleString('en-IN')}
- Total Outstanding Amount: ₹${totalOutstanding.toLocaleString('en-IN')}
- EMI-to-Income Ratio: ${emiRatio.toFixed(2)}% ${emiRatio > 40 ? '⚠️ EXCEEDS SAFE LIMIT' : '✓ Within safe range'}
- Post-EMI Cash Flow: ₹${availableCashFlow.toLocaleString('en-IN')}
- Savings Rate: ${savingsRate.toFixed(2)}%

INDIVIDUAL DEBT BREAKDOWN:
${debtSummary.length > 0 ? debtSummary.map(debt => `
📋 ${debt.type.toUpperCase()}:
   • Monthly EMI: ₹${debt.monthlyEMI.toLocaleString('en-IN')}
   • Outstanding: ₹${debt.outstandingAmount.toLocaleString('en-IN')}
   • Interest Rate: ${debt.interestRate}% ${debt.interestRate > 15 ? '(HIGH)' : debt.interestRate > 10 ? '(MODERATE)' : '(LOW)'}
   • Lender: ${debt.loanProvider}
   ${debt.remainingTenure ? `   • Remaining: ${debt.remainingTenure} years` : ''}
`).join('') : '   No active debts found - Excellent debt position!'}

ASSETS & INVESTMENTS:
- Emergency Fund: ₹${(clientData.assets?.cashBankSavings || 0).toLocaleString('en-IN')}
- Total Investments: ₹${this.calculateTotalInvestments(clientData.assets).toLocaleString('en-IN')}

FINANCIAL HEALTH INDICATORS:
- Debt Burden: ${emiRatio > 40 ? 'HIGH RISK' : emiRatio > 30 ? 'MODERATE' : 'LOW'}
- Liquidity Position: ${availableCashFlow < 0 ? 'NEGATIVE CASH FLOW' : availableCashFlow < 5000 ? 'TIGHT' : 'HEALTHY'}
- Emergency Coverage: ${(clientData.assets?.cashBankSavings || 0) >= (monthlyExpenses * 6) ? 'ADEQUATE' : 'INSUFFICIENT'}

Please provide specific, actionable debt management recommendations focusing on:
1. Debt prioritization by interest rates
2. EMI optimization strategies  
3. Interest savings calculations
4. Timeline for debt elimination
5. Emergency fund building plan
6. Cash flow improvement strategies
`;
  }

  /**
   * Calculate total investments from assets
   */
  calculateTotalInvestments(assets) {
    if (!assets || typeof assets !== 'object') return 0;
    
    let total = 0;
    
    // Add equity investments
    if (assets.investments?.equity) {
      const equity = assets.investments.equity;
      total += (equity.mutualFunds || 0) + (equity.directStocks || 0) + (equity.elss || 0);
    }
    
    // Add fixed income investments
    if (assets.investments?.fixedIncome) {
      const fixedIncome = assets.investments.fixedIncome;
      total += (fixedIncome.ppf || 0) + (fixedIncome.epf || 0) + (fixedIncome.nps || 0) + 
               (fixedIncome.fixedDeposits || 0);
    }
    
    // Add other investments
    if (assets.investments?.others) {
      total += assets.investments.others.totalValue || 0;
    }
    
    return Math.max(0, total);
  }

  /**
   * Count total number of active debts
   */
  countClientDebts(clientData) {
    const debts = clientData.debtsAndLiabilities || {};
    let count = 0;
    
    Object.values(debts).forEach(debt => {
      if (debt && (debt.hasLoan || debt.hasDebt)) {
        const emi = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
        const outstanding = parseFloat(debt.outstandingAmount) || parseFloat(debt.totalOutstanding) || 0;
        if (emi > 0 || outstanding > 0) count++;
      }
    });
    
    return count;
  }

  /**
   * Analyze financial goals for goal-based planning
   */
  async analyzeGoals(selectedGoals, clientData) {
    const requestId = `GOALS-${Date.now()}`;
    console.log(`🎯 [ClaudeAI-${requestId}] Starting goal analysis:`, {
      hasClientData: !!clientData,
      clientId: clientData._id || clientData.id || 'unknown',
      selectedGoalsCount: selectedGoals?.length || 0,
      goalTypes: selectedGoals?.map(g => g.type || g.title) || []
    });

    // Validate inputs
    if (!selectedGoals || !Array.isArray(selectedGoals) || selectedGoals.length === 0) {
      console.error(`❌ [ClaudeAI-${requestId}] No goals provided for analysis`);
      return {
        success: false,
        error: 'No goals provided for analysis',
        requestId,
        timestamp: new Date().toISOString()
      };
    }

    if (!clientData) {
      console.error(`❌ [ClaudeAI-${requestId}] No client data provided for goal analysis`);
      return {
        success: false,
        error: 'No client data provided',
        requestId,
        timestamp: new Date().toISOString()
      };
    }

    const systemPrompt = this.loadPrompt('goal-analysis.md');
    if (!systemPrompt) {
      console.log(`❌ [ClaudeAI-${requestId}] Goal analysis prompt not found`);
      return {
        success: false,
        error: 'Goal analysis prompt not found',
        requestId,
        timestamp: new Date().toISOString()
      };
    }

    console.log(`📋 [ClaudeAI-${requestId}] System prompt loaded:`, {
      promptLength: systemPrompt.length + ' chars',
      hasPrompt: !!systemPrompt
    });

    // Format client and goals data for analysis
    console.log(`🔧 [ClaudeAI-${requestId}] Formatting data for goal analysis...`);
    const analysisContext = this.formatGoalsForAnalysis(selectedGoals, clientData);
    
    console.log(`📊 [ClaudeAI-${requestId}] Analysis context prepared:`, {
      contextLength: analysisContext.length + ' chars',
      hasFinancialData: analysisContext.includes('FINANCIAL SUMMARY:'),
      hasGoalsData: analysisContext.includes('SELECTED GOALS:')
    });
    
    const userMessage = `Please analyze these financial goals and provide comprehensive recommendations:

${analysisContext}

Provide detailed analysis including:
1. Individual goal feasibility and SIP requirements
2. Multi-goal optimization strategy
3. Asset allocation recommendations
4. Specific mutual fund suggestions
5. Timeline-based implementation plan
6. Risk assessment and warnings

CRITICAL: Respond with ONLY valid JSON. Start with { and end with }. No explanations, no markdown blocks.`;

    console.log(`📝 [ClaudeAI-${requestId}] User message prepared:`, {
      messageLength: userMessage.length + ' chars'
    });

    logger.info('Requesting goal analysis from Claude AI', {
      requestId,
      clientId: clientData._id,
      goalsCount: selectedGoals.length
    });

    console.log(`📡 [ClaudeAI-${requestId}] Making request to Claude API...`);
    const response = await this.makeRequest(systemPrompt, userMessage, 0.3);
    
    console.log(`📥 [ClaudeAI-${requestId}] Claude API response received:`, {
      success: response.success,
      hasContent: !!response.content,
      contentLength: response.content ? response.content.length + ' chars' : 0,
      error: response.error,
      requestId: response.requestId
    });

    return response;
  }

  /**
   * Enhanced plan comparison with better error handling
   */
  async comparePlans(planA, planB) {
    const requestId = `COMPARE-${Date.now()}`;
    try {
      console.log(`🤖 [ClaudeAI-${requestId}] Starting plan comparison`);
      
      // Validate inputs
      if (!planA || !planB) {
        throw new Error('Both plans must be provided for comparison');
      }
      
      const comparisonPrompt = this.buildComparisonPrompt(planA, planB);
      
      const response = await this.makeRequest(
        'You are a financial planning expert analyzing and comparing financial plans.',
        comparisonPrompt
      );
      
      if (!response.success) {
        throw new Error(`Claude API request failed: ${response.error}`);
      }
      
      const analysis = this.parseComparisonResponse(response.content);
      
      console.log(`✅ [ClaudeAI-${requestId}] Plan comparison completed successfully`);
      return {
        ...analysis,
        requestId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ [ClaudeAI-${requestId}] Plan comparison failed:`, error);
      logger.error('Plan comparison failed', { requestId, error: error.message });
      
      return {
        success: false,
        error: `Plan comparison failed: ${error.message}`,
        requestId,
        timestamp: new Date().toISOString()
      };
    }
  }

  buildComparisonPrompt(planA, planB) {
    const clientData = planA.clientDataSnapshot || planB.clientDataSnapshot;
    const planType = planA.planType;
    
    const basePrompt = `
As a financial planning expert, analyze and compare these two ${planType} financial plans for the same client.

CLIENT CONTEXT:
${this.formatClientDataForAnalysis(clientData)}

PLAN A DETAILS:
- Plan Type: ${planA.planType}
- Version: ${planA.version}
- Created: ${planA.createdAt}
- Status: ${planA.status}
- Key Metrics: ${JSON.stringify(planA.clientDataSnapshot?.calculatedMetrics, null, 2)}
- Advisor Recommendations: ${planA.advisorRecommendations?.keyPoints?.join(', ') || 'None'}
- AI Recommendations: ${planA.aiRecommendations?.debtStrategy || 'None'}

PLAN B DETAILS:
- Plan Type: ${planB.planType}
- Version: ${planB.version}
- Created: ${planB.createdAt}
- Status: ${planB.status}
- Key Metrics: ${JSON.stringify(planB.clientDataSnapshot?.calculatedMetrics, null, 2)}
- Advisor Recommendations: ${planB.advisorRecommendations?.keyPoints?.join(', ') || 'None'}
- AI Recommendations: ${planB.aiRecommendations?.debtStrategy || 'None'}

${this.getComparisonCriteria(planType)}

Please provide a detailed comparison in JSON format with the following structure:
{
  "executiveSummary": "Brief overview of the comparison results",
  "keyDifferences": [
    {
      "aspect": "Key difference category",
      "planAValue": "Plan A approach/value",
      "planBValue": "Plan B approach/value", 
      "significance": "High/Medium/Low significance"
    }
  ],
  "planAStrengths": ["List of Plan A strengths"],
  "planAWeaknesses": ["List of Plan A weaknesses"],
  "planBStrengths": ["List of Plan B strengths"],
  "planBWeaknesses": ["List of Plan B weaknesses"],
  "recommendation": {
    "suggestedPlan": "planA/planB/both_suitable/neither_suitable",
    "reasoning": "Detailed explanation of recommendation",
    "confidenceScore": 0.85
  },
  "riskComparison": {
    "planARiskScore": 0.6,
    "planBRiskScore": 0.4,
    "riskFactors": ["List of key risk factors to consider"]
  },
  "implementationConsiderations": ["Practical considerations for implementation"]
}`;

    return basePrompt;
  }

  getComparisonCriteria(planType) {
    switch (planType) {
      case 'goal_based':
        return `
COMPARISON CRITERIA FOR GOAL-BASED PLANS:
1. Goal Achievement Probability: Which plan has higher likelihood of meeting stated goals?
2. Timeline Feasibility: Which plan has more realistic timelines?
3. Risk-Return Balance: Which plan better balances risk with expected returns?
4. SIP Requirements: Which plan has more manageable monthly investment requirements?
5. Goal Prioritization: Which plan better prioritizes multiple goals?
6. Flexibility: Which plan allows for better adjustments over time?
`;
      
      case 'cash_flow':
        return `
COMPARISON CRITERIA FOR CASH FLOW PLANS:
1. Debt Management: Which plan more effectively reduces debt burden?
2. Emergency Fund Strategy: Which plan builds emergency fund more efficiently?
3. Monthly Surplus Optimization: Which plan better utilizes available surplus?
4. EMI Ratio Improvement: Which plan achieves better debt-to-income ratios?
5. Investment Growth: Which plan generates better long-term wealth creation?
6. Risk Management: Which plan better protects against financial emergencies?
`;
      
      default:
        return `
GENERAL COMPARISON CRITERIA:
1. Financial Health Improvement: Which plan better improves overall financial health?
2. Risk Management: Which plan better manages financial risks?
3. Return Potential: Which plan has better return expectations?
4. Feasibility: Which plan is more realistic to implement?
5. Flexibility: Which plan allows for better future adjustments?
`;
    }
  }

  parseComparisonResponse(content) {
    try {
      // Try to parse JSON response
      let parsed;
      if (typeof content === 'string') {
        // Try direct parsing first
        try {
          parsed = JSON.parse(content);
        } catch (e) {
          // Try extracting JSON from markdown code blocks
          const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[1]);
          } else {
            // Try finding any JSON-like structure
            const jsonPattern = /\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/;
            const match = content.match(jsonPattern);
            if (match) {
              parsed = JSON.parse(match[0]);
            } else {
              throw new Error('No valid JSON found in response');
            }
          }
        }
      } else {
        parsed = content;
      }
      
      // Validate the response structure
      const requiredFields = ['executiveSummary', 'keyDifferences', 'recommendation'];
      for (const field of requiredFields) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Ensure confidence score is within valid range
      if (parsed.recommendation.confidenceScore) {
        parsed.recommendation.confidenceScore = Math.max(0, Math.min(1, parsed.recommendation.confidenceScore));
      }
      
      return parsed;
      
    } catch (error) {
      console.error('Failed to parse comparison response:', error);
      
      // Return a fallback structure
      return {
        executiveSummary: "Unable to parse detailed comparison due to response format issues.",
        keyDifferences: [],
        planAStrengths: ["Plan analysis unavailable"],
        planAWeaknesses: ["Plan analysis unavailable"],
        planBStrengths: ["Plan analysis unavailable"],
        planBWeaknesses: ["Plan analysis unavailable"],
        recommendation: {
          suggestedPlan: "both_suitable",
          reasoning: "Unable to provide specific recommendation due to parsing error.",
          confidenceScore: 0.5
        },
        riskComparison: {
          planARiskScore: 0.5,
          planBRiskScore: 0.5,
          riskFactors: ["Analysis unavailable due to parsing error"]
        },
        implementationConsiderations: ["Manual review recommended due to parsing issues"]
      };
    }
  }

  /**
   * Format goals and client data for AI analysis with comprehensive financial context
   */
  formatGoalsForAnalysis(selectedGoals, clientData) {
    // Enhanced financial metrics extraction
    const monthlyIncome = clientData.totalMonthlyIncome || 
                         clientData.calculatedFinancials?.totalMonthlyIncome || 0;
    const monthlyExpenses = clientData.totalMonthlyExpenses || 
                           clientData.calculatedFinancials?.totalMonthlyExpenses || 0;
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    
    // Enhanced age calculation
    const currentYear = new Date().getFullYear();
    const age = this.calculateClientAge(clientData.dateOfBirth) || 30;
    
    // Calculate total EMIs with enhanced validation
    let totalEMIs = 0;
    const debts = clientData.debtsAndLiabilities || {};
    const activeDebts = [];
    Object.entries(debts).forEach(([debtType, debt]) => {
      if (debt && (debt.hasLoan || debt.hasDebt)) {
        const emi = parseFloat(debt.monthlyEMI) || parseFloat(debt.monthlyPayment) || 0;
        const outstanding = parseFloat(debt.outstandingAmount) || 0;
        const interestRate = parseFloat(debt.interestRate) || 0;
        
        if (emi > 0 || outstanding > 0) {
          totalEMIs += emi;
          activeDebts.push({
            type: debtType,
            emi,
            outstanding,
            interestRate
          });
        }
      }
    });
    
    const availableForInvestment = monthlySurplus - totalEMIs;
    
    // Enhanced existing financial goals context
    const existingGoalsContext = this.formatExistingGoalsContext(clientData.enhancedFinancialGoals);
    
    // Enhanced risk profile analysis
    const riskProfile = this.formatRiskProfileContext(clientData.enhancedRiskProfile);
    
    // Format selected goals with enhanced details
    const goalsFormatted = selectedGoals.map((goal, index) => {
      const years = goal.targetYear ? goal.targetYear - currentYear : 5;
      const requiredSIP = this.estimateRequiredSIP(goal.targetAmount, years);
      const source = goal.source || 'new_selection';
      
      return `
📌 GOAL ${index + 1}: ${goal.title || goal.goalName}
   • Target Amount: ₹${(goal.targetAmount || 0).toLocaleString('en-IN')}
   • Target Year: ${goal.targetYear || currentYear + 5} (${years} years)
   • Priority: ${goal.priority || 'Medium'}
   • Data Source: ${source === 'client_data' ? 'From Client Profile' : source === 'intelligent_default' ? 'AI Suggested' : 'New Selection'}
   • Estimated Monthly SIP: ₹${requiredSIP.toLocaleString('en-IN')}
   ${goal.description ? `• Description: ${goal.description}` : ''}
   ${goal.hasData ? `• Has Existing Data: Yes` : ''}`;
    }).join('\n');

    // Calculate total SIP requirement
    const totalRequiredSIP = selectedGoals.reduce((sum, goal) => {
      const years = goal.targetYear ? goal.targetYear - currentYear : 5;
      return sum + this.estimateRequiredSIP(goal.targetAmount, years);
    }, 0);

    return `
COMPREHENSIVE CLIENT PROFILE FOR GOAL-BASED PLANNING:

==== PERSONAL INFORMATION ====
- Full Name: ${clientData.firstName || ''} ${clientData.lastName || ''}
- Age: ${age} years
- Date of Birth: ${clientData.dateOfBirth || 'Not specified'}
- Number of Dependents: ${clientData.numberOfDependents || 0}
- Income Type: ${clientData.incomeType || clientData.occupation || 'Not specified'}
- Marital Status: ${clientData.personalDetails?.maritalStatus || 'Not specified'}
- Location: ${clientData.personalDetails?.city || 'Not specified'}

==== INCOME & CASH FLOW ANALYSIS ====
- Gross Monthly Income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Total Monthly Expenses: ₹${monthlyExpenses.toLocaleString('en-IN')}
- Monthly Surplus (before EMIs): ₹${monthlySurplus.toLocaleString('en-IN')}
- Monthly Debt EMIs: ₹${totalEMIs.toLocaleString('en-IN')}
- Net Available for Investment: ₹${availableForInvestment.toLocaleString('en-IN')}
- Savings Rate: ${monthlyIncome > 0 ? ((availableForInvestment / monthlyIncome) * 100).toFixed(1) : 0}%
- EMI to Income Ratio: ${monthlyIncome > 0 ? ((totalEMIs / monthlyIncome) * 100).toFixed(1) : 0}%

==== DEBT PORTFOLIO ====
${activeDebts.length > 0 ? activeDebts.map(debt => `- ${debt.type}: EMI ₹${debt.emi.toLocaleString('en-IN')}, Outstanding ₹${debt.outstanding.toLocaleString('en-IN')}, Rate ${debt.interestRate}%`).join('\n') : '- No active debts (Excellent position for goal planning)'}

==== CURRENT ASSET PORTFOLIO ====
- Cash & Bank Savings: ₹${(clientData.assets?.cashBankSavings || 0).toLocaleString('en-IN')}
- Equity Investments:
  • Mutual Funds: ₹${(clientData.assets?.investments?.equity?.mutualFunds || 0).toLocaleString('en-IN')}
  • Direct Stocks: ₹${(clientData.assets?.investments?.equity?.directStocks || 0).toLocaleString('en-IN')}
  • ELSS: ₹${(clientData.assets?.investments?.equity?.elss || 0).toLocaleString('en-IN')}
- Fixed Income Investments:
  • PPF: ₹${(clientData.assets?.investments?.fixedIncome?.ppf || 0).toLocaleString('en-IN')}
  • EPF: ₹${(clientData.assets?.investments?.fixedIncome?.epf || 0).toLocaleString('en-IN')}
  • NPS: ₹${(clientData.assets?.investments?.fixedIncome?.nps || 0).toLocaleString('en-IN')}
  • Fixed Deposits: ₹${(clientData.assets?.investments?.fixedIncome?.fixedDeposits || 0).toLocaleString('en-IN')}
- Total Investment Portfolio: ₹${this.calculateTotalInvestments(clientData.assets).toLocaleString('en-IN')}
- Emergency Fund Coverage: ${this.calculateEmergencyFundCoverage(clientData.assets?.cashBankSavings, monthlyExpenses)} months

==== RISK PROFILE & INVESTMENT EXPERIENCE ====
${riskProfile}

==== EXISTING FINANCIAL GOALS CONTEXT ====
${existingGoalsContext}

==== SELECTED GOALS FOR ANALYSIS (${selectedGoals.length} goals) ====
${goalsFormatted}

==== GOAL PLANNING FEASIBILITY ANALYSIS ====
- Total Monthly SIP Required: ₹${totalRequiredSIP.toLocaleString('en-IN')}
- Available Monthly Surplus: ₹${availableForInvestment.toLocaleString('en-IN')}
- Feasibility Status: ${totalRequiredSIP <= availableForInvestment ? '✅ FULLY ACHIEVABLE' : `⚠️ SHORTFALL OF ₹${(totalRequiredSIP - availableForInvestment).toLocaleString('en-IN')}`}
- Utilization Rate: ${availableForInvestment > 0 ? ((totalRequiredSIP / availableForInvestment) * 100).toFixed(1) : 0}%

==== ANALYSIS REQUIREMENTS ====
Provide comprehensive goal-based financial planning recommendations including:
1. Individual goal analysis with precise SIP calculations using mathematical formulas
2. Multi-goal optimization strategy considering priority and timeline conflicts
3. Age-appropriate asset allocation recommendations for each goal timeline
4. Specific mutual fund recommendations with category and fund names
5. Phase-wise implementation strategy to manage cash flow
6. Tax optimization opportunities (80C, 80CCD, ELSS)
7. Risk assessment and portfolio diversification strategy
8. Alternative scenarios if goals exceed available surplus
9. Milestone tracking and review schedule
10. Emergency fund adequacy assessment

IMPORTANT CONTEXT:
- Client Age: ${age} years (suitable for ${age < 35 ? 'aggressive' : age < 45 ? 'moderate-aggressive' : 'moderate'} investment approach)
- Available Investment Capacity: ₹${availableForInvestment.toLocaleString('en-IN')} per month
- Goal Planning Horizon: ${Math.min(...selectedGoals.map(g => g.targetYear ? g.targetYear - currentYear : 5))} to ${Math.max(...selectedGoals.map(g => g.targetYear ? g.targetYear - currentYear : 5))} years
- Financial Health Score: ${this.calculateFinancialHealthScore(monthlyIncome, monthlyExpenses, totalEMIs, clientData.assets)}/100`;
  }

  /**
   * Calculate retirement-specific assets
   */
  calculateRetirementAssets(assets) {
    if (!assets || typeof assets !== 'object') return 0;
    
    let total = 0;
    if (assets.investments?.fixedIncome) {
      const fixedIncome = assets.investments.fixedIncome;
      total += (fixedIncome.ppf || 0) + (fixedIncome.epf || 0) + (fixedIncome.nps || 0);
    }
    
    return Math.max(0, total);
  }

  /**
   * Calculate client age from date of birth
   */
  calculateClientAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Estimate required monthly SIP for a goal
   */
  estimateRequiredSIP(targetAmount, years, expectedReturn = 12) {
    if (!targetAmount || !years || years <= 0) return 0;
    
    const monthlyRate = expectedReturn / 100 / 12;
    const months = years * 12;
    
    if (monthlyRate === 0) {
      return Math.round(targetAmount / months);
    }
    
    const sip = targetAmount * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(sip);
  }

  /**
   * Format existing financial goals context for AI analysis
   */
  formatExistingGoalsContext(enhancedFinancialGoals) {
    if (!enhancedFinancialGoals) {
      return 'No existing financial goals data available from client onboarding.';
    }

    let context = 'Client\'s Original Financial Goals from Onboarding:\n';
    
    // Emergency Fund
    if (enhancedFinancialGoals.emergencyFund?.targetAmount) {
      context += `- Emergency Fund: Target ₹${enhancedFinancialGoals.emergencyFund.targetAmount.toLocaleString('en-IN')}\n`;
    }
    
    // Child Education
    if (enhancedFinancialGoals.childEducation?.isApplicable) {
      const details = enhancedFinancialGoals.childEducation.details || {};
      context += `- Child Education: ${details.targetAmount ? `₹${details.targetAmount.toLocaleString('en-IN')} by ${details.targetYear}` : 'Applicable but amount not specified'}\n`;
    }
    
    // Home Purchase
    if (enhancedFinancialGoals.homePurchase?.isApplicable) {
      const details = enhancedFinancialGoals.homePurchase.details || {};
      context += `- Home Purchase: ${details.targetAmount ? `₹${details.targetAmount.toLocaleString('en-IN')} by ${details.targetYear}` : 'Applicable but amount not specified'}\n`;
    }
    
    // Marriage of Daughter
    if (enhancedFinancialGoals.marriageOfDaughter?.isApplicable) {
      context += `- Marriage of Daughter: ${enhancedFinancialGoals.marriageOfDaughter.targetAmount ? `₹${enhancedFinancialGoals.marriageOfDaughter.targetAmount.toLocaleString('en-IN')} by ${enhancedFinancialGoals.marriageOfDaughter.targetYear}` : 'Applicable but amount not specified'}\n`;
    }
    
    // Custom Goals
    if (enhancedFinancialGoals.customGoals?.length > 0) {
      enhancedFinancialGoals.customGoals.forEach((goal, index) => {
        context += `- Custom Goal ${index + 1}: ${goal.goalName || 'Unnamed'} - ₹${(goal.targetAmount || 0).toLocaleString('en-IN')} by ${goal.targetYear || 'Not specified'}\n`;
      });
    }
    
    return context;
  }

  /**
   * Format risk profile context for AI analysis
   */
  formatRiskProfileContext(enhancedRiskProfile) {
    if (!enhancedRiskProfile) {
      return '- Risk Tolerance: Not assessed (assuming Moderate)';
    }

    return `- Risk Tolerance: ${enhancedRiskProfile.riskTolerance || 'Not specified'}
- Investment Experience: ${enhancedRiskProfile.investmentExperience || 'Not specified'}
- Investment Horizon: ${enhancedRiskProfile.investmentHorizon || 'Not specified'}
- Market Volatility Comfort: ${enhancedRiskProfile.volatilityComfort || 'Not specified'}
- Previous Investment Types: ${enhancedRiskProfile.previousInvestments?.join(', ') || 'Not specified'}`;
  }

  /**
   * Calculate emergency fund coverage in months
   */
  calculateEmergencyFundCoverage(emergencyFund, monthlyExpenses) {
    if (!emergencyFund || !monthlyExpenses || monthlyExpenses <= 0) return 0;
    return Math.round((emergencyFund / monthlyExpenses) * 10) / 10;
  }

  /**
   * Calculate overall financial health score
   */
  calculateFinancialHealthScore(monthlyIncome, monthlyExpenses, totalEMIs, assets) {
    let score = 0;
    
    // Income to expense ratio (25 points)
    const expenseRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) : 1;
    if (expenseRatio < 0.5) score += 25;
    else if (expenseRatio < 0.7) score += 20;
    else if (expenseRatio < 0.8) score += 15;
    else if (expenseRatio < 0.9) score += 10;
    
    // Debt to income ratio (25 points)
    const debtRatio = monthlyIncome > 0 ? (totalEMIs / monthlyIncome) : 0;
    if (debtRatio === 0) score += 25;
    else if (debtRatio < 0.2) score += 20;
    else if (debtRatio < 0.3) score += 15;
    else if (debtRatio < 0.4) score += 10;
    
    // Emergency fund adequacy (25 points)
    const emergencyFund = assets?.cashBankSavings || 0;
    const coverage = this.calculateEmergencyFundCoverage(emergencyFund, monthlyExpenses);
    if (coverage >= 6) score += 25;
    else if (coverage >= 3) score += 15;
    else if (coverage >= 1) score += 10;
    
    // Investment diversification (25 points)
    const totalInvestments = this.calculateTotalInvestments(assets);
    if (totalInvestments > 0) {
      if (totalInvestments > monthlyIncome * 12) score += 25; // More than 1 year income
      else if (totalInvestments > monthlyIncome * 6) score += 20;
      else if (totalInvestments > monthlyIncome * 3) score += 15;
      else score += 10;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Enhanced configuration validation
   */
  validateConfiguration() {
    console.log('🔧 [ClaudeAI] Running configuration validation...');
    
    const validation = this.validateAndLogConfiguration();
    const networkTest = this.testNetworkConnectivity();
    
    return {
      ...validation,
      networkConnectivity: networkTest,
      timestamp: new Date().toISOString(),
      recommendations: this.generateConfigurationRecommendations(validation, networkTest)
    };
  }

  /**
   * Generate configuration recommendations
   */
  generateConfigurationRecommendations(validation, networkTest) {
    const recommendations = [];
    
    if (!validation.isValid) {
      if (validation.issues.includes('CRITICAL: CLAUDE_API_KEY environment variable is missing')) {
        recommendations.push('Set CLAUDE_API_KEY environment variable with valid Anthropic API key');
      }
      if (validation.issues.includes('API key format appears invalid')) {
        recommendations.push('Verify API key format starts with sk-ant- and is complete');
      }
    }
    
    if (!networkTest.success) {
      recommendations.push('Check network connectivity and firewall settings');
      recommendations.push('Verify DNS resolution for api.anthropic.com');
    }
    
    if (process.env.NODE_ENV === 'production') {
      recommendations.push('Ensure all environment variables are properly set in production');
      recommendations.push('Check application logs for detailed error information');
    }
    
    return recommendations;
  }
}

module.exports = new ClaudeAiService();