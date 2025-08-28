// File: frontend/src/services/finalReportAPI.js
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const finalReportAPI = {
  /**
   * Get all clients for an advisor (for client selection)
   */
  getClientsForReport: async () => {
    try {
      const response = await api.get('/final-report/clients');
      return response.data;
    } catch (error) {
      console.error('Error fetching clients for report:', error);
      throw error;
    }
  },

  /**
   * Get comprehensive client data for final report generation
   */
  getComprehensiveClientData: async (clientId) => {
    try {
      const response = await api.get(`/final-report/data/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comprehensive client data:', error);
      throw error;
    }
  },

  /**
   * Get comprehensive data summary (lightweight version)
   */
  getComprehensiveSummary: async (clientId) => {
    try {
      const response = await api.get(`/final-report/summary/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comprehensive summary:', error);
      throw error;
    }
  },

  /**
   * Test endpoint to verify API connectivity
   */
  testConnection: async () => {
    try {
      const response = await api.get('/final-report/test');
      return response.data;
    } catch (error) {
      console.error('Error testing final report API connection:', error);
      throw error;
    }
  }
};
