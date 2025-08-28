const Meeting = require('../models/Meeting');
const transcriptionParserService = require('../services/transcriptionParserService');

class EnhancedTranscriptionController {
  constructor() {
    // Use console directly to avoid logger import issues
    this.logger = {
      info: console.log,
      error: console.error,
      warn: console.warn
    };
    console.log('✅ Enhanced Transcription Controller initialized with console logger');
    
    // Bind methods to preserve 'this' context
    this.getAdvisorTranscriptions = this.getAdvisorTranscriptions.bind(this);
    this.parseMeetingTranscription = this.parseMeetingTranscription.bind(this);
    this.getMeetingTranscriptionDetails = this.getMeetingTranscriptionDetails.bind(this);
    this.bulkParseTranscriptions = this.bulkParseTranscriptions.bind(this);
    this.searchTranscriptions = this.searchTranscriptions.bind(this);
  }

  /**
   * Get all meetings with parsed transcriptions for an advisor
   */
  async getAdvisorTranscriptions(req, res) {
    const requestId = `GET_TRANSCRIPTS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const advisorId = req.advisor?.id;
    
    if (!advisorId) {
      console.error('Missing advisor ID:', {
        hasAdvisor: !!req.advisor,
        advisorKeys: req.advisor ? Object.keys(req.advisor) : 'none',
        authHeader: req.headers.authorization ? 'present' : 'missing'
      });
      
      return res.status(401).json({
        success: false,
        error: 'Authentication required - No advisor ID found',
        requestId
      });
    }

    try {
      console.log('Fetching transcriptions for advisor:', advisorId);

      // Start with simple query - all meetings for advisor
      const meetings = await Meeting.find({ advisorId })
        .populate('clientId', 'firstName lastName email')
        .populate('advisorId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .lean(); // Use lean for better performance

      console.log(`Found ${meetings.length} total meetings for advisor`);

      // Filter meetings that have any transcript data
      const meetingsWithTranscripts = meetings.filter(meeting => {
        return meeting.transcript && (
          meeting.transcript.transcriptId ||
          meeting.transcript.vttFileUrl ||
          meeting.transcript.downloadUrl ||
          (meeting.transcript.realTimeMessages && meeting.transcript.realTimeMessages.length > 0)
        );
      });

      console.log(`Found ${meetingsWithTranscripts.length} meetings with transcript data`);

      // Process meetings to add status flags
      const processedMeetings = meetingsWithTranscripts.map(meeting => {
        const hasVttUrl = !!(meeting.transcript?.vttFileUrl || meeting.transcript?.downloadUrl);
        const hasParsedData = !!(meeting.transcript?.parsedTranscript && 
                                meeting.transcript?.parsedTranscript?.speakers?.length > 0);
        
        return {
          ...meeting,
          hasVttUrl,
          hasParsedData,
          needsParsing: hasVttUrl && !hasParsedData
        };
      });

      res.json({
        success: true,
        meetings: processedMeetings,
        total: processedMeetings.length,
        requestId
      });

    } catch (error) {
      console.error('Enhanced transcription error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transcriptions',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        requestId
      });
    }
  }

  /**
   * Parse transcription from Daily.co URL for a specific meeting
   */
  async parseMeetingTranscription(req, res) {
    const requestId = `PARSE_MEETING_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { meetingId } = req.params;
    const advisorId = req.advisor.id;

    try {
      this.logger.info('📄 [ENHANCED TRANSCRIPTION] Parsing meeting transcription', {
        requestId,
        meetingId,
        advisorId,
        timestamp: new Date().toISOString()
      });

      // Find the meeting and verify ownership
      const meeting = await Meeting.findOne({
        _id: meetingId,
        advisorId
      });

      if (!meeting) {
        return res.status(404).json({
          success: false,
          error: 'Meeting not found or access denied',
          requestId
        });
      }

      // Check if meeting has transcription data
      if (!meeting.transcript?.vttFileUrl) {
        return res.status(400).json({
          success: false,
          error: 'No transcription URL available for this meeting',
          requestId
        });
      }

      // Parse the transcription from the VTT URL
      const parseResult = await transcriptionParserService.parseTranscriptionFromUrl(
        meeting.transcript.vttFileUrl
      );

      if (!parseResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to parse transcription content',
          details: parseResult.error,
          requestId
        });
      }

      // Update the meeting with parsed transcript data
      meeting.transcript.parsedTranscript = parseResult.data;
      meeting.transcript.lastParsedAt = new Date();
      meeting.transcript.parseStatus = 'completed';
      
      await meeting.save();

      this.logger.info('✅ [ENHANCED TRANSCRIPTION] Meeting transcription parsed and saved', {
        requestId,
        meetingId,
        speakerCount: parseResult.data.speakers.length,
        totalSegments: parseResult.data.totalSegments,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Transcription parsed successfully',
        data: {
          meetingId,
          parsedTranscript: parseResult.data,
          speakers: parseResult.data.speakers,
          summary: parseResult.data.summary
        },
        requestId
      });

    } catch (error) {
      this.logger.error('❌ [ENHANCED TRANSCRIPTION] Failed to parse meeting transcription', {
        requestId,
        meetingId,
        advisorId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        error: 'Failed to parse transcription',
        details: error.message,
        requestId
      });
    }
  }

  /**
   * Get detailed transcription view for a specific meeting
   */
  async getMeetingTranscriptionDetails(req, res) {
    const requestId = `GET_DETAILS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { meetingId } = req.params;
    const advisorId = req.advisor.id;

    try {
      this.logger.info('📄 [ENHANCED TRANSCRIPTION] Getting meeting transcription details', {
        requestId,
        meetingId,
        advisorId,
        timestamp: new Date().toISOString()
      });

      // Find the meeting and verify ownership
      const meeting = await Meeting.findOne({
        _id: meetingId,
        advisorId
      })
      .populate('clientId', 'firstName lastName email')
      .populate('advisorId', 'firstName lastName email');

      if (!meeting) {
        return res.status(404).json({
          success: false,
          error: 'Meeting not found or access denied',
          requestId
        });
      }

      // Check if we have parsed transcript data
      if (!meeting.transcript?.parsedTranscript) {
        return res.status(400).json({
          success: false,
          error: 'No parsed transcription data available. Please parse the transcription first.',
          requestId
        });
      }

      const transcriptionData = {
        meeting: {
          id: meeting._id,
          roomName: meeting.roomName,
          scheduledAt: meeting.scheduledAt,
          duration: meeting.duration,
          status: meeting.status,
          client: meeting.clientId,
          advisor: meeting.advisorId
        },
        transcription: {
          transcriptId: meeting.transcript.transcriptId,
          status: meeting.transcript.status,
          parsedAt: meeting.transcript.lastParsedAt,
          segments: meeting.transcript.parsedTranscript.segments,
          speakers: meeting.transcript.parsedTranscript.speakers,
          summary: meeting.transcript.parsedTranscript.summary,
          totalDuration: meeting.transcript.parsedTranscript.totalDuration,
          totalSegments: meeting.transcript.parsedTranscript.totalSegments
        }
      };

      this.logger.info('✅ [ENHANCED TRANSCRIPTION] Meeting transcription details retrieved', {
        requestId,
        meetingId,
        speakerCount: transcriptionData.transcription.speakers.length,
        totalSegments: transcriptionData.transcription.totalSegments,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        data: transcriptionData,
        requestId
      });

    } catch (error) {
      this.logger.error('❌ [ENHANCED TRANSCRIPTION] Failed to get meeting transcription details', {
        requestId,
        meetingId,
        advisorId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transcription details',
        details: error.message,
        requestId
      });
    }
  }

  /**
   * Bulk parse all unparsed transcriptions for an advisor
   */
  async bulkParseTranscriptions(req, res) {
    const requestId = `BULK_PARSE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const advisorId = req.advisor.id;

    try {
      this.logger.info('📄 [ENHANCED TRANSCRIPTION] Starting bulk parse operation', {
        requestId,
        advisorId,
        timestamp: new Date().toISOString()
      });

      // Find all meetings that need parsing
      const meetingsToParse = await Meeting.find({
        advisorId,
        'transcript.vttFileUrl': { $exists: true, $ne: null },
        'transcript.parseStatus': { $ne: 'completed' }
      });

      this.logger.info('📄 [ENHANCED TRANSCRIPTION] Found meetings requiring parsing', {
        requestId,
        meetingCount: meetingsToParse.length,
        timestamp: new Date().toISOString()
      });

      if (meetingsToParse.length === 0) {
        return res.json({
          success: true,
          message: 'No transcriptions require parsing',
          processed: 0,
          requestId
        });
      }

      // Process transcriptions in batches to avoid overwhelming the system
      const batchSize = 3;
      const results = {
        total: meetingsToParse.length,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < meetingsToParse.length; i += batchSize) {
        const batch = meetingsToParse.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (meeting) => {
            try {
              const parseResult = await transcriptionParserService.parseTranscriptionFromUrl(
                meeting.transcript.vttFileUrl
              );

              if (parseResult.success) {
                meeting.transcript.parsedTranscript = parseResult.data;
                meeting.transcript.lastParsedAt = new Date();
                meeting.transcript.parseStatus = 'completed';
                await meeting.save();
                
                results.successful++;
              } else {
                results.failed++;
                results.errors.push({
                  meetingId: meeting._id,
                  error: parseResult.error
                });
              }
              
              results.processed++;
            } catch (error) {
              results.failed++;
              results.errors.push({
                meetingId: meeting._id,
                error: error.message
              });
              results.processed++;
            }
          })
        );

        // Small delay between batches
        if (i + batchSize < meetingsToParse.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.logger.info('✅ [ENHANCED TRANSCRIPTION] Bulk parse operation completed', {
        requestId,
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Bulk parse operation completed',
        results,
        requestId
      });

    } catch (error) {
      this.logger.error('❌ [ENHANCED TRANSCRIPTION] Bulk parse operation failed', {
        requestId,
        advisorId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        error: 'Bulk parse operation failed',
        details: error.message,
        requestId
      });
    }
  }

  /**
   * Search transcriptions by content
   */
  async searchTranscriptions(req, res) {
    const requestId = `SEARCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const advisorId = req.advisor.id;
    const { query, limit = 20 } = req.query;

    try {
      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters long',
          requestId
        });
      }

      this.logger.info('🔍 [ENHANCED TRANSCRIPTION] Searching transcriptions', {
        requestId,
        advisorId,
        query,
        limit,
        timestamp: new Date().toISOString()
      });

      // Find meetings with parsed transcriptions
      const meetings = await Meeting.find({
        advisorId,
        'transcript.parsedTranscript': { $exists: true },
        'transcript.parseStatus': 'completed'
      })
      .populate('clientId', 'firstName lastName email')
      .limit(parseInt(limit));

      // Search through transcription content
      const searchResults = [];
      const searchQuery = query.toLowerCase();

      meetings.forEach(meeting => {
        const segments = meeting.transcript.parsedTranscript.segments || [];
        const matchingSegments = segments.filter(segment => 
          segment.text.toLowerCase().includes(searchQuery)
        );

        if (matchingSegments.length > 0) {
          searchResults.push({
            meetingId: meeting._id,
            client: meeting.clientId,
            roomName: meeting.roomName,
            scheduledAt: meeting.scheduledAt,
            matchingSegments: matchingSegments.map(seg => ({
              text: seg.text,
              startTime: seg.startTime,
              endTime: seg.endTime,
              speaker: seg.speaker
            })),
            matchCount: matchingSegments.length
          });
        }
      });

      // Sort by relevance (number of matches)
      searchResults.sort((a, b) => b.matchCount - a.matchCount);

      this.logger.info('✅ [ENHANCED TRANSCRIPTION] Search completed', {
        requestId,
        query,
        resultsFound: searchResults.length,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        query,
        results: searchResults,
        total: searchResults.length,
        requestId
      });

    } catch (error) {
      this.logger.error('❌ [ENHANCED TRANSCRIPTION] Search failed', {
        requestId,
        advisorId,
        query,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        error: 'Search failed',
        details: error.message,
        requestId
      });
    }
  }
}

module.exports = new EnhancedTranscriptionController();
