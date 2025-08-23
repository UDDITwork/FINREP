//routes/transcription.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const transcriptionController = require('../controllers/transcriptionController');
const { logger } = require('../utils/logger');

// Apply authentication middleware
router.use(auth);

// Sync all transcriptions from Daily.co
router.post('/sync', (req, res, next) => {
  logger.info('🔄 [TranscriptionRoutes] Sync transcriptions request', {
    advisorId: req.advisor?.id
  });
  next();
}, transcriptionController.syncTranscriptions);

// Get transcriptions for current advisor
router.get('/advisor', (req, res, next) => {
  logger.info('📋 [TranscriptionRoutes] Get advisor transcriptions', {
    advisorId: req.advisor?.id,
    query: req.query
  });
  next();
}, transcriptionController.getAdvisorTranscriptions);

// Get specific transcription
router.get('/:transcriptionId', (req, res, next) => {
  logger.info('🔍 [TranscriptionRoutes] Get transcription by ID', {
    transcriptionId: req.params.transcriptionId,
    advisorId: req.advisor?.id
  });
  next();
}, transcriptionController.getTranscriptionById);

// Fetch transcription content
router.post('/:transcriptionId/fetch', (req, res, next) => {
  logger.info('⬇️ [TranscriptionRoutes] Fetch transcription content', {
    transcriptionId: req.params.transcriptionId,
    advisorId: req.advisor?.id
  });
  next();
}, transcriptionController.fetchTranscriptionContent);

// Retry failed fetches
router.post('/retry-failed', (req, res, next) => {
  logger.info('🔄 [TranscriptionRoutes] Retry failed fetches', {
    advisorId: req.advisor?.id
  });
  next();
}, transcriptionController.retryFailedFetches);

// Test Daily.co connection
router.get('/test-daily', transcriptionController.testDailyConnection);

// Health check
router.get('/health/check', (req, res) => {
  res.json({
    success: true,
    service: 'transcriptions',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dailyApiConfigured: !!process.env.DAILY_API_KEY
  });
});

module.exports = router;
