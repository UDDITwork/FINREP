/**
 * FILE LOCATION: frontend/src/components/dashboard/MarketIndicators.jsx
 * 
 * Comprehensive market indicators component that displays
 * major stock market indices, technical indicators, and
 * market sentiment data with Claude AI insights.
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3, Target, Zap, Shield, Globe, DollarSign, Percent, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { getClaudeAnalysis, getMarketSentiment } from '../../services/claudeAPI';
import toast from 'react-hot-toast';

const MarketIndicators = () => {
  const [indicators, setIndicators] = useState({
    indices: {
      nifty50: { value: 22450.25, change: 125.50, changePercent: 0.56, trend: 'up' },
      sensex: { value: 73850.75, change: 425.25, changePercent: 0.58, trend: 'up' },
      niftyBank: { value: 48500.50, change: -125.75, changePercent: -0.26, trend: 'down' },
      niftyIT: { value: 36500.25, change: 225.50, changePercent: 0.62, trend: 'up' },
      niftyPharma: { value: 18500.75, change: 75.25, changePercent: 0.41, trend: 'up' },
      niftyAuto: { value: 22500.50, change: -150.25, changePercent: -0.66, trend: 'down' }
    },
    technical: {
      rsi: { value: 58.5, status: 'neutral', trend: 'up' },
      macd: { value: 12.5, status: 'bullish', trend: 'up' },
      bollinger: { value: 0.65, status: 'neutral', trend: 'sideways' },
      volume: { value: 1250000000, change: 5.2, trend: 'up' },
      vix: { value: 12.5, status: 'low', trend: 'down' }
    },
    global: {
      dowJones: { value: 38500.25, change: 125.50, changePercent: 0.33, trend: 'up' },
      nasdaq: { value: 16500.75, change: -75.25, changePercent: -0.45, trend: 'down' },
      ftse: { value: 7850.50, change: 50.25, changePercent: 0.64, trend: 'up' },
      nikkei: { value: 38500.25, change: 225.50, changePercent: 0.59, trend: 'up' },
      hangSeng: { value: 18500.75, change: -125.25, changePercent: -0.67, trend: 'down' }
    },
    commodities: {
      gold: { value: 62500, change: 250, changePercent: 0.40, trend: 'up' },
      silver: { value: 75000, change: -500, changePercent: -0.66, trend: 'down' },
      crudeOil: { value: 8500, change: 125, changePercent: 1.49, trend: 'up' },
      copper: { value: 850, change: 15, changePercent: 1.80, trend: 'up' }
    },
    forex: {
      usdInr: { value: 83.25, change: -0.15, changePercent: -0.18, trend: 'down' },
      eurInr: { value: 90.50, change: 0.25, changePercent: 0.28, trend: 'up' },
      gbpInr: { value: 105.75, change: -0.35, changePercent: -0.33, trend: 'down' },
      jpyInr: { value: 0.55, change: 0.01, changePercent: 1.85, trend: 'up' }
    }
  });

  const [claudeInsights, setClaudeInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('indices');

  // Load Claude AI insights
  useEffect(() => {
    loadClaudeInsights();
  }, []);

  const loadClaudeInsights = async () => {
    try {
      setIsLoading(true);
      const analysis = await getClaudeAnalysis(
        'Provide a brief market analysis and key insights for today based on current market indicators',
        indicators
      );
      
      if (analysis.success) {
        setClaudeInsights(analysis.data);
      }
    } catch (error) {
      console.error('Error loading Claude insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value, currency = 'INR') => {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format large numbers
  const formatLargeNumber = (num) => {
    if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(2) + ' L';
    if (num >= 1000) return (num / 1000).toFixed(2) + ' K';
    return num.toString();
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get trend color
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'bullish':
        return 'text-green-600 bg-green-50';
      case 'bearish':
        return 'text-red-600 bg-red-50';
      case 'neutral':
        return 'text-gray-600 bg-gray-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const tabs = [
    { id: 'indices', name: 'Indices', icon: BarChart3 },
    { id: 'technical', name: 'Technical', icon: Activity },
    { id: 'global', name: 'Global', icon: Globe },
    { id: 'commodities', name: 'Commodities', icon: Target },
    { id: 'forex', name: 'Forex', icon: DollarSign }
  ];

  const renderIndicesTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(indicators.indices).map(([key, data]) => (
        <div key={key} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            {getTrendIcon(data.trend)}
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(data.value)}
          </div>
          <div className={`text-sm font-medium ${getTrendColor(data.trend)}`}>
            {data.change >= 0 ? '+' : ''}{formatCurrency(data.change)} ({data.changePercent >= 0 ? '+' : ''}{data.changePercent}%)
          </div>
        </div>
      ))}
    </div>
  );

  const renderTechnicalTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(indicators.technical).map(([key, data]) => (
        <div key={key} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 uppercase">
              {key}
            </h4>
            {getTrendIcon(data.trend)}
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {key === 'volume' ? formatLargeNumber(data.value) : data.value}
          </div>
          <div className={`text-sm px-2 py-1 rounded-full inline-block ${getStatusColor(data.status)}`}>
            {data.status}
          </div>
          {key === 'volume' && (
            <div className={`text-sm font-medium ${getTrendColor(data.trend)} mt-1`}>
              {data.change >= 0 ? '+' : ''}{data.change}%
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderGlobalTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(indicators.global).map(([key, data]) => (
        <div key={key} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            {getTrendIcon(data.trend)}
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(data.value, 'USD')}
          </div>
          <div className={`text-sm font-medium ${getTrendColor(data.trend)}`}>
            {data.change >= 0 ? '+' : ''}{formatCurrency(data.change, 'USD')} ({data.changePercent >= 0 ? '+' : ''}{data.changePercent}%)
          </div>
        </div>
      ))}
    </div>
  );

  const renderCommoditiesTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(indicators.commodities).map(([key, data]) => (
        <div key={key} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            {getTrendIcon(data.trend)}
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ₹{data.value.toLocaleString()}
          </div>
          <div className={`text-sm font-medium ${getTrendColor(data.trend)}`}>
            {data.change >= 0 ? '+' : ''}₹{data.change} ({data.changePercent >= 0 ? '+' : ''}{data.changePercent}%)
          </div>
        </div>
      ))}
    </div>
  );

  const renderForexTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(indicators.forex).map(([key, data]) => (
        <div key={key} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 uppercase">
              {key}
            </h4>
            {getTrendIcon(data.trend)}
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ₹{data.value}
          </div>
          <div className={`text-sm font-medium ${getTrendColor(data.trend)}`}>
            {data.change >= 0 ? '+' : ''}₹{data.change} ({data.changePercent >= 0 ? '+' : ''}{data.changePercent}%)
          </div>
        </div>
      ))}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'indices':
        return renderIndicesTab();
      case 'technical':
        return renderTechnicalTab();
      case 'global':
        return renderGlobalTab();
      case 'commodities':
        return renderCommoditiesTab();
      case 'forex':
        return renderForexTab();
      default:
        return renderIndicesTab();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Market Indicators</h3>
          <p className="text-sm text-gray-600">Real-time market data and technical indicators</p>
        </div>
      </div>

      {/* Market Analysis */}
      {claudeInsights && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Market Analysis</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {claudeInsights.analysis || 'Market analysis and insights based on current indicators.'}
              </p>
              {claudeInsights.recommendations && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                  <h5 className="font-medium text-gray-900 mb-1">Key Insights:</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {claudeInsights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>

      {/* Market Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">Advancing:</span>
            <span className="font-medium text-green-600">1,245 stocks</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">Declining:</span>
            <span className="font-medium text-red-600">856 stocks</span>
          </div>
          <div className="flex items-center space-x-2">
            <Minus className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Unchanged:</span>
            <span className="font-medium text-gray-600">234 stocks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketIndicators;
