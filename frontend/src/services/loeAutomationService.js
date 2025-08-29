/**
 * FILE LOCATION: frontend/src/services/loeAutomationService.js
 * 
 * PURPOSE: Frontend service for LOE Automation system
 * 
 * FUNCTIONALITY: API calls for managing client LOE status
 */

import api from './api';

// LOE Automation API functions
export const loeAutomationAPI = {
  // Get all clients with LOE status for the logged-in advisor
  getClientsWithLOEStatus: async () => {
    console.log('📋 [LOE Automation] Fetching clients with LOE status...');
    
    const startTime = Date.now();
    const response = await api.get('/loe-automation/clients');
    const duration = Date.now() - startTime;
    
    console.log('✅ [LOE Automation] Clients with LOE status fetched:', {
      totalClients: response.data.data?.totalClients || 0,
      clientsWithLOE: response.data.data?.clientsWithLOE || 0,
      duration: `${duration}ms`,
      success: response.data.success
    });
    
    return response.data;
  },

  // Get detailed LOE information for a specific client
  getClientLOEDetails: async (clientId) => {
    console.log('🔍 [LOE Automation] Fetching client LOE details:', { clientId });
    
    const startTime = Date.now();
    const response = await api.get(`/loe-automation/clients/${clientId}/loe-details`);
    const duration = Date.now() - startTime;
    
    console.log('✅ [LOE Automation] Client LOE details fetched:', {
      clientId,
      clientName: response.data.data?.client?.clientName,
      totalLOEs: response.data.data?.totalLOEs || 0,
      duration: `${duration}ms`,
      success: response.data.success
    });
    
    return response.data;
  },

  // Create a new LOE for a client (Simplified - No meetingId required)
  createLOEForClient: async (clientId, customNotes = '') => {
    console.log('📄 [LOE Automation] Creating LOE for client:', {
      clientId,
      hasCustomNotes: !!customNotes
    });
    
    const startTime = Date.now();
    const response = await api.post(`/loe-automation/clients/${clientId}/create-loe`, {
      customNotes
    });
    const duration = Date.now() - startTime;
    
    console.log('✅ [LOE Automation] LOE created successfully:', {
      clientId,
      loeId: response.data.data?.loeId,
      status: response.data.data?.status,
      accessToken: response.data.data?.accessToken,
      duration: `${duration}ms`,
      success: response.data.success
    });
    
    return response.data;
  },

  // Get LOE data for client signing page
  getClientLOEData: async (accessToken) => {
    console.log('🔍 [LOE Automation] Fetching client LOE data:', { accessToken });
    
    const response = await fetch(`/api/loe-automation/client/${accessToken}`);
    const data = await response.json();
    
    console.log('✅ [LOE Automation] Client LOE data fetched:', {
      success: data.success,
      hasData: !!data.data
    });
    
    return data;
  },

  // Submit client signature
  submitClientSignature: async (accessToken, signature, ipAddress, userAgent) => {
    console.log('📝 [LOE Automation] Submitting client signature:', { accessToken });
    
    const response = await fetch(`/api/loe-automation/client/${accessToken}/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signature,
        ipAddress,
        userAgent
      })
    });
    
    const data = await response.json();
    
    console.log('✅ [LOE Automation] Client signature submitted:', {
      success: data.success,
      hasPdfUrl: !!data.data?.pdfUrl
    });
    
    return data;
  },

  // Check LOE Automation system health
  checkHealth: async () => {
    console.log('🏥 [LOE Automation] Checking system health...');
    
    const response = await api.get('/loe-automation/health');
    
    console.log('✅ [LOE Automation] Health check completed:', {
      status: response.data.success ? 'healthy' : 'unhealthy',
      message: response.data.message,
      version: response.data.version,
      features: response.data.features
    });
    
    return response.data;
  },

  // Download/View LOE PDF file with Cloudinary fallback
  downloadLOEPDF: async (filename) => {
    console.log('📄 [LOE Automation] Downloading LOE PDF:', { filename });
    
    try {
      // First try to get the PDF via API (which will redirect to Cloudinary if available)
      const response = await api.get(`/loe-automation/pdf/${filename}`, {
        responseType: 'blob',
        maxRedirects: 5 // Allow redirects to Cloudinary
      });
      
      // Create blob URL for viewing/downloading
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(url);
      
      console.log('✅ [LOE Automation] LOE PDF downloaded successfully:', { filename });
      return { success: true, filename };
    } catch (error) {
      console.error('❌ [LOE Automation] Error downloading LOE PDF:', error);
      throw error;
    }
  },

  // Get PDF URL for viewing (prefer Cloudinary, fallback to local)
  getLOEPDFUrl: (filename, cloudinaryUrl = null) => {
    // Use Cloudinary URL if available (primary)
    if (cloudinaryUrl && cloudinaryUrl.startsWith('http')) {
      return cloudinaryUrl;
    }
    
    // Fallback to local storage via API route
    // This ensures proper authentication and error handling
    return `/api/loe-automation/pdf/${filename}`;
  }
};

// Utility functions for LOE status
export const loeStatusUtils = {
  // Get status color based on LOE status
  getStatusColor: (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'viewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  // Get status icon based on LOE status
  getStatusIcon: (status) => {
    switch (status) {
      case 'draft':
        return '📝';
      case 'sent':
        return '📤';
      case 'viewed':
        return '👁️';
      case 'signed':
        return '✅';
      case 'expired':
        return '⏰';
      default:
        return '📄';
    }
  },

  // Format date for display
  formatDate: (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Check if LOE is expired
  isExpired: (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  },

  // Get LOE status text
  getStatusText: (status) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'sent':
        return 'Sent to Client';
      case 'viewed':
        return 'Viewed by Client';
      case 'signed':
        return 'Signed by Client';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  }
};

export default loeAutomationAPI;
