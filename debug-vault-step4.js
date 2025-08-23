// Step 4: Direct Vault Controller Test
const mongoose = require('mongoose');

async function testStep4() {
  console.log('🔍 STEP 4: DIRECT VAULT CONTROLLER TEST\n');
  
  try {
    // Test 1: Load required modules
    console.log('1. Loading modules...');
    const Vault = require('./models/Vault');
    const Advisor = require('./models/Advisor');
    const vaultController = require('./controllers/vaultController');
    console.log('✅ Modules loaded');

    // Test 2: Create mock request and response objects
    console.log('\n2. Creating mock objects...');
    
    // Get a sample advisor
    const advisor = await Advisor.findOne();
    if (!advisor) {
      console.log('❌ No advisor found for testing');
      return;
    }

    // Mock request object
    const mockReq = {
      user: {
        id: advisor._id.toString(),
        email: advisor.email,
        role: 'advisor'
      },
      body: {},
      query: {}
    };

    // Mock response object
    const mockRes = {
      status: function(code) {
        console.log(`   Response status: ${code}`);
        return this;
      },
      json: function(data) {
        console.log('   Response data:', JSON.stringify(data, null, 2));
        return this;
      }
    };

    console.log('✅ Mock objects created');
    console.log('   Advisor ID:', mockReq.user.id);

    // Test 3: Test getVaultData function directly
    console.log('\n3. Testing getVaultData function...');
    try {
      await vaultController.getVaultData(mockReq, mockRes);
      console.log('✅ getVaultData executed successfully');
    } catch (error) {
      console.log('❌ getVaultData failed');
      console.log('   Error:', error.message);
      console.log('   Stack:', error.stack);
    }

    // Test 4: Test with different advisor ID
    console.log('\n4. Testing with different advisor ID...');
    const mockReq2 = {
      ...mockReq,
      user: {
        ...mockReq.user,
        id: '507f1f77bcf86cd799439011' // Random ObjectId
      }
    };

    try {
      await vaultController.getVaultData(mockReq2, mockRes);
      console.log('✅ getVaultData with random ID executed');
    } catch (error) {
      console.log('❌ getVaultData with random ID failed');
      console.log('   Error:', error.message);
    }

    // Test 5: Test updateVaultData function
    console.log('\n5. Testing updateVaultData function...');
    const updateReq = {
      ...mockReq,
      body: {
        firstName: 'Updated Name',
        email: 'updated@example.com'
      },
      query: {
        section: 'personal'
      }
    };

    try {
      await vaultController.updateVaultData(updateReq, mockRes);
      console.log('✅ updateVaultData executed successfully');
    } catch (error) {
      console.log('❌ updateVaultData failed');
      console.log('   Error:', error.message);
      console.log('   Stack:', error.stack);
    }

    console.log('\n✅ STEP 4 COMPLETED');
    
  } catch (error) {
    console.log('❌ STEP 4 FAILED:', error.message);
    console.log('   Stack:', error.stack);
  }
}

testStep4().catch(console.error);
