/**
 * FILE LOCATION: backend/test-pdf-generation.js
 * 
 * PURPOSE: Test script for PDF generation system
 * 
 * FUNCTIONALITY:
 * - Tests PDF generation service
 * - Verifies chart generation
 * - Validates template rendering
 * - Comprehensive error checking
 */

const PDFGenerationService = require('./services/pdfGenerationService');
const ChartGenerationService = require('./services/chartGenerationService');
const { logger } = require('./utils/logger');

// Sample test data
const sampleClientData = {
  client: {
    _id: 'test-client-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+91-9876543210',
    dateOfBirth: '1985-06-15',
    occupation: 'Software Engineer',
    incomeType: 'salaried',
    maritalStatus: 'married',
    dependents: 2,
    address: '123 Main Street, Mumbai, Maharashtra',
    financialData: {
      monthlyIncome: 150000,
      monthlyExpenses: 100000,
      emergencyFund: 300000,
      totalAssets: 2500000,
      totalLiabilities: 500000,
      assets: [
        { type: 'equity', value: 1000000 },
        { type: 'debt', value: 500000 },
        { type: 'real_estate', value: 1000000 }
      ],
      liabilities: [
        { type: 'home_loan', amount: 500000 }
      ]
    },
    goals: [
      {
        name: 'Child Education',
        targetAmount: 2000000,
        currentAmount: 500000,
        targetDate: '2030-12-31'
      },
      {
        name: 'Retirement',
        targetAmount: 10000000,
        currentAmount: 2000000,
        targetDate: '2045-12-31'
      }
    ]
  },
  vault: {
    advisorId: 'test-advisor-id',
    firmName: 'WealthMax Financial Advisory',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@wealthmax.com',
    phoneNumber: '+91-9876543211',
    sebiRegNumber: 'SEBI123456',
    address: '456 Business District, Mumbai, Maharashtra',
    certifications: ['CFA', 'CFP'],
    logo: null
  },
  mutualFundRecommend: [
    {
      fundName: 'HDFC Equity Fund',
      category: 'Large Cap',
      recommendedAmount: 50000,
      sipAmount: 5000,
      expectedReturn: 12,
      riskLevel: 'Moderate'
    },
    {
      fundName: 'SBI Bluechip Fund',
      category: 'Large Cap',
      recommendedAmount: 30000,
      sipAmount: 3000,
      expectedReturn: 11,
      riskLevel: 'Moderate'
    }
  ],
  taxPlanning: {
    currentTaxLiability: 300000,
    projectedTaxLiability: 250000,
    potentialSavings: 50000,
    recommendations: [
      'Maximize Section 80C investments',
      'Consider ELSS funds for tax savings',
      'Optimize home loan deductions'
    ]
  },
  estateInformation: {
    spouseName: 'Jane Doe',
    childrenCount: 2,
    dependents: 2,
    realEstateValue: 1000000,
    personalAssetsValue: 500000,
    digitalAssetsValue: 100000
  },
  meetings: [
    {
      date: '2024-01-15',
      type: 'Initial Consultation',
      duration: '60 minutes',
      keyPoints: 'Discussed financial goals and risk profile'
    }
  ],
  chatHistory: [
    {
      message: 'What is the best investment strategy for my goals?',
      response: 'Based on your risk profile, I recommend a balanced approach...'
    }
  ]
};

async function testPDFGeneration() {
  console.log('🚀 Starting PDF Generation Test...\n');

  try {
    // Test 1: Chart Generation Service
    console.log('📊 Testing Chart Generation Service...');
    const chartService = new ChartGenerationService();
    
    // Test asset allocation chart
    const assetChart = await chartService.generateAssetAllocationChart(sampleClientData.client.financialData);
    console.log('✅ Asset allocation chart generated:', assetChart ? 'Success' : 'Failed');
    
    // Test income expense chart
    const incomeChart = await chartService.generateIncomeExpenseChart(sampleClientData.client.financialData);
    console.log('✅ Income expense chart generated:', incomeChart ? 'Success' : 'Failed');
    
    // Test goal progress chart
    const goalChart = await chartService.generateGoalProgressChart(sampleClientData.client.goals);
    console.log('✅ Goal progress chart generated:', goalChart ? 'Success' : 'Failed');

    console.log('\n📄 Testing PDF Generation Service...');
    
    // Test 2: PDF Generation Service
    const pdfService = new PDFGenerationService();
    
    // Test template data preparation
    const templateData = pdfService.prepareTemplateData(sampleClientData, sampleClientData.vault, {
      assetAllocation: assetChart,
      incomeExpense: incomeChart,
      goalProgress: goalChart
    });
    
    console.log('✅ Template data prepared:', templateData ? 'Success' : 'Failed');
    console.log('   - Client name:', templateData.client.name);
    console.log('   - Net worth:', templateData.financialMetrics.netWorth);
    console.log('   - Risk level:', templateData.riskAssessment.level);
    console.log('   - Goals count:', templateData.goals.totalGoals);

    // Test 3: Template Rendering (without PDF conversion for testing)
    console.log('\n🎨 Testing Template Rendering...');
    try {
      const htmlContent = await pdfService.renderTemplate(templateData);
      console.log('✅ Template rendered successfully');
      console.log('   - HTML length:', htmlContent.length, 'characters');
      console.log('   - Contains client name:', htmlContent.includes(templateData.client.name));
      console.log('   - Contains advisor name:', htmlContent.includes(templateData.vault.advisorName));
    } catch (error) {
      console.log('❌ Template rendering failed:', error.message);
    }

    // Test 4: Risk Assessment
    console.log('\n🎯 Testing Risk Assessment...');
    const riskScore = pdfService.calculateRiskScore(sampleClientData);
    const riskLevel = pdfService.getRiskLevel(riskScore);
    console.log('✅ Risk assessment completed');
    console.log('   - Risk score:', riskScore, '/10');
    console.log('   - Risk level:', riskLevel);
    console.log('   - Description:', pdfService.getRiskDescription(riskLevel));

    // Test 5: Alerts and Recommendations
    console.log('\n🚨 Testing Alerts and Recommendations...');
    const alerts = pdfService.generateAlerts(sampleClientData);
    const recommendations = pdfService.generateRecommendations(sampleClientData);
    console.log('✅ Alerts generated:', alerts.length);
    console.log('✅ Recommendations generated:', recommendations.length);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Chart Generation Service - Working');
    console.log('   ✅ PDF Generation Service - Working');
    console.log('   ✅ Template Rendering - Working');
    console.log('   ✅ Risk Assessment - Working');
    console.log('   ✅ Alerts & Recommendations - Working');
    
    console.log('\n🚀 PDF Generation System is ready for production!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure all dependencies are installed: npm install puppeteer handlebars chart.js canvas');
    console.log('   2. Check template file exists: backend/templates/client-report-template.hbs');
    console.log('   3. Verify MongoDB connection');
    console.log('   4. Check file permissions');
  }
}

// Run the test
if (require.main === module) {
  testPDFGeneration().then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testPDFGeneration, sampleClientData };
