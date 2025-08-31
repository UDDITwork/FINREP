// File: backend/routes/taxPlanning.js
/**
 * Tax Planning Routes
 * API endpoints for tax planning functionality
 */

const express = require('express');
const router = express.Router();
const {
  getClientTaxPlanningData,
  generateAIRecommendations,
  saveManualAdvisorInputs,
  getTaxPlanningHistory
} = require('../controllers/taxPlanningController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route GET /api/tax-planning/client/:clientId
 * @desc Get comprehensive tax planning data for a client
 * @access Private (Advisor only)
 */
router.get('/client/:clientId', getClientTaxPlanningData);

/**
 * @route POST /api/tax-planning/client/:clientId/ai-recommendations
 * @desc Generate AI tax planning recommendations
 * @access Private (Advisor only)
 */
router.post('/client/:clientId/ai-recommendations', generateAIRecommendations);

/**
 * @route POST /api/tax-planning/client/:clientId/manual-inputs
 * @desc Save manual advisor inputs and recommendations
 * @access Private (Advisor only)
 */
router.post('/client/:clientId/manual-inputs', saveManualAdvisorInputs);

/**
 * @route GET /api/tax-planning/client/:clientId/history
 * @desc Get tax planning history for a client
 * @access Private (Advisor only)
 */
router.get('/client/:clientId/history', getTaxPlanningHistory);

/**
 * @route GET /api/tax-planning/test-claude
 * @desc Test Claude API connection and check credits
 * @access Private (Advisor only)
 */
router.get('/test-claude', async (req, res) => {
  try {
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(500).json({
        success: false,
        message: 'Claude API key not configured',
        errorType: 'missing_api_key'
      });
    }

    console.log('🧪 [Claude Test] Testing API connection...');
    
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
            content: 'Respond with only this JSON: {"status": "connected", "message": "Claude API is working"}'
          }
        ]
      })
    });

    console.log('📡 [Claude Test] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Claude Test] API error:', response.status, errorText);
      
      // Parse error response
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch (parseError) {
        errorDetails = { error: { message: errorText } };
      }
      
      // Handle specific error types
      if (response.status === 401) {
        return res.status(500).json({
          success: false,
          message: 'Claude API authentication failed. Please check your API key.',
          errorType: 'authentication_failed',
          statusCode: response.status,
          error: errorText
        });
      } else if (response.status === 402) {
        return res.status(500).json({
          success: false,
          message: 'Claude API credits exhausted. Please add credits to your account.',
          errorType: 'credits_exhausted',
          statusCode: response.status,
          error: errorText
        });
      } else if (response.status === 429) {
        return res.status(500).json({
          success: false,
          message: 'Claude API rate limit exceeded. Please try again later.',
          errorType: 'rate_limit_exceeded',
          statusCode: response.status,
          error: errorText
        });
      } else {
        return res.status(500).json({
          success: false,
          message: `Claude API error: ${response.status}`,
          errorType: 'api_error',
          statusCode: response.status,
          error: errorText
        });
      }
    }

    const claudeResponse = await response.json();
    console.log('✅ [Claude Test] API connection successful');
    
    res.json({
      success: true,
      message: 'Claude API connection successful',
      data: claudeResponse,
      statusCode: response.status
    });

  } catch (error) {
    console.error('❌ [Claude Test] Test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Claude API test failed',
      errorType: 'network_error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/tax-planning/test-ai-recommendations/:clientId
 * @desc Test AI recommendations generation for a specific client
 * @access Private (Advisor only)
 */
router.get('/test-ai-recommendations/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const advisorId = req.advisor.id;

    console.log('🧪 [Test] Testing AI recommendations for client:', { clientId, advisorId });

    // Import the controller function
    const { generateAIRecommendations } = require('../controllers/taxPlanningController');
    
    // Create a mock request object
    const mockReq = {
      params: { clientId },
      body: { taxYear: new Date().getFullYear().toString() },
      advisor: { id: advisorId }
    };

    // Create a mock response object
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          res.status(code).json(data);
        }
      }),
      json: (data) => {
        res.json(data);
      }
    };

    // Call the function
    await generateAIRecommendations(mockReq, mockRes);

  } catch (error) {
    console.error('❌ [Test] Error testing AI recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

module.exports = router;
