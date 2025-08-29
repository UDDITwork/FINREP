const express = require('express');
const app = express();

// Test basic route registration
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API test route working!' });
});

// Test loading the actual route files
try {
  console.log('🔍 Testing route file loading...');
  
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded successfully');
  console.log('📊 Auth routes stack:', authRoutes.stack ? authRoutes.stack.length : 'No stack');
  
  const clientRoutes = require('./routes/clients');
  console.log('✅ Client routes loaded successfully');
  console.log('📊 Client routes stack:', clientRoutes.stack ? clientRoutes.stack.length : 'No stack');
  
} catch (error) {
  console.log('❌ Error loading routes:', error.message);
  console.log('❌ Error stack:', error.stack);
}

// Start simple test server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log('🔗 Test URLs:');
  console.log(`   http://localhost:${PORT}/test`);
  console.log(`   http://localhost:${PORT}/api/test`);
});

// Test the routes after 2 seconds
setTimeout(async () => {
  try {
    const axios = require('axios');
    
    console.log('\n🧪 Testing routes...');
    
    const test1 = await axios.get(`http://localhost:${PORT}/test`);
    console.log('✅ /test route:', test1.data);
    
    const test2 = await axios.get(`http://localhost:${PORT}/api/test`);
    console.log('✅ /api/test route:', test2.data);
    
  } catch (error) {
    console.log('❌ Route test failed:', error.message);
  }
}, 2000);
