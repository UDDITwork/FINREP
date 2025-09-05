/**
 * FILE LOCATION: frontend/src/components/kyc/KYCVerification.jsx
 * 
 * PURPOSE: Main component for KYC verification interface and workflow management
 * 
Loading states prevent multiple simultaneous operations
 */

import React, { useState, useEffect } from 'react';
import { Shield, Users, Search, Filter, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import ClientList from './ClientList';
import KYCStatus from './KYCStatus';
import KYCWorkflow from './KYCWorkflow';
import kycService from '../../services/kycService';

const KYCVerification = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState('client-selection'); // client-selection, workflow, status
  const [showWorkflow, setShowWorkflow] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await kycService.getClientsForKYC();
      if (response.success) {
        setClients(response.data);
      } else {
        setError('Failed to load clients');
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = async (client) => {
    setSelectedClient(client);
    setActiveStep('status');
    
    try {
      const response = await kycService.getKYCStatus(client._id);
      if (response.success) {
        setKycStatus(response.data.kycStatus);
      } else {
        setError('Failed to load KYC status');
      }
    } catch (error) {
      console.error('Error loading KYC status:', error);
      setError('Failed to load KYC status');
    }
  };

  const handleStartWorkflow = () => {
    setShowWorkflow(true);
    setActiveStep('workflow');
  };

  const handleWorkflowStatusUpdate = (status, data) => {
    console.log('Workflow status update:', status, data);
    
    if (status === 'completed') {
      // Refresh KYC status after successful completion
      setTimeout(() => {
        handleClientSelect(selectedClient);
      }, 1000);
    }
  };

  const handleCloseWorkflow = () => {
    setShowWorkflow(false);
    setActiveStep('status');
  };

  const handleBackToClientList = () => {
    setSelectedClient(null);
    setKycStatus(null);
    setActiveStep('client-selection');
    setError(null);
  };

  const handleResetKYC = async () => {
    if (!selectedClient) return;
    
    try {
      const response = await kycService.resetKYCStatus(selectedClient._id);
      if (response.success) {
        // Refresh KYC status
        handleClientSelect(selectedClient);
      } else {
        setError('Failed to reset KYC status');
      }
    } catch (error) {
      console.error('Error resetting KYC status:', error);
      setError('Failed to reset KYC status');
    }
  };

  const handleRetry = () => {
    setError(null);
    loadClients();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KYC verification dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Clients</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          >
            <RefreshCw className="h-5 w-5" />
            <span className="whitespace-nowrap">Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">KYC Verification System</h1>
            </div>
            
            {/* Navigation Breadcrumb */}
            {activeStep !== 'client-selection' && (
              <button
                onClick={handleBackToClientList}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="whitespace-nowrap">Back to Client List</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeStep === 'client-selection' && (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Client KYC Verification</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Select a client from the list below to begin or continue their KYC verification process. 
                The system will guide you through document verification using secure Digio integration.
              </p>
            </div>

            {/* Client List */}
            <ClientList 
              clients={clients} 
              onClientSelect={handleClientSelect} 
            />
          </div>
        )}

        {activeStep === 'status' && selectedClient && (
          <div className="space-y-6">
            {/* Client Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    KYC Status for {selectedClient.firstName} {selectedClient.lastName}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Review current verification status and take necessary actions
                  </p>
                </div>
                <button
                  onClick={handleBackToClientList}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="whitespace-nowrap">Back to List</span>
                </button>
              </div>
            </div>

            {/* KYC Status Component */}
            <KYCStatus
              client={selectedClient}
              kycStatus={kycStatus}
              onStartWorkflow={handleStartWorkflow}
              onResetKYC={handleResetKYC}
            />
          </div>
        )}

        {activeStep === 'workflow' && showWorkflow && selectedClient && (
          <KYCWorkflow
            client={selectedClient}
            onStatusUpdate={handleWorkflowStatusUpdate}
            onClose={handleCloseWorkflow}
          />
        )}
      </div>

      {/* Enhanced Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              KYC verification powered by Digio Web SDK • 
              Secure document verification system • 
              Real-time status updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCVerification;
