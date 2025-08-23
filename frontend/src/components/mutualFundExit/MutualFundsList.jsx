/**
 * FILE LOCATION: frontend/src/components/mutualFundExit/MutualFundsList.jsx
 * 
 * PURPOSE: Component for listing mutual funds (existing and recommended) for a selected client
 * 
 * FUNCTIONALITY:
 * - Displays a filterable list of mutual funds associated with the selected client
 * - Shows funds from both CAS records (existing) and financial plan recommendations
 * - Indicates whether an exit strategy already exists for each fund
 * - Provides fund details including name, category, value, and performance metrics
 * - Allows selection of a fund to create or view an exit strategy
 * 
 * DATA DISPLAY:
 * - Fund name, category, and type (existing vs recommended)
 * - Current value, units, and NAV information
 * - Source of fund data (CAS or Financial Plan)
 * - Exit strategy status and creation date
 * - Performance indicators and risk metrics
 * 
 * USER INTERACTIONS:
 * - Filter funds by type (existing, recommended, or both)
 * - Search funds by name or category
 * - Sort funds by value, name, or category
 * - Click to select fund for strategy creation
 * - View existing exit strategies
 * 
 * DATA FLOW:
 * - Receives: Client data with mutual fund information from parent component
 * - Processes: Fund filtering, sorting, and search functionality
 * - Sends: Selected fund data to parent component
 * - Displays: Organized and filtered mutual fund information
 * 
 * COMPONENT INTEGRATION:
 * - Receives props: client (object), onFundSelect (function), onBack (function)
 * - Sends: Selected fund data via onFundSelect callback
 * - Integrates: With parent MutualFundExitSuite component
 * 
 * FILTERING & SORTING:
 * - Fund type filtering (existing, recommended, or both)
 * - Category-based filtering for fund classification
 * - Value range filtering for portfolio analysis
 * - Multiple sorting options for data organization
 * - Real-time search across fund names and categories
 */

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft,
  PieChart,
  TrendingUp,
  FileText,
  Search,
  Filter,
  SortAsc,
  Eye,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Hash,
  BarChart3,
  TrendingDown,
  Calendar
} from 'lucide-react';

const MutualFundsList = ({ 
  client, 
  onFundSelect, 
  onBack,
  onViewStrategy 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fundTypeFilter, setFundTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState('desc');

  const allFunds = useMemo(() => {
    const funds = [];
    
    // Add existing funds from CAS
    if (client.existingFunds) {
      client.existingFunds.forEach(fund => {
        funds.push({
          ...fund,
          source: 'cas',
          fundType: 'existing'
        });
      });
    }
    
    // Add recommended funds from financial plans
    if (client.recommendedFunds) {
      client.recommendedFunds.forEach(fund => {
        funds.push({
          ...fund,
          source: 'financial_plan',
          fundType: 'recommended'
        });
      });
    }
    
    return funds;
  }, [client]);

  const filteredAndSortedFunds = useMemo(() => {
    let filtered = allFunds;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(fund =>
        fund.fundName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fund.fundCategory.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply fund type filter
    if (fundTypeFilter !== 'all') {
      filtered = filtered.filter(fund => fund.fundType === fundTypeFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(fund => fund.fundCategory === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'value':
          aValue = a.currentValue || 0;
          bValue = b.currentValue || 0;
          break;
        case 'name':
          aValue = a.fundName.toLowerCase();
          bValue = b.fundName.toLowerCase();
          break;
        case 'category':
          aValue = a.fundCategory.toLowerCase();
          bValue = b.fundCategory.toLowerCase();
          break;
        case 'units':
          aValue = a.units || 0;
          bValue = b.units || 0;
          break;
        default:
          aValue = a.currentValue || 0;
          bValue = b.currentValue || 0;
      }

      if (typeof aValue === 'string') {
        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      } else {
        if (sortOrder === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }
    });

    return filtered;
  }, [allFunds, searchTerm, fundTypeFilter, categoryFilter, sortBy, sortOrder]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(allFunds.map(fund => fund.fundCategory))];
    return uniqueCategories.sort();
  }, [allFunds]);

  const totalPortfolioValue = useMemo(() => {
    return allFunds.reduce((sum, fund) => sum + (fund.currentValue || 0), 0);
  }, [allFunds]);

  const handleFundSelect = (fund) => {
    onFundSelect(fund);
  };

  const getFundTypeIcon = (fund) => {
    if (fund.fundType === 'existing') {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    } else {
      return <FileText className="w-5 h-5 text-purple-600" />;
    }
  };

  const getFundTypeLabel = (fund) => {
    if (fund.fundType === 'existing') {
      return 'Existing';
    } else {
      return 'Recommended';
    }
  };

  const getSourceLabel = (fund) => {
    if (fund.source === 'cas') {
      return 'CAS';
    } else {
      return 'Financial Plan';
    }
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

  const formatNumber = (value) => {
    if (!value || value <= 0) return '0';
    return value.toLocaleString('en-IN');
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Equity': 'bg-blue-100 text-blue-800',
      'Debt': 'bg-green-100 text-green-800',
      'Hybrid': 'bg-purple-100 text-purple-800',
      'Liquid': 'bg-yellow-100 text-yellow-800',
      'International': 'bg-red-100 text-red-800',
      'Sectoral': 'bg-indigo-100 text-indigo-800',
      'Index': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-purple-200 hover:shadow-md"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Clients</span>
            </button>
            <div className="h-12 w-px bg-purple-200"></div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <PieChart className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {client.clientName}'s Mutual Funds
                </h2>
                <p className="text-gray-600 text-lg">
                  {client.clientEmail} • {allFunds.length} funds
                </p>
              </div>
            </div>
          </div>
          
          {/* Enhanced Portfolio Value */}
          <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-purple-200">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {formatCurrency(totalPortfolioValue)}
            </div>
            <div className="text-sm font-medium text-gray-700">Total Portfolio Value</div>
            <div className="text-xs text-green-600 mt-1">💰 Current Holdings</div>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
          <div className="flex items-center space-x-3 mb-4">
            <Filter className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Enhanced Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search funds by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Enhanced Fund Type Filter */}
            <select
              value={fundTypeFilter}
              onChange={(e) => setFundTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white"
            >
              <option value="all">📊 All Fund Types</option>
              <option value="existing">📈 Existing Funds</option>
              <option value="recommended">📋 Recommended Funds</option>
            </select>

            {/* Enhanced Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white"
            >
              <option value="all">🏷️ All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Enhanced Sort */}
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white"
              >
                <option value="value">💰 Sort by Value</option>
                <option value="name">📝 Sort by Name</option>
                <option value="category">🏷️ Sort by Category</option>
                <option value="units">📊 Sort by Units</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Enhanced Results Count */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              Showing {filteredAndSortedFunds.length} of {allFunds.length} funds
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {Math.round((filteredAndSortedFunds.length / allFunds.length) * 100)}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Funds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredAndSortedFunds.map((fund, index) => (
          <div
            key={`${fund.fundId}-${index}`}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Fund Header with Enhanced Styling */}
            <div className="p-8">
              {/* Enhanced Fund Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getFundTypeIcon(fund)}
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getCategoryColor(fund.fundCategory)}`}>
                      {fund.fundCategory}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    fund.fundType === 'existing' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {getFundTypeLabel(fund)}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                  {fund.fundName}
                </h3>
                
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-sm text-gray-600 flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                    Source: {getSourceLabel(fund)}
                  </span>
                  {fund.planId && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                      Plan ID: {fund.planId.slice(-8)}
                    </span>
                  )}
                </div>
              </div>

              {/* Enhanced Fund Details */}
              <div className="space-y-6">
                {/* Main Fund Metrics */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-700 mb-1">Current Value</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(fund.currentValue)}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-700 mb-1">Units</div>
                      <div className="text-xl font-bold text-blue-600">
                        {formatNumber(fund.units)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Fund Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-xs font-medium text-gray-600 mb-1">NAV</div>
                    <div className="text-sm font-semibold text-gray-900">
                      ₹{fund.nav?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-xs font-medium text-gray-600 mb-1">Fund ID</div>
                    <div className="text-xs font-mono text-gray-600 truncate">
                      {fund.fundId}
                    </div>
                  </div>
                </div>

                {/* Enhanced Additional Details */}
                {fund.recommendationDate && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span>Recommended on: {new Date(fund.recommendationDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Action Buttons */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleFundSelect(fund)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 text-sm font-semibold flex items-center justify-center space-x-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Exit Strategy</span>
                  </button>
                  
                  {fund.hasExitStrategy && (
                    <button
                      onClick={() => onViewStrategy(fund)}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 text-sm font-semibold flex items-center justify-center space-x-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Strategy</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Empty State */}
      {filteredAndSortedFunds.length === 0 && allFunds.length > 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Search className="w-12 h-12 text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Funds Match Your Search</h3>
          <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
            Try adjusting your search terms or filters to find the fund you're looking for.
          </p>
          <div className="mt-6 space-x-3">
            <button 
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
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

      {/* Enhanced No Funds State */}
      {allFunds.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
            <PieChart className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Mutual Funds Found</h3>
          <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
            This client doesn't have any mutual fund holdings or recommendations yet.
            <br />
            They need to have CAS data or financial plan recommendations to appear here.
          </p>
          <div className="mt-6">
            <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors">
              Upload CAS Statement
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MutualFundsList;
