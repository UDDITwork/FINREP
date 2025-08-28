// File: frontend/src/services/marketDataAPI.js
import api from './api';

export const marketDataAPI = {
  /**
   * Get NIFTY 50 data
   */
  getNifty50Data: async () => {
    try {
      console.log('📊 [MARKET API] Fetching NIFTY 50 data...');
      const response = await api.get('/market-data/nifty50');
      
      console.log('✅ [MARKET API] NIFTY 50 data fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [MARKET API] Error fetching NIFTY 50:', error);
      throw error;
    }
  },

  /**
   * Get SENSEX data
   */
  getSensexData: async () => {
    try {
      console.log('📊 [MARKET API] Fetching SENSEX data...');
      const response = await api.get('/market-data/sensex');
      
      console.log('✅ [MARKET API] SENSEX data fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [MARKET API] Error fetching SENSEX:', error);
      throw error;
    }
  },

  /**
   * Get Bank Nifty data
   */
  getBankNiftyData: async () => {
    try {
      console.log('📊 [MARKET API] Fetching Bank Nifty data...');
      const response = await api.get('/market-data/banknifty');
      
      console.log('✅ [MARKET API] Bank Nifty data fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [MARKET API] Error fetching Bank Nifty:', error);
      throw error;
    }
  },

  /**
   * Get all market data in one request
   */
  getMarketOverview: async () => {
    try {
      console.log('📊 [MARKET API] Fetching market overview...');
      const response = await api.get('/market-data/overview');
      
      console.log('✅ [MARKET API] Market overview fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [MARKET API] Error fetching market overview:', error);
      throw error;
    }
  },

  /**
   * Health check
   */
  checkHealth: async () => {
    try {
      const response = await api.get('/market-data/health');
      return response.data;
    } catch (error) {
      console.error('❌ [MARKET API] Health check failed:', error);
      throw error;
    }
  }
};
