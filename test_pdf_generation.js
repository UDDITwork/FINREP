/**
 * Test script for PDF generation service
 * This will help identify why the fallback PDF is being generated
 */

const PDFGenerationService = require('./backend/services/pdfGenerationService');
const { logger } = require('./backend/utils/logger');

async function testPDFGeneration() {
  try {
    console.log('🧪 [PDF TEST] Starting PDF generation test...');
    
    const pdfService = new PDFGenerationService();
    
    // Create test client data
    const testClientData = {
      client: {
        _id: 'test-client-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+91-9876543210',
        dateOfBirth: '1990-01-01',
        panNumber: 'ABCDE1234F',
        maritalStatus: 'Married',
        numberOfDependents: 2,
        gender: 'male',
        address: {
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        occupation: 'Software Engineer',
        employerBusinessName: 'Tech Corp',
        totalMonthlyIncome: 100000,
        incomeType: 'Salaried',
        totalMonthlyExpenses: 60000,
        annualIncome: 1200000,
        additionalIncome: 0,
        retirementPlanning: {
          currentAge: 34,
          retirementAge: 60,
          hasRetirementCorpus: true,
          currentRetirementCorpus: 500000,
          targetRetirementCorpus: 10000000
        },
        majorGoals: [
          {
            goalName: 'Child Education',
            targetAmount: 2000000,
            targetYear: 2035,
            priority: 'High'
          }
        ],
        assets: {
          cashBankSavings: 200000,
          realEstate: 5000000,
          investments: {
            equity: {
              mutualFunds: 300000,
              directStocks: 100000
            },
            fixedIncome: {
              ppf: 100000,
              epf: 150000,
              nps: 50000,
              fixedDeposits: 200000
            }
          }
        },
        debtsAndLiabilities: {
          homeLoan: {
            hasLoan: true,
            outstandingAmount: 3000000,
            monthlyEMI: 25000,
            interestRate: 8.5
          },
          creditCards: {
            hasDebt: true,
            totalOutstanding: 50000,
            monthlyPayment: 5000
          }
        },
        insuranceCoverage: {
          lifeInsurance: {
            hasInsurance: true,
            totalCoverAmount: 10000000,
            annualPremium: 50000,
            insuranceType: 'Term Life'
          },
          healthInsurance: {
            hasInsurance: true,
            totalCoverAmount: 500000,
            annualPremium: 15000,
            familyMembers: 4
          }
        },
        enhancedFinancialGoals: {
          emergencyFund: {
            priority: 'High',
            targetAmount: 360000
          },
          childEducation: {
            isApplicable: true,
            targetAmount: 2000000,
            targetYear: 2035
          }
        },
        formProgress: {
          step1Completed: true,
          step2Completed: true,
          step3Completed: true,
          step4Completed: true,
          step5Completed: true,
          step6Completed: true,
          step7Completed: true,
          currentStep: 7
        },
        kycStatus: 'completed',
        status: 'active'
      }
    };
    
    // Create test vault data
    const testVaultData = {
      advisorId: 'test-advisor-123',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@advisor.com',
      firmName: 'Financial Advisory Firm',
      sebiRegNumber: 'SEBI123456',
      status: 'active'
    };
    
    console.log('📊 [PDF TEST] Test data prepared');
    console.log('   - Client:', testClientData.client.firstName, testClientData.client.lastName);
    console.log('   - Advisor:', testVaultData.firstName, testVaultData.lastName);
    
    // Generate PDF
    console.log('🔄 [PDF TEST] Generating PDF...');
    const pdfBuffer = await pdfService.generateClientReport(testClientData, testVaultData);
    
    console.log('✅ [PDF TEST] PDF generated successfully!');
    console.log('   - PDF Size:', `${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log('   - Buffer Type:', typeof pdfBuffer);
    console.log('   - Is Buffer:', Buffer.isBuffer(pdfBuffer));
    
    if (pdfBuffer.length < 50000) {
      console.log('⚠️ [PDF TEST] WARNING: PDF size is very small, likely fallback PDF');
    } else {
      console.log('✅ [PDF TEST] PDF size looks good, likely full template rendered');
    }
    
    // Save test PDF
    const fs = require('fs');
    const testPdfPath = './test_generated_report.pdf';
    fs.writeFileSync(testPdfPath, pdfBuffer);
    console.log('💾 [PDF TEST] Test PDF saved to:', testPdfPath);
    
  } catch (error) {
    console.error('❌ [PDF TEST] Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testPDFGeneration();
