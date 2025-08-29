
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.js');
let content = fs.readFileSync(indexPath, 'utf8');

console.log('🔍 Removing duplicate route registrations...');

// Find and remove the second duplicate billing routes section
const duplicatePattern = /\/\/ ============================================================================\r?\n\/\/ BILLING ROUTES\r?\n\/\/ ============================================================================\r?\n\r?\ntry {\r?\n  const billingRoutes = require\('\.\/routes\/billing'\);\r?\n  app\.use\('\/api\/billing', billingRoutes\);\r?\n  logger\.info\('✅ Billing routes loaded successfully'\);\r?\n} catch \(error\) {\r?\n  console\.log\('⚠️ Billing routes not found - skipping \(app will work without billing features\)'\);\r?\n  console\.log\('Error details:', error\.message\);\r?\n  logger\.warn\('Billing routes not available:', error\.message\);\r?\n}\r?\n\r?\n\/\/ Claude AI routes\r?\n\/\/ ============================================================================\r?\n\r?\ntry {\r?\n  const claudeRoutes = require\('\.\/routes\/claude'\);\r?\n  app\.use\('\/api\/claude', claudeRoutes\);\r?\n  logger\.info\('✅ Claude AI routes loaded successfully'\);\r?\n} catch \(error\) {\r?\n  console\.log\('⚠️ Claude AI routes not found - skipping \(app will work without Claude AI features\)'\);\r?\n  console\.log\('Error details:', error\.message\);\r?\n  logger\.warn\('Claude AI routes not available:', error\.message\);\r?\n}\r?\n\r?\n\/\/ Log Billing system availability \(if billing routes were loaded successfully\)\r?\ntry {\r?\n  comprehensiveLogger\.logSystemEvent\('BILLING_SYSTEM_ENABLED', {\r?\n    billingRoutes: \[\r?\n      '\/api\/billing\/subscription-status',\r?\n      '\/api\/billing\/create-payment',\r?\n      '\/api\/billing\/check-payment-status',\r?\n      '\/api\/billing\/payment-history',\r?\n      '\/api\/billing\/webhook',\r?\n      '\/api\/billing\/cancel-subscription',\r?\n      '\/api\/billing\/stats'\r?\n    \],\r?\n    features: \[\r?\n      'SMEPay Integration',\r?\n      'Monthly Subscription',\r?\n      'Payment Processing',\r?\n      'Subscription Management',\r?\n      'Payment History',\r?\n      'Webhook Handling'\r?\n    \],\r?\n    timestamp: new Date\(\)\.toISOString\(\)\r?\n  \);\r?\n} catch \(error\) {\r?\n  comprehensiveLogger\.logSystemEvent\('BILLING_SYSTEM_DISABLED', {\r?\n    reason: 'Billing routes file not found',\r?\n    impact: 'App will function normally without billing features',\r?\n    error: error\.message,\r?\n    timestamp: new Date\(\)\.toISOString\(\)\r?\n  \);\r?\n}/;

// Remove the duplicate section
const newContent = content.replace(duplicatePattern, '');

if (newContent !== content) {
  fs.writeFileSync(indexPath, newContent);
  console.log('✅ Duplicate route registrations removed successfully!');
  console.log('🔍 The first billing routes and Claude AI routes are preserved');
  console.log('🔍 Only the duplicate section was removed');
} else {
  console.log('⚠️ No duplicate sections found or pattern did not match');
}

console.log('🏁 Process completed!');
