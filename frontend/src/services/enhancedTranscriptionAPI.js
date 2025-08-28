import api from './api';

export const enhancedTranscriptionAPI = {
  /**
   * Test connection to enhanced transcription API
   */
  testConnection: async () => {
    try {
      const response = await api.get('/enhanced-transcriptions/test');
      return response.data;
    } catch (error) {
      console.error('Test connection failed:', error);
      throw error;
    }
  },

  /**
   * Get debug information about transcriptions
   */
  getDebugInfo: async () => {
    try {
      const response = await api.get('/enhanced-transcriptions/debug');
      return response.data;
    } catch (error) {
      console.error('Debug info failed:', error);
      throw error;
    }
  },

  /**
   * Get all meetings with parsed transcriptions for an advisor
   */
  getAdvisorTranscriptions: async () => {
    try {
      const response = await api.get('/enhanced-transcriptions');
      return response.data;
    } catch (error) {
      console.error('Failed to get advisor transcriptions:', error);
      throw error;
    }
  },

  /**
   * Parse transcription from Daily.co URL for a specific meeting
   */
  parseMeetingTranscription: async (meetingId) => {
    try {
      const response = await api.post(`/enhanced-transcriptions/${meetingId}/parse`);
      return response.data;
    } catch (error) {
      console.error('Failed to parse meeting transcription:', error);
      throw error;
    }
  },

  /**
   * Get detailed transcription view for a specific meeting
   */
  getMeetingTranscriptionDetails: async (meetingId) => {
    try {
      const response = await api.get(`/enhanced-transcriptions/${meetingId}/details`);
      return response.data;
    } catch (error) {
      console.error('Failed to get meeting transcription details:', error);
      throw error;
    }
  },

  /**
   * Bulk parse all unparsed transcriptions for an advisor
   */
  bulkParseTranscriptions: async () => {
    try {
      const response = await api.post('/enhanced-transcriptions/bulk-parse');
      return response.data;
    } catch (error) {
      console.error('Failed to bulk parse transcriptions:', error);
      throw error;
    }
  },

  /**
   * Search transcriptions by content
   */
  searchTranscriptions: async (query, limit = 20) => {
    try {
      const response = await api.get('/enhanced-transcriptions/search', {
        params: { query, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search transcriptions:', error);
      throw error;
    }
  }
};
