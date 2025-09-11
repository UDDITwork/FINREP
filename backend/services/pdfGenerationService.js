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
    try {
      logger.info('🚀 [PDF GENERATION] Starting client report generation', {
        clientId: clientData.client?._id,
        advisorId: vaultData?.advisorId
      });

      // Step 1: Generate charts
      const charts = await this.generateCharts(clientData);
      
      // Step 2: Prepare template data
      const templateData = this.prepareTemplateData(clientData, vaultData, charts);
      
      // Step 3: Render HTML template
      const htmlContent = await this.renderTemplate(templateData);
      
      // Step 4: Convert HTML to PDF
      const pdfBuffer = await this.htmlToPdf(htmlContent);
      
      logger.info('✅ [PDF GENERATION] Client report generated successfully', {
        clientId: clientData.client?._id,
        pdfSize: `${Math.round(pdfBuffer.length / 1024)}KB`
      });

      return pdfBuffer;

    } catch (error) {
      logger.error('❌ [PDF GENERATION] Error generating client report', {
        error: error.message,
        stack: error.stack,
        clientId: clientData.client?._id
      });
      throw error;
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
    const client = clientData.client || {};
    const financialData = client.financialData || {};
    const goals = client.goals || [];
    const assets = client.assets || [];
    const liabilities = client.liabilities || [];

    // Ensure assets and liabilities are arrays
    const safeAssets = Array.isArray(assets) ? assets : [];
    const safeLiabilities = Array.isArray(liabilities) ? liabilities : [];

    // Calculate key metrics
    const totalAssets = safeAssets.reduce((sum, asset) => sum + (asset.value || 0), 0);
    const totalLiabilities = safeLiabilities.reduce((sum, liability) => sum + (liability.amount || 0), 0);
    const netWorth = totalAssets - totalLiabilities;
    const monthlyIncome = financialData.monthlyIncome || 0;
    const monthlyExpenses = financialData.monthlyExpenses || 0;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;

    // Goal progress calculation
    const goalProgress = goals.map(goal => {
      const currentAmount = goal.currentAmount || 0;
      const targetAmount = goal.targetAmount || 1;
      return {
        ...goal,
        progressPercentage: Math.min((currentAmount / targetAmount) * 100, 100),
        remainingAmount: Math.max(targetAmount - currentAmount, 0)
      };
    });

    const avgGoalProgress = goalProgress.length > 0 
      ? goalProgress.reduce((sum, goal) => sum + goal.progressPercentage, 0) / goalProgress.length 
      : 0;

    // Risk assessment
    const riskScore = this.calculateRiskScore(clientData);
    const riskLevel = this.getRiskLevel(riskScore);

    // Prepare alerts and recommendations
    const alerts = this.generateAlerts(clientData);
    const recommendations = this.generateRecommendations(clientData);

    return {
      // Comprehensive Header data
      vault: this.prepareVaultHeaderData(vaultData),

      // Client data
      client: {
        name: `${client.firstName || ''} ${client.lastName || ''}`.trim(),
        email: client.email || '',
        phoneNumber: client.phoneNumber || '',
        dateOfBirth: client.dateOfBirth || '',
        age: this.calculateAge(client.dateOfBirth),
        occupation: client.occupation || '',
        incomeType: client.incomeType || '',
        maritalStatus: client.maritalStatus || '',
        dependents: client.dependents || 0,
        address: client.address || ''
      },

      // Financial metrics
      financialMetrics: {
        netWorth: netWorth,
        totalAssets: totalAssets,
        totalLiabilities: totalLiabilities,
        monthlyIncome: monthlyIncome,
        monthlyExpenses: monthlyExpenses,
        savingsRate: savingsRate,
        emergencyFund: financialData.emergencyFund || 0,
        emergencyFundCoverage: monthlyExpenses > 0 ? (financialData.emergencyFund || 0) / monthlyExpenses : 0,
        debtToIncomeRatio: monthlyIncome > 0 ? totalLiabilities / (monthlyIncome * 12) : 0
      },

      // Goals and progress
      goals: {
        list: goalProgress,
        totalGoals: goals.length,
        avgProgress: avgGoalProgress,
        completedGoals: goalProgress.filter(g => g.progressPercentage >= 100).length,
        onTrackGoals: goalProgress.filter(g => g.progressPercentage >= 75 && g.progressPercentage < 100).length,
        needsAttentionGoals: goalProgress.filter(g => g.progressPercentage < 75).length
      },

      // Risk assessment
      riskAssessment: {
        score: riskScore,
        level: riskLevel,
        description: this.getRiskDescription(riskLevel),
        recommendations: this.getRiskRecommendations(riskLevel)
      },

      // Charts
      charts: charts,

      // Alerts and recommendations
      alerts: alerts,
      recommendations: recommendations,

      // Additional data sections
      estateInformation: clientData.estateInformation || null,
      taxPlanning: clientData.taxPlanning || null,
      mutualFundRecommend: clientData.mutualFundRecommend || [],
      meetings: clientData.meetings || [],
      chatHistory: clientData.chatHistory || [],

      // Report metadata
      reportMetadata: {
        generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        reportPeriod: this.getReportPeriod(),
        reportVersion: '1.0',
        confidentiality: 'CONFIDENTIAL - For authorized use only'
      }
    };
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
      
      // Compile template
      const template = handlebars.compile(templateContent);
      
      // Render with data
      const html = template(templateData);
      
      logger.info('✅ [PDF GENERATION] Template rendered successfully');
      return html;

    } catch (error) {
      logger.error('❌ [PDF GENERATION] Error rendering template', {
        error: error.message,
        stack: error.stack
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

      // Launch browser with enhanced configuration
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
          '--disable-features=VizDisplayCompositor'
        ],
        timeout: 60000 // 60 seconds timeout for browser launch
      });

      const page = await browser.newPage();
      
      // Set page timeout and disable images for faster loading
      page.setDefaultTimeout(60000); // 60 seconds
      page.setDefaultNavigationTimeout(60000); // 60 seconds
      
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
      
      // Set content with shorter timeout and different wait condition
      await page.setContent(htmlContent, { 
        waitUntil: 'domcontentloaded', // Changed from 'networkidle0' to avoid waiting for external resources
        timeout: 30000 // 30 seconds timeout
      });
      
      // Wait a bit for any remaining content to load
      await page.waitForTimeout(2000);
      
      // Generate PDF
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
        timeout: 30000 // 30 seconds timeout for PDF generation
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
        await browser.close();
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
    const financialData = client.financialData || {};
    const assets = client.assets || [];
    const liabilities = client.liabilities || [];

    // Ensure assets and liabilities are arrays
    const safeAssets = Array.isArray(assets) ? assets : [];
    const safeLiabilities = Array.isArray(liabilities) ? liabilities : [];

    let riskScore = 5; // Base score

    // Age factor
    const age = this.calculateAge(client.dateOfBirth);
    if (age < 30) riskScore += 2;
    else if (age > 50) riskScore -= 1;

    // Income stability
    if (client.incomeType === 'salaried') riskScore -= 1;
    else if (client.incomeType === 'business') riskScore += 1;

    // Debt to income ratio
    const monthlyIncome = financialData.monthlyIncome || 0;
    const totalLiabilities = safeLiabilities.reduce((sum, liability) => sum + (liability.amount || 0), 0);
    const debtToIncomeRatio = monthlyIncome > 0 ? totalLiabilities / (monthlyIncome * 12) : 0;
    
    if (debtToIncomeRatio > 0.4) riskScore += 2;
    else if (debtToIncomeRatio < 0.2) riskScore -= 1;

    // Emergency fund
    const emergencyFund = financialData.emergencyFund || 0;
    const monthlyExpenses = financialData.monthlyExpenses || 0;
    const emergencyCoverage = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0;
    
    if (emergencyCoverage < 3) riskScore += 1;
    else if (emergencyCoverage > 6) riskScore -= 1;

    // Investment diversification
    const equityInvestments = safeAssets.filter(asset => asset.type === 'equity').length;
    if (equityInvestments > 5) riskScore += 1;
    else if (equityInvestments < 2) riskScore -= 1;

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
    const financialData = client.financialData || {};
    const assets = client.assets || [];
    const liabilities = client.liabilities || [];

    // Ensure assets and liabilities are arrays
    const safeAssets = Array.isArray(assets) ? assets : [];
    const safeLiabilities = Array.isArray(liabilities) ? liabilities : [];

    // Emergency fund check
    const emergencyFund = financialData.emergencyFund || 0;
    const monthlyExpenses = financialData.monthlyExpenses || 0;
    if (emergencyFund < monthlyExpenses * 3) {
      alerts.push({
        type: 'warning',
        title: 'Insufficient Emergency Fund',
        message: `Emergency fund covers only ${Math.round(emergencyFund / monthlyExpenses)} months of expenses. Recommended: 6 months.`,
        priority: 'high'
      });
    }

    // Debt to income ratio
    const monthlyIncome = financialData.monthlyIncome || 0;
    const totalLiabilities = safeLiabilities.reduce((sum, liability) => sum + (liability.amount || 0), 0);
    const debtToIncomeRatio = monthlyIncome > 0 ? totalLiabilities / (monthlyIncome * 12) : 0;
    if (debtToIncomeRatio > 0.4) {
      alerts.push({
        type: 'danger',
        title: 'High Debt Burden',
        message: `Debt-to-income ratio is ${Math.round(debtToIncomeRatio * 100)}%. Consider debt consolidation.`,
        priority: 'urgent'
      });
    }

    // Investment diversification
    if (safeAssets.length < 3) {
      alerts.push({
        type: 'info',
        title: 'Limited Diversification',
        message: 'Consider diversifying investments across different asset classes.',
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
    const goals = client.goals || [];

    // Goal-based recommendations
    const incompleteGoals = goals.filter(goal => (goal.currentAmount || 0) < (goal.targetAmount || 0));
    if (incompleteGoals.length > 0) {
      recommendations.push({
        category: 'Goal Achievement',
        title: 'Accelerate Goal Funding',
        description: `Focus on ${incompleteGoals.length} incomplete goals with increased SIP amounts.`,
        priority: 'high',
        timeline: 'Next 3 months'
      });
    }

    // Tax planning recommendations
    if (clientData.taxPlanning) {
      recommendations.push({
        category: 'Tax Optimization',
        title: 'Maximize Tax Savings',
        description: 'Utilize available deductions and tax-saving investments.',
        priority: 'medium',
        timeline: 'Before March 31'
      });
    }

    // Insurance recommendations
    const monthlyIncome = client.financialData?.monthlyIncome || 0;
    if (monthlyIncome > 0) {
      recommendations.push({
        category: 'Risk Management',
        title: 'Adequate Life Insurance',
        description: `Ensure life insurance coverage of ₹${Math.round(monthlyIncome * 12 * 10)} (10x annual income).`,
        priority: 'high',
        timeline: 'Next 6 months'
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
}

module.exports = PDFGenerationService;
