import React, { useState, useMemo } from 'react';
import { Search, User, MapPin, Phone, Mail, Calendar, ArrowRight, Filter } from 'lucide-react';

const ClientSelectionStep = ({ clients, loading, selectedClient, onClientSelect, onComplete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let filtered = clients.filter(client => {
      const matchesSearch = 
        client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });

    // Sort clients
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'income':
          return (b.totalMonthlyIncome || 0) - (a.totalMonthlyIncome || 0);
        case 'networth':
          return (b.calculatedFinancials?.netWorth || 0) - (a.calculatedFinancials?.netWorth || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [clients, searchTerm, filterStatus, sortBy]);

  const handleClientSelect = (client) => {
    onClientSelect(client);
  };

  const handleProceed = () => {
    if (selectedClient) {
      onComplete(selectedClient);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'onboarding': return 'bg-yellow-100 text-yellow-800';
      case 'invited': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Client for A/B Testing</h2>
        <p className="text-gray-600">
          Choose a client to perform comprehensive investment strategy analysis and comparison.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="invited">Invited</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date Added</option>
            <option value="income">Sort by Income</option>
            <option value="networth">Sort by Net Worth</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>{filteredClients.length} clients found</span>
          {selectedClient && (
            <span className="text-blue-600 font-medium">
              Selected: {selectedClient.firstName} {selectedClient.lastName}
            </span>
          )}
        </div>
      </div>

      {/* Client List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filteredClients.map((client) => {
          const isSelected = selectedClient?._id === client._id;
          
          return (
            <div
              key={client._id}
              onClick={() => handleClientSelect(client)}
              className={`
                border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {/* Client Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">
                      {client.firstName} {client.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Age: {client.age || 'N/A'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                  {client.status || 'Unknown'}
                </span>
              </div>

              {/* Client Details */}
              <div className="space-y-2 text-sm">
                {client.email && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                
                {client.phoneNumber && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{client.phoneNumber}</span>
                  </div>
                )}

                {client.address?.city && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{client.address.city}, {client.address.state}</span>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Monthly Income:</span>
                    <p className="font-medium text-green-600">
                      {formatCurrency(client.totalMonthlyIncome)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Net Worth:</span>
                    <p className="font-medium text-blue-600">
                      {formatCurrency(client.calculatedFinancials?.netWorth)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Investment Readiness Indicator */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    client.formProgress?.step5Completed ? 'bg-green-500' : 
                    client.formProgress?.step3Completed ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-gray-500">
                    {client.formProgress?.step5Completed ? 'Complete Profile' : 
                     client.formProgress?.step3Completed ? 'Partial Profile' : 'Basic Profile'}
                  </span>
                </div>
                
                {client.casData?.casStatus === 'parsed' && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    CAS Available
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* No Clients Message */}
      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-600">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'You haven\'t added any clients yet.'}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-gray-600">
          {selectedClient ? (
            <span>
              Selected client: <strong>{selectedClient.firstName} {selectedClient.lastName}</strong>
            </span>
          ) : (
            'Please select a client to continue'
          )}
        </div>
        
        <button
          onClick={handleProceed}
          disabled={!selectedClient}
          className={`
            flex items-center px-6 py-2 rounded-lg font-medium transition-all duration-200
            ${selectedClient
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Proceed to Risk Assessment
          <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ClientSelectionStep;