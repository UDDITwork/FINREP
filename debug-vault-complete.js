// Complete Vault API Debugging Script
const axios = require('axios');
const mongoose = require('mongoose');

async function runCompleteDebug() {
  console.log('🚀 COMPLETE VAULT API DEBUGGING\n');
  console.log('=====================================\n');
  
  try {
    // Step 1: Basic Server and Database Test
    console.log('🔍 STEP 1: BASIC SERVER & DATABASE TEST');
    console.log('----------------------------------------');
    
    // Check server
    try {
      const response = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server not running or health endpoint not available');
      console.log('   Error:', error.message);
      return;
    }

    // Check database
    const connectionState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    console.log('📊 Database state:', states[connectionState]);
    
    if (connectionState !== 1) {
      console.log('❌ Database not connected');
      return;
    }
    console.log('✅ Database connected');

    // Load models
    try {
      const Vault = require('./models/Vault');
      const Advisor = require('./models/Advisor');
      console.log('✅ Models loaded successfully');
      
      const advisorCount = await Advisor.countDocuments();
      const vaultCount = await Vault.countDocuments();
      console.log(`📊 Database stats: ${advisorCount} advisors, ${vaultCount} vaults`);
      
    } catch (error) {
      console.log('❌ Model loading failed:', error.message);
      return;
    }

    console.log('\n✅ STEP 1 COMPLETED\n');

    // Step 2: Authentication Test
    console.log('🔍 STEP 2: AUTHENTICATION TEST');
    console.log('--------------------------------');
    
    let token = null;
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (loginResponse.data.success) {
        token = loginResponse.data.token;
        console.log('✅ Login successful');
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Login request failed:', error.response?.data?.message || error.message);
    }

    // Test vault endpoint without auth
    try {
      await axios.get('http://localhost:5000/api/vault');
      console.log('❌ Should have failed without auth');
    } catch (error) {
      console.log('✅ Correctly failed without auth (Status:', error.response?.status, ')');
    }

    console.log('\n✅ STEP 2 COMPLETED\n');

    // Step 3: Vault API Test
    console.log('🔍 STEP 3: VAULT API TEST');
    console.log('---------------------------');
    
    if (token) {
      try {
        const vaultResponse = await axios.get('http://localhost:5000/api/vault', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Vault API call successful');
        console.log('   Status:', vaultResponse.status);
        console.log('   Success:', vaultResponse.data.success);
        
        if (vaultResponse.data.data) {
          console.log('   Data structure:', Object.keys(vaultResponse.data.data));
        }
        
      } catch (error) {
        console.log('❌ Vault API call failed');
        console.log('   Status:', error.response?.status);
        console.log('   Message:', error.response?.data?.message);
        console.log('   Full error:', error.response?.data);
      }
    } else {
      console.log('⚠️ Skipping vault test - no valid token');
    }

    console.log('\n✅ STEP 3 COMPLETED\n');

    // Step 4: Direct Model Test
    console.log('🔍 STEP 4: DIRECT MODEL TEST');
    console.log('------------------------------');
    
    try {
      const Vault = require('./models/Vault');
      const Advisor = require('./models/Advisor');
      
      const advisor = await Advisor.findOne();
      if (!advisor) {
        console.log('❌ No advisor found for testing');
      } else {
        console.log('✅ Sample advisor found:', advisor._id);
        
        // Test vault creation
        try {
          const testVault = new Vault({
            advisorId: advisor._id,
            firstName: advisor.firstName,
            lastName: advisor.lastName,
            email: advisor.email,
            phoneNumber: advisor.phoneNumber || '1234567890',
            firmName: advisor.firmName || 'Test Firm',
            sebiRegNumber: advisor.sebiRegNumber || 'SEBI123456',
            revenueModel: advisor.revenueModel || 'fee-based',
            fpsbNumber: advisor.fpsbNumber || 'FPSB123456',
            riaNumber: advisor.riaNumber || 'RIA123456',
            arnNumber: advisor.arnNumber || 'ARN123456',
            amfiRegNumber: advisor.amfiRegNumber || 'AMFI123456',
            isEmailVerified: advisor.isEmailVerified || false,
            status: advisor.status || 'active'
          });
          
          await testVault.save();
          console.log('✅ Test vault created successfully');
          
          // Clean up
          await Vault.findByIdAndDelete(testVault._id);
          console.log('✅ Test vault cleaned up');
          
        } catch (saveError) {
          console.log('❌ Vault creation failed');
          console.log('   Error:', saveError.message);
          
          if (saveError.errors) {
            Object.keys(saveError.errors).forEach(key => {
              console.log(`     - ${key}: ${saveError.errors[key].message}`);
            });
          }
        }
      }
      
    } catch (error) {
      console.log('❌ Direct model test failed:', error.message);
    }

    console.log('\n✅ STEP 4 COMPLETED\n');

    // Summary
    console.log('🎉 DEBUGGING COMPLETED');
    console.log('=====================');
    console.log('Check the results above to identify the issue with the vault API.');
    
  } catch (error) {
    console.log('💥 COMPLETE DEBUGGING FAILED:', error.message);
    console.log('   Stack:', error.stack);
  }
}

runCompleteDebug().catch(console.error);
