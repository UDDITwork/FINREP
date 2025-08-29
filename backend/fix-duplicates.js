const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.js');
let content = fs.readFileSync(indexPath, 'utf8');

console.log('🔍 Removing duplicate route registrations...');

// Split content into lines for easier manipulation
const lines = content.split('\n');

// Find the duplicate sections
let firstBillingStart = -1;
let firstBillingEnd = -1;
let secondBillingStart = -1;
let secondBillingEnd = -1;

let inBillingSection = false;
let billingSectionCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('// ============================================================================') && 
      i + 1 < lines.length && 
      lines[i + 1].includes('// BILLING ROUTES')) {
    
    if (billingSectionCount === 0) {
      firstBillingStart = i;
      inBillingSection = true;
      billingSectionCount++;
    } else if (billingSectionCount === 1) {
      secondBillingStart = i;
      inBillingSection = true;
      billingSectionCount++;
    }
  }
  
  if (inBillingSection && line.includes('// ============================================================================') && 
      i > firstBillingStart && billingSectionCount === 1) {
    firstBillingEnd = i;
    inBillingSection = false;
  }
  
  if (inBillingSection && line.includes('// ============================================================================') && 
      i > secondBillingStart && billingSectionCount === 2) {
    secondBillingEnd = i;
    inBillingSection = false;
  }
}

console.log(`📍 Found billing sections:`);
console.log(`   First: lines ${firstBillingStart + 1} to ${firstBillingEnd + 1}`);
console.log(`   Second: lines ${secondBillingStart + 1} to ${secondBillingEnd + 1}`);

if (secondBillingStart > 0 && secondBillingEnd > 0) {
  // Remove the second duplicate section
  const newLines = [
    ...lines.slice(0, secondBillingStart),
    ...lines.slice(secondBillingEnd + 1)
  ];
  
  const newContent = newLines.join('\n');
  fs.writeFileSync(indexPath, newContent);
  
  console.log('✅ Duplicate billing routes section removed successfully!');
  console.log('🔍 The first billing routes and Claude AI routes are preserved');
  console.log('🔍 Only the duplicate section was removed');
} else {
  console.log('⚠️ Could not locate duplicate sections properly');
  console.log('🔍 Manual inspection may be required');
}

console.log('🏁 Process completed!');
