// Test script for LOE Automation API
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import models
const Client = require('./models/Client');
const LOE = require('./models/LOE');

async function testLOEAutomation() {
  try {
    console.log('🔍 Testing LOE Automation API...');
    
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
        email: client.email || client.personalInfo?.email || '',
        advisor: client.advisor
      });
    } else {
      console.log('❌ Client not found');
      return;
    }
    
    // Test 2: Check if meetingId is valid ObjectId
    const meetingId = '507f1f77bcf86cd799439011';
    console.log('📋 Test 2: Validating meetingId format...');
    
    if (mongoose.Types.ObjectId.isValid(meetingId)) {
      console.log('✅ MeetingId is valid ObjectId format');
    } else {
      console.log('❌ MeetingId is not valid ObjectId format');
    }
    
    // Test 3: Check existing LOEs for this client
    console.log('📋 Test 3: Checking existing LOEs...');
    const existingLOEs = await LOE.find({ 
      clientId: clientId,
      advisorId: advisorId
    }).lean();
    
    console.log('📄 Existing LOEs:', {
      count: existingLOEs.length,
      loes: existingLOEs.map(loe => ({
        id: loe._id,
        status: loe.status,
        createdAt: loe.createdAt,
        meetingId: loe.meetingId
      }))
    });
    
    // Test 4: Simulate LOE creation
    console.log('📋 Test 4: Simulating LOE creation...');
    
    const testLOE = new LOE({
      advisorId: advisorId,
      clientId: clientId,
      meetingId: meetingId,
      content: {
        customNotes: 'Test LOE creation'
      }
    });
    
    console.log('📄 Test LOE object before save:', {
      advisorId: testLOE.advisorId,
      clientId: testLOE.clientId,
      meetingId: testLOE.meetingId,
      hasAccessToken: !!testLOE.accessToken,
      status: testLOE.status
    });
    
    // Save the LOE to trigger pre-save hook
    await testLOE.save();
    
    console.log('📄 Test LOE object after save:', {
      advisorId: testLOE.advisorId,
      clientId: testLOE.clientId,
      meetingId: testLOE.meetingId,
      hasAccessToken: !!testLOE.accessToken,
      accessToken: testLOE.accessToken,
      status: testLOE.status,
      clientAccessUrl: testLOE.clientAccessUrl
    });
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testLOEAutomation();
