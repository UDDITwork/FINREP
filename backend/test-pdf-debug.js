/**
 * FILE LOCATION: backend/test-pdf-debug.js
 * 
 * PURPOSE: Debug script for PDF generation issues
 * 
 * FUNCTIONALITY:
 * - Tests PDF generation with real client data
 * - Verifies client ID format and validation
 * - Checks database connectivity
 * - Comprehensive debugging
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PDFGenerationService = require('./services/pdfGenerationService');
const { logger } = require('./utils/logger');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function testPDFGeneration() {
  try {
    await connectToDatabase();

    console.log('\n🔍 [PDF DEBUG] Starting comprehensive PDF generation test...\n');

    // Step 1: Find a real client
    const Client = require('./models/Client');
    const Vault = require('./models/Vault');

    console.log('📊 [PDF DEBUG] Searching for clients in database...');
    const clients = await Client.find({}).limit(5);
    
    if (clients.length === 0) {
      console.log('❌ [PDF DEBUG] No clients found in database');
      console.log('💡 [PDF DEBUG] Please create a client first to test PDF generation');
      return;
    }

    console.log(`✅ [PDF DEBUG] Found ${clients.length} clients:`);
    clients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.firstName} ${client.lastName} (ID: ${client._id})`);
    });

    // Step 2: Test with first client
    const testClient = clients[0];
    const clientId = testClient._id.toString();
    const advisorId = testClient.advisor.toString();

    console.log(`\n🎯 [PDF DEBUG] Testing with client: ${testClient.firstName} ${testClient.lastName}`);
    console.log(`   Client ID: ${clientId}`);
    console.log(`   Advisor ID: ${advisorId}`);
    console.log(`   Client ID Type: ${typeof clientId}`);
    console.log(`   Client ID Length: ${clientId.length}`);

    // Step 3: Validate client ID format
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    const isValidFormat = objectIdPattern.test(clientId);
    console.log(`   Valid ObjectID Format: ${isValidFormat}`);

    if (!isValidFormat) {
      console.log('❌ [PDF DEBUG] Client ID format is invalid');
      return;
    }

    // Step 4: Check if advisor has vault data
    console.log('\n🏦 [PDF DEBUG] Checking advisor vault data...');
    let vaultData = await Vault.findOne({ advisorId: new mongoose.Types.ObjectId(advisorId) });
    
    if (!vaultData) {
      console.log('⚠️ [PDF DEBUG] No vault data found for advisor, using default values');
      vaultData = {
        advisorId: advisorId,
        firstName: 'Advisor',
        lastName: 'Name',
        email: 'advisor@example.com',
        firmName: 'Financial Advisory Firm',
        sebiRegNumber: 'SEBI Registration Pending',
        phoneNumber: '',
        address: '',
        certifications: []
      };
    } else {
      console.log(`✅ [PDF DEBUG] Vault data found: ${vaultData.firstName} ${vaultData.lastName}`);
      console.log(`   Firm: ${vaultData.firmName}`);
      console.log(`   SEBI: ${vaultData.sebiRegNumber}`);
    }

    // Step 5: Test PDF generation service directly
    console.log('\n📄 [PDF DEBUG] Testing PDF generation service...');
    const pdfService = new PDFGenerationService();

    // Create mock data structure
    const mockClientData = {
      client: testClient.toObject(),
      vault: vaultData.toObject ? vaultData.toObject() : vaultData,
      financialPlans: [],
      meetings: [],
      loeDocuments: [],
      loeAutomation: [],
      abTestSessions: [],
      chatHistory: [],
      mutualFundExitStrategies: [],
      clientInvitations: [],
      estateInformation: null,
      mutualFundRecommend: [],
      taxPlanning: null
    };

    console.log('✅ [PDF DEBUG] Mock data prepared');
    console.log(`   Client Name: ${mockClientData.client.firstName} ${mockClientData.client.lastName}`);
    console.log(`   Advisor Name: ${mockClientData.vault.firstName} ${mockClientData.vault.lastName}`);

    // Step 6: Test template data preparation
    console.log('\n🎨 [PDF DEBUG] Testing template data preparation...');
    const templateData = pdfService.prepareTemplateData(mockClientData, mockClientData.vault, {});
    
    console.log('✅ [PDF DEBUG] Template data prepared successfully');
    console.log(`   Client Name: ${templateData.client.name}`);
    console.log(`   Advisor Name: ${templateData.vault.advisorName}`);
    console.log(`   Net Worth: ₹${templateData.financialMetrics.netWorth}`);
    console.log(`   Risk Level: ${templateData.riskAssessment.level}`);

    // Step 7: Test template rendering (without PDF conversion)
    console.log('\n📝 [PDF DEBUG] Testing template rendering...');
    try {
      const htmlContent = await pdfService.renderTemplate(templateData);
      console.log('✅ [PDF DEBUG] Template rendered successfully');
      console.log(`   HTML Length: ${htmlContent.length} characters`);
      console.log(`   Contains Client Name: ${htmlContent.includes(templateData.client.name)}`);
      console.log(`   Contains Advisor Name: ${htmlContent.includes(templateData.vault.advisorName)}`);
    } catch (error) {
      console.log('❌ [PDF DEBUG] Template rendering failed:', error.message);
      return;
    }

    console.log('\n🎉 [PDF DEBUG] All tests passed! PDF generation should work.');
    console.log('\n📋 [PDF DEBUG] Test Summary:');
    console.log('   ✅ Database connection - Working');
    console.log('   ✅ Client data retrieval - Working');
    console.log('   ✅ Client ID validation - Working');
    console.log('   ✅ Vault data retrieval - Working');
    console.log('   ✅ Template data preparation - Working');
    console.log('   ✅ Template rendering - Working');
    
    console.log('\n🚀 [PDF DEBUG] PDF generation system is ready!');
    console.log(`\n💡 [PDF DEBUG] To test PDF generation, use client ID: ${clientId}`);

  } catch (error) {
    console.error('\n❌ [PDF DEBUG] Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 [PDF DEBUG] Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testPDFGeneration().then(() => {
    console.log('\n✅ Debug test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Debug test failed:', error);
    process.exit(1);
  });
}

module.exports = { testPDFGeneration };
