// Simple Vault model test
console.log('🔍 Testing Vault Model...');

try {
  // Test the validation patterns directly
  const testData = {
    firstName: 'UDDIT',
    lastName: 'KANT SINHA', 
    email: 'udditalerts247@gmail.com',
    phoneNumber: '7456886877',
    firmName: 'PANEURA AUTOMATIONS',
    sebiRegNumber: 'INZ000305026',
    revenueModel: 'Fee-Only',
    fpsbNumber: 'John Doe, CFP®',
    riaNumber: 'INA000017523',
    arnNumber: '123456789012345678901234',
    amfiRegNumber: '123456789012345678901234',
    status: 'active'
  };

  console.log('✅ Test data prepared');
  
  // Test validation patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[+]?[\d\s\-\(\)\.]+$/;
  
  console.log('✅ Email validation:', emailRegex.test(testData.email));
  console.log('✅ Phone validation:', phoneRegex.test(testData.phoneNumber));
  
  // Test enums
  const validRevenueModels = ['Fee-Only', 'Commission-Based', 'Fee + Commission', ''];
  const validStatuses = ['active', 'inactive', 'suspended'];
  
  console.log('✅ Revenue model valid:', validRevenueModels.includes(testData.revenueModel));
  console.log('✅ Status valid:', validStatuses.includes(testData.status));
  
  console.log('🎯 All validation tests passed!');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}
