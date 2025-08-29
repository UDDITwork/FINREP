console.log('🔍 Testing route file loading one by one...\n');

// Test 1: Basic require
try {
  console.log('1️⃣ Testing basic require...');
  const express = require('express');
  console.log('✅ Express loaded successfully');
} catch (error) {
  console.log('❌ Express failed:', error.message);
}

// Test 2: Auth routes
try {
  console.log('\n2️⃣ Testing auth routes...');
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded successfully');
  console.log('📊 Auth routes stack length:', authRoutes.stack ? authRoutes.stack.length : 'No stack');
} catch (error) {
  console.log('❌ Auth routes failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

// Test 3: Client routes
try {
  console.log('\n3️⃣ Testing client routes...');
  const clientRoutes = require('./routes/clients');
  console.log('✅ Client routes loaded successfully');
  console.log('📊 Client routes stack length:', clientRoutes.stack ? clientRoutes.stack.length : 'No stack');
} catch (error) {
  console.log('❌ Client routes failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

// Test 4: Admin routes
try {
  console.log('\n4️⃣ Testing admin routes...');
  const adminRoutes = require('./routes/admin');
  console.log('✅ Admin routes loaded successfully');
  console.log('📊 Admin routes stack length:', adminRoutes.stack ? adminRoutes.stack.length : 'No stack');
} catch (error) {
  console.log('❌ Admin routes failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

// Test 5: Plans routes
try {
  console.log('\n5️⃣ Testing plans routes...');
  const plansRoutes = require('./routes/plans');
  console.log('✅ Plans routes loaded successfully');
  console.log('📊 Plans routes stack length:', plansRoutes.stack ? plansRoutes.stack.length : 'No stack');
} catch (error) {
  console.log('❌ Plans routes failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

// Test 6: Meetings routes
try {
  console.log('\n6️⃣ Testing meetings routes...');
  const meetingsRoutes = require('./routes/meetings');
  console.log('✅ Meetings routes loaded successfully');
  console.log('📊 Meetings routes stack length:', meetingsRoutes.stack ? meetingsRoutes.stack.length : 'No stack');
} catch (error) {
  console.log('❌ Meetings routes failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

console.log('\n🏁 Route loading test completed!');
