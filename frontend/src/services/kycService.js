/**
 * FILE LOCATION: frontend/src/services/kycService.js
 * 
 * PURPOSE: Frontend service layer for KYC verification API operations
 * 


 */

import api from './api';

class KYCService {
  // Get all clients for KYC verification
  async getClientsForKYC() {
    try {
      const response = await api.get('/kyc/clients');
      return response.data;
    } catch (error) {
      console.error('Error fetching clients for KYC:', error);
      throw error;
    }
  }

  // Get KYC status for a specific client
  async getKYCStatus(clientId) {
    try {
      const response = await api.get(`/kyc/status/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      throw error;
    }
  }

  // Start KYC workflow for a client
  async startKYCWorkflow(clientId) {
    try {
      const response = await api.post(`/kyc/workflow/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error starting KYC workflow:', error);
      throw error;
    }
  }

  // Reset KYC verification for a client
  async resetKYCVerification(clientId, documentType) {
    try {
      const response = await api.post(`/kyc/reset/${clientId}`, {
        documentType
      });
      return response.data;
    } catch (error) {
      console.error('Error resetting KYC verification:', error);
      throw error;
    }
  }

  // Check KYC status manually (simplified approach without webhooks)
  async checkKYCStatusManually(clientId) {
    try {
      const response = await api.get(`/kyc/check-status/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking KYC status manually:', error);
      throw error;
    }
  }
}

export default new KYCService();
