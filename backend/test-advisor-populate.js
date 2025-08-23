// Test script to check advisor population
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import models
const LOE = require('./models/LOE');
const Advisor = require('./models/Advisor');

async function testAdvisorPopulate() {
  try {
    const token = 'a58fc1bc8838d22d140845b9d63df4585be758f2795ea34ea5fa78e4e4b9be54';
    
    console.log('🔍 Testing advisor population with token:', token);
    
    // Test findByToken method
    const loe = await LOE.findByToken(token);
    
    if (loe) {
      console.log('✅ LOE found with findByToken:', {
        id: loe._id,
        status: loe.status,
        advisorId: loe.advisorId,
        advisorIdType: typeof loe.advisorId,
        advisorIdIsObject: typeof loe.advisorId === 'object',
        advisorIdIsNull: loe.advisorId === null,
        advisorIdIsUndefined: loe.advisorId === undefined,
        hasAdvisorFirstName: loe.advisorId?.firstName,
        advisorIdString: JSON.stringify(loe.advisorId)
      });
      
      // Test direct findOne without populate
      const loeDirect = await LOE.findOne({ accessToken: token });
      console.log('🔍 Direct LOE without populate:', {
        advisorId: loeDirect.advisorId,
        advisorIdType: typeof loeDirect.advisorId,
        advisorIdString: JSON.stringify(loeDirect.advisorId)
      });
      
      // Test with manual populate
      const loeManual = await LOE.findOne({ accessToken: token })
        .populate('advisorId', 'firstName lastName firmName email phone');
      
      console.log('🔍 Manual populated LOE:', {
        advisorId: loeManual.advisorId,
        advisorIdType: typeof loeManual.advisorId,
        advisorIdIsObject: typeof loeManual.advisorId === 'object',
        hasAdvisorFirstName: loeManual.advisorId?.firstName,
        advisorIdString: JSON.stringify(loeManual.advisorId)
      });
      
    } else {
      console.log('❌ LOE not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testAdvisorPopulate();
