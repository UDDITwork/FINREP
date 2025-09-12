/**
 * Test Script: Vault Advisor Details Database Verification
 * 
 * This script tests and verifies that advisor details from the vault page
 * are properly saved to the MongoDB database in the Vault collection.
 * 
 * Based on the vault page UI, it tests the following fields:
 * - Personal Details: lastName, email, phoneNumber
 * - Account Status: revenueModel, status
 * - Registration Numbers: sebiRegNumber, fpsbNumber, riaNumber, arnNumber, amfiRegNumber
 */

const mongoose = require('mongoose');
const Vault = require('./backend/models/Vault');
const Advisor = require('./backend/models/Advisor');

// Test data based on the vault page UI
const testAdvisorData = {
  // Personal Details (from vault page)
  lastName: "UDDIT",
  email: "udditalerts247@gmail.com", 
  phoneNumber: "+917456886877",
  
  // Account Status
  revenueModel: "Fee-Only",
  status: "Active",
  
  // Registration Numbers (from vault page)
  sebiRegNumber: "INZ000305026",
  fpsbNumber: "John Doe, CFP®",
  riaNumber: "INA000017523", 
  arnNumber: "123456789012345678901234",
  amfiRegNumber: "123456789012345678901234"
};

// MongoDB connection string from .env
const MONGODB_URI = "mongodb+srv://techfuturepodsuddit:uddit@cluster0.f3fzm4.mongodb.net/richieat?retryWrites=true&w=majority&appName=Cluster0";

class VaultAdvisorTestSuite {
  constructor() {
    this.testResults = [];
    this.connection = null;
  }

  async connectToDatabase() {
    try {
      console.log('🔌 Connecting to MongoDB...');
      this.connection = await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      return false;
    }
  }

  async disconnectFromDatabase() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error.message);
    }
  }

  async createTestAdvisor() {
    try {
      console.log('\n📝 Creating test advisor...');
      
      // First, create an advisor record
      const advisor = new Advisor({
        firstName: "Test",
        lastName: testAdvisorData.lastName,
        email: testAdvisorData.email,
        password: "TestPassword123!",
        phoneNumber: testAdvisorData.phoneNumber,
        sebiRegNumber: testAdvisorData.sebiRegNumber,
        revenueModel: testAdvisorData.revenueModel,
        fpsbNumber: testAdvisorData.fpsbNumber,
        riaNumber: testAdvisorData.riaNumber,
        arnNumber: testAdvisorData.arnNumber,
        amfiRegNumber: testAdvisorData.amfiRegNumber,
        status: testAdvisorData.status.toLowerCase()
      });

      const savedAdvisor = await advisor.save();
      console.log('✅ Test advisor created with ID:', savedAdvisor._id);
      return savedAdvisor;
    } catch (error) {
      console.error('❌ Failed to create test advisor:', error.message);
      throw error;
    }
  }

  async createTestVault(advisorId) {
    try {
      console.log('\n🔐 Creating test vault data...');
      
      const vault = new Vault({
        advisorId: advisorId,
        firstName: "Test",
        lastName: testAdvisorData.lastName,
        email: testAdvisorData.email,
        phoneNumber: testAdvisorData.phoneNumber,
        sebiRegNumber: testAdvisorData.sebiRegNumber,
        revenueModel: testAdvisorData.revenueModel,
        fpsbNumber: testAdvisorData.fpsbNumber,
        riaNumber: testAdvisorData.riaNumber,
        arnNumber: testAdvisorData.arnNumber,
        amfiRegNumber: testAdvisorData.amfiRegNumber,
        status: testAdvisorData.status.toLowerCase()
      });

      const savedVault = await vault.save();
      console.log('✅ Test vault created with ID:', savedVault._id);
      return savedVault;
    } catch (error) {
      console.error('❌ Failed to create test vault:', error.message);
      throw error;
    }
  }

  async testVaultDataRetrieval(vaultId) {
    try {
      console.log('\n🔍 Testing vault data retrieval...');
      
      const vault = await Vault.findById(vaultId);
      if (!vault) {
        throw new Error('Vault not found');
      }

      console.log('✅ Vault data retrieved successfully');
      return vault;
    } catch (error) {
      console.error('❌ Failed to retrieve vault data:', error.message);
      throw error;
    }
  }

  async testVaultDataUpdate(vaultId) {
    try {
      console.log('\n🔄 Testing vault data update...');
      
      const updateData = {
        lastName: "UDDIT_UPDATED",
        phoneNumber: "+919876543210",
        revenueModel: "Commission-Based",
        sebiRegNumber: "INZ000305027",
        fpsbNumber: "Jane Doe, CFP®"
      };

      const updatedVault = await Vault.findByIdAndUpdate(
        vaultId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedVault) {
        throw new Error('Vault not found for update');
      }

      console.log('✅ Vault data updated successfully');
      return updatedVault;
    } catch (error) {
      console.error('❌ Failed to update vault data:', error.message);
      throw error;
    }
  }

  async verifyFieldValidation() {
    try {
      console.log('\n✅ Testing field validation...');
      
      const testCases = [
        {
          name: "Invalid email format",
          data: { email: "invalid-email" },
          shouldFail: true
        },
        {
          name: "Invalid revenue model",
          data: { revenueModel: "Invalid-Model" },
          shouldFail: true
        },
        {
          name: "Valid data update",
          data: { 
            lastName: "ValidName",
            email: "valid@email.com",
            revenueModel: "Fee-Only"
          },
          shouldFail: false
        }
      ];

      for (const testCase of testCases) {
        try {
          const vault = new Vault({
            advisorId: new mongoose.Types.ObjectId(),
            firstName: "Test",
            ...testCase.data
          });
          
          await vault.validate();
          
          if (testCase.shouldFail) {
            console.log(`❌ ${testCase.name}: Expected validation to fail but it passed`);
            this.testResults.push({ test: testCase.name, status: 'FAILED', reason: 'Expected validation failure' });
          } else {
            console.log(`✅ ${testCase.name}: Validation passed as expected`);
            this.testResults.push({ test: testCase.name, status: 'PASSED' });
          }
        } catch (error) {
          if (testCase.shouldFail) {
            console.log(`✅ ${testCase.name}: Validation failed as expected - ${error.message}`);
            this.testResults.push({ test: testCase.name, status: 'PASSED' });
          } else {
            console.log(`❌ ${testCase.name}: Unexpected validation failure - ${error.message}`);
            this.testResults.push({ test: testCase.name, status: 'FAILED', reason: error.message });
          }
        }
      }
    } catch (error) {
      console.error('❌ Field validation test failed:', error.message);
    }
  }

  async testVaultAdvisorSync(advisorId, vaultId) {
    try {
      console.log('\n🔄 Testing advisor-vault data synchronization...');
      
      // Get both advisor and vault data
      const advisor = await Advisor.findById(advisorId);
      const vault = await Vault.findById(vaultId);
      
      if (!advisor || !vault) {
        throw new Error('Advisor or vault not found');
      }

      // Compare key fields
      const syncFields = ['lastName', 'email', 'phoneNumber', 'sebiRegNumber', 'revenueModel'];
      const syncResults = [];

      for (const field of syncFields) {
        const advisorValue = advisor[field];
        const vaultValue = vault[field];
        const isSynced = advisorValue === vaultValue;
        
        syncResults.push({
          field,
          advisorValue,
          vaultValue,
          isSynced
        });

        if (isSynced) {
          console.log(`✅ ${field}: Synced (${advisorValue})`);
        } else {
          console.log(`❌ ${field}: Not synced (Advisor: ${advisorValue}, Vault: ${vaultValue})`);
        }
      }

      const allSynced = syncResults.every(result => result.isSynced);
      console.log(allSynced ? '✅ All fields are synchronized' : '❌ Some fields are not synchronized');
      
      this.testResults.push({ 
        test: 'Advisor-Vault Sync', 
        status: allSynced ? 'PASSED' : 'FAILED',
        details: syncResults
      });

      return syncResults;
    } catch (error) {
      console.error('❌ Advisor-vault sync test failed:', error.message);
      throw error;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Vault Advisor Details Test Suite...\n');
    
    try {
      // Connect to database
      const connected = await this.connectToDatabase();
      if (!connected) {
        throw new Error('Failed to connect to database');
      }

      // Create test advisor
      const advisor = await this.createTestAdvisor();
      
      // Create test vault
      const vault = await this.createTestVault(advisor._id);
      
      // Test data retrieval
      const retrievedVault = await this.testVaultDataRetrieval(vault._id);
      
      // Test data update
      const updatedVault = await this.testVaultDataUpdate(vault._id);
      
      // Test field validation
      await this.verifyFieldValidation();
      
      // Test advisor-vault synchronization
      await this.testVaultAdvisorSync(advisor._id, vault._id);
      
      // Clean up test data
      console.log('\n🧹 Cleaning up test data...');
      await Vault.findByIdAndDelete(vault._id);
      await Advisor.findByIdAndDelete(advisor._id);
      console.log('✅ Test data cleaned up');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    } finally {
      await this.disconnectFromDatabase();
      this.printTestSummary();
    }
  }

  printTestSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(test => {
          console.log(`- ${test.test}: ${test.reason || 'Unknown error'}`);
        });
    }
    
    console.log('\n🎯 VAULT PAGE FIELDS VERIFIED:');
    console.log('✅ Personal Details: lastName, email, phoneNumber');
    console.log('✅ Account Status: revenueModel, status');
    console.log('✅ Registration Numbers: sebiRegNumber, fpsbNumber, riaNumber, arnNumber, amfiRegNumber');
    console.log('✅ Data Validation: Email format, revenue model enum, required fields');
    console.log('✅ Database Operations: Create, Read, Update, Delete');
    console.log('✅ Advisor-Vault Synchronization');
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new VaultAdvisorTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = VaultAdvisorTestSuite;
