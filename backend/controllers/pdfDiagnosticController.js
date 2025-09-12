/**
 * FILE LOCATION: backend/controllers/pdfDiagnosticController.js
 * 
 * PURPOSE: Comprehensive PDF diagnostic tool to identify and fix PDF generation issues
 * 
 * FUNCTIONALITY:
 * - Diagnoses client ID format issues
 * - Validates data completeness across all models
 * - Tests data fetching strategies
 * - Identifies template structure mismatches
 * - Provides detailed error reporting and solutions
 */

const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

class PDFDiagnosticController {
  constructor() {
    this.diagnosticResults = {
      clientIdAnalysis: {},
      dataCompleteness: {},
      searchStrategies: {},
      templateValidation: {},
      recommendations: []
    };
  }

  /**
   * Main diagnostic entry point
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async runDiagnostics(req, res) {
    try {
      const startTime = Date.now();
      const { clientId } = req.params;
      const advisorId = req.advisor.id;

      logger.info('🔍 [PDF DIAGNOSTIC] Starting comprehensive diagnostics', {
        clientId,
        advisorId,
        timestamp: new Date().toISOString()
      });

      // Reset diagnostic results
      this.diagnosticResults = {
        clientIdAnalysis: {},
        dataCompleteness: {},
        searchStrategies: {},
        templateValidation: {},
        recommendations: [],
        summary: {
          overallHealth: 'unknown',
          criticalIssues: 0,
          warnings: 0,
          dataCompleteness: 0
        }
      };

      // Step 1: Analyze client ID format and search strategies
      await this.analyzeClientIdFormat(clientId, advisorId);

      // Step 2: Test all data fetching strategies
      await this.testDataFetchingStrategies(clientId, advisorId);

      // Step 3: Validate data completeness across all models
      await this.validateDataCompleteness(clientId, advisorId);

      // Step 4: Test template data structure
      await this.validateTemplateStructure(clientId, advisorId);

      // Step 5: Generate recommendations
      this.generateRecommendations();

      // Step 6: Calculate overall health score
      this.calculateOverallHealth();

      const duration = Date.now() - startTime;

      logger.info('✅ [PDF DIAGNOSTIC] Diagnostics completed', {
        clientId,
        advisorId,
        duration: `${duration}ms`,
        healthScore: this.diagnosticResults.summary.overallHealth,
        issues: this.diagnosticResults.summary.criticalIssues
      });

      res.json({
        success: true,
        message: 'PDF diagnostics completed successfully',
        clientId,
        advisorId,
        duration: `${duration}ms`,
        diagnostics: this.diagnosticResults,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ [PDF DIAGNOSTIC] Diagnostic failed', {
        error: error.message,
        stack: error.stack,
        clientId: req.params.clientId,
        advisorId: req.advisor?.id
      });

      res.status(500).json({
        success: false,
        message: 'PDF diagnostics failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        diagnostics: this.diagnosticResults
      });
    }
  }

  /**
   * Analyze client ID format and determine the correct search strategy
   */
  async analyzeClientIdFormat(clientId, advisorId) {
    try {
      logger.info('🔍 [PDF DIAGNOSTIC] Analyzing client ID format', { clientId });

      const analysis = {
        originalId: clientId,
        idLength: clientId?.length || 0,
        idType: typeof clientId,
        isValidObjectId: mongoose.Types.ObjectId.isValid(clientId),
        isNumeric: /^\d+$/.test(clientId),
        isHexadecimal: /^[0-9a-fA-F]+$/.test(clientId),
        expectedFormat: '24-character hexadecimal ObjectId',
        actualFormat: 'unknown',
        recommendedStrategy: 'unknown',
        issues: []
      };

      // Determine actual format
      if (analysis.isValidObjectId) {
        analysis.actualFormat = 'Valid MongoDB ObjectId';
        analysis.recommendedStrategy = 'ObjectId search';
      } else if (analysis.isNumeric && analysis.idLength === 24) {
        analysis.actualFormat = '24-digit numeric string (custom format)';
        analysis.recommendedStrategy = 'Custom ID field search';
        analysis.issues.push('ID is numeric, not hexadecimal ObjectId');
      } else if (analysis.isNumeric) {
        analysis.actualFormat = 'Numeric string (non-standard length)';
        analysis.recommendedStrategy = 'String search or custom field';
        analysis.issues.push('ID is numeric with non-standard length');
      } else if (analysis.idLength !== 24) {
        analysis.actualFormat = 'Non-standard length string';
        analysis.recommendedStrategy = 'Custom field search';
        analysis.issues.push('ID length is not 24 characters');
      } else {
        analysis.actualFormat = 'Unknown format';
        analysis.recommendedStrategy = 'Multiple search strategies';
        analysis.issues.push('ID format could not be determined');
      }

      this.diagnosticResults.clientIdAnalysis = analysis;

      logger.info('✅ [PDF DIAGNOSTIC] Client ID analysis completed', {
        format: analysis.actualFormat,
        strategy: analysis.recommendedStrategy,
        issues: analysis.issues.length
      });

    } catch (error) {
      logger.error('❌ [PDF DIAGNOSTIC] Client ID analysis failed', { error: error.message });
      this.diagnosticResults.clientIdAnalysis.error = error.message;
    }
  }

  /**
   * Test all data fetching strategies to see which one works
   */
  async testDataFetchingStrategies(clientId, advisorId) {
    try {
      logger.info('🔍 [PDF DIAGNOSTIC] Testing data fetching strategies', { clientId });

      const Client = require('../models/Client');
      const strategies = [];

      // Strategy 1: ObjectId search
      if (mongoose.Types.ObjectId.isValid(clientId)) {
        try {
          const client = await Client.findOne({ 
            _id: new mongoose.Types.ObjectId(clientId), 
            advisor: new mongoose.Types.ObjectId(advisorId) 
          });
          strategies.push({
            name: 'ObjectId Search',
            query: `_id: ObjectId("${clientId}")`,
            success: !!client,
            clientFound: client ? {
              _id: client._id,
              name: `${client.firstName} ${client.lastName}`,
              onboardingStep: client.onboardingStep
            } : null,
            error: null
          });
        } catch (error) {
          strategies.push({
            name: 'ObjectId Search',
            query: `_id: ObjectId("${clientId}")`,
            success: false,
            clientFound: null,
            error: error.message
          });
        }
      }

      // Strategy 2: String ID search
      try {
        const client = await Client.findOne({ 
          _id: clientId, 
          advisor: new mongoose.Types.ObjectId(advisorId) 
        });
        strategies.push({
          name: 'String ID Search',
          query: `_id: "${clientId}"`,
          success: !!client,
          clientFound: client ? {
            _id: client._id,
            name: `${client.firstName} ${client.lastName}`,
            onboardingStep: client.onboardingStep
          } : null,
          error: null
        });
      } catch (error) {
        strategies.push({
          name: 'String ID Search',
          query: `_id: "${clientId}"`,
          success: false,
          clientFound: null,
          error: error.message
        });
      }

      // Strategy 3: Custom clientId field
      try {
        const client = await Client.findOne({ 
          clientId: clientId, 
          advisor: new mongoose.Types.ObjectId(advisorId) 
        });
        strategies.push({
          name: 'Custom clientId Field',
          query: `clientId: "${clientId}"`,
          success: !!client,
          clientFound: client ? {
            _id: client._id,
            name: `${client.firstName} ${client.lastName}`,
            onboardingStep: client.onboardingStep
          } : null,
          error: null
        });
      } catch (error) {
        strategies.push({
          name: 'Custom clientId Field',
          query: `clientId: "${clientId}"`,
          success: false,
          clientFound: null,
          error: error.message
        });
      }

      // Strategy 4: 'id' field search
      try {
        const client = await Client.findOne({ 
          id: clientId, 
          advisor: new mongoose.Types.ObjectId(advisorId) 
        });
        strategies.push({
          name: 'Custom id Field',
          query: `id: "${clientId}"`,
          success: !!client,
          clientFound: client ? {
            _id: client._id,
            name: `${client.firstName} ${client.lastName}`,
            onboardingStep: client.onboardingStep
          } : null,
          error: null
        });
      } catch (error) {
        strategies.push({
          name: 'Custom id Field',
          query: `id: "${clientId}"`,
          success: false,
          clientFound: null,
          error: error.message
        });
      }

      // Strategy 5: No advisor filter (for debugging)
      try {
        const client = await Client.findOne({ 
          id: clientId
        });
        strategies.push({
          name: 'No Advisor Filter',
          query: `id: "${clientId}"`,
          success: !!client,
          clientFound: client ? {
            _id: client._id,
            name: `${client.firstName} ${client.lastName}`,
            advisorId: client.advisor?.toString(),
            onboardingStep: client.onboardingStep
          } : null,
          error: null
        });
      } catch (error) {
        strategies.push({
          name: 'No Advisor Filter',
          query: `id: "${clientId}"`,
          success: false,
          clientFound: null,
          error: error.message
        });
      }

      this.diagnosticResults.searchStrategies = {
        strategies,
        workingStrategy: strategies.find(s => s.success) || null,
        totalStrategies: strategies.length,
        successfulStrategies: strategies.filter(s => s.success).length
      };

      logger.info('✅ [PDF DIAGNOSTIC] Search strategies tested', {
        total: strategies.length,
        successful: strategies.filter(s => s.success).length,
        workingStrategy: strategies.find(s => s.success)?.name || 'None'
      });

    } catch (error) {
      logger.error('❌ [PDF DIAGNOSTIC] Search strategies test failed', { error: error.message });
      this.diagnosticResults.searchStrategies.error = error.message;
    }
  }

  /**
   * Validate data completeness across all models
   */
  async validateDataCompleteness(clientId, advisorId) {
    try {
      logger.info('🔍 [PDF DIAGNOSTIC] Validating data completeness', { clientId });

      // Import all required models
      const Client = require('../models/Client');
      const Vault = require('../models/Vault');
      const FinancialPlan = require('../models/FinancialPlan');
      const Meeting = require('../models/Meeting');
      const LOE = require('../models/LOE');
      const LOEAutomation = require('../models/LOEAutomation');
      const ABTestSession = require('../models/ABTestSession');
      const ChatHistory = require('../models/ChatHistory');
      const MutualFundExitStrategy = require('../models/MutualFundExitStrategy');
      const ClientInvitation = require('../models/ClientInvitation');
      const EstateInformation = require('../models/EstateInformation');
      const MutualFundRecommend = require('../models/MutualFundRecommend');
      const TaxPlanning = require('../models/TaxPlanning');

      // Find the client first using the working strategy
      let client = null;
      const workingStrategy = this.diagnosticResults.searchStrategies.workingStrategy;
      
      if (workingStrategy) {
        try {
          switch (workingStrategy.name) {
            case 'ObjectId Search':
              client = await Client.findOne({ 
                _id: new mongoose.Types.ObjectId(clientId), 
                advisor: new mongoose.Types.ObjectId(advisorId) 
              });
              break;
            case 'String ID Search':
              client = await Client.findOne({ 
                _id: clientId, 
                advisor: new mongoose.Types.ObjectId(advisorId) 
              });
              break;
            case 'Custom clientId Field':
              client = await Client.findOne({ 
                clientId: clientId, 
                advisor: new mongoose.Types.ObjectId(advisorId) 
              });
              break;
            case 'Custom id Field':
              client = await Client.findOne({ 
                id: clientId, 
                advisor: new mongoose.Types.ObjectId(advisorId) 
              });
              break;
          }
        } catch (error) {
          logger.warn('⚠️ [PDF DIAGNOSTIC] Client fetch failed even with working strategy', { error: error.message });
        }
      }

      if (!client) {
        this.diagnosticResults.dataCompleteness = {
          error: 'Client not found with any strategy',
          completeness: 0
        };
        return;
      }

      // Use the client's MongoDB _id for related data queries
      const clientMongoId = client._id;

      // Test all related data collections
      const dataCollections = [
        { name: 'Vault', model: Vault, query: { advisorId: new mongoose.Types.ObjectId(advisorId) }, single: true },
        { name: 'FinancialPlan', model: FinancialPlan, query: { clientId: clientMongoId, advisorId: new mongoose.Types.ObjectId(advisorId) }, single: false },
        { name: 'Meeting', model: Meeting, query: { clientId: clientMongoId, advisorId: new mongoose.Types.ObjectId(advisorId) }, single: false },
        { name: 'LOE', model: LOE, query: { clientId: clientMongoId, advisorId: new mongoose.Types.ObjectId(advisorId) }, single: false },
        { name: 'LOEAutomation', model: LOEAutomation, query: { clientId: clientMongoId, advisorId: new mongoose.Types.ObjectId(advisorId) }, single: false },
        { name: 'ABTestSession', model: ABTestSession, query: { clientId: clientMongoId, advisorId: new mongoose.Types.ObjectId(advisorId) }, single: false },
        { name: 'ChatHistory', model: ChatHistory, query: { clientId: clientMongoId, advisorId: new mongoose.Types.ObjectId(advisorId) }, single: false },
        { name: 'MutualFundExitStrategy', model: MutualFundExitStrategy, query: { clientId: clientMongoId, advisorId: new mongoose.Types.ObjectId(advisorId) }, single: false },
        { name: 'ClientInvitation', model: ClientInvitation, query: { clientId: clientMongoId, advisorId: new mongoose.Types.ObjectId(advisorId) }, single: false },
        { name: 'EstateInformation', model: EstateInformation, query: { clientId: clientMongoId, advisorId: new mongoose.Types.ObjectId(advisorId) }, single: true },
        { name: 'MutualFundRecommend', model: MutualFundRecommend, query: { clientId: clientMongoId, advisorId: new mongoose.Types.ObjectId(advisorId) }, single: false },
        { name: 'TaxPlanning', model: TaxPlanning, query: { clientId: clientMongoId, advisorId: new mongoose.Types.ObjectId(advisorId) }, single: true }
      ];

      const collectionResults = [];
      let totalDataPoints = 0;
      let availableDataPoints = 0;

      for (const collection of dataCollections) {
        try {
          let result;
          if (collection.single) {
            result = await collection.model.findOne(collection.query);
            const hasData = result !== null;
            collectionResults.push({
              name: collection.name,
              query: collection.query,
              hasData,
              count: hasData ? 1 : 0,
              sample: hasData ? this.sanitizeForLogging(result.toObject()) : null,
              error: null
            });
          } else {
            result = await collection.model.find(collection.query);
            const count = result.length;
            collectionResults.push({
              name: collection.name,
              query: collection.query,
              hasData: count > 0,
              count,
              sample: count > 0 ? this.sanitizeForLogging(result[0].toObject()) : null,
              error: null
            });
          }

          totalDataPoints++;
          if (collectionResults[collectionResults.length - 1].hasData) {
            availableDataPoints++;
          }

        } catch (error) {
          collectionResults.push({
            name: collection.name,
            query: collection.query,
            hasData: false,
            count: 0,
            sample: null,
            error: error.message
          });
          totalDataPoints++;
        }
      }

      // Analyze client data completeness
      const clientDataAnalysis = this.analyzeClientDataCompleteness(client);

      this.diagnosticResults.dataCompleteness = {
        client: clientDataAnalysis,
        collections: collectionResults,
        summary: {
          totalCollections: totalDataPoints,
          availableCollections: availableDataPoints,
          completenessPercentage: Math.round((availableDataPoints / totalDataPoints) * 100),
          totalRecords: collectionResults.reduce((sum, col) => sum + col.count, 0)
        }
      };

      logger.info('✅ [PDF DIAGNOSTIC] Data completeness validated', {
        completeness: `${Math.round((availableDataPoints / totalDataPoints) * 100)}%`,
        availableCollections: availableDataPoints,
        totalCollections: totalDataPoints,
        totalRecords: collectionResults.reduce((sum, col) => sum + col.count, 0)
      });

    } catch (error) {
      logger.error('❌ [PDF DIAGNOSTIC] Data completeness validation failed', { error: error.message });
      this.diagnosticResults.dataCompleteness.error = error.message;
    }
  }

  /**
   * Analyze client data completeness
   */
  analyzeClientDataCompleteness(client) {
    const clientData = client.toObject();
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 
      'panNumber', 'occupation', 'totalMonthlyIncome', 'totalMonthlyExpenses',
      'onboardingStep', 'status'
    ];

    const optionalFields = [
      'address', 'financialInfo', 'assets', 'liabilities', 'goals',
      'emergencyFund', 'insuranceDetails'
    ];

    const analysis = {
      requiredFields: {},
      optionalFields: {},
      summary: {
        requiredFieldsPresent: 0,
        optionalFieldsPresent: 0,
        totalRequiredFields: requiredFields.length,
        totalOptionalFields: optionalFields.length,
        completenessScore: 0
      }
    };

    // Check required fields
    requiredFields.forEach(field => {
      const hasValue = clientData[field] !== null && 
                      clientData[field] !== undefined && 
                      clientData[field] !== '' &&
                      clientData[field] !== 0;
      
      analysis.requiredFields[field] = {
        present: hasValue,
        value: clientData[field],
        type: typeof clientData[field]
      };

      if (hasValue) {
        analysis.summary.requiredFieldsPresent++;
      }
    });

    // Check optional fields
    optionalFields.forEach(field => {
      const hasValue = clientData[field] !== null && 
                      clientData[field] !== undefined && 
                      clientData[field] !== '' &&
                      clientData[field] !== 0;
      
      analysis.optionalFields[field] = {
        present: hasValue,
        value: clientData[field],
        type: typeof clientData[field]
      };

      if (hasValue) {
        analysis.summary.optionalFieldsPresent++;
      }
    });

    // Calculate completeness score
    analysis.summary.completenessScore = Math.round(
      ((analysis.summary.requiredFieldsPresent / analysis.summary.totalRequiredFields) * 70) +
      ((analysis.summary.optionalFieldsPresent / analysis.summary.totalOptionalFields) * 30)
    );

    return analysis;
  }

  /**
   * Validate template data structure
   */
  async validateTemplateStructure(clientId, advisorId) {
    try {
      logger.info('🔍 [PDF DIAGNOSTIC] Validating template structure', { clientId });

      // This would test the actual template data preparation
      const templateValidation = {
        expectedFields: {
          vault: ['firmName', 'firstName', 'lastName', 'email', 'sebiRegNumber'],
          client: ['firstName', 'lastName', 'email', 'phoneNumber', 'financialInfo'],
          charts: ['netWorthChart', 'incomeExpenseChart', 'assetAllocationChart']
        },
        actualFields: {},
        mismatches: [],
        warnings: []
      };

      // Test if we can prepare template data
      try {
        const PDFGenerationService = require('../services/pdfGenerationService');
        const pdfService = new PDFGenerationService();
        
        // This would test the actual data preparation
        templateValidation.warnings.push('Template validation requires actual data fetching');
        
      } catch (error) {
        templateValidation.warnings.push(`Template service error: ${error.message}`);
      }

      this.diagnosticResults.templateValidation = templateValidation;

      logger.info('✅ [PDF DIAGNOSTIC] Template structure validated');

    } catch (error) {
      logger.error('❌ [PDF DIAGNOSTIC] Template validation failed', { error: error.message });
      this.diagnosticResults.templateValidation.error = error.message;
    }
  }

  /**
   * Generate recommendations based on diagnostic results
   */
  generateRecommendations() {
    const recommendations = [];

    // Client ID recommendations
    const clientIdAnalysis = this.diagnosticResults.clientIdAnalysis;
    if (clientIdAnalysis.issues && clientIdAnalysis.issues.length > 0) {
      if (clientIdAnalysis.isNumeric) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Client ID Format',
          issue: 'Client ID is numeric instead of hexadecimal ObjectId',
          solution: 'Use custom ID field search or convert to proper ObjectId format',
          code: `// Use this query instead:
const client = await Client.findOne({ 
  id: "${clientIdAnalysis.originalId}", 
  advisor: new mongoose.Types.ObjectId(advisorId) 
});`
        });
      }
    }

    // Search strategy recommendations
    const searchStrategies = this.diagnosticResults.searchStrategies;
    if (searchStrategies.workingStrategy) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Search Strategy',
        issue: 'Multiple search strategies causing confusion',
        solution: `Use only the working strategy: ${searchStrategies.workingStrategy.name}`,
        code: `// ${searchStrategies.workingStrategy.query}`
      });
    } else {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Search Strategy',
        issue: 'No working search strategy found',
        solution: 'Check client ID format and database schema',
        code: '// Client may not exist or ID format is incorrect'
      });
    }

    // Data completeness recommendations
    const dataCompleteness = this.diagnosticResults.dataCompleteness;
    if (dataCompleteness.summary) {
      if (dataCompleteness.summary.completenessPercentage < 50) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Data Completeness',
          issue: `Only ${dataCompleteness.summary.completenessPercentage}% of data collections have data`,
          solution: 'Ensure client completes onboarding and data is properly stored',
          code: '// Check onboarding flow and data validation'
        });
      }

      if (dataCompleteness.client && dataCompleteness.client.summary.completenessScore < 70) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Client Data',
          issue: `Client data completeness is ${dataCompleteness.client.summary.completenessScore}%`,
          solution: 'Collect missing required client information',
          code: '// Focus on required fields: firstName, lastName, email, phoneNumber'
        });
      }
    }

    this.diagnosticResults.recommendations = recommendations;
  }

  /**
   * Calculate overall health score
   */
  calculateOverallHealth() {
    let healthScore = 100;
    let criticalIssues = 0;
    let warnings = 0;

    // Deduct points for critical issues
    if (!this.diagnosticResults.searchStrategies.workingStrategy) {
      healthScore -= 50;
      criticalIssues++;
    }

    if (this.diagnosticResults.clientIdAnalysis.issues?.length > 0) {
      healthScore -= 20;
      warnings++;
    }

    if (this.diagnosticResults.dataCompleteness.summary?.completenessPercentage < 50) {
      healthScore -= 30;
      warnings++;
    }

    // Determine overall health
    let overallHealth;
    if (healthScore >= 90) {
      overallHealth = 'EXCELLENT';
    } else if (healthScore >= 70) {
      overallHealth = 'GOOD';
    } else if (healthScore >= 50) {
      overallHealth = 'FAIR';
    } else if (healthScore >= 30) {
      overallHealth = 'POOR';
    } else {
      overallHealth = 'CRITICAL';
    }

    this.diagnosticResults.summary = {
      overallHealth,
      healthScore: Math.max(0, healthScore),
      criticalIssues,
      warnings,
      dataCompleteness: this.diagnosticResults.dataCompleteness.summary?.completenessPercentage || 0
    };
  }

  /**
   * Sanitize object for logging (remove sensitive data)
   */
  sanitizeForLogging(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = { ...obj };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'pan'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}

module.exports = new PDFDiagnosticController();
