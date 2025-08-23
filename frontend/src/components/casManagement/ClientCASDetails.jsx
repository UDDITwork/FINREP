// Location: frontend/src/components/casManagement/ClientCASDetails.jsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, TrendingUp, Building2, Calendar, User, Mail, Phone, MapPin } from 'lucide-react';
import casManagementAPI from '../../services/casManagementAPI';
import toast from 'react-hot-toast';

const ClientCASDetails = ({ client, onBack }) => {
  const [casDetails, setCasDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 ClientCASDetails: Client data received:', client);
    loadClientCASDetails();
  }, [client.clientId]);

  const loadClientCASDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('📞 Fetching CAS details for client ID:', client.clientId);
      const response = await casManagementAPI.getClientCASDetails(client.clientId);
      
      console.log('✅ CAS details response:', response);
      setCasDetails(response.data);

      console.log('✅ Client CAS details loaded successfully');
    } catch (error) {
      console.error('❌ Error loading client CAS details:', error);
      setError(error.message || 'Failed to load client CAS details');
      toast.error('Failed to load client CAS details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 p-4 rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading CAS Details</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadClientCASDetails}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!casDetails) {
    return (
      <div className="p-6 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No CAS Details Available</h3>
        <p className="text-gray-600">Unable to load detailed CAS information for this client.</p>
      </div>
    );
  }

  // Debug: Log the casDetails structure
  console.log('🔍 Rendering CAS details:', casDetails);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              CAS Details - {casDetails.clientInfo?.name || `${client.firstName} ${client.lastName}`}
            </h2>
            <p className="text-sm text-gray-600">{casDetails.clientInfo?.email || client.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Info & File Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Client Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Client Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{casDetails.investor?.email || client.email || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{casDetails.investor?.mobile || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{casDetails.investor?.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* File Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-green-600" />
              File Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">File Name</p>
                <p className="text-sm font-medium text-gray-900">{casDetails.casFile?.fileName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">File Size</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatFileSize(casDetails.casFile?.fileSize || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Upload Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(casDetails.casFile?.uploadDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Parsed</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(casDetails.casFile?.lastParsedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  casDetails.casFile?.status === 'parsed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {casDetails.casFile?.status || 'unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Portfolio Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
              Portfolio Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-500">Total Portfolio Value</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(casDetails.portfolio?.totalValue || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500">Demat Accounts</p>
                <p className="text-xl font-bold text-blue-600">
                  {casDetails.accounts?.demat?.count || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(casDetails.accounts?.demat?.totalValue || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500">Mutual Fund Folios</p>
                <p className="text-xl font-bold text-green-600">
                  {casDetails.accounts?.mutualFunds?.count || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(casDetails.accounts?.mutualFunds?.totalValue || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demat Accounts */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                Demat Accounts ({casDetails.accounts?.demat?.count || 0})
              </h4>
              {casDetails.accounts?.demat?.accounts && casDetails.accounts.demat.accounts.length > 0 ? (
                <div className="space-y-3">
                  {casDetails.accounts.demat.accounts.slice(0, 3).map((account, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{account.dp_name || 'Unknown DP'}</p>
                      <p className="text-xs text-gray-500">BO ID: {account.bo_id || 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        Value: {formatCurrency(account.value || 0)}
                      </p>
                    </div>
                  ))}
                  {casDetails.accounts.demat.accounts.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{casDetails.accounts.demat.accounts.length - 3} more accounts
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No demat accounts found</p>
              )}
            </div>

            {/* Mutual Funds */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-green-600" />
                Mutual Funds ({casDetails.accounts?.mutualFunds?.count || 0})
              </h4>
              {casDetails.accounts?.mutualFunds?.folios && casDetails.accounts.mutualFunds.folios.length > 0 ? (
                <div className="space-y-3">
                  {casDetails.accounts.mutualFunds.folios.slice(0, 3).map((folio, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{folio.amc || 'Unknown AMC'}</p>
                      <p className="text-xs text-gray-500">Folio: {folio.folio_number || 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        Value: {formatCurrency(folio.value || 0)}
                      </p>
                    </div>
                  ))}
                  {casDetails.accounts.mutualFunds.folios.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{casDetails.accounts.mutualFunds.folios.length - 3} more folios
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No mutual fund folios found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCASDetails;
