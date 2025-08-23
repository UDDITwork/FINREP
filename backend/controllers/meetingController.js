// File: backend/controllers/meetingController.js
const axios = require('axios');
const Meeting = require('../models/Meeting');
const Client = require('../models/Client');
const { logger } = require('../utils/logger');
const DailyTranscriptionService = require('../services/dailyTranscriptionService');

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN;

// Create a new meeting room
exports.createMeeting = async (req, res) => {
  const requestId = `MEETING_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('📅 [MeetingController] Creating new meeting', {
      requestId,
      advisorId: req.advisor?.id,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const { clientId, scheduledAt, meetingType = 'scheduled' } = req.body;
    const advisorId = req.advisor.id;

    // Validate required fields
    if (!clientId) {
      logger.warn('❌ [MeetingController] Missing clientId', { requestId });
      return res.status(400).json({ 
        success: false,
        error: 'Client ID is required' 
      });
    }

    // Verify client belongs to advisor
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      logger.warn('❌ [MeetingController] Client not found or unauthorized', {
        requestId,
        clientId,
        advisorId
      });
      return res.status(404).json({ 
        success: false,
        error: 'Client not found or unauthorized access' 
      });
    }

    logger.info('✅ [MeetingController] Client verified', {
      requestId,
      clientName: `${client.firstName} ${client.lastName}`,
      clientEmail: client.email
    });

    // Generate unique room name
    const timestamp = Date.now();
    const roomName = `meeting-${advisorId}-${clientId}-${timestamp}`;

    logger.info('🏠 [MeetingController] Creating Daily.co room', {
      requestId,
      roomName,
      dailyApiKey: DAILY_API_KEY ? 'Present' : 'Missing'
    });

    // Create Daily.co room with transcription support
    const roomResponse = await axios.post(
      'https://api.daily.co/v1/rooms',
      {
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: 5,
          exp: Math.floor(Date.now() / 1000) + 86400, // 24 hour expiry
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          // Enable transcription features with template
          enable_transcription: true,
          enable_transcription_storage: true,
          transcription_template: '{domain_name}/{room_name}/{mtg_session_id}_{epoch_time}.vtt'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('✅ [MeetingController] Daily.co room created', {
      requestId,
      roomUrl: roomResponse.data.url,
      dailyRoomId: roomResponse.data.id,
      roomName: roomName,
      // ⭐ ADD THESE FIELDS FOR DEBUGGING
      roomConfig: roomResponse.data.config,
      roomProperties: roomResponse.data.properties
    });

    // Create meeting tokens
    const tokens = await createMeetingTokens(roomName, advisorId, clientId, client, requestId);

    // Parse scheduledAt if provided
    let meetingScheduledAt = new Date();
    if (scheduledAt) {
      meetingScheduledAt = new Date(scheduledAt);
      if (isNaN(meetingScheduledAt.getTime())) {
        logger.warn('⚠️ [MeetingController] Invalid scheduledAt date, using current time', {
          requestId,
          providedDate: scheduledAt
        });
        meetingScheduledAt = new Date();
      }
    }

    // Save meeting to database
    const meeting = new Meeting({
      advisorId,
      clientId,
      roomName, // ⭐ Ensure this matches what Daily.co returns
      roomUrl: roomResponse.data.url,
      dailyRoomId: roomResponse.data.id, // ⭐ This should match transcript roomId
      dailyMtgSessionId: null,
      scheduledAt: meetingScheduledAt,
      meetingType,
      tokens: {
        advisorToken: tokens.advisorToken,
        clientToken: tokens.clientToken
      }
    });

    // ⭐ Add verification logging
    logger.info('💾 Storing meeting with correct Daily.co mapping:', {
      roomName: meeting.roomName,
      dailyRoomId: meeting.dailyRoomId,
      roomUrl: meeting.roomUrl,
      expectedTranscriptMatch: {
        byRoomId: meeting.dailyRoomId,
        byRoomName: meeting.roomName
      }
    });

    await meeting.save();

    // Populate client data for response
    await meeting.populate('clientId', 'firstName lastName email');

    logger.info('✅ [MeetingController] Meeting created successfully', {
      requestId,
      meetingId: meeting._id,
      roomUrl: meeting.roomUrl,
      clientMeetingLink: meeting.clientMeetingLink,
      // ⭐ ADD THIS TO VERIFY CORRECT STORAGE
      storedRoomName: meeting.roomName,
      storedDailyRoomId: meeting.dailyRoomId
    });

    res.json({
      success: true,
      meeting: {
        id: meeting._id,
        roomName: meeting.roomName,
        roomUrl: meeting.roomUrl,
        scheduledAt: meeting.scheduledAt,
        status: meeting.status,
        meetingType: meeting.meetingType,
        client: meeting.clientId,
        clientMeetingLink: meeting.clientMeetingLink,
        advisorMeetingLink: meeting.advisorMeetingLink
      },
      tokens: {
        advisorToken: tokens.advisorToken,
        clientToken: tokens.clientToken
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error creating meeting', {
      requestId,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      dailyApiResponse: error.response?.data
    });

    // Handle Daily.co API errors specifically
    if (error.response?.status) {
      return res.status(error.response.status).json({
        success: false,
        error: 'Failed to create meeting room',
        details: error.response.data
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to create meeting',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create instant meeting
exports.createInstantMeeting = async (req, res) => {
  const requestId = `INSTANT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('⚡ [MeetingController] Creating instant meeting', {
      requestId,
      advisorId: req.advisor?.id,
      body: req.body
    });

    // Add meetingType and current time
    req.body.meetingType = 'instant';
    req.body.scheduledAt = new Date().toISOString();

    // Use the regular createMeeting function
    return await exports.createMeeting(req, res);

  } catch (error) {
    logger.error('❌ [MeetingController] Error creating instant meeting', {
      requestId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to create instant meeting' 
    });
  }
};

// Get meetings for advisor
exports.getAdvisorMeetings = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const { limit = 20, status, type } = req.query;

    logger.info('📋 [MeetingController] Fetching advisor meetings', {
      advisorId,
      limit,
      status,
      type
    });

    let query = { advisorId };
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.meetingType = type;
    }

    const meetings = await Meeting.find(query)
      .populate('clientId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    logger.info('✅ [MeetingController] Meetings fetched successfully', {
      advisorId,
      meetingsCount: meetings.length
    });

    res.json({
      success: true,
      meetings: meetings.map(meeting => ({
        id: meeting._id,
        roomName: meeting.roomName,
        roomUrl: meeting.roomUrl,
        scheduledAt: meeting.scheduledAt,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        duration: meeting.duration,
        status: meeting.status,
        meetingType: meeting.meetingType,
        client: meeting.clientId,
        clientMeetingLink: meeting.clientMeetingLink,
        advisorMeetingLink: meeting.advisorMeetingLink,
        createdAt: meeting.createdAt
      }))
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error fetching meetings', {
      advisorId: req.advisor?.id,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch meetings' 
    });
  }
};

// Get specific meeting by ID
exports.getMeetingById = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const advisorId = req.advisor.id;

    logger.info('🔍 [MeetingController] Fetching meeting by ID', {
      meetingId,
      advisorId
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    }).populate('clientId', 'firstName lastName email');

    if (!meeting) {
      logger.warn('❌ [MeetingController] Meeting not found', {
        meetingId,
        advisorId
      });
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    logger.info('✅ [MeetingController] Meeting found', {
      meetingId,
      roomName: meeting.roomName,
      status: meeting.status
    });

    res.json({
      success: true,
      meeting: {
        id: meeting._id,
        roomName: meeting.roomName,
        roomUrl: meeting.roomUrl,
        scheduledAt: meeting.scheduledAt,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        duration: meeting.duration,
        status: meeting.status,
        meetingType: meeting.meetingType,
        client: meeting.clientId,
        clientMeetingLink: meeting.clientMeetingLink,
        advisorMeetingLink: meeting.advisorMeetingLink,
        transcript: meeting.transcript,
        notes: meeting.notes,
        createdAt: meeting.createdAt
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error fetching meeting', {
      meetingId: req.params.meetingId,
      advisorId: req.advisor?.id,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch meeting' 
    });
  }
};

// Start transcription for a meeting
exports.startTranscription = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const transcriptionData = req.body;
    const advisorId = req.advisor.id;

    logger.info('🎙️ [MeetingController] Starting transcription', {
      meetingId,
      advisorId,
      instanceId: transcriptionData.instanceId
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    });

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    await meeting.startTranscription({
      ...transcriptionData,
      startedBy: transcriptionData.startedBy || advisorId
    });

    logger.info('✅ [MeetingController] Transcription started', {
      meetingId,
      instanceId: transcriptionData.instanceId,
      status: meeting.transcript.status
    });

    res.json({ 
      success: true,
      message: 'Transcription started successfully',
      transcript: {
        status: meeting.transcript.status,
        instanceId: meeting.transcript.instanceId,
        startedAt: meeting.transcript.startedAt
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error starting transcription', {
      meetingId: req.params.meetingId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to start transcription' 
    });
  }
};

// Stop transcription for a meeting
exports.stopTranscription = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { stoppedBy } = req.body;
    const advisorId = req.advisor.id;

    logger.info('🛑 [MeetingController] Stopping transcription', {
      meetingId,
      advisorId,
      stoppedBy
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    });

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    await meeting.stopTranscription(stoppedBy || advisorId);
    
    // Compile final transcript
    const finalTranscript = meeting.compileFinalTranscript();

    logger.info('✅ [MeetingController] Transcription stopped', {
      meetingId,
      finalTranscriptLength: finalTranscript.length,
      messageCount: meeting.transcript.realTimeMessages.length
    });

    res.json({ 
      success: true,
      message: 'Transcription stopped successfully',
      transcript: {
        status: meeting.transcript.status,
        stoppedAt: meeting.transcript.stoppedAt,
        messageCount: meeting.transcript.realTimeMessages.length,
        finalTranscriptLength: finalTranscript.length
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error stopping transcription', {
      meetingId: req.params.meetingId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to stop transcription' 
    });
  }
};

// Save transcript message (for real-time transcription)
exports.saveTranscriptMessage = async (req, res) => {
  try {
    const { meetingId, participantId, participantName, text, timestamp, isFinal, confidence, instanceId } = req.body;
    
    logger.info('📝 [MeetingController] Saving transcript message', {
      meetingId,
      participantName,
      textLength: text?.length,
      isFinal,
      instanceId
    });

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    await meeting.addTranscriptMessage({
      participantId,
      participantName,
      text,
      timestamp: timestamp || new Date(),
      isFinal: isFinal || false,
      confidence,
      instanceId
    });

    logger.info('✅ [MeetingController] Transcript message saved', {
      meetingId,
      messagesCount: meeting.transcript.realTimeMessages.length,
      speakersCount: meeting.transcript.speakers.length
    });

    res.json({ 
      success: true,
      message: 'Transcript message saved successfully',
      stats: {
        totalMessages: meeting.transcript.realTimeMessages.length,
        speakersCount: meeting.transcript.speakers.length
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error saving transcript', {
      meetingId: req.body.meetingId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to save transcript message' 
    });
  }
};

// Get meeting transcript
exports.getMeetingTranscript = async (req, res) => {
  const requestId = `GET_TRANSCRIPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { meetingId } = req.params;
    const advisorId = req.advisor.id;

    console.log('📄 [CONTROLLER] Getting meeting transcript:', {
      requestId,
      meetingId,
      advisorId
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    }).populate('clientId', 'firstName lastName email');

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    console.log('✅ [CONTROLLER] Meeting found for transcript:', {
      requestId,
      transcriptStatus: meeting.transcript?.status,
      hasRealTimeMessages: meeting.transcript?.realTimeMessages?.length || 0,
      hasFinalTranscript: !!meeting.transcript?.finalTranscript,
      hasTranscriptContent: !!meeting.transcript?.transcriptContent,
      hasParsedTranscript: !!meeting.transcript?.parsedTranscript
    });

    // Compile final transcript if not already done
    if (!meeting.transcript.finalTranscript && meeting.transcript.realTimeMessages?.length > 0) {
      console.log('🔄 [CONTROLLER] Compiling final transcript from real-time messages...');
      meeting.compileFinalTranscript();
      await meeting.save();
    }

    res.json({ 
      success: true,
      meeting: {
        id: meeting._id,
        roomName: meeting.roomName,
        scheduledAt: meeting.scheduledAt,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        duration: meeting.duration,
        client: meeting.clientId
      },
      transcript: meeting.transcript,
      debug: {
        requestId,
        hasContent: !!meeting.transcript?.transcriptContent,
        contentLength: meeting.transcript?.transcriptContent?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Error getting transcript:', {
      requestId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to get meeting transcript',
      requestId
    });
  }
};

// Generate AI summary for meeting transcript
exports.generateTranscriptSummary = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const advisorId = req.advisor.id;

    logger.info('🤖 [MeetingController] Generating transcript summary', {
      meetingId,
      advisorId
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    });

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    if (!meeting.transcript.finalTranscript) {
      return res.status(400).json({ 
        success: false,
        error: 'No transcript available for summary' 
      });
    }

    // TODO: Integrate with Claude AI for transcript summarization
    // For now, return a placeholder structure
    const mockSummary = {
      keyPoints: [
        "Discussed financial goals and investment strategy",
        "Reviewed current portfolio performance",
        "Addressed concerns about market volatility"
      ],
      actionItems: [
        "Follow up with detailed portfolio analysis",
        "Schedule next quarterly review",
        "Send recommended reading materials"
      ],
      decisions: [
        "Agreed to increase monthly investment contribution",
        "Decided to rebalance portfolio allocation"
      ]
    };

    await meeting.addAISummary(mockSummary);

    logger.info('✅ [MeetingController] AI summary generated', {
      meetingId,
      keyPointsCount: mockSummary.keyPoints.length,
      actionItemsCount: mockSummary.actionItems.length
    });

    res.json({ 
      success: true,
      summary: meeting.transcript.summary
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error generating summary', {
      meetingId: req.params.meetingId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to generate transcript summary' 
    });
  }
};

// Update meeting status
exports.updateMeetingStatus = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { status } = req.body;
    const advisorId = req.advisor.id;

    logger.info('🔄 [MeetingController] Updating meeting status', {
      meetingId,
      newStatus: status,
      advisorId
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    });

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    // Update status based on the new status
    if (status === 'active') {
      await meeting.markAsStarted();
    } else if (status === 'completed') {
      await meeting.markAsCompleted();
    } else {
      meeting.status = status;
      await meeting.save();
    }

    logger.info('✅ [MeetingController] Meeting status updated', {
      meetingId,
      oldStatus: meeting.status,
      newStatus: status
    });

    res.json({ 
      success: true,
      meeting: {
        id: meeting._id,
        status: meeting.status,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        duration: meeting.duration
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error updating meeting status', {
      meetingId: req.params.meetingId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to update meeting status' 
    });
  }
};

// Start recording for a meeting
exports.startRecording = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const recordingData = req.body;
    const advisorId = req.advisor.id;

    logger.info('🎥 [MeetingController] Starting recording', {
      meetingId,
      advisorId,
      recordingOptions: recordingData
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    });

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    // Start recording via Daily.co API
    const recordingResponse = await axios.post(
      `https://api.daily.co/v1/rooms/${meeting.roomName}/start-recording`,
      {
        properties: {
          layout: recordingData.layout || 'default',
          record_video: recordingData.recordVideo !== false,
          record_audio: recordingData.recordAudio !== false,
          record_screen: recordingData.recordScreen || false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update meeting with recording info
    await meeting.startRecording({
      recordingId: recordingResponse.data.recording_id,
      startedBy: advisorId,
      layout: recordingData.layout || 'default'
    });

    logger.info('✅ [MeetingController] Recording started', {
      meetingId,
      recordingId: recordingResponse.data.recording_id
    });

    res.json({ 
      success: true,
      message: 'Recording started successfully',
      recording: {
        id: recordingResponse.data.recording_id,
        status: 'active',
        startedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error starting recording', {
      meetingId: req.params.meetingId,
      error: error.message,
      apiError: error.response?.data
    });

    res.status(500).json({ 
      success: false,
      error: error.response?.data?.error || 'Failed to start recording' 
    });
  }
};

// Stop recording for a meeting
exports.stopRecording = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { stoppedBy } = req.body;
    const advisorId = req.advisor.id;

    logger.info('🛑 [MeetingController] Stopping recording', {
      meetingId,
      advisorId,
      stoppedBy
    });

    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    });

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    // Stop recording via Daily.co API
    const recordingResponse = await axios.post(
      `https://api.daily.co/v1/rooms/${meeting.roomName}/stop-recording`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update meeting with recording stop info
    await meeting.stopRecording(stoppedBy || advisorId);

    logger.info('✅ [MeetingController] Recording stopped', {
      meetingId,
      recordingId: meeting.recording?.recordingId
    });

    res.json({ 
      success: true,
      message: 'Recording stopped successfully',
      recording: {
        status: 'completed',
        stoppedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error stopping recording', {
      meetingId: req.params.meetingId,
      error: error.message,
      apiError: error.response?.data
    });

    res.status(500).json({ 
      success: false,
      error: error.response?.data?.error || 'Failed to stop recording' 
    });
  }
};

// Check Daily.co domain features
exports.checkDomainFeatures = async (req, res) => {
  try {
    logger.info('🔍 [MeetingController] Checking domain features', {
      advisorId: req.advisor?.id
    });

    // Get domain configuration
    const domainResponse = await axios.get(
      'https://api.daily.co/v1/',
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const domain = domainResponse.data;
    
    const features = {
      transcription: {
        enabled: domain.config?.enable_transcription === true,
        storage: domain.config?.enable_transcription_storage === true
      },
      recording: {
        enabled: domain.config?.enable_auto_recording !== null || 
                 domain.config?.recordings_bucket !== null,
        bucket: domain.config?.recordings_bucket
      },
      liveStreaming: {
        enabled: domain.config?.max_live_streams > 0,
        maxStreams: domain.config?.max_live_streams
      },
      chat: {
        enabled: domain.config?.enable_chat === true,
        advanced: domain.config?.enable_advanced_chat === true
      },
      breakoutRooms: {
        enabled: domain.config?.enable_breakout_rooms === true
      }
    };

    logger.info('✅ [MeetingController] Domain features checked', {
      transcriptionEnabled: features.transcription.enabled,
      recordingEnabled: features.recording.enabled,
      domain: domain.domain_name
    });

    res.json({
      success: true,
      domain: domain.domain_name,
      features,
      plan: {
        transcription: features.transcription.enabled,
        recording: features.recording.enabled,
        requiresUpgrade: !features.transcription.enabled && !features.recording.enabled
      }
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error checking domain features', {
      error: error.message,
      apiError: error.response?.data
    });

    res.status(500).json({
      success: false,
      error: 'Failed to check domain features',
      details: error.response?.data || error.message
    });
  }
};

// Helper function to create meeting tokens
const createMeetingTokens = async (roomName, advisorId, clientId, client, requestId) => {
  try {
    logger.info('🔑 [MeetingController] Creating meeting tokens', {
      requestId,
      roomName,
      advisorId,
      clientId
    });

    // Create advisor token with transcription permissions
    const advisorTokenResponse = await axios.post(
      'https://api.daily.co/v1/meeting-tokens',
      {
        properties: {
          room_name: roomName,
          user_name: 'Advisor',
          user_id: advisorId,
          is_owner: true,
          // Grant transcription admin permissions to advisor
          permissions: {
            canAdmin: ['transcription']
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Create client token
    const clientTokenResponse = await axios.post(
      'https://api.daily.co/v1/meeting-tokens',
      {
        properties: {
          room_name: roomName,
          user_name: `${client.firstName} ${client.lastName}`,
          user_id: clientId,
          is_owner: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('✅ [MeetingController] Meeting tokens created successfully', {
      requestId,
      hasAdvisorToken: !!advisorTokenResponse.data.token,
      hasClientToken: !!clientTokenResponse.data.token
    });

    return {
      advisorToken: advisorTokenResponse.data.token,
      clientToken: clientTokenResponse.data.token
    };

  } catch (error) {
    logger.error('❌ [MeetingController] Error creating meeting tokens', {
      requestId,
      error: error.message,
      dailyApiResponse: error.response?.data
    });
    throw error;
  }
};

// Get meetings for a specific client
exports.getMeetingsByClient = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    const { clientId } = req.params;
    const { limit = 20, status } = req.query;

    logger.info('📋 [MeetingController] Fetching meetings for client', {
      advisorId,
      clientId,
      limit,
      status
    });

    // Verify client belongs to advisor
    const client = await Client.findOne({ _id: clientId, advisor: advisorId });
    if (!client) {
      logger.warn('❌ [MeetingController] Client not found or unauthorized', {
        clientId,
        advisorId
      });
      return res.status(404).json({ 
        success: false,
        error: 'Client not found or unauthorized access' 
      });
    }

    let query = { advisorId, clientId };
    
    if (status) {
      query.status = status;
    }

    const meetings = await Meeting.find(query)
      .populate('clientId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    logger.info('✅ [MeetingController] Client meetings fetched successfully', {
      advisorId,
      clientId,
      meetingsCount: meetings.length
    });

    res.json({
      success: true,
      meetings: meetings.map(meeting => ({
        id: meeting._id,
        roomName: meeting.roomName,
        roomUrl: meeting.roomUrl,
        scheduledAt: meeting.scheduledAt,
        meetingType: meeting.meetingType,
        status: meeting.status,
        client: meeting.clientId,
        clientMeetingLink: meeting.clientMeetingLink,
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt,
        transcript: meeting.transcript ? {
          status: meeting.transcript.status,
          messagesCount: meeting.transcript.realTimeMessages.length,
          hasFinalTranscript: !!meeting.transcript.finalTranscript,
          hasSummary: !!meeting.transcript.summary
        } : null,
        recording: meeting.recording ? {
          status: meeting.recording.status,
          recordingUrl: meeting.recording.recordingUrl,
          downloadUrl: meeting.recording.downloadUrl
        } : null
      }))
    });

  } catch (error) {
    logger.error('❌ [MeetingController] Error fetching client meetings', {
      clientId: req.params.clientId,
      error: error.message
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch client meetings' 
    });
  }
};

// Get advisor's clients who have meetings with transcripts
exports.getAdvisorClientsWithTranscripts = async (req, res) => {
  try {
    const advisorId = req.advisor.id;
    
    const meetings = await Meeting.find({
      advisorId,
      $or: [
        { 'transcript.finalTranscript': { $exists: true, $ne: '' } },
        { 'transcript.realTimeMessages.0': { $exists: true } }
      ]
    })
    .populate('clientId', 'firstName lastName email')
    .sort({ createdAt: -1 });

    // Group by client
    const clientsMap = {};
    meetings.forEach(meeting => {
      if (meeting.clientId) {
        const clientId = meeting.clientId._id.toString();
        if (!clientsMap[clientId]) {
          clientsMap[clientId] = {
            client: meeting.clientId,
            meetingCount: 0,
            lastMeetingDate: meeting.scheduledAt
          };
        }
        clientsMap[clientId].meetingCount++;
        if (new Date(meeting.scheduledAt) > new Date(clientsMap[clientId].lastMeetingDate)) {
          clientsMap[clientId].lastMeetingDate = meeting.scheduledAt;
        }
      }
    });

    res.json({
      success: true,
      data: Object.values(clientsMap)
    });
  } catch (error) {
    logger.error('Error fetching clients with transcripts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch clients' });
  }
};

// Enhanced method to fetch meeting transcription from Daily.co
exports.fetchMeetingTranscriptionFromDaily = async (req, res) => {
  const requestId = `FETCH_TRANSCRIPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { meetingId } = req.params;
    const advisorId = req.advisor.id;

    console.log('🎯 [CONTROLLER] Starting transcription fetch from Daily.co:', {
      requestId,
      meetingId,
      advisorId,
      timestamp: new Date().toISOString()
    });

    // ⭐ STEP 1: Find meeting using Meeting model only
    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    }).populate('clientId');

    if (!meeting) {
      console.log('❌ [CONTROLLER] Meeting not found:', {
        requestId,
        meetingId,
        advisorId
      });
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found' 
      });
    }

    console.log('✅ [CONTROLLER] Meeting found:', {
      requestId,
      meetingId: meeting._id,
      roomName: meeting.roomName,
      dailyRoomId: meeting.dailyRoomId,
      dailyMtgSessionId: meeting.dailyMtgSessionId,
      currentTranscriptStatus: meeting.transcript?.status
    });

    // ⭐ STEP 2: Fetch all transcriptions from Daily.co directly
    console.log('📡 [CONTROLLER] Fetching transcriptions from Daily.co API...');
    
    const response = await axios.get(`https://api.daily.co/v1/transcript`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: { limit: 100 }
    });

    console.log('📥 [CONTROLLER] Daily.co API response received:', {
      requestId,
      status: response.status,
      transcriptCount: response.data.data?.length || 0,
      totalCount: response.data.total_count
    });

    const allTranscripts = response.data.data || [];

    // ⭐ STEP 3: Find matching transcripts for this meeting
    const matchingTranscripts = allTranscripts.filter(transcript => {
      const roomIdMatch = transcript.roomId === meeting.dailyRoomId;
      const roomNameMatch = transcript.roomName === meeting.roomName;
      const sessionIdMatch = transcript.mtgSessionId === meeting.dailyMtgSessionId;
      
      console.log('🔍 [CONTROLLER] Transcript matching check:', {
        requestId,
        transcriptId: transcript.transcriptId,
        roomIdMatch: `${transcript.roomId} === ${meeting.dailyRoomId} = ${roomIdMatch}`,
        roomNameMatch: `${transcript.roomName} === ${meeting.roomName} = ${roomNameMatch}`,
        sessionIdMatch: `${transcript.mtgSessionId} === ${meeting.dailyMtgSessionId} = ${sessionIdMatch}`
      });
      
      return roomIdMatch || roomNameMatch || sessionIdMatch;
    });

    console.log('📊 [CONTROLLER] Matching results:', {
      requestId,
      totalTranscripts: allTranscripts.length,
      matchingTranscripts: matchingTranscripts.length,
      matchingIds: matchingTranscripts.map(t => t.transcriptId)
    });

    if (matchingTranscripts.length === 0) {
      console.log('⚠️ [CONTROLLER] No matching transcripts found');
      return res.json({
        success: true,
        message: 'No transcriptions found for this meeting',
        transcriptions: [],
        debug: {
          searchCriteria: {
            roomId: meeting.dailyRoomId,
            roomName: meeting.roomName,
            mtgSessionId: meeting.dailyMtgSessionId
          },
          totalAvailable: allTranscripts.length
        }
      });
    }

    // ⭐ STEP 4: Process completed transcripts - UPDATE MEETING MODEL ONLY
    let updatedCount = 0;
    for (const dailyTranscript of matchingTranscripts) {
      console.log('⚙️ [CONTROLLER] Processing transcript:', {
        requestId,
        transcriptId: dailyTranscript.transcriptId,
        status: dailyTranscript.status,
        isVttAvailable: dailyTranscript.isVttAvailable
      });

      // Update meeting with Daily.co transcript data
      await meeting.updateWithDailyTranscript(dailyTranscript);
      
      // If transcript is finished and VTT is available, fetch content
      if (dailyTranscript.status === 't_finished' && dailyTranscript.isVttAvailable) {
        console.log('⬇️ [CONTROLLER] Fetching VTT content for finished transcript...');
        
        try {
          // Mark as fetching
          await meeting.markTranscriptFetching();
          
          // Get download link
          const linkResponse = await axios.get(
            `https://api.daily.co/v1/transcript/${dailyTranscript.transcriptId}/access-link`,
            {
              headers: {
                'Authorization': `Bearer ${DAILY_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('🔗 [CONTROLLER] Download link received:', {
            requestId,
            transcriptId: dailyTranscript.transcriptId,
            hasLink: !!linkResponse.data.link,
            expires: linkResponse.data.expires
          });

          if (linkResponse.data.link) {
            // Download content
            const contentResponse = await axios.get(linkResponse.data.link, {
              headers: { 'Accept': 'text/vtt, text/plain, */*' }
            });

            console.log('📄 [CONTROLLER] VTT content downloaded:', {
              requestId,
              transcriptId: dailyTranscript.transcriptId,
              contentLength: contentResponse.data?.length || 0,
              startsWithWebVTT: contentResponse.data?.startsWith('WEBVTT')
            });

            // Mark as completed and store content in meeting
            await meeting.markTranscriptFetchCompleted({
              content: contentResponse.data,
              downloadUrl: linkResponse.data.link,
              downloadExpiry: linkResponse.data.expires ? new Date(linkResponse.data.expires) : null
            });

            updatedCount++;
            console.log('✅ [CONTROLLER] Transcript content stored in meeting model');
          }
        } catch (fetchError) {
          console.error('❌ [CONTROLLER] Failed to fetch transcript content:', {
            requestId,
            transcriptId: dailyTranscript.transcriptId,
            error: fetchError.message
          });
          
          await meeting.markTranscriptFetchFailed(fetchError);
        }
      } else {
        console.log('⏳ [CONTROLLER] Transcript not ready for content fetch:', {
          requestId,
          transcriptId: dailyTranscript.transcriptId,
          status: dailyTranscript.status,
          isVttAvailable: dailyTranscript.isVttAvailable
        });
      }
    }

    console.log('🎉 [CONTROLLER] Transcription fetch completed:', {
      requestId,
      matchingTranscripts: matchingTranscripts.length,
      updatedCount,
      finalMeetingStatus: meeting.transcript.status
    });

    res.json({
      success: true,
      message: `Found and processed ${matchingTranscripts.length} transcriptions`,
      transcriptions: matchingTranscripts,
      meetingUpdated: updatedCount > 0,
      debug: {
        requestId,
        updatedCount,
        meetingTranscriptStatus: meeting.transcript.status
      }
    });

  } catch (error) {
    console.error('❌ [CONTROLLER] Fatal error in fetchMeetingTranscriptionFromDaily:', {
      requestId,
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch meeting transcription from Daily.co',
      details: error.message,
      requestId
    });
  }
};

// Enable domain-level transcription storage
exports.enableDomainTranscriptionStorage = async (req, res) => {
  try {
    logger.info('🔧 [MeetingController] Enabling domain transcription storage', {
      advisorId: req.advisor?.id,
      timestamp: new Date().toISOString()
    });

    const response = await axios.post('https://api.daily.co/v1/', {
      properties: {
        enable_transcription_storage: true
      }
    }, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    logger.info('✅ [MeetingController] Domain transcription storage enabled', {
      domain: response.data?.domain_name,
      transcriptionStorage: response.data?.config?.enable_transcription_storage
    });

    res.json({ 
      success: true, 
      domain: response.data,
      message: 'Domain transcription storage enabled successfully'
    });
  } catch (error) {
    logger.error('❌ [MeetingController] Error enabling domain transcription storage', {
      error: error.message,
      apiError: error.response?.data
    });

    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.response?.data 
    });
  }
};

// Configure domain-level transcription template
exports.configureDomainTranscriptionTemplate = async (req, res) => {
  try {
    logger.info('🔧 [MeetingController] Configuring domain transcription template', {
      advisorId: req.advisor?.id,
      timestamp: new Date().toISOString()
    });

    const response = await axios.post('https://api.daily.co/v1/', {
      properties: {
        enable_transcription_storage: true,
        transcription_template: '{domain_name}/{room_name}/{mtgSessionId}_{epoch_time}.vtt'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    logger.info('✅ [MeetingController] Domain transcription template configured', {
      domain: response.data?.domain_name,
      transcriptionTemplate: response.data?.config?.transcription_template
    });

    res.json({ 
      success: true, 
      domain: response.data,
      message: 'Domain transcription template configured successfully'
    });
  } catch (error) {
    logger.error('❌ [MeetingController] Error configuring domain transcription template', {
      error: error.message,
      apiError: error.response?.data
    });

    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.response?.data 
    });
  }
};

// Get transcript download link
exports.getTranscriptDownloadLink = async (req, res) => {
  try {
    const { transcriptId } = req.params;
    const advisorId = req.advisor.id;

    logger.info('🔗 [MeetingController] Getting transcript download link', {
      transcriptId,
      advisorId
    });

    const response = await axios.get(
      `https://api.daily.co/v1/transcript/${transcriptId}/access-link`,
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.link) {
      logger.info('✅ [MeetingController] Transcript download link retrieved', {
        transcriptId,
        hasLink: !!response.data.link
      });

      res.json({
        success: true,
        downloadLink: response.data.link,
        transcriptId: transcriptId
      });
    } else {
      logger.warn('⚠️ [MeetingController] No download link available', {
        transcriptId,
        response: response.data
      });

      res.status(404).json({
        success: false,
        error: 'Transcript download link not available'
      });
    }

  } catch (error) {
    logger.error('❌ [MeetingController] Error getting transcript download link', {
      transcriptId: req.params.transcriptId,
      error: error.message,
      apiError: error.response?.data
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get transcript download link',
      details: error.response?.data || error.message
    });
  }
};

// Get transcript download link for a meeting
exports.getMeetingTranscriptDownloadLink = async (req, res) => {
  const requestId = `GET_DOWNLOAD_LINK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { meetingId } = req.params;
    const advisorId = req.advisor.id;

    console.log('🔗 [CONTROLLER] Getting transcript download link:', {
      requestId,
      meetingId,
      advisorId,
      timestamp: new Date().toISOString()
    });

    // ⭐ STEP 1: Find meeting using Meeting model only
    const meeting = await Meeting.findOne({ 
      _id: meetingId, 
      advisorId 
    });

    if (!meeting) {
      console.log('❌ [CONTROLLER] Meeting not found for download link:', {
        requestId,
        meetingId,
        advisorId
      });
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    console.log('✅ [CONTROLLER] Meeting found for download link:', {
      requestId,
      meetingId: meeting._id,
      hasTranscriptId: !!meeting.transcript?.transcriptId,
      transcriptStatus: meeting.transcript?.status,
      hasExistingVttUrl: !!meeting.transcript?.vttFileUrl
    });

    // ⭐ STEP 2: Check if we already have a valid download URL
    if (meeting.transcript?.vttFileUrl && meeting.transcript?.downloadExpiry) {
      const now = new Date();
      const expiry = new Date(meeting.transcript.downloadExpiry);
      
      if (expiry > now) {
        console.log('✅ [CONTROLLER] Using existing valid download URL:', {
          requestId,
          expiresAt: expiry.toISOString(),
          remainingMinutes: Math.round((expiry - now) / (1000 * 60))
        });
        
        return res.json({
          success: true,
          downloadLink: meeting.transcript.vttFileUrl,
          transcriptId: meeting.transcript.transcriptId,
          expires: meeting.transcript.downloadExpiry,
          source: 'cached'
        });
      } else {
        console.log('⚠️ [CONTROLLER] Existing download URL expired:', {
          requestId,
          expiredAt: expiry.toISOString()
        });
      }
    }

    // ⭐ STEP 3: If no transcriptId, try to fetch from Daily.co first
    if (!meeting.transcript?.transcriptId) {
      console.log('🔍 [CONTROLLER] No transcriptId found, fetching from Daily.co first...');
      
      try {
        // Call our own fetch function first
        const fetchResult = await this.fetchMeetingTranscriptionFromDaily(
          { params: { meetingId }, advisor: { id: advisorId } },
          { json: () => {} } // Mock response object
        );
        
        // Refresh meeting data
        await meeting.reload();
        
        console.log('🔄 [CONTROLLER] Meeting refreshed after fetch attempt:', {
          requestId,
          hasTranscriptId: !!meeting.transcript?.transcriptId,
          transcriptStatus: meeting.transcript?.status
        });
        
      } catch (fetchError) {
        console.error('❌ [CONTROLLER] Failed to fetch transcription first:', {
          requestId,
          error: fetchError.message
        });
      }
    }

    // ⭐ STEP 4: Check again for transcriptId
    if (!meeting.transcript?.transcriptId) {
      console.log('❌ [CONTROLLER] Still no transcriptId available:', {
        requestId,
        meetingId,
        transcriptStatus: meeting.transcript?.status
      });
      
      return res.status(404).json({
        success: false,
        error: 'No completed transcript available for this meeting',
        suggestion: 'Try fetching transcription from Daily.co first'
      });
    }

    // ⭐ STEP 5: Get fresh download link from Daily.co
    console.log('📡 [CONTROLLER] Getting fresh download link from Daily.co...', {
      requestId,
      transcriptId: meeting.transcript.transcriptId
    });

    const response = await axios.get(
      `https://api.daily.co/v1/transcript/${meeting.transcript.transcriptId}/access-link`,
      {
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📥 [CONTROLLER] Download link response received:', {
      requestId,
      hasLink: !!response.data.link,
      expires: response.data.expires,
      transcriptId: meeting.transcript.transcriptId
    });

    if (response.data && response.data.link) {
      // ⭐ STEP 6: Update meeting with new download URL
      meeting.transcript.vttFileUrl = response.data.link;
      if (response.data.expires) {
        meeting.transcript.downloadExpiry = new Date(response.data.expires);
      }
      await meeting.save();

      console.log('✅ [CONTROLLER] Download link updated in meeting model:', {
        requestId,
        transcriptId: meeting.transcript.transcriptId,
        expires: response.data.expires
      });

      res.json({
        success: true,
        downloadLink: response.data.link,
        transcriptId: meeting.transcript.transcriptId,
        expires: response.data.expires,
        source: 'fresh'
      });
    } else {
      console.log('❌ [CONTROLLER] No download link in Daily.co response:', {
        requestId,
        responseData: response.data
      });
      
      res.status(404).json({
        success: false,
        error: 'Transcript download link not available from Daily.co'
      });
    }

  } catch (error) {
    console.error('❌ [CONTROLLER] Fatal error in getMeetingTranscriptDownloadLink:', {
      requestId,
      error: error.message,
      stack: error.stack,
      apiError: error.response?.data
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get transcript download link',
      details: error.response?.data || error.message,
      requestId
    });
  }
};

module.exports = exports;