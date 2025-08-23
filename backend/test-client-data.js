// Test script to check client data
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import models
const LOE = require('./models/LOE');
const Client = require('./models/Client');
const ClientInvitation = require('./models/ClientInvitation');

async function testClientData() {
  try {
    const clientId = '6896eebc30e29d6131b45d89';
    
    console.log('🔍 Testing client ID:', clientId);
    
    // Check in Client collection
    const client = await Client.findById(clientId);
    if (client) {
      console.log('✅ Client found in Client collection:', {
        id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email
      });
    } else {
      console.log('❌ Client not found in Client collection');
    }
    
    // Check in ClientInvitation collection
    const invitation = await ClientInvitation.findById(clientId);
    if (invitation) {
      console.log('✅ Client found in ClientInvitation collection:', {
        id: invitation._id,
        clientFirstName: invitation.clientFirstName,
        clientLastName: invitation.clientLastName,
        clientEmail: invitation.clientEmail
      });
    } else {
      console.log('❌ Client not found in ClientInvitation collection');
    }
    
    // Test LOE.findByToken with population
    const token = 'a58fc1bc8838d22d140845b9d63df4585be758f2795ea34ea5fa78e4e4b9be54';
    console.log('\n🔍 Testing LOE.findByToken with token:', token);
    
    const loe = await LOE.findByToken(token);
    if (loe) {
      console.log('✅ LOE found with findByToken:', {
        id: loe._id,
        status: loe.status,
        clientId: loe.clientId,
        clientIdType: typeof loe.clientId,
        clientIdIsObject: typeof loe.clientId === 'object',
        hasClientFirstName: loe.clientId?.firstName,
        advisorId: loe.advisorId,
        advisorIdType: typeof loe.advisorId,
        advisorIdIsObject: typeof loe.advisorId === 'object',
        hasAdvisorFirstName: loe.advisorId?.firstName
      });
    } else {
      console.log('❌ LOE not found with findByToken');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testClientData();
