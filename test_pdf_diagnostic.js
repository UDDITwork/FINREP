/**
 * FILE LOCATION: test_pdf_diagnostic.js
 * 
 * PURPOSE: Test script for PDF diagnostic tool
 * 
 * USAGE:
 * 1. Replace YOUR_CLIENT_ID with an actual client ID from your database
 * 2. Replace YOUR_ADVISOR_ID with an actual advisor ID
 * 3. Run: node test_pdf_diagnostic.js
 */

const axios = require('axios');

// Configuration - UPDATE THESE VALUES
const CONFIG = {
  baseURL: 'http://localhost:5000/api', // Update port if different
  clientId: '689948713515196131838949', // Replace with actual client ID
  advisorId: '6883ec3e2cc2c6df98e40604', // Replace with actual advisor ID
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODNlYzNlMmNjMmM2ZGY5OGU0MDYwNCIsImlhdCI6MTc1NzYzNTcxMSwiZXhwIjoxNzU4MjQwNTExfQ.IfQ-zUqCPRdvQi8vGDT143rD48PfbrUGM9U1N91htoo' // Get this from your authentication system
};

async function testPDFDiagnostic() {
  try {
    console.log('🔍 [PDF DIAGNOSTIC TEST] Starting diagnostic test...');
    console.log(`📍 [CONFIG] Client ID: ${CONFIG.clientId}`);
    console.log(`📍 [CONFIG] Base URL: ${CONFIG.baseURL}`);
    
    // Test 1: Run comprehensive diagnostic
    console.log('\n📊 [TEST 1] Running comprehensive PDF diagnostic...');
    const diagnosticResponse = await axios.get(
      `${CONFIG.baseURL}/pdf/diagnostic/${CONFIG.clientId}`,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (diagnosticResponse.data.success) {
      console.log('✅ [TEST 1] Diagnostic completed successfully');
      console.log('📋 [RESULTS] Diagnostic Summary:');
      console.log(`   • Overall Health: ${diagnosticResponse.data.diagnostics.summary.overallHealth}`);
      console.log(`   • Health Score: ${diagnosticResponse.data.diagnostics.summary.healthScore}`);
      console.log(`   • Critical Issues: ${diagnosticResponse.data.diagnostics.summary.criticalIssues}`);
      console.log(`   • Warnings: ${diagnosticResponse.data.diagnostics.summary.warnings}`);
      console.log(`   • Data Completeness: ${diagnosticResponse.data.diagnostics.summary.dataCompleteness}%`);
      
      // Display client ID analysis
      const clientIdAnalysis = diagnosticResponse.data.diagnostics.clientIdAnalysis;
      console.log('\n🔍 [CLIENT ID ANALYSIS]:');
      console.log(`   • Original ID: ${clientIdAnalysis.originalId}`);
      console.log(`   • ID Length: ${clientIdAnalysis.idLength}`);
      console.log(`   • Is Valid ObjectId: ${clientIdAnalysis.isValidObjectId}`);
      console.log(`   • Is Numeric: ${clientIdAnalysis.isNumeric}`);
      console.log(`   • Actual Format: ${clientIdAnalysis.actualFormat}`);
      console.log(`   • Recommended Strategy: ${clientIdAnalysis.recommendedStrategy}`);
      
      if (clientIdAnalysis.issues && clientIdAnalysis.issues.length > 0) {
        console.log('   • Issues:');
        clientIdAnalysis.issues.forEach(issue => console.log(`     - ${issue}`));
      }
      
      // Display search strategies
      const searchStrategies = diagnosticResponse.data.diagnostics.searchStrategies;
      console.log('\n🔍 [SEARCH STRATEGIES]:');
      searchStrategies.strategies.forEach(strategy => {
        const status = strategy.success ? '✅' : '❌';
        console.log(`   ${status} ${strategy.name}: ${strategy.success ? 'SUCCESS' : 'FAILED'}`);
        if (strategy.clientFound) {
          console.log(`     Found: ${strategy.clientFound.name} (${strategy.clientFound._id})`);
        }
        if (strategy.error) {
          console.log(`     Error: ${strategy.error}`);
        }
      });
      
      // Display data completeness
      const dataCompleteness = diagnosticResponse.data.diagnostics.dataCompleteness;
      if (dataCompleteness.summary) {
        console.log('\n📊 [DATA COMPLETENESS]:');
        console.log(`   • Total Collections: ${dataCompleteness.summary.totalCollections}`);
        console.log(`   • Available Collections: ${dataCompleteness.summary.availableCollections}`);
        console.log(`   • Completeness: ${dataCompleteness.summary.completenessPercentage}%`);
        console.log(`   • Total Records: ${dataCompleteness.summary.totalRecords}`);
        
        console.log('\n📋 [COLLECTION STATUS]:');
        dataCompleteness.collections.forEach(collection => {
          const status = collection.hasData ? '✅' : '❌';
          console.log(`   ${status} ${collection.name}: ${collection.count} records`);
          if (collection.error) {
            console.log(`     Error: ${collection.error}`);
          }
        });
      }
      
      // Display recommendations
      const recommendations = diagnosticResponse.data.diagnostics.recommendations;
      if (recommendations && recommendations.length > 0) {
        console.log('\n💡 [RECOMMENDATIONS]:');
        recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
          console.log(`      Solution: ${rec.solution}`);
          if (rec.code) {
            console.log(`      Code: ${rec.code}`);
          }
        });
      }
      
    } else {
      console.log('❌ [TEST 1] Diagnostic failed:', diagnosticResponse.data.message);
    }
    
    // Test 2: Test PDF generation with enhanced service
    console.log('\n📄 [TEST 2] Testing PDF generation with enhanced service...');
    
    // First, let's test with mock data to ensure the service works
    const testPDFResponse = await axios.post(
      `${CONFIG.baseURL}/pdf/test-generate`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.authToken}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer' // Important for PDF binary data
      }
    );
    
    if (testPDFResponse.status === 200) {
      console.log('✅ [TEST 2] Test PDF generation successful');
      console.log(`   • PDF Size: ${testPDFResponse.data.length} bytes`);
      console.log(`   • Content Type: ${testPDFResponse.headers['content-type']}`);
    } else {
      console.log('❌ [TEST 2] Test PDF generation failed');
    }
    
    // Test 3: List available clients for testing
    console.log('\n👥 [TEST 3] Listing available clients...');
    const clientsResponse = await axios.get(
      `${CONFIG.baseURL}/pdf/debug/clients`,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (clientsResponse.data.success) {
      console.log('✅ [TEST 3] Clients listed successfully');
      console.log(`   • Advisor ID: ${clientsResponse.data.advisorId}`);
      console.log(`   • Available Clients:`);
      clientsResponse.data.clients.forEach((client, index) => {
        console.log(`     ${index + 1}. ${client.name} (ID: ${client.id || client._id})`);
        console.log(`        Onboarding Step: ${client.onboardingStep}`);
        console.log(`        Has Custom ID: ${client.hasCustomId}`);
        console.log(`        Is Valid ObjectId: ${client.isValidObjectId}`);
      });
    } else {
      console.log('❌ [TEST 3] Failed to list clients:', clientsResponse.data.message);
    }
    
    console.log('\n🎯 [SUMMARY] Diagnostic test completed');
    console.log('📝 [NEXT STEPS]:');
    console.log('   1. Review the diagnostic results above');
    console.log('   2. If client ID issues are found, update your PDF controller to use the recommended search strategy');
    console.log('   3. If data completeness is low, ensure client onboarding is completed');
    console.log('   4. Use the enhanced PDF generation service for better error handling');
    
  } catch (error) {
    console.error('❌ [PDF DIAGNOSTIC TEST] Test failed:', error.message);
    
    if (error.response) {
      console.error('   • Status:', error.response.status);
      console.error('   • Message:', error.response.data?.message || 'No message');
      console.error('   • Error:', error.response.data?.error || 'No error details');
    }
    
    console.log('\n🔧 [TROUBLESHOOTING]:');
    console.log('   1. Ensure your backend server is running');
    console.log('   2. Check that the client ID exists in your database');
    console.log('   3. Verify your authentication token is valid');
    console.log('   4. Update the CONFIG values in this script with real data');
  }
}

// Run the test
if (require.main === module) {
  testPDFDiagnostic();
}

module.exports = { testPDFDiagnostic, CONFIG };
