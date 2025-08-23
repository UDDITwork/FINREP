/**
 * FILE LOCATION: frontend/src/components/dashboard/StockMarketSearch.jsx
 * 
 * Comprehensive stock market search component that provides real-time
 * search functionality for stocks, mutual funds, and IPOs with live data
 * from the Indian Stock API.
 */

import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, X, Loader2 } from 'lucide-react';
import { stockMarketAPI, formatCurrency, formatPercentage, getChangeColor, getTrendIcon } from '../../services/stockMarketAPI';
import toast from 'react-hot-toast';

const StockMarketSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('stock'); // 'stock', 'mutualfund', 'ipo'
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Search types configuration
  const searchTypes = [
    { id: 'stock', label: 'Stocks', icon: TrendingUp },
    { id: 'mutualfund', label: 'Mutual Funds', icon: TrendingUp },
    { id: 'ipo', label: 'IPOs', icon: TrendingUp }
  ];

  // Handle search input changes with debouncing
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setShowResults(true);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value.trim());
      }, 500);
    } else {
      setSearchResults([]);
      setSelectedResult(null);
    }
  };

  // Perform search based on type
  const performSearch = async (query) => {
    if (!query || query.length < 2) return;
    
    setIsLoading(true);
    setSearchResults([]);
    setSelectedResult(null);
    
    try {
      let result;
      
      switch (searchType) {
        case 'stock':
          result = await stockMarketAPI.searchStock(query);
          break;
        case 'mutualfund':
          result = await stockMarketAPI.searchMutualFund(query);
          break;
        case 'ipo':
          result = await stockMarketAPI.getIPOData();
          // Filter IPO data by search query
          if (result.success && result.data) {
            const filteredIPOs = [];
            Object.keys(result.data).forEach(status => {
              if (result.data[status] && Array.isArray(result.data[status])) {
                const filtered = result.data[status].filter(ipo => 
                  ipo.companyName?.toLowerCase().includes(query.toLowerCase()) ||
                  ipo.tickerId?.toLowerCase().includes(query.toLowerCase())
                );
                filteredIPOs.push(...filtered);
              }
            });
            result.data = filteredIPOs;
          }
          break;
        default:
          result = { success: false, data: [] };
      }
      
      if (result.success && result.data) {
        setSearchResults(Array.isArray(result.data) ? result.data : [result.data]);
      } else {
        setSearchResults([]);
        if (result.message) {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle result selection
  const handleResultSelect = (result) => {
    setSelectedResult(result);
    setShowResults(false);
    setSearchQuery(result.companyName || result.schemeName || result.tickerId || '');
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedResult(null);
    setShowResults(false);
  };

  // Render individual search result
  const renderSearchResult = (result, index) => {
    try {
      const isStock = searchType === 'stock';
      const isMutualFund = searchType === 'mutualfund';
      const isIPO = searchType === 'ipo';
      
      return (
        <div
          key={index}
          onClick={() => handleResultSelect(result)}
          className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {result.companyName || result.schemeName || result.tickerId || 'Unknown'}
                </div>
                {result.tickerId && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {result.tickerId}
                  </span>
                )}
              </div>
            </div>
            
            {isStock && (
              <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600">
                {result.currentPrice && (
                  <span className="font-medium">
                    {formatCurrency(result.currentPrice.BSE || result.currentPrice.NSE || result.currentPrice)}
                  </span>
                )}
                {result.percentChange !== null && result.percentChange !== undefined && (
                  <span className={getChangeColor(result.percentChange)}>
                    {formatPercentage(result.percentChange)}
                  </span>
                )}
                {result.industry && (
                  <span className="text-gray-500">{result.industry}</span>
                )}
              </div>
            )}
            
            {isMutualFund && (
              <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600">
                {result.schemeType && (
                  <span className="text-gray-500">{result.schemeType}</span>
                )}
                {result.isin && (
                  <span className="text-gray-500">ISIN: {result.isin}</span>
                )}
              </div>
            )}
            
            {isIPO && (
              <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600">
                {result.issuePrice && (
                  <span className="font-medium">
                    Issue Price: {formatCurrency(result.issuePrice)}
                  </span>
                )}
                {result.lotSize && (
                  <span className="text-gray-500">Lot Size: {result.lotSize}</span>
                )}
                {result.status && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.status === 'active' ? 'bg-green-100 text-green-800' :
                    result.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    result.status === 'listed' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="ml-2">
            {isStock && result.percentChange !== null && result.percentChange !== undefined && (
              <div className={`flex items-center ${getChangeColor(result.percentChange)}`}>
                {Number(result.percentChange) > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : Number(result.percentChange) < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error('❌ [StockMarketSearch] Error rendering search result:', error, result);
      // Return a fallback UI for malformed data
      return (
        <div key={index} className="p-3 border-b border-gray-100 last:border-b-0">
          <div className="text-sm text-red-600">
            Error displaying result: {result?.tickerId || 'Unknown'}
          </div>
        </div>
      );
    }
  };

  // Render selected result details
  const renderSelectedResult = () => {
    if (!selectedResult) return null;
    
    const isStock = searchType === 'stock';
    const isMutualFund = searchType === 'mutualfund';
    const isIPO = searchType === 'ipo';
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedResult.companyName || selectedResult.schemeName || selectedResult.tickerId}
          </h3>
          <button
            onClick={clearSearch}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {isStock && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {selectedResult.currentPrice && (
              <div>
                <span className="text-gray-600">Current Price</span>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(selectedResult.currentPrice.BSE || selectedResult.currentPrice.NSE || selectedResult.currentPrice)}
                </div>
              </div>
            )}
            {selectedResult.percentChange && (
              <div>
                <span className="text-gray-600">Change</span>
                <div className={`font-semibold ${getChangeColor(selectedResult.percentChange)}`}>
                  {formatPercentage(selectedResult.percentChange)}
                </div>
              </div>
            )}
            {selectedResult.yearHigh && (
              <div>
                <span className="text-gray-600">52W High</span>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(selectedResult.yearHigh)}
                </div>
              </div>
            )}
            {selectedResult.yearLow && (
              <div>
                <span className="text-gray-600">52W Low</span>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(selectedResult.yearLow)}
                </div>
              </div>
            )}
          </div>
        )}
        
        {isMutualFund && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {selectedResult.schemeType && (
              <div>
                <span className="text-gray-600">Scheme Type</span>
                <div className="font-semibold text-gray-900">{selectedResult.schemeType}</div>
              </div>
            )}
            {selectedResult.isin && (
              <div>
                <span className="text-gray-600">ISIN</span>
                <div className="font-semibold text-gray-900">{selectedResult.isin}</div>
              </div>
            )}
            {selectedResult.categoryId && (
              <div>
                <span className="text-gray-600">Category</span>
                <div className="font-semibold text-gray-900">{selectedResult.categoryId}</div>
              </div>
            )}
          </div>
        )}
        
        {isIPO && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {selectedResult.issuePrice && (
              <div>
                <span className="text-gray-600">Issue Price</span>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(selectedResult.issuePrice)}
                </div>
              </div>
            )}
            {selectedResult.lotSize && (
              <div>
                <span className="text-gray-600">Lot Size</span>
                <div className="font-semibold text-gray-900">{selectedResult.lotSize}</div>
              </div>
            )}
            {selectedResult.status && (
              <div>
                <span className="text-gray-600">Status</span>
                <div className={`font-semibold ${
                  selectedResult.status === 'active' ? 'text-green-600' :
                  selectedResult.status === 'upcoming' ? 'text-blue-600' :
                  selectedResult.status === 'listed' ? 'text-purple-600' :
                  'text-gray-600'
                }`}>
                  {selectedResult.status.charAt(0).toUpperCase() + selectedResult.status.slice(1)}
                </div>
              </div>
            )}
            {selectedResult.listingDate && (
              <div>
                <span className="text-gray-600">Listing Date</span>
                <div className="font-semibold text-gray-900">
                  {new Date(selectedResult.listingDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Main render function with error boundary
  const renderMainContent = () => {
    try {
      return (
        <div className="relative">
          {/* Search Type Selector */}
          <div className="flex space-x-1 mb-3 bg-gray-100 rounded-lg p-1">
            {searchTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setSearchType(type.id);
                    setSearchResults([]);
                    setSelectedResult(null);
                    if (searchQuery.trim().length >= 2) {
                      performSearch(searchQuery.trim());
                    }
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchType === type.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={`Search ${searchType === 'stock' ? 'stocks' : searchType === 'mutualfund' ? 'mutual funds' : 'IPOs'}...`}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
              )}
              {searchQuery && !isLoading && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                {searchResults.map((result, index) => renderSearchResult(result, index))}
              </div>
            )}

            {/* No Results */}
            {showResults && searchQuery.trim().length >= 2 && !isLoading && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 z-50">
                No {searchType === 'stock' ? 'stocks' : searchType === 'mutualfund' ? 'mutual funds' : 'IPOs'} found for "{searchQuery}"
              </div>
            )}
          </div>

          {/* Selected Result Details */}
          {renderSelectedResult()}
        </div>
      );
    } catch (error) {
      console.error('❌ [StockMarketSearch] Error rendering main content:', error);
      return (
        <div className="text-center text-red-500 py-8">
          <div className="text-lg font-medium mb-2">Error Loading Search Component</div>
          <div className="text-sm text-gray-600 mb-4">There was an error rendering the search component.</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
  };

  return renderMainContent();
};

export default StockMarketSearch;
