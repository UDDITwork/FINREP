/**
 * FILE LOCATION: frontend/src/components/dashboard/EnhancedMarketOverview.jsx
 * 
 * PURPOSE: Enhanced market overview component with real-time NSE/BSE data
 * 
 * FUNCTIONALITY: Display live market indices, top gainers/losers, and most active stocks
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Clock, RefreshCw } from 'lucide-react';
import { marketDataScraper } from '../../services/marketDataScraper';

const EnhancedMarketOverview = () => {
  const [marketData, setMarketData] = useState({
    indices: [],
    topGainers: [],
    topLosers: [],
    mostActive: [],
    marketStatus: 'unknown'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Load market data
  const loadMarketData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📊 [Enhanced Market Overview] Loading market data...');
      
      const [overviewResult, gainersResult, mostActiveResult] = await Promise.allSettled([
        marketDataScraper.getMarketOverview(),
        marketDataScraper.getTopGainersLosers(),
        marketDataScraper.getMostActiveStocks()
      ]);

      const newMarketData = {
        indices: overviewResult.status === 'fulfilled' ? overviewResult.value.data.indices : [],
        marketStatus: overviewResult.status === 'fulfilled' ? overviewResult.value.data.marketStatus : 'unknown',
        topGainers: gainersResult.status === 'fulfilled' ? gainersResult.value.data.topGainers : [],
        topLosers: gainersResult.status === 'fulfilled' ? gainersResult.value.data.topLosers : [],
        mostActive: mostActiveResult.status === 'fulfilled' ? mostActiveResult.value.data.mostActive : []
      };

      setMarketData(newMarketData);
      setLastUpdated(new Date());
      console.log('✅ [Enhanced Market Overview] Market data loaded successfully');
    } catch (error) {
      console.error('❌ [Enhanced Market Overview] Error loading market data:', error);
      setError('Failed to load market data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadMarketData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Get market status color and text
  const getMarketStatusInfo = (status) => {
    switch (status) {
      case 'open':
        return { color: 'text-green-600', bgColor: 'bg-green-100', text: 'Market Open', icon: Activity };
      case 'closed':
        return { color: 'text-red-600', bgColor: 'bg-red-100', text: 'Market Closed', icon: Clock };
      case 'pre_market':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', text: 'Pre-Market', icon: Clock };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', text: 'Unknown', icon: Clock };
    }
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-2">Failed to load market data</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadMarketData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getMarketStatusInfo(marketData.marketStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Market Status Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Live Market Status</h3>
          <div className="flex items-center space-x-2">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {statusInfo.text}
            </div>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Market Indices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketData.indices.map((index, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">{index.symbol}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  parseFloat(index.changePercent) >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {parseFloat(index.changePercent) >= 0 ? '+' : ''}{index.changePercent}%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                ₹{formatNumber(index.currentPrice)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${
                  parseFloat(index.change) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {parseFloat(index.change) >= 0 ? '+' : ''}{index.change}
                </span>
                <span className="text-gray-500">
                  Vol: {formatNumber(index.volume)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                <span>H: ₹{formatNumber(index.high)}</span>
                <span>L: ₹{formatNumber(index.low)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Gainers and Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Top Gainers</h3>
          </div>
          <div className="space-y-3">
            {marketData.topGainers.map((stock, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{stock.symbol}</div>
                  <div className="text-sm text-gray-600">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">₹{stock.price}</div>
                  <div className="text-sm text-green-600 font-medium">{stock.change}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Top Losers</h3>
          </div>
          <div className="space-y-3">
            {marketData.topLosers.map((stock, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{stock.symbol}</div>
                  <div className="text-sm text-gray-600">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">₹{stock.price}</div>
                  <div className="text-sm text-red-600 font-medium">{stock.change}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Active Stocks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Most Active Stocks</h3>
          </div>
          <button
            onClick={loadMarketData}
            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {marketData.mostActive.map((stock, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{stock.symbol}</div>
                      <div className="text-sm text-gray-500">{stock.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{stock.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      stock.change.startsWith('+') 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stock.change}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stock.volume}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Source Info */}
      <div className="text-center text-xs text-gray-500">
        <p>Data source: Yahoo Finance & NSE/BSE Public Data</p>
        <p>Auto-refresh every 5 minutes • Last updated: {lastUpdated?.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default EnhancedMarketOverview;
