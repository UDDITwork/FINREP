/**
 * FILE LOCATION: frontend/src/services/pdfAPI.js
 * 
 * PURPOSE: PDF generation API service for frontend
 * 

 */

import axios from 'axios';
import { toast } from 'react-hot-toast';

class PDFAPI {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    this.timeout = 60000; // 60 seconds timeout for PDF generation
  }

  /**
   * Generate comprehensive PDF report for a client
   * @param {String} clientId - Client ID
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise} - PDF download promise
   */
  async generateClientReport(clientId, onProgress = null) {
    // Ensure clientId is a string - declare at function scope
    let stringClientId;
    
    if (typeof clientId === 'string') {
      stringClientId = clientId;
    } else if (clientId && typeof clientId === 'object') {
      // Handle MongoDB ObjectId or other objects
      if (clientId.toString && typeof clientId.toString === 'function') {
        stringClientId = clientId.toString();
      } else if (clientId._id) {
        stringClientId = clientId._id.toString();
      } else if (clientId.id) {
        stringClientId = clientId.id.toString();
      } else {
        stringClientId = JSON.stringify(clientId);
      }
    } else {
      stringClientId = String(clientId);
    }
    
    // Validate that we have a proper client ID
    if (!stringClientId || stringClientId === 'undefined' || stringClientId === 'null' || stringClientId === '[object Object]') {
      throw new Error('Invalid client ID provided');
    }
    
    // Check if it's a valid MongoDB ObjectId format (24 hex characters)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(stringClientId)) {
      console.warn('⚠️ [PDF API] Client ID is not a valid MongoDB ObjectId format', {
        clientId: stringClientId,
        expectedFormat: '24 hexadecimal characters (0-9, a-f)',
        actualLength: stringClientId.length
      });
      
      // For now, we'll still try to generate the PDF, but log the warning
      // The backend will handle the validation and provide appropriate error messages
    }
    
    try {
      // Debug logging
      console.log('🚀 [PDF API] Starting PDF generation', {
        originalClientId: clientId,
        stringClientId,
        clientIdType: typeof clientId,
        stringClientIdType: typeof stringClientId,
        clientIdLength: stringClientId?.length,
        timestamp: new Date().toISOString()
      });

      // Show loading toast
      const loadingToast = toast.loading('Generating comprehensive PDF report...', {
        duration: 0 // Keep loading until we dismiss it
      });

      // Update progress if callback provided
      if (onProgress) {
        onProgress(10, 'Preparing report data...');
      }

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Update progress
      if (onProgress) {
        onProgress(30, 'Fetching client data...');
      }

      console.log('📡 [PDF API] Making API request', {
        url: `${this.baseURL}/pdf/generate-client-report/${stringClientId}`,
        method: 'POST',
        hasToken: !!token,
        tokenLength: token?.length,
        fullUrl: `${this.baseURL}/pdf/generate-client-report/${stringClientId}`
      });

      // Make API call to generate PDF
      const response = await axios.post(
        `${this.baseURL}/pdf/generate-client-report/${stringClientId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob', // Important for file download
          timeout: this.timeout,
          onDownloadProgress: (progressEvent) => {
            if (onProgress && progressEvent.lengthComputable) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(50 + (percentCompleted * 0.4), 'Generating PDF...');
            }
          }
        }
      );

      // Update progress
      if (onProgress) {
        onProgress(90, 'Finalizing PDF...');
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Extract filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(url);

      // Update progress
      if (onProgress) {
        onProgress(100, 'Download complete!');
      }

      // Show success toast
      toast.success('PDF report generated and downloaded successfully!', {
        duration: 5000,
        icon: '📄'
      });

      return {
        success: true,
        filename,
        size: response.data.size
      };

    } catch (error) {
      console.error('❌ [PDF API] Error generating PDF report:', error);
      
      // Dismiss any loading toasts
      toast.dismiss();
      
      // Handle different error types
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || 'Server error occurred';
        const errorDetails = error.response.data?.error || 'No additional details';
        
        console.error('❌ [PDF API] Server error response', {
          status,
          message,
          errorDetails,
          originalClientId: clientId,
          stringClientId: stringClientId,
          responseData: error.response.data
        });
        
        if (status === 401) {
          toast.error('Authentication required. Please login again.');
          // Redirect to login
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (status === 404) {
          toast.error(`Client not found: ${message}`);
          console.error('Client not found details:', errorDetails);
        } else if (status === 400) {
          toast.error(`Invalid request: ${message}`);
          console.error('Bad request details:', errorDetails);
        } else if (status === 500) {
          toast.error(`PDF generation failed: ${message}`);
          console.error('Server error details:', errorDetails);
        } else {
          toast.error(`PDF generation failed: ${message}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        toast.error('PDF generation timed out. Please try again.');
      } else if (error.message === 'Network Error') {
        // Network error
        toast.error('Network error. Please check your connection and try again.');
      } else {
        // Other errors
        toast.error('PDF generation failed. Please try again.');
      }

      // Update progress if callback provided
      if (onProgress) {
        onProgress(0, 'Generation failed');
      }

      return {
        success: false,
        error: error.message,
        details: error.response?.data || null
      };
    }
  }

  /**
   * Check PDF generation service health
   * @returns {Promise} - Health check promise
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/pdf/health`, {
        timeout: 10000
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ [PDF API] Health check failed:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get PDF generation status for a client
   * @param {String} clientId - Client ID
   * @returns {Promise} - Status promise
   */
  async getGenerationStatus(clientId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(
        `${this.baseURL}/pdf/status/${clientId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        }
      );

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ [PDF API] Status check failed:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const pdfAPI = new PDFAPI();

export default pdfAPI;
