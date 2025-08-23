/**
 * FILE LOCATION: frontend/src/components/kyc/KYCStatus.jsx
 * 
 * PURPOSE: Status display and action management component for KYC verification
 * 
 * FUNCTIONALITY:
 * - Displays detailed KYC verification status for selected client
 * - Shows individual Aadhar and PAN verification progress
 * - Provides action buttons for workflow initiation and reset
 * - Implements visual status indicators with color coding
 * - Handles KYC reset functionality for failed verifications
 * 
 * STATUS DISPLAY:
 * - Overall KYC verification status with progress indicators
 * - Individual document status (Aadhar, PAN) with icons
 * - Verification attempt count and last attempt timestamp
 * - Color-coded status indicators for quick visual assessment
 * 
 * ACTION BUTTONS:
 * - "Start KYC Verification": Initiates new verification workflow
 * - "Retry KYC Verification": Restarts failed verification process
 * - "Reset KYC Status": Clears verification status for retry
 * - Status-dependent button visibility and functionality
 * 
 * DATA FLOW:
 * - Receives: Client data and KYC status from parent component
 * - Processes: Status display logic and action button states
 * - Sends: Action requests via callback functions to parent
 * - Displays: Real-time status updates and progress information
 * 
 * COMPONENT INTEGRATION:
 * - Receives props: client (object), kycStatus (object), onStartWorkflow (function)
 * - Sends: Action requests via callback functions
 * - Integrates: With parent KYCVerification component
 * 
 * STATUS MAPPING:
 * - not_started: Gray indicator with "Not Started" text
 * - requested: Yellow indicator with "Requested" text
 * - in_progress: Blue indicator with "In Progress" text
 * - verified: Green indicator with "Verified" text
 * - failed: Red indicator with "Failed" text
 * 
 * VISUAL DESIGN:
 * - Progress bars for overall completion status
 * - Icon-based status indicators for each document type
 * - Color-coded status representation for accessibility
 * - Responsive layout for different screen sizes
 * 
 * USER INTERACTIONS:
 * - Click action buttons to initiate KYC operations
 * - View detailed status information for each document
 * - Monitor verification progress and completion status
 * - Reset verification status when needed
 */

import React from 'react';
import { Shield, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, User, Calendar, FileText } from 'lucide-react';

const KYCStatus = ({ client, kycStatus, onStartWorkflow, onResetKYC }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
      case 'pending':
      case 'requested':
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
      case 'requested':
      case 'in_progress':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'failed':
        return 'Failed';
      case 'pending':
        return 'Pending';
      case 'requested':
        return 'Requested';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'pending':
      case 'requested':
      case 'in_progress':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getProgressPercentage = () => {
    if (!kycStatus) return 0;
    
    let completed = 0;
    let total = 0;
    
    if (kycStatus.aadharStatus) {
      total++;
      if (kycStatus.aadharStatus === 'verified') completed++;
    }
    if (kycStatus.panStatus) {
      total++;
      if (kycStatus.panStatus === 'verified') completed++;
    }
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className="space-y-8">
      {/* Enhanced Client Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {client?.firstName} {client?.lastName}
            </h2>
            <p className="text-gray-600 mt-1">{client?.email}</p>
            {client?.phoneNumber && (
              <p className="text-gray-600 mt-1">{client.phoneNumber}</p>
            )}
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusBgColor(kycStatus?.overallStatus)}`}>
            {getStatusIcon(kycStatus?.overallStatus)}
            <span className={getStatusColor(kycStatus?.overallStatus)}>
              {getStatusText(kycStatus?.overallStatus)}
            </span>
          </div>
        </div>
      </div>

      {/* Overall Progress Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall KYC Progress</h3>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Verification Progress</span>
            <span className="text-sm font-medium text-blue-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-blue-600 mb-1">{progressPercentage}%</div>
            <div className="text-sm font-medium text-blue-700">Complete</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {kycStatus?.verificationAttempts || 0}
            </div>
            <div className="text-sm font-medium text-gray-700">Attempts</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {kycStatus?.lastAttemptDate ? 'Yes' : 'No'}
            </div>
            <div className="text-sm font-medium text-green-700">Last Attempt</div>
          </div>
        </div>
      </div>

      {/* Document Status Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Document Verification Status</h3>
        
        <div className="space-y-6">
          {/* Aadhar Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Aadhar Card</h4>
                <p className="text-sm text-gray-600">Identity verification document</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusBgColor(kycStatus?.aadharStatus)}`}>
              {getStatusIcon(kycStatus?.aadharStatus)}
              <span className={getStatusColor(kycStatus?.aadharStatus)}>
                {getStatusText(kycStatus?.aadharStatus)}
              </span>
            </div>
          </div>

          {/* PAN Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">PAN Card</h4>
                <p className="text-sm text-gray-600">Tax identification document</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusBgColor(kycStatus?.panStatus)}`}>
              {getStatusIcon(kycStatus?.panStatus)}
              <span className={getStatusColor(kycStatus?.panStatus)}>
                {getStatusText(kycStatus?.panStatus)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Attempt Information */}
      {kycStatus?.lastAttemptDate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Verification Attempt</h3>
          <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <Calendar className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Last attempt: {new Date(kycStatus.lastAttemptDate).toLocaleDateString()}
              </p>
              {kycStatus.lastAttemptResult && (
                <p className="text-sm text-yellow-700 mt-1">
                  Result: {kycStatus.lastAttemptResult}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Actions</h3>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Start/Retry KYC Button */}
          {kycStatus?.overallStatus !== 'verified' && (
            <button
              onClick={onStartWorkflow}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              <Shield className="h-5 w-5" />
              <span className="whitespace-nowrap">
                {kycStatus?.overallStatus === 'failed' ? 'Retry KYC Verification' : 'Start KYC Verification'}
              </span>
            </button>
          )}

          {/* Reset KYC Button */}
          {kycStatus?.overallStatus === 'failed' && (
            <button
              onClick={onResetKYC}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
            >
              <RefreshCw className="h-5 w-5" />
              <span className="whitespace-nowrap">Reset KYC Status</span>
            </button>
          )}

          {/* View Details Button */}
          {kycStatus?.overallStatus === 'verified' && (
            <button
              onClick={onStartWorkflow}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
            >
              <CheckCircle className="h-5 w-5" />
              <span className="whitespace-nowrap">View Verification Details</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCStatus;
