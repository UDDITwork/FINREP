// File: backend/controllers/transcriptController.js
const Meeting = require('../models/Meeting');
const axios = require('axios');

const transcriptController = {
  // Fetch and parse WebVTT content from Daily.co URL
  fetchWebVTTContent: async (req, res) => {
    try {
      const { meetingId } = req.params;
      
      // Find the meeting
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      // Check if transcript content already exists
      if (meeting.transcript?.transcriptContent) {
        return res.json({
          success: true,
          content: meeting.transcript.transcriptContent,
          parsedTranscript: meeting.transcript.parsedTranscript,
          speakers: meeting.transcript.speakers
        });
      }

      // Fetch from Daily.co URL if available
      const vttUrl = meeting.transcript?.vttFileUrl;
      if (!vttUrl) {
        return res.status(404).json({ error: 'No transcript URL available' });
      }

      console.log('🔍 Fetching WebVTT content from:', vttUrl);

      // Fetch the WebVTT content
      const response = await axios.get(vttUrl, {
        timeout: 30000,
        headers: {
          'Accept': 'text/vtt, text/plain, */*'
        }
      });

      const webvttContent = response.data;
      console.log('📄 WebVTT Content received, length:', webvttContent.length);

      // Parse the WebVTT content using the model method
      const parsedTranscript = meeting.parseWebVTTContent(webvttContent);
      
      // Update meeting with the fetched content
      meeting.transcript.transcriptContent = webvttContent;
      meeting.transcript.parsedTranscript = parsedTranscript;
      meeting.transcript.fetchStatus = 'completed';
      meeting.transcript.fetchedAt = new Date();
      
      await meeting.save();

      res.json({
        success: true,
        content: webvttContent,
        parsedTranscript: parsedTranscript,
        speakers: parsedTranscript?.speakers || [],
        fetchedAt: new Date()
      });

    } catch (error) {
      console.error('❌ Error fetching WebVTT content:', error);
      
      // Update meeting with error status
      if (req.params.meetingId) {
        try {
          await Meeting.findByIdAndUpdate(req.params.meetingId, {
            'transcript.fetchStatus': 'failed',
            'transcript.fetchError': error.message,
            'transcript.lastFetchAttempt': new Date()
          });
        } catch (updateError) {
          console.error('Failed to update meeting error status:', updateError);
        }
      }

      res.status(500).json({
        error: 'Failed to fetch transcript content',
        details: error.message
      });
    }
  },

  // Get clean conversation format
  getCleanConversation: async (req, res) => {
    try {
      const { meetingId } = req.params;
      
      const meeting = await Meeting.findById(meetingId)
        .populate('clientId', 'firstName lastName')
        .populate('advisorId', 'firstName lastName');

      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      const parsedTranscript = meeting.transcript?.parsedTranscript;
      if (!parsedTranscript || !parsedTranscript.speakers) {
        return res.status(404).json({ error: 'No parsed transcript available' });
      }

      // Convert to clean conversation format
      const conversation = [];
      
      // Collect all segments from all speakers and sort by time
      const allSegments = [];
      parsedTranscript.speakers.forEach(speaker => {
        speaker.segments.forEach(segment => {
          allSegments.push({
            speaker: speaker.speakerName,
            startTime: segment.startTime,
            endTime: segment.endTime,
            text: segment.text,
            confidence: segment.confidence
          });
        });
      });

      // Sort by start time
      allSegments.sort((a, b) => a.startTime - b.startTime);

      // Format timestamps
      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      // Build clean conversation
      allSegments.forEach(segment => {
        conversation.push({
          speaker: segment.speaker,
          timestamp: formatTime(segment.startTime),
          text: segment.text,
          timeSeconds: segment.startTime
        });
      });

      // Get meeting participants info
      const participants = {
        advisor: meeting.advisorId ? `${meeting.advisorId.firstName} ${meeting.advisorId.lastName}` : 'Advisor',
        client: meeting.clientId ? `${meeting.clientId.firstName} ${meeting.clientId.lastName}` : 'Client'
      };

      res.json({
        success: true,
        conversation,
        participants,
        meetingInfo: {
          duration: meeting.duration,
          startedAt: meeting.startedAt,
          endedAt: meeting.endedAt,
          participantCount: parsedTranscript.speakers.length
        },
        summary: parsedTranscript.summary
      });

    } catch (error) {
      console.error('❌ Error getting clean conversation:', error);
      res.status(500).json({
        error: 'Failed to get conversation',
        details: error.message
      });
    }
  }
};

module.exports = transcriptController;