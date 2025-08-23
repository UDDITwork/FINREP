//models/Transcription.js 
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const transcriptionSchema = new mongoose.Schema({
  // Daily.co Transcription IDs
  transcriptId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  dailyDomainId: {
    type: String,
    required: true
  },
  dailyRoomId: {
    type: String,
    required: true,
    index: true
  },
  dailyMtgSessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Meeting References
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
    index: true
  },
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },

  // Transcription Metadata
  duration: {
    type: Number, // in seconds
    default: 0
  },
  status: {
    type: String,
    enum: ['processing', 'finished', 'error', 'expired'],
    default: 'processing',
    index: true
  },
  language: {
    type: String,
    default: 'en'
  },
  model: {
    type: String,
    default: 'nova-2-general'
  },
  
  // Daily.co Response Data
  outParams: {
    type: Object,
    default: {}
  },
  
  // Transcription Content
  transcriptContent: {
    type: String,
    default: null
  },
  transcriptFormat: {
    type: String,
    enum: ['webvtt', 'srt', 'txt'],
    default: 'webvtt'
  },
  downloadUrl: {
    type: String,
    default: null
  },
  downloadExpiry: {
    type: Date,
    default: null
  },

  // Processing Status
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

  // Parsed Data
  parsedTranscript: {
    speakers: [{
      speakerId: String,
      speakerName: String,
      totalDuration: Number,
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

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  fetchedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
transcriptionSchema.index({ advisorId: 1, createdAt: -1 });
transcriptionSchema.index({ meetingId: 1 });
transcriptionSchema.index({ status: 1, fetchStatus: 1 });
transcriptionSchema.index({ fetchStatus: 1, lastFetchAttempt: 1 });

// Methods
transcriptionSchema.methods.markAsFetching = function() {
  this.fetchStatus = 'fetching';
  this.fetchAttempts += 1;
  this.lastFetchAttempt = new Date();
  return this.save();
};

transcriptionSchema.methods.markFetchCompleted = function(transcriptData) {
  this.fetchStatus = 'completed';
  this.transcriptContent = transcriptData.content;
  this.downloadUrl = transcriptData.downloadUrl;
  this.downloadExpiry = transcriptData.downloadExpiry;
  this.fetchedAt = new Date();
  this.fetchError = null;
  return this.save();
};

transcriptionSchema.methods.markFetchFailed = function(error) {
  this.fetchStatus = 'failed';
  this.fetchError = error.message || error;
  this.lastFetchAttempt = new Date();
  return this.save();
};

const Transcription = mongoose.model('Transcription', transcriptionSchema);

module.exports = Transcription;
