const DailyTranscriptionService = require('../services/dailyTranscriptionService');
const Transcription = require('../models/Transcription');
const Meeting = require('../models/Meeting');
const { logger } = require('../utils/logger');

// Initialize service
const dailyTranscriptionService = new DailyTranscriptionService();

// Sync all transcriptions from Daily.co
exports.syncTranscriptions = async (req, res) => {
  const requestId = `SYNC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('🔄 [TranscriptionController] Syncing transcriptions', {
      requestId,
      advisorId: req.advisor?.id
    });

    const result = await dailyTranscriptionService.syncAllTranscriptions();
    
    if (result.success) {
      logger.info('✅ [TranscriptionController] Sync completed successfully', {
        requestId,
        ...result
      });

      res.json({
        success: true,
        message: 'Transcriptions synced successfully',
        data: result
      });
    } else {
      logger.error('❌ [TranscriptionController] Sync failed', {
        requestId,
        error: result.error
      });

      res.status(500).json({
        success: false,
        error: 'Failed to sync transcriptions',
        details: result.error
      });
    }
  } catch (error) {
    logger.error('❌ [TranscriptionController] Sync error', {
      requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error during transcription sync'
    });
  }
};

// Get transcriptions for advisor
exports.getAdvisorTranscriptions = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const { limit = 20, status, fetchStatus } = req.query;

    logger.info('📋 [TranscriptionController] Fetching advisor transcriptions', {
      advisorId,
      limit,
      status,
      fetchStatus
    });

    let query = { advisorId };
    if (status) query.status = status;
    if (fetchStatus) query.fetchStatus = fetchStatus;

    const transcriptions = await Transcription.find(query)
      .populate('meetingId', 'roomName scheduledAt duration')
      .populate('clientId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    logger.info('✅ [TranscriptionController] Transcriptions fetched', {
      advisorId,
      count: transcriptions.length
    });

    res.json({
      success: true,
      transcriptions: transcriptions.map(t => ({
        id: t._id,
        transcriptId: t.transcriptId,
        meeting: t.meetingId,
        client: t.clientId,
        duration: t.duration,
        status: t.status,
        fetchStatus: t.fetchStatus,
        hasContent: !!t.transcriptContent,
        createdAt: t.createdAt,
        fetchedAt: t.fetchedAt,
        summary: t.parsedTranscript?.summary
      }))
    });

  } catch (error) {
    logger.error('❌ [TranscriptionController] Error fetching transcriptions', {
      advisorId: req.advisor?.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch transcriptions'
    });
  }
};

// Get specific transcription by ID
exports.getTranscriptionById = async (req, res) => {
  try {
    const { transcriptionId } = req.params;
    const advisorId = req.advisor.id;

    const transcription = await Transcription.findOne({
      _id: transcriptionId,
      advisorId
    })
    .populate('meetingId', 'roomName scheduledAt duration')
    .populate('clientId', 'firstName lastName email');

    if (!transcription) {
      return res.status(404).json({
        success: false,
        error: 'Transcription not found'
      });
    }

    res.json({
      success: true,
      transcription: {
        id: transcription._id,
        transcriptId: transcription.transcriptId,
        meeting: transcription.meetingId,
        client: transcription.clientId,
        duration: transcription.duration,
        status: transcription.status,
        fetchStatus: transcription.fetchStatus,
        content: transcription.transcriptContent,
        parsedTranscript: transcription.parsedTranscript,
        downloadUrl: transcription.downloadUrl,
        createdAt: transcription.createdAt,
        fetchedAt: transcription.fetchedAt
      }
    });

  } catch (error) {
    logger.error('❌ [TranscriptionController] Error fetching transcription', {
      transcriptionId: req.params.transcriptionId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch transcription'
    });
  }
};

// Retry failed transcription fetches
exports.retryFailedFetches = async (req, res) => {
  try {
    logger.info('🔄 [TranscriptionController] Retrying failed fetches');

    const result = await dailyTranscriptionService.retryFailedFetches();

    if (result.success) {
      res.json({
        success: true,
        message: 'Failed fetches retried successfully',
        data: result.retryResults
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('❌ [TranscriptionController] Error retrying fetches', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retry transcription fetches'
    });
  }
};

// Fetch specific transcription content
exports.fetchTranscriptionContent = async (req, res) => {
  try {
    const { transcriptionId } = req.params;
    const advisorId = req.advisor.id;

    const transcription = await Transcription.findOne({
      _id: transcriptionId,
      advisorId
    });

    if (!transcription) {
      return res.status(404).json({
        success: false,
        error: 'Transcription not found'
      });
    }

    const result = await dailyTranscriptionService.fetchAndStoreTranscriptionContent(transcription);

    if (result.success) {
      res.json({
        success: true,
        message: 'Transcription content fetched successfully',
        transcription: {
          id: result.transcription._id,
          fetchStatus: result.transcription.fetchStatus,
          hasContent: !!result.transcription.transcriptContent
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('❌ [TranscriptionController] Error fetching content', {
      transcriptionId: req.params.transcriptionId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch transcription content'
    });
  }
};

// Test Daily.co connection
exports.testDailyConnection = async (req, res) => {
  try {
    const dailyTranscriptionService = new DailyTranscriptionService();
    const result = await dailyTranscriptionService.fetchAllTranscriptions(5);
    
    console.log('Daily.co Response:', result);
    
    res.json({
      success: true,
      message: 'Check console for Daily.co response',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
