// Location: frontend/src/components/casManagement/CASManagementPage.jsx

import React, { useState, useEffect } from 'react';
import { FileText, Users, TrendingUp, Calendar, Eye, ArrowRight } from 'lucide-react';
import casManagementAPI from '../../services/casManagementAPI';
import ClientCASList from './ClientCASList';
import ClientCASDetails from './ClientCASDetails';
import CASSummary from './CASSummary';
import toast from 'react-hot-toast';

const CASManagementPage = () => {
  const [summary, setSummary] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    loadCASData();
  }, []);

  const loadCASData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load both summary and clients data
      const [summaryResponse, clientsResponse] = await Promise.all([
        casManagementAPI.getCASSummary(),
        casManagementAPI.getClientsWithCAS()
      ]);

      setSummary(summaryResponse.data);
      setClients(clientsResponse.data.clients);

      console.log('✅ CAS Management data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading CAS data:', error);
      setError(error.message || 'Failed to load CAS data');
      toast.error('Failed to load CAS data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };

  const handleBackToList = () => {
    setSelectedClient(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading CAS Data</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadCASData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Consolidated Account Statement
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage and view consolidated account statements for all your clients
          </p>
        </div>

        {/* Summary Cards */}
        {summary && <CASSummary summary={summary} />}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Clients with CAS Data
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {clients.length} client{clients.length !== 1 ? 's' : ''} with consolidated account statements
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {summary?.clientsWithCAS || 0} / {summary?.totalClients || 0} clients
                </span>
              </div>
            </div>
          </div>

          {/* Client List or Client Details */}
          {selectedClient ? (
            <ClientCASDetails 
              client={selectedClient} 
              onBack={handleBackToList}
            />
          ) : (
            <ClientCASList 
              clients={clients} 
              onClientSelect={handleClientSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CASManagementPage;
