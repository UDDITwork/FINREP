/**
 * FILE LOCATION: frontend/src/components/mutualFundExit/ClientSelection.jsx
 * 
 * PURPOSE: Component for selecting a client for mutual fund analysis within the Exit Suite
 * 
 * FUNCTIONALITY:
 * - Displays a searchable and filterable list of clients who have mutual funds
 * - Shows both existing funds from CAS and recommended funds from financial plans
 * - Provides client information and mutual fund holdings summary
 * - Implements search and filtering capabilities for efficient client selection
 * - Displays total portfolio value and fund count for each client
 * 
 * DATA DISPLAY:
 * - Client name, email, and phone number
 * - Total mutual fund portfolio value
 * - Count of existing and recommended funds
 * - Fund source indicators (CAS vs Financial Plan)
 * - Exit strategy status for existing strategies
 * 
 * USER INTERACTIONS:
 * - Search input for filtering clients by name/email
 * - Status filter for viewing specific fund types
 * - Clickable client cards for selection
 * - Visual feedback for selected client state
 * 
 * DATA FLOW:
 * - Receives: Client list with mutual fund data from parent component
 * - Processes: Search queries and status filtering
 * - Sends: Selected client data to parent component
 * - Displays: Filtered and sorted client information
 * 
 * COMPONENT INTEGRATION:
 * - Receives props: clients (array), onClientSelect (function), loading, error
 * - Sends: Selected client data via onClientSelect callback
 * - Integrates: With parent MutualFundExitSuite component
 * 
 * SEARCH & FILTERING:
 * - Real-time search across client names and emails
 * - Fund type filtering (existing, recommended, or both)
 * - Portfolio value range filtering
 * - Responsive grid layout for different screen sizes
 * - Empty state handling when no clients match criteria
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Hash,
  Info,
  Mail,
  Phone,
  ArrowRight
} from 'lucide-react';

const ClientSelection = ({ 
  clients, 
  onClientSelect, 
  loading, 
  error, 
  onRetry,
  summary 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fundTypeFilter, setFundTypeFilter] = useState('all');
  const [valueFilter, setValueFilter] = useState('all');

  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply fund type filter
    if (fundTypeFilter !== 'all') {
      filtered = filtered.filter(client => {
        if (fundTypeFilter === 'existing') {
          return client.existingFunds.length > 0;
        } else if (fundTypeFilter === 'recommended') {
          return client.recommendedFunds.length > 0;
        }
        return true;
      });
    }

    // Apply value filter
    if (valueFilter !== 'all') {
      filtered = filtered.filter(client => {
        const totalValue = client.totalValue;
        switch (valueFilter) {
          case 'low':
            return totalValue < 100000; // Less than 1L
          case 'medium':
            return totalValue >= 100000 && totalValue < 1000000; // 1L to 10L
          case 'high':
            return totalValue >= 1000000; // 10L and above
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [clients, searchTerm, fundTypeFilter, valueFilter]);

  const handleClientSelect = (client) => {
    // Only allow selection if client has mutual funds
    if (client.existingFunds.length > 0 || client.recommendedFunds.length > 0) {
      onClientSelect(client);
    }
  };

  const getFundTypeIcon = (client) => {
    const hasExisting = client.existingFunds.length > 0;
    const hasRecommended = client.recommendedFunds.length > 0;

    if (hasExisting && hasRecommended) {
      return <PieChart className="w-5 h-5 text-blue-600" />;
    } else if (hasExisting) {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    } else if (hasRecommended) {
      return <FileText className="w-5 h-5 text-purple-600" />;
    }
    return <PieChart className="w-5 h-5 text-gray-400" />;
  };

  const getFundTypeLabel = (client) => {
    const hasExisting = client.existingFunds.length > 0;
    const hasRecommended = client.recommendedFunds.length > 0;

    if (hasExisting && hasRecommended) {
      return 'Mixed';
    } else if (hasExisting) {
      return 'Existing';
    } else if (hasRecommended) {
      return 'Recommended';
    }
    return 'None';
  };

  const formatCurrency = (value) => {
    if (!value || value <= 0) return '₹0';
    
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else {
      return `₹${value.toLocaleString('en-IN')}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Clients</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Clients Found</h3>
          <p className="text-gray-600 text-lg leading-relaxed">
            You don't have any clients yet. 
            <br />
            Add clients through the client onboarding process to get started.
          </p>
          <div className="mt-6">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
              Add Your First Client
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
          <div>
              <h2 className="text-3xl font-bold text-gray-900">Select Client</h2>
              <p className="text-gray-600 text-lg mt-1">
                Choose a client to analyze their mutual fund portfolio and create exit strategies
            </p>
          </div>
          </div>
          
          {/* Enhanced Stats Cards */}
          <div className="flex space-x-6">
            <div className="text-center bg-white rounded-xl p-4 shadow-sm border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{clients.length}</div>
              <div className="text-sm font-medium text-gray-700">Total Clients</div>
            </div>
            <div className="text-center bg-white rounded-xl p-4 shadow-sm border border-green-200">
              <div className="text-3xl font-bold text-green-600">
                {clients.filter(c => c.existingFunds.length > 0 || c.recommendedFunds.length > 0).length}
              </div>
              <div className="text-sm font-medium text-gray-700">With Funds</div>
            </div>
            <div className="text-center bg-white rounded-xl p-4 shadow-sm border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">
                {clients.filter(c => c.existingFunds.length === 0 && c.recommendedFunds.length === 0).length}
            </div>
              <div className="text-sm font-medium text-gray-700">No Funds</div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
          <div className="flex items-center space-x-3 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Enhanced Search */}
          <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
                placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

            {/* Enhanced Fund Type Filter */}
          <select
            value={fundTypeFilter}
            onChange={(e) => setFundTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
            >
              <option value="all">📊 All Fund Types</option>
              <option value="existing">📈 Existing Funds Only</option>
              <option value="recommended">📋 Recommended Funds Only</option>
          </select>

            {/* Enhanced Value Filter */}
          <select
            value={valueFilter}
            onChange={(e) => setValueFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
            >
              <option value="all">💰 All Values</option>
              <option value="low">💚 Low (&lt; ₹1L)</option>
              <option value="medium">💛 Medium (₹1L - ₹10L)</option>
              <option value="high">❤️ High (&gt; ₹10L)</option>
          </select>

            {/* Results Counter */}
            <div className="flex items-center justify-center px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-sm font-medium text-gray-700">
                {filteredClients.length} of {clients.length} clients
              </span>
            </div>
        </div>
        </div>
      </div>

      {/* Enhanced Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClients.map((client) => (
          <div
            key={client.clientId}
            onClick={() => handleClientSelect(client)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
          >
            {/* Status Badge */}
            <div className="relative">
              <div className="absolute top-4 right-4 z-10">
                {client.existingFunds.length > 0 || client.recommendedFunds.length > 0 ? (
                <div className="flex items-center space-x-2">
                  {getFundTypeIcon(client)}
                    <span className="text-xs font-semibold text-white bg-green-500 px-3 py-1 rounded-full shadow-lg">
                    {getFundTypeLabel(client)}
                  </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      No Funds
                    </span>
                  </div>
                )}
                </div>
              </div>

            <div className="p-8">
              {/* Enhanced Client Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {client.clientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  {client.clientName}
                </h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 flex items-center justify-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {client.clientEmail}
                  </p>
                  {client.clientPhone && (
                    <p className="text-sm text-gray-600 flex items-center justify-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {client.clientPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Enhanced Portfolio Summary */}
              <div className="space-y-6">
                {/* Portfolio Value */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700 mb-1">Total Portfolio Value</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(client.totalValue)}
                    </div>
                  </div>
                </div>

                {/* Fund Counts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {client.existingFunds.length}
                    </div>
                    <div className="text-xs font-medium text-blue-700">Existing Funds</div>
                    <div className="text-xs text-blue-600 mt-1">📈 Current Holdings</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {client.recommendedFunds.length}
                    </div>
                    <div className="text-xs font-medium text-purple-700">Recommended</div>
                    <div className="text-xs text-purple-600 mt-1">📋 Future Plans</div>
                  </div>
                </div>

                {/* Enhanced Fund Details */}
                {client.existingFunds.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">Existing Funds</span>
                    </div>
                    <div className="space-y-2">
                      {client.existingFunds.slice(0, 2).map((fund, index) => (
                        <div key={index} className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-800 truncate flex-1">
                            {fund.fundName}
                          </span>
                            <span className="text-sm font-bold text-green-700 ml-2">
                            {formatCurrency(fund.currentValue)}
                          </span>
                          </div>
                        </div>
                      ))}
                      {client.existingFunds.length > 2 && (
                        <div className="text-center py-2">
                          <span className="text-xs font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                          +{client.existingFunds.length - 2} more funds
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {client.recommendedFunds.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-700">Recommended Funds</span>
                    </div>
                    <div className="space-y-2">
                      {client.recommendedFunds.slice(0, 2).map((fund, index) => (
                        <div key={index} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-purple-800 truncate flex-1">
                            {fund.fundName}
                          </span>
                            <span className="text-sm font-bold text-purple-700 ml-2">
                            {formatCurrency(fund.currentValue)}
                          </span>
                          </div>
                        </div>
                      ))}
                      {client.recommendedFunds.length > 2 && (
                        <div className="text-center py-2">
                          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                          +{client.recommendedFunds.length - 2} more funds
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced No Funds Message */}
                {client.existingFunds.length === 0 && client.recommendedFunds.length === 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <Info className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="text-sm font-semibold text-gray-600 mb-1">No Mutual Funds</div>
                      <div className="text-xs text-gray-500">
                        This client doesn't have any mutual funds yet
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Action Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button 
                  className={`w-full px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 transform ${
                    client.existingFunds.length > 0 || client.recommendedFunds.length > 0
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={client.existingFunds.length === 0 && client.recommendedFunds.length === 0}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {client.existingFunds.length > 0 || client.recommendedFunds.length > 0 ? (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>Select Client</span>
                      </>
                    ) : (
                      <>
                        <Info className="w-4 h-4" />
                        <span>No Funds Available</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Empty State for Filtered Results */}
      {filteredClients.length === 0 && clients.length > 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Search className="w-12 h-12 text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Clients Match Your Search</h3>
          <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
            Try adjusting your search terms or filters to find the client you're looking for.
          </p>
          <div className="mt-6 space-x-3">
            <button 
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
            <button 
              onClick={() => setFundTypeFilter('all')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSelection;
