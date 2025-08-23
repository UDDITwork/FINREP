/**
 * FILE LOCATION: backend/routes/debugRoutes.js
 * DEBUG ROUTES - NO AUTHENTICATION
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Debug Perplexity API
router.get('/perplexity', async (req, res) => {
  try {
    console.log('🧪 [DEBUG] Testing Perplexity API directly...');
    
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    console.log('🔑 [DEBUG] API Key present:', !!apiKey);
    console.log('🔑 [DEBUG] API Key length:', apiKey?.length);
    console.log('🔑 [DEBUG] API Key starts with:', apiKey?.substring(0, 10));
    
    const requestPayload = {
      model: 'sonar-pro',
      messages: [
        { role: 'user', content: 'Hello, just respond with "API working"' }
      ]
    };
    
    console.log('📤 [DEBUG] Request payload:', JSON.stringify(requestPayload, null, 2));
    
    const response = await axios.post('https://api.perplexity.ai/chat/completions', requestPayload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ [DEBUG] Response received:', response.data);
    res.json({ success: true, data: response.data });
    
  } catch (error) {
    console.error('❌ [DEBUG] DETAILED ERROR:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    res.json({ 
      success: false, 
      error: error.message,
      status: error.response?.status,
      details: error.response?.data 
    });
  }
});

module.exports = router;
