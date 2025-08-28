// Test script to verify Vault update fix
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
});

async function testVaultUpdate() {
  console.log('🧪 Testing Vault Update Fix...\n');

  try {
    // Test data that was causing the 400 error
    const testData = {
      firstName: 'UDDIT',
      lastName: 'UDDIT', 
      email: 'udditalerts247@gmail.com',
      phoneNumber: '07456886877',
      firmName: 'PANEURA AUTOMATIONS',
      sebiRegNumber: '',
      revenueModel: '',
      fpsbNumber: '',
      riaNumber: '',
      arnNumber: '',
      amfiRegNumber: '',
      status: 'active'
    };

    console.log('📤 Sending test data:', testData);
    console.log('');

    const response = await api.put('/vault?section=advisor', testData);
    
    console.log('✅ Vault update successful!');
    console.log('Response:', {
      success: response.data.success,
      message: response.data.message,
      hasData: !!response.data.data
    });

  } catch (error) {
    console.error('❌ Vault update failed:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      errors: error.response?.data?.errors
    });
    
    if (error.response?.data?.errors) {
      console.error('Validation errors:');
      error.response.data.errors.forEach(err => {
        console.error(`  - ${err.field}: ${err.message} (value: ${err.value})`);
      });
    }
  }
}

// Run the test
testVaultUpdate();
