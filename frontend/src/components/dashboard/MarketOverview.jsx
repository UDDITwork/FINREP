/**
 * FILE LOCATION: frontend/src/components/dashboard/MarketOverview.jsx
 * 
 * Comprehensive market overview component that displays trending stocks,
 * IPOs, and market data in an enterprise-style layout with real-time
 * data from the Indian Stock API.
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Loader2, Calendar, DollarSign, Activity } from 'lucide-react';
import { stockMarketAPI, formatCurrency, formatPercentage, getChangeColor, formatLargeNumber } from '../../services/stockMarketAPI';
import toast from 'react-hot-toast';

const MarketOverview = () => {
  const [marketData, setMarketData] = useState({
    trending: null,
    ipo: null,
    mostActive: null,
    priceShockers: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('trending');

  // Load market data
  const loadMarketData = async () => {
    setIsLoading(true);
    try {
      console.log('📊 [Market Overview] Loading market data...');
      
      const [trendingResult, ipoResult, mostActiveResult, shockersResult] = await Promise.allSettled([
        stockMarketAPI.getTrendingStocks(),
        stockMarketAPI.getIPOData(),
        stockMarketAPI.getMostActiveStocks('both'),
        stockMarketAPI.getPriceShockers()
      ]);

      const newMarketData = {
        trending: trendingResult.status === 'fulfilled' ? trendingResult.value : null,
        ipo: ipoResult.status === 'fulfilled' ? ipoResult.value : null,
        mostActive: mostActiveResult.status === 'fulfilled' ? mostActiveResult.value : null,
        priceShockers: shockersResult.status === 'fulfilled' ? shockersResult.value : null
      };

      setMarketData(newMarketData);
      setLastUpdated(new Date());
      
      console.log('✅ [Market Overview] Market data loaded successfully');
    } catch (error) {
      console.error('❌ [Market Overview] Error loading market data:', error);
      toast.error('Failed to load market data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadMarketData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadMarketData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Render trending stocks
  const renderTrendingStocks = () => {
    if (!marketData.trending?.success || !marketData.trending?.data) {
      return (
        <div className="text-center text-gray-500 py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No trending data available</p>
        </div>
      );
    }

    const trendingData = marketData.trending.data;
    // Ensure arrays with fallbacks
    const topGainers = Array.isArray(trendingData.topGainers) ? trendingData.topGainers : [];
    const topLosers = Array.isArray(trendingData.topLosers) ? trendingData.topLosers : [];

    return (
      <div className="space-y-6">
        {/* Top Gainers */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            Top Gainers
          </h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topGainers.length > 0 ? (
                    topGainers.slice(0, 5).map((stock, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{stock.companyName || stock.tickerId}</div>
                            <div className="text-xs text-gray-500">{stock.tickerId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(stock.currentPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-medium ${getChangeColor(stock.percentChange)}`}>
                            {formatPercentage(stock.percentChange || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">
                          {formatLargeNumber(stock.volume || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No gainers data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Losers */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
            Top Losers
          </h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topLosers.length > 0 ? (
                    topLosers.slice(0, 5).map((stock, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{stock.companyName || stock.tickerId}</div>
                            <div className="text-xs text-gray-500">{stock.tickerId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(stock.currentPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-medium ${getChangeColor(stock.percentChange)}`}>
                            {formatPercentage(stock.percentChange || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">
                          {formatLargeNumber(stock.volume || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No losers data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render IPO data
  const renderIPOData = () => {
    if (!marketData.ipo?.success || !marketData.ipo?.data) {
      return (
        <div className="text-center text-gray-500 py-8">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No IPO data available</p>
        </div>
      );
    }

    const ipoData = marketData.ipo.data;
    // Ensure arrays with fallbacks
    const upcomingIPOs = Array.isArray(ipoData.upcoming) ? ipoData.upcoming : [];
    const activeIPOs = Array.isArray(ipoData.active) ? ipoData.active : [];
    const listedIPOs = Array.isArray(ipoData.listed) ? ipoData.listed : [];

    return (
      <div className="space-y-6">
        {/* Active IPOs */}
        {activeIPOs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Activity className="w-5 h-5 text-green-600 mr-2" />
              Active IPOs
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lot Size</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeIPOs.slice(0, 5).map((ipo, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ipo.name}</div>
                            <div className="text-xs text-gray-500">{ipo.symbol}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {ipo.min_price && ipo.max_price ? 
                            `₹${ipo.min_price} - ₹${ipo.max_price}` : 
                            'TBA'
                          }
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">
                          {ipo.lot_size || 'TBA'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming IPOs */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            Upcoming IPOs
          </h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {upcomingIPOs.length > 0 ? (
                    upcomingIPOs.slice(0, 5).map((ipo, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ipo.name}</div>
                            <div className="text-xs text-gray-500">{ipo.symbol}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {ipo.expected_price || 'TBA'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">
                          {ipo.expected_date || 'TBA'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Upcoming
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No upcoming IPOs available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Listed IPOs */}
        {listedIPOs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
              Recently Listed
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Listing Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {listedIPOs.slice(0, 5).map((ipo, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ipo.name}</div>
                            <div className="text-xs text-gray-500">{ipo.symbol}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          ₹{ipo.listing_price || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          ₹{ipo.current_price || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (ipo.current_price > ipo.listing_price) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {ipo.current_price && ipo.listing_price ? 
                              `${((ipo.current_price - ipo.listing_price) / ipo.listing_price * 100).toFixed(2)}%` : 
                              'N/A'
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render most active stocks
  const renderMostActive = () => {
    if (!marketData.mostActive?.success || !marketData.mostActive?.data) {
      return (
        <div className="text-center text-gray-500 py-8">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No active stocks data available</p>
        </div>
      );
    }

    const activeData = marketData.mostActive.data;
    // Ensure nseActive and bseActive are arrays with fallbacks
    const nseActive = Array.isArray(activeData.nse) ? activeData.nse : [];
    const bseActive = Array.isArray(activeData.bse) ? activeData.bse : [];

    return (
      <div className="space-y-6">
        {/* NSE Most Active */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Activity className="w-5 h-5 text-blue-600 mr-2" />
            NSE Most Active
          </h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {nseActive.length > 0 ? (
                    nseActive.slice(0, 5).map((stock, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{stock.companyName || stock.tickerId}</div>
                            <div className="text-xs text-gray-500">{stock.tickerId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(stock.currentPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-medium ${getChangeColor(stock.percentChange)}`}>
                            {formatPercentage(stock.percentChange || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">
                          {formatLargeNumber(stock.volume || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No NSE data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BSE Most Active */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Activity className="w-5 h-5 text-green-600 mr-2" />
            BSE Most Active
          </h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bseActive.length > 0 ? (
                    bseActive.slice(0, 5).map((stock, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{stock.companyName || stock.tickerId}</div>
                            <div className="text-xs text-gray-500">{stock.tickerId}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(stock.currentPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-medium ${getChangeColor(stock.percentChange)}`}>
                            {formatPercentage(stock.percentChange || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">
                          {formatLargeNumber(stock.volume || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No BSE data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render price shockers
  const renderPriceShockers = () => {
    if (!marketData.priceShockers?.success || !marketData.priceShockers?.data) {
      return (
        <div className="text-center text-gray-500 py-8">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No price shockers data available</p>
        </div>
      );
    }

    const shockersData = marketData.priceShockers.data;
    // Ensure shockersData is an array
    const shockersArray = Array.isArray(shockersData) ? shockersData : [];

    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Activity className="w-5 h-5 text-red-600 mr-2" />
          Price Shockers
        </h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shockersArray.length > 0 ? (
                  shockersArray.slice(0, 10).map((stock, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{stock.companyName || stock.tickerId}</div>
                          <div className="text-xs text-gray-500">{stock.tickerId}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(stock.currentPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${getChangeColor(stock.percentChange)}`}>
                          {formatPercentage(stock.percentChange || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        {formatLargeNumber(stock.volume || 0)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No price shockers data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Tab configuration
  const tabs = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'ipo', label: 'IPOs', icon: Calendar },
    { id: 'active', label: 'Most Active', icon: Activity },
    { id: 'shockers', label: 'Price Shockers', icon: Activity }
  ];

  // Main render function with error boundary
  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'trending':
          return renderTrendingStocks();
        case 'ipo':
          return renderIPOData();
        case 'active':
          return renderMostActive();
        case 'shockers':
          return renderPriceShockers();
        default:
          return renderTrendingStocks();
      }
    } catch (error) {
      console.error('❌ [Market Overview] Error rendering content:', error);
      return (
        <div className="text-center text-red-500 py-8">
          <Activity className="w-12 h-12 mx-auto mb-4 text-red-300" />
          <p className="text-lg font-medium">Error Loading Market Data</p>
          <p className="text-sm text-gray-600 mt-2">There was an error rendering the market data. Please try refreshing.</p>
          <button 
            onClick={loadMarketData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Market Overview</h2>
            <p className="text-sm text-gray-600 mt-1">
              Real-time market data and trends
              {lastUpdated && (
                <span className="ml-2 text-xs text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={loadMarketData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading market data...</span>
          </div>
        ) : (
          <div>
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketOverview;
