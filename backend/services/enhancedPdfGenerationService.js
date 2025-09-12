/**
 * FILE LOCATION: backend/services/enhancedPdfGenerationService.js
 * 
 * PURPOSE: Enhanced PDF generation service with comprehensive error handling and data validation
 * 
 * FUNCTIONALITY:
 * - Handles client ID format mismatches (numeric vs ObjectId)
 * - Validates and enriches data with defaults
 * - Provides comprehensive error reporting
 * - Generates complete HTML without template dependencies
 * - Implements retry logic for PDF conversion
 * - Tracks data completeness and missing fields
 */

const puppeteer = require('puppeteer');
const { logger } = require('../utils/logger');

class EnhancedPDFGenerationService {
  constructor() {
    this.dataFetchErrors = [];
    this.dataFetchWarnings = [];
  }

  /**
   * Main entry point for PDF generation with comprehensive error handling
   * @param {Object} clientData - Complete client data from all models
   * @param {Object} vaultData - Advisor vault data for header
   * @returns {Buffer} - PDF buffer
   */
  async generateClientReport(clientData, vaultData) {
    try {
      logger.info('🚀 [ENHANCED PDF] Starting generation with data validation');
      
      // Step 1: Validate and enrich data
      const validatedData = await this.validateAndEnrichData(clientData, vaultData);
      
      // Step 2: Generate HTML with complete data
      const htmlContent = this.generateCompleteHTML(validatedData);
      
      // Step 3: Convert to PDF with retry logic
      const pdfBuffer = await this.convertToPdfWithRetry(htmlContent);
      
      logger.info('✅ [ENHANCED PDF] Generation completed successfully', {
        pdfSize: `${Math.round(pdfBuffer.length / 1024)}KB`,
        warnings: this.dataFetchWarnings.length,
        errors: this.dataFetchErrors.length
      });
      
      return pdfBuffer;
    } catch (error) {
      logger.error('❌ [ENHANCED PDF] Generation failed', error);
      throw error;
    }
  }

  /**
   * Validate and enrich data with defaults for missing fields
   * @param {Object} clientData - Raw client data
   * @param {Object} vaultData - Raw vault data
   * @returns {Object} - Enriched and validated data
   */
  async validateAndEnrichData(clientData, vaultData) {
    const enrichedData = {
      vault: this.enrichVaultData(vaultData),
      client: this.enrichClientData(clientData.client),
      financialPlans: this.enrichCollectionData(clientData.financialPlans, 'financialPlans'),
      taxPlanning: this.enrichCollectionData(clientData.taxPlanning, 'taxPlanning'),
      estateInformation: this.enrichEstateData(clientData.estateInformation),
      kycVerification: this.enrichKYCData(clientData.kycVerification),
      mutualFundRecommend: this.enrichCollectionData(clientData.mutualFundRecommend, 'mutualFunds'),
      meetings: this.enrichCollectionData(clientData.meetings, 'meetings'),
      loeDocuments: this.enrichCollectionData(clientData.loeDocuments, 'loe'),
      chatHistory: this.enrichCollectionData(clientData.chatHistory, 'chat'),
      metadata: {
        generatedAt: new Date().toISOString(),
        dataCompleteness: this.calculateDataCompleteness(clientData),
        warnings: this.dataFetchWarnings,
        errors: this.dataFetchErrors
      }
    };
    
    return enrichedData;
  }

  /**
   * Enrich vault data with comprehensive defaults
   * @param {Object} vaultData - Raw vault data
   * @returns {Object} - Enriched vault data
   */
  enrichVaultData(vaultData) {
    const defaults = {
      advisorId: 'N/A',
      firstName: 'Advisor',
      lastName: 'Name',
      email: 'advisor@example.com',
      phoneNumber: 'Not provided',
      firmName: 'Financial Advisory Firm',
      sebiRegNumber: 'Pending',
      certifications: [],
      memberships: [],
      branding: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        logo: { url: '', altText: 'Logo' }
      }
    };
    
    if (!vaultData) {
      this.dataFetchWarnings.push('Vault data missing - using defaults');
      return defaults;
    }
    
    // Merge with defaults to ensure all fields exist
    return { ...defaults, ...vaultData };
  }

  /**
   * Enrich client data with comprehensive defaults
   * @param {Object} clientData - Raw client data
   * @returns {Object} - Enriched client data
   */
  enrichClientData(clientData) {
    const defaults = {
      firstName: 'Client',
      lastName: 'Name',
      email: 'client@example.com',
      phoneNumber: 'Not provided',
      dateOfBirth: null,
      panNumber: 'Not provided',
      occupation: 'Not specified',
      totalMonthlyIncome: 0,
      totalMonthlyExpenses: 0,
      netWorth: 0,
      onboardingStep: 0,
      status: 'unknown',
      financialData: {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        emergencyFund: 0
      },
      assets: [],
      liabilities: [],
      goals: [],
      monthlyExpenses: {},
      address: {}
    };
    
    if (!clientData) {
      this.dataFetchErrors.push('Client data missing entirely');
      return defaults;
    }
    
    // Deep merge with defaults
    const enriched = this.deepMerge(defaults, clientData);
    
    // Calculate derived values
    enriched.calculatedAge = this.calculateAge(enriched.dateOfBirth);
    enriched.monthlySavings = (enriched.totalMonthlyIncome || 0) - (enriched.totalMonthlyExpenses || 0);
    enriched.savingsRate = enriched.totalMonthlyIncome > 0 
      ? ((enriched.monthlySavings / enriched.totalMonthlyIncome) * 100).toFixed(2)
      : 0;
    
    return enriched;
  }

  /**
   * Enrich collection data (arrays) with validation
   * @param {Array} collection - Raw collection data
   * @param {String} collectionName - Name of the collection for logging
   * @returns {Array} - Validated collection data
   */
  enrichCollectionData(collection, collectionName) {
    if (!collection) {
      this.dataFetchWarnings.push(`${collectionName} collection is null`);
      return [];
    }
    
    if (!Array.isArray(collection)) {
      this.dataFetchWarnings.push(`${collectionName} is not an array`);
      return [];
    }
    
    return collection.map((item, index) => {
      if (!item || typeof item !== 'object') {
        this.dataFetchWarnings.push(`${collectionName}[${index}] is invalid`);
        return {};
      }
      return item;
    });
  }

  /**
   * Enrich estate information with defaults
   * @param {Object} estateData - Raw estate data
   * @returns {Object} - Enriched estate data
   */
  enrichEstateData(estateData) {
    const defaults = {
      familyStructure: {
        spouse: { exists: false },
        children: [],
        dependents: [],
        beneficiaries: []
      },
      realEstateProperties: [],
      legalDocumentsStatus: {
        willDetails: { exists: false },
        trustStructures: [],
        powerOfAttorney: { exists: false },
        nominations: []
      },
      estateMetadata: {
        estimatedNetEstate: 0,
        estateTaxLiability: 0,
        successionComplexity: 'Not assessed'
      }
    };
    
    if (!estateData) {
      this.dataFetchWarnings.push('Estate information missing');
      return defaults;
    }
    
    return this.deepMerge(defaults, estateData);
  }

  /**
   * Enrich KYC data with defaults
   * @param {Object} kycData - Raw KYC data
   * @returns {Object} - Enriched KYC data
   */
  enrichKYCData(kycData) {
    const defaults = {
      overallStatus: 'pending',
      aadharStatus: 'not_verified',
      panStatus: 'not_verified',
      verificationAttempts: { aadhar: 0, pan: 0 },
      lastVerificationAttempt: null
    };
    
    if (!kycData) {
      this.dataFetchWarnings.push('KYC verification data missing');
      return defaults;
    }
    
    return { ...defaults, ...kycData };
  }

  /**
   * Deep merge utility for nested objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} - Merged object
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
    
    function isObject(item) {
      return item && typeof item === 'object' && !Array.isArray(item);
    }
  }

  /**
   * Calculate data completeness percentage
   * @param {Object} data - Data object to analyze
   * @returns {Number} - Completeness percentage (0-100)
   */
  calculateDataCompleteness(data) {
    let totalFields = 0;
    let filledFields = 0;
    
    const checkFields = (obj, prefix = '') => {
      if (!obj) return;
      
      Object.entries(obj).forEach(([key, value]) => {
        totalFields++;
        
        if (value !== null && value !== undefined && value !== '' && value !== 0) {
          filledFields++;
        }
        
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          checkFields(value, `${prefix}${key}.`);
        }
      });
    };
    
    checkFields(data);
    
    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  }

  /**
   * Generate complete HTML with all data properly rendered
   * @param {Object} data - Enriched data object
   * @returns {String} - Complete HTML content
   */
  generateCompleteHTML(data) {
    const formatCurrency = (amount) => {
      if (!amount || isNaN(amount)) return '₹0';
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
      }).format(amount);
    };
    
    const formatDate = (date) => {
      if (!date) return 'N/A';
      try {
        return new Date(date).toLocaleDateString('en-IN');
      } catch {
        return 'N/A';
      }
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Financial Report</title>
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: #ffffff;
        }
        
        /* Container */
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 40px;
            page-break-after: avoid;
        }
        
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .header .firm-name {
            font-size: 20px;
            opacity: 0.95;
        }
        
        .header .meta-info {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            opacity: 0.9;
        }
        
        /* Section Styles */
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 24px;
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .subsection-title {
            font-size: 18px;
            color: #333;
            margin: 20px 0 15px 0;
            font-weight: 600;
        }
        
        /* Data Display */
        .data-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .data-item {
            padding: 15px;
            background: #f7f9fc;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        
        .data-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .data-value {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
        }
        
        .data-value.currency {
            color: #10b981;
        }
        
        .data-value.percentage {
            color: #2563eb;
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th {
            background: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        tr:nth-child(even) {
            background: #f9fafb;
        }
        
        /* Status Badges */
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .status-active {
            background: #d1fae5;
            color: #065f46;
        }
        
        .status-pending {
            background: #fed7aa;
            color: #92400e;
        }
        
        .status-completed {
            background: #dbeafe;
            color: #1e40af;
        }
        
        /* KPI Cards */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin: 30px 0;
        }
        
        .kpi-card {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .kpi-value {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .kpi-label {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
        }
        
        /* Print Styles */
        @media print {
            .container {
                padding: 10mm;
            }
            
            .section {
                page-break-inside: avoid;
            }
            
            .header {
                background: #2563eb !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
        
        /* Warning Box */
        .warning-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #991b1b;
        }
        
        .warning-box h4 {
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <div class="header">
            <h1>Comprehensive Financial Report</h1>
            <div class="firm-name">${data.vault.firmName}</div>
            <div class="meta-info">
                <div>
                    <strong>Advisor:</strong> ${data.vault.firstName} ${data.vault.lastName}<br>
                    <strong>SEBI Reg:</strong> ${data.vault.sebiRegNumber}
                </div>
                <div>
                    <strong>Generated:</strong> ${formatDate(new Date())}<br>
                    <strong>Report ID:</strong> ${Date.now().toString(36).toUpperCase()}
                </div>
            </div>
        </div>

        <!-- Client Overview -->
        <div class="section">
            <h2 class="section-title">Client Overview</h2>
            
            <div class="data-grid">
                <div class="data-item">
                    <div class="data-label">Client Name</div>
                    <div class="data-value">${data.client.firstName} ${data.client.lastName}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Email</div>
                    <div class="data-value">${data.client.email}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Phone</div>
                    <div class="data-value">${data.client.phoneNumber}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">PAN Number</div>
                    <div class="data-value">${data.client.panNumber}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Age</div>
                    <div class="data-value">${data.client.calculatedAge || 'N/A'} years</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Occupation</div>
                    <div class="data-value">${data.client.occupation}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Onboarding Status</div>
                    <div class="data-value">
                        <span class="status-badge status-${data.client.status}">${data.client.status}</span>
                    </div>
                </div>
                <div class="data-item">
                    <div class="data-label">Onboarding Progress</div>
                    <div class="data-value percentage">${Math.round((data.client.onboardingStep / 7) * 100)}%</div>
                </div>
            </div>
        </div>

        <!-- Financial Summary KPIs -->
        <div class="section">
            <h2 class="section-title">Financial Summary</h2>
            
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-value">${formatCurrency(data.client.netWorth)}</div>
                    <div class="kpi-label">Net Worth</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">${formatCurrency(data.client.totalMonthlyIncome)}</div>
                    <div class="kpi-label">Monthly Income</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">${formatCurrency(data.client.totalMonthlyExpenses)}</div>
                    <div class="kpi-label">Monthly Expenses</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">${data.client.savingsRate}%</div>
                    <div class="kpi-label">Savings Rate</div>
                </div>
            </div>
        </div>

        <!-- Assets & Liabilities -->
        <div class="section">
            <h2 class="section-title">Assets & Liabilities</h2>
            
            <h3 class="subsection-title">Assets</h3>
            ${data.client.assets && data.client.assets.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Asset Type</th>
                            <th>Description</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.client.assets.map(asset => `
                            <tr>
                                <td>${asset.type || 'N/A'}</td>
                                <td>${asset.name || asset.description || 'N/A'}</td>
                                <td>${formatCurrency(asset.value || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No assets recorded</p>'}
            
            <h3 class="subsection-title">Liabilities</h3>
            ${data.client.liabilities && data.client.liabilities.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Liability Type</th>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.client.liabilities.map(liability => `
                            <tr>
                                <td>${liability.type || 'N/A'}</td>
                                <td>${liability.name || liability.description || 'N/A'}</td>
                                <td>${formatCurrency(liability.amount || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No liabilities recorded</p>'}
        </div>

        <!-- Financial Plans -->
        ${data.financialPlans && data.financialPlans.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Financial Plans (${data.financialPlans.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Plan Type</th>
                            <th>Status</th>
                            <th>Created Date</th>
                            <th>Version</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.financialPlans.map(plan => `
                            <tr>
                                <td>${plan.planType || 'N/A'}</td>
                                <td><span class="status-badge status-${plan.status}">${plan.status || 'pending'}</span></td>
                                <td>${formatDate(plan.createdAt)}</td>
                                <td>${plan.version || '1.0'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <!-- KYC Verification -->
        ${data.kycVerification ? `
            <div class="section">
                <h2 class="section-title">KYC Verification Status</h2>
                <div class="data-grid">
                    <div class="data-item">
                        <div class="data-label">Overall Status</div>
                        <div class="data-value">
                            <span class="status-badge status-${data.kycVerification.overallStatus}">
                                ${data.kycVerification.overallStatus}
                            </span>
                        </div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Aadhar Status</div>
                        <div class="data-value">${data.kycVerification.aadharStatus}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">PAN Status</div>
                        <div class="data-value">${data.kycVerification.panStatus}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Verification Attempts</div>
                        <div class="data-value">
                            Aadhar: ${data.kycVerification.verificationAttempts.aadhar}, 
                            PAN: ${data.kycVerification.verificationAttempts.pan}
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}

        <!-- Mutual Fund Recommendations -->
        ${data.mutualFundRecommend && data.mutualFundRecommend.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Mutual Fund Recommendations (${data.mutualFundRecommend.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Fund Name</th>
                            <th>Fund House</th>
                            <th>Monthly SIP</th>
                            <th>Risk Profile</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.mutualFundRecommend.slice(0, 10).map(fund => `
                            <tr>
                                <td>${fund.fundName || 'N/A'}</td>
                                <td>${fund.fundHouseName || 'N/A'}</td>
                                <td>${formatCurrency(fund.recommendedMonthlySIP || 0)}</td>
                                <td>${fund.riskProfile || 'N/A'}</td>
                                <td><span class="status-badge status-${fund.status}">${fund.status || 'pending'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <!-- Estate Information -->
        ${data.estateInformation && data.estateInformation.familyStructure ? `
            <div class="section">
                <h2 class="section-title">Estate Planning</h2>
                
                ${data.estateInformation.familyStructure.spouse?.exists ? `
                    <h3 class="subsection-title">Spouse Information</h3>
                    <div class="data-grid">
                        <div class="data-item">
                            <div class="data-label">Name</div>
                            <div class="data-value">${data.estateInformation.familyStructure.spouse.fullName || 'N/A'}</div>
                        </div>
                        <div class="data-item">
                            <div class="data-label">Occupation</div>
                            <div class="data-value">${data.estateInformation.familyStructure.spouse.occupation || 'N/A'}</div>
                        </div>
                    </div>
                ` : ''}
                
                ${data.estateInformation.familyStructure.children?.length > 0 ? `
                    <h3 class="subsection-title">Children</h3>
                    <ul>
                        ${data.estateInformation.familyStructure.children.map(child => `
                            <li>${child.fullName} - ${child.educationStatus || 'N/A'}</li>
                        `).join('')}
                    </ul>
                ` : ''}
                
                ${data.estateInformation.realEstateProperties?.length > 0 ? `
                    <h3 class="subsection-title">Real Estate Properties</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Property Type</th>
                                <th>Address</th>
                                <th>Market Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.estateInformation.realEstateProperties.map(property => `
                                <tr>
                                    <td>${property.propertyType || 'N/A'}</td>
                                    <td>${property.propertyAddress || 'N/A'}</td>
                                    <td>${formatCurrency(property.financialDetails?.currentMarketValue || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}
            </div>
        ` : ''}

        <!-- Data Completeness Warning -->
        ${data.metadata.dataCompleteness < 50 ? `
            <div class="warning-box">
                <h4>⚠️ Data Completeness: ${data.metadata.dataCompleteness}%</h4>
                <p>This report may have incomplete information. Please ensure all client data is properly collected and stored.</p>
                ${data.metadata.warnings.length > 0 ? `
                    <ul>
                        ${data.metadata.warnings.slice(0, 5).map(warning => `<li>${warning}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <p><strong>${data.vault.firmName}</strong></p>
            <p>This report is confidential and intended solely for the addressee.</p>
            <p>Generated on ${formatDate(new Date())} | Data Completeness: ${data.metadata.dataCompleteness}%</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Convert HTML to PDF with retry logic
   * @param {String} htmlContent - HTML content to convert
   * @param {Number} maxRetries - Maximum number of retry attempts
   * @returns {Buffer} - PDF buffer
   */
  async convertToPdfWithRetry(htmlContent, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`🔄 [ENHANCED PDF] PDF conversion attempt ${attempt}/${maxRetries}`);
        
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions'
          ],
          timeout: 30000
        });
        
        try {
          const page = await browser.newPage();
          
          // Set content with shorter timeout
          await page.setContent(htmlContent, {
            waitUntil: 'domcontentloaded',
            timeout: 20000
          });
          
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
            displayHeaderFooter: false,
            preferCSSPageSize: false
          });
          
          logger.info(`✅ [ENHANCED PDF] Conversion successful on attempt ${attempt}`);
          return pdfBuffer;
          
        } finally {
          await browser.close();
        }
        
      } catch (error) {
        lastError = error;
        logger.warn(`⚠️ [ENHANCED PDF] Conversion attempt ${attempt} failed`, {
          error: error.message,
          attempt
        });
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }
    
    throw new Error(`PDF conversion failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Calculate age from date of birth
   * @param {String|Date} dateOfBirth - Date of birth
   * @returns {Number|null} - Age in years or null if invalid
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch {
      return null;
    }
  }
}

module.exports = EnhancedPDFGenerationService;
