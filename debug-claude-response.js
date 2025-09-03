/**
 * DEBUG SCRIPT FOR CLAUDE AI RESPONSE
 * 
 * This script helps debug what Claude AI is actually returning
 */

require('dotenv').config({ path: './backend/.env' });

const debugClaudeResponse = async () => {
  console.log('🔍 DEBUGGING CLAUDE AI RESPONSE...\n');
  
  try {
    const claudeService = require('./backend/services/claudeMutualFundService');
    
    console.log('1. Testing with ICICI Prudential Large Cap Fund...');
    const fundDetails = await claudeService.fetchMutualFundDetails(
      'ICICI Prudential Large Cap Fund', 
      'ICICI Prudential'
    );
    
    console.log('\n📊 RAW RESPONSE FROM CLAUDE AI:');
    console.log('=====================================');
    console.log('Success:', fundDetails.success);
    console.log('Error:', fundDetails.error);
    console.log('Data Type:', typeof fundDetails.data);
    console.log('Data:', JSON.stringify(fundDetails.data, null, 2));
    
    if (fundDetails.success && fundDetails.data) {
      console.log('\n📋 RESPONSE ANALYSIS:');
      console.log('=====================================');
      console.log('Is String:', typeof fundDetails.data === 'string');
      console.log('Length:', fundDetails.data.length);
      console.log('First 500 chars:', fundDetails.data.substring(0, 500));
      console.log('Last 500 chars:', fundDetails.data.substring(fundDetails.data.length - 500));
      
      // Try to parse manually
      console.log('\n🔧 MANUAL PARSING ATTEMPT:');
      console.log('=====================================');
      try {
        const parsedData = claudeService.parseClaudeResponse(fundDetails.data);
        console.log('Parsed successfully:', JSON.stringify(parsedData, null, 2));
      } catch (parseError) {
        console.log('Parse error:', parseError.message);
        console.log('Parse error stack:', parseError.stack);
      }
    }
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
};

// Run the debug
debugClaudeResponse().catch(console.error);
