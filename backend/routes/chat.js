// File: backend/routes/chat.js
/**
 * Chat Routes for AI-powered financial advisory conversations
 * Handles all chat-related endpoints including client selection, messaging, and history
 */

const express = require('express');
const router = express.Router();
const {
  getChatClients,
  getClientContext,
  sendChatMessage,
  getChatHistory,
  getConversationMessages
} = require('../controllers/chatController');

// Import middleware
const auth = require('../middleware/auth');
const { logger } = require('../utils/logger');

// ============================================================================
// PROTECTED ROUTES (Require advisor authentication)
// ============================================================================

/**
 * @route   GET /api/chat/clients
 * @desc    Get all clients for chat selection
 * @access  Private (Advisor only)
 */
router.get('/clients', auth, getChatClients);

/**
 * @route   GET /api/chat/clients/:clientId/context
 * @desc    Get complete client financial context for AI
 * @access  Private (Advisor only)
 */
router.get('/clients/:clientId/context', auth, getClientContext);

/**
 * @route   POST /api/chat/clients/:clientId/message
 * @desc    Send message to AI and get response
 * @access  Private (Advisor only)
 */
router.post('/clients/:clientId/message', auth, sendChatMessage);

/**
 * @route   GET /api/chat/clients/:clientId/history
 * @desc    Get chat history for a specific client
 * @access  Private (Advisor only)
 */
router.get('/clients/:clientId/history', auth, getChatHistory);

/**
 * @route   GET /api/chat/conversations/:conversationId
 * @desc    Get detailed conversation messages
 * @access  Private (Advisor only)
 */
router.get('/conversations/:conversationId', auth, getConversationMessages);

// ============================================================================
// UTILITY ROUTES
// ============================================================================

/**
 * @route   GET /api/chat/health
 * @desc    Health check for chat system
 * @access  Public
 */
router.get('/health', (req, res) => {
  try {
    console.log('🏥 [CHAT] Health check requested');
    
    res.json({
      success: true,
      message: 'Chat system is operational',
      data: {
        timestamp: new Date().toISOString(),
        features: {
          clientSelection: true,
          aiConversations: true,
          chatHistory: true,
          contextAwareAI: true,
          realTimeLogging: true
        },
        endpoints: {
          clients: '/api/chat/clients',
          context: '/api/chat/clients/:clientId/context',
          message: '/api/chat/clients/:clientId/message',
          history: '/api/chat/clients/:clientId/history',
          conversation: '/api/chat/conversations/:conversationId'
        },
        aiIntegration: {
          provider: 'Anthropic Claude',
          model: 'claude-3-5-sonnet-20241022',
          contextAware: true,
          persistentHistory: true
        }
      }
    });
    
    console.log('✅ [CHAT] Health check completed successfully');
    
  } catch (error) {
    console.error('❌ [CHAT] Health check failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Chat system health check failed',
      error: error.message
    });
  }
});

// ============================================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================================

// Enhanced request logging for chat routes
router.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = `CHAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log request details
  console.log(`🚀 [CHAT] Request started [${requestId}]:`, {
    method: req.method,
    path: req.path,
    advisorId: req.advisor?.id || 'unauthenticated',
    clientId: req.params?.clientId,
    conversationId: req.params?.conversationId || req.body?.conversationId,
    hasBody: !!req.body && Object.keys(req.body).length > 0,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Store request metadata
  req.chatRequestMeta = {
    requestId,
    startTime
  };
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    console.log(`📥 [CHAT] Request completed [${requestId}]:`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: data?.success,
      advisorId: req.advisor?.id || 'unauthenticated',
      clientId: req.params?.clientId,
      conversationId: req.params?.conversationId || data?.data?.conversationId,
      dataSize: JSON.stringify(data).length,
      timestamp: new Date().toISOString()
    });
    
    return originalJson.call(this, data);
  };
  
  next();
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

// Global error handler for chat routes
router.use((error, req, res, next) => {
  const duration = req.chatRequestMeta ? Date.now() - req.chatRequestMeta.startTime : 0;
  const requestId = req.chatRequestMeta?.requestId || 'UNKNOWN';
  
  console.error(`❌ [CHAT] Request failed [${requestId}]:`, {
    method: req.method,
    path: req.path,
    error: error.message,
    stack: error.stack,
    advisorId: req.advisor?.id,
    clientId: req.params?.clientId,
    conversationId: req.params?.conversationId,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });

  logger.error('Chat routes error:', {
    requestId,
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
    advisorId: req.advisor?.id,
    clientId: req.params?.clientId
  });

  // Enhanced error responses based on route type
  let message = 'An error occurred processing your chat request';
  let statusCode = 500;
  
  if (req.path.includes('/clients') && req.method === 'GET') {
    message = 'Failed to load clients for chat. Please try again.';
  } else if (req.path.includes('/context')) {
    message = 'Failed to load client financial information. Please try again.';
  } else if (req.path.includes('/message')) {
    message = 'Failed to process your message. Please try again.';
    if (error.message.includes('AI service')) {
      message = 'AI service is temporarily unavailable. Please try again in a moment.';
    }
  } else if (req.path.includes('/history')) {
    message = 'Failed to load chat history. Please try again.';
  }
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    message = 'Invalid request data. Please check your input.';
    statusCode = 400;
  } else if (error.name === 'CastError') {
    message = 'Invalid ID format provided.';
    statusCode = 400;
  } else if (error.message.includes('not found')) {
    statusCode = 404;
  } else if (error.message.includes('access denied')) {
    statusCode = 403;
  }
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      success: false,
      message: message
    });
  } else {
    res.status(statusCode).json({
      success: false,
      message: message,
      error: error.message,
      stack: error.stack,
      debug: {
        requestId,
        path: req.path,
        method: req.method,
        advisorId: req.advisor?.id,
        clientId: req.params?.clientId,
        conversationId: req.params?.conversationId,
        duration: `${duration}ms`
      }
    });
  }
});

module.exports = router;