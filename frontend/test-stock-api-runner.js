/**
 * STOCK API TEST RUNNER
 * 
 * Simple script to run the comprehensive stock API tests
 * 
 * USAGE: node test-stock-api-runner.js
 */

const { runComprehensiveTest } = require('./test-stock-api-comprehensive.js');

console.log('🚀 Starting Stock API Test Suite...\n');

// Check if backend is running
const checkBackendHealth = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/stock-market/health');
    if (response.ok) {
      console.log('✅ Backend is running and healthy');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend is not running or not accessible');
    console.log('   Please start the backend server first:');
    console.log('   cd backend && npm start');
    return false;
  }
};

// Main execution
const main = async () => {
  const isBackendHealthy = await checkBackendHealth();
  
  if (!isBackendHealthy) {
    console.log('\n⚠️  Please start the backend server and try again');
    process.exit(1);
  }
  
  console.log('\n📊 Running comprehensive API tests...\n');
  
  try {
    await runComprehensiveTest();
    console.log('\n🎉 Test suite completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
};

// Run the test suite
main();
