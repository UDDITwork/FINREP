console.log('🔍 Testing specific require statements that might be failing...\n');

// Test 1: Basic dependencies
try {
  console.log('1️⃣ Testing basic dependencies...');
  const express = require('express');
  const multer = require('multer');
  const path = require('path');
  const fs = require('fs');
  const mongoose = require('mongoose');
  console.log('✅ Basic dependencies loaded successfully');
} catch (error) {
  console.log('❌ Basic dependencies failed:', error.message);
}

// Test 2: Middleware
try {
  console.log('\n2️⃣ Testing middleware...');
  const auth = require('./middleware/auth');
  console.log('✅ Auth middleware loaded successfully');
} catch (error) {
  console.log('❌ Auth middleware failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

// Test 3: Controllers
try {
  console.log('\n3️⃣ Testing controllers...');
  const clientController = require('./controllers/clientController');
  console.log('✅ Client controller loaded successfully');
} catch (error) {
  console.log('❌ Client controller failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

try {
  console.log('\n4️⃣ Testing OnboardingCASController...');
  const OnboardingCASController = require('./controllers/OnboardingCASController');
  console.log('✅ OnboardingCASController loaded successfully');
} catch (error) {
  console.log('❌ OnboardingCASController failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

// Test 4: Utils
try {
  console.log('\n5️⃣ Testing utils...');
  const logger = require('./utils/logger');
  console.log('✅ Logger loaded successfully');
} catch (error) {
  console.log('❌ Logger failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

try {
  console.log('\n6️⃣ Testing casEventLogger...');
  const casEventLogger = require('./utils/casEventLogger');
  console.log('✅ casEventLogger loaded successfully');
} catch (error) {
  console.log('❌ casEventLogger failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

// Test 5: Services
try {
  console.log('\n7️⃣ Testing services...');
  const claudeAiService = require('./services/claudeAiService');
  console.log('✅ claudeAiService loaded successfully');
} catch (error) {
  console.log('❌ claudeAiService failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

// Test 6: Models
try {
  console.log('\n8️⃣ Testing models...');
  const Client = require('./models/Client');
  console.log('✅ Client model loaded successfully');
} catch (error) {
  console.log('❌ Client model failed:', error.message);
  console.log('❌ Error stack:', error.stack);
}

console.log('\n🏁 Specific require test completed!');
