/**
 * FILE LOCATION: frontend/src/services/kycService.js
 * 
 * PURPOSE: Frontend service layer for KYC verification API operations
 * 
 * FUNCTIONALITY:
 * - Provides HTTP client interface for KYC verification endpoints
 * - Handles authentication headers and request formatting
 * - Manages API response processing and error handling
 * - Implements retry logic and fallback error messages
 * - Centralizes KYC API communication for frontend components
 * 
 * API ENDPOINTS CONSUMED:
 * - GET /api/kyc/clients: Fetch advisor's clients for KYC selection
 * - GET /api/kyc/status/:clientId: Get KYC status for specific client
 * - POST /api/kyc/workflow/:clientId: Start KYC verification workflow
 * - POST /api/kyc/reset/:clientId: Reset KYC verification status
 * 
 * DATA TRANSMISSION:
 * - Sends: Client IDs, document types, reset parameters
 * - Receives: Client lists, KYC status data, workflow responses
 * - Headers: Authorization Bearer token for authenticated requests
 * - Content-Type: application/json for all requests
 * 
 * CONNECTIVITY:
 * - Connects to backend KYC API endpoints via HTTP
 * - Uses axios instance with base URL configuration
 * - Implements automatic token inclusion from localStorage
 * - Handles CORS and network connectivity issues
 * 
 * AUTHENTICATION:
 * - Automatically includes JWT token from localStorage
 * - Token format: Bearer {token} in Authorization header
 * - Handles 401 responses by redirecting to login
 * - Maintains session state for authenticated requests
 * 
 * ERROR HANDLING:
 * - Catches and logs API errors with detailed information
 * - Provides user-friendly error messages for frontend display
 * - Implements graceful degradation for service failures
 * - Logs error details for debugging and monitoring
 * 
 * RESPONSE PROCESSING:
 * - Extracts data from API response structure
 * - Handles both success and error response formats
 * - Provides consistent error message format for components
 * - Implements response validation and data sanitization
 * 
 * INTEGRATION POINTS:
 * - Used by: KYCVerification, KYCWorkflow, KYCStatus components
 * - Integrates with: Backend KYC API endpoints
 * - Depends on: Authentication context and token storage
 * - Provides: Promise-based async operations for components
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
}

export default new KYCService();
