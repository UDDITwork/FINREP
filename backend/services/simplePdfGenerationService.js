/**
 * FILE LOCATION: backend/services/simplePdfGenerationService.js
 * 
 * PURPOSE: Simplified PDF generation service with modern Puppeteer compatibility
 * 
 * FUNCTIONALITY:
 * - Uses only modern Puppeteer methods
 * - Minimal configuration for maximum compatibility
 * - Handles client ID format issues
 * - Generates complete HTML without external dependencies
 */

const puppeteer = require('puppeteer');
const { logger } = require('../utils/logger');

class SimplePDFGenerationService {
  constructor() {
    this.dataFetchErrors = [];
    this.dataFetchWarnings = [];
  }

  /**
   * Generate PDF with minimal, modern Puppeteer usage
   * @param {Object} clientData - Complete client data from all models
   * @param {Object} vaultData - Advisor vault data for header
   * @returns {Buffer} - PDF buffer
   */
  async generateClientReport(clientData, vaultData) {
    try {
      logger.info('🚀 [SIMPLE PDF] Starting PDF generation with modern Puppeteer');
      
      // Step 1: Generate complete HTML
      const htmlContent = this.generateCompleteHTML(clientData, vaultData);
      
      // Step 2: Convert to PDF with minimal configuration
      const pdfBuffer = await this.convertToPdf(htmlContent);
      
      logger.info('✅ [SIMPLE PDF] Generation completed successfully', {
        pdfSize: `${Math.round(pdfBuffer.length / 1024)}KB`
      });
      
      return pdfBuffer;
    } catch (error) {
      logger.error('❌ [SIMPLE PDF] Generation failed', error);
      throw error;
    }
  }

  /**
   * Convert HTML to PDF with minimal, modern Puppeteer configuration
   * @param {String} htmlContent - HTML content to convert
   * @returns {Buffer} - PDF buffer
   */
  async convertToPdf(htmlContent) {
    let browser;
    
    try {
      logger.info('🔄 [SIMPLE PDF] Launching browser with minimal config');
      
      // Minimal browser configuration for maximum compatibility
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
      
      const page = await browser.newPage();
      
      // Minimal page configuration
      await page.setViewport({ width: 1200, height: 800 });
      
      logger.info('🔄 [SIMPLE PDF] Setting HTML content');
      
      // Set content with minimal wait conditions
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      // Simple wait for content to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info('🔄 [SIMPLE PDF] Generating PDF');
      
      // Generate PDF with minimal configuration
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });
      
      logger.info('✅ [SIMPLE PDF] PDF generated successfully');
      return pdfBuffer;
      
    } catch (error) {
      logger.error('❌ [SIMPLE PDF] PDF generation failed', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate complete HTML with all data properly rendered
   * @param {Object} clientData - Client data
   * @param {Object} vaultData - Vault data
   * @returns {String} - Complete HTML content
   */
  generateCompleteHTML(clientData, vaultData) {
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

    // Safe data extraction with defaults - ACCESS ALL DATA
    // The controller passes data in this structure: { client: {...}, vault: {...}, financialPlans: [...], ... }
    const client = clientData?.client || {};
    const vault = vaultData || {};
    const financialPlans = clientData?.financialPlans || [];
    const meetings = clientData?.meetings || [];
    const loeDocuments = clientData?.loeDocuments || [];
    const loeAutomation = clientData?.loeAutomation || [];
    const abTestSessions = clientData?.abTestSessions || [];
    const chatHistory = clientData?.chatHistory || [];
    const mutualFundExitStrategies = clientData?.mutualFundExitStrategies || [];
    const clientInvitations = clientData?.clientInvitations || [];
    const estateInformation = clientData?.estateInformation || {};
    const mutualFundRecommend = clientData?.mutualFundRecommend || [];
    const taxPlanning = clientData?.taxPlanning || {};
    
    // Debug logging to see what data we actually have
    console.log('🔍 [SIMPLE PDF] Data received:', {
      hasClient: !!client,
      hasVault: !!vault,
      financialPlansCount: financialPlans.length,
      meetingsCount: meetings.length,
      loeDocumentsCount: loeDocuments.length,
      loeAutomationCount: loeAutomation.length,
      abTestSessionsCount: abTestSessions.length,
      chatHistoryCount: chatHistory.length,
      mutualFundExitStrategiesCount: mutualFundExitStrategies.length,
      clientInvitationsCount: clientInvitations.length,
      mutualFundRecommendCount: mutualFundRecommend.length,
      hasTaxPlanning: !!taxPlanning,
      hasEstateInformation: !!estateInformation,
      clientKeys: Object.keys(client),
      vaultKeys: Object.keys(vault)
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Financial Report - ${client.firstName || 'Client'} ${client.lastName || ''}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; color: #1a1a1a; background: #ffffff;
        }
        .container { max-width: 210mm; margin: 0 auto; padding: 20mm; }
        .header { 
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white; padding: 30px; border-radius: 10px; margin-bottom: 40px;
        }
        .header h1 { font-size: 32px; margin-bottom: 10px; }
        .header .firm-name { font-size: 20px; opacity: 0.95; }
        .header .meta-info { margin-top: 20px; display: flex; justify-content: space-between; font-size: 12px; opacity: 0.9; }
        .section { margin-bottom: 40px; }
        .section-title { 
            font-size: 24px; color: #2563eb; border-bottom: 3px solid #2563eb;
            padding-bottom: 10px; margin-bottom: 20px;
        }
        .data-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
        .data-item { 
            padding: 15px; background: #f7f9fc; border-radius: 8px; 
            border-left: 4px solid #2563eb;
        }
        .data-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
        .data-value { font-size: 18px; font-weight: 600; color: #1a1a1a; }
        .data-value.currency { color: #10b981; }
        .data-value.percentage { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #2563eb; color: white; padding: 12px; text-align: left; font-weight: 600; }
        td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
        .kpi-card { 
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white; padding: 20px; border-radius: 10px; text-align: center;
        }
        .kpi-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
        .kpi-label { font-size: 12px; opacity: 0.9; text-transform: uppercase; }
        .status-badge { 
            display: inline-block; padding: 4px 12px; border-radius: 20px; 
            font-size: 12px; font-weight: 600;
        }
        .status-active { background: #d1fae5; color: #065f46; }
        .status-pending { background: #fed7aa; color: #92400e; }
        .status-completed { background: #dbeafe; color: #1e40af; }
        @media print { 
            .container { padding: 10mm; }
            .section { page-break-inside: avoid; }
            .header { background: #2563eb !important; -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <div class="header">
            <h1>Comprehensive Financial Report</h1>
            <div class="firm-name">${vault.firmName || 'Financial Advisory Firm'}</div>
            <div class="meta-info">
                <div>
                    <strong>Advisor:</strong> ${vault.firstName || 'Advisor'} ${vault.lastName || 'Name'}<br>
                    <strong>SEBI Reg:</strong> ${vault.sebiRegNumber || 'Pending'}
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
                    <div class="data-value">${client.firstName || 'Client'} ${client.lastName || 'Name'}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Email</div>
                    <div class="data-value">${client.email || 'Not provided'}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Phone</div>
                    <div class="data-value">${client.phoneNumber || 'Not provided'}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">PAN Number</div>
                    <div class="data-value">${client.panNumber || 'Not provided'}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Occupation</div>
                    <div class="data-value">${client.occupation || 'Not specified'}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Onboarding Progress</div>
                    <div class="data-value percentage">${Math.round(((client.onboardingStep || 0) / 7) * 100)}%</div>
                </div>
            </div>
        </div>

        <!-- Financial Summary KPIs -->
        <div class="section">
            <h2 class="section-title">Financial Summary</h2>
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-value">${formatCurrency(client.netWorth || 0)}</div>
                    <div class="kpi-label">Net Worth</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">${formatCurrency(client.totalMonthlyIncome || 0)}</div>
                    <div class="kpi-label">Monthly Income</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">${formatCurrency(client.totalMonthlyExpenses || 0)}</div>
                    <div class="kpi-label">Monthly Expenses</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-value">${client.totalMonthlyIncome > 0 ? Math.round(((client.totalMonthlyIncome - (client.totalMonthlyExpenses || 0)) / client.totalMonthlyIncome) * 100) : 0}%</div>
                    <div class="kpi-label">Savings Rate</div>
                </div>
            </div>
        </div>

        <!-- Financial Plans -->
        ${financialPlans.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Financial Plans (${financialPlans.length})</h2>
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
                        ${financialPlans.map(plan => `
                            <tr>
                                <td>${plan.planType || 'N/A'}</td>
                                <td><span class="status-badge status-${plan.status || 'pending'}">${plan.status || 'pending'}</span></td>
                                <td>${formatDate(plan.createdAt)}</td>
                                <td>${plan.version || '1.0'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <!-- Mutual Fund Recommendations -->
        ${mutualFundRecommend.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Mutual Fund Recommendations (${mutualFundRecommend.length})</h2>
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
                        ${mutualFundRecommend.map(fund => `
                            <tr>
                                <td>${fund.fundName || 'N/A'}</td>
                                <td>${fund.fundHouseName || 'N/A'}</td>
                                <td>${formatCurrency(fund.recommendedMonthlySIP || 0)}</td>
                                <td>${fund.riskProfile || 'N/A'}</td>
                                <td><span class="status-badge status-${fund.status || 'pending'}">${fund.status || 'pending'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <!-- Mutual Fund Exit Strategies -->
        ${mutualFundExitStrategies.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Mutual Fund Exit Strategies (${mutualFundExitStrategies.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Fund Name</th>
                            <th>Exit Strategy</th>
                            <th>Target Amount</th>
                            <th>Current Value</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mutualFundExitStrategies.map(strategy => `
                            <tr>
                                <td>${strategy.fundName || 'N/A'}</td>
                                <td>${strategy.exitStrategy || 'N/A'}</td>
                                <td>${formatCurrency(strategy.targetAmount || 0)}</td>
                                <td>${formatCurrency(strategy.currentValue || 0)}</td>
                                <td><span class="status-badge status-${strategy.status || 'pending'}">${strategy.status || 'pending'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <!-- Meetings -->
        ${meetings.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Meetings (${meetings.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Meeting Date</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${meetings.map(meeting => `
                            <tr>
                                <td>${formatDate(meeting.meetingDate)}</td>
                                <td>${meeting.meetingType || 'N/A'}</td>
                                <td><span class="status-badge status-${meeting.status || 'pending'}">${meeting.status || 'pending'}</span></td>
                                <td>${meeting.duration || 'N/A'}</td>
                                <td>${meeting.notes ? meeting.notes.substring(0, 50) + '...' : 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <!-- LOE Documents -->
        ${loeDocuments.length > 0 ? `
            <div class="section">
                <h2 class="section-title">LOE Documents (${loeDocuments.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Document Type</th>
                            <th>Status</th>
                            <th>Created Date</th>
                            <th>File Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${loeDocuments.map(loe => `
                            <tr>
                                <td>${loe.documentType || 'N/A'}</td>
                                <td><span class="status-badge status-${loe.status || 'pending'}">${loe.status || 'pending'}</span></td>
                                <td>${formatDate(loe.createdAt)}</td>
                                <td>${loe.fileName || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <!-- LOE Automation -->
        ${loeAutomation.length > 0 ? `
            <div class="section">
                <h2 class="section-title">LOE Automation (${loeAutomation.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Automation Type</th>
                            <th>Status</th>
                            <th>Last Run</th>
                            <th>Next Run</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${loeAutomation.map(automation => `
                            <tr>
                                <td>${automation.automationType || 'N/A'}</td>
                                <td><span class="status-badge status-${automation.status || 'pending'}">${automation.status || 'pending'}</span></td>
                                <td>${formatDate(automation.lastRun)}</td>
                                <td>${formatDate(automation.nextRun)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <!-- Client Invitations -->
        ${clientInvitations.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Client Invitations (${clientInvitations.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Invitation Type</th>
                            <th>Status</th>
                            <th>Sent Date</th>
                            <th>Response Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clientInvitations.map(invitation => `
                            <tr>
                                <td>${invitation.invitationType || 'N/A'}</td>
                                <td><span class="status-badge status-${invitation.status || 'pending'}">${invitation.status || 'pending'}</span></td>
                                <td>${formatDate(invitation.sentDate)}</td>
                                <td>${formatDate(invitation.responseDate)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <!-- AB Test Sessions -->
        ${abTestSessions.length > 0 ? `
            <div class="section">
                <h2 class="section-title">AB Test Sessions (${abTestSessions.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Test Name</th>
                            <th>Variant</th>
                            <th>Status</th>
                            <th>Start Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${abTestSessions.map(session => `
                            <tr>
                                <td>${session.testName || 'N/A'}</td>
                                <td>${session.variant || 'N/A'}</td>
                                <td><span class="status-badge status-${session.status || 'pending'}">${session.status || 'pending'}</span></td>
                                <td>${formatDate(session.startDate)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <!-- Chat History -->
        ${chatHistory.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Chat History (${chatHistory.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Message</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${chatHistory.slice(0, 10).map(chat => `
                            <tr>
                                <td>${formatDate(chat.timestamp)}</td>
                                <td>${chat.messageType || 'N/A'}</td>
                                <td>${chat.message ? chat.message.substring(0, 100) + '...' : 'N/A'}</td>
                                <td><span class="status-badge status-${chat.status || 'pending'}">${chat.status || 'pending'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        <!-- Tax Planning -->
        ${taxPlanning && Object.keys(taxPlanning).length > 0 ? `
            <div class="section">
                <h2 class="section-title">Tax Planning</h2>
                <div class="data-grid">
                    <div class="data-item">
                        <div class="data-label">Tax Status</div>
                        <div class="data-value">${taxPlanning.taxStatus || 'Not assessed'}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Last Updated</div>
                        <div class="data-value">${formatDate(taxPlanning.updatedAt)}</div>
                    </div>
                </div>
            </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <p><strong>${vault.firmName || 'Financial Advisory Firm'}</strong></p>
            <p>This report is confidential and intended solely for the addressee.</p>
            <p>Generated on ${formatDate(new Date())}</p>
        </div>
    </div>
</body>
</html>`;
  }
}

module.exports = SimplePDFGenerationService;
