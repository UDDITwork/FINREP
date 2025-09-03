// frontend/src/services/api.js - Enhanced for AI Chat System
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // Use relative URL to work with Vite proxy
  timeout: 30000, // Increased timeout for large form submissions
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request tracking for enhanced logging
    config.metadata = {
      startTime: new Date(),
      requestId: `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Enhanced logging for password reset requests
    if (config.url === '/auth/forgot-password' || config.url === '/auth/reset-password') {
      console.log(`🔍 [API DEBUG] Password Reset Request [${config.metadata.requestId}]:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasAuth: !!token,
        hasData: !!(config.data && Object.keys(config.data).length > 0),
        dataKeys: config.data ? Object.keys(config.data) : [],
        email: config.data?.email || 'NOT PROVIDED',
        password: config.data?.password ? '***' + config.data.password.slice(-4) : 'NOT PROVIDED',
        timestamp: config.metadata.startTime.toISOString(),
        userAgent: navigator.userAgent,
        currentUrl: window.location.href
      });
    } else {
      // Log API request start
      console.log(`🚀 API Request [${config.metadata.requestId}]:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasAuth: !!token,
        hasData: !!(config.data && Object.keys(config.data).length > 0),
        timestamp: config.metadata.startTime.toISOString()
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for enhanced error handling
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    
    // Enhanced logging for password reset responses
    if (response.config.url === '/auth/forgot-password' || response.config.url === '/auth/reset-password') {
      console.log(`🔍 [API DEBUG] Password Reset Response [${response.config.metadata.requestId}]:`, {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        duration: `${duration}ms`,
        success: response.data?.success,
        message: response.data?.message,
        hasData: !!(response.data?.data),
        timestamp: new Date().toISOString(),
        responseSize: JSON.stringify(response.data).length
      });
    } else {
      // Log successful API response
      console.log(`✅ API Response [${response.config.metadata.requestId}]:`, {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        duration: `${duration}ms`,
        success: response.data?.success,
        hasData: !!(response.data?.data),
        timestamp: new Date().toISOString()
      });
    }
    
    return response;
  },
  (error) => {
    const duration = error.config?.metadata ? new Date() - error.config.metadata.startTime : 0;
    
    // Enhanced error logging for password reset
    if (error.config?.url === '/auth/forgot-password' || error.config?.url === '/auth/reset-password') {
      console.error(`🔍 [API DEBUG] Password Reset Error [${error.config?.metadata?.requestId || 'UNKNOWN'}]:`, {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        duration: `${duration}ms`,
        message: error.response?.data?.message || error.message,
        errorType: error.constructor.name,
        timestamp: new Date().toISOString(),
        responseData: error.response?.data,
        requestData: error.config?.data
      });
    } else {
      // Enhanced error logging
      console.error(`❌ API Error [${error.config?.metadata?.requestId || 'UNKNOWN'}]:`, {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        duration: `${duration}ms`,
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('advisor');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// ============================================================================
// NEW: AI CHAT API FUNCTIONS
// ============================================================================

export const chatAPI = {
  // Get all clients for chat selection
  getClientsForChat: async () => {
    console.log('📋 [CHAT API] Fetching clients for chat selection...');
    
    const startTime = Date.now();
    const response = await api.get('/chat/clients');
    const duration = Date.now() - startTime;
    
    console.log('✅ [CHAT API] Clients fetched for chat:', {
      clientCount: response.data.data?.clients?.length || 0,
      duration: `${duration}ms`,
      success: response.data.success
    });
    
    return response.data;
  },

  // Get complete client financial context
  getClientContext: async (clientId) => {
    console.log('🔍 [CHAT API] Fetching client financial context:', { clientId });
    
    const startTime = Date.now();
    const response = await api.get(`/chat/clients/${clientId}/context`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [CHAT API] Client context fetched:', {
      clientId,
      hasContext: !!response.data.data?.clientContext,
      duration: `${duration}ms`,
      success: response.data.success
    });
    
    return response.data;
  },

  // Send message to AI
  sendMessage: async (clientId, message, conversationId = null) => {
    console.log('💬 [CHAT API] Sending message to AI:', {
      clientId,
      conversationId,
      messageLength: message?.length || 0
    });
    
    const startTime = Date.now();
    const response = await api.post(`/chat/clients/${clientId}/message`, {
      message,
      conversationId
    });
    const duration = Date.now() - startTime;
    
    console.log('✅ [CHAT API] AI response received:', {
      clientId,
      conversationId: response.data.data?.conversationId,
      responseLength: response.data.data?.response?.length || 0,
      duration: `${duration}ms`,
      tokensUsed: response.data.data?.usage?.total_tokens || 0,
      success: response.data.success
    });
    
    return response.data;
  },

  // Get chat history for a client
  getChatHistory: async (clientId, options = {}) => {
    console.log('📚 [CHAT API] Fetching chat history:', { clientId, options });
    
    const queryParams = new URLSearchParams({
      limit: options.limit || 1,
      includeArchived: options.includeArchived || false
    });
    
    const startTime = Date.now();
    const response = await api.get(`/chat/clients/${clientId}/history?${queryParams}`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [CHAT API] Chat history fetched:', {
      clientId,
      conversationCount: response.data.data?.conversations?.length || 0,
      duration: `${duration}ms`,
      success: response.data.success
    });
    
    return response.data;
  },

  // Get detailed conversation messages
  getConversationMessages: async (conversationId) => {
    console.log('📖 [CHAT API] Fetching conversation messages:', { conversationId });
    
    const startTime = Date.now();
    const response = await api.get(`/chat/conversations/${conversationId}`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [CHAT API] Conversation messages fetched:', {
      conversationId,
      messageCount: response.data.data?.conversation?.messages?.length || 0,
      duration: `${duration}ms`,
      success: response.data.success
    });
    
    return response.data;
  },

  // Check chat system health
  checkHealth: async () => {
    console.log('🏥 [CHAT API] Checking chat system health...');
    
    const response = await api.get('/chat/health');
    
    console.log('✅ [CHAT API] Health check completed:', {
      status: response.data.success ? 'healthy' : 'unhealthy',
      features: response.data.data?.features
    });
    
    return response.data;
  }
};

// ============================================================================
// LEGACY CHAT FUNCTIONS (Backward Compatibility)
// ============================================================================

// AI Chat API (Legacy - keeping for backward compatibility)
export const chatWithAI = async (clientId, message) => {
  console.log('🤖 [LEGACY CHAT] Chatting with AI:', { clientId, messageLength: message.length });
  
  const response = await api.post('/clients/ai-chat', {
    clientId,
    message
  });
  
  console.log('✅ [LEGACY CHAT] AI response received:', {
    clientId,
    hasResponse: !!response.data.response
  });
  
  return response.data;
};

// Get all clients for chat selection (Legacy)
export const getAllClients = async () => {
  console.log('📋 [LEGACY CHAT] Fetching all clients for chat');
  
  const response = await api.get('/clients/manage');
  
  console.log('✅ [LEGACY CHAT] Clients fetched:', {
    clientCount: response.data.data?.clients?.length || 0
  });
  
  return response.data;
};

// ============================================================================
// EXISTING API FUNCTIONS (Keeping all existing functionality)
// ============================================================================

// Response parsing helper function
const parseApiResponse = (response, fallbackPath = null) => {
  // Handle different response structures consistently
  return response?.data?.plan || response?.plan || response?.data || response || null;
};

// Enhanced Authentication API
export const authAPI = {
  // Advisor registration with enhanced data
  register: async (advisorData) => {
    console.log('📝 ADVISOR REGISTRATION:', {
      email: advisorData.email,
      hasAllFields: !!(advisorData.firstName && advisorData.lastName && advisorData.email && advisorData.password)
    });
    
    const response = await api.post('/auth/register', advisorData);
    return response.data;
  },

  // Advisor login
  login: async (credentials) => {
    console.log('🔐 ADVISOR LOGIN:', { email: credentials.email });
    
    const response = await api.post('/auth/login', credentials);
    
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('advisor', JSON.stringify(response.data.advisor));
      
      console.log('✅ LOGIN SUCCESS:', {
        advisorId: response.data.advisor.id,
        advisorName: `${response.data.advisor.firstName} ${response.data.advisor.lastName}`,
        firmName: response.data.advisor.firmName
      });
    }
    
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed, proceeding with local cleanup');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('advisor');
      console.log('🚪 ADVISOR LOGGED OUT');
    }
  },

  // Get advisor profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update advisor profile
  updateProfile: async (profileData) => {
    console.log('📝 PROFILE UPDATE:', { 
      fieldsBeingUpdated: Object.keys(profileData),
      advisorId: JSON.parse(localStorage.getItem('advisor') || '{}').id
    });
    
    const response = await api.put('/auth/profile', profileData);
    
    if (response.data.success) {
      // Update local storage with new profile data
      localStorage.setItem('advisor', JSON.stringify(response.data.advisor));
    }
    
    return response.data;
  }
};

// Enhanced Client Management API
export const clientAPI = {
  // Get all clients with enhanced filtering
  getClients: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || '',
      status: params.status || '',
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc'
    });
    
    console.log('📋 FETCHING CLIENTS:', {
      ...params,
      queryString: queryParams.toString()
    });
    
    const response = await api.get(`/clients/manage?${queryParams}`);
    
    console.log('✅ CLIENTS FETCHED:', {
      clientCount: response.data.data?.clients?.length || 0,
      totalClients: response.data.data?.pagination?.totalClients || 0,
      page: response.data.data?.pagination?.currentPage || 1
    });
    
    return response.data;
  },

  // Get client by ID with enhanced data
  getClientById: async (clientId) => {
    console.group('🔄 [clientAPI] Fetching Client Details');
    console.log('📋 Request:', { 
      clientId, 
      endpoint: `/clients/manage/${clientId}`,
      timestamp: new Date().toISOString()
    });
    
    const response = await api.get(`/clients/manage/${clientId}`);
    
    console.log('📦 Raw API Response:', {
      status: response.status,
      hasData: !!response.data,
      responseStructure: {
        hasDataProperty: !!response.data.data,
        hasSuccessProperty: !!response.data.success,
        hasMetadataProperty: !!response.data.metadata,
        topLevelKeys: Object.keys(response.data || {})
      }
    });
    
    const extractedData = response.data.data || response.data;
    
    console.log('✅ CLIENT DETAILS EXTRACTED:', {
      clientId,
      hasExtractedData: !!extractedData,
      clientName: extractedData?.firstName + ' ' + extractedData?.lastName,
      completionPercentage: extractedData?.completionPercentage,
      hasCasData: !!extractedData?.portfolioSummary,
      extractedDataKeys: extractedData ? Object.keys(extractedData).slice(0, 15) : [],
      extractedDataSize: extractedData ? JSON.stringify(extractedData).length : 0
    });
    console.groupEnd();
    
    // Return only the client data object for consistency
    return extractedData;
  },

  // Get enhanced dashboard statistics
  getDashboardStats: async () => {
    console.log('📊 FETCHING DASHBOARD STATS');
    
    const response = await api.get('/clients/manage/dashboard/stats');
    
    console.log('✅ DASHBOARD STATS FETCHED:', {
      totalClients: response.data.data?.clientCounts?.total || 0,
      activeClients: response.data.data?.clientCounts?.active || 0,
      portfolioValue: response.data.data?.portfolioMetrics?.totalPortfolioValue || 0,
      avgCompletion: response.data.data?.completionMetrics?.averageCompletionRate || 0
    });
    
    return response.data;
  },

  // Get client financial summary
  getClientFinancialSummary: async (clientId) => {
    console.log('💰 FETCHING CLIENT FINANCIAL SUMMARY:', { clientId });
    
    const response = await api.get(`/clients/manage/${clientId}/financial-summary`);
    
    console.log('✅ FINANCIAL SUMMARY FETCHED:', {
      clientId,
      healthScore: response.data.data?.healthMetrics?.overallHealthScore,
      netWorth: response.data.data?.calculatedFinancials?.netWorth,
      portfolioValue: response.data.data?.portfolioSummary?.totalValue || 0
    });
    
    return response.data;
  },

  // Get estate planning data for client
  getEstatePlanningData: async (clientId) => {
    console.log('🏛️ FETCHING ESTATE PLANNING DATA:', { clientId });
    
    const response = await api.get(`/estate-planning/client/${clientId}`);
    
    console.log('✅ ESTATE PLANNING DATA FETCHED:', {
      clientId,
      hasPersonalInfo: !!response.data.data?.clientInfo,
      hasEstateData: !!response.data.data?.estatePlanningData,
      hasRecommendations: !!response.data.data?.estatePlanningData?.recommendations
    });
    
    return response.data;
  },

  // Get comprehensive estate information for client
  getEstateInformation: async (clientId) => {
    console.log('🏛️ FETCHING ESTATE INFORMATION:', { clientId });
    
    const response = await api.get(`/estate-planning/client/${clientId}/information`);
    
    console.log('✅ ESTATE INFORMATION FETCHED:', {
      clientId,
      hasEstateInfo: !!response.data.data?.estateInformation,
      hasFamilyStructure: !!response.data.data?.estateInformation?.familyStructure,
      hasRealEstate: response.data.data?.estateInformation?.realEstateProperties?.length > 0
    });
    
    return response.data;
  },

  // Create or update estate information for client
  saveEstateInformation: async (clientId, estateData) => {
    console.log('🏛️ SAVING ESTATE INFORMATION:', { 
      clientId, 
      hasFamilyStructure: !!estateData.familyStructure,
      hasRealEstate: estateData.realEstateProperties?.length > 0,
      hasLegalDocs: !!estateData.legalDocumentsStatus
    });
    
    const response = await api.post(`/estate-planning/client/${clientId}/information`, estateData);
    
    console.log('✅ ESTATE INFORMATION SAVED:', {
      clientId,
      estateInfoId: response.data.data?.estateInformation?._id,
      success: response.data.success
    });
    
    return response.data;
  },

  // Get will content for client
  getWill: async (clientId) => {
    console.log('📜 FETCHING WILL:', { clientId });
    
    const response = await api.get(`/estate-planning/client/${clientId}/will`);
    
    console.log('✅ WILL FETCHED:', {
      clientId,
      hasWill: !!response.data.data?.willDetails,
      willType: response.data.data?.willDetails?.willType,
      contentLength: response.data.data?.willDetails?.willContent?.length || 0
    });
    
    return response.data;
  },

  // Create or update will content for client
  saveWill: async (clientId, willData) => {
    console.log('📜 SAVING WILL:', { 
      clientId, 
      willType: willData.willType,
      hasContent: !!willData.willContent,
      contentLength: willData.willContent?.length || 0
    });
    
    const response = await api.post(`/estate-planning/client/${clientId}/will`, willData);
    
    console.log('✅ WILL SAVED:', {
      clientId,
      willType: response.data.data?.willDetails?.willType,
      success: response.data.success
    });
    
    return response.data;
  },

  // Send client invitation with enhanced tracking
  sendInvitation: async (invitationData) => {
    console.log('📧 SENDING CLIENT INVITATION:', {
      clientEmail: invitationData.clientEmail,
      clientName: `${invitationData.clientFirstName} ${invitationData.clientLastName}`.trim(),
      hasNotes: !!invitationData.notes
    });
    
    const response = await api.post('/clients/manage/invitations', invitationData);
    
    console.log('✅ INVITATION SENT:', {
      invitationId: response.data.data?.invitationId,
      clientEmail: invitationData.clientEmail,
      expiresAt: response.data.data?.expiresAt,
      invitationCount: response.data.data?.invitationCount
    });
    
    return response.data;
  },

  // Send client onboarding with meeting
  sendClientOnboardingWithMeeting: async (invitationData) => {
    console.log('🎯 SENDING CLIENT ONBOARDING WITH MEETING:', {
      clientEmail: invitationData.clientEmail,
      clientName: `${invitationData.clientFirstName} ${invitationData.clientLastName || ''}`.trim(),
      scheduledAt: invitationData.scheduledAt,
      hasNotes: !!invitationData.notes
    });
    
    const response = await api.post('/clients/manage/onboard-with-meeting', invitationData);
    
    console.log('✅ ONBOARDING WITH MEETING SENT:', {
      invitationId: response.data.data?.invitation?.id,
      meetingId: response.data.data?.meeting?.id,
      clientEmail: invitationData.clientEmail,
      scheduledAt: response.data.data?.meeting?.scheduledAt,
      onboardingUrl: response.data.data?.invitation?.onboardingUrl
    });
    
    return response.data;
  },

  // Get client invitations
  getInvitations: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      status: params.status || '',
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc'
    });
    
    console.log('📨 FETCHING INVITATIONS:', params);
    
    const response = await api.get(`/clients/manage/invitations?${queryParams}`);
    
    console.log('✅ INVITATIONS FETCHED:', {
      invitationCount: response.data.data?.invitations?.length || 0,
      totalInvitations: response.data.data?.pagination?.totalInvitations || 0
    });
    
    return response.data;
  },

  // Update client
  updateClient: async (clientId, clientData) => {
    console.log('📝 UPDATING CLIENT:', {
      clientId,
      fieldsBeingUpdated: Object.keys(clientData)
    });
    
    const response = await api.put(`/clients/manage/${clientId}`, clientData);
    
    console.log('✅ CLIENT UPDATED:', {
      clientId,
      newCompletionPercentage: response.data.data?.completionPercentage
    });
    
    return response.data;
  },

  // Delete client
  deleteClient: async (clientId) => {
    console.log('🗑️ DELETING CLIENT:', { clientId });
    
    const response = await api.delete(`/clients/manage/${clientId}`);
    
    console.log('✅ CLIENT DELETED:', { clientId });
    
    return response.data;
  },

  // ============================================================================
  // ENHANCED 5-STAGE ONBOARDING API
  // ============================================================================

  // Get onboarding form by token
  getOnboardingForm: async (token) => {
    console.log('🔗 ACCESSING ONBOARDING FORM:', { 
      token: token.substring(0, 8) + '...', // Partial token for security
      timestamp: new Date().toISOString()
    });
    
    const response = await api.get(`/clients/onboarding/${token}`);
    
    console.log('✅ ONBOARDING FORM ACCESSED:', {
      advisorName: response.data.data?.advisor?.firstName + ' ' + response.data.data?.advisor?.lastName,
      clientEmail: response.data.data?.invitation?.clientEmail,
      expiresAt: response.data.data?.invitation?.expiresAt,
      totalStages: response.data.data?.formConfiguration?.totalStages || 5
    });
    
    return response.data;
  },

  // Submit enhanced 5-stage onboarding form
  submitOnboardingForm: async (token, formData) => {
    const submissionStart = new Date();
    
    console.log('📤 SUBMITTING ENHANCED ONBOARDING FORM:', {
      token: token.substring(0, 8) + '...',
      submissionStartTime: submissionStart.toISOString(),
      formStages: {
        personalInfo: !!(formData.firstName && formData.lastName),
        incomeEmployment: !!(formData.occupation && formData.annualIncome),
        financialGoals: !!(formData.retirementPlanning?.targetRetirementAge),
        assetsLiabilities: !!(formData.assets),
        investmentProfile: !!(formData.investmentExperience && formData.riskTolerance)
      },
      hasCasData: !!formData.casData,
      hasCustomGoals: !!(formData.customGoals?.length > 0),
      dataSize: JSON.stringify(formData).length
    });
    
    const response = await api.post(`/clients/onboarding/${token}`, formData);
    
    const submissionDuration = new Date() - submissionStart;
    
    console.log('🎉 ENHANCED ONBOARDING COMPLETED:', {
      token: token.substring(0, 8) + '...',
      clientId: response.data.data?.clientId,
      submissionDuration: `${submissionDuration}ms`,
      completionPercentage: response.data.data?.completionPercentage,
      hasCasData: response.data.data?.hasCasData,
      portfolioValue: response.data.data?.portfolioValue || 0,
      calculatedFinancials: response.data.data?.calculatedFinancials,
      summary: response.data.data?.summary
    });
    
    return response.data;
  },

  // Save form draft (NEW)
  saveFormDraft: async (token, stepNumber, stepData) => {
    console.log('💾 SAVING FORM DRAFT:', {
      token: token.substring(0, 8) + '...',
      stepNumber,
      hasData: !!stepData,
      dataKeys: stepData ? Object.keys(stepData) : []
    });
    
    const response = await api.post(`/clients/onboarding/${token}/draft`, {
      stepNumber,
      stepData
    });
    
    console.log('✅ DRAFT SAVED:', {
      stepNumber,
      savedAt: response.data.data?.savedAt
    });
    
    return response.data;
  },

  // Get form draft (NEW)
  getFormDraft: async (token, stepNumber = null) => {
    console.log('📖 LOADING FORM DRAFT:', {
      token: token.substring(0, 8) + '...',
      stepNumber
    });
    
    const url = stepNumber 
      ? `/clients/onboarding/${token}/draft?stepNumber=${stepNumber}`
      : `/clients/onboarding/${token}/draft`;
    
    const response = await api.get(url);
    
    console.log('✅ DRAFT LOADED:', {
      stepNumber,
      currentStep: response.data.data?.currentStep,
      lastSavedAt: response.data.data?.lastSavedAt,
      hasDraftData: !!response.data.data?.draftData
    });
    
    return response.data;
  },

  // ============================================================================
  // ENHANCED CAS MANAGEMENT API (keeping existing logic)
  // ============================================================================

  // Upload CAS file
  uploadCAS: async (clientId, file, password = '') => {
    const formData = new FormData();
    formData.append('casFile', file);
    if (password) {
      formData.append('casPassword', password);
    }
    
    console.log('📁 UPLOADING CAS FILE:', {
      clientId,
      fileName: file.name,
      fileSize: file.size,
      hasPassword: !!password
    });
    
    const response = await api.post(`/clients/manage/${clientId}/cas/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // Extended timeout for file upload
    });
    
    console.log('✅ CAS FILE UPLOADED:', {
      clientId,
      fileName: response.data.data?.fileName,
      status: response.data.data?.status
    });
    
    return response.data;
  },

  // Parse CAS file
  parseCAS: async (clientId) => {
    console.log('🔍 PARSING CAS FILE:', { clientId });
    
    const response = await api.post(`/clients/manage/${clientId}/cas/parse`, {}, {
      timeout: 120000, // Extended timeout for parsing
    });
    
    console.log('✅ CAS FILE PARSED:', {
      clientId,
      totalValue: response.data.data?.totalValue,
      totalAccounts: response.data.data?.totalAccounts,
      totalMutualFunds: response.data.data?.totalMutualFunds
    });
    
    return response.data;
  },

  // Get CAS data
  getCASData: async (clientId) => {
    console.log('📊 FETCHING CAS DATA:', { clientId });
    
    const response = await api.get(`/clients/manage/${clientId}/cas`);
    
    console.log('✅ CAS DATA FETCHED:', {
      clientId,
      status: response.data.data?.status,
      hasData: !!response.data.data?.parsedData
    });
    
    return response.data;
  },

  // Delete CAS data
  deleteCAS: async (clientId) => {
    console.log('🗑️ DELETING CAS DATA:', { clientId });
    
    const response = await api.delete(`/clients/manage/${clientId}/cas`);
    
    console.log('✅ CAS DATA DELETED:', { clientId });
    
    return response.data;
  }
};

// Financial Planning API (keeping all existing functions)
export const planAPI = {
  // Create a new financial plan
  createPlan: async (planData) => {
    console.log('📋 CREATING FINANCIAL PLAN:', {
      clientId: planData.clientId,
      planType: planData.planType
    });
    
    const response = await api.post('/plans', planData);
    
    console.log('✅ PLAN CREATED:', {
      planId: response.data.plan._id,
      status: response.data.plan.status
    });
    
    return response.data;
  },

  // Get plan by ID
  getPlanById: async (planId) => {
    console.log('📋 FETCHING PLAN:', { planId });
    
    const response = await api.get(`/plans/${planId}`);
    const planData = parseApiResponse(response);
    
    console.log('✅ PLAN FETCHED:', {
      planId,
      planType: planData?.plan?.planType || planData?.planType,
      status: planData?.plan?.status || planData?.status,
      hasData: !!planData
    });
    
    return planData;
  },

  // Update plan
  updatePlan: async (planId, updates) => {
    console.log('📝 UPDATING PLAN:', { planId });
    
    const response = await api.put(`/plans/${planId}`, updates);
    
    console.log('✅ PLAN UPDATED:', { planId });
    
    return response.data;
  },

  // Archive plan
  archivePlan: async (planId) => {
    console.log('📦 ARCHIVING PLAN:', { planId });
    
    const response = await api.delete(`/plans/${planId}`);
    
    console.log('✅ PLAN ARCHIVED:', { planId });
    
    return response.data;
  },

  // Get all plans for a client
  getClientPlans: async (clientId) => {
    console.log('📋 FETCHING CLIENT PLANS:', { clientId });
    
    const response = await api.get(`/plans/client/${clientId}`);
    
    console.log('✅ CLIENT PLANS FETCHED:', {
      clientId,
      planCount: response.data.plans.length
    });
    
    return response.data;
  },

  // Update plan status
  updatePlanStatus: async (planId, status) => {
    console.log('🔄 UPDATING PLAN STATUS:', { planId, status });
    
    const response = await api.patch(`/plans/${planId}/status`, { status });
    
    console.log('✅ PLAN STATUS UPDATED:', { planId, status });
    
    return response.data;
  },

  // Add review note
  addReviewNote: async (planId, reviewData) => {
    console.log('📝 ADDING REVIEW NOTE:', { planId });
    
    const response = await api.post(`/plans/${planId}/review`, reviewData);
    
    console.log('✅ REVIEW NOTE ADDED:', { planId });
    
    return response.data;
  },

  // Generate AI recommendations
  generateAIRecommendations: async (planId) => {
    console.log('🤖 GENERATING AI RECOMMENDATIONS:', { planId });
    
    const response = await api.post(`/plans/${planId}/ai-recommendations`);
    
    console.log('✅ AI RECOMMENDATIONS GENERATED:', { planId });
    
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (planId) => {
    console.log('📊 FETCHING PERFORMANCE METRICS:', { planId });
    
    const response = await api.get(`/plans/${planId}/performance`);
    
    console.log('✅ PERFORMANCE METRICS FETCHED:', { planId });
    
    return response.data;
  },

  // Clone plan
  clonePlan: async (planId, targetClientId = null) => {
    console.log('📑 CLONING PLAN:', { planId, targetClientId });
    
    const response = await api.post(`/plans/${planId}/clone`, { targetClientId });
    
    console.log('✅ PLAN CLONED:', {
      originalPlanId: planId,
      newPlanId: response.data.plan._id
    });
    
    return response.data;
  },

  // AI-powered debt analysis
  analyzeDebt: async (clientId, clientData) => {
    console.log('🤖 [API] ANALYZING DEBT STRATEGY:', { clientId });
    
    const requestPayload = { clientData };
    const requestUrl = `/plans/analyze-debt/${clientId}`;
    
    console.log('📤 [API] POST request details:', {
      url: requestUrl,
      payloadSize: JSON.stringify(requestPayload).length + ' chars',
      hasClientData: !!clientData,
      clientDataKeys: clientData ? Object.keys(clientData) : [],
      hasCalculatedFinancials: !!clientData?.calculatedFinancials,
      hasDebts: !!clientData?.debtsAndLiabilities,
      clientName: clientData ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() : 'N/A'
    });
    
    const startTime = Date.now();
    
    try {
      const response = await api.post(requestUrl, requestPayload);
      const responseTime = Date.now() - startTime;
      
      console.log('📥 [API] POST response received:', {
        responseTime: responseTime + 'ms',
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        responseDataKeys: response.data ? Object.keys(response.data) : [],
        responseSize: response.data ? JSON.stringify(response.data).length + ' chars' : 0
      });
      
      console.log('✅ [API] DEBT ANALYSIS COMPLETED:', {
        clientId,
        success: response.data?.success,
        hasAnalysis: !!response.data?.analysis,
        debtsAnalyzed: response.data?.analysis?.debtStrategy?.prioritizedDebts?.length || 0,
        totalSavings: response.data?.analysis?.financialMetrics?.totalInterestSavings || 0,
        hasError: !!response.data?.error,
        errorMessage: response.data?.error
      });
      
      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error('❌ [API] DEBT ANALYSIS FAILED:', {
        clientId,
        responseTime: responseTime + 'ms',
        errorType: error.constructor.name,
        errorMessage: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestUrl,
        hasClientData: !!clientData
      });
      
      // Re-throw the error so calling code can handle it
      throw error;
    }
  },

  // Update debt strategy with advisor modifications
  updateDebtStrategy: async (planId, strategyData) => {
    console.log('💰 UPDATING DEBT STRATEGY:', { planId });
    
    const response = await api.put(`/plans/${planId}/debt-strategy`, strategyData);
    
    console.log('✅ DEBT STRATEGY UPDATED:', { planId });
    
    return response.data;
  },

  // Get debt recommendations for a plan
  getDebtRecommendations: async (planId) => {
    console.log('📊 FETCHING DEBT RECOMMENDATIONS:', { planId });
    
    const response = await api.get(`/plans/${planId}/debt-recommendations`);
    
    console.log('✅ DEBT RECOMMENDATIONS FETCHED:', { planId });
    
    return response.data;
  },

  // Test AI service integration
  testAIService: async () => {
    console.log('🧪 [API] TESTING AI SERVICE INTEGRATION...');
    
    const startTime = Date.now();
    
    try {
      const response = await api.get('/plans/test-ai-service');
      const duration = Date.now() - startTime;
      
      console.log('✅ [API] AI SERVICE TEST COMPLETED:', {
        duration: duration + 'ms',
        success: response.data?.success,
        status: response.data?.recommendations?.status,
        endToEndWorking: response.data?.steps?.endToEndWorking
      });
      
      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error('❌ [API] AI SERVICE TEST FAILED:', {
        duration: duration + 'ms',
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      });
      
      throw error;
    }
  },

  // AI-powered goal analysis for goal-based planning
  analyzeGoals: async (selectedGoals, clientData) => {
    console.log('🎯 [API] ANALYZING GOALS:', {
      goalsCount: selectedGoals?.length || 0,
      hasClientData: !!clientData,
      clientId: clientData?._id || 'unknown'
    });
    
    const requestPayload = { 
      selectedGoals: selectedGoals || [], 
      clientData: clientData || {} 
    };
    const requestUrl = '/plans/analyze-goals';
    
    console.log('📤 [API] POST request details:', {
      url: requestUrl,
      payloadSize: JSON.stringify(requestPayload).length + ' chars',
      selectedGoalsCount: selectedGoals?.length || 0,
      goalTypes: selectedGoals?.map(g => g.title || g.type) || [],
      hasClientData: !!clientData,
      clientName: clientData ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() : 'N/A',
      hasFinancialGoals: !!clientData?.enhancedFinancialGoals,
      hasAssets: !!clientData?.assets,
      hasDebts: !!clientData?.debtsAndLiabilities
    });
    
    const startTime = Date.now();
    
    try {
      const response = await api.post(requestUrl, requestPayload);
      const duration = Date.now() - startTime;
      
      console.log('✅ [API] GOAL ANALYSIS COMPLETED:', {
        duration: duration + 'ms',
        success: response.data?.success,
        hasRecommendations: !!response.data?.recommendations,
        recommendationsType: typeof response.data?.recommendations,
        hasError: !!response.data?.error,
        errorMessage: response.data?.error
      });
      
      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error('❌ [API] GOAL ANALYSIS FAILED:', {
        responseTime: responseTime + 'ms',
        errorType: error.constructor.name,
        errorMessage: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestUrl,
        hasSelectedGoals: !!selectedGoals,
        hasClientData: !!clientData
      });
      
      // Re-throw the error so calling code can handle it
      throw error;
    }
  },

  // Generate goal-based plan PDF report
  generateGoalPlanPDF: async (planId) => {
    console.log('📄 [API] Generating goal plan PDF:', { 
      planId,
      endpoint: `/plans/${planId}/pdf`,
      hasToken: !!localStorage.getItem('token')
    });
    
    const startTime = Date.now();
    
    try {
      console.log('📤 [API] Making PDF request to backend...');
      
      const response = await api.get(`/plans/${planId}/pdf`, {
        responseType: 'blob', // Important for PDF downloads
        headers: {
          'Accept': 'application/pdf'
        },
        timeout: 60000 // 60 second timeout for PDF generation
      });
      
      const duration = Date.now() - startTime;
      
      console.log('✅ [API] PDF generated successfully:', {
        planId,
        duration: duration + 'ms',
        pdfSize: response.data.size + ' bytes',
        contentType: response.headers['content-type'],
        responseStatus: response.status,
        responseHeaders: {
          contentType: response.headers['content-type'],
          contentLength: response.headers['content-length'],
          contentDisposition: response.headers['content-disposition']
        }
      });
      
      return response.data; // This will be a Blob
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error('❌ [API] PDF generation failed:', {
        planId,
        duration: duration + 'ms',
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestUrl: `/plans/${planId}/pdf`,
        hasAuthToken: !!localStorage.getItem('token'),
        errorCode: error.code,
        errorType: error.constructor.name
      });
      
      // Try to read error response if it's not a blob
      if (error.response?.data && error.response.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          console.error('❌ [API] PDF error response body:', errorText);
        } catch (blobError) {
          console.error('❌ [API] Could not read blob error response:', blobError);
        }
      }
      
      throw error;
    }
  },

  // Store PDF report in database
  storePDFReport: async (planId, pdfData) => {
    console.log('📄 STORING PDF REPORT:', { planId });
    
    const response = await api.post(`/plans/${planId}/pdf/store`, pdfData);
    
    console.log('✅ PDF REPORT STORED:', { planId });
    
    return response.data;
  },

};

// Enhanced Admin API (keeping all existing functions)
export const adminAPI = {
  // Admin login (static credentials)
  login: async (credentials) => {
    console.log('🔐 ADMIN LOGIN ATTEMPT');
    
    // For demo purposes, using static admin credentials
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      const adminData = {
        success: true,
        token: 'admin-session-token',
        admin: {
          id: 'admin',
          username: 'admin',
          role: 'administrator'
        }
      };
      
      localStorage.setItem('adminToken', adminData.token);
      localStorage.setItem('admin', JSON.stringify(adminData.admin));
      
      console.log('✅ ADMIN LOGIN SUCCESS');
      return adminData;
    } else {
      throw new Error('Invalid admin credentials');
    }
  },

  // Admin logout
  logout: async () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    console.log('🚪 ADMIN LOGGED OUT');
  },

  // Get all advisors
  getAllAdvisors: async () => {
    console.log('👥 FETCHING ALL ADVISORS');
    
    const response = await api.get('/admin/advisors', {
      headers: {
        'admin-token': localStorage.getItem('adminToken')
      }
    });
    
    console.log('✅ ADVISORS FETCHED:', {
      advisorCount: response.data.data?.length || 0
    });
    
    return response.data;
  },

  // Get advisor clients
  getAdvisorClients: async (advisorId) => {
    console.log('👤 FETCHING ADVISOR CLIENTS:', { advisorId });
    
    const response = await api.get(`/admin/advisors/${advisorId}/clients`, {
      headers: {
        'admin-token': localStorage.getItem('adminToken')
      }
    });
    
    console.log('✅ ADVISOR CLIENTS FETCHED:', {
      advisorId,
      clientCount: response.data.data?.length || 0
    });
    
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    console.log('📊 FETCHING ADMIN DASHBOARD STATS');
    
    const response = await api.get('/admin/dashboard/stats', {
      headers: {
        'admin-token': localStorage.getItem('adminToken')
      }
    });
    
    console.log('✅ ADMIN STATS FETCHED:', {
      totalAdvisors: response.data.data?.totalAdvisors || 0,
      totalClients: response.data.data?.totalClients || 0,
      clientsWithCAS: response.data.data?.clientsWithCAS || 0
    });
    
    return response.data;
  },

  // Get individual client details with comprehensive logging
  getAdvisorClientDetails: async (advisorId, clientId) => {
    const requestStart = Date.now();
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    console.log('🔍 FETCHING CLIENT DETAILS:', {
      requestId,
      advisorId,
      clientId,
      timestamp: new Date().toISOString(),
      adminToken: !!localStorage.getItem('adminToken')
    });
    
    try {
      const response = await api.get(`/admin/advisors/${advisorId}/clients/${clientId}`, {
        headers: {
          'admin-token': localStorage.getItem('adminToken')
        }
      });
      
      const duration = Date.now() - requestStart;
      const clientData = response.data.data;
      
      console.log('✅ CLIENT DETAILS FETCHED SUCCESSFULLY:', {
        requestId,
        duration: `${duration}ms`,
        clientId,
        clientName: `${clientData?.firstName} ${clientData?.lastName}`,
        email: clientData?.email,
        completionPercentage: clientData?.completionPercentage || 0,
        casStatus: clientData?.casData?.casStatus || 'not_uploaded',
        metadata: response.data.metadata
      });
      
      // Log data structure details
      console.log('📋 CLIENT DATA STRUCTURE:', {
        requestId,
        availableFields: Object.keys(clientData || {}),
        nestedDataPresent: {
          address: !!clientData?.address,
          assets: !!clientData?.assets,
          debts: !!clientData?.debtsAndLiabilities,
          goals: !!clientData?.financialGoals,
          casData: !!clientData?.casData,
          expenseBreakdown: !!clientData?.expenseBreakdown
        },
        dataSize: JSON.stringify(clientData || {}).length
      });
      
      // Log specific important fields
      if (clientData) {
        console.log('💰 CLIENT FINANCIAL SNAPSHOT:', {
          requestId,
          monthlyIncome: clientData.totalMonthlyIncome || 0,
          monthlyExpenses: clientData.totalMonthlyExpenses || 0,
          annualIncome: clientData.annualIncome || 0,
          hasAssets: !!(clientData.assets && Object.keys(clientData.assets).length > 0),
          hasDebts: !!(clientData.debtsAndLiabilities && Object.keys(clientData.debtsAndLiabilities).length > 0)
        });
      }
      
      return response.data;
      
    } catch (error) {
      const duration = Date.now() - requestStart;
      
      console.error('❌ CLIENT DETAILS FETCH ERROR:', {
        requestId,
        duration: `${duration}ms`,
        advisorId,
        clientId,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      
      throw error;
    }
  },

  // Debug function to help troubleshoot client ID issues
  debugClientId: (clientId) => {
    console.log('🔍 [CLIENT REPORTS API] Debugging client ID:', {
      original: clientId,
      type: typeof clientId,
      isNull: clientId === null,
      isUndefined: clientId === undefined,
      isString: typeof clientId === 'string',
      isObject: typeof clientId === 'object',
      isArray: Array.isArray(clientId),
      length: clientId?.length,
      keys: typeof clientId === 'object' ? Object.keys(clientId || {}) : 'N/A',
      stringified: JSON.stringify(clientId),
      extracted: apiUtils.extractClientId(clientId)
    });
    
    return {
      original: clientId,
      extracted: apiUtils.extractClientId(clientId),
      isValid: !!apiUtils.extractClientId(clientId)
    };
  }
};

// Health check API
export const healthAPI = {
  // Check system health
  checkHealth: async () => {
    console.log('🏥 CHECKING SYSTEM HEALTH');
    
    const response = await api.get('/clients/health');
    
    console.log('✅ HEALTH CHECK COMPLETED:', {
      systemOperational: response.data.success,
      features: response.data.data?.features,
      formStages: response.data.data?.formStages?.length || 0
    });
    
    return response.data;
  }
};

// Utility functions
export const apiUtils = {
  // FIXED: Enhanced MongoDB ObjectID extraction
  extractClientId: (clientId) => {
    console.log('🔍 [API UTILS] Extracting client ID:', {
      input: clientId,
      type: typeof clientId,
      constructor: clientId?.constructor?.name
    });

    if (!clientId) {
      console.warn('⚠️ [API UTILS] No client ID provided');
      return null;
    }

    // Handle string IDs (already correct)
    if (typeof clientId === 'string') {
      const trimmed = clientId.trim();
      if (trimmed === '' || trimmed === '[object Object]') {
        console.error('❌ [API UTILS] Invalid string ID:', trimmed);
        return null;
      }
      return trimmed;
    }
    
    // Handle MongoDB ObjectID objects
    if (typeof clientId === 'object' && clientId !== null) {
      // Check for _id property (nested ObjectID)
      if (clientId._id) {
        return apiUtils.extractClientId(clientId._id);
      }
      
      // Check for $oid property (MongoDB JSON format)
      if (clientId.$oid) {
        return clientId.$oid;
      }
      
      // Check for toHexString method (MongoDB ObjectID)
      if (typeof clientId.toHexString === 'function') {
        return clientId.toHexString();
      }
      
      // Try toString but validate result
      if (typeof clientId.toString === 'function') {
        const stringValue = clientId.toString();
        if (stringValue !== '[object Object]' && stringValue.trim() !== '') {
          return stringValue;
        }
      }
      
      // Try to access hex property directly
      if (clientId.id && typeof clientId.id === 'string') {
        return clientId.id;
      }
    }
    
    // Handle number IDs
    if (typeof clientId === 'number') {
      return clientId.toString();
    }

    console.error('❌ [API UTILS] Unable to extract client ID:', {
      clientId,
      type: typeof clientId,
      keys: typeof clientId === 'object' ? Object.keys(clientId) : 'N/A'
    });
    return null;
  },

  // FIXED: Enhanced validation with better error messages
  validateClientId: (clientId) => {
    const extracted = apiUtils.extractClientId(clientId);
    if (!extracted) {
      const errorDetails = {
        original: clientId,
        type: typeof clientId,
        isObjectId: clientId && typeof clientId === 'object' && clientId.constructor?.name === 'ObjectID',
        stringified: typeof clientId === 'object' ? JSON.stringify(clientId) : String(clientId)
      };
      console.error('❌ [API UTILS] Client ID validation failed:', errorDetails);
      throw new Error(`Invalid client ID: Cannot extract valid string from ${typeof clientId} - ${JSON.stringify(errorDetails)}`);
    }
    
    // Validate extracted ID format (MongoDB ObjectID is 24 hex chars)
    if (!/^[0-9a-fA-F]{24}$/.test(extracted)) {
      console.warn('⚠️ [API UTILS] Client ID format warning:', {
        extracted,
        length: extracted.length,
        pattern: /^[0-9a-fA-F]{24}$/.test(extracted)
      });
    }
    
    return extracted;
  },

  // Rest of your existing utility functions...
  formatCurrency: (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  formatDate: (date) => {
    if (!date) return 'Not provided';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  calculatePercentage: (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  isValidEmail: (email) => {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  },

  isValidPAN: (pan) => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  },

  getCompletionColor: (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  },

  getHealthColor: (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }
};

// Meeting Management API (keeping all existing functions)
export const meetingAPI = {
  // Create a scheduled meeting
  createMeeting: async (meetingData) => {
    console.log('📅 CREATING MEETING:', {
      clientId: meetingData.clientId,
      scheduledAt: meetingData.scheduledAt,
      meetingType: meetingData.meetingType || 'scheduled'
    });
    
    const response = await api.post('/meetings/create', meetingData);
    
    console.log('✅ MEETING CREATED:', {
      meetingId: response.data.meeting?.id,
      roomUrl: response.data.meeting?.roomUrl,
      clientMeetingLink: response.data.meeting?.clientMeetingLink
    });
    
    return response.data;
  },

  // Create an instant meeting
  createInstantMeeting: async (clientId) => {
    console.log('⚡ CREATING INSTANT MEETING:', { clientId });
    
    const response = await api.post('/meetings/instant', { clientId });
    
    console.log('✅ INSTANT MEETING CREATED:', {
      meetingId: response.data.meeting?.id,
      roomUrl: response.data.meeting?.roomUrl,
      clientMeetingLink: response.data.meeting?.clientMeetingLink
    });
    
    return response.data;
  },

  // Get all meetings for the current advisor
  getAdvisorMeetings: async (params = {}) => {
    const queryParams = new URLSearchParams({
      limit: params.limit || 20,
      status: params.status || '',
      type: params.type || ''
    });
    
    console.log('📋 FETCHING ADVISOR MEETINGS:', params);
    
    const response = await api.get(`/meetings/advisor?${queryParams}`);
    
    console.log('✅ MEETINGS FETCHED:', {
      meetingCount: response.data.meetings?.length || 0
    });
    
    return response.data;
  },

  // Get meetings for a specific client
  getMeetingsByClient: async (clientId, params = {}) => {
    const queryParams = new URLSearchParams({
      limit: params.limit || 20,
      status: params.status || ''
    });
    
    console.log('📋 FETCHING CLIENT MEETINGS:', { clientId, params });
    
    const response = await api.get(`/meetings/client/${clientId}?${queryParams}`);
    
    console.log('✅ CLIENT MEETINGS FETCHED:', {
      clientId,
      meetingCount: response.data.meetings?.length || 0
    });
    
    return response.data;
  },

  // Get a specific meeting by ID
  getMeetingById: async (meetingId) => {
    console.log('🔍 FETCHING MEETING:', { meetingId });
    
    const response = await api.get(`/meetings/${meetingId}`);
    
    console.log('✅ MEETING FETCHED:', {
      meetingId,
      status: response.data.meeting?.status,
      roomUrl: response.data.meeting?.roomUrl
    });
    
    return response.data;
  },

  // Update meeting status
  updateMeetingStatus: async (meetingId, status) => {
    console.log('🔄 UPDATING MEETING STATUS:', { meetingId, status });
    
    const response = await api.patch(`/meetings/${meetingId}/status`, { status });
    
    console.log('✅ MEETING STATUS UPDATED:', { meetingId, status });
    
    return response.data;
  },

  // Save transcript message (for real-time transcription)
  saveTranscriptMessage: async (transcriptData) => {
    console.log('📝 SAVING TRANSCRIPT MESSAGE:', {
      meetingId: transcriptData.meetingId,
      participantName: transcriptData.participantName,
      isFinal: transcriptData.isFinal
    });
    
    const response = await api.post('/meetings/transcript/message', transcriptData);
    
    console.log('✅ TRANSCRIPT MESSAGE SAVED:', {
      meetingId: transcriptData.meetingId
    });
    
    return response.data;
  },

  // Start transcription for a meeting
  startTranscription: async (meetingId, transcriptionData) => {
    console.log('🎙️ STARTING TRANSCRIPTION:', { meetingId, transcriptionData });
    
    const response = await api.post(`/meetings/${meetingId}/transcription/start`, transcriptionData);
    
    console.log('✅ TRANSCRIPTION STARTED:', {
      meetingId,
      status: response.data.transcript?.status
    });
    
    return response.data;
  },

  // Stop transcription for a meeting
  stopTranscription: async (meetingId, stoppedBy) => {
    console.log('🛑 STOPPING TRANSCRIPTION:', { meetingId, stoppedBy });
    
    const response = await api.post(`/meetings/${meetingId}/transcription/stop`, { stoppedBy });
    
    console.log('✅ TRANSCRIPTION STOPPED:', {
      meetingId,
      messageCount: response.data.transcript?.messageCount
    });
    
    return response.data;
  },

  // Get meeting transcript
  getMeetingTranscript: async (meetingId) => {
    console.log('📄 GETTING MEETING TRANSCRIPT:', { meetingId });
    
    const response = await api.get(`/meetings/${meetingId}/transcript`);
    
    console.log('✅ TRANSCRIPT RETRIEVED:', {
      meetingId,
      transcriptStatus: response.data.transcript?.status,
      messageCount: response.data.transcript?.realTimeMessages?.length || 0
    });
    
    return response.data;
  },

  // Generate AI summary for transcript
  generateTranscriptSummary: async (meetingId) => {
    console.log('🤖 GENERATING TRANSCRIPT SUMMARY:', { meetingId });
    
    const response = await api.post(`/meetings/${meetingId}/transcript/summary`);
    
    console.log('✅ SUMMARY GENERATED:', {
      meetingId,
      keyPointsCount: response.data.summary?.keyPoints?.length || 0,
      actionItemsCount: response.data.summary?.actionItems?.length || 0
    });
    
    return response.data;
  },

  // Recording management
  startRecording: async (meetingId, recordingOptions = {}) => {
    console.log('🎥 STARTING RECORDING:', { meetingId, recordingOptions });
    
    const response = await api.post(`/meetings/${meetingId}/recording/start`, recordingOptions);
    
    console.log('✅ RECORDING STARTED:', {
      meetingId,
      recordingId: response.data.recording?.id,
      status: response.data.recording?.status
    });
    
    return response.data;
  },

  stopRecording: async (meetingId, stoppedBy) => {
    console.log('🛑 STOPPING RECORDING:', { meetingId, stoppedBy });
    
    const response = await api.post(`/meetings/${meetingId}/recording/stop`, { stoppedBy });
    
    console.log('✅ RECORDING STOPPED:', {
      meetingId,
      status: response.data.recording?.status
    });
    
    return response.data;
  },

  // Check domain features
  checkDomainFeatures: async () => {
    console.log('🔍 CHECKING DOMAIN FEATURES');
    
    const response = await api.get('/meetings/features/check');
    
    console.log('✅ DOMAIN FEATURES:', {
      transcriptionEnabled: response.data.features?.transcription?.enabled,
      recordingEnabled: response.data.features?.recording?.enabled,
      requiresUpgrade: response.data.plan?.requiresUpgrade
    });
    
    return response.data;
  },

  // Get clients with transcripts for advisor
  getAdvisorClientsWithTranscripts: async () => {
    console.log('📋 FETCHING CLIENTS WITH TRANSCRIPTS');
    
    const response = await api.get('/meetings/transcripts/clients');
    
    console.log('✅ CLIENTS WITH TRANSCRIPTS FETCHED:', {
      clientCount: response.data.data?.length || 0
    });
    
    return response.data;
  },

  // Check meeting service health
  checkMeetingHealth: async () => {
    console.log('🏥 CHECKING MEETING SERVICE HEALTH');
    
    const response = await api.get('/meetings/health/check');
    
    console.log('✅ MEETING HEALTH CHECK:', {
      status: response.data.status,
      dailyApiConfigured: response.data.dailyApiConfigured
    });
    
    return response.data;
  },

  // Fetch transcription from Daily.co for specific meeting
  fetchMeetingTranscriptionFromDaily: async (meetingId) => {
    console.log('🔍 [MEETING API] Fetching transcription from Daily.co...', { meetingId });
    
    const startTime = Date.now();
    const response = await api.post(`/meetings/${meetingId}/fetch-transcription`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [MEETING API] Transcription fetch completed:', {
      success: response.data.success,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Get transcript download link for a meeting
  getMeetingTranscriptDownloadLink: async (meetingId) => {
    console.log('🔗 [MEETING API] Getting meeting transcript download link...', { meetingId });
    
    const startTime = Date.now();
    const response = await api.get(`/meetings/${meetingId}/transcript/download-link`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [MEETING API] Download link retrieved:', {
      success: response.data.success,
      hasDownloadLink: !!response.data.downloadLink,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Direct transcript download using transcriptId (existing function)
  getTranscriptDownloadLink: async (transcriptId) => {
    console.log('🔗 [MEETING API] Getting transcript download link by ID...', { transcriptId });
    
    const startTime = Date.now();
    const response = await api.get(`/meetings/transcript/${transcriptId}/download-link`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [MEETING API] Download link retrieved by ID:', {
      success: response.data.success,
      hasDownloadLink: !!response.data.downloadLink,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  }
};

// Letter of Engagement (LOE) API (keeping all existing functions)
export const loeAPI = {
  // Send LOE for a meeting
  sendLOE: async (meetingId, customNotes = '') => {
    console.log('📄 SENDING LOE:', { meetingId, hasCustomNotes: !!customNotes });
    
    const response = await api.post('/loe/send', {
      meetingId,
      customNotes
    });
    
    console.log('✅ LOE SENT:', {
      loeId: response.data.data?.loeId,
      status: response.data.data?.status,
      clientAccessUrl: response.data.data?.clientAccessUrl
    });
    
    return response.data;
  },

  // Get LOE status for a meeting
  getMeetingLOEStatus: async (meetingId) => {
    const response = await api.get(`/loe/meeting/${meetingId}/status`);
    return response.data;
  },

  // Get all LOEs for advisor
  getAdvisorLOEs: async (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      status: params.status || ''
    });
    
    const response = await api.get(`/loe/advisor?${queryParams}`);
    return response.data;
  },

  // Get LOEs for a specific client (filter from advisor LOEs)
  getLOEsByClient: async (clientId) => {
    console.log('📋 FETCHING CLIENT LOEs:', { clientId });
    
    try {
      // Get all LOEs and filter by clientId on frontend
      // Since backend doesn't have client-specific endpoint yet
      const response = await api.get('/loe/advisor?limit=100');
      
      console.log('📊 LOE API Response:', {
        success: response.data?.success,
        hasData: !!response.data?.data,
        loesCount: response.data?.data?.loes?.length || 0,
        structure: response.data
      });
      
      if (response.data?.success && response.data?.data?.loes) {
        // Log first LOE to check structure
        if (response.data.data.loes.length > 0) {
          console.log('🔍 First LOE structure:', {
            loe: response.data.data.loes[0],
            clientIdField: response.data.data.loes[0].clientId,
            clientIdType: typeof response.data.data.loes[0].clientId
          });
        }
        
        const clientLOEs = response.data.data.loes.filter(loe => {
          // Handle null/undefined clientId
          if (!loe.clientId) {
            console.log('⚠️ LOE has no clientId:', { loeId: loe._id });
            return false;
          }
          
          const loeClientId = typeof loe.clientId === 'object' ? loe.clientId._id : loe.clientId;
          const matches = loeClientId === clientId;
          
          console.log('🔍 LOE Filter Check:', {
            loeId: loe._id,
            loeClientId,
            targetClientId: clientId,
            clientIdType: typeof loe.clientId,
            clientIdObject: loe.clientId,
            matches
          });
          
          return matches;
        });
        
        console.log('✅ CLIENT LOEs FILTERED:', {
          clientId,
          totalLOEs: response.data.data.loes.length,
          clientLOEs: clientLOEs.length,
          filteredLOEs: clientLOEs
        });
        
        return {
          success: true,
          data: {
            loes: clientLOEs,
            pagination: {
              total: clientLOEs.length,
              page: 1,
              pages: 1
            }
          }
        };
      }
      
      console.warn('⚠️ No LOE data found in response');
      return {
        success: false,
        data: { loes: [], pagination: { total: 0, page: 1, pages: 0 } }
      };
      
    } catch (error) {
      console.error('❌ Error fetching client LOEs:', error);
      return {
        success: false,
        data: { loes: [], pagination: { total: 0, page: 1, pages: 0 } }
      };
    }
  },

  // Public endpoints (no auth required)
  // View LOE by token
  viewLOE: async (token) => {
    console.log('👁️ VIEWING LOE:', { token });
    
    const response = await api.get(`/loe/view/${token}`);
    
    console.log('✅ LOE RETRIEVED:', {
      status: response.data.data?.status,
      isSigned: response.data.data?.isSigned
    });
    
    return response.data;
  },

  // Sign LOE
  signLOE: async (token, signature) => {
    console.log('✍️ SIGNING LOE:', { token, hasSignature: !!signature });
    
    const response = await api.post(`/loe/sign/${token}`, {
      signature
    });
    
    console.log('✅ LOE SIGNED:', {
      status: response.data.data?.status,
      signedAt: response.data.data?.signedAt
    });
    
    return response.data;
  }
};

// ============================================================================
// VAULT API FUNCTIONS (Branding & Professional Details)
// ============================================================================

export const vaultAPI = {
  // Get vault data for advisor
  getVaultData: async () => {
    console.log('🔐 [VAULT API] Fetching vault data...');
    
    const startTime = Date.now();
    const response = await api.get('/vault');
    const duration = Date.now() - startTime;
    
    console.log('✅ [VAULT API] Vault data fetched:', {
      hasData: !!response.data.data,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Update vault data
  updateVaultData: async (data, section = 'general') => {
    console.log('🔐 [VAULT API] Updating vault data...', {
      section,
      sections: Object.keys(data),
      timestamp: new Date().toISOString()
    });
    
    const startTime = Date.now();
    const response = await api.put(`/vault?section=${section}`, data);
    const duration = Date.now() - startTime;
    
    console.log('✅ [VAULT API] Vault data updated:', {
      success: response.data.success,
      section,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Add certification
  addCertification: async (certificationData) => {
    console.log('🏆 [VAULT API] Adding certification...', {
      name: certificationData.name,
      issuingBody: certificationData.issuingBody,
      timestamp: new Date().toISOString()
    });
    
    const startTime = Date.now();
    const response = await api.post('/vault/certifications', certificationData);
    const duration = Date.now() - startTime;
    
    console.log('✅ [VAULT API] Certification added:', {
      success: response.data.success,
      certId: response.data.data?._id,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Update certification
  updateCertification: async (certId, certificationData) => {
    console.log('🏆 [VAULT API] Updating certification...', {
      certId,
      name: certificationData.name,
      timestamp: new Date().toISOString()
    });
    
    const startTime = Date.now();
    const response = await api.put(`/vault/certifications/${certId}`, certificationData);
    const duration = Date.now() - startTime;
    
    console.log('✅ [VAULT API] Certification updated:', {
      success: response.data.success,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Delete certification
  deleteCertification: async (certId) => {
    console.log('🗑️ [VAULT API] Deleting certification...', {
      certId,
      timestamp: new Date().toISOString()
    });
    
    const startTime = Date.now();
    const response = await api.delete(`/vault/certifications/${certId}`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [VAULT API] Certification deleted:', {
      success: response.data.success,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Add membership
  addMembership: async (membershipData) => {
    console.log('👥 [VAULT API] Adding membership...', {
      organization: membershipData.organization,
      membershipType: membershipData.membershipType,
      timestamp: new Date().toISOString()
    });
    
    const startTime = Date.now();
    const response = await api.post('/vault/memberships', membershipData);
    const duration = Date.now() - startTime;
    
    console.log('✅ [VAULT API] Membership added:', {
      success: response.data.success,
      membershipId: response.data.data?._id,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Update membership
  updateMembership: async (membershipId, membershipData) => {
    console.log('👥 [VAULT API] Updating membership...', {
      membershipId,
      organization: membershipData.organization,
      timestamp: new Date().toISOString()
    });
    
    const startTime = Date.now();
    const response = await api.put(`/vault/memberships/${membershipId}`, membershipData);
    const duration = Date.now() - startTime;
    
    console.log('✅ [VAULT API] Membership updated:', {
      success: response.data.success,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Delete membership
  deleteMembership: async (membershipId) => {
    console.log('🗑️ [VAULT API] Deleting membership...', {
      membershipId,
      timestamp: new Date().toISOString()
    });
    
    const startTime = Date.now();
    const response = await api.delete(`/vault/memberships/${membershipId}`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [VAULT API] Membership deleted:', {
      success: response.data.success,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  }
};

// ============================================================================
// TRANSCRIPTION API FUNCTIONS (Daily.co Integration)
// ============================================================================

export const transcriptionAPI = {
  // Sync all transcriptions from Daily.co
  syncTranscriptions: async () => {
    console.log('🔄 [TRANSCRIPTION API] Syncing transcriptions from Daily.co...');
    
    const startTime = Date.now();
    const response = await api.post('/transcriptions/sync');
    const duration = Date.now() - startTime;
    
    console.log('✅ [TRANSCRIPTION API] Sync completed:', {
      success: response.data.success,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Get advisor's transcriptions
  getAdvisorTranscriptions: async (params = {}) => {
    console.log('📋 [TRANSCRIPTION API] Fetching advisor transcriptions...', { params });
    
    const startTime = Date.now();
    const response = await api.get('/transcriptions/advisor', { params });
    const duration = Date.now() - startTime;
    
    console.log('✅ [TRANSCRIPTION API] Transcriptions fetched:', {
      success: response.data.success,
      count: response.data.transcriptions?.length || 0,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Get specific transcription
  getTranscriptionById: async (transcriptionId) => {
    console.log('🔍 [TRANSCRIPTION API] Fetching transcription by ID...', { transcriptionId });
    
    const startTime = Date.now();
    const response = await api.get(`/transcriptions/${transcriptionId}`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [TRANSCRIPTION API] Transcription fetched:', {
      success: response.data.success,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Fetch transcription content
  fetchTranscriptionContent: async (transcriptionId) => {
    console.log('⬇️ [TRANSCRIPTION API] Fetching transcription content...', { transcriptionId });
    
    const startTime = Date.now();
    const response = await api.post(`/transcriptions/${transcriptionId}/fetch`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [TRANSCRIPTION API] Content fetch completed:', {
      success: response.data.success,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Retry failed fetches
  retryFailedFetches: async () => {
    console.log('🔄 [TRANSCRIPTION API] Retrying failed fetches...');
    
    const startTime = Date.now();
    const response = await api.post('/transcriptions/retry-failed');
    const duration = Date.now() - startTime;
    
    console.log('✅ [TRANSCRIPTION API] Retry completed:', {
      success: response.data.success,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  }
};

// ============================================================================
// CLIENT REPORTS API FUNCTIONS (Comprehensive Client Reports)
// ============================================================================

export const clientReportsAPI = {
  // Get advisor's vault data for report header
  getAdvisorVaultData: async () => {
    console.log('🔐 [CLIENT REPORTS API] Fetching advisor vault data...');
    
    try {
      const startTime = Date.now();
      const response = await api.get('/client-reports/vault');
      const duration = Date.now() - startTime;
      
      console.log('✅ [CLIENT REPORTS API] Vault data fetched:', {
        success: response.data.success,
        hasData: !!response.data.data,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ [CLIENT REPORTS API] Vault data fetch failed:', {
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      });
      throw error;
    }
  },

  // Get client list for advisor
  getClientList: async () => {
    console.log('📋 [CLIENT REPORTS API] Fetching client list...');
    
    try {
      const startTime = Date.now();
      const response = await api.get('/client-reports/clients');
      const duration = Date.now() - startTime;
      
      console.log('✅ [CLIENT REPORTS API] Client list fetched:', {
        success: response.data.success,
        clientCount: response.data.data?.clients?.length || 0,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ [CLIENT REPORTS API] Client list fetch failed:', {
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      });
      throw error;
    }
  },

  // Get comprehensive client report
  getClientReport: async (clientId) => {
    console.log(`📊 [CLIENT REPORTS API] Fetching comprehensive report for client: ${clientId}`);
    
    try {
      // Use utility function to safely extract and validate client ID
      const validatedClientId = apiUtils.validateClientId(clientId);
      
      console.log('✅ [CLIENT REPORTS API] Client ID validated:', {
        original: clientId,
        validated: validatedClientId,
        type: typeof validatedClientId
      });
      
      const startTime = Date.now();
      const response = await api.get(`/client-reports/clients/${validatedClientId}`);
      const duration = Date.now() - startTime;
      
      console.log('✅ [CLIENT REPORTS API] Client report fetched:', {
        success: response.data.success,
        clientId: validatedClientId,
        hasData: !!response.data.data,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ [CLIENT REPORTS API] Client report fetch failed:', {
        originalClientId: clientId,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        requestUrl: `/client-reports/clients/${clientId}`
      });
      throw error;
    }
  },

  // Debug function to help troubleshoot client ID issues
  debugClientId: (clientId) => {
    console.log('🔍 [CLIENT REPORTS API] Debugging client ID:', {
      original: clientId,
      type: typeof clientId,
      isNull: clientId === null,
      isUndefined: clientId === undefined,
      isString: typeof clientId === 'string',
      isObject: typeof clientId === 'object',
      isArray: Array.isArray(clientId),
      length: clientId?.length,
      keys: typeof clientId === 'object' ? Object.keys(clientId || {}) : 'N/A',
      stringified: JSON.stringify(clientId),
      extracted: apiUtils.extractClientId(clientId)
    });
    
    return {
      original: clientId,
      extracted: apiUtils.extractClientId(clientId),
      isValid: !!apiUtils.extractClientId(clientId)
    };
  }
};

// ============================================================================
// FINAL REPORT API FUNCTIONS (Comprehensive Client Data Aggregation)
// ============================================================================

export const finalReportAPI = {
  // Get all clients for an advisor (for client selection)
  getClientsForReport: async () => {
    console.log('📊 [FINAL REPORT API] Fetching clients for report generation...');
    
    const startTime = Date.now();
    const response = await api.get('/final-report/clients');
    const duration = Date.now() - startTime;
    
    console.log('✅ [FINAL REPORT API] Clients fetched successfully:', {
      success: response.data.success,
      clientCount: response.data.data?.clients?.length || 0,
      totalClients: response.data.data?.totalClients || 0,
      correlationId: response.data.correlationId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Get comprehensive client data for final report generation
  getComprehensiveClientData: async (clientId) => {
    console.log(`📊 [FINAL REPORT API] Fetching comprehensive data for client: ${clientId}`);
    
    const startTime = Date.now();
    const response = await api.get(`/final-report/data/${clientId}`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [FINAL REPORT API] Comprehensive data fetched successfully:', {
      success: response.data.success,
      clientId,
      reportId: response.data.data?.header?.reportId,
      totalServices: response.data.data?.summary?.totalServices,
      activeServices: response.data.data?.summary?.activeServices,
      portfolioValue: response.data.data?.summary?.portfolioValue,
      correlationId: response.data.correlationId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Get comprehensive data summary (lightweight version)
  getComprehensiveSummary: async (clientId) => {
    console.log(`📊 [FINAL REPORT API] Fetching summary for client: ${clientId}`);
    
    const startTime = Date.now();
    const response = await api.get(`/final-report/summary/${clientId}`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [FINAL REPORT API] Summary fetched successfully:', {
      success: response.data.success,
      clientId,
      totalServices: response.data.data?.totalServices,
      activeServices: response.data.data?.activeServices,
      correlationId: response.data.correlationId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return response.data;
  },

  // Test the final report API endpoints
  testEndpoints: async () => {
    console.log('🧪 [FINAL REPORT API] Testing endpoints...');
    
    try {
      // Test clients endpoint
      const clientsResponse = await api.get('/final-report/test');
      console.log('✅ [FINAL REPORT API] Test endpoint working:', clientsResponse.data);
      
      return { success: true, message: 'All endpoints working correctly' };
    } catch (error) {
      console.error('❌ [FINAL REPORT API] Test failed:', error);
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// MUTUAL FUND RECOMMEND API FUNCTIONS
// ============================================================================

export const mutualFundRecommendAPI = {
  // Get all recommendations for a specific client
  getClientRecommendations: async (clientId) => {
    try {
      const response = await api.get(`/mutual-fund-recommend/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client recommendations:', error);
      throw error;
    }
  },

  // Create a new mutual fund recommendation
  createRecommendation: async (recommendationData) => {
    try {
      const response = await api.post(`/mutual-fund-recommend`, recommendationData);
      return response.data;
    } catch (error) {
      console.error('Error creating recommendation:', error);
      throw error;
    }
  },

  // Update an existing recommendation
  updateRecommendation: async (id, updateData) => {
    try {
      const response = await api.put(`/mutual-fund-recommend/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating recommendation:', error);
      throw error;
    }
  },

  // Delete a recommendation
  deleteRecommendation: async (id) => {
    try {
      const response = await api.delete(`/mutual-fund-recommend/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      throw error;
    }
  },

  // Get a specific recommendation by ID
  getRecommendationById: async (id) => {
    try {
      const response = await api.get(`/mutual-fund-recommend/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      throw error;
    }
  },

  // Get recommendations summary for the advisor
  getRecommendationsSummary: async () => {
    try {
      const response = await api.get(`/mutual-fund-recommend/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations summary:', error);
      throw error;
    }
  },

  // Fetch mutual fund details from Claude AI
  fetchFundDetails: async (fundName, fundHouseName) => {
    try {
      const response = await api.post(`/mutual-fund-recommend/claude/fund-details`, {
        fundName,
        fundHouseName
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching fund details from Claude AI:', error);
      throw error;
    }
  }
};

// Export default API instance for custom requests
export default api;