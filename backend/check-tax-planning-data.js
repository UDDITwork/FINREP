/**
 * Check exactly what data is being saved in tax planning
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { generateAIRecommendations } = require('./controllers/taxPlanningController');

async function checkTaxPlanningData() {
  console.log('🔍 Checking Tax Planning Data Structure...\n');
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Use real client ID from database
    const clientId = '687d5781cd2a759b14087160';
    
    // Create mock request and response objects
    const mockReq = {
      params: { clientId },
      body: { taxYear: new Date().getFullYear().toString() },
      advisor: { id: '687c80ff3be6f9e1b846a467' } // Real advisor ID
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`\n📡 Response Status: ${code}`);
          console.log('📊 Response Data Structure:');
          console.log('=====================================');
          
          if (data.success && data.data) {
            console.log('\n✅ SUCCESS RESPONSE STRUCTURE:');
            console.log('data.success:', data.success);
            console.log('data.message:', data.message);
            
            if (data.data.taxPlanning) {
              console.log('\n📋 TAX PLANNING DATA SAVED:');
              console.log('=====================================');
              
              const tp = data.data.taxPlanning;
              console.log('\n🔑 PRIMARY IDENTIFICATION:');
              console.log('- clientId:', tp.clientId);
              console.log('- advisorId:', tp.advisorId);
              console.log('- taxYear:', tp.taxYear);
              console.log('- _id:', tp._id);
              console.log('- createdAt:', tp.createdAt);
              console.log('- updatedAt:', tp.updatedAt);
              
              console.log('\n👤 PERSONAL TAX INFO:');
              if (tp.personalTaxInfo) {
                console.log('- panNumber:', tp.personalTaxInfo.panNumber);
                console.log('- aadharNumber:', tp.personalTaxInfo.aadharNumber);
                console.log('- dateOfBirth:', tp.personalTaxInfo.dateOfBirth);
                console.log('- maritalStatus:', tp.personalTaxInfo.maritalStatus);
                console.log('- numberOfDependents:', tp.personalTaxInfo.numberOfDependents);
                console.log('- address:', tp.personalTaxInfo.address);
              }
              
              console.log('\n💰 INCOME ANALYSIS:');
              if (tp.incomeAnalysis) {
                console.log('- totalAnnualIncome:', tp.incomeAnalysis.totalAnnualIncome);
                console.log('- monthlyIncome:', tp.incomeAnalysis.monthlyIncome);
                console.log('- incomeType:', tp.incomeAnalysis.incomeType);
                console.log('- employerBusinessName:', tp.incomeAnalysis.employerBusinessName);
                console.log('- additionalIncome:', tp.incomeAnalysis.additionalIncome);
              }
              
              console.log('\n💼 TAX SAVING INVESTMENTS:');
              if (tp.taxSavingInvestments) {
                console.log('Section 80C:');
                console.log('  - ppf:', tp.taxSavingInvestments.section80C?.ppf);
                console.log('  - epf:', tp.taxSavingInvestments.section80C?.epf);
                console.log('  - elss:', tp.taxSavingInvestments.section80C?.elss);
                console.log('  - nsc:', tp.taxSavingInvestments.section80C?.nsc);
                console.log('  - lifeInsurance:', tp.taxSavingInvestments.section80C?.lifeInsurance);
                console.log('  - tuitionFees:', tp.taxSavingInvestments.section80C?.tuitionFees);
                console.log('  - principalRepayment:', tp.taxSavingInvestments.section80C?.principalRepayment);
                console.log('  - total80C:', tp.taxSavingInvestments.section80C?.total80C);
                
                console.log('Section 80D (Health Insurance):');
                console.log('  - selfFamily:', tp.taxSavingInvestments.section80D?.selfFamily);
                console.log('  - parents:', tp.taxSavingInvestments.section80D?.parents);
                console.log('  - seniorCitizen:', tp.taxSavingInvestments.section80D?.seniorCitizen);
                console.log('  - total80D:', tp.taxSavingInvestments.section80D?.total80D);
                
                console.log('Section 80CCD(1B) (NPS Additional):');
                console.log('  - npsAdditional:', tp.taxSavingInvestments.section80CCD1B?.npsAdditional);
              }
              
              console.log('\n📈 CAPITAL GAINS ANALYSIS:');
              if (tp.capitalGainsAnalysis) {
                console.log('Equity Investments:');
                console.log('  - directStocks currentValue:', tp.capitalGainsAnalysis.equityInvestments?.directStocks?.currentValue);
                console.log('  - directStocks purchaseValue:', tp.capitalGainsAnalysis.equityInvestments?.directStocks?.purchaseValue);
                console.log('  - mutualFunds currentValue:', tp.capitalGainsAnalysis.equityInvestments?.mutualFunds?.currentValue);
                console.log('  - mutualFunds purchaseValue:', tp.capitalGainsAnalysis.equityInvestments?.mutualFunds?.purchaseValue);
                
                console.log('Debt Investments:');
                console.log('  - bondsDebentures currentValue:', tp.capitalGainsAnalysis.debtInvestments?.bondsDebentures?.currentValue);
                console.log('  - bondsDebentures purchaseValue:', tp.capitalGainsAnalysis.debtInvestments?.bondsDebentures?.purchaseValue);
                
                console.log('Real Estate:');
                console.log('  - properties count:', tp.capitalGainsAnalysis.realEstate?.properties?.length || 0);
              }
              
              console.log('\n🏢 BUSINESS TAX CONSIDERATIONS:');
              if (tp.businessTaxConsiderations) {
                console.log('- businessIncome:', tp.businessTaxConsiderations.businessIncome);
                console.log('- businessExpenses:', tp.businessTaxConsiderations.businessExpenses);
                console.log('- professionalIncome:', tp.businessTaxConsiderations.professionalIncome);
                console.log('- professionalExpenses:', tp.businessTaxConsiderations.professionalExpenses);
              }
              
              console.log('\n🤖 AI RECOMMENDATIONS:');
              if (tp.aiRecommendations) {
                console.log('- generatedAt:', tp.aiRecommendations.generatedAt);
                console.log('- totalPotentialSavings:', tp.aiRecommendations.totalPotentialSavings);
                console.log('- confidenceScore:', tp.aiRecommendations.confidenceScore);
                console.log('- summary:', tp.aiRecommendations.summary);
                console.log('- recommendations count:', tp.aiRecommendations.recommendations?.length || 0);
                
                if (tp.aiRecommendations.recommendations?.length > 0) {
                  console.log('\n📝 RECOMMENDATION DETAILS:');
                  tp.aiRecommendations.recommendations.forEach((rec, index) => {
                    console.log(`\nRecommendation ${index + 1}:`);
                    console.log('  - category:', rec.category);
                    console.log('  - priority:', rec.priority);
                    console.log('  - title:', rec.title);
                    console.log('  - description:', rec.description?.substring(0, 100) + '...');
                    console.log('  - potentialSavings:', rec.potentialSavings);
                    console.log('  - riskLevel:', rec.riskLevel);
                    console.log('  - deadline:', rec.deadline);
                    console.log('  - implementationSteps count:', rec.implementationSteps?.length || 0);
                  });
                }
              }
              
              console.log('\n📊 VISUALIZATION DATA:');
              if (data.data.visualizationData) {
                const vd = data.data.visualizationData;
                console.log('\nBEFORE vs AFTER COMPARISON:');
                if (vd.beforeAfterComparison) {
                  console.log('- totalSavings:', vd.beforeAfterComparison.totalSavings);
                  console.log('- savingsPercentage:', vd.beforeAfterComparison.savingsPercentage + '%');
                  console.log('- current totalTaxLiability:', vd.beforeAfterComparison.current?.totalTaxLiability);
                  console.log('- optimized totalTaxLiability:', vd.beforeAfterComparison.optimized?.totalTaxLiability);
                }
                
                console.log('\nCHARTS DATA:');
                if (vd.charts) {
                  console.log('- taxLiabilityComparison:', vd.charts.taxLiabilityComparison?.type);
                  console.log('- deductionUtilization:', vd.charts.deductionUtilization?.type);
                  console.log('- savingsBreakdown:', vd.charts.savingsBreakdown?.type);
                  console.log('- implementationTimeline:', vd.charts.implementationTimeline?.type);
                }
                
                console.log('\nIMPLEMENTATION TIMELINE:');
                if (vd.implementationTimeline) {
                  console.log('- timeline items count:', vd.implementationTimeline.length);
                  vd.implementationTimeline.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.title} - Deadline: ${item.deadline} - Savings: ₹${item.potentialSavings}`);
                  });
                }
                
                console.log('\nSUMMARY:');
                if (vd.summary) {
                  console.log('- totalRecommendations:', vd.summary.totalRecommendations);
                  console.log('- highPriorityRecommendations:', vd.summary.highPriorityRecommendations);
                  console.log('- estimatedImplementationTime:', vd.summary.estimatedImplementationTime);
                  console.log('- riskLevel:', vd.summary.riskLevel);
                }
              }
            }
          } else {
            console.log('\n❌ ERROR RESPONSE:');
            console.log('success:', data.success);
            console.log('message:', data.message);
            console.log('error:', data.error);
          }
          
          return { status: code, json: (data) => data };
        }
      }),
      json: (data) => {
        console.log('📊 Response Data:', JSON.stringify(data, null, 2));
        return data;
      }
    };
    
    console.log(`\n🤖 Testing AI recommendations for client: ${clientId}`);
    console.log('📅 Tax Year:', mockReq.body.taxYear);
    console.log('👤 Advisor ID:', mockReq.advisor.id);
    
    // Call the function directly
    await generateAIRecommendations(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the test
checkTaxPlanningData().then(() => {
  console.log('\n🏁 Data structure check completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});
