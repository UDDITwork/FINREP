/**
 * FILE LOCATION: backend/services/pdfGenerationService.js
 * 
 * PURPOSE: Comprehensive PDF generation service for client reports
 * 

 */

const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');
const ChartGenerationService = require('./chartGenerationService');

class PDFGenerationService {
  constructor() {
    this.chartService = new ChartGenerationService();
    this.templatePath = path.join(__dirname, '../templates');
    this.outputPath = path.join(__dirname, '../uploads/temp');
  }

  /**
   * Generate comprehensive client PDF report
   * @param {Object} clientData - Complete client data from all models
   * @param {Object} vaultData - Advisor vault data for header
   * @returns {Buffer} - PDF buffer
   */
  async generateClientReport(clientData, vaultData) {
    const serviceRequestId = Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();
    
    console.log(`\n🔧 [PDF SERVICE] [${serviceRequestId}] ===== PDF SERVICE STARTED =====`);
    console.log(`📅 [PDF SERVICE] [${serviceRequestId}] Timestamp: ${new Date().toISOString()}`);
    
    try {
      console.log(`📊 [PDF SERVICE] [${serviceRequestId}] Input data:`, {
        hasClientData: !!clientData,
        hasVaultData: !!vaultData,
        clientDataKeys: clientData ? Object.keys(clientData) : [],
        vaultDataKeys: vaultData ? Object.keys(vaultData) : []
      });
      
      logger.info('🚀 [PDF GENERATION] Starting client report generation', {
        serviceRequestId,
        clientId: clientData.client?._id,
        advisorId: vaultData?.advisorId
      });

      // Step 1: Generate charts with error handling
      console.log(`🔍 [PDF SERVICE] [${serviceRequestId}] Step 1: Generating charts...`);
      let charts = {};
      try {
        charts = await this.generateCharts(clientData);
        console.log(`✅ [PDF SERVICE] [${serviceRequestId}] Charts generated successfully:`, {
          chartKeys: Object.keys(charts)
        });
        logger.info('✅ [PDF GENERATION] Charts generated successfully');
      } catch (chartError) {
        logger.warn('⚠️ [PDF GENERATION] Chart generation failed, continuing without charts', {
          error: chartError.message
        });
        charts = {};
      }
      
      // Step 2: Prepare template data with comprehensive validation
      console.log(`🔍 [PDF SERVICE] [${serviceRequestId}] Step 2: Preparing template data...`);
      const templateData = this.prepareTemplateData(clientData, vaultData, charts);
      console.log(`✅ [PDF SERVICE] [${serviceRequestId}] Template data prepared:`, {
        templateDataKeys: Object.keys(templateData || {}),
        hasClient: !!templateData?.client,
        hasVault: !!templateData?.vault
      });
      
      // Step 3: Render HTML template with error handling
      console.log(`🔍 [PDF SERVICE] [${serviceRequestId}] Step 3: Rendering HTML template...`);
      let htmlContent;
      try {
        htmlContent = await this.renderTemplate(templateData);
        console.log(`✅ [PDF SERVICE] [${serviceRequestId}] Template rendered successfully:`, {
          htmlLength: htmlContent.length,
          htmlPreview: htmlContent.substring(0, 200) + '...'
        });
        logger.info('✅ [PDF GENERATION] Template rendered successfully', {
          htmlLength: htmlContent.length,
          clientId: clientData.client?._id
        });
      } catch (templateError) {
        logger.error('❌ [PDF GENERATION] Template rendering failed, using fallback', {
          error: templateError.message,
          stack: templateError.stack,
          clientId: clientData.client?._id
        });
        htmlContent = this.generateFallbackHTML(templateData);
      }
      
      // Step 4: Convert HTML to PDF with retry logic
      console.log(`🔍 [PDF SERVICE] [${serviceRequestId}] Step 4: Converting HTML to PDF...`);
      let pdfBuffer;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 [PDF SERVICE] [${serviceRequestId}] PDF conversion attempt ${retryCount + 1}/${maxRetries}...`);
          pdfBuffer = await this.htmlToPdf(htmlContent);
          console.log(`✅ [PDF SERVICE] [${serviceRequestId}] PDF conversion successful:`, {
            pdfSize: pdfBuffer.length,
            isBuffer: Buffer.isBuffer(pdfBuffer),
            bufferType: typeof pdfBuffer
          });
          break;
        } catch (pdfError) {
          retryCount++;
          logger.warn(`⚠️ [PDF GENERATION] PDF conversion attempt ${retryCount} failed`, {
            error: pdfError.message,
            retryCount
          });
          
          if (retryCount >= maxRetries) {
            throw pdfError;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ [PDF SERVICE] [${serviceRequestId}] ===== PDF SERVICE COMPLETED =====`);
      console.log(`⏱️ [PDF SERVICE] [${serviceRequestId}] Total duration: ${duration}ms`);
      console.log(`📊 [PDF SERVICE] [${serviceRequestId}] Final stats:`, {
        duration: `${duration}ms`,
        pdfSize: `${Math.round(pdfBuffer.length / 1024)}KB`,
        clientId: clientData.client?._id
      });
      
      logger.info('✅ [PDF GENERATION] Client report generated successfully', {
        serviceRequestId,
        clientId: clientData.client?._id,
        pdfSize: `${Math.round(pdfBuffer.length / 1024)}KB`
      });

      return pdfBuffer;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ [PDF SERVICE] [${serviceRequestId}] ===== PDF SERVICE FAILED =====`);
      console.log(`💥 [PDF SERVICE] [${serviceRequestId}] Critical error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5),
        duration: `${duration}ms`
      });
      
      logger.error('❌ [PDF GENERATION] Critical error in PDF generation', {
        serviceRequestId,
        error: error.message,
        stack: error.stack,
        clientId: clientData.client?._id
      });
      
      // Return a minimal PDF as last resort
      try {
        return await this.generateMinimalPDF(clientData, vaultData);
      } catch (fallbackError) {
        logger.error('❌ [PDF GENERATION] Even fallback PDF generation failed', {
          error: fallbackError.message
        });
        throw error;
      }
    }
  }

  /**
   * Generate all required charts for the PDF
   * @param {Object} clientData - Client data
   * @returns {Object} - Chart data objects
   */
  async generateCharts(clientData) {
    try {
      logger.info('📊 [PDF GENERATION] Generating charts for client report');

      const charts = {};

      // Generate financial overview charts
      if (clientData.client?.financialData) {
        charts.assetAllocation = await this.chartService.generateAssetAllocationChart(
          clientData.client.financialData
        );
        
        charts.incomeExpense = await this.chartService.generateIncomeExpenseChart(
          clientData.client.financialData
        );
        
        charts.netWorthTrend = await this.chartService.generateNetWorthTrendChart(
          clientData.client.financialData
        );
      }

      // Generate goal progress charts
      if (clientData.client?.goals?.length > 0) {
        charts.goalProgress = await this.chartService.generateGoalProgressChart(
          clientData.client.goals
        );
      }

      // Generate investment portfolio charts
      if (clientData.mutualFundRecommend?.length > 0) {
        charts.investmentRecommendations = await this.chartService.generateInvestmentChart(
          clientData.mutualFundRecommend
        );
      }

      // Generate tax planning charts
      if (clientData.taxPlanning) {
        charts.taxSavings = await this.chartService.generateTaxSavingsChart(
          clientData.taxPlanning
        );
      }

      logger.info('✅ [PDF GENERATION] Charts generated successfully', {
        chartCount: Object.keys(charts).length
      });

      return charts;

    } catch (error) {
      logger.error('❌ [PDF GENERATION] Error generating charts', {
        error: error.message,
        stack: error.stack
      });
      // Return empty charts object to continue PDF generation
      return {};
    }
  }

  /**
   * Prepare template data with all client information
   * @param {Object} clientData - Client data
   * @param {Object} vaultData - Vault data
   * @param {Object} charts - Generated charts
   * @returns {Object} - Template data
   */
  prepareTemplateData(clientData, vaultData, charts) {
    try {
      const client = clientData.client || {};
      
      // Ensure all required fields exist with safe defaults
      const safeClient = this.sanitizeClientData(client);
    
      // Extract financial data from Client.js model structure with safe defaults
      const totalMonthlyIncome = this.safeNumber(safeClient.totalMonthlyIncome);
      const totalMonthlyExpenses = this.safeNumber(safeClient.totalMonthlyExpenses);
      const annualIncome = this.safeNumber(safeClient.annualIncome);
      const additionalIncome = this.safeNumber(safeClient.additionalIncome);
    
      // Calculate monthly income from various sources
      const calculatedMonthlyIncome = totalMonthlyIncome || (annualIncome / 12) + (additionalIncome / 12);
      
      // Calculate monthly expenses from Client.js model with safe defaults
      const monthlyExpenses = safeClient.monthlyExpenses || {};
      const calculatedMonthlyExpenses = totalMonthlyExpenses || 
        this.safeNumber(monthlyExpenses.housingRent) +
        this.safeNumber(monthlyExpenses.groceriesUtilitiesFood) +
        this.safeNumber(monthlyExpenses.transportation) +
        this.safeNumber(monthlyExpenses.education) +
        this.safeNumber(monthlyExpenses.healthcare) +
        this.safeNumber(monthlyExpenses.entertainment) +
        this.safeNumber(monthlyExpenses.insurancePremiums) +
        this.safeNumber(monthlyExpenses.loanEmis) +
        this.safeNumber(monthlyExpenses.otherExpenses);

      // Calculate assets from Client.js model structure with safe defaults
      const assets = safeClient.assets || {};
      const totalAssets = 
        this.safeNumber(assets.cashBankSavings) +
        this.safeNumber(assets.realEstate) +
        this.safeNumber(assets.investments?.equity?.mutualFunds) +
        this.safeNumber(assets.investments?.equity?.directStocks) +
        this.safeNumber(assets.investments?.fixedIncome?.ppf) +
        this.safeNumber(assets.investments?.fixedIncome?.epf) +
        this.safeNumber(assets.investments?.fixedIncome?.nps) +
        this.safeNumber(assets.investments?.fixedIncome?.fixedDeposits) +
        this.safeNumber(assets.investments?.fixedIncome?.bondsDebentures) +
        this.safeNumber(assets.investments?.fixedIncome?.nsc) +
        this.safeNumber(assets.investments?.other?.ulip) +
        this.safeNumber(assets.investments?.other?.otherInvestments);

      // Calculate liabilities from Client.js model structure with safe defaults
      const liabilities = safeClient.liabilities || {};
      const debtsAndLiabilities = safeClient.debtsAndLiabilities || {};
      const totalLiabilities = 
        this.safeNumber(liabilities.loans) +
        this.safeNumber(liabilities.creditCardDebt) +
        this.safeNumber(debtsAndLiabilities.homeLoan?.outstandingAmount) +
        this.safeNumber(debtsAndLiabilities.personalLoan?.outstandingAmount) +
        this.safeNumber(debtsAndLiabilities.carLoan?.outstandingAmount) +
        this.safeNumber(debtsAndLiabilities.educationLoan?.outstandingAmount) +
        this.safeNumber(debtsAndLiabilities.goldLoan?.outstandingAmount) +
        this.safeNumber(debtsAndLiabilities.businessLoan?.outstandingAmount) +
        this.safeNumber(debtsAndLiabilities.creditCards?.totalOutstanding) +
        this.safeNumber(debtsAndLiabilities.otherLoans?.outstandingAmount);

      const netWorth = totalAssets - totalLiabilities;
      const savingsRate = calculatedMonthlyIncome > 0 ? ((calculatedMonthlyIncome - calculatedMonthlyExpenses) / calculatedMonthlyIncome * 100) : 0;

      // Goal progress calculation from Client.js model with safe defaults
      const majorGoals = this.safeArray(safeClient.majorGoals);
      const enhancedFinancialGoals = safeClient.enhancedFinancialGoals || {};
      const customGoals = this.safeArray(enhancedFinancialGoals.customGoals);
    
      // Combine all goals from different sources with safe defaults
      const allGoals = [
        ...majorGoals.map(goal => ({
          name: this.safeString(goal.goalName) || 'Unnamed Goal',
          targetAmount: this.safeNumber(goal.targetAmount),
          currentAmount: 0, // This would need to be calculated from actual progress
          targetYear: this.safeNumber(goal.targetYear) || new Date().getFullYear() + 5,
          priority: this.safeString(goal.priority) || 'Medium'
        })),
        ...customGoals.map(goal => ({
          name: this.safeString(goal.goalName) || 'Custom Goal',
          targetAmount: this.safeNumber(goal.targetAmount),
          currentAmount: 0, // This would need to be calculated from actual progress
          targetYear: this.safeNumber(goal.targetYear) || new Date().getFullYear() + 5,
          priority: this.safeString(goal.priority) || 'Medium'
        }))
      ];

      // Add enhanced financial goals with safe defaults
      if (this.safeNumber(enhancedFinancialGoals.emergencyFund?.targetAmount) > 0) {
        allGoals.push({
          name: 'Emergency Fund',
          targetAmount: this.safeNumber(enhancedFinancialGoals.emergencyFund.targetAmount),
          currentAmount: 0, // This would need to be calculated
          targetYear: new Date().getFullYear() + 1,
          priority: this.safeString(enhancedFinancialGoals.emergencyFund.priority) || 'High'
        });
      }

      if (enhancedFinancialGoals.childEducation?.isApplicable) {
        allGoals.push({
          name: 'Child Education',
          targetAmount: this.safeNumber(enhancedFinancialGoals.childEducation.targetAmount),
          currentAmount: 0, // This would need to be calculated
          targetYear: this.safeNumber(enhancedFinancialGoals.childEducation.targetYear) || new Date().getFullYear() + 10,
          priority: 'High'
        });
      }

      if (enhancedFinancialGoals.homePurchase?.isApplicable) {
        allGoals.push({
          name: 'Home Purchase',
          targetAmount: this.safeNumber(enhancedFinancialGoals.homePurchase.targetAmount),
          currentAmount: 0, // This would need to be calculated
          targetYear: this.safeNumber(enhancedFinancialGoals.homePurchase.targetYear) || new Date().getFullYear() + 5,
          priority: 'High'
        });
      }

      if (enhancedFinancialGoals.marriageOfDaughter?.isApplicable) {
        allGoals.push({
          name: 'Marriage of Daughter',
          targetAmount: this.safeNumber(enhancedFinancialGoals.marriageOfDaughter.targetAmount),
          currentAmount: 0, // This would need to be calculated
          targetYear: this.safeNumber(enhancedFinancialGoals.marriageOfDaughter.targetYear) || new Date().getFullYear() + 15,
          priority: 'Medium'
        });
      }

      const goalProgress = allGoals.map(goal => {
        const currentAmount = this.safeNumber(goal.currentAmount);
        const targetAmount = this.safeNumber(goal.targetAmount) || 1;
        return {
          ...goal,
          progressPercentage: Math.min((currentAmount / targetAmount) * 100, 100),
          remainingAmount: Math.max(targetAmount - currentAmount, 0)
        };
      });

      const avgGoalProgress = goalProgress.length > 0 
        ? goalProgress.reduce((sum, goal) => sum + goal.progressPercentage, 0) / goalProgress.length 
        : 0;

      // Risk assessment with safe data
      const riskScore = this.calculateRiskScore({ client: safeClient });
      const riskLevel = this.getRiskLevel(riskScore);

      // Prepare alerts and recommendations with safe data
      const alerts = this.generateAlerts({ client: safeClient });
      const recommendations = this.generateRecommendations({ client: safeClient });

      return {
        // Comprehensive Header data
        vault: this.prepareVaultHeaderData(vaultData),

        // Client data - ALL fields from Client.js model with safe defaults
        client: {
          // Personal Information - EXACT field names from Client.js
          firstName: this.safeString(safeClient.firstName),
          lastName: this.safeString(safeClient.lastName),
          name: `${this.safeString(safeClient.firstName)} ${this.safeString(safeClient.lastName)}`.trim() || 'Client Name',
          email: this.safeString(safeClient.email),
          phoneNumber: this.safeString(safeClient.phoneNumber),
          dateOfBirth: this.safeString(safeClient.dateOfBirth),
          age: this.calculateAge(safeClient.dateOfBirth),
          panNumber: this.safeString(safeClient.panNumber),
          maritalStatus: this.safeString(safeClient.maritalStatus),
          numberOfDependents: this.safeNumber(safeClient.numberOfDependents),
          dependents: this.safeNumber(safeClient.numberOfDependents), // Alias for template compatibility
          gender: this.safeString(safeClient.gender),
        
          // Address Information - EXACT field names from Client.js
          address: safeClient.address ? 
            `${this.safeString(safeClient.address.street)}, ${this.safeString(safeClient.address.city)}, ${this.safeString(safeClient.address.state)} ${this.safeString(safeClient.address.zipCode)}, ${this.safeString(safeClient.address.country) || 'India'}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') : '',
          addressDetails: safeClient.address || {},
        
          // Income & Employment - EXACT field names from Client.js
          occupation: this.safeString(safeClient.occupation),
          employerBusinessName: this.safeString(safeClient.employerBusinessName),
          totalMonthlyIncome: this.safeNumber(safeClient.totalMonthlyIncome),
          incomeType: this.safeString(safeClient.incomeType),
          totalMonthlyExpenses: this.safeNumber(safeClient.totalMonthlyExpenses),
          annualIncome: this.safeNumber(safeClient.annualIncome),
          additionalIncome: this.safeNumber(safeClient.additionalIncome),
        
          // Expense Breakdown - EXACT field names from Client.js
          expenseBreakdown: safeClient.expenseBreakdown || {},
          monthlyExpenses: safeClient.monthlyExpenses || {},
          expenseNotes: this.safeString(safeClient.expenseNotes),
          annualTaxes: this.safeNumber(safeClient.annualTaxes),
          annualVacationExpenses: this.safeNumber(safeClient.annualVacationExpenses),
        
          // Retirement Planning - EXACT field names from Client.js
          retirementPlanning: safeClient.retirementPlanning || {},
          
          // Major Goals - EXACT field names from Client.js
          majorGoals: this.safeArray(safeClient.majorGoals),
          
          // Assets - EXACT field names from Client.js
          assets: safeClient.assets || {},
          
          // Debts & Liabilities - EXACT field names from Client.js
          debtsAndLiabilities: safeClient.debtsAndLiabilities || {},
          liabilities: safeClient.liabilities || {},
          
          // Insurance Coverage - EXACT field names from Client.js
          insuranceCoverage: safeClient.insuranceCoverage || {},
          
          // Enhanced Financial Goals - EXACT field names from Client.js
          enhancedFinancialGoals: safeClient.enhancedFinancialGoals || {},
          
          // Enhanced Risk Profile - EXACT field names from Client.js
          enhancedRiskProfile: safeClient.enhancedRiskProfile || {},
          
          // Form Progress - EXACT field names from Client.js
          formProgress: safeClient.formProgress || {},
        
          // Draft Data - EXACT field names from Client.js
          draftData: safeClient.draftData || {},
          
          // Original Fields - EXACT field names from Client.js
          netWorth: this.safeNumber(safeClient.netWorth),
          monthlySavingsTarget: this.safeNumber(safeClient.monthlySavingsTarget),
          investmentExperience: this.safeString(safeClient.investmentExperience),
          riskTolerance: this.safeString(safeClient.riskTolerance),
          investmentGoals: this.safeArray(safeClient.investmentGoals),
          investmentHorizon: this.safeString(safeClient.investmentHorizon),
          
          // KYC Information - EXACT field names from Client.js
          aadharNumber: this.safeString(safeClient.aadharNumber),
          kycStatus: this.safeString(safeClient.kycStatus) || 'pending',
          kycDocuments: this.safeArray(safeClient.kycDocuments),
          
          // CAS Data - EXACT field names from Client.js
          casData: safeClient.casData || {},
          
          // Bank Details - EXACT field names from Client.js
          bankDetails: safeClient.bankDetails || {},
          
          // Advisor Relationship - EXACT field names from Client.js
          advisor: safeClient.advisor || null,
          
          // Status and Tracking - EXACT field names from Client.js
          status: this.safeString(safeClient.status) || 'invited',
          onboardingStep: this.safeNumber(safeClient.onboardingStep),
          lastActiveDate: safeClient.lastActiveDate || new Date(),
          
          // Communication Preferences - EXACT field names from Client.js
          communicationPreferences: safeClient.communicationPreferences || {},
          
          // Additional Notes - EXACT field names from Client.js
          notes: this.safeString(safeClient.notes),
          
          // Compliance - EXACT field names from Client.js
          fatcaStatus: this.safeString(safeClient.fatcaStatus) || 'pending',
          crsStatus: this.safeString(safeClient.crsStatus) || 'pending',
          
          // Timestamps - EXACT field names from Client.js
          createdAt: safeClient.createdAt || new Date(),
          updatedAt: safeClient.updatedAt || new Date(),
          
          // Virtual fields - calculated from other fields
          fullName: `${this.safeString(safeClient.firstName)} ${this.safeString(safeClient.lastName)}`.trim(),
          totalPortfolioValue: this.safeNumber(safeClient.casData?.parsedData?.summary?.total_value),
          hasCASData: safeClient.casData && safeClient.casData.casStatus !== 'not_uploaded',
          calculatedFinancials: safeClient.calculatedFinancials || {}
      },

      // Financial metrics - calculated from Client.js model data
      financialMetrics: {
        netWorth: netWorth,
        totalAssets: totalAssets,
        totalLiabilities: totalLiabilities,
        monthlyIncome: calculatedMonthlyIncome,
        monthlyExpenses: calculatedMonthlyExpenses,
        savingsRate: savingsRate,
        emergencyFund: client.enhancedFinancialGoals?.emergencyFund?.targetAmount || 0,
        emergencyFundCoverage: calculatedMonthlyExpenses > 0 ? (client.enhancedFinancialGoals?.emergencyFund?.targetAmount || 0) / calculatedMonthlyExpenses : 0,
        debtToIncomeRatio: calculatedMonthlyIncome > 0 ? totalLiabilities / (calculatedMonthlyIncome * 12) : 0,
        
        // Additional financial metrics from Client.js model
        annualIncome: annualIncome,
        additionalIncome: additionalIncome,
        totalMonthlyIncome: totalMonthlyIncome,
        totalMonthlyExpenses: totalMonthlyExpenses,
        annualTaxes: client.annualTaxes || 0,
        annualVacationExpenses: client.annualVacationExpenses || 0,
        
        // Asset breakdown from Client.js model
        cashBankSavings: assets.cashBankSavings || 0,
        realEstate: assets.realEstate || 0,
        equityInvestments: (assets.investments?.equity?.mutualFunds || 0) + (assets.investments?.equity?.directStocks || 0),
        fixedIncomeInvestments: (assets.investments?.fixedIncome?.ppf || 0) + (assets.investments?.fixedIncome?.epf || 0) + 
                               (assets.investments?.fixedIncome?.nps || 0) + (assets.investments?.fixedIncome?.fixedDeposits || 0) +
                               (assets.investments?.fixedIncome?.bondsDebentures || 0) + (assets.investments?.fixedIncome?.nsc || 0),
        otherInvestments: (assets.investments?.other?.ulip || 0) + (assets.investments?.other?.otherInvestments || 0),
        
        // Liability breakdown from Client.js model
        homeLoanOutstanding: debtsAndLiabilities.homeLoan?.outstandingAmount || 0,
        personalLoanOutstanding: debtsAndLiabilities.personalLoan?.outstandingAmount || 0,
        carLoanOutstanding: debtsAndLiabilities.carLoan?.outstandingAmount || 0,
        educationLoanOutstanding: debtsAndLiabilities.educationLoan?.outstandingAmount || 0,
        creditCardDebt: debtsAndLiabilities.creditCards?.totalOutstanding || 0,
        otherLoansOutstanding: debtsAndLiabilities.otherLoans?.outstandingAmount || 0,
        
        // Insurance coverage from Client.js model
        lifeInsuranceCover: client.insuranceCoverage?.lifeInsurance?.totalCoverAmount || 0,
        healthInsuranceCover: client.insuranceCoverage?.healthInsurance?.totalCoverAmount || 0,
        totalInsurancePremiums: (client.insuranceCoverage?.lifeInsurance?.annualPremium || 0) + 
                               (client.insuranceCoverage?.healthInsurance?.annualPremium || 0) +
                               (client.insuranceCoverage?.vehicleInsurance?.annualPremium || 0) +
                               (client.insuranceCoverage?.otherInsurance?.annualPremium || 0)
      },

      // Goals and progress - from Client.js model
      goals: {
        list: goalProgress,
        totalGoals: goalProgress.length,
        avgProgress: avgGoalProgress,
        completedGoals: goalProgress.filter(g => g.progressPercentage >= 100).length,
        onTrackGoals: goalProgress.filter(g => g.progressPercentage >= 75 && g.progressPercentage < 100).length,
        needsAttentionGoals: goalProgress.filter(g => g.progressPercentage < 75).length,
        
        // Enhanced goals from Client.js model
        majorGoals: client.majorGoals || [],
        enhancedFinancialGoals: client.enhancedFinancialGoals || {},
        customGoals: client.enhancedFinancialGoals?.customGoals || []
      },

      // Risk assessment - from Client.js model
      riskAssessment: {
        score: riskScore,
        level: riskLevel,
        description: this.getRiskDescription(riskLevel),
        recommendations: this.getRiskRecommendations(riskLevel),
        
        // Enhanced risk profile from Client.js model
        enhancedRiskProfile: client.enhancedRiskProfile || {},
        investmentExperience: client.enhancedRiskProfile?.investmentExperience || client.investmentExperience || '',
        riskTolerance: client.enhancedRiskProfile?.riskTolerance || client.riskTolerance || '',
        monthlyInvestmentCapacity: client.enhancedRiskProfile?.monthlyInvestmentCapacity || 0
      },

      // Charts
      charts: charts,

      // Alerts and recommendations
      alerts: alerts,
      recommendations: recommendations,

      // Additional data sections - ALL from Client.js model and related collections
      estateInformation: clientData.estateInformation || null,
      taxPlanning: clientData.taxPlanning || null,
      mutualFundRecommend: clientData.mutualFundRecommend || [],
      meetings: clientData.meetings || [],
      chatHistory: clientData.chatHistory || [],
      clientInvitations: clientData.clientInvitations || [],
      abTestSessions: clientData.abTestSessions || [],
      financialPlans: clientData.financialPlans || [],
      loeDocuments: clientData.loeDocuments || [],
      loeAutomation: clientData.loeAutomation || [],
      mutualFundExitStrategies: clientData.mutualFundExitStrategies || [],

      // Comprehensive FinancialPlan Data - EXACT variable names from FinancialPlan.js model
      financialPlan: this.prepareFinancialPlanData(clientData.financialPlans || []),
      
      // Comprehensive LOE Data - EXACT variable names from LOE.js and LOEAutomation.js models
      loe: this.prepareLOEData(clientData.loeDocuments || []),
      loeAutomation: this.prepareLOEAutomationData(clientData.loeAutomation || []),
      
      // Complete Client.js model data for comprehensive access
      completeClientData: client,

      // Debug information
      debugInfo: {
        abTestSessionsExists: !!clientData.abTestSessions,
        abTestSessionsLength: clientData.abTestSessions ? clientData.abTestSessions.length : 0,
        abTestSessionsType: typeof clientData.abTestSessions,
        allDataKeys: Object.keys(clientData || {})
      },

        // Report metadata
        reportMetadata: {
          generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          reportPeriod: this.getReportPeriod(),
          reportVersion: '1.0',
          confidentiality: 'CONFIDENTIAL - For authorized use only'
        }
      };
    } catch (error) {
      logger.error('❌ [PDF GENERATION] Error preparing template data', {
        error: error.message,
        stack: error.stack
      });
      
      // Return minimal template data as fallback
      return {
        vault: this.prepareVaultHeaderData(vaultData),
        client: this.getDefaultClientData(),
        financialMetrics: {
          netWorth: 0,
          totalAssets: 0,
          totalLiabilities: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          savingsRate: 0
        },
        goals: { list: [], totalGoals: 0, avgProgress: 0 },
        riskAssessment: { score: 5, level: 'Moderate', description: 'Risk assessment pending' },
        charts: {},
        alerts: [],
        recommendations: [],
        reportMetadata: {
          generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          reportPeriod: this.getReportPeriod(),
          reportVersion: '1.0',
          confidentiality: 'CONFIDENTIAL - For authorized use only'
        }
      };
    }
  }

  /**
   * Render HTML template with data
   * @param {Object} templateData - Prepared template data
   * @returns {String} - Rendered HTML
   */
  async renderTemplate(templateData) {
    try {
      // Register Handlebars helpers
      this.registerHandlebarsHelpers();
      
      // Read main template
      const templatePath = path.join(this.templatePath, 'client-report-template.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf8');
      
      logger.info('📄 [PDF GENERATION] Template loaded', {
        templateSize: templateContent.length,
        templatePath
      });
      
      // Compile template
      const template = handlebars.compile(templateContent);
      
      // Render with data
      const html = template(templateData);
      
      logger.info('✅ [PDF GENERATION] Template rendered successfully', {
        htmlLength: html.length,
        hasClientData: !!templateData.client,
        hasVaultData: !!templateData.vault
      });
      return html;

    } catch (error) {
      logger.error('❌ [PDF GENERATION] Error rendering template', {
        error: error.message,
        stack: error.stack,
        templateDataKeys: Object.keys(templateData || {}),
        clientDataKeys: Object.keys(templateData?.client || {}),
        vaultDataKeys: Object.keys(templateData?.vault || {})
      });
      throw error;
    }
  }

  /**
   * Register Handlebars helpers
   */
  registerHandlebarsHelpers() {
    // Substring helper
    handlebars.registerHelper('substring', function(str, start, end) {
      if (!str) return '';
      return str.substring(start, end);
    });

    // Format currency helper
    handlebars.registerHelper('formatCurrency', function(amount) {
      if (!amount) return '₹0';
      return '₹' + new Intl.NumberFormat('en-IN').format(amount);
    });

    // Format date helper
    handlebars.registerHelper('formatDate', function(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-IN');
    });

    // Conditional helper
    handlebars.registerHelper('if_eq', function(a, b, options) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Math operations helpers
    handlebars.registerHelper('subtract', function(a, b) {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return numA - numB;
    });

    handlebars.registerHelper('add', function(a, b) {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return numA + numB;
    });

    handlebars.registerHelper('multiply', function(a, b) {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return numA * numB;
    });

    handlebars.registerHelper('divide', function(a, b) {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 1;
      return b !== 0 ? numA / numB : 0;
    });

    // Safe math helper for complex expressions
    handlebars.registerHelper('safeMath', function(expression) {
      try {
        // Replace template variables with safe numbers
        const safeExpression = expression.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
          const value = this[varName.trim()];
          return parseFloat(value) || 0;
        });
        return eval(safeExpression) || 0;
      } catch (error) {
        return 0;
      }
    });

    // Safe property access helper
    handlebars.registerHelper('safe', function(obj, path) {
      if (!obj || !path) return '';
      const keys = path.split('.');
      let result = obj;
      for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
          result = result[key];
        } else {
          return '';
        }
      }
      return result || '';
    });
  }

  /**
   * Convert HTML to PDF using Puppeteer
   * @param {String} htmlContent - HTML content
   * @returns {Buffer} - PDF buffer
   */
  async htmlToPdf(htmlContent) {
    let browser;
    
    try {
      logger.info('🔄 [PDF GENERATION] Converting HTML to PDF');

      // Launch browser with enhanced configuration for stability
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--memory-pressure-off',
          '--max_old_space_size=4096',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        timeout: 120000, // 2 minutes timeout for browser launch
        protocolTimeout: 120000 // 2 minutes protocol timeout
      });

      const page = await browser.newPage();
      
      // Set page timeout and memory management
      page.setDefaultTimeout(120000); // 2 minutes
      page.setDefaultNavigationTimeout(120000); // 2 minutes
      
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 });
      
      // Enable JavaScript but disable unnecessary features
      await page.setJavaScriptEnabled(true);
      
      // Set extra HTTP headers for better compatibility
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
      });
      
      // Block external resources to prevent timeout issues
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        const url = request.url();
        
        // Block external images, fonts, and other resources that might cause timeouts
        if (resourceType === 'image' && !url.startsWith('data:')) {
          request.abort();
        } else if (resourceType === 'font' && !url.startsWith('data:')) {
          request.abort();
        } else if (resourceType === 'stylesheet' && !url.startsWith('data:')) {
          request.abort();
        } else if (url.includes('googleapis.com') || url.includes('fonts.gstatic.com')) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      // Set content with enhanced timeout and wait condition
      await page.setContent(htmlContent, { 
        waitUntil: 'domcontentloaded', // Changed from 'networkidle0' to avoid waiting for external resources
        timeout: 60000 // 1 minute timeout
      });
      
      // Wait for any remaining content to load with memory management
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Generate PDF with enhanced configuration
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 10px; color: #6B7280; text-align: center; width: 100%;">
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
            <span style="margin-left: 20px;">Generated on ${new Date().toLocaleDateString('en-IN')}</span>
          </div>
        `,
        timeout: 120000, // 2 minutes timeout for PDF generation
        preferCSSPageSize: true,
        omitBackground: false
      });

      logger.info('✅ [PDF GENERATION] PDF generated successfully', {
        size: `${Math.round(pdfBuffer.length / 1024)}KB`
      });

      return pdfBuffer;

    } catch (error) {
      logger.error('❌ [PDF GENERATION] Error converting HTML to PDF', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      if (browser) {
        try {
          // Close all pages first
          const pages = await browser.pages();
          await Promise.all(pages.map(page => page.close().catch(() => {})));
          
          // Close browser
          await browser.close();
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        } catch (cleanupError) {
          logger.warn('⚠️ [PDF GENERATION] Error during cleanup', {
            error: cleanupError.message
          });
        }
      }
    }
  }

  /**
   * Calculate risk score based on client data
   * @param {Object} clientData - Client data
   * @returns {Number} - Risk score (1-10)
   */
  calculateRiskScore(clientData) {
    const client = clientData.client || {};
    
    // Extract data from Client.js model structure
    const totalMonthlyIncome = client.totalMonthlyIncome || 0;
    const annualIncome = client.annualIncome || 0;
    const additionalIncome = client.additionalIncome || 0;
    const monthlyIncome = totalMonthlyIncome || (annualIncome / 12) + (additionalIncome / 12);
    
    const totalMonthlyExpenses = client.totalMonthlyExpenses || 0;
    const monthlyExpenses = client.monthlyExpenses || {};
    const calculatedMonthlyExpenses = totalMonthlyExpenses || 
      (monthlyExpenses.housingRent || 0) +
      (monthlyExpenses.groceriesUtilitiesFood || 0) +
      (monthlyExpenses.transportation || 0) +
      (monthlyExpenses.education || 0) +
      (monthlyExpenses.healthcare || 0) +
      (monthlyExpenses.entertainment || 0) +
      (monthlyExpenses.insurancePremiums || 0) +
      (monthlyExpenses.loanEmis || 0) +
      (monthlyExpenses.otherExpenses || 0);

    // Calculate liabilities from Client.js model
    const liabilities = client.liabilities || {};
    const debtsAndLiabilities = client.debtsAndLiabilities || {};
    const totalLiabilities = 
      (liabilities.loans || 0) +
      (liabilities.creditCardDebt || 0) +
      (debtsAndLiabilities.homeLoan?.outstandingAmount || 0) +
      (debtsAndLiabilities.personalLoan?.outstandingAmount || 0) +
      (debtsAndLiabilities.carLoan?.outstandingAmount || 0) +
      (debtsAndLiabilities.educationLoan?.outstandingAmount || 0) +
      (debtsAndLiabilities.goldLoan?.outstandingAmount || 0) +
      (debtsAndLiabilities.businessLoan?.outstandingAmount || 0) +
      (debtsAndLiabilities.creditCards?.totalOutstanding || 0) +
      (debtsAndLiabilities.otherLoans?.outstandingAmount || 0);

    let riskScore = 5; // Base score

    // Age factor
    const age = this.calculateAge(client.dateOfBirth);
    if (age < 30) riskScore += 2;
    else if (age > 50) riskScore -= 1;

    // Income stability
    if (client.incomeType === 'Salaried') riskScore -= 1;
    else if (client.incomeType === 'Business') riskScore += 1;

    // Debt to income ratio
    const debtToIncomeRatio = monthlyIncome > 0 ? totalLiabilities / (monthlyIncome * 12) : 0;
    
    if (debtToIncomeRatio > 0.4) riskScore += 2;
    else if (debtToIncomeRatio < 0.2) riskScore -= 1;

    // Emergency fund
    const emergencyFund = client.enhancedFinancialGoals?.emergencyFund?.targetAmount || 0;
    const emergencyCoverage = calculatedMonthlyExpenses > 0 ? emergencyFund / calculatedMonthlyExpenses : 0;
    
    if (emergencyCoverage < 3) riskScore += 1;
    else if (emergencyCoverage > 6) riskScore -= 1;

    // Investment diversification from Client.js model
    const assets = client.assets || {};
    const equityInvestments = (assets.investments?.equity?.mutualFunds || 0) + (assets.investments?.equity?.directStocks || 0);
    const fixedIncomeInvestments = (assets.investments?.fixedIncome?.ppf || 0) + (assets.investments?.fixedIncome?.epf || 0) + 
                                  (assets.investments?.fixedIncome?.nps || 0) + (assets.investments?.fixedIncome?.fixedDeposits || 0) +
                                  (assets.investments?.fixedIncome?.bondsDebentures || 0) + (assets.investments?.fixedIncome?.nsc || 0);
    
    if (equityInvestments > 0 && fixedIncomeInvestments > 0) riskScore -= 1; // Diversified
    else if (equityInvestments > 0 && fixedIncomeInvestments === 0) riskScore += 1; // Only equity
    else if (equityInvestments === 0 && fixedIncomeInvestments > 0) riskScore -= 2; // Conservative

    // Investment experience from Client.js model
    const investmentExperience = client.enhancedRiskProfile?.investmentExperience || client.investmentExperience || '';
    if (investmentExperience.includes('Expert') || investmentExperience.includes('Advanced')) riskScore -= 1;
    else if (investmentExperience.includes('Beginner')) riskScore += 1;

    return Math.max(1, Math.min(10, riskScore));
  }

  /**
   * Get risk level based on score
   * @param {Number} score - Risk score
   * @returns {String} - Risk level
   */
  getRiskLevel(score) {
    if (score <= 3) return 'Conservative';
    if (score <= 6) return 'Moderate';
    if (score <= 8) return 'Aggressive';
    return 'Very Aggressive';
  }

  /**
   * Get risk description
   * @param {String} level - Risk level
   * @returns {String} - Description
   */
  getRiskDescription(level) {
    const descriptions = {
      'Conservative': 'Prefers stable, low-risk investments with guaranteed returns',
      'Moderate': 'Balances growth and stability with diversified portfolio',
      'Aggressive': 'Seeks higher returns with increased market exposure',
      'Very Aggressive': 'Maximizes growth potential with high-risk investments'
    };
    return descriptions[level] || 'Risk profile assessment pending';
  }

  /**
   * Get risk-based recommendations
   * @param {String} level - Risk level
   * @returns {Array} - Recommendations
   */
  getRiskRecommendations(level) {
    const recommendations = {
      'Conservative': [
        'Focus on fixed deposits and government securities',
        'Consider debt mutual funds for stability',
        'Maintain high emergency fund coverage'
      ],
      'Moderate': [
        'Balanced portfolio with 60% equity, 40% debt',
        'Regular SIPs in diversified mutual funds',
        'Consider hybrid funds for stability'
      ],
      'Aggressive': [
        'Higher equity allocation (70-80%)',
        'Focus on growth-oriented mutual funds',
        'Consider sector-specific funds'
      ],
      'Very Aggressive': [
        'Maximum equity exposure (80-90%)',
        'Consider small-cap and mid-cap funds',
        'Regular portfolio rebalancing required'
      ]
    };
    return recommendations[level] || [];
  }

  /**
   * Generate alerts based on client data
   * @param {Object} clientData - Client data
   * @returns {Array} - Alerts
   */
  generateAlerts(clientData) {
    const alerts = [];
    const client = clientData.client || {};
    
    // Extract data from Client.js model structure
    const totalMonthlyIncome = client.totalMonthlyIncome || 0;
    const annualIncome = client.annualIncome || 0;
    const additionalIncome = client.additionalIncome || 0;
    const monthlyIncome = totalMonthlyIncome || (annualIncome / 12) + (additionalIncome / 12);
    
    const totalMonthlyExpenses = client.totalMonthlyExpenses || 0;
    const monthlyExpenses = client.monthlyExpenses || {};
    const calculatedMonthlyExpenses = totalMonthlyExpenses || 
      (monthlyExpenses.housingRent || 0) +
      (monthlyExpenses.groceriesUtilitiesFood || 0) +
      (monthlyExpenses.transportation || 0) +
      (monthlyExpenses.education || 0) +
      (monthlyExpenses.healthcare || 0) +
      (monthlyExpenses.entertainment || 0) +
      (monthlyExpenses.insurancePremiums || 0) +
      (monthlyExpenses.loanEmis || 0) +
      (monthlyExpenses.otherExpenses || 0);

    // Calculate liabilities from Client.js model
    const liabilities = client.liabilities || {};
    const debtsAndLiabilities = client.debtsAndLiabilities || {};
    const totalLiabilities = 
      (liabilities.loans || 0) +
      (liabilities.creditCardDebt || 0) +
      (debtsAndLiabilities.homeLoan?.outstandingAmount || 0) +
      (debtsAndLiabilities.personalLoan?.outstandingAmount || 0) +
      (debtsAndLiabilities.carLoan?.outstandingAmount || 0) +
      (debtsAndLiabilities.educationLoan?.outstandingAmount || 0) +
      (debtsAndLiabilities.goldLoan?.outstandingAmount || 0) +
      (debtsAndLiabilities.businessLoan?.outstandingAmount || 0) +
      (debtsAndLiabilities.creditCards?.totalOutstanding || 0) +
      (debtsAndLiabilities.otherLoans?.outstandingAmount || 0);

    // Emergency fund check from Client.js model
    const emergencyFund = client.enhancedFinancialGoals?.emergencyFund?.targetAmount || 0;
    if (emergencyFund < calculatedMonthlyExpenses * 3) {
      alerts.push({
        type: 'warning',
        title: 'Insufficient Emergency Fund',
        message: `Emergency fund target is ₹${emergencyFund.toLocaleString('en-IN')}, covering only ${Math.round(emergencyFund / calculatedMonthlyExpenses)} months of expenses. Recommended: 6 months (₹${(calculatedMonthlyExpenses * 6).toLocaleString('en-IN')}).`,
        priority: 'high'
      });
    }

    // Debt to income ratio
    const debtToIncomeRatio = monthlyIncome > 0 ? totalLiabilities / (monthlyIncome * 12) : 0;
    if (debtToIncomeRatio > 0.4) {
      alerts.push({
        type: 'danger',
        title: 'High Debt Burden',
        message: `Debt-to-income ratio is ${Math.round(debtToIncomeRatio * 100)}%. Total debt: ₹${totalLiabilities.toLocaleString('en-IN')}. Consider debt consolidation.`,
        priority: 'urgent'
      });
    }

    // Investment diversification from Client.js model
    const assets = client.assets || {};
    const equityInvestments = (assets.investments?.equity?.mutualFunds || 0) + (assets.investments?.equity?.directStocks || 0);
    const fixedIncomeInvestments = (assets.investments?.fixedIncome?.ppf || 0) + (assets.investments?.fixedIncome?.epf || 0) + 
                                  (assets.investments?.fixedIncome?.nps || 0) + (assets.investments?.fixedIncome?.fixedDeposits || 0) +
                                  (assets.investments?.fixedIncome?.bondsDebentures || 0) + (assets.investments?.fixedIncome?.nsc || 0);
    const otherInvestments = (assets.investments?.other?.ulip || 0) + (assets.investments?.other?.otherInvestments || 0);
    
    const totalInvestments = equityInvestments + fixedIncomeInvestments + otherInvestments;
    if (totalInvestments > 0) {
      const equityPercentage = (equityInvestments / totalInvestments) * 100;
      const fixedIncomePercentage = (fixedIncomeInvestments / totalInvestments) * 100;
      
      if (equityPercentage > 80) {
        alerts.push({
          type: 'warning',
          title: 'High Equity Allocation',
          message: `Equity allocation is ${Math.round(equityPercentage)}%. Consider diversifying with fixed income instruments.`,
          priority: 'medium'
        });
      } else if (fixedIncomePercentage > 90) {
      alerts.push({
        type: 'info',
          title: 'Conservative Investment Approach',
          message: `Fixed income allocation is ${Math.round(fixedIncomePercentage)}%. Consider adding some equity for better returns.`,
          priority: 'low'
        });
      }
    } else {
      alerts.push({
        type: 'info',
        title: 'No Investment Portfolio',
        message: 'No investments found. Consider starting with SIPs in mutual funds for long-term wealth creation.',
        priority: 'medium'
      });
    }

    // Insurance coverage check from Client.js model
    const lifeInsuranceCover = client.insuranceCoverage?.lifeInsurance?.totalCoverAmount || 0;
    const recommendedLifeCover = monthlyIncome * 12 * 10; // 10x annual income
    if (lifeInsuranceCover < recommendedLifeCover) {
      alerts.push({
        type: 'warning',
        title: 'Insufficient Life Insurance Coverage',
        message: `Current coverage: ₹${lifeInsuranceCover.toLocaleString('en-IN')}. Recommended: ₹${recommendedLifeCover.toLocaleString('en-IN')} (10x annual income).`,
        priority: 'high'
      });
    }

    // KYC status check from Client.js model
    if (client.kycStatus === 'pending' || client.kycStatus === 'in_progress') {
      alerts.push({
        type: 'warning',
        title: 'KYC Incomplete',
        message: `KYC status: ${client.kycStatus}. Please complete KYC documentation for seamless investment experience.`,
        priority: 'medium'
      });
    }

    return alerts;
  }

  /**
   * Generate recommendations based on client data
   * @param {Object} clientData - Client data
   * @returns {Array} - Recommendations
   */
  generateRecommendations(clientData) {
    const recommendations = [];
    const client = clientData.client || {};
    
    // Extract data from Client.js model structure
    const totalMonthlyIncome = client.totalMonthlyIncome || 0;
    const annualIncome = client.annualIncome || 0;
    const additionalIncome = client.additionalIncome || 0;
    const monthlyIncome = totalMonthlyIncome || (annualIncome / 12) + (additionalIncome / 12);

    // Goal-based recommendations from Client.js model
    const majorGoals = client.majorGoals || [];
    const enhancedFinancialGoals = client.enhancedFinancialGoals || {};
    const customGoals = enhancedFinancialGoals.customGoals || [];
    
    const allGoals = [
      ...majorGoals,
      ...customGoals,
      ...(enhancedFinancialGoals.emergencyFund?.targetAmount > 0 ? [{
        goalName: 'Emergency Fund',
        targetAmount: enhancedFinancialGoals.emergencyFund.targetAmount,
        priority: enhancedFinancialGoals.emergencyFund.priority || 'High'
      }] : []),
      ...(enhancedFinancialGoals.childEducation?.isApplicable ? [{
        goalName: 'Child Education',
        targetAmount: enhancedFinancialGoals.childEducation.targetAmount,
        priority: 'High'
      }] : []),
      ...(enhancedFinancialGoals.homePurchase?.isApplicable ? [{
        goalName: 'Home Purchase',
        targetAmount: enhancedFinancialGoals.homePurchase.targetAmount,
        priority: 'High'
      }] : []),
      ...(enhancedFinancialGoals.marriageOfDaughter?.isApplicable ? [{
        goalName: 'Marriage of Daughter',
        targetAmount: enhancedFinancialGoals.marriageOfDaughter.targetAmount,
        priority: 'Medium'
      }] : [])
    ];

    if (allGoals.length > 0) {
      recommendations.push({
        category: 'Goal Achievement',
        title: 'Focus on Financial Goals',
        description: `You have ${allGoals.length} financial goals with total target of ₹${allGoals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0).toLocaleString('en-IN')}. Consider starting SIPs to achieve these goals.`,
        priority: 'high',
        timeline: 'Next 3 months'
      });
    }

    // Tax planning recommendations
    if (clientData.taxPlanning) {
      recommendations.push({
        category: 'Tax Optimization',
        title: 'Maximize Tax Savings',
        description: 'Utilize available deductions and tax-saving investments like ELSS, PPF, and NPS.',
        priority: 'medium',
        timeline: 'Before March 31'
      });
    } else if (monthlyIncome > 0) {
      recommendations.push({
        category: 'Tax Optimization',
        title: 'Start Tax Planning',
        description: `With annual income of ₹${(monthlyIncome * 12).toLocaleString('en-IN')}, consider tax-saving investments to reduce tax liability.`,
        priority: 'medium',
        timeline: 'Before March 31'
      });
    }

    // Insurance recommendations from Client.js model
    const lifeInsuranceCover = client.insuranceCoverage?.lifeInsurance?.totalCoverAmount || 0;
    const healthInsuranceCover = client.insuranceCoverage?.healthInsurance?.totalCoverAmount || 0;
    const recommendedLifeCover = monthlyIncome * 12 * 10; // 10x annual income
    
    if (lifeInsuranceCover < recommendedLifeCover) {
      recommendations.push({
        category: 'Risk Management',
        title: 'Adequate Life Insurance',
        description: `Current coverage: ₹${lifeInsuranceCover.toLocaleString('en-IN')}. Recommended: ₹${recommendedLifeCover.toLocaleString('en-IN')} (10x annual income).`,
        priority: 'high',
        timeline: 'Next 6 months'
      });
    }

    if (healthInsuranceCover === 0) {
      recommendations.push({
        category: 'Risk Management',
        title: 'Health Insurance Coverage',
        description: 'Consider getting health insurance to protect against medical emergencies.',
        priority: 'high',
        timeline: 'Next 3 months'
      });
    }

    // Investment recommendations from Client.js model
    const assets = client.assets || {};
    const equityInvestments = (assets.investments?.equity?.mutualFunds || 0) + (assets.investments?.equity?.directStocks || 0);
    const fixedIncomeInvestments = (assets.investments?.fixedIncome?.ppf || 0) + (assets.investments?.fixedIncome?.epf || 0) + 
                                  (assets.investments?.fixedIncome?.nps || 0) + (assets.investments?.fixedIncome?.fixedDeposits || 0) +
                                  (assets.investments?.fixedIncome?.bondsDebentures || 0) + (assets.investments?.fixedIncome?.nsc || 0);
    const totalInvestments = equityInvestments + fixedIncomeInvestments;
    
    if (totalInvestments === 0 && monthlyIncome > 0) {
      recommendations.push({
        category: 'Investment Planning',
        title: 'Start Systematic Investment',
        description: `Consider starting SIPs with ₹${Math.round(monthlyIncome * 0.2).toLocaleString('en-IN')} per month (20% of income) in diversified mutual funds.`,
        priority: 'high',
        timeline: 'Next month'
      });
    } else if (equityInvestments === 0 && fixedIncomeInvestments > 0) {
      recommendations.push({
        category: 'Investment Planning',
        title: 'Diversify with Equity',
        description: 'Consider adding equity mutual funds to your portfolio for better long-term returns.',
        priority: 'medium',
        timeline: 'Next 6 months'
      });
    }

    // Retirement planning recommendations from Client.js model
    const retirementPlanning = client.retirementPlanning || {};
    const currentAge = retirementPlanning.currentAge || this.calculateAge(client.dateOfBirth);
    const retirementAge = retirementPlanning.retirementAge || 60;
    const currentCorpus = retirementPlanning.currentRetirementCorpus || 0;
    const targetCorpus = retirementPlanning.targetRetirementCorpus || 0;
    
    if (currentAge > 0 && retirementAge > currentAge && targetCorpus > 0) {
      const yearsToRetirement = retirementAge - currentAge;
      const monthlySIPRequired = targetCorpus / (yearsToRetirement * 12);
      
      if (currentCorpus < targetCorpus * 0.1) { // Less than 10% of target
        recommendations.push({
          category: 'Retirement Planning',
          title: 'Accelerate Retirement Savings',
          description: `Target corpus: ₹${targetCorpus.toLocaleString('en-IN')}. Consider monthly SIP of ₹${Math.round(monthlySIPRequired).toLocaleString('en-IN')} to achieve this goal.`,
          priority: 'high',
          timeline: 'Next 3 months'
        });
      }
    }

    // KYC completion recommendation
    if (client.kycStatus === 'pending' || client.kycStatus === 'in_progress') {
      recommendations.push({
        category: 'Compliance',
        title: 'Complete KYC Documentation',
        description: 'Complete KYC documentation to enable seamless investment transactions.',
        priority: 'medium',
        timeline: 'Next 2 weeks'
      });
    }

    return recommendations;
  }

  /**
   * Calculate age from date of birth
   * @param {String} dateOfBirth - Date of birth
   * @returns {Number} - Age
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 0;
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
   * Get report period
   * @returns {String} - Report period
   */
  getReportPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    return `Financial Year ${year}-${year + 1}`;
  }

  /**
   * Prepare comprehensive vault header data for PDF
   * @param {Object} vaultData - Raw vault data from database
   * @returns {Object} - Formatted vault data for template
   */
  prepareVaultHeaderData(vaultData) {
    if (!vaultData) {
      return this.getDefaultVaultData();
    }

    const vault = vaultData.toObject ? vaultData.toObject() : vaultData;

    // Format certifications
    const formattedCertifications = (vault.certifications || []).map(cert => ({
      name: cert.name || '',
      issuingBody: cert.issuingBody || '',
      issueDate: cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-IN') : '',
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('en-IN') : 'N/A',
      certificateNumber: cert.certificateNumber || '',
      isActive: cert.isActive || false,
      isExpired: cert.expiryDate ? new Date(cert.expiryDate) < new Date() : false
    }));

    // Format memberships
    const formattedMemberships = (vault.memberships || []).map(membership => ({
      organization: membership.organization || '',
      membershipType: membership.membershipType || '',
      memberSince: membership.memberSince ? new Date(membership.memberSince).toLocaleDateString('en-IN') : '',
      membershipNumber: membership.membershipNumber || '',
      isActive: membership.isActive || false
    }));

    // Format documents
    const formattedDocuments = (vault.documents || []).map(doc => ({
      name: doc.name || '',
      description: doc.description || '',
      category: doc.category || 'other',
      fileUrl: doc.fileUrl || '',
      fileSize: this.formatFileSize(doc.fileSize || 0),
      uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : '',
      isActive: doc.isActive || false
    }));

    // Format branding
    const branding = vault.branding || {};
    const formattedBranding = {
      primaryColor: branding.primaryColor || '#2563eb',
      secondaryColor: branding.secondaryColor || '#64748b',
      accentColor: branding.accentColor || '#f59e0b',
      logo: {
        url: branding.logo?.url || '',
        altText: branding.logo?.altText || 'Advisor Logo'
      },
      typography: {
        primaryFont: branding.typography?.primaryFont || 'Inter',
        secondaryFont: branding.typography?.secondaryFont || 'Roboto',
        fontSize: branding.typography?.fontSize || 'medium'
      },
      tagline: branding.tagline || ''
    };

    // Format digital presence
    const digitalPresence = vault.digitalPresence || {};
    const formattedDigitalPresence = {
      website: digitalPresence.website || '',
      linkedin: digitalPresence.linkedin || '',
      twitter: digitalPresence.twitter || '',
      facebook: digitalPresence.facebook || '',
      instagram: digitalPresence.instagram || '',
      youtube: digitalPresence.youtube || ''
    };

    // Format white label
    const whiteLabel = vault.whiteLabel || {};
    const formattedWhiteLabel = {
      isEnabled: whiteLabel.isEnabled || false,
      companyName: whiteLabel.companyName || '',
      customDomain: whiteLabel.customDomain || '',
      apiKeys: (whiteLabel.apiKeys || []).map(apiKey => ({
        name: apiKey.name || '',
        key: apiKey.key ? this.maskApiKey(apiKey.key) : '',
        isActive: apiKey.isActive || false,
        createdAt: apiKey.createdAt ? new Date(apiKey.createdAt).toLocaleDateString('en-IN') : ''
      }))
    };

    // Format report customization
    const reportCustomization = vault.reportCustomization || {};
    const formattedReportCustomization = {
      headerStyle: reportCustomization.headerStyle || 'professional',
      footerStyle: reportCustomization.footerStyle || 'detailed',
      watermark: {
        isEnabled: reportCustomization.watermark?.isEnabled || false,
        text: reportCustomization.watermark?.text || '',
        opacity: reportCustomization.watermark?.opacity || 0.3
      },
      customFooter: reportCustomization.customFooter || ''
    };

    // Format scheduling
    const scheduling = vault.scheduling || {};
    const workingHours = scheduling.workingHours || {};
    const formattedScheduling = {
      workingHours: {
        monday: this.formatWorkingDay(workingHours.monday),
        tuesday: this.formatWorkingDay(workingHours.tuesday),
        wednesday: this.formatWorkingDay(workingHours.wednesday),
        thursday: this.formatWorkingDay(workingHours.thursday),
        friday: this.formatWorkingDay(workingHours.friday),
        saturday: this.formatWorkingDay(workingHours.saturday),
        sunday: this.formatWorkingDay(workingHours.sunday)
      },
      appointmentDuration: scheduling.appointmentDuration || 60,
      timezone: scheduling.timezone || 'Asia/Kolkata',
      bufferTime: {
        before: scheduling.bufferTime?.before || 15,
        after: scheduling.bufferTime?.after || 15
      }
    };

    return {
      // Basic advisor information
      advisorId: vault.advisorId || '',
      firstName: vault.firstName || 'Advisor',
      lastName: vault.lastName || 'Name',
      email: vault.email || 'advisor@example.com',
      phoneNumber: vault.phoneNumber || '',
      firmName: vault.firmName || 'Financial Advisory Firm',
      sebiRegNumber: vault.sebiRegNumber || 'SEBI Registration Pending',
      revenueModel: vault.revenueModel || '',
      fpsbNumber: vault.fpsbNumber || '',
      riaNumber: vault.riaNumber || '',
      arnNumber: vault.arnNumber || '',
      amfiRegNumber: vault.amfiRegNumber || '',
      isEmailVerified: vault.isEmailVerified || false,
      status: vault.status || 'active',

      // Professional information
      certifications: formattedCertifications,
      memberships: formattedMemberships,
      documents: formattedDocuments,

      // Branding and customization
      branding: formattedBranding,
      digitalPresence: formattedDigitalPresence,
      whiteLabel: formattedWhiteLabel,
      reportCustomization: formattedReportCustomization,
      scheduling: formattedScheduling,

      // Computed fields
      advisorName: `${vault.firstName || 'Advisor'} ${vault.lastName || 'Name'}`.trim(),
      activeCertifications: formattedCertifications.filter(cert => cert.isActive && !cert.isExpired),
      activeMemberships: formattedMemberships.filter(membership => membership.isActive),
      hasLogo: !!(branding.logo?.url),
      hasWebsite: !!(digitalPresence.website),
      hasSocialMedia: !!(digitalPresence.linkedin || digitalPresence.twitter || digitalPresence.facebook || digitalPresence.instagram || digitalPresence.youtube)
    };
  }

  /**
   * Get default vault data when no vault exists
   * @returns {Object} - Default vault data
   */
  getDefaultVaultData() {
    return {
      advisorId: '',
      firstName: 'Advisor',
      lastName: 'Name',
      email: 'advisor@example.com',
      phoneNumber: '',
      firmName: 'Financial Advisory Firm',
      sebiRegNumber: 'SEBI Registration Pending',
      revenueModel: '',
      fpsbNumber: '',
      riaNumber: '',
      arnNumber: '',
      amfiRegNumber: '',
      isEmailVerified: false,
      status: 'active',
      certifications: [],
      memberships: [],
      documents: [],
      branding: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        accentColor: '#f59e0b',
        logo: { url: '', altText: 'Advisor Logo' },
        typography: { primaryFont: 'Inter', secondaryFont: 'Roboto', fontSize: 'medium' },
        tagline: ''
      },
      digitalPresence: {
        website: '',
        linkedin: '',
        twitter: '',
        facebook: '',
        instagram: '',
        youtube: ''
      },
      whiteLabel: {
        isEnabled: false,
        companyName: '',
        customDomain: '',
        apiKeys: []
      },
      reportCustomization: {
        headerStyle: 'professional',
        footerStyle: 'detailed',
        watermark: { isEnabled: false, text: '', opacity: 0.3 },
        customFooter: ''
      },
      scheduling: {
        workingHours: {
          monday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          thursday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          friday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
          saturday: { isWorking: false, startTime: '09:00', endTime: '13:00' },
          sunday: { isWorking: false, startTime: '09:00', endTime: '13:00' }
        },
        appointmentDuration: 60,
        timezone: 'Asia/Kolkata',
        bufferTime: { before: 15, after: 15 }
      },
      advisorName: 'Advisor Name',
      activeCertifications: [],
      activeMemberships: [],
      hasLogo: false,
      hasWebsite: false,
      hasSocialMedia: false
    };
  }

  /**
   * Format working day data
   * @param {Object} dayData - Working day data
   * @returns {Object} - Formatted working day
   */
  formatWorkingDay(dayData) {
    if (!dayData) {
      return { isWorking: false, startTime: '09:00', endTime: '17:00' };
    }
    return {
      isWorking: dayData.isWorking || false,
      startTime: dayData.startTime || '09:00',
      endTime: dayData.endTime || '17:00'
    };
  }

  /**
   * Format file size for display
   * @param {Number} bytes - File size in bytes
   * @returns {String} - Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Mask API key for security
   * @param {String} apiKey - API key
   * @returns {String} - Masked API key
   */
  maskApiKey(apiKey) {
    if (!apiKey || apiKey.length < 8) return '****';
    return apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4);
  }

  /**
   * Sanitize client data to ensure all fields exist with safe defaults
   * @param {Object} client - Client data
   * @returns {Object} - Sanitized client data
   */
  sanitizeClientData(client) {
    if (!client || typeof client !== 'object') {
      return this.getDefaultClientData();
    }

    return {
      // Personal Information
      firstName: this.safeString(client.firstName),
      lastName: this.safeString(client.lastName),
      email: this.safeString(client.email),
      phoneNumber: this.safeString(client.phoneNumber),
      dateOfBirth: this.safeString(client.dateOfBirth),
      panNumber: this.safeString(client.panNumber),
      maritalStatus: this.safeString(client.maritalStatus),
      numberOfDependents: this.safeNumber(client.numberOfDependents),
      gender: this.safeString(client.gender),
      
      // Address Information
      address: {
        street: this.safeString(client.address?.street),
        city: this.safeString(client.address?.city),
        state: this.safeString(client.address?.state),
        zipCode: this.safeString(client.address?.zipCode),
        country: this.safeString(client.address?.country) || 'India'
      },
      
      // Income & Employment
      occupation: this.safeString(client.occupation),
      employerBusinessName: this.safeString(client.employerBusinessName),
      totalMonthlyIncome: this.safeNumber(client.totalMonthlyIncome),
      incomeType: this.safeString(client.incomeType),
      totalMonthlyExpenses: this.safeNumber(client.totalMonthlyExpenses),
      annualIncome: this.safeNumber(client.annualIncome),
      additionalIncome: this.safeNumber(client.additionalIncome),
      
      // Expense Breakdown
      expenseBreakdown: {
        showBreakdown: this.safeBoolean(client.expenseBreakdown?.showBreakdown),
        housingRent: this.safeNumber(client.expenseBreakdown?.housingRent),
        foodGroceries: this.safeNumber(client.expenseBreakdown?.foodGroceries),
        transportation: this.safeNumber(client.expenseBreakdown?.transportation),
        utilities: this.safeNumber(client.expenseBreakdown?.utilities),
        entertainment: this.safeNumber(client.expenseBreakdown?.entertainment),
        healthcare: this.safeNumber(client.expenseBreakdown?.healthcare)
      },
      
      // Monthly Expenses
      monthlyExpenses: {
        housingRent: this.safeNumber(client.monthlyExpenses?.housingRent),
        groceriesUtilitiesFood: this.safeNumber(client.monthlyExpenses?.groceriesUtilitiesFood),
        transportation: this.safeNumber(client.monthlyExpenses?.transportation),
        education: this.safeNumber(client.monthlyExpenses?.education),
        healthcare: this.safeNumber(client.monthlyExpenses?.healthcare),
        entertainment: this.safeNumber(client.monthlyExpenses?.entertainment),
        insurancePremiums: this.safeNumber(client.monthlyExpenses?.insurancePremiums),
        loanEmis: this.safeNumber(client.monthlyExpenses?.loanEmis),
        otherExpenses: this.safeNumber(client.monthlyExpenses?.otherExpenses)
      },
      
      // Annual Expenses
      expenseNotes: this.safeString(client.expenseNotes),
      annualTaxes: this.safeNumber(client.annualTaxes),
      annualVacationExpenses: this.safeNumber(client.annualVacationExpenses),
      
      // Retirement Planning
      retirementPlanning: {
        currentAge: this.safeNumber(client.retirementPlanning?.currentAge),
        retirementAge: this.safeNumber(client.retirementPlanning?.retirementAge) || 60,
        hasRetirementCorpus: this.safeBoolean(client.retirementPlanning?.hasRetirementCorpus),
        currentRetirementCorpus: this.safeNumber(client.retirementPlanning?.currentRetirementCorpus),
        targetRetirementCorpus: this.safeNumber(client.retirementPlanning?.targetRetirementCorpus)
      },
      
      // Major Goals
      majorGoals: this.safeArray(client.majorGoals),
      
      // Assets
      assets: {
        cashBankSavings: this.safeNumber(client.assets?.cashBankSavings),
        realEstate: this.safeNumber(client.assets?.realEstate),
        investments: {
          equity: {
            mutualFunds: this.safeNumber(client.assets?.investments?.equity?.mutualFunds),
            directStocks: this.safeNumber(client.assets?.investments?.equity?.directStocks)
          },
          fixedIncome: {
            ppf: this.safeNumber(client.assets?.investments?.fixedIncome?.ppf),
            epf: this.safeNumber(client.assets?.investments?.fixedIncome?.epf),
            nps: this.safeNumber(client.assets?.investments?.fixedIncome?.nps),
            fixedDeposits: this.safeNumber(client.assets?.investments?.fixedIncome?.fixedDeposits),
            bondsDebentures: this.safeNumber(client.assets?.investments?.fixedIncome?.bondsDebentures),
            nsc: this.safeNumber(client.assets?.investments?.fixedIncome?.nsc)
          },
          other: {
            ulip: this.safeNumber(client.assets?.investments?.other?.ulip),
            otherInvestments: this.safeNumber(client.assets?.investments?.other?.otherInvestments)
          }
        }
      },
      
      // Debts & Liabilities
      debtsAndLiabilities: {
        homeLoan: {
          hasLoan: this.safeBoolean(client.debtsAndLiabilities?.homeLoan?.hasLoan),
          outstandingAmount: this.safeNumber(client.debtsAndLiabilities?.homeLoan?.outstandingAmount),
          monthlyEMI: this.safeNumber(client.debtsAndLiabilities?.homeLoan?.monthlyEMI),
          interestRate: this.safeNumber(client.debtsAndLiabilities?.homeLoan?.interestRate),
          remainingTenure: this.safeNumber(client.debtsAndLiabilities?.homeLoan?.remainingTenure)
        },
        personalLoan: {
          hasLoan: this.safeBoolean(client.debtsAndLiabilities?.personalLoan?.hasLoan),
          outstandingAmount: this.safeNumber(client.debtsAndLiabilities?.personalLoan?.outstandingAmount),
          monthlyEMI: this.safeNumber(client.debtsAndLiabilities?.personalLoan?.monthlyEMI),
          interestRate: this.safeNumber(client.debtsAndLiabilities?.personalLoan?.interestRate)
        },
        carLoan: {
          hasLoan: this.safeBoolean(client.debtsAndLiabilities?.carLoan?.hasLoan),
          outstandingAmount: this.safeNumber(client.debtsAndLiabilities?.carLoan?.outstandingAmount),
          monthlyEMI: this.safeNumber(client.debtsAndLiabilities?.carLoan?.monthlyEMI),
          interestRate: this.safeNumber(client.debtsAndLiabilities?.carLoan?.interestRate)
        },
        educationLoan: {
          hasLoan: this.safeBoolean(client.debtsAndLiabilities?.educationLoan?.hasLoan),
          outstandingAmount: this.safeNumber(client.debtsAndLiabilities?.educationLoan?.outstandingAmount),
          monthlyEMI: this.safeNumber(client.debtsAndLiabilities?.educationLoan?.monthlyEMI),
          interestRate: this.safeNumber(client.debtsAndLiabilities?.educationLoan?.interestRate)
        },
        goldLoan: {
          hasLoan: this.safeBoolean(client.debtsAndLiabilities?.goldLoan?.hasLoan),
          outstandingAmount: this.safeNumber(client.debtsAndLiabilities?.goldLoan?.outstandingAmount),
          monthlyEMI: this.safeNumber(client.debtsAndLiabilities?.goldLoan?.monthlyEMI),
          interestRate: this.safeNumber(client.debtsAndLiabilities?.goldLoan?.interestRate)
        },
        businessLoan: {
          hasLoan: this.safeBoolean(client.debtsAndLiabilities?.businessLoan?.hasLoan),
          outstandingAmount: this.safeNumber(client.debtsAndLiabilities?.businessLoan?.outstandingAmount),
          monthlyEMI: this.safeNumber(client.debtsAndLiabilities?.businessLoan?.monthlyEMI),
          interestRate: this.safeNumber(client.debtsAndLiabilities?.businessLoan?.interestRate)
        },
        creditCards: {
          hasDebt: this.safeBoolean(client.debtsAndLiabilities?.creditCards?.hasDebt),
          totalOutstanding: this.safeNumber(client.debtsAndLiabilities?.creditCards?.totalOutstanding),
          monthlyPayment: this.safeNumber(client.debtsAndLiabilities?.creditCards?.monthlyPayment),
          averageInterestRate: this.safeNumber(client.debtsAndLiabilities?.creditCards?.averageInterestRate)
        },
        otherLoans: {
          hasLoan: this.safeBoolean(client.debtsAndLiabilities?.otherLoans?.hasLoan),
          loanType: this.safeString(client.debtsAndLiabilities?.otherLoans?.loanType),
          outstandingAmount: this.safeNumber(client.debtsAndLiabilities?.otherLoans?.outstandingAmount),
          monthlyEMI: this.safeNumber(client.debtsAndLiabilities?.otherLoans?.monthlyEMI),
          interestRate: this.safeNumber(client.debtsAndLiabilities?.otherLoans?.interestRate)
        }
      },
      
      // Legacy Liabilities
      liabilities: {
        loans: this.safeNumber(client.liabilities?.loans),
        creditCardDebt: this.safeNumber(client.liabilities?.creditCardDebt)
      },
      
      // Insurance Coverage
      insuranceCoverage: {
        lifeInsurance: {
          hasInsurance: this.safeBoolean(client.insuranceCoverage?.lifeInsurance?.hasInsurance),
          totalCoverAmount: this.safeNumber(client.insuranceCoverage?.lifeInsurance?.totalCoverAmount),
          annualPremium: this.safeNumber(client.insuranceCoverage?.lifeInsurance?.annualPremium),
          insuranceType: this.safeString(client.insuranceCoverage?.lifeInsurance?.insuranceType)
        },
        healthInsurance: {
          hasInsurance: this.safeBoolean(client.insuranceCoverage?.healthInsurance?.hasInsurance),
          totalCoverAmount: this.safeNumber(client.insuranceCoverage?.healthInsurance?.totalCoverAmount),
          annualPremium: this.safeNumber(client.insuranceCoverage?.healthInsurance?.annualPremium),
          familyMembers: this.safeNumber(client.insuranceCoverage?.healthInsurance?.familyMembers) || 1
        },
        vehicleInsurance: {
          hasInsurance: this.safeBoolean(client.insuranceCoverage?.vehicleInsurance?.hasInsurance),
          annualPremium: this.safeNumber(client.insuranceCoverage?.vehicleInsurance?.annualPremium)
        },
        otherInsurance: {
          hasInsurance: this.safeBoolean(client.insuranceCoverage?.otherInsurance?.hasInsurance),
          insuranceTypes: this.safeString(client.insuranceCoverage?.otherInsurance?.insuranceTypes),
          annualPremium: this.safeNumber(client.insuranceCoverage?.otherInsurance?.annualPremium)
        }
      },
      
      // Enhanced Financial Goals
      enhancedFinancialGoals: {
        emergencyFund: {
          priority: this.safeString(client.enhancedFinancialGoals?.emergencyFund?.priority) || 'High',
          targetAmount: this.safeNumber(client.enhancedFinancialGoals?.emergencyFund?.targetAmount)
        },
        childEducation: {
          isApplicable: this.safeBoolean(client.enhancedFinancialGoals?.childEducation?.isApplicable),
          targetAmount: this.safeNumber(client.enhancedFinancialGoals?.childEducation?.targetAmount),
          targetYear: this.safeNumber(client.enhancedFinancialGoals?.childEducation?.targetYear)
        },
        homePurchase: {
          isApplicable: this.safeBoolean(client.enhancedFinancialGoals?.homePurchase?.isApplicable),
          targetAmount: this.safeNumber(client.enhancedFinancialGoals?.homePurchase?.targetAmount),
          targetYear: this.safeNumber(client.enhancedFinancialGoals?.homePurchase?.targetYear)
        },
        marriageOfDaughter: {
          isApplicable: this.safeBoolean(client.enhancedFinancialGoals?.marriageOfDaughter?.isApplicable),
          targetAmount: this.safeNumber(client.enhancedFinancialGoals?.marriageOfDaughter?.targetAmount),
          targetYear: this.safeNumber(client.enhancedFinancialGoals?.marriageOfDaughter?.targetYear),
          daughterCurrentAge: this.safeNumber(client.enhancedFinancialGoals?.marriageOfDaughter?.daughterCurrentAge)
        },
        customGoals: this.safeArray(client.enhancedFinancialGoals?.customGoals)
      },
      
      // Enhanced Risk Profile
      enhancedRiskProfile: {
        investmentExperience: this.safeString(client.enhancedRiskProfile?.investmentExperience),
        riskTolerance: this.safeString(client.enhancedRiskProfile?.riskTolerance),
        monthlyInvestmentCapacity: this.safeNumber(client.enhancedRiskProfile?.monthlyInvestmentCapacity)
      },
      
      // Form Progress
      formProgress: {
        step1Completed: this.safeBoolean(client.formProgress?.step1Completed),
        step2Completed: this.safeBoolean(client.formProgress?.step2Completed),
        step3Completed: this.safeBoolean(client.formProgress?.step3Completed),
        step4Completed: this.safeBoolean(client.formProgress?.step4Completed),
        step5Completed: this.safeBoolean(client.formProgress?.step5Completed),
        step6Completed: this.safeBoolean(client.formProgress?.step6Completed),
        step7Completed: this.safeBoolean(client.formProgress?.step7Completed),
        currentStep: this.safeNumber(client.formProgress?.currentStep) || 1,
        lastSavedAt: client.formProgress?.lastSavedAt || new Date()
      },
      
      // KYC Information
      aadharNumber: this.safeString(client.aadharNumber),
      kycStatus: this.safeString(client.kycStatus) || 'pending',
      kycDocuments: this.safeArray(client.kycDocuments),
      
      // Bank Details
      bankDetails: {
        accountNumber: this.safeString(client.bankDetails?.accountNumber),
        ifscCode: this.safeString(client.bankDetails?.ifscCode),
        bankName: this.safeString(client.bankDetails?.bankName),
        branchName: this.safeString(client.bankDetails?.branchName)
      },
      
      // Status and Tracking
      status: this.safeString(client.status) || 'invited',
      onboardingStep: this.safeNumber(client.onboardingStep) || 0,
      lastActiveDate: client.lastActiveDate || new Date(),
      
      // Communication Preferences
      communicationPreferences: {
        email: this.safeBoolean(client.communicationPreferences?.email),
        sms: this.safeBoolean(client.communicationPreferences?.sms),
        phone: this.safeBoolean(client.communicationPreferences?.phone),
        whatsapp: this.safeBoolean(client.communicationPreferences?.whatsapp)
      },
      
      // Compliance
      fatcaStatus: this.safeString(client.fatcaStatus) || 'pending',
      crsStatus: this.safeString(client.crsStatus) || 'pending',
      
      // Additional Data
      notes: this.safeString(client.notes),
      createdAt: client.createdAt || new Date(),
      updatedAt: client.updatedAt || new Date()
    };
  }

  /**
   * Get default client data when no client exists
   * @returns {Object} - Default client data
   */
  getDefaultClientData() {
    return {
      firstName: 'Client',
      lastName: 'Name',
      email: 'client@example.com',
      phoneNumber: '',
      dateOfBirth: '',
      panNumber: '',
      maritalStatus: 'Single',
      numberOfDependents: 0,
      gender: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      },
      occupation: '',
      employerBusinessName: '',
      totalMonthlyIncome: 0,
      incomeType: 'Salaried',
      totalMonthlyExpenses: 0,
      annualIncome: 0,
      additionalIncome: 0,
      expenseBreakdown: {
        showBreakdown: false,
        housingRent: 0,
        foodGroceries: 0,
        transportation: 0,
        utilities: 0,
        entertainment: 0,
        healthcare: 0
      },
      monthlyExpenses: {
        housingRent: 0,
        groceriesUtilitiesFood: 0,
        transportation: 0,
        education: 0,
        healthcare: 0,
        entertainment: 0,
        insurancePremiums: 0,
        loanEmis: 0,
        otherExpenses: 0
      },
      expenseNotes: '',
      annualTaxes: 0,
      annualVacationExpenses: 0,
      retirementPlanning: {
        currentAge: 0,
        retirementAge: 60,
        hasRetirementCorpus: false,
        currentRetirementCorpus: 0,
        targetRetirementCorpus: 0
      },
      majorGoals: [],
      assets: {
        cashBankSavings: 0,
        realEstate: 0,
        investments: {
          equity: {
            mutualFunds: 0,
            directStocks: 0
          },
          fixedIncome: {
            ppf: 0,
            epf: 0,
            nps: 0,
            fixedDeposits: 0,
            bondsDebentures: 0,
            nsc: 0
          },
          other: {
            ulip: 0,
            otherInvestments: 0
          }
        }
      },
      debtsAndLiabilities: {
        homeLoan: {
          hasLoan: false,
          outstandingAmount: 0,
          monthlyEMI: 0,
          interestRate: 0,
          remainingTenure: 0
        },
        personalLoan: {
          hasLoan: false,
          outstandingAmount: 0,
          monthlyEMI: 0,
          interestRate: 0
        },
        carLoan: {
          hasLoan: false,
          outstandingAmount: 0,
          monthlyEMI: 0,
          interestRate: 0
        },
        educationLoan: {
          hasLoan: false,
          outstandingAmount: 0,
          monthlyEMI: 0,
          interestRate: 0
        },
        goldLoan: {
          hasLoan: false,
          outstandingAmount: 0,
          monthlyEMI: 0,
          interestRate: 0
        },
        businessLoan: {
          hasLoan: false,
          outstandingAmount: 0,
          monthlyEMI: 0,
          interestRate: 0
        },
        creditCards: {
          hasDebt: false,
          totalOutstanding: 0,
          monthlyPayment: 0,
          averageInterestRate: 36
        },
        otherLoans: {
          hasLoan: false,
          loanType: '',
          outstandingAmount: 0,
          monthlyEMI: 0,
          interestRate: 0
        }
      },
      liabilities: {
        loans: 0,
        creditCardDebt: 0
      },
      insuranceCoverage: {
        lifeInsurance: {
          hasInsurance: false,
          totalCoverAmount: 0,
          annualPremium: 0,
          insuranceType: 'Term Life'
        },
        healthInsurance: {
          hasInsurance: false,
          totalCoverAmount: 0,
          annualPremium: 0,
          familyMembers: 1
        },
        vehicleInsurance: {
          hasInsurance: false,
          annualPremium: 0
        },
        otherInsurance: {
          hasInsurance: false,
          insuranceTypes: '',
          annualPremium: 0
        }
      },
      enhancedFinancialGoals: {
        emergencyFund: {
          priority: 'High',
          targetAmount: 0
        },
        childEducation: {
          isApplicable: false,
          targetAmount: 0,
          targetYear: 0
        },
        homePurchase: {
          isApplicable: false,
          targetAmount: 0,
          targetYear: 0
        },
        marriageOfDaughter: {
          isApplicable: false,
          targetAmount: 0,
          targetYear: 0,
          daughterCurrentAge: 0
        },
        customGoals: []
      },
      enhancedRiskProfile: {
        investmentExperience: '',
        riskTolerance: '',
        monthlyInvestmentCapacity: 0
      },
      formProgress: {
        step1Completed: false,
        step2Completed: false,
        step3Completed: false,
        step4Completed: false,
        step5Completed: false,
        step6Completed: false,
        step7Completed: false,
        currentStep: 1,
        lastSavedAt: new Date()
      },
      aadharNumber: '',
      kycStatus: 'pending',
      kycDocuments: [],
      bankDetails: {
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branchName: ''
      },
      status: 'invited',
      onboardingStep: 0,
      lastActiveDate: new Date(),
      communicationPreferences: {
        email: true,
        sms: true,
        phone: true,
        whatsapp: false
      },
      fatcaStatus: 'pending',
      crsStatus: 'pending',
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Safe string conversion with fallback
   * @param {*} value - Value to convert
   * @returns {String} - Safe string
   */
  safeString(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    return String(value);
  }

  /**
   * Safe number conversion with fallback
   * @param {*} value - Value to convert
   * @returns {Number} - Safe number
   */
  safeNumber(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Safe boolean conversion with fallback
   * @param {*} value - Value to convert
   * @returns {Boolean} - Safe boolean
   */
  safeBoolean(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    if (typeof value === 'number') return value !== 0;
    return false;
  }

  /**
   * Safe array conversion with fallback
   * @param {*} value - Value to convert
   * @returns {Array} - Safe array
   */
  safeArray(value) {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [];
  }

  /**
   * Prepare comprehensive FinancialPlan data for PDF template
   * @param {Array} financialPlans - Array of financial plan documents
   * @returns {Object} - Formatted financial plan data
   */
  prepareFinancialPlanData(financialPlans) {
    if (!financialPlans || financialPlans.length === 0) {
      return this.getDefaultFinancialPlanData();
    }

    // Get the latest financial plan (most recent)
    const latestPlan = financialPlans[0];
    
    if (!latestPlan) {
      return this.getDefaultFinancialPlanData();
    }

    // Convert to plain object if it's a Mongoose document
    const planData = latestPlan.toObject ? latestPlan.toObject() : latestPlan;

    return {
      // Core References - EXACT field names from FinancialPlan.js
      clientId: planData.clientId || null,
      advisorId: planData.advisorId || null,

      // Plan Metadata - EXACT field names from FinancialPlan.js
      planType: this.safeString(planData.planType) || 'cash_flow',
      status: this.safeString(planData.status) || 'draft',
      version: this.safeNumber(planData.version) || 1,

      // Client Data Snapshot - EXACT field names from FinancialPlan.js
      clientDataSnapshot: {
        personalInfo: {
          firstName: this.safeString(planData.clientDataSnapshot?.personalInfo?.firstName),
          lastName: this.safeString(planData.clientDataSnapshot?.personalInfo?.lastName),
          email: this.safeString(planData.clientDataSnapshot?.personalInfo?.email),
          phoneNumber: this.safeString(planData.clientDataSnapshot?.personalInfo?.phoneNumber),
          dateOfBirth: planData.clientDataSnapshot?.personalInfo?.dateOfBirth || null,
          panNumber: this.safeString(planData.clientDataSnapshot?.personalInfo?.panNumber),
          maritalStatus: this.safeString(planData.clientDataSnapshot?.personalInfo?.maritalStatus),
          numberOfDependents: this.safeNumber(planData.clientDataSnapshot?.personalInfo?.numberOfDependents)
        },
        financialInfo: {
          totalMonthlyIncome: this.safeNumber(planData.clientDataSnapshot?.financialInfo?.totalMonthlyIncome),
          totalMonthlyExpenses: this.safeNumber(planData.clientDataSnapshot?.financialInfo?.totalMonthlyExpenses),
          incomeType: this.safeString(planData.clientDataSnapshot?.financialInfo?.incomeType),
          expenseBreakdown: {
            housingRent: this.safeNumber(planData.clientDataSnapshot?.financialInfo?.expenseBreakdown?.housingRent),
            foodGroceries: this.safeNumber(planData.clientDataSnapshot?.financialInfo?.expenseBreakdown?.foodGroceries),
            transportation: this.safeNumber(planData.clientDataSnapshot?.financialInfo?.expenseBreakdown?.transportation),
            utilities: this.safeNumber(planData.clientDataSnapshot?.financialInfo?.expenseBreakdown?.utilities),
            entertainment: this.safeNumber(planData.clientDataSnapshot?.financialInfo?.expenseBreakdown?.entertainment),
            healthcare: this.safeNumber(planData.clientDataSnapshot?.financialInfo?.expenseBreakdown?.healthcare),
            otherExpenses: this.safeNumber(planData.clientDataSnapshot?.financialInfo?.expenseBreakdown?.otherExpenses)
          }
        },
        investments: {
          mutualFunds: {
            totalValue: this.safeNumber(planData.clientDataSnapshot?.investments?.mutualFunds?.totalValue),
            monthlyInvestment: this.safeNumber(planData.clientDataSnapshot?.investments?.mutualFunds?.monthlyInvestment)
          },
          directStocks: {
            totalValue: this.safeNumber(planData.clientDataSnapshot?.investments?.directStocks?.totalValue)
          },
          ppf: {
            currentBalance: this.safeNumber(planData.clientDataSnapshot?.investments?.ppf?.currentBalance),
            annualContribution: this.safeNumber(planData.clientDataSnapshot?.investments?.ppf?.annualContribution)
          },
          epf: {
            currentBalance: this.safeNumber(planData.clientDataSnapshot?.investments?.epf?.currentBalance)
          },
          nps: {
            currentBalance: this.safeNumber(planData.clientDataSnapshot?.investments?.nps?.currentBalance)
          },
          elss: {
            currentValue: this.safeNumber(planData.clientDataSnapshot?.investments?.elss?.currentValue)
          },
          fixedDeposits: {
            totalValue: this.safeNumber(planData.clientDataSnapshot?.investments?.fixedDeposits?.totalValue)
          },
          otherInvestments: {
            totalValue: this.safeNumber(planData.clientDataSnapshot?.investments?.otherInvestments?.totalValue)
          }
        },
        debtsAndLiabilities: {
          homeLoan: {
            outstandingAmount: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.homeLoan?.outstandingAmount),
            monthlyEMI: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.homeLoan?.monthlyEMI),
            interestRate: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.homeLoan?.interestRate),
            remainingTenure: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.homeLoan?.remainingTenure)
          },
          personalLoan: {
            outstandingAmount: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.personalLoan?.outstandingAmount),
            monthlyEMI: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.personalLoan?.monthlyEMI),
            interestRate: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.personalLoan?.interestRate)
          },
          carLoan: {
            outstandingAmount: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.carLoan?.outstandingAmount),
            monthlyEMI: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.carLoan?.monthlyEMI),
            interestRate: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.carLoan?.interestRate)
          },
          educationLoan: {
            outstandingAmount: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.educationLoan?.outstandingAmount),
            monthlyEMI: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.educationLoan?.monthlyEMI),
            interestRate: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.educationLoan?.interestRate)
          },
          creditCards: {
            totalOutstanding: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.creditCards?.totalOutstanding),
            averageInterestRate: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.creditCards?.averageInterestRate),
            monthlyPayment: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.creditCards?.monthlyPayment)
          },
          otherLoans: {
            outstandingAmount: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.otherLoans?.outstandingAmount),
            monthlyEMI: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.otherLoans?.monthlyEMI),
            interestRate: this.safeNumber(planData.clientDataSnapshot?.debtsAndLiabilities?.otherLoans?.interestRate)
          }
        },
        calculatedMetrics: {
          totalMonthlyEMIs: this.safeNumber(planData.clientDataSnapshot?.calculatedMetrics?.totalMonthlyEMIs),
          monthlySurplus: this.safeNumber(planData.clientDataSnapshot?.calculatedMetrics?.monthlySurplus),
          emiRatio: this.safeNumber(planData.clientDataSnapshot?.calculatedMetrics?.emiRatio),
          fixedExpenditureRatio: this.safeNumber(planData.clientDataSnapshot?.calculatedMetrics?.fixedExpenditureRatio),
          savingsRate: this.safeNumber(planData.clientDataSnapshot?.calculatedMetrics?.savingsRate),
          netWorth: this.safeNumber(planData.clientDataSnapshot?.calculatedMetrics?.netWorth),
          debtToIncomeRatio: this.safeNumber(planData.clientDataSnapshot?.calculatedMetrics?.debtToIncomeRatio)
        }
      },

      // Plan Details - Cash Flow Plan - EXACT field names from FinancialPlan.js
      planDetails: {
        cashFlowPlan: {
          debtManagement: {
            prioritizedDebts: this.safeArray(planData.planDetails?.cashFlowPlan?.debtManagement?.prioritizedDebts).map(debt => ({
              debtType: this.safeString(debt.debtType),
              outstandingAmount: this.safeNumber(debt.outstandingAmount),
              currentEMI: this.safeNumber(debt.currentEMI),
              recommendedEMI: this.safeNumber(debt.recommendedEMI),
              interestRate: this.safeNumber(debt.interestRate),
              priorityRank: this.safeNumber(debt.priorityRank),
              reason: this.safeString(debt.reason),
              projectedSavings: this.safeNumber(debt.projectedSavings),
              revisedTenure: this.safeNumber(debt.revisedTenure)
            })),
            totalDebtReduction: this.safeNumber(planData.planDetails?.cashFlowPlan?.debtManagement?.totalDebtReduction),
            totalInterestSavings: this.safeNumber(planData.planDetails?.cashFlowPlan?.debtManagement?.totalInterestSavings),
            debtFreeDate: planData.planDetails?.cashFlowPlan?.debtManagement?.debtFreeDate || null
          },
          emergencyFundStrategy: {
            targetAmount: this.safeNumber(planData.planDetails?.cashFlowPlan?.emergencyFundStrategy?.targetAmount),
            currentAmount: this.safeNumber(planData.planDetails?.cashFlowPlan?.emergencyFundStrategy?.currentAmount),
            gap: this.safeNumber(planData.planDetails?.cashFlowPlan?.emergencyFundStrategy?.gap),
            monthlyAllocation: this.safeNumber(planData.planDetails?.cashFlowPlan?.emergencyFundStrategy?.monthlyAllocation),
            timeline: this.safeNumber(planData.planDetails?.cashFlowPlan?.emergencyFundStrategy?.timeline),
            investmentType: this.safeString(planData.planDetails?.cashFlowPlan?.emergencyFundStrategy?.investmentType),
            fundRecommendations: this.safeArray(planData.planDetails?.cashFlowPlan?.emergencyFundStrategy?.fundRecommendations)
          },
          investmentRecommendations: {
            monthlyInvestments: this.safeArray(planData.planDetails?.cashFlowPlan?.investmentRecommendations?.monthlyInvestments).map(investment => ({
              fundName: this.safeString(investment.fundName),
              fundType: this.safeString(investment.fundType),
              category: this.safeString(investment.category),
              monthlyAmount: this.safeNumber(investment.monthlyAmount),
              purpose: this.safeString(investment.purpose),
              expectedReturn: this.safeNumber(investment.expectedReturn),
              riskLevel: this.safeString(investment.riskLevel)
            })),
            assetAllocation: {
              equity: this.safeNumber(planData.planDetails?.cashFlowPlan?.investmentRecommendations?.assetAllocation?.equity),
              debt: this.safeNumber(planData.planDetails?.cashFlowPlan?.investmentRecommendations?.assetAllocation?.debt),
              gold: this.safeNumber(planData.planDetails?.cashFlowPlan?.investmentRecommendations?.assetAllocation?.gold),
              others: this.safeNumber(planData.planDetails?.cashFlowPlan?.investmentRecommendations?.assetAllocation?.others)
            },
            totalMonthlyInvestment: this.safeNumber(planData.planDetails?.cashFlowPlan?.investmentRecommendations?.totalMonthlyInvestment),
            projectedCorpus: {
              year1: this.safeNumber(planData.planDetails?.cashFlowPlan?.investmentRecommendations?.projectedCorpus?.year1),
              year3: this.safeNumber(planData.planDetails?.cashFlowPlan?.investmentRecommendations?.projectedCorpus?.year3),
              year5: this.safeNumber(planData.planDetails?.cashFlowPlan?.investmentRecommendations?.projectedCorpus?.year5),
              year10: this.safeNumber(planData.planDetails?.cashFlowPlan?.investmentRecommendations?.projectedCorpus?.year10)
            }
          },
          cashFlowMetrics: {
            currentEmiRatio: this.safeNumber(planData.planDetails?.cashFlowPlan?.cashFlowMetrics?.currentEmiRatio),
            targetEmiRatio: this.safeNumber(planData.planDetails?.cashFlowPlan?.cashFlowMetrics?.targetEmiRatio),
            currentSavingsRate: this.safeNumber(planData.planDetails?.cashFlowPlan?.cashFlowMetrics?.currentSavingsRate),
            targetSavingsRate: this.safeNumber(planData.planDetails?.cashFlowPlan?.cashFlowMetrics?.targetSavingsRate),
            currentFixedExpenditureRatio: this.safeNumber(planData.planDetails?.cashFlowPlan?.cashFlowMetrics?.currentFixedExpenditureRatio),
            targetFixedExpenditureRatio: this.safeNumber(planData.planDetails?.cashFlowPlan?.cashFlowMetrics?.targetFixedExpenditureRatio),
            financialHealthScore: this.safeNumber(planData.planDetails?.cashFlowPlan?.cashFlowMetrics?.financialHealthScore)
          },
          actionItems: this.safeArray(planData.planDetails?.cashFlowPlan?.actionItems).map(action => ({
            action: this.safeString(action.action),
            priority: this.safeString(action.priority),
            timeline: this.safeString(action.timeline),
            status: this.safeString(action.status),
            completionDate: action.completionDate || null
          }))
        },
        goalBasedPlan: {
          selectedGoals: this.safeArray(planData.planDetails?.goalBasedPlan?.selectedGoals).map(goal => ({
            goalName: this.safeString(goal.goalName),
            targetAmount: this.safeNumber(goal.targetAmount),
            targetDate: goal.targetDate || null,
            priority: this.safeString(goal.priority),
            monthlyAllocation: this.safeNumber(goal.monthlyAllocation),
            investmentStrategy: this.safeString(goal.investmentStrategy)
          })),
          goalSpecificPlans: planData.planDetails?.goalBasedPlan?.goalSpecificPlans || {}
        },
        hybridPlan: {
          cashFlowComponent: planData.planDetails?.hybridPlan?.cashFlowComponent || {},
          goalBasedComponent: planData.planDetails?.hybridPlan?.goalBasedComponent || {}
        }
      },

      // Advisor Recommendations - EXACT field names from FinancialPlan.js
      advisorRecommendations: {
        keyPoints: this.safeArray(planData.advisorRecommendations?.keyPoints),
        detailedNotes: this.safeString(planData.advisorRecommendations?.detailedNotes),
        customVariables: this.safeArray(planData.advisorRecommendations?.customVariables).map(variable => ({
          variableName: this.safeString(variable.variableName),
          value: variable.value,
          description: this.safeString(variable.description)
        }))
      },

      // AI Recommendations - EXACT field names from FinancialPlan.js
      aiRecommendations: {
        debtStrategy: this.safeString(planData.aiRecommendations?.debtStrategy),
        emergencyFundAnalysis: this.safeString(planData.aiRecommendations?.emergencyFundAnalysis),
        investmentAnalysis: this.safeString(planData.aiRecommendations?.investmentAnalysis),
        cashFlowOptimization: this.safeString(planData.aiRecommendations?.cashFlowOptimization),
        riskWarnings: this.safeArray(planData.aiRecommendations?.riskWarnings),
        opportunities: this.safeArray(planData.aiRecommendations?.opportunities)
      },

      // Review & Tracking - EXACT field names from FinancialPlan.js
      reviewSchedule: {
        frequency: this.safeString(planData.reviewSchedule?.frequency) || 'quarterly',
        nextReviewDate: planData.reviewSchedule?.nextReviewDate || null,
        reviewHistory: this.safeArray(planData.reviewSchedule?.reviewHistory).map(review => ({
          reviewDate: review.reviewDate || null,
          reviewedBy: review.reviewedBy || null,
          notes: this.safeString(review.notes),
          adjustmentsMade: this.safeArray(review.adjustmentsMade)
        }))
      },

      // Performance Metrics - EXACT field names from FinancialPlan.js
      performanceMetrics: {
        adherenceScore: this.safeNumber(planData.performanceMetrics?.adherenceScore),
        goalsAchieved: this.safeNumber(planData.performanceMetrics?.goalsAchieved),
        debtReductionProgress: this.safeNumber(planData.performanceMetrics?.debtReductionProgress),
        investmentGrowth: this.safeNumber(planData.performanceMetrics?.investmentGrowth),
        lastUpdated: planData.performanceMetrics?.lastUpdated || null
      },

      // Change History - EXACT field names from FinancialPlan.js
      changeHistory: this.safeArray(planData.changeHistory).map(change => ({
        changeDate: change.changeDate || null,
        changedBy: change.changedBy || null,
        changeType: this.safeString(change.changeType),
        description: this.safeString(change.description),
        previousValue: change.previousValue,
        newValue: change.newValue
      })),

      // A/B Test Comparisons - EXACT field names from FinancialPlan.js
      abTestComparisons: this.safeArray(planData.abTestComparisons).map(comparison => ({
        comparisonId: comparison.comparisonId || null,
        comparedWithPlanId: comparison.comparedWithPlanId || null,
        comparisonDate: comparison.comparisonDate || null,
        wasSelectedAsWinner: this.safeBoolean(comparison.wasSelectedAsWinner),
        aiRecommendation: this.safeString(comparison.aiRecommendation)
      })),

      // PDF Reports Storage - EXACT field names from FinancialPlan.js
      pdfReports: this.safeArray(planData.pdfReports).map(report => ({
        reportType: this.safeString(report.reportType),
        generatedAt: report.generatedAt || null,
        version: this.safeNumber(report.version),
        pdfData: report.pdfData || null,
        fileSize: this.safeNumber(report.fileSize),
        fileName: this.safeString(report.fileName),
        metadata: {
          generatedBy: report.metadata?.generatedBy || null,
          clientId: report.metadata?.clientId || null,
          planVersion: this.safeNumber(report.metadata?.planVersion),
          generationMethod: this.safeString(report.metadata?.generationMethod) || 'frontend_jspdf',
          contentSummary: {
            goalsCount: this.safeNumber(report.metadata?.contentSummary?.goalsCount),
            totalSIPAmount: this.safeNumber(report.metadata?.contentSummary?.totalSIPAmount),
            hasRecommendations: this.safeBoolean(report.metadata?.contentSummary?.hasRecommendations)
          }
        }
      })),

      // Timestamps - EXACT field names from FinancialPlan.js
      createdAt: planData.createdAt || null,
      updatedAt: planData.updatedAt || null,

      // Virtual fields from FinancialPlan.js
      planAge: planData.planAge || 0,
      isReviewDue: this.safeBoolean(planData.isReviewDue)
    };
  }

  /**
   * Get default financial plan data when no plan exists
   * @returns {Object} - Default financial plan data
   */
  getDefaultFinancialPlanData() {
    return {
      clientId: null,
      advisorId: null,
      planType: 'cash_flow',
      status: 'draft',
      version: 1,
      clientDataSnapshot: {
        personalInfo: {
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          dateOfBirth: null,
          panNumber: '',
          maritalStatus: '',
          numberOfDependents: 0
        },
        financialInfo: {
          totalMonthlyIncome: 0,
          totalMonthlyExpenses: 0,
          incomeType: '',
          expenseBreakdown: {
            housingRent: 0,
            foodGroceries: 0,
            transportation: 0,
            utilities: 0,
            entertainment: 0,
            healthcare: 0,
            otherExpenses: 0
          }
        },
        investments: {
          mutualFunds: { totalValue: 0, monthlyInvestment: 0 },
          directStocks: { totalValue: 0 },
          ppf: { currentBalance: 0, annualContribution: 0 },
          epf: { currentBalance: 0 },
          nps: { currentBalance: 0 },
          elss: { currentValue: 0 },
          fixedDeposits: { totalValue: 0 },
          otherInvestments: { totalValue: 0 }
        },
        debtsAndLiabilities: {
          homeLoan: { outstandingAmount: 0, monthlyEMI: 0, interestRate: 0, remainingTenure: 0 },
          personalLoan: { outstandingAmount: 0, monthlyEMI: 0, interestRate: 0 },
          carLoan: { outstandingAmount: 0, monthlyEMI: 0, interestRate: 0 },
          educationLoan: { outstandingAmount: 0, monthlyEMI: 0, interestRate: 0 },
          creditCards: { totalOutstanding: 0, averageInterestRate: 0, monthlyPayment: 0 },
          otherLoans: { outstandingAmount: 0, monthlyEMI: 0, interestRate: 0 }
        },
        calculatedMetrics: {
          totalMonthlyEMIs: 0,
          monthlySurplus: 0,
          emiRatio: 0,
          fixedExpenditureRatio: 0,
          savingsRate: 0,
          netWorth: 0,
          debtToIncomeRatio: 0
        }
      },
      planDetails: {
        cashFlowPlan: {
          debtManagement: { prioritizedDebts: [], totalDebtReduction: 0, totalInterestSavings: 0, debtFreeDate: null },
          emergencyFundStrategy: { targetAmount: 0, currentAmount: 0, gap: 0, monthlyAllocation: 0, timeline: 0, investmentType: '', fundRecommendations: [] },
          investmentRecommendations: { monthlyInvestments: [], assetAllocation: { equity: 0, debt: 0, gold: 0, others: 0 }, totalMonthlyInvestment: 0, projectedCorpus: { year1: 0, year3: 0, year5: 0, year10: 0 } },
          cashFlowMetrics: { currentEmiRatio: 0, targetEmiRatio: 0, currentSavingsRate: 0, targetSavingsRate: 0, currentFixedExpenditureRatio: 0, targetFixedExpenditureRatio: 0, financialHealthScore: 0 },
          actionItems: []
        },
        goalBasedPlan: { selectedGoals: [], goalSpecificPlans: {} },
        hybridPlan: { cashFlowComponent: {}, goalBasedComponent: {} }
      },
      advisorRecommendations: { keyPoints: [], detailedNotes: '', customVariables: [] },
      aiRecommendations: { debtStrategy: '', emergencyFundAnalysis: '', investmentAnalysis: '', cashFlowOptimization: '', riskWarnings: [], opportunities: [] },
      reviewSchedule: { frequency: 'quarterly', nextReviewDate: null, reviewHistory: [] },
      performanceMetrics: { adherenceScore: 0, goalsAchieved: 0, debtReductionProgress: 0, investmentGrowth: 0, lastUpdated: null },
      changeHistory: [],
      abTestComparisons: [],
      pdfReports: [],
      createdAt: null,
      updatedAt: null,
      planAge: 0,
      isReviewDue: false
    };
  }

  /**
   * Generate fallback HTML when template rendering fails
   * @param {Object} templateData - Template data
   * @returns {String} - Fallback HTML
   */
  generateFallbackHTML(templateData) {
    const client = templateData.client || {};
    const vault = templateData.vault || {};
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Financial Report - ${client.name || 'Client'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { margin: 20px 0; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .error { color: #dc2626; background: #fef2f2; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Financial Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-IN')}</p>
    </div>
    
    <div class="content">
        <div class="error">
            <h3>⚠️ Template Rendering Issue</h3>
            <p>The main template could not be rendered due to a technical issue. This is a simplified version of your financial report.</p>
        </div>
        
        <div class="section">
            <h2>Client Information</h2>
            <p><strong>Name:</strong> ${client.name || 'Not Available'}</p>
            <p><strong>Email:</strong> ${client.email || 'Not Available'}</p>
            <p><strong>Phone:</strong> ${client.phoneNumber || 'Not Available'}</p>
        </div>
        
        <div class="section">
            <h2>Financial Summary</h2>
            <p><strong>Monthly Income:</strong> ₹${(client.totalMonthlyIncome || 0).toLocaleString('en-IN')}</p>
            <p><strong>Monthly Expenses:</strong> ₹${(client.totalMonthlyExpenses || 0).toLocaleString('en-IN')}</p>
            <p><strong>Net Worth:</strong> ₹${(templateData.financialMetrics?.netWorth || 0).toLocaleString('en-IN')}</p>
        </div>
        
        <div class="section">
            <h2>Report Status</h2>
            <p>This is a fallback report generated due to template rendering issues. Please contact support if this persists.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate minimal PDF as last resort
   * @param {Object} clientData - Client data
   * @param {Object} vaultData - Vault data
   * @returns {Buffer} - Minimal PDF buffer
   */
  async generateMinimalPDF(clientData, vaultData) {
    try {
      const client = clientData.client || {};
      const minimalHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Financial Report - ${client.firstName || 'Client'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Financial Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-IN')}</p>
    </div>
    <div class="content">
        <h2>Client: ${client.firstName || 'Unknown'} ${client.lastName || ''}</h2>
        <p>This is a minimal report generated due to technical issues.</p>
    </div>
</body>
</html>`;

      return await this.htmlToPdf(minimalHTML);
    } catch (error) {
      logger.error('❌ [PDF GENERATION] Minimal PDF generation failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Prepare comprehensive LOE data for PDF template
   * @param {Array} loeDocuments - Array of LOE documents
   * @returns {Object} - Formatted LOE data
   */
  prepareLOEData(loeDocuments) {
    if (!loeDocuments || loeDocuments.length === 0) {
      return this.getDefaultLOEData();
    }
    
    const latestLOE = loeDocuments[0];
    if (!latestLOE) {
      return this.getDefaultLOEData();
    }
    
    const loeData = latestLOE.toObject ? latestLOE.toObject() : latestLOE;
    
    return {
      // Core References - EXACT field names from LOE.js
      advisorId: loeData.advisorId || null,
      clientId: loeData.clientId || null,
      meetingId: loeData.meetingId || null,
      
      // Access & Status - EXACT field names from LOE.js
      accessToken: this.safeString(loeData.accessToken) || '',
      status: this.safeString(loeData.status) || 'draft',
      
      // Content - EXACT field names from LOE.js
      content: {
        services: {
          financialPlanning: this.safeBoolean(loeData.content?.services?.financialPlanning) || true,
          investmentAdvisory: this.safeBoolean(loeData.content?.services?.investmentAdvisory) || true,
          brokerageServices: this.safeBoolean(loeData.content?.services?.brokerageServices) || true,
          riskManagement: this.safeBoolean(loeData.content?.services?.riskManagement) || true
        },
        fees: {
          planningFee: this.safeString(loeData.content?.fees?.planningFee) || '$5,000',
          advisoryFeePercent: this.safeString(loeData.content?.fees?.advisoryFeePercent) || '1%',
          advisoryFeeThreshold: this.safeString(loeData.content?.fees?.advisoryFeeThreshold) || '$1,000,000',
          advisoryFeeReducedPercent: this.safeString(loeData.content?.fees?.advisoryFeeReducedPercent) || '0.75%'
        },
        customNotes: this.safeString(loeData.content?.customNotes) || '',
        focusAreas: this.safeArray(loeData.content?.focusAreas) || []
      },
      
      // Signatures - EXACT field names from LOE.js
      signatures: {
        client: {
          data: this.safeString(loeData.signatures?.client?.data) || '',
          timestamp: loeData.signatures?.client?.timestamp || null,
          ipAddress: this.safeString(loeData.signatures?.client?.ipAddress) || '',
          userAgent: this.safeString(loeData.signatures?.client?.userAgent) || ''
        }
      },
      
      // Tracking Timestamps - EXACT field names from LOE.js
      sentAt: loeData.sentAt || null,
      viewedAt: loeData.viewedAt || null,
      signedAt: loeData.signedAt || null,
      expiresAt: loeData.expiresAt || null,
      
      // Generated PDF URLs - EXACT field names from LOE.js
      signedPdfUrl: this.safeString(loeData.signedPdfUrl) || '',
      cloudinaryPdfUrl: this.safeString(loeData.cloudinaryPdfUrl) || '',
      
      // Email Tracking - EXACT field names from LOE.js
      emailsSent: this.safeArray(loeData.emailsSent) || [],
      
      // Timestamps - EXACT field names from LOE.js
      createdAt: loeData.createdAt || new Date(),
      updatedAt: loeData.updatedAt || new Date(),
      
      // Calculated fields
      isExpired: loeData.expiresAt ? new Date() > new Date(loeData.expiresAt) : false,
      daysUntilExpiry: loeData.expiresAt ? Math.ceil((new Date(loeData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : 0,
      hasSignature: !!loeData.signatures?.client?.data,
      isSigned: loeData.status === 'signed'
    };
  }

  /**
   * Prepare comprehensive LOEAutomation data for PDF template
   * @param {Array} loeAutomationDocs - Array of LOEAutomation documents
   * @returns {Object} - Formatted LOEAutomation data
   */
  prepareLOEAutomationData(loeAutomationDocs) {
    if (!loeAutomationDocs || loeAutomationDocs.length === 0) {
      return this.getDefaultLOEAutomationData();
    }
    
    const latestLOEAutomation = loeAutomationDocs[0];
    if (!latestLOEAutomation) {
      return this.getDefaultLOEAutomationData();
    }
    
    const loeAutomationData = latestLOEAutomation.toObject ? latestLOEAutomation.toObject() : latestLOEAutomation;
    
    return {
      // Core References - EXACT field names from LOEAutomation.js
      advisorId: loeAutomationData.advisorId || null,
      clientId: loeAutomationData.clientId || null,
      
      // Access & Status - EXACT field names from LOEAutomation.js
      status: this.safeString(loeAutomationData.status) || 'draft',
      accessToken: this.safeString(loeAutomationData.accessToken) || '',
      clientAccessUrl: this.safeString(loeAutomationData.clientAccessUrl) || '',
      
      // Content - EXACT field names from LOEAutomation.js
      content: {
        customNotes: this.safeString(loeAutomationData.content?.customNotes) || '',
        services: this.safeArray(loeAutomationData.content?.services) || [
          'Comprehensive Financial Planning and Analysis',
          'Investment Advisory and Portfolio Management',
          'Risk Assessment and Management Strategies',
          'Retirement Planning and Wealth Preservation',
          'Tax-Efficient Investment Strategies',
          'Regular Portfolio Reviews and Rebalancing'
        ],
        fees: this.safeArray(loeAutomationData.content?.fees) || [
          'Initial Financial Planning Fee: $5,000',
          'Ongoing Advisory Fee: 1% of assets under management',
          'Reduced fee of 0.75% for assets above $1,000,000',
          'Quarterly billing in advance'
        ]
      },
      
      // Signatures - EXACT field names from LOEAutomation.js
      signatures: {
        client: {
          data: this.safeString(loeAutomationData.signatures?.client?.data) || '',
          signedAt: loeAutomationData.signatures?.client?.signedAt || null,
          ipAddress: this.safeString(loeAutomationData.signatures?.client?.ipAddress) || '',
          userAgent: this.safeString(loeAutomationData.signatures?.client?.userAgent) || ''
        }
      },
      
      // Tracking Timestamps - EXACT field names from LOEAutomation.js
      sentAt: loeAutomationData.sentAt || null,
      viewedAt: loeAutomationData.viewedAt || null,
      signedAt: loeAutomationData.signedAt || null,
      expiresAt: loeAutomationData.expiresAt || null,
      
      // Generated PDF URLs - EXACT field names from LOEAutomation.js
      signedPdfUrl: this.safeString(loeAutomationData.signedPdfUrl) || '',
      cloudinaryPdfUrl: this.safeString(loeAutomationData.cloudinaryPdfUrl) || '',
      
      // Timestamps - EXACT field names from LOEAutomation.js
      createdAt: loeAutomationData.createdAt || new Date(),
      updatedAt: loeAutomationData.updatedAt || new Date(),
      
      // Calculated fields
      isExpired: loeAutomationData.expiresAt ? new Date() > new Date(loeAutomationData.expiresAt) : false,
      daysUntilExpiry: loeAutomationData.expiresAt ? Math.ceil((new Date(loeAutomationData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : 0,
      hasSignature: !!loeAutomationData.signatures?.client?.data,
      isSigned: loeAutomationData.status === 'signed'
    };
  }

  /**
   * Get default LOE data when no LOE exists
   * @returns {Object} - Default LOE data
   */
  getDefaultLOEData() {
    return {
      advisorId: null,
      clientId: null,
      meetingId: null,
      accessToken: '',
      status: 'draft',
      content: {
        services: {
          financialPlanning: true,
          investmentAdvisory: true,
          brokerageServices: true,
          riskManagement: true
        },
        fees: {
          planningFee: '$5,000',
          advisoryFeePercent: '1%',
          advisoryFeeThreshold: '$1,000,000',
          advisoryFeeReducedPercent: '0.75%'
        },
        customNotes: '',
        focusAreas: []
      },
      signatures: {
        client: {
          data: '',
          timestamp: null,
          ipAddress: '',
          userAgent: ''
        }
      },
      sentAt: null,
      viewedAt: null,
      signedAt: null,
      expiresAt: null,
      signedPdfUrl: '',
      cloudinaryPdfUrl: '',
      emailsSent: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isExpired: false,
      daysUntilExpiry: 0,
      hasSignature: false,
      isSigned: false
    };
  }

  /**
   * Get default LOEAutomation data when no LOEAutomation exists
   * @returns {Object} - Default LOEAutomation data
   */
  getDefaultLOEAutomationData() {
    return {
      advisorId: null,
      clientId: null,
      status: 'draft',
      accessToken: '',
      clientAccessUrl: '',
      content: {
        customNotes: '',
        services: [
          'Comprehensive Financial Planning and Analysis',
          'Investment Advisory and Portfolio Management',
          'Risk Assessment and Management Strategies',
          'Retirement Planning and Wealth Preservation',
          'Tax-Efficient Investment Strategies',
          'Regular Portfolio Reviews and Rebalancing'
        ],
        fees: [
          'Initial Financial Planning Fee: $5,000',
          'Ongoing Advisory Fee: 1% of assets under management',
          'Reduced fee of 0.75% for assets above $1,000,000',
          'Quarterly billing in advance'
        ]
      },
      signatures: {
        client: {
          data: '',
          signedAt: null,
          ipAddress: '',
          userAgent: ''
        }
      },
      sentAt: null,
      viewedAt: null,
      signedAt: null,
      expiresAt: null,
      signedPdfUrl: '',
      cloudinaryPdfUrl: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isExpired: false,
      daysUntilExpiry: 0,
      hasSignature: false,
      isSigned: false
    };
  }
}

module.exports = PDFGenerationService;
