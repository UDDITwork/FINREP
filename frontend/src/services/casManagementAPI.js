// Location: frontend/src/services/casManagementAPI.js

import api from './api';

/**
 * CAS Management API Service
 * Handles all CAS (Consolidated Account Statement) related API calls
 */

const casManagementAPI = {
  /**
   * Get CAS summary statistics for the advisor
   */
  getCASSummary: async () => {
    console.log('📈 FETCHING CAS SUMMARY');
    
    try {
      const response = await api.get('/cas-management/summary');
      
      console.log('✅ CAS SUMMARY FETCHED:', {
        totalClients: response.data.data?.totalClients || 0,
        clientsWithCAS: response.data.data?.clientsWithCAS || 0,
        casPercentage: response.data.data?.casPercentage || 0,
        totalPortfolioValue: response.data.data?.totalPortfolioValue || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ CAS SUMMARY FETCH ERROR:', error);
      throw error;
    }
  },

  /**
   * Get all clients of the advisor who have CAS data
   */
  getClientsWithCAS: async () => {
    console.log('📋 FETCHING CLIENTS WITH CAS DATA');
    
    try {
      const response = await api.get('/cas-management/clients');
      
      console.log('✅ CLIENTS WITH CAS FETCHED:', {
        totalClients: response.data.data?.totalClients || 0,
        clients: response.data.data?.clients?.length || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ CLIENTS WITH CAS FETCH ERROR:', error);
      throw error;
    }
  },

  /**
   * Get detailed CAS information for a specific client
   */
  getClientCASDetails: async (clientId) => {
    console.log(`📊 FETCHING CAS DETAILS FOR CLIENT: ${clientId}`);
    
    try {
      const response = await api.get(`/cas-management/clients/${clientId}`);
      
      console.log('✅ CLIENT CAS DETAILS FETCHED:', {
        clientName: response.data.data?.clientInfo?.name || 'Unknown',
        portfolioValue: response.data.data?.portfolio?.totalValue || 0,
        dematAccounts: response.data.data?.accounts?.demat?.count || 0,
        mutualFunds: response.data.data?.accounts?.mutualFunds?.count || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ CLIENT CAS DETAILS FETCH ERROR:', error);
      throw error;
    }
  },

  /**
   * Health check for CAS management service
   */
  healthCheck: async () => {
    console.log('🏥 CAS MANAGEMENT HEALTH CHECK');
    
    try {
      const response = await api.get('/cas-management/health');
      
      console.log('✅ CAS MANAGEMENT HEALTH CHECK PASSED');
      
      return response.data;
    } catch (error) {
      console.error('❌ CAS MANAGEMENT HEALTH CHECK FAILED:', error);
      throw error;
    }
  }
};

export default casManagementAPI;
