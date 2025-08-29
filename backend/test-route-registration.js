const express = require('express');
const app = express();

console.log('🔍 Testing route registration process...\n');

// Test 1: Basic route registration
try {
  console.log('1️⃣ Testing basic route registration...');
  app.get('/test', (req, res) => res.json({ message: 'Test route' }));
  console.log('✅ Basic route registered successfully');
} catch (error) {
  console.log('❌ Basic route registration failed:', error.message);
}

// Test 2: Auth route registration
try {
  console.log('\n2️⃣ Testing auth route registration...');
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes registered successfully');
  console.log('📊 Auth routes stack length:', authRoutes.stack ? authRoutes.stack.length : 'No stack');
} catch (error) {
  console.log('❌ Auth route registration failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

// Test 3: Client route registration
try {
  console.log('\n3️⃣ Testing client route registration...');
  const clientRoutes = require('./routes/clients');
  app.use('/api/clients', clientRoutes);
  console.log('✅ Client routes registered successfully');
  console.log('📊 Client routes stack length:', clientRoutes.stack ? clientRoutes.stack.length : 'No stack');
} catch (error) {
  console.log('❌ Client route registration failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

// Test 4: Check if routes are actually registered
try {
  console.log('\n4️⃣ Checking route registration...');
  console.log('📊 App routes stack length:', app._router ? app._router.stack.length : 'No router');
  
  // Check if the routes are actually in the app
  const hasAuthRoutes = app._router && app._router.stack.some(layer => 
    layer.route && layer.route.path && layer.route.path.startsWith('/api/auth')
  );
  console.log('🔍 Auth routes in app:', hasAuthRoutes ? 'YES' : 'NO');
  
  const hasClientRoutes = app._router && app._router.stack.some(layer => 
    layer.route && layer.route.path && layer.route.path.startsWith('/api/clients')
  );
  console.log('🔍 Client routes in app:', hasClientRoutes ? 'YES' : 'NO');
  
} catch (error) {
  console.log('❌ Route checking failed:', error.message);
}

// Test 5: Start server and test routes
const PORT = 5002;
app.listen(PORT, () => {
  console.log(`\n🚀 Test server running on port ${PORT}`);
  console.log('🔗 Test URLs:');
  console.log(`   http://localhost:${PORT}/test`);
  console.log(`   http://localhost:${PORT}/api/auth/login`);
  console.log(`   http://localhost:${PORT}/api/clients/health`);
  
  // Test the routes after 2 seconds
  setTimeout(async () => {
    try {
      const axios = require('axios');
      
      console.log('\n🧪 Testing registered routes...');
      
      const test1 = await axios.get(`http://localhost:${PORT}/test`);
      console.log('✅ /test route:', test1.data);
      
      const test2 = await axios.get(`http://localhost:${PORT}/api/auth/login`);
      console.log('✅ /api/auth/login route:', test2.status, test2.statusText);
      
      const test3 = await axios.get(`http://localhost:${PORT}/api/clients/health`);
      console.log('✅ /api/clients/health route:', test3.status, test3.statusText);
      
    } catch (error) {
      if (error.response) {
        console.log('✅ Route exists but returned:', error.response.status, error.response.statusText);
      } else {
        console.log('❌ Route test failed:', error.message);
      }
    }
  }, 2000);
});
