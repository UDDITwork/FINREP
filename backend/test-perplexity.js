// test-perplexity.js
require('dotenv').config();
const axios = require('axios');

async function testPerplexity() {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    console.log('🔑 API Key:', !!apiKey, apiKey?.length);
    
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar-pro',
      messages: [{ role: 'user', content: 'Hello' }]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SUCCESS:', response.data);
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

testPerplexity();
