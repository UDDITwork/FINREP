const fs = require('fs');
const path = require('path');

console.log('🔍 Testing prompts directory structure...');

// Check if prompts directory exists
const promptsDir = path.join(__dirname, 'prompts');
console.log('📁 Prompts directory path:', promptsDir);
console.log('📁 Prompts directory exists:', fs.existsSync(promptsDir));

if (fs.existsSync(promptsDir)) {
  console.log('📁 Prompts directory contents:');
  const files = fs.readdirSync(promptsDir);
  files.forEach(file => {
    const filePath = path.join(promptsDir, file);
    const stats = fs.statSync(filePath);
    console.log(`  - ${file} (${stats.size} bytes)`);
  });
} else {
  console.log('❌ Prompts directory does not exist!');
}

// Check specific files
const goalAnalysisPath = path.join(__dirname, 'prompts', 'goal-analysis.md');
const debtAnalysisPath = path.join(__dirname, 'prompts', 'debt-analysis.md');

console.log('\n📄 Checking specific files:');
console.log('📄 goal-analysis.md exists:', fs.existsSync(goalAnalysisPath));
console.log('📄 debt-analysis.md exists:', fs.existsSync(debtAnalysisPath));

if (fs.existsSync(goalAnalysisPath)) {
  const content = fs.readFileSync(goalAnalysisPath, 'utf-8');
  console.log('📄 goal-analysis.md size:', content.length, 'characters');
  console.log('📄 goal-analysis.md first 100 chars:', content.substring(0, 100));
}

console.log('\n✅ Test completed!');
