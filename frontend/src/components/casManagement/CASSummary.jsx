// Location: frontend/src/components/casManagement/CASSummary.jsx

import React from 'react';
import { Users, TrendingUp, Building2, FileText } from 'lucide-react';

const CASSummary = ({ summary }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const summaryCards = [
    {
      title: 'Total Clients',
      value: formatNumber(summary.totalClients),
      icon: Users,
      color: 'bg-blue-500',
      description: 'All registered clients'
    },
    {
      title: 'Clients with CAS',
      value: formatNumber(summary.clientsWithCAS),
      icon: FileText,
      color: 'bg-green-500',
      description: `${summary.casPercentage}% of total clients`
    },
    {
      title: 'Total Portfolio Value',
      value: formatCurrency(summary.totalPortfolioValue),
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: 'Combined portfolio value'
    },
    {
      title: 'Average Portfolio',
      value: formatCurrency(summary.averagePortfolioValue),
      icon: Building2,
      color: 'bg-orange-500',
      description: 'Per client average'
    }
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-medium text-gray-500">
                    {card.title}
                  </div>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {card.value}
                </div>
              </div>
              
              <div className="text-xs sm:text-sm text-gray-600">
                {card.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Statistics */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Demat Accounts</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber(summary.totalDematAccounts)}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Mutual Fund Folios</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber(summary.totalMutualFundFolios)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">CAS Coverage</p>
              <p className="text-lg font-semibold text-gray-900">
                {summary.casPercentage}%
              </p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CASSummary;
