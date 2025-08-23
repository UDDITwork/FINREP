// Step 3: Direct Vault Model Test
const mongoose = require('mongoose');

async function testStep3() {
  console.log('🔍 STEP 3: DIRECT VAULT MODEL TEST\n');
  
  try {
    // Test 1: Load models
    console.log('1. Loading models...');
    const Vault = require('./models/Vault');
    const Advisor = require('./models/Advisor');
    console.log('✅ Models loaded');

    // Test 2: Get a sample advisor
    console.log('\n2. Finding sample advisor...');
    const advisor = await Advisor.findOne();
    if (!advisor) {
      console.log('❌ No advisor found in database');
      console.log('   Please create an advisor first or check database connection');
      return;
    }
    
    console.log('✅ Sample advisor found:');
    console.log('   ID:', advisor._id);
    console.log('   Name:', `${advisor.firstName} ${advisor.lastName}`);
    console.log('   Email:', advisor.email);

    // Test 3: Check if vault exists for this advisor
    console.log('\n3. Checking existing vault...');
    const existingVault = await Vault.findOne({ advisorId: advisor._id });
    if (existingVault) {
      console.log('✅ Existing vault found');
      console.log('   Vault ID:', existingVault._id);
      console.log('   Created:', existingVault.createdAt);
    } else {
      console.log('⚠️ No existing vault found for this advisor');
    }

    // Test 4: Test vault creation
    console.log('\n4. Testing vault creation...');
    try {
      const testVaultData = {
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
      };

      console.log('   Creating test vault with data:', Object.keys(testVaultData));
      
      const testVault = new Vault(testVaultData);
      await testVault.save();
      
      console.log('✅ Test vault created successfully');
      console.log('   Vault ID:', testVault._id);
      
      // Clean up - delete the test vault
      await Vault.findByIdAndDelete(testVault._id);
      console.log('✅ Test vault cleaned up');
      
    } catch (saveError) {
      console.log('❌ Vault creation failed');
      console.log('   Error:', saveError.message);
      
      if (saveError.errors) {
        console.log('   Validation errors:');
        Object.keys(saveError.errors).forEach(key => {
          console.log(`     - ${key}: ${saveError.errors[key].message}`);
        });
      }
      
      if (saveError.stack) {
        console.log('   Stack trace:', saveError.stack);
      }
    }

    // Test 5: Test vault schema validation
    console.log('\n5. Testing vault schema validation...');
    try {
      const invalidVault = new Vault({
        advisorId: advisor._id,
        // Missing required fields
      });
      
      await invalidVault.save();
      console.log('❌ Should have failed validation');
    } catch (validationError) {
      console.log('✅ Validation correctly failed');
      console.log('   Error type:', validationError.name);
      console.log('   Message:', validationError.message);
    }

    console.log('\n✅ STEP 3 COMPLETED');
    
  } catch (error) {
    console.log('❌ STEP 3 FAILED:', error.message);
    console.log('   Stack:', error.stack);
  }
}

testStep3().catch(console.error);
