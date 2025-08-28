const express = require('express');
const router = express.Router();
const enhancedTranscriptionController = require('../controllers/enhancedTranscriptionController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Add debug route FIRST
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Enhanced Transcriptions auth working',
    advisor: req.advisor ? { 
      id: req.advisor.id,
      email: req.advisor.email 
    } : 'NO_ADVISOR',
    timestamp: new Date().toISOString()
  });
});

// Add a detailed debug route
router.get('/debug', async (req, res) => {
  try {
    const advisorId = req.advisor?.id;
    
    if (!advisorId) {
      return res.json({ 
        error: 'No advisor ID', 
        advisorData: req.advisor,
        authHeader: req.headers.authorization ? 'Present' : 'Missing'
      });
    }
    
    const Meeting = require('../models/Meeting');
    
    // Count various meeting scenarios
    const totalMeetings = await Meeting.countDocuments({ advisorId });
    const withTranscripts = await Meeting.countDocuments({ 
      advisorId,
      'transcript': { $exists: true }
    });
    const withTranscriptIds = await Meeting.countDocuments({ 
      advisorId,
      'transcript.transcriptId': { $exists: true, $ne: null }
    });
    const withVttUrls = await Meeting.countDocuments({ 
      advisorId,
      'transcript.vttFileUrl': { $exists: true, $ne: null }
    });
    
    res.json({
      success: true,
      debug: {
        advisorId,
        totalMeetings,
        withTranscripts,
        withTranscriptIds,
        withVttUrls,
        hasAuth: !!req.advisor
      }
    });
  } catch (error) {
    res.json({ 
      success: false, 
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

/**
 * @route GET /api/enhanced-transcriptions
 * @desc Get all meetings with parsed transcriptions for an advisor
 * @access Private (Advisor only)
 */
router.get('/', enhancedTranscriptionController.getAdvisorTranscriptions);

/**
 * @route POST /api/enhanced-transcriptions/:meetingId/parse
 * @desc Parse transcription from Daily.co URL for a specific meeting
 * @access Private (Advisor only)
 */
router.post('/:meetingId/parse', enhancedTranscriptionController.parseMeetingTranscription);

/**
 * @route GET /api/enhanced-transcriptions/:meetingId/details
 * @desc Get detailed transcription view for a specific meeting
 * @access Private (Advisor only)
 */
router.get('/:meetingId/details', enhancedTranscriptionController.getMeetingTranscriptionDetails);

/**
 * @route POST /api/enhanced-transcriptions/bulk-parse
 * @desc Bulk parse all unparsed transcriptions for an advisor
 * @access Private (Advisor only)
 */
router.post('/bulk-parse', enhancedTranscriptionController.bulkParseTranscriptions);

/**
 * @route GET /api/enhanced-transcriptions/search
 * @desc Search transcriptions by content
 * @access Private (Advisor only)
 */
router.get('/search', enhancedTranscriptionController.searchTranscriptions);

module.exports = router;
