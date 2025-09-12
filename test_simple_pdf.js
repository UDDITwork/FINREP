/**
 * Quick test for the simple PDF service
 */

const SimplePDFGenerationService = require('./backend/services/simplePdfGenerationService');

async function testSimplePDF() {
  try {
    console.log('🧪 [SIMPLE PDF TEST] Testing simple PDF service...');
    
    const pdfService = new SimplePDFGenerationService();
    
    // Mock data
    const mockClientData = {
      client: {
        firstName: 'REKHA',
        lastName: 'SAXENA',
        email: 'rekha@example.com',
        phoneNumber: '+91-9876543210',
        panNumber: 'ABCDE1234F',
        occupation: 'Software Engineer',
        onboardingStep: 5,
        totalMonthlyIncome: 150000,
        totalMonthlyExpenses: 80000,
        netWorth: 500000
      },
      financialPlans: [
        { planType: 'Retirement', status: 'active', createdAt: new Date(), version: '1.0' }
      ],
      mutualFundRecommend: [
        { fundName: 'HDFC Equity Fund', fundHouseName: 'HDFC', recommendedMonthlySIP: 10000, riskProfile: 'Moderate' }
      ],
      taxPlanning: {
        taxStatus: 'Optimized',
        updatedAt: new Date()
      }
    };
    
    const mockVaultData = {
      firmName: 'Test Financial Advisory',
      firstName: 'Advisor',
      lastName: 'Name',
      sebiRegNumber: 'SEBI123456'
    };
    
    console.log('🔄 [SIMPLE PDF TEST] Generating PDF...');
    const pdfBuffer = await pdfService.generateClientReport(mockClientData, mockVaultData);
    
    console.log('✅ [SIMPLE PDF TEST] PDF generated successfully!');
    console.log(`📊 [SIMPLE PDF TEST] PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    
    // Save test PDF
    const fs = require('fs');
    fs.writeFileSync('test_output.pdf', pdfBuffer);
    console.log('💾 [SIMPLE PDF TEST] PDF saved as test_output.pdf');
    
  } catch (error) {
    console.error('❌ [SIMPLE PDF TEST] Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSimplePDF();
