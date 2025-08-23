// Location: frontend/src/components/casManagement/ClientCASList.jsx

import React from 'react';
import { Eye, Calendar, TrendingUp, Building2, FileText } from 'lucide-react';

const ClientCASList = ({ clients, onClientSelect }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'onboarding':
        return 'bg-yellow-100 text-yellow-800';
      case 'invited':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (clients.length === 0) {
    return (
      <div className="p-6 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No CAS Data Available
        </h3>
        <p className="text-gray-600 mb-4">
          None of your clients have uploaded consolidated account statements yet.
        </p>
        <p className="text-sm text-gray-500">
          CAS data will appear here once clients complete their onboarding with CAS uploads.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {clients.map((client) => (
        <div
          key={client.clientId}
          className="p-6 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
          onClick={() => onClientSelect(client)}
        >
          <div className="flex items-center justify-between">
            {/* Client Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {client.firstName} {client.lastName}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{client.email}</p>
                </div>
              </div>

              {/* CAS Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500">Portfolio Value</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(client.casInfo.portfolioValue)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Demat Accounts</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {client.casInfo.dematAccountsCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500">Mutual Funds</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {client.casInfo.mutualFundsCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {client.casInfo.lastParsedAt ? formatDate(client.casInfo.lastParsedAt) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* File Info */}
              <div className="mt-3 text-xs text-gray-500">
                <span className="font-medium">File:</span> {client.casInfo.fileName}
                {client.casInfo.uploadDate && (
                  <span className="ml-4">
                    <span className="font-medium">Uploaded:</span> {formatDate(client.casInfo.uploadDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClientSelect(client);
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClientCASList;
