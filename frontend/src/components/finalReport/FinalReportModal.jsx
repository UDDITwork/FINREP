// File: frontend/src/components/finalReport/FinalReportModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Search, Download, Loader2, AlertCircle, CheckCircle, FileText, Users, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ComprehensivePDFGenerator from './ComprehensivePDFGenerator';

const FinalReportModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);

  // Fetch clients when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchClients();
    }
  }, [isOpen, user?.id]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/final-report/clients/${user.id}`);
      
      if (response.data.success) {
        setClients(response.data.clients);
      } else {
        setError('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError(error.response?.data?.error || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setShowPDFGenerator(true);
  };

  const handleBackToClientList = () => {
    setSelectedClient(null);
    setShowPDFGenerator(false);
  };

  const filteredClients = clients.filter(client =>
    client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'invited': { color: 'bg-yellow-100 text-yellow-800', text: 'Invited' },
      'onboarding': { color: 'bg-blue-100 text-blue-800', text: 'Onboarding' },
      'active': { color: 'bg-green-100 text-green-800', text: 'Active' },
      'inactive': { color: 'bg-gray-100 text-gray-800', text: 'Inactive' },
      'suspended': { color: 'bg-red-100 text-red-800', text: 'Suspended' }
    };

    const config = statusConfig[status] || statusConfig['inactive'];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (!isOpen) return null;

  if (showPDFGenerator && selectedClient) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBackToClientList}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Generate Final Report
                </h2>
                <p className="text-sm text-gray-600">
                  Client: {selectedClient.firstName} {selectedClient.lastName}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <ComprehensivePDFGenerator 
              client={selectedClient} 
              onBack={handleBackToClientList}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Final Report Generator
              </h2>
              <p className="text-sm text-gray-600">
                Generate comprehensive PDF reports for your clients
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading clients...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Clients</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchClients}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Client List */}
          {!loading && !error && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Select Client for Report Generation
                </h3>
                <span className="text-sm text-gray-500">
                  {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
                </span>
              </div>

              {filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'No clients match your search.' : 'You don\'t have any clients yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredClients.map((client) => (
                    <div
                      key={client._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {client.firstName} {client.lastName}
                            </h4>
                            {getStatusBadge(client.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Email:</span>
                              <span className="text-gray-900">{client.email}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Phone:</span>
                              <span className="text-gray-900">
                                {client.phoneNumber || 'Not provided'}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Portfolio:</span>
                              <span className="text-gray-900 font-medium">
                                {formatCurrency(client.totalPortfolioValue)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Onboarding:</span>
                              <span className="text-gray-900">
                                Step {client.onboardingStep}/7
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {client.hasCASData && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">CAS</span>
                            </div>
                          )}
                          
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Download className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalReportModal;
