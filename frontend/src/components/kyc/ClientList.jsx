/**
 * FILE LOCATION: frontend/src/components/kyc/ClientList.jsx
 * 
 * PURPOSE: Client selection interface for KYC verification with search and filtering
 * 
 * Empty state handling when no clients match criteria
 */

import React, { useState, useMemo } from 'react';
import { Users, CheckCircle, XCircle, Clock, AlertCircle, Search, Filter } from 'lucide-react';

const ClientList = ({ clients, onClientSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter clients based on search term and status
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phoneNumber?.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || client.kycStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'verified':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />,
          text: 'Verified',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />,
          text: 'Pending',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'failed':
        return {
          icon: <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />,
          text: 'Failed',
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />,
          text: 'Not Started',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  // Get status counts
  const getStatusCounts = () => {
    const counts = {
      all: clients.length,
      verified: 0,
      pending: 0,
      failed: 0,
      not_started: 0
    };

    clients.forEach(client => {
      counts[client.kycStatus] = (counts[client.kycStatus] || 0) + 1;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">KYC Verification Dashboard</h2>
        <p className="text-gray-600">Select a client to begin or continue KYC verification process</p>
      </div>

      {/* Enhanced Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Clients
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="lg:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
              >
                <option value="all">All Status ({statusCounts.all})</option>
                <option value="verified">Verified ({statusCounts.verified})</option>
                <option value="pending">Pending ({statusCounts.pending})</option>
                <option value="failed">Failed ({statusCounts.failed})</option>
                <option value="not_started">Not Started ({statusCounts.not_started})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Client Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria to find more clients.'
              : 'No clients are currently available for KYC verification.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const statusDisplay = getStatusDisplay(client.kycStatus);
            
            return (
              <div
                key={client._id}
                onClick={() => onClientSelect(client)}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group"
              >
                {/* Client Header with Status */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {client.firstName} {client.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 truncate mt-1">{client.email}</p>
                    {client.phoneNumber && (
                      <p className="text-sm text-gray-600 truncate mt-1">{client.phoneNumber}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.borderColor} ml-4 flex-shrink-0`}>
                    {statusDisplay.icon}
                    <span className={`${statusDisplay.color} whitespace-nowrap`}>
                      {statusDisplay.text}
                    </span>
                  </div>
                </div>

                {/* KYC Progress Section */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">Aadhar Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusDisplay(client.aadharStatus).icon}
                      <span className={`font-medium ${getStatusDisplay(client.aadharStatus).color} whitespace-nowrap`}>
                        {getStatusDisplay(client.aadharStatus).text}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">PAN Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusDisplay(client.panStatus).icon}
                      <span className={`font-medium ${getStatusDisplay(client.panStatus).color} whitespace-nowrap`}>
                        {getStatusDisplay(client.panStatus).text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Action Button */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      client.kycStatus === 'verified' 
                        ? 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300' 
                        : 'text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 hover:border-blue-700'
                    }`}
                  >
                    <span className="whitespace-nowrap">
                      {client.kycStatus === 'verified' ? 'View Details' : 'Start Verification'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Summary Stats */}
      {clients.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">KYC Verification Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-3xl font-bold text-blue-600 mb-2">{statusCounts.all}</div>
              <div className="text-sm font-medium text-blue-700">Total Clients</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-3xl font-bold text-green-600 mb-2">{statusCounts.verified}</div>
              <div className="text-sm font-medium text-green-700">Verified</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{statusCounts.pending}</div>
              <div className="text-sm font-medium text-yellow-700">Pending</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-3xl font-bold text-gray-600 mb-2">{statusCounts.not_started}</div>
              <div className="text-sm font-medium text-gray-700">Not Started</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
