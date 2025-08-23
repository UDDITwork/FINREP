/**
 * FILE LOCATION: frontend/src/components/kyc/KYCWorkflow.jsx
 * 
 * PURPOSE: Digio Web SDK integration component for KYC verification workflow
 * 
 * FUNCTIONALITY:
 * - Dynamically loads Digio SDK from production CDN
 * - Initializes Digio SDK with production environment configuration
 * - Manages KYC workflow state transitions and progress tracking
 * - Handles Digio SDK callbacks for verification completion
 * - Provides user interface for workflow initiation and monitoring
 * 
 * DIGIO SDK INTEGRATION:
 * - Loads SDK from: https://app.digio.in/sdk/v11/digio.js
 * - Environment: 'production' for live verification
 * - Template: Uses 'SURENDRA' workflow template
 * - Authentication: Uses access token from backend API
 * 
 * WORKFLOW STATES:
 * - idle: Ready to start verification
 * - starting: Initializing workflow
 * - active: Verification in progress
 * - completed: Verification successful
 * - failed: Verification failed
 * 
 * DATA FLOW:
 * - Receives: Client data, access token, Digio request ID from parent
 * - Sends: Workflow status updates via onStatusUpdate callback
 * - Processes: Digio SDK responses and error states
 * - Displays: Real-time workflow progress and status
 * 
 * API INTERACTIONS:
 * - Calls kycService.startKYCWorkflow() to initiate backend workflow
 * - Receives: digioRequestId and accessToken from backend
 * - Submits: Workflow to Digio using SDK.submit() method
 * - Handles: SDK callback responses for status updates
 * 
 * SDK INITIALIZATION:
 * - Creates Digio instance with production environment
 * - Configures callback function for response handling
 * - Sets up theme and branding options
 * - Initializes popup/iframe for verification interface
 * 
 * ERROR HANDLING:
 * - SDK loading failures with user-friendly messages
 * - Workflow initiation errors with retry options
 * - Digio callback error processing
 * - Graceful degradation for service failures
 * 
 * USER EXPERIENCE:
 * - Clear status indicators for each workflow state
 * - Progress tracking with visual feedback
 * - Error messages with actionable guidance
 * - Automatic page refresh after successful completion
 */

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, AlertCircle, Play, RefreshCw, X } from 'lucide-react';
import kycService from '../../services/kycService';

const KYCWorkflow = ({ client, onStatusUpdate, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [digioInstance, setDigioInstance] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState('idle'); // idle, starting, active, completed, failed

  useEffect(() => {
    // Load Digio SDK from the correct production frontend URL
    const loadDigioSDK = () => {
      const script = document.createElement('script');
      script.src = 'https://app.digio.in/sdk/v11/digio.js';
      script.onload = () => {
        console.log('Digio SDK loaded successfully');
      };
      script.onerror = () => {
        setError('Failed to load Digio SDK');
      };
      document.head.appendChild(script);
    };

    if (!window.Digio) {
      loadDigioSDK();
    }
  }, []);

  const initializeDigio = (accessToken) => {
    try {
      const options = {
        environment: 'production',
        callback: handleDigioCallback,
        logo: 'https://your-logo-url.com/logo.png', // Replace with your logo
        theme: {
          primaryColor: '#2979BF',
          secondaryColor: '#FFFFFF'
        }
      };

      const digio = new window.Digio(options);
      digio.init();
      setDigioInstance(digio);
      return digio;
    } catch (error) {
      console.error('Error initializing Digio:', error);
      setError('Failed to initialize Digio SDK');
      return null;
    }
  };

  const handleDigioCallback = (response) => {
    console.log('Digio callback response:', response);
    
    if (response.status === 'success') {
      setWorkflowStatus('completed');
      onStatusUpdate('completed', response);
      
      // Auto-refresh page after successful completion
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (response.status === 'failure') {
      setWorkflowStatus('failed');
      setError(response.message || 'Verification failed');
      onStatusUpdate('failed', response);
    } else if (response.status === 'cancelled') {
      setWorkflowStatus('idle');
      onStatusUpdate('cancelled', response);
    }
  };

  const startWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);
      setWorkflowStatus('starting');

      // Start backend workflow
      const response = await kycService.startKYCWorkflow(client._id);
      
      if (response.success) {
        const { digioRequestId, accessToken } = response.data;
        
        // Initialize Digio SDK
        const digio = initializeDigio(accessToken);
        if (!digio) return;

        setWorkflowStatus('active');
        onStatusUpdate('active', { digioRequestId });

        // Submit workflow to Digio
        digio.submit({
          requestId: digioRequestId,
          accessToken: accessToken
        });

      } else {
        setError(response.message || 'Failed to start KYC workflow');
        setWorkflowStatus('idle');
        onStatusUpdate('failed', { error: response.message });
      }
    } catch (error) {
      console.error('Error starting workflow:', error);
      setError('Failed to start KYC workflow. Please try again.');
      setWorkflowStatus('idle');
      onStatusUpdate('failed', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const retryWorkflow = () => {
    setError(null);
    setWorkflowStatus('idle');
    startWorkflow();
  };

  const getStatusDisplay = () => {
    switch (workflowStatus) {
      case 'idle':
        return {
          icon: <Shield className="h-8 w-8 text-blue-500" />,
          title: 'Ready to Start KYC Verification',
          description: 'Click the button below to begin the KYC verification process for this client.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'starting':
        return {
          icon: <Clock className="h-8 w-8 text-yellow-500 animate-pulse" />,
          title: 'Initializing Verification',
          description: 'Setting up the KYC verification workflow. Please wait...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'active':
        return {
          icon: <Clock className="h-8 w-8 text-blue-500 animate-spin" />,
          title: 'Verification in Progress',
          description: 'The KYC verification is currently active. Please complete the verification in the popup window.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: 'Verification Completed Successfully',
          description: 'KYC verification has been completed successfully. The page will refresh automatically.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'failed':
        return {
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          title: 'Verification Failed',
          description: error || 'The KYC verification process failed. Please try again.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <AlertCircle className="h-8 w-8 text-gray-500" />,
          title: 'Unknown Status',
          description: 'The verification status is unknown. Please try again.',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">KYC Verification Workflow</h2>
              <p className="text-sm text-gray-600">Client: {client?.firstName} {client?.lastName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Enhanced Content */}
        <div className="p-6 space-y-6">
          {/* Status Display */}
          <div className={`${statusDisplay.bgColor} ${statusDisplay.borderColor} border rounded-xl p-6`}>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {statusDisplay.icon}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${statusDisplay.color} mb-2`}>
                  {statusDisplay.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {statusDisplay.description}
                </p>
              </div>
            </div>
          </div>

          {/* Client Information Card */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Client Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                <p className="text-gray-900 font-medium">
                  {client?.firstName} {client?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                <p className="text-gray-900 font-medium">{client?.email}</p>
              </div>
              {client?.phoneNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                  <p className="text-gray-900 font-medium">{client.phoneNumber}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Client ID</p>
                <p className="text-gray-900 font-mono text-sm">{client?._id}</p>
              </div>
            </div>
          </div>

          {/* Workflow Instructions */}
          {workflowStatus === 'idle' && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">How it works</h4>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>Click "Start KYC Verification" to begin the process</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>A popup window will open with the Digio verification interface</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>Follow the on-screen instructions to complete verification</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <p>Status will update automatically upon completion</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-2">Error occurred</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {workflowStatus === 'idle' && (
              <button
                onClick={startWorkflow}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-5 w-5" />
                <span className="whitespace-nowrap">
                  {loading ? 'Starting...' : 'Start KYC Verification'}
                </span>
              </button>
            )}

            {workflowStatus === 'failed' && (
              <>
                <button
                  onClick={retryWorkflow}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span className="whitespace-nowrap">Retry Verification</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                  <span className="whitespace-nowrap">Close</span>
                </button>
              </>
            )}

            {workflowStatus === 'completed' && (
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
              >
                <CheckCircle className="h-5 w-5" />
                <span className="whitespace-nowrap">Close</span>
              </button>
            )}

            {workflowStatus === 'active' && (
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                <X className="h-5 w-5" />
                <span className="whitespace-nowrap">Close</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCWorkflow;
