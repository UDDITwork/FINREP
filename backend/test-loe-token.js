// Test script to check LOE token
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import LOE model
const LOE = require('./models/LOE');

async function testLOEToken() {
  try {
    const token = 'a58fc1bc8838d22d140845b9d63df4585be758f2795ea34ea5fa78e4e4b9be54';
    
    console.log('🔍 Testing LOE token:', token);
    
    // Check if LOE exists with this token
    const loe = await LOE.findOne({ accessToken: token });
    
    if (!loe) {
      console.log('❌ LOE not found with this token');
      
      // Check all LOEs to see what tokens exist
      const allLOEs = await LOE.find({}).select('accessToken status createdAt expiresAt');
      console.log('📋 All LOEs in database:', allLOEs);
      
      return;
    }
    
    console.log('✅ LOE found:', {
      id: loe._id,
      status: loe.status,
      createdAt: loe.createdAt,
      expiresAt: loe.expiresAt,
      isExpired: loe.expiresAt < new Date(),
      clientId: loe.clientId,
      advisorId: loe.advisorId
    });
    
    // Check if expired
    if (loe.expiresAt < new Date()) {
      console.log('⚠️ LOE is expired');
    }
    
    // Check client data
    if (loe.clientId) {
      console.log('👤 Client ID:', loe.clientId);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testLOEToken();
