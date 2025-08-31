/**
 * Test script to check Claude API status and credits
 * Run with: node test-claude-api.js
 */

require('dotenv').config();

async function testClaudeAPI() {
  console.log('🧪 Testing Claude API Status...\n');
  
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  
  if (!claudeApiKey) {
    console.error('❌ Claude API key not found in environment variables');
    console.log('Please check your .env file and ensure CLAUDE_API_KEY is set');
    return;
  }
  
  console.log('✅ Claude API key found');
  console.log('🔑 API Key format:', claudeApiKey.startsWith('sk-ant-') ? 'Valid' : 'Invalid');
  console.log('📝 API Key length:', claudeApiKey.length);
  
  try {
    console.log('\n🌐 Making test API call...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Respond with only this JSON: {"status": "connected", "message": "Claude API is working", "timestamp": "' + new Date().toISOString() + '"}'
          }
        ]
      })
    });
    
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      
      // Parse error response
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch (parseError) {
        errorDetails = { error: { message: errorText } };
      }
      
      console.log('\n🔍 Error Analysis:');
      if (response.status === 401) {
        console.log('❌ Authentication Failed - Check your API key');
      } else if (response.status === 402) {
        console.log('💳 Credits Exhausted - Add credits to your Claude account');
      } else if (response.status === 429) {
        console.log('⏰ Rate Limit Exceeded - Try again later');
      } else if (response.status === 500) {
        console.log('🔧 Server Error - Claude API is having issues');
      } else if (response.status === 503) {
        console.log('🚫 Service Unavailable - Claude API is down');
      } else {
        console.log('❓ Unknown Error - Status:', response.status);
      }
      
      console.log('📄 Full Error Details:', errorDetails);
      return;
    }
    
    const claudeResponse = await response.json();
    console.log('✅ API Call Successful!');
    console.log('📊 Response:', JSON.stringify(claudeResponse, null, 2));
    
    // Check usage information if available
    if (claudeResponse.usage) {
      console.log('\n📈 Usage Information:');
      console.log('Input Tokens:', claudeResponse.usage.input_tokens);
      console.log('Output Tokens:', claudeResponse.usage.output_tokens);
      console.log('Total Tokens:', claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens);
    }
    
  } catch (error) {
    console.error('❌ Network/Request Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testClaudeAPI().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});