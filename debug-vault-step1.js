// Step 1: Basic Server and Database Connection Test
const axios = require('axios');
const mongoose = require('mongoose');

async function testStep1() {
  console.log('🔍 STEP 1: BASIC SERVER & DATABASE TEST\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    try {
      const response = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server is running');
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('❌ Server not running or health endpoint not available');
      console.log('   Error:', error.message);
      return;
    }

    // Test 2: Check database connection
    console.log('\n2. Testing database connection...');
    try {
      const connectionState = mongoose.connection.readyState;
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      console.log('   Database state:', states[connectionState]);
      
      if (connectionState === 1) {
        console.log('✅ Database connected');
      } else {
        console.log('❌ Database not connected');
        return;
      }
    } catch (error) {
      console.log('❌ Database test failed:', error.message);
      return;
    }

    // Test 3: Check if models can be loaded
    console.log('\n3. Testing model loading...');
    try {
      const Vault = require('./models/Vault');
      const Advisor = require('./models/Advisor');
      console.log('✅ Models loaded successfully');
      
      // Test basic queries
      const advisorCount = await Advisor.countDocuments();
      console.log('   Total advisors in database:', advisorCount);
      
      const vaultCount = await Vault.countDocuments();
      console.log('   Total vaults in database:', vaultCount);
      
    } catch (error) {
      console.log('❌ Model loading failed:', error.message);
      return;
    }

    console.log('\n✅ STEP 1 COMPLETED - Server and database are working');
    
  } catch (error) {
    console.log('❌ STEP 1 FAILED:', error.message);
  }
}

testStep1().catch(console.error);
