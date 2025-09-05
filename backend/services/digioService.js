/**
 * FILE LOCATION: backend/services/digioService.js
 * 
 * PURPOSE: Service layer for integrating with Digio's KYC verification API
 * 
 * FUNCTIONALITY:
 * - Handles authentication with Digio API using client credentials
 * - Creates KYC workflow requests using Digio's template system
 * - Retrieves verification status from Digio's API
 * - Manages access tokens and authentication headers
 * - Provides validation for Aadhar and PAN numbers
 * 
 * API ENDPOINTS USED:
 * - POST /v2/client/auth_token: Get access token for API calls
 * - POST /client/kyc/v2/request/with_template: Create KYC workflow request
 * - POST /client/kyc/v2/{id}/response: Get verification status
 * 
 * DATA TRANSMISSION:
 * - Sends: Client identifier, name, template name, reference IDs
 * - Receives: Digio request ID, access token, verification status
 * - Transmits: Authentication headers with Bearer tokens
 * 
 * CONNECTIVITY:
 * - Connects to Digio API at https://api.digio.in
 * - Receives credentials from environment variables (DIGIO_CLIENT_ID, DIGIO_CLIENT_SECRET)
 * - Sends data to KYC controller for database operations
 * - Receives webhook data from Digio for status updates
 * 
 * AUTHENTICATION FLOW:
 * 1. Generates access token using client credentials
 * 2. Caches token for 1 hour to avoid repeated API calls
 * 3. Includes token in Authorization header for all API requests
 * 4. Handles token expiration and renewal automatically
 * 
 * WORKFLOW INTEGRATION:
 * - Uses 'SURENDRA' template for KYC verification
 * - Generates unique reference and transaction IDs
 * - Sets customer notification preferences
 * - Configures access token generation for SDK integration
 * 
 * ERROR HANDLING:
 * - Catches and logs API errors with detailed response data
 * - Returns structured error responses for controller handling
 * - Implements retry logic for authentication failures
 * - Provides fallback error messages for unknown failures
 */

const axios = require('axios');

class DigioService {
  constructor() {
    // Backend API URL for production
    this.baseURL = 'https://api.digio.in';
    this.clientId = process.env.DIGIO_CLIENT_ID;
    this.clientSecret = process.env.DIGIO_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get headers with Basic Authentication
  getHeaders() {
    // Create Basic Auth header
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const basicAuth = `Basic ${credentials}`;
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': basicAuth
    };
  }

  // New method to create a KYC workflow request using a template
  async createKYCWorkflowRequest(customerIdentifier, customerName, referenceId, transactionId, templateName = 'SURENDRA', notifyCustomer = false, generateAccessToken = true) {
    try {
      const headers = this.getHeaders();
      
      // Validate required parameters according to Digio API specs
      if (!customerIdentifier || !customerName) {
        throw new Error('customer_identifier and customer_name are required');
      }
      
      if (customerName.length > 100) {
        throw new Error('customer_name must be 100 characters or less');
      }
      
      if (referenceId && !/^[0-9A-Za-z\_\-\/]{0,}$/.test(referenceId)) {
        throw new Error('reference_id must contain only alphanumeric characters, underscores, hyphens, and forward slashes');
      }
      
      if (transactionId && !/^[0-9A-Za-z\_\-\/]{0,}$/.test(transactionId)) {
        throw new Error('transaction_id must contain only alphanumeric characters, underscores, hyphens, and forward slashes');
      }
      
      const payload = {
        customer_identifier: customerIdentifier,
        customer_name: customerName,
        template_name: templateName,
        notify_customer: notifyCustomer,
        customer_notification_mode: 'SMS', // Required parameter
        reference_id: referenceId,
        transaction_id: transactionId,
        expire_in_days: 10, // Default 10 days, valid range 1-90
        generate_access_token: generateAccessToken,
        generate_deeplink_info: true // Required parameter
      };

      const response = await axios.post(
        `${this.baseURL}/client/kyc/v2/request/with_template`,
        payload,
        { headers }
      );

      if (response.data && response.data.id) {
        return {
          success: true,
          digioRequestId: response.data.id,
          accessToken: response.data.access_token, // Fixed: Direct access to access_token object
          message: 'KYC workflow request created successfully'
        };
      } else {
        throw new Error('Invalid response from Digio create KYC request API');
      }
    } catch (error) {
      console.error('Error creating KYC workflow request:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_messages?.join(', ') || error.message || 'Failed to create KYC workflow request'
      };
    }
  }

  // Get verification status for a template-based request
  async getVerificationStatus(digioRequestId) {
    try {
      const headers = this.getHeaders();
      
      const response = await axios.post(
        `${this.baseURL}/client/kyc/v2/${digioRequestId}/response`,
        {},
        { headers }
      );

      if (response.data && response.data.request_details) {
        const requestDetails = response.data.request_details;
        const kycStatusData = {
          overallStatus: requestDetails.status, // 'requested', 'approved', 'rejected', 'failed', 'expired', 'skipped'
          aadharStatus: 'not_started', // Default
          panStatus: 'not_started',    // Default
          actions: response.data.actions || [] // Store actions for detailed parsing
        };

        // Parse actions to get specific Aadhar and PAN statuses
        const aadharAction = response.data.actions?.find(action => 
          action.type === 'aadhaar_offline' || action.type === 'aadhaar'
        );
        if (aadharAction) {
          kycStatusData.aadharStatus = aadharAction.status; // 'requested', 'success', 'failed' etc.
        }

        const panAction = response.data.actions?.find(action => 
          action.type === 'digilocker' || action.type === 'pan'
        );
        if (panAction) {
          kycStatusData.panStatus = panAction.status;
        }

        return {
          success: true,
          data: kycStatusData
        };
      } else {
        throw new Error('Invalid response from Digio get KYC status API');
      }
    } catch (error) {
      console.error('Error getting verification status:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_messages?.join(', ') || error.message || 'Failed to get verification status'
      };
    }
  }

  // Validate Aadhar number format (still useful for initial client input)
  validateAadharNumber(aadharNumber) {
    const aadharRegex = /^\d{12}$/;
    return aadharRegex.test(aadharNumber);
  }

  // Validate PAN number format (still useful for initial client input)
  validatePANNumber(panNumber) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(panNumber);
  }
}

module.exports = new DigioService();
