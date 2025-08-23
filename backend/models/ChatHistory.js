// File: backend/models/ChatHistory.js
/**
 * ChatHistory Model for storing AI conversations between advisors and clients
 * Maintains conversation threads with complete message history and metadata
 */

const mongoose = require('mongoose');
const { logger, logDatabase } = require('../utils/logger');

const chatHistorySchema = new mongoose.Schema({
  // Unique conversation identifier
  conversationId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Advisor who initiated the conversation
  advisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advisor',
    required: [true, 'Advisor reference is required'],
    index: true
  },
  
  // Client being discussed
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client reference is required'],
    index: true
  },
  
  // Conversation metadata
  title: {
    type: String,
    default: function() {
      return `Chat about ${this.clientName || 'Client'} - ${new Date().toLocaleDateString()}`;
    },
    maxlength: [200, 'Conversation title cannot exceed 200 characters']
  },
  
  // Array of messages in chronological order
  messages: [{
    messageId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['advisor', 'ai', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [10000, 'Message content cannot exceed 10000 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    // Optional metadata for messages
    metadata: {
      tokens: Number,
      processingTime: Number,
      contextLength: Number,
      aiModel: String
    }
  }],
  
  // Conversation status
  status: {
    type: String,
    enum: ['active', 'archived', 'paused'],
    default: 'active'
  },
  
  // Client context snapshot at conversation start
  clientContextSnapshot: {
    monthlyIncome: Number,
    monthlyExpenses: Number,
    totalAssets: Number,
    totalLiabilities: Number,
    riskProfile: String,
    investmentGoals: [String],
    portfolioValue: Number
  },
  
  // Conversation statistics
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    advisorMessages: {
      type: Number,
      default: 0
    },
    aiMessages: {
      type: Number,
      default: 0
    },
    totalTokensUsed: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  
  // Tags for organization
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Notes from advisor
  advisorNotes: {
    type: String,
    maxlength: [1000, 'Advisor notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  // Add compound indexes for better query performance
  indexes: [
    { advisor: 1, client: 1 },
    { advisor: 1, status: 1, updatedAt: -1 },
    { client: 1, status: 1 }
  ]
});

// Pre-save middleware to generate conversationId if missing
chatHistorySchema.pre('save', function(next) {
  if (this.isNew && !this.conversationId) {
    this.conversationId = `CONV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🆔 [CHAT MODEL] Generated conversation ID: ${this.conversationId}`);
    logger.debug(`🆔 Generated conversation ID: ${this.conversationId}`);
  }
  
  // Update stats
  this.stats.totalMessages = this.messages.length;
  this.stats.advisorMessages = this.messages.filter(m => m.role === 'advisor').length;
  this.stats.aiMessages = this.messages.filter(m => m.role === 'ai').length;
  this.stats.lastActivity = new Date();
  
  // Log the operation
  const operation = this.isNew ? 'create' : 'update';
  const conversationId = this.conversationId || 'new';
  
  console.log(`💬 [CHAT MODEL] DB Operation started: ChatHistory.${operation} for Conversation: ${conversationId}`);
  logger.debug(`💬 DB Operation started: ChatHistory.${operation} for Conversation: ${conversationId}`);
  this._startTime = Date.now();
  
  next();
});

// Post-save middleware for logging
chatHistorySchema.post('save', function(doc, next) {
  const duration = Date.now() - this._startTime;
  const operation = doc.isNew ? 'create' : 'update';
  
  console.log(`✅ [CHAT MODEL] DB Operation completed: ChatHistory.${operation} for ${doc.conversationId} in ${duration}ms`);
  logDatabase.queryExecution('ChatHistory', operation, duration);
  logger.info(`💬 DB Operation completed: ChatHistory.${operation} for ${doc.conversationId} in ${duration}ms`);
  
  next();
});

// Virtual for client name (populated)
chatHistorySchema.virtual('clientName').get(function() {
  if (this.client && typeof this.client === 'object' && this.client.firstName) {
    return `${this.client.firstName} ${this.client.lastName}`;
  }
  return 'Unknown Client';
});

// Virtual for conversation summary
chatHistorySchema.virtual('summary').get(function() {
  return {
    conversationId: this.conversationId,
    clientName: this.clientName,
    messageCount: this.stats.totalMessages,
    lastActivity: this.stats.lastActivity,
    status: this.status,
    duration: this.updatedAt - this.createdAt
  };
});

// Instance method to add a new message
chatHistorySchema.methods.addMessage = function(role, content, metadata = {}) {
  const messageId = `MSG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newMessage = {
    messageId,
    role,
    content,
    timestamp: new Date(),
    metadata
  };
  
  this.messages.push(newMessage);
  
  // Update token count if provided
  if (metadata.tokens) {
    this.stats.totalTokensUsed += metadata.tokens;
  }
  
  console.log(`📝 [CHAT MODEL] Added message to conversation ${this.conversationId}:`, {
    messageId,
    role,
    contentLength: content.length,
    totalMessages: this.messages.length
  });
  
  logger.debug(`📝 Added message to conversation ${this.conversationId}:`, {
    messageId,
    role,
    contentLength: content.length,
    totalMessages: this.messages.length
  });
  
  return newMessage;
};

// Instance method to get recent messages
chatHistorySchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages
    .slice(-limit)
    .map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }));
};

// Static method to find conversations by advisor
chatHistorySchema.statics.findByAdvisor = function(advisorId, options = {}) {
  const query = { advisor: advisorId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.clientId) {
    query.client = options.clientId;
  }
  
  return this.find(query)
    .populate('client', 'firstName lastName email')
    .sort({ updatedAt: -1 })
    .limit(options.limit || 50);
};

// FIXED: Static method to find or create conversation
chatHistorySchema.statics.findOrCreateConversation = async function(advisorId, clientId) {
  console.log(`🔍 [CHAT MODEL] Looking for existing conversation:`, { advisorId, clientId });
  
  let conversation = await this.findOne({
    advisor: advisorId,
    client: clientId,
    status: 'active'
  }).populate('client', 'firstName lastName email');
  
  if (!conversation) {
    console.log(`🆕 [CHAT MODEL] Creating new conversation for advisor ${advisorId} and client ${clientId}`);
    logger.info(`🆕 Creating new conversation for advisor ${advisorId} and client ${clientId}`);
    
    // Generate conversationId before creating the document
    const conversationId = `CONV_${Date.now()}_${advisorId.toString().slice(-6)}_${clientId.toString().slice(-6)}`;
    
    conversation = new this({
      conversationId: conversationId,  // CRITICAL FIX: Set conversationId explicitly
      advisor: advisorId,
      client: clientId,
      status: 'active'
    });
    
    console.log(`🆔 [CHAT MODEL] Assigned conversationId: ${conversationId}`);
    
    // Add system welcome message
    conversation.addMessage(
      'system',
      `Conversation started. AI assistant is ready to help with client financial planning.`,
      { aiModel: 'claude-3-5-sonnet-20241022' }
    );
    
    await conversation.save();
    
    // Populate client data
    await conversation.populate('client', 'firstName lastName email');
    
    console.log(`✅ [CHAT MODEL] New conversation created: ${conversation.conversationId}`);
    logger.info(`✅ New conversation created: ${conversation.conversationId}`);
  } else {
    console.log(`🔄 [CHAT MODEL] Using existing conversation: ${conversation.conversationId}`);
  }
  
  return conversation;
};

// Static method to archive old conversations
chatHistorySchema.statics.archiveOldConversations = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.updateMany(
    {
      updatedAt: { $lt: cutoffDate },
      status: 'active'
    },
    { status: 'archived' }
  );
  
  logger.info(`📦 Archived ${result.modifiedCount} old conversations`);
  return result;
};

// Error handling middleware
chatHistorySchema.post('save', function(error, doc, next) {
  if (error) {
    console.error(`❌ [CHAT MODEL] DB Operation failed: ChatHistory.save for ${doc?.conversationId || 'unknown'} - ${error.message}`);
    logDatabase.operationError('ChatHistory.save', error);
    logger.error(`💬 DB Operation failed: ChatHistory.save for ${doc?.conversationId || 'unknown'} - ${error.message}`);
  }
  next(error);
});

// Ensure virtual fields are serialized
chatHistorySchema.set('toJSON', { virtuals: true });
chatHistorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);