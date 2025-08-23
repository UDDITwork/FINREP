// Test script to directly test the controller
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import models and controller
const LOE = require('./models/LOE');
const loeController = require('./controllers/loeController');

async function testController() {
  try {
    const token = 'a58fc1bc8838d22d140845b9d63df4585be758f2795ea34ea5fa78e4e4b9be54';
    
    console.log('🔍 Testing controller with token:', token);
    
    // Create mock request and response objects
    const req = {
      params: { token },
      ip: '127.0.0.1',
      get: (header) => 'Mozilla/5.0 (test)'
    };
    
    const res = {
      status: (code) => {
        console.log('📤 Response status:', code);
        return res;
      },
      json: (data) => {
        console.log('📤 Response data:', JSON.stringify(data, null, 2));
        return res;
      }
    };
    
    // Test the controller function
    await loeController.getLOEByToken(req, res);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testController();
