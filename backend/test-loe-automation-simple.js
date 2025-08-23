// Test script for simplified LOE Automation system
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import models
const Client = require('./models/Client');
const Advisor = require('./models/Advisor');
const LOEAutomation = require('./models/LOEAutomation');

async function testLOEAutomationSimple() {
  try {
    console.log('🔍 Testing Simplified LOE Automation System...');
    
    // Test 1: Check if client exists
    const clientId = '689948713515196131838949';
    const advisorId = '6883ec3e2cc2c6df98e40604';
    
    console.log('📋 Test 1: Checking client existence...');
    const client = await Client.findOne({ 
      _id: clientId, 
      advisor: advisorId 
    }).lean();
    
    if (client) {
      console.log('✅ Client found:', {
        id: client._id,
        name: `${client.firstName || client.personalInfo?.firstName || ''} ${client.lastName || client.personalInfo?.lastName || ''}`.trim(),
        email: client.email || client.personalInfo?.email || ''
      });
    } else {
      console.log('❌ Client not found');
      return;
    }
    
    // Test 2: Create a new LOE using LOEAutomation model
    console.log('\n📄 Test 2: Creating LOE using LOEAutomation model...');
    const testLOE = new LOEAutomation({
      advisorId: advisorId,
      clientId: clientId,
      content: {
        customNotes: 'Test LOE for simplified automation system'
      }
    });
    
    console.log('📄 Test LOE object before save:', {
      advisorId: testLOE.advisorId,
      clientId: testLOE.clientId,
      hasAccessToken: !!testLOE.accessToken,
      status: testLOE.status
    });
    
    // Save the LOE to trigger pre-save hook
    await testLOE.save();
    
    console.log('📄 Test LOE object after save:', {
      advisorId: testLOE.advisorId,
      clientId: testLOE.clientId,
      hasAccessToken: !!testLOE.accessToken,
      accessToken: testLOE.accessToken,
      status: testLOE.status,
      clientAccessUrl: testLOE.clientAccessUrl
    });
    
    // Test 3: Test findByToken method
    console.log('\n🔍 Test 3: Testing findByToken method...');
    const foundLOE = await LOEAutomation.findByToken(testLOE.accessToken);
    
    if (foundLOE) {
      console.log('✅ LOE found by token:', {
        id: foundLOE._id,
        status: foundLOE.status,
        hasAdvisorData: !!foundLOE.advisorId,
        advisorName: foundLOE.advisorId ? `${foundLOE.advisorId.firstName} ${foundLOE.advisorId.lastName}` : 'N/A'
      });
    } else {
      console.log('❌ LOE not found by token');
    }
    
    // Test 4: Test markAsSent method
    console.log('\n📤 Test 4: Testing markAsSent method...');
    await testLOE.markAsSent();
    console.log('✅ LOE marked as sent:', {
      status: testLOE.status,
      sentAt: testLOE.sentAt,
      expiresAt: testLOE.expiresAt
    });
    
    // Test 5: Test markAsViewed method
    console.log('\n👁️ Test 5: Testing markAsViewed method...');
    await testLOE.markAsViewed('127.0.0.1', 'Test User Agent');
    console.log('✅ LOE marked as viewed:', {
      status: testLOE.status,
      viewedAt: testLOE.viewedAt
    });
    
    // Test 6: Test saveSignature method
    console.log('\n✍️ Test 6: Testing saveSignature method...');
    const testSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    await testLOE.saveSignature(testSignature, '127.0.0.1', 'Test User Agent');
    console.log('✅ LOE signature saved:', {
      status: testLOE.status,
      signedAt: testLOE.signedAt,
      hasSignature: !!testLOE.signatures?.client?.data
    });
    
    // Test 7: Test isExpired method
    console.log('\n⏰ Test 7: Testing isExpired method...');
    const isExpired = testLOE.isExpired();
    console.log('✅ LOE expiration check:', {
      isExpired: isExpired,
      expiresAt: testLOE.expiresAt
    });
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testLOEAutomationSimple();
