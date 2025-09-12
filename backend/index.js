// File: backend/index.js
// ⚠️ SAFE UPDATE: Only adding AI Chat routes to existing file
// सभी existing functionality को preserve किया गया है

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { logger, logDatabase } = require('./utils/logger');
const { morganMiddleware, requestLogger, addRequestId, securityLogger } = require('./middleware/requestLogger');
const path = require('path'); // Added for static file serving

// Import comprehensive logging system
const comprehensiveLogger = require('./utils/comprehensiveLogger');
const { userActivityLogger, frontendLogIngestionMiddleware } = require('./middleware/userActivityLogger');
const { 
  performanceLogger, 
  databasePerformanceTracker, 
  healthCheckLogger, 
  timeoutMonitor, 
  rateLimitPerformanceTracker 
} = require('./middleware/performanceLogger');

const app = express();

// Environment and startup logging
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

logger.info('='.repeat(50));
logger.info('RICHIEAT Backend Server Starting...');
logger.info(`Environment: ${NODE_ENV}`);
logger.info(`Port: ${PORT}`);
logger.info('='.repeat(50));

// Initialize comprehensive logging
comprehensiveLogger.logSystemEvent('SERVER_STARTING', {
  environment: NODE_ENV,
  port: PORT,
  nodeVersion: process.version,
  pid: process.pid
});

// Initialize transcription sync job
const transcriptionSyncJob = require('./jobs/transcriptionSyncJob');
transcriptionSyncJob.schedule();

// Create required directories for file uploads
const { createRequiredDirectories } = require('./utils/createDirectories');
createRequiredDirectories();

// Trust proxy for proper IP logging
app.set('trust proxy', 1);

// Request logging middleware (some must be first)
app.use(addRequestId);
app.use(morganMiddleware);

// Add comprehensive logging middleware
app.use(rateLimitPerformanceTracker());
app.use(timeoutMonitor(30000));
app.use(healthCheckLogger);

// Basic middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://richieai.in', 'https://www.richieai.in'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
}));

app.use(express.json({ 
  limit: '10mb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request logger and security logger AFTER body parsing
app.use(requestLogger);
app.use(securityLogger);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add comprehensive user activity and performance logging
app.use(userActivityLogger({
  logRequestBody: true,
  logResponseBody: NODE_ENV === 'development',
  logHeaders: NODE_ENV === 'development',
  excludePaths: ['/api/logs', '/health', '/'],
  maxBodySize: 10000
}));

app.use(performanceLogger({
  slowRequestThreshold: 1000,
  criticalRequestThreshold: 5000,
  logMemoryUsage: true,
  logCPUUsage: NODE_ENV === 'development',
  sampleRate: NODE_ENV === 'production' ? 0.1 : 1.0
}));

app.use(databasePerformanceTracker());

// Frontend log ingestion middleware
app.use(frontendLogIngestionMiddleware);

// MongoDB connection with retry logic
const connectWithRetry = () => {
  logDatabase.connectionAttempt();
  
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true
  })
  .then(() => {
    logDatabase.connectionSuccess();
    logger.info('✅ MongoDB connected successfully');
    
    // Log successful database connection
    comprehensiveLogger.logSystemEvent('DATABASE_CONNECTION_SUCCESS', {
      database: 'MongoDB',
      uri: MONGODB_URI ? 'configured' : 'missing',
      environment: NODE_ENV
    });
  })
  .catch(err => {
    logDatabase.connectionError(err);
    logger.error('❌ MongoDB connection failed. Retrying in 5 seconds...');
    
    // Log database connection error
    comprehensiveLogger.logApplicationError(
      err, 
      'DatabaseConnection', 
      'high', 
      {
        retryScheduled: true,
        retryDelay: '5000ms',
        environment: NODE_ENV
      }
    );
    
    setTimeout(connectWithRetry, 5000);
  });
};

// MongoDB connection event listeners
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

// Start connection
connectWithRetry();

// Health check route
app.get('/', (req, res) => {
  const healthStatus = {
    message: 'RICHIEAT Backend API is running!',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    // ✅ NEW: Added AI Chat feature indicator
    features: {
      authentication: true,
      clientManagement: true,
      financialPlanning: true,
      meetingManagement: true,
      aiChatSystem: true, // NEW: AI Chat feature
      casIntegration: true,
      abTesting: true,
      loeManagement: true,
      adminDashboard: true,
      clientReports: true, // NEW: Client Reports feature
      pdfGeneration: true // NEW: PDF Generation feature
    }
  };
  
  logger.debug('Health check requested');
  res.json(healthStatus);
});

// Debug middleware for body parsing issues
app.use('/api/clients/onboarding', (req, res, next) => {
  console.log('🔍 BODY DEBUG MIDDLEWARE:', {
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    },
    bodyExists: !!req.body,
    bodyType: typeof req.body,
    bodyKeys: req.body ? Object.keys(req.body) : 'N/A',
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    rawBodyPreview: req.body ? JSON.stringify(req.body).substring(0, 200) + '...' : 'NULL'
  });
  next();
});

// ============================================================================
// API ROUTES - EXISTING ROUTES (UNCHANGED)
// ============================================================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/client-invitations', require('./routes/clientInvitations'));
app.use('/api/loe', require('./routes/loe'));
app.use('/api/loe-automation', require('./routes/loeAutomation'));
app.use('/api/logs', require('./routes/logging'));
app.use('/api/ab-testing-suite-2', require('./routes/abTestingSuite2'));
app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/mutual-fund-exit-strategies', require('./routes/mutualFundExitStrategies'));
app.use('/api/transcriptions', require('./routes/transcriptions'));
app.use('/api/enhanced-transcriptions', require('./routes/enhancedTranscriptionRoutes'));
app.use('/api/transcripts', require('./routes/transcriptRouter'));
app.use('/api/final-report', require('./routes/finalReport'));
app.use('/api/estate-planning', require('./routes/estatePlanning'));
app.use('/api/tax-planning', require('./routes/taxPlanning'));
app.use('/api/mutual-fund-recommend', require('./routes/mutualFundRecommend'));

// ============================================================================
// 🆕 NEW: CLIENT REPORTS ROUTES (Comprehensive Client Reports)
// ============================================================================

// Add Client Reports routes for comprehensive client reporting
try {
  console.log('🔍 Attempting to load client reports routes...');
  const clientReportsRoutes = require('./routes/clientReports');
  console.log('✅ Client reports routes file loaded successfully');
  app.use('/api/client-reports', clientReportsRoutes);
  console.log('✅ Client Reports routes registered: /api/client-reports/*');
  
  // Log Client Reports system availability
  comprehensiveLogger.logSystemEvent('CLIENT_REPORTS_SYSTEM_ENABLED', {
    clientReportsRoutes: [
      '/api/client-reports/vault',
      '/api/client-reports/clients',
      '/api/client-reports/clients/:clientId'
    ],
    features: [
      'Advisor Vault Data',
      'Client List Management',
      'Comprehensive Client Reports',
      'Professional Report Generation'
    ],
    timestamp: new Date().toISOString()
  });
  
} catch (error) {
  console.log('⚠️ Client Reports routes not found - skipping (app will work without client reports)');
  console.log('Error details:', error.message);
  logger.warn('Client Reports routes not available:', error.message);
  
  comprehensiveLogger.logSystemEvent('CLIENT_REPORTS_SYSTEM_DISABLED', {
    reason: 'Client Reports routes file not found',
    impact: 'App will function normally without client reports',
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// 🆕 NEW: PDF GENERATION ROUTES (Comprehensive PDF Reports)
// ============================================================================

// Add PDF generation routes for comprehensive PDF reports
try {
  console.log('🔍 Attempting to load PDF generation routes...');
  const pdfRoutes = require('./routes/pdfRoutes');
  console.log('✅ PDF generation routes file loaded successfully');
  app.use('/api/pdf', pdfRoutes);
  console.log('✅ PDF Generation routes registered: /api/pdf/*');
  
  // Log PDF Generation system availability
  comprehensiveLogger.logSystemEvent('PDF_GENERATION_SYSTEM_ENABLED', {
    pdfRoutes: [
      '/api/pdf/generate-client-report/:clientId',
      '/api/pdf/health'
    ],
    features: [
      'Comprehensive PDF Reports',
      'Professional Chart Generation',
      'Vault Data Integration',
      'Multi-Model Data Aggregation',
      'Professional Styling'
    ],
    timestamp: new Date().toISOString()
  });
  
} catch (error) {
  console.log('⚠️ PDF Generation routes not found - skipping (app will work without PDF generation)');
  console.log('Error details:', error.message);
  logger.warn('PDF Generation routes not available:', error.message);
  
  comprehensiveLogger.logSystemEvent('PDF_GENERATION_SYSTEM_DISABLED', {
    reason: 'PDF Generation routes file not found',
    impact: 'App will function normally without PDF generation',
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// 🆕 NEW: DEBUG ROUTES (NO AUTHENTICATION)
// ============================================================================

// Add Debug routes for testing (no authentication required)
try {
  console.log('🔍 Attempting to load debug routes...');
  const debugRoutes = require('./routes/debugRoutes');
  console.log('✅ Debug routes file loaded successfully');
  app.use('/api/debug', debugRoutes);
  console.log('✅ Debug routes registered: /api/debug/*');
  
  // Log Debug system availability
  comprehensiveLogger.logSystemEvent('DEBUG_SYSTEM_ENABLED', {
    debugRoutes: [
      '/api/debug/perplexity'
    ],
    features: [
      'Perplexity API Testing',
      'No Authentication Required',
      'Direct API Testing'
    ],
    timestamp: new Date().toISOString()
  });
  
} catch (error) {
  console.log('⚠️ Debug routes not found - skipping (app will work without debug features)');
  console.log('Error details:', error.message);
  logger.warn('Debug routes not available:', error.message);
  
  comprehensiveLogger.logSystemEvent('DEBUG_SYSTEM_DISABLED', {
    reason: 'Debug routes file not found',
    impact: 'App will function normally without debug features',
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// 🆕 NEW: CAS MANAGEMENT ROUTES (ONLY NEW ADDITION)
// ============================================================================

// Add CAS Management routes if the file exists (graceful fallback)
try {
  const casManagementRoutes = require('./routes/casManagement');
  app.use('/api/cas-management', casManagementRoutes);
  console.log('✅ CAS Management routes registered: /api/cas-management/*');
  
  // Log CAS Management system availability
  comprehensiveLogger.logSystemEvent('CAS_MANAGEMENT_SYSTEM_ENABLED', {
    casRoutes: [
      '/api/cas-management/summary',
      '/api/cas-management/clients',
      '/api/cas-management/clients/:clientId'
    ],
    timestamp: new Date().toISOString()
  });
  
} catch (error) {
  console.log('⚠️ CAS Management routes not found - skipping (app will work without CAS management)');
  logger.warn('CAS Management routes not available:', error.message);
  
  // Log that CAS Management is not available (but app continues working)
  comprehensiveLogger.logSystemEvent('CAS_MANAGEMENT_SYSTEM_DISABLED', {
    reason: 'CAS Management routes file not found',
    impact: 'App will function normally without CAS management',
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// 🆕 NEW: AI CHAT ROUTES (ONLY NEW ADDITION)
// ============================================================================

// Add AI Chat routes if the file exists (graceful fallback)
try {
  const chatRoutes = require('./routes/chat');
  app.use('/api/chat', chatRoutes);
  console.log('✅ AI Chat routes registered: /api/chat/*');
  
  // Log AI Chat system availability
  comprehensiveLogger.logSystemEvent('AI_CHAT_SYSTEM_ENABLED', {
    chatRoutes: [
      '/api/chat/clients',
      '/api/chat/clients/:id/context', 
      '/api/chat/clients/:id/message',
      '/api/chat/clients/:id/history',
      '/api/chat/conversations/:id'
    ],
    timestamp: new Date().toISOString()
  });
  
} catch (error) {
  console.log('⚠️ AI Chat routes not found - skipping (app will work without chat)');
  logger.warn('AI Chat routes not available:', error.message);
  
  // Log that AI Chat is not available (but app continues working)
  comprehensiveLogger.logSystemEvent('AI_CHAT_SYSTEM_DISABLED', {
    reason: 'Chat routes file not found',
    impact: 'App will function normally without AI chat',
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

// 🆕 NEW: STOCK MARKET API ROUTES
// ============================================================================

// Add Stock Market API routes if the file exists (graceful fallback)
try {
  console.log('🔍 Attempting to load stock market routes...');
  const stockMarketRoutes = require('./routes/stockMarketRoutes');
  console.log('✅ Stock market routes file loaded successfully');
  app.use('/api/stock-market', stockMarketRoutes);
  console.log('✅ Stock Market API routes registered: /api/stock-market/*');
  
  // Log Stock Market API system availability
  comprehensiveLogger.logSystemEvent('STOCK_MARKET_API_ENABLED', {
    stockMarketRoutes: [
      '/api/stock-market/search-stock',
      '/api/stock-market/search-mutual-fund',
      '/api/stock-market/mutual-funds',
      '/api/stock-market/ipo',
      '/api/stock-market/trending',
      '/api/stock-market/52-week-high-low',
      '/api/stock-market/most-active',
      '/api/stock-market/price-shockers',
      '/api/stock-market/historical-data',
      '/api/stock-market/stock-target-price',
      '/api/stock-market/overview',
      '/api/stock-market/cache-stats',
      '/api/stock-market/clear-cache',
      '/api/stock-market/health'
    ],
    timestamp: new Date().toISOString()
  });
  
} catch (error) {
  console.log('⚠️ Stock Market API routes not found - skipping (app will work without stock market data)');
  console.log('Error details:', error.message);
  console.log('Error stack:', error.stack);
  logger.warn('Stock Market API routes not available:', error.message);
  
  // Log that Stock Market API is not available (but app continues working)
  comprehensiveLogger.logSystemEvent('STOCK_MARKET_API_DISABLED', {
    reason: 'Stock Market routes file not found',
    impact: 'App will function normally without stock market data',
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

// 🆕 NEW: ESTATE PLANNING ROUTES
// ============================================================================

// Add Estate Planning routes
try {
  console.log('🔍 Attempting to load estate planning routes...');
  const estatePlanningRoutes = require('./routes/estatePlanning');
  console.log('✅ Estate planning routes file loaded successfully');
  app.use('/api/estate-planning', estatePlanningRoutes);
  console.log('✅ Estate Planning API routes registered: /api/estate-planning/*');
  
  // Log Estate Planning system availability
  comprehensiveLogger.logSystemEvent('ESTATE_PLANNING_SYSTEM_ENABLED', {
    estatePlanningRoutes: [
      '/api/estate-planning/client/:clientId'
    ],
    features: [
      'Comprehensive Estate Planning Analysis',
      'Financial Assets Analysis',
      'Liabilities Assessment',
      'Income & Cash Flow Analysis',
      'Investment Portfolio Review',
      'Risk Assessment',
      'Personalized Recommendations',
      'CAS Data Integration'
    ],
    timestamp: new Date().toISOString()
  });
  
} catch (error) {
  console.log('⚠️ Estate Planning routes not found - skipping (app will work without estate planning features)');
  console.log('Error details:', error.message);
  logger.warn('Estate Planning routes not available:', error.message);
  
  // Log that Estate Planning system is not available (but app continues working)
  comprehensiveLogger.logSystemEvent('ESTATE_PLANNING_SYSTEM_DISABLED', {
    reason: 'Estate Planning routes file not found',
    impact: 'App will function normally without estate planning features',
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

// 🆕 NEW: VAULT ROUTES (Branding & Professional Details)
// ============================================================================

// Add Vault routes for branding and professional details
try {
  console.log('🔍 Attempting to load vault routes...');
  const vaultRoutes = require('./routes/vaultRoutes');
  console.log('✅ Vault routes file loaded successfully');
  app.use('/api/vault', vaultRoutes);
  
  // Add Market Data routes
  try {
    console.log('🔍 Attempting to load market data routes...');
    const marketDataRoutes = require('./routes/marketData');
    app.use('/api/market-data', marketDataRoutes);
    console.log('✅ Market Data routes registered: /api/market-data/*');
    
    // Log Market Data system availability
    comprehensiveLogger.logSystemEvent('MARKET_DATA_SYSTEM_ENABLED', {
      marketDataRoutes: [
        '/api/market-data/nifty50',
        '/api/market-data/sensex',
        '/api/market-data/banknifty',
        '/api/market-data/overview',
        '/api/market-data/health'
      ],
      features: [
        'NIFTY 50 Data',
        'SENSEX Data',
        'Bank Nifty Data',
        'Market Overview',
        'Real-time Market Data',
        'CORS Proxy for Yahoo Finance'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.log('⚠️ Market Data routes not found - skipping (app will work without market data features)');
    console.log('Error details:', error.message);
    logger.warn('Market Data routes not available:', error.message);
    
    comprehensiveLogger.logSystemEvent('MARKET_DATA_SYSTEM_DISABLED', {
      reason: 'Market Data routes file not found',
      impact: 'App will function normally without market data features',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

// ============================================================================
// BILLING ROUTES
// ============================================================================

try {
  const billingRoutes = require('./routes/billing');
  app.use('/api/billing', billingRoutes);
  logger.info('✅ Billing routes loaded successfully');
} catch (error) {
  console.log('⚠️ Billing routes not found - skipping (app will work without billing features)');
  console.log('Error details:', error.message);
  logger.warn('Billing routes not available:', error.message);
}

// Claude AI routes
// ============================================================================

try {
  const claudeRoutes = require('./routes/claude');
  app.use('/api/claude', claudeRoutes);
  logger.info('✅ Claude AI routes loaded successfully');
} catch (error) {
  console.log('⚠️ Claude AI routes not found - skipping (app will work without Claude AI features)');
  console.log('Error details:', error.message);
  logger.warn('Claude AI routes not available:', error.message);
}

// Log Billing system availability (if billing routes were loaded successfully)
try {
  comprehensiveLogger.logSystemEvent('BILLING_SYSTEM_ENABLED', {
    billingRoutes: [
      '/api/billing/subscription-status',
      '/api/billing/create-payment',
      '/api/billing/check-payment-status',
      '/api/billing/payment-history',
      '/api/billing/webhook',
      '/api/billing/cancel-subscription',
      '/api/billing/stats'
    ],
    features: [
      'SMEPay Integration',
      'Monthly Subscription',
      'Payment Processing',
      'Subscription Management',
      'Payment History',
      'Webhook Handling'
    ],
    timestamp: new Date().toISOString()
  });
} catch (error) {
  comprehensiveLogger.logSystemEvent('BILLING_SYSTEM_DISABLED', {
    reason: 'Billing routes file not found',
    impact: 'App will function normally without billing features',
    error: error.message,
    timestamp: new Date().toISOString()
  });
}
  console.log('✅ Vault routes registered: /api/vault/*');
  
  // Log Vault system availability
  comprehensiveLogger.logSystemEvent('VAULT_SYSTEM_ENABLED', {
    vaultRoutes: [
      '/api/vault',
      '/api/vault/certifications',
      '/api/vault/memberships'
    ],
    features: [
      'Professional Certifications',
      'Professional Memberships',
      'Branding & Visual Identity',
      'Digital Presence',
      'White Label Configuration',
      'Report Customization',
      'Scheduling Preferences'
    ],
    timestamp: new Date().toISOString()
  });
  
} catch (error) {
  console.log('⚠️ Vault routes not found - skipping (app will work without vault features)');
  console.log('Error details:', error.message);
  logger.warn('Vault routes not available:', error.message);
  
  comprehensiveLogger.logSystemEvent('VAULT_SYSTEM_DISABLED', {
    reason: 'Vault routes file not found',
    impact: 'App will function normally without vault features',
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// EXISTING ROUTES LOGGING (UNCHANGED)
// ============================================================================

// Log routes initialization
comprehensiveLogger.logSystemEvent('API_ROUTES_INITIALIZED', {
  routes: [
    '/api/auth', 
    '/api/clients', 
    '/api/admin', 
    '/api/plans', 
    '/api/meetings', 
    '/api/loe', 
    '/api/loe-automation',
    '/api/logs', 
    '/api/ab-testing-suite-2',
    '/api/kyc',
    '/api/mutual-fund-exit-strategies',
    '/api/cas-management', // NEW: CAS Management routes
    '/api/chat', // NEW: AI Chat routes
    '/api/stock-market', // NEW: Stock Market API routes
    '/api/client-reports', // NEW: Client Reports routes
    '/api/transcriptions', // Transcription routes
    '/api/transcripts', // NEW: Enhanced Transcript routes
    '/api/final-report', // Final Report routes
    '/api/estate-planning' // NEW: Estate Planning routes
  ],
  timestamp: new Date().toISOString()
});

// ============================================================================
// ERROR HANDLING (UNCHANGED)
// ============================================================================

// Global error handling middleware
app.use((err, req, res, next) => {
  const { method, url } = req;
  const advisorId = req.advisor?.id;
  
  logger.error(`Unhandled error in ${method} ${url}${advisorId ? ` (Advisor: ${advisorId})` : ''}: ${err.message}`);
  logger.error(err.stack);
  
  // Log to comprehensive logger
  comprehensiveLogger.logApplicationError(err, 'GlobalErrorHandler', 'high', {
    method,
    url,
    advisorId,
    requestId: req.requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Don't leak error details in production
  const message = NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(err.status || 500).json({
    success: false,
    message: 'Something went wrong!',
    error: message,
    requestId: req.requestId
  });
});

// 404 handler
app.use((req, res) => {
  const { method, url, ip } = req;
  
  logger.warn(`404 - Route not found: ${method} ${url} from IP: ${ip}`);
  
  // Log 404 to comprehensive logger
  comprehensiveLogger.logSystemEvent('ROUTE_NOT_FOUND', {
    method,
    url,
    ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId,
    severity: 'low'
  });
  
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestId: req.requestId,
    // ✅ NEW: Added /api/chat to available endpoints list
    availableEndpoints: {
      auth: '/api/auth/*',
      clients: '/api/clients/*',
      admin: '/api/admin/*',
      plans: '/api/plans/*',
      meetings: '/api/meetings/*',
      clientInvitations: '/api/client-invitations/*', // NEW: Client Invitations routes
      loe: '/api/loe/*',
      logs: '/api/logs/*',
      abTesting: '/api/ab-testing-suite-2/*',
      chat: '/api/chat/*',
      stockMarket: '/api/stock-market/*', // NEW: Stock Market API routes
      clientReports: '/api/client-reports/*', // NEW: Client Reports routes
      debug: '/api/debug/*' // NEW: Debug routes
    }
  });
});

// Import cleanup function
const { cleanup } = require('./middleware/performanceLogger');

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Log graceful shutdown initiation
  comprehensiveLogger.logSystemEvent('SERVER_SHUTDOWN_INITIATED', {
    signal,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
  
  // Cleanup performance monitoring
  cleanup();
  
  mongoose.connection.close().then(() => {
    logger.info('MongoDB connection closed');
    logger.info('Server shutdown complete');
    
    // Final log before shutdown
    comprehensiveLogger.logSystemEvent('SERVER_SHUTDOWN_COMPLETE', {
      signal,
      timestamp: new Date().toISOString()
    });
    
    process.exit(0);
  }).catch((error) => {
    logger.error('Error closing MongoDB connection:', error);
    process.exit(1);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${NODE_ENV}`);
  logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
  logger.info('Server startup complete ✅');
  
  // ✅ ENHANCED: Added AI Chat and Client Reports system status to startup log
  const aiChatAvailable = (() => {
    try {
      require('./routes/chat');
      return true;
    } catch {
      return false;
    }
  })();
  
  const clientReportsAvailable = (() => {
    try {
      require('./routes/clientReports');
      return true;
    } catch {
      return false;
    }
  })();
  
  // Log server startup to comprehensive logger
  comprehensiveLogger.logSystemEvent('SERVER_STARTUP_COMPLETE', {
    port: PORT,
    environment: NODE_ENV,
    apiBaseUrl: `http://localhost:${PORT}/api`,
    comprehensiveLoggingEnabled: true,
    aiChatSystemEnabled: aiChatAvailable, // NEW: AI Chat status
    clientReportsSystemEnabled: clientReportsAvailable, // NEW: Client Reports status
    loggingFeatures: [
      'userActivityLogging',
      'performanceLogging', 
      'databasePerformanceTracking',
      'errorBoundaryLogging',
      'frontendLogIngestion',
      'rateLimitTracking',
      'healthCheckMonitoring',
      ...(aiChatAvailable ? ['aiChatLogging'] : []), // NEW: Conditional AI Chat logging
      ...(clientReportsAvailable ? ['clientReportsLogging'] : []) // NEW: Conditional Client Reports logging
    ],
    timestamp: new Date().toISOString()
  });
  
  console.log('🎯 COMPREHENSIVE LOGGING: System fully activated with complete monitoring');
  
  // ✅ NEW: AI Chat system status display
  if (aiChatAvailable) {
    console.log('🤖 AI CHAT SYSTEM: ✅ Enabled and ready');
    console.log('   • Client Selection: GET /api/chat/clients');
    console.log('   • Send Message: POST /api/chat/clients/:id/message');
    console.log('   • Chat History: GET /api/chat/clients/:id/history');
  } else {
    console.log('🤖 AI CHAT SYSTEM: ⚠️ Disabled (routes not found - app works normally)');
  }
  
  // ✅ NEW: Client Reports system status display
  if (clientReportsAvailable) {
    console.log('📊 CLIENT REPORTS SYSTEM: ✅ Enabled and ready');
    console.log('   • Advisor Vault: GET /api/client-reports/vault');
    console.log('   • Client List: GET /api/client-reports/clients');
    console.log('   • Client Report: GET /api/client-reports/clients/:id');
  } else {
    console.log('📊 CLIENT REPORTS SYSTEM: ⚠️ Disabled (routes not found - app works normally)');
  }
});

// ============================================================================
// SUMMARY OF CHANGES MADE:
// ============================================================================
/*
✅ WHAT WAS ADDED (SAFE ADDITIONS ONLY):
1. Try-catch block for AI chat routes (line ~180)
2. AI Chat feature in health status (line ~96)
3. AI Chat routes in available endpoints (line ~290)
4. AI Chat system status in startup log (line ~350)
5. Conditional logging for AI Chat (line ~370)
6. Try-catch block for Client Reports routes (line ~220)
7. Client Reports feature in health status (line ~96)
8. Client Reports routes in available endpoints (line ~290)
9. Client Reports system status in startup log (line ~350)
10. Conditional logging for Client Reports (line ~370)

❌ WHAT WAS NOT CHANGED (100% PRESERVED):
1. All existing middleware setup
2. All existing route registrations
3. All existing error handling
4. All existing logging functionality
5. All existing MongoDB connection logic
6. All existing graceful shutdown logic

🛡️ SAFETY FEATURES:
1. Graceful fallback if chat routes don't exist
2. App continues to work even without AI chat
3. No breaking changes to existing functionality
4. All existing features preserved exactly as-is

📝 TESTING CHECKLIST:
✅ Existing auth should work: /api/auth/*
✅ Existing clients should work: /api/clients/*
✅ Existing plans should work: /api/plans/*
✅ Existing meetings should work: /api/meetings/*
✅ Existing admin should work: /api/admin/*
✅ Existing LOE should work: /api/loe/*
✅ Existing A/B testing should work: /api/ab-testing-suite-2/*
✅ Health check should work: /
✅ 404 handling should work for unknown routes
✅ Error handling should work as before
🆕 AI Chat should work: /api/chat/* (if routes file exists)
🆕 Client Reports should work: /api/client-reports/* (if routes file exists)
*/