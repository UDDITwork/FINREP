// File: backend/models/Meeting.js
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const meetingSchema = new mongoose.Schema({
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: function() {
      return !this.isOnboardingMeeting;
    },
    index: true
  },
  roomName: {
    type: String,
    required: true,
    unique: true
  },
  roomUrl: {
    type: String,
    required: true
  },
  dailyRoomId: {
    type: String,
    required: true,
    index: true // ⭐ Enhanced for transcript matching
  },
  dailyMtgSessionId: {
    type: String,
    index: true,
    default: null
  },
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  meetingType: {
    type: String,
    enum: ['scheduled', 'instant', 'onboarding'],
    default: 'scheduled'
  },
  isOnboardingMeeting: {
    type: Boolean,
    default: false
  },
  invitationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientInvitation',
    index: true
  },
  tokens: {
    advisorToken: String,
    clientToken: String
  },
  participants: [{
    userId: String,
    userName: String,
    userType: {
      type: String,
      enum: ['advisor', 'client']
    },
    joinTime: Date,
    leaveTime: Date
  }],
  
  // ⭐ ENHANCED TRANSCRIPT SECTION - ALL DAILY.CO FIELDS
  transcript: {
    // Basic Status
    status: {
      type: String,
      enum: ['not_started', 'active', 'completed', 'error'],
      default: 'not_started',
      index: true
    },
    
    // Daily.co IDs (from documentation)
    transcriptId: {
      type: String,
      index: true,
      default: null
    },
    dailyTranscriptId: String, // Alias
    instanceId: String, // Daily.co transcription instance ID
    dailyDomainId: String, // ⭐ Added from Daily.co API response
    
    // Timing
    startedAt: Date,
    stoppedAt: Date,
    startedBy: String, // session_id of who started transcription
    
    // Configuration
    language: {
      type: String,
      default: 'en'
    },
    model: {
      type: String,
      default: 'nova-2-general'
    },
    settings: {
      profanityFilter: {
        type: Boolean,
        default: false
      },
      punctuate: {
        type: Boolean,
        default: true
      },
      includeRawResponse: {
        type: Boolean,
        default: false
      }
    },
    
    // ⭐ DAILY.CO RESPONSE DATA
    outParams: {
      type: Object,
      default: {}
    },
    isVttAvailable: {
      type: Boolean,
      default: false
    },
    
    // ⭐ CONTENT STORAGE (moved from Transcription model)
    transcriptContent: {
      type: String,
      default: null
    },
    transcriptFormat: {
      type: String,
      enum: ['webvtt', 'srt', 'txt'],
      default: 'webvtt'
    },
    
    // Download Management
    vttFileUrl: String, // Download URL for VTT file
    downloadExpiry: Date, // When download link expires
    
    // ⭐ PROCESSING STATUS (moved from Transcription model)
    fetchStatus: {
      type: String,
      enum: ['pending', 'fetching', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    fetchAttempts: {
      type: Number,
      default: 0
    },
    lastFetchAttempt: {
      type: Date,
      default: null
    },
    fetchError: {
      type: String,
      default: null
    },
    fetchedAt: {
      type: Date,
      default: null
    },
    
    // Real-time Messages
    realTimeMessages: [{
      timestamp: Date,
      participantId: String,
      participantName: String,
      text: String,
      isFinal: Boolean,
      confidence: Number,
      instanceId: String,
      messageId: String
    }],
    
    // Compiled Content
    finalTranscript: String,
    
    // ⭐ ENHANCED PARSED TRANSCRIPT (moved from Transcription model)
    parsedTranscript: {
      speakers: [{
        speakerId: String,
        speakerName: String,
        totalDuration: Number, // in seconds
        segments: [{
          startTime: Number,
          endTime: Number,
          text: String,
          confidence: Number
        }]
      }],
      fullText: String,
      summary: {
        keyPoints: [String],
        actionItems: [String],
        duration: Number,
        participantCount: Number
      }
    },
    
    // Speaker Statistics (existing)
    speakers: [{
      participantId: String,
      participantName: String,
      totalSpeakingTime: Number, // in seconds
      messageCount: Number
    }],
    
    // AI Summary
    summary: {
      keyPoints: [String],
      actionItems: [String],
      decisions: [String],
      aiGenerated: Boolean,
      generatedAt: Date
    }
  },
  
  recording: {
    status: {
      type: String,
      enum: ['not_started', 'active', 'completed', 'error'],
      default: 'not_started'
    },
    recordingId: String,
    startedAt: Date,
    stoppedAt: Date,
    startedBy: String,
    layout: String,
    downloadUrl: String,
    duration: Number,
    fileSize: Number,
    settings: {
      recordVideo: {
        type: Boolean,
        default: true
      },
      recordAudio: {
        type: Boolean,
        default: true
      },
      recordScreen: {
        type: Boolean,
        default: false
      }
    }
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// ⭐ ENHANCED INDEXES for transcription performance
meetingSchema.index({ advisorId: 1, createdAt: -1 });
meetingSchema.index({ clientId: 1, createdAt: -1 });
meetingSchema.index({ status: 1, scheduledAt: 1 });
meetingSchema.index({ dailyRoomId: 1 }); // For transcript matching
meetingSchema.index({ dailyMtgSessionId: 1 }); // For transcript matching
meetingSchema.index({ 'transcript.transcriptId': 1 }); // For Daily.co lookup
meetingSchema.index({ 'transcript.status': 1, 'transcript.fetchStatus': 1 }); // For processing queries

// Virtual for meeting link with client token
meetingSchema.virtual('clientMeetingLink').get(function() {
  if (this.roomUrl && this.tokens?.clientToken) {
    return `${this.roomUrl}?t=${this.tokens.clientToken}`;
  }
  return this.roomUrl;
});

// Virtual for advisor meeting link
meetingSchema.virtual('advisorMeetingLink').get(function() {
  if (this.roomUrl && this.tokens?.advisorToken) {
    return `${this.roomUrl}?t=${this.tokens.advisorToken}`;
  }
  return this.roomUrl;
});

// ⭐ NEW VIRTUAL: Check if transcript is available
meetingSchema.virtual('hasTranscript').get(function() {
  return this.transcript?.status === 'completed' || 
         (this.transcript?.realTimeMessages && this.transcript.realTimeMessages.length > 0) ||
         this.transcript?.transcriptContent;
});

// Method to mark meeting as started
meetingSchema.methods.markAsStarted = function() {
  this.status = 'active';
  this.startedAt = new Date();
  return this.save();
};

// Method to mark meeting as completed
meetingSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.endedAt = new Date();
  if (this.startedAt) {
    this.duration = Math.round((this.endedAt - this.startedAt) / (1000 * 60)); // minutes
  }
  return this.save();
};

// ⭐ ENHANCED TRANSCRIPTION METHODS

// Method to start transcription
meetingSchema.methods.startTranscription = function(transcriptionData) {
  this.transcript.status = 'active';
  this.transcript.instanceId = transcriptionData.instanceId;
  this.transcript.startedAt = new Date();
  this.transcript.startedBy = transcriptionData.startedBy;
  this.transcript.language = transcriptionData.language || 'en';
  this.transcript.model = transcriptionData.model || 'nova-2-general';
  this.transcript.settings = {
    profanityFilter: transcriptionData.profanityFilter || false,
    punctuate: transcriptionData.punctuate || true,
    includeRawResponse: transcriptionData.includeRawResponse || false
  };
  return this.save();
};

// Method to stop transcription
meetingSchema.methods.stopTranscription = function(stoppedBy) {
  this.transcript.status = 'completed';
  this.transcript.stoppedAt = new Date();
  this.transcript.updatedBy = stoppedBy;
  return this.save();
};

// ⭐ NEW METHOD: Update with Daily.co transcript data
meetingSchema.methods.updateWithDailyTranscript = function(dailyTranscriptData) {
  this.transcript.transcriptId = dailyTranscriptData.transcriptId;
  this.transcript.dailyDomainId = dailyTranscriptData.domainId;
  this.transcript.outParams = dailyTranscriptData.outParams || {};
  this.transcript.isVttAvailable = dailyTranscriptData.isVttAvailable || false;
  this.transcript.status = this.mapDailyStatus(dailyTranscriptData.status);
  
  // Update session ID if not already set
  if (dailyTranscriptData.mtgSessionId && !this.dailyMtgSessionId) {
    this.dailyMtgSessionId = dailyTranscriptData.mtgSessionId;
  }
  
  return this.save();
};

// ⭐ NEW METHOD: Mark transcript fetch as started
meetingSchema.methods.markTranscriptFetching = function() {
  this.transcript.fetchStatus = 'fetching';
  this.transcript.fetchAttempts += 1;
  this.transcript.lastFetchAttempt = new Date();
  return this.save();
};

// ⭐ NEW METHOD: Mark transcript fetch as completed
meetingSchema.methods.markTranscriptFetchCompleted = function(transcriptData) {
  this.transcript.fetchStatus = 'completed';
  this.transcript.transcriptContent = transcriptData.content;
  this.transcript.vttFileUrl = transcriptData.downloadUrl;
  this.transcript.downloadExpiry = transcriptData.downloadExpiry;
  this.transcript.fetchedAt = new Date();
  this.transcript.fetchError = null;
  
  // Parse the content if it's WebVTT
  if (transcriptData.content && transcriptData.content.startsWith('WEBVTT')) {
    this.transcript.parsedTranscript = this.parseWebVTTContent(transcriptData.content);
  }
  
  return this.save();
};

// ⭐ NEW METHOD: Mark transcript fetch as failed
meetingSchema.methods.markTranscriptFetchFailed = function(error) {
  this.transcript.fetchStatus = 'failed';
  this.transcript.fetchError = error.message || error;
  this.transcript.lastFetchAttempt = new Date();
  return this.save();
};

// ⭐ NEW METHOD: Map Daily.co status to our status
meetingSchema.methods.mapDailyStatus = function(dailyStatus) {
  const statusMap = {
    't_finished': 'completed',
    't_processing': 'active',
    't_error': 'error',
    't_expired': 'error'
  };
  return statusMap[dailyStatus] || dailyStatus;
};

// ⭐ NEW METHOD: Parse WebVTT content (moved from Transcription model)
meetingSchema.methods.parseWebVTTContent = function(content) {
  try {
    const lines = content.split('\n');
    const speakers = [];
    let fullText = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line === 'WEBVTT') continue;
      
      if (line.includes('-->')) {
        const [startTime, endTime] = line.split('-->').map(t => t.trim());
        const textLine = lines[i + 1]?.trim();
        
        if (textLine) {
          const speakerMatch = textLine.match(/^([^:]+):\s*(.+)$/);
          let speakerName = 'Unknown';
          let text = textLine;
          
          if (speakerMatch) {
            speakerName = speakerMatch[1].trim();
            text = speakerMatch[2].trim();
          }
          
          let speaker = speakers.find(s => s.speakerName === speakerName);
          if (!speaker) {
            speaker = {
              speakerId: `speaker_${speakers.length + 1}`,
              speakerName: speakerName,
              totalDuration: 0,
              segments: []
            };
            speakers.push(speaker);
          }
          
          const startSeconds = this.parseTimestamp(startTime);
          const endSeconds = this.parseTimestamp(endTime);
          
          speaker.segments.push({
            startTime: startSeconds,
            endTime: endSeconds,
            text: text,
            confidence: 1.0
          });
          
          speaker.totalDuration += (endSeconds - startSeconds);
          fullText += `${speakerName}: ${text}\n`;
          i++; // Skip the text line
        }
      }
    }
    
    return {
      speakers,
      fullText: fullText.trim(),
      summary: {
        keyPoints: [],
        actionItems: [],
        duration: speakers.reduce((total, speaker) => total + speaker.totalDuration, 0),
        participantCount: speakers.length
      }
    };
  } catch (error) {
    logger.error('Failed to parse WebVTT content:', error);
    return null;
  }
};

// ⭐ NEW METHOD: Parse timestamp helper
meetingSchema.methods.parseTimestamp = function(timestamp) {
  try {
    const parts = timestamp.split(':');
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
    }
    return 0;
  } catch (error) {
    return 0;
  }
};

// Method to add transcript message (existing)
meetingSchema.methods.addTranscriptMessage = function(messageData) {
  const messageId = `${messageData.participantId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const message = {
    timestamp: messageData.timestamp || new Date(),
    participantId: messageData.participantId,
    participantName: messageData.participantName,
    text: messageData.text,
    isFinal: messageData.isFinal || false,
    confidence: messageData.confidence,
    instanceId: messageData.instanceId,
    messageId: messageId
  };

  this.transcript.realTimeMessages.push(message);
  this.updateSpeakerStats(messageData.participantId, messageData.participantName, messageData.text);
  
  return this.save();
};

// Method to update speaker statistics (existing)
meetingSchema.methods.updateSpeakerStats = function(participantId, participantName, text) {
  let speaker = this.transcript.speakers.find(s => s.participantId === participantId);
  
  if (!speaker) {
    speaker = {
      participantId: participantId,
      participantName: participantName,
      totalSpeakingTime: 0,
      messageCount: 0
    };
    this.transcript.speakers.push(speaker);
  }
  
  speaker.messageCount += 1;
  const wordCount = text.split(' ').length;
  const estimatedTime = (wordCount / 150) * 60; // in seconds
  speaker.totalSpeakingTime += estimatedTime;
};

// Method to compile final transcript (existing)
meetingSchema.methods.compileFinalTranscript = function() {
  const finalMessages = this.transcript.realTimeMessages
    .filter(msg => msg.isFinal)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  let transcript = '';
  let currentSpeaker = '';
  
  finalMessages.forEach(msg => {
    if (msg.participantName !== currentSpeaker) {
      transcript += `\n\n${msg.participantName}:\n`;
      currentSpeaker = msg.participantName;
    }
    transcript += `${msg.text} `;
  });
  
  this.transcript.finalTranscript = transcript.trim();
  return transcript;
};

// Method to add AI-generated summary (existing)
meetingSchema.methods.addAISummary = function(summaryData) {
  this.transcript.summary = {
    keyPoints: summaryData.keyPoints || [],
    actionItems: summaryData.actionItems || [],
    decisions: summaryData.decisions || [],
    aiGenerated: true,
    generatedAt: new Date()
  };
  return this.save();
};

// ⭐ NEW STATIC METHOD: Find meeting by Daily.co data
meetingSchema.statics.findByDailyTranscript = function(transcriptData) {
  // Multiple matching strategies
  const query = {
    $or: [
      { dailyRoomId: transcriptData.roomId },
      { roomName: transcriptData.roomName },
      { dailyMtgSessionId: transcriptData.mtgSessionId },
      { 'transcript.transcriptId': transcriptData.transcriptId }
    ]
  };
  
  return this.findOne(query).populate('clientId');
};

// Recording methods (existing)
meetingSchema.methods.startRecording = function(recordingData) {
  this.recording.status = 'active';
  this.recording.recordingId = recordingData.recordingId;
  this.recording.startedAt = new Date();
  this.recording.startedBy = recordingData.startedBy;
  this.recording.layout = recordingData.layout || 'default';
  this.recording.settings = {
    recordVideo: recordingData.recordVideo !== false,
    recordAudio: recordingData.recordAudio !== false,
    recordScreen: recordingData.recordScreen || false
  };
  return this.save();
};

meetingSchema.methods.stopRecording = function(stoppedBy) {
  this.recording.status = 'completed';
  this.recording.stoppedAt = new Date();
  this.recording.stoppedBy = stoppedBy;
  if (this.recording.startedAt) {
    this.recording.duration = Math.round((this.recording.stoppedAt - this.recording.startedAt) / 1000);
  }
  return this.save();
};

meetingSchema.methods.updateRecordingInfo = function(recordingInfo) {
  this.recording.downloadUrl = recordingInfo.downloadUrl;
  this.recording.fileSize = recordingInfo.fileSize;
  this.recording.duration = recordingInfo.duration;
  return this.save();
};

// Static methods (existing)
meetingSchema.statics.findByAdvisor = function(advisorId, limit = 20) {
  return this.find({ advisorId })
    .populate('clientId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

meetingSchema.statics.findUpcoming = function(advisorId) {
  const now = new Date();
  return this.find({
    advisorId,
    scheduledAt: { $gte: now },
    status: { $in: ['scheduled', 'active'] }
  })
    .populate('clientId', 'firstName lastName email')
    .sort({ scheduledAt: 1 });
};

// Pre-save middleware for logging
meetingSchema.pre('save', function(next) {
  if (this.isNew) {
    logger.info('Creating new meeting', {
      meetingId: this._id,
      advisorId: this.advisorId,
      clientId: this.clientId,
      roomName: this.roomName,
      meetingType: this.meetingType,
      scheduledAt: this.scheduledAt
    });
  }
  next();
});

// Post-save middleware for logging
meetingSchema.post('save', function(doc) {
  if (doc.isNew) {
    logger.info('Meeting saved successfully', {
      meetingId: doc._id,
      status: doc.status,
      roomUrl: doc.roomUrl
    });
  }
});

// Ensure virtual fields are included in JSON output
meetingSchema.set('toJSON', { virtuals: true });
meetingSchema.set('toObject', { virtuals: true });

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;