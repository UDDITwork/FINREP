/**
 * FILE LOCATION: frontend/src/components/loeAutomation/LOEAutomationDashboard.jsx
 * 
 * PURPOSE: Main LOE Automation dashboard component
 * 
 * FUNCTIONALITY: Display clients with LOE status, view LOE details, create new LOEs
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  Plus, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { loeAutomationAPI, loeStatusUtils } from '../../services/loeAutomationService';
import CreateLOEModal from './CreateLOEModal';
import LOEPDFViewer from './LOEPDFViewer';

const LOEAutomationDashboard = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showLOEDetails, setShowLOEDetails] = useState(false);
  const [loeDetails, setLoeDetails] = useState(null);
  const [loadingLOEDetails, setLoadingLOEDetails] = useState(false);
  const [showCreateLOEModal, setShowCreateLOEModal] = useState(false);
  const [clientForLOE, setClientForLOE] = useState(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedLOE, setSelectedLOE] = useState(null);

  // Fetch clients with LOE status on component mount
  useEffect(() => {
    fetchClientsWithLOEStatus();
  }, []);

  const fetchClientsWithLOEStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [LOE Automation] Fetching clients...');
      const response = await loeAutomationAPI.getClientsWithLOEStatus();
      
      if (response.success) {
        setClients(response.data.clients);
        console.log('✅ [LOE Automation] Clients fetched successfully:', {
          totalClients: response.data.totalClients,
          clientsWithLOE: response.data.clientsWithLOE
        });
      } else {
        throw new Error(response.error || 'Failed to fetch clients');
      }
    } catch (error) {
      console.error('❌ [LOE Automation] Error fetching clients:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientLOEDetails = async (clientId) => {
    try {
      setLoadingLOEDetails(true);
      setError(null);
      
      console.log('🔍 [LOE Automation] Fetching LOE details for client:', clientId);
      const response = await loeAutomationAPI.getClientLOEDetails(clientId);
      
      if (response.success) {
        setLoeDetails(response.data);
        setShowLOEDetails(true);
        console.log('✅ [LOE Automation] LOE details fetched successfully');
      } else {
        throw new Error(response.error || 'Failed to fetch LOE details');
      }
    } catch (error) {
      console.error('❌ [LOE Automation] Error fetching LOE details:', error);
      setError(error.message);
    } finally {
      setLoadingLOEDetails(false);
    }
  };

  const handleViewLOE = (client) => {
    setSelectedClient(client);
    // Find the LOE record for this client
    if (client.loeStatus && client.loeStatus.loeId) {
      // Fetch LOE details and show PDF viewer
      fetchClientLOEDetailsForViewing(client._id);
    } else {
      // Show details modal as fallback
      fetchClientLOEDetails(client._id);
    }
  };

  const fetchClientLOEDetailsForViewing = async (clientId) => {
    try {
      setLoadingLOEDetails(true);
      setError(null);
      
      console.log('🔍 [LOE Automation] Fetching LOE details for viewing:', clientId);
      const response = await loeAutomationAPI.getClientLOEDetails(clientId);
      
      if (response.success && response.data.loeRecords.length > 0) {
        // Find the most recent signed LOE
        const signedLOE = response.data.loeRecords.find(loe => 
          loe.status === 'signed' && loe.signedPdfUrl
        );
        
        if (signedLOE) {
          setSelectedLOE(signedLOE);
          setShowPDFViewer(true);
          console.log('✅ [LOE Automation] LOE found for viewing:', signedLOE._id);
        } else {
          // No signed LOE found, show details modal
          setLoeDetails(response.data);
          setShowLOEDetails(true);
          console.log('⚠️ [LOE Automation] No signed LOE found, showing details');
        }
      } else {
        throw new Error(response.error || 'Failed to fetch LOE details');
      }
    } catch (error) {
      console.error('❌ [LOE Automation] Error fetching LOE details for viewing:', error);
      setError(error.message);
    } finally {
      setLoadingLOEDetails(false);
    }
  };

  const handleCreateLOE = (client) => {
    setClientForLOE(client);
    setShowCreateLOEModal(true);
  };

  const handleLOECreated = (loeData) => {
    // Refresh the clients list after LOE creation
    fetchClientsWithLOEStatus();
    setShowCreateLOEModal(false);
    setClientForLOE(null);
  };

  const handleRefresh = () => {
    fetchClientsWithLOEStatus();
  };

  // Filter clients based on search term and status filter
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'with-loe' && client.hasLOE) ||
                         (statusFilter === 'without-loe' && !client.hasLOE);
    
    return matchesSearch && matchesStatus;
  });

  // Get statistics
  const stats = {
    totalClients: clients.length,
    clientsWithLOE: clients.filter(client => client.hasLOE).length,
    clientsWithoutLOE: clients.filter(client => !client.hasLOE).length,
    signedLOEs: clients.filter(client => client.loeStatus?.status === 'signed').length,
    pendingLOEs: clients.filter(client => 
      client.loeStatus?.status && ['draft', 'sent', 'viewed'].includes(client.loeStatus.status)
    ).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading LOE Automation Dashboard...</h2>
          <p className="text-gray-500">Fetching clients and LOE status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700">Error Loading Dashboard</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileText className="w-8 h-8 text-blue-600 mr-3" />
                LOE Automation Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage Letters of Engagement for all your clients in one place
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With LOE</p>
                <p className="text-2xl font-bold text-gray-900">{stats.clientsWithLOE}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Plus className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Without LOE</p>
                <p className="text-2xl font-bold text-gray-900">{stats.clientsWithoutLOE}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Signed LOEs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.signedLOEs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending LOEs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingLOEs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Filter className="w-5 h-5 text-gray-400 mr-2" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Clients</option>
                  <option value="with-loe">With LOE</option>
                  <option value="without-loe">Without LOE</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Clients ({filteredClients.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LOE Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">No clients found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {client.clientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {client._id.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{client.email}</div>
                          <div className="text-sm text-gray-500">{client.phoneNumber}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {client.hasLOE ? (
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loeStatusUtils.getStatusColor(client.loeStatus.status)}`}>
                              {loeStatusUtils.getStatusIcon(client.loeStatus.status)}
                              <span className="ml-1">{loeStatusUtils.getStatusText(client.loeStatus.status)}</span>
                            </span>
                            {loeStatusUtils.isExpired(client.loeStatus.expiresAt) && (
                              <span className="ml-2 text-xs text-red-600">(Expired)</span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Plus className="w-3 h-3 mr-1" />
                            No LOE
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.hasLOE ? (
                          loeStatusUtils.formatDate(client.loeStatus.updatedAt || client.loeStatus.createdAt)
                        ) : (
                          'Never'
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {client.hasLOE ? (
                            <button
                              onClick={() => handleViewLOE(client)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View LOE
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCreateLOE(client)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Create LOE
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* LOE Details Modal */}
      {showLOEDetails && loeDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  LOE Details - {loeDetails.client.clientName}
                </h3>
                <button
                  onClick={() => setShowLOEDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {loadingLOEDetails ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading LOE details...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client Name</label>
                      <p className="mt-1 text-sm text-gray-900">{loeDetails.client.clientName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{loeDetails.client.email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">LOE Records ({loeDetails.totalLOEs})</label>
                    {loeDetails.loeRecords.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {loeDetails.loeRecords.map((loe, index) => (
                          <div key={loe._id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loeStatusUtils.getStatusColor(loe.status)}`}>
                                  {loeStatusUtils.getStatusIcon(loe.status)}
                                  <span className="ml-1">{loeStatusUtils.getStatusText(loe.status)}</span>
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  Created: {loeStatusUtils.formatDate(loe.createdAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">ID: {loe._id.substring(0, 8)}...</p>
                                {loe.accessToken && (
                                  <button
                                    onClick={() => {
                                      setSelectedLOE(loe);
                                      setShowPDFViewer(true);
                                    }}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View LOE
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">No LOE records found for this client.</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowLOEDetails(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create LOE Modal */}
      {showCreateLOEModal && clientForLOE && (
        <CreateLOEModal
          isOpen={showCreateLOEModal}
          onClose={() => {
            setShowCreateLOEModal(false);
            setClientForLOE(null);
          }}
          client={clientForLOE}
          onLOECreated={handleLOECreated}
        />
      )}

      {/* LOE PDF Viewer */}
      {showPDFViewer && selectedLOE && (
        <LOEPDFViewer
          isOpen={showPDFViewer}
          onClose={() => setShowPDFViewer(false)}
          loeData={selectedLOE}
          clientName={selectedClient?.clientName || 'Unknown Client'}
        />
      )}
    </div>
  );
};

export default LOEAutomationDashboard;
