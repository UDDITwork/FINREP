// File: backend/routes/transcriptRoutes.js
const express = require('express');
const router = express.Router();
const transcriptController = require('../controllers/transcriptController');
const auth = require('../middleware/auth');

// Fetch WebVTT content and parse it
router.get('/:meetingId/webvtt', auth, transcriptController.fetchWebVTTContent);

// Get clean conversation format for display
router.get('/:meetingId/conversation', auth, transcriptController.getCleanConversation);

// Get raw transcript data
router.get('/:meetingId/raw', auth, async (req, res) => {
  try {
    const Meeting = require('../models/Meeting');
    const meeting = await Meeting.findById(req.params.meetingId);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({
      success: true,
      transcript: meeting.transcript,
      hasContent: !!meeting.transcript?.transcriptContent
    });
  } catch (error) {
    console.error('Error fetching raw transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

module.exports = router;