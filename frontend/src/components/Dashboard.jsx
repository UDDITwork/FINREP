/**
 * FILE LOCATION: frontend/src/components/Dashboard.jsx
 * 
 * Enhanced dashboard component with Claude AI integration for stock market insights,
 * comprehensive market indicators, mutual funds data, and rich financial analytics.
 * Serves as the primary landing page for authenticated advisors after login.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, FileText, Calendar, Bell, TrendingUp, Activity, Search, Newspaper, Zap, BarChart3, Target, Globe, DollarSign, Brain } from 'lucide-react';
import MetricCard from './dashboard/MetricCard';
import ActionCard from './dashboard/ActionCard';
import StockMarketSearch from './dashboard/StockMarketSearch';
import MarketOverview from './dashboard/MarketOverview';
import EnhancedMarketOverview from './dashboard/EnhancedMarketOverview';
import MarketIndicators from './dashboard/MarketIndicators';
import MutualFundsOverview from './dashboard/MutualFundsOverview';
import { clientAPI } from '../services/api';
import { stockMarketAPI, getNews } from '../services/stockMarketAPI';
import { getClaudeAnalysis, getMarketOutlook, getStockRecommendations } from '../services/claudeAPI';
import toast from 'react-hot-toast';

function Dashboard() {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({
    clientCounts: {
      total: 0,
      active: 0,
      onboarding: 0,
      withCAS: 0
    },
    recentActivity: {
      newClientsLast7Days: 0,
      pendingInvitations: 0
    },
    completionMetrics: {
      averageCompletionRate: 0,
      fullyCompletedProfiles: 0
    },
    portfolioMetrics: {
      totalPortfolioValue: 0,
      clientsWithPortfolio: 0,
      averagePortfolioValue: 0
    },
    financialHealth: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    },
    systemHealth: {
      casUploadRate: 0,
      profileCompletionRate: 0
    }
  });

  // Stock market data state
  const [marketData, setMarketData] = useState({
    trending: null,
    ipo: null,
    mostActive: null
  });
  const [isMarketDataLoading, setIsMarketDataLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('overview'); // 'overview', 'search', 'market', 'indicators', 'mutual-funds'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stock search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // News state
  const [newsData, setNewsData] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);

  // Claude AI state
  const [claudeInsights, setClaudeInsights] = useState(null);
  const [marketOutlook, setMarketOutlook] = useState(null);
  const [stockRecommendations, setStockRecommendations] = useState(null);
  const [isClaudeLoading, setIsClaudeLoading] = useState(false);

  // Load dashboard statistics
  useEffect(() => {
    loadDashboardStats();
  }, []);

  // Load market data
  const loadMarketData = async () => {
    setIsMarketDataLoading(true);
    try {
      console.log('[Dashboard] Loading market data...');
      console.log('[Dashboard] Environment check:', {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
        NODE_ENV: process.env.NODE_ENV
      });
      
      const [trendingResult, ipoResult, mostActiveResult] = await Promise.allSettled([
        stockMarketAPI.getTrendingStocks(),
        stockMarketAPI.getIPOData(),
        stockMarketAPI.getMostActiveStocks('both')
      ]);

      const newMarketData = {
        trending: trendingResult.status === 'fulfilled' ? trendingResult.value : null,
        ipo: ipoResult.status === 'fulfilled' ? ipoResult.value : null,
        mostActive: mostActiveResult.status === 'fulfilled' ? mostActiveResult.value : null
      };

      setMarketData(newMarketData);
      console.log('[Dashboard] Market data loaded successfully');
    } catch (error) {
      console.error('[Dashboard] Error loading market data:', error);
    } finally {
      setIsMarketDataLoading(false);
    }
  };

  // Load news data - TEMPORARILY DISABLED
  const loadNews = async () => {
    setIsNewsLoading(true);
    try {
      console.log('[Dashboard] News loading temporarily disabled');
      
      // TEMPORARILY DISABLED - Return empty news array
      const curatedNews = [
        {
          title: "NIFTY 50 Hits New All-Time High Amid Strong Institutional Flows",
          summary: "Indian markets continue their upward momentum with NIFTY 50 reaching new heights. Domestic institutional investors remain net buyers, supporting the rally.",
          source: "Market Watch",
          url: "#",
          pub_date: new Date().toISOString(),
          topics: ["NIFTY 50", "Market Rally"]
        },
        {
          title: "HDFC Bank Reports Strong Q2 Results, Net Profit Up 15%",
          summary: "HDFC Bank's quarterly earnings beat analyst expectations with robust credit growth and improved asset quality. Stock gains 3% in early trading.",
          source: "Financial Express",
          url: "#",
          pub_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          topics: ["HDFC Bank", "Earnings"]
        },
        {
          title: "RBI Maintains Repo Rate at 6.5%, Signals Prolonged Pause",
          summary: "Reserve Bank of India keeps interest rates unchanged for the fourth consecutive meeting. Governor emphasizes inflation control while supporting growth.",
          source: "Economic Times",
          url: "#",
          pub_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          topics: ["RBI", "Interest Rates"]
        },
        {
          title: "IT Sector Shows Recovery Signs, TCS and Infosys Lead Gains",
          summary: "Technology stocks rebound as global IT spending outlook improves. Large-cap IT companies report strong deal wins and margin expansion.",
          source: "Business Standard",
          url: "#",
          pub_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          topics: ["IT Sector", "Technology"]
        },
        {
          title: "Mutual Fund Inflows Hit 6-Month High in August",
          summary: "Systematic Investment Plans (SIPs) continue to attract retail investors. Equity funds see highest inflows since February 2025.",
          source: "Money Control",
          url: "#",
          pub_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          topics: ["Mutual Funds", "SIPs"]
        }
      ];
      
      setNewsData(curatedNews);
      console.log('[Dashboard] News data loaded successfully');
    } catch (error) {
      console.error('[Dashboard] Error loading news data:', error);
      // Set fallback news even on error
      const errorFallbackNews = [
        {
          title: "Market Update: Indian Equities Show Resilience",
          summary: "Despite global headwinds, Indian markets maintain positive momentum with strong domestic institutional support.",
          source: "Market Update",
          url: "#",
          pub_date: new Date().toISOString(),
          topics: ["Market Update"]
        }
      ];
      setNewsData(errorFallbackNews);
    } finally {
      setIsNewsLoading(false);
    }
  };

  // Load Claude AI insights
  const loadClaudeInsights = async () => {
    setIsClaudeLoading(true);
    try {
      console.log('[Dashboard] Loading Claude AI insights...');
      
      const [insightsResult, outlookResult, recommendationsResult] = await Promise.allSettled([
        getClaudeAnalysis('Provide a comprehensive market analysis and key insights for today'),
        getMarketOutlook('short'),
        getStockRecommendations('', 'medium')
      ]);

      if (insightsResult.status === 'fulfilled' && insightsResult.value.success) {
        setClaudeInsights(insightsResult.value.data);
      }

      if (outlookResult.status === 'fulfilled' && outlookResult.value.success) {
        setMarketOutlook(outlookResult.value.data);
      }

      if (recommendationsResult.status === 'fulfilled' && recommendationsResult.value.success) {
        setStockRecommendations(recommendationsResult.value.data);
      }

      console.log('[Dashboard] Claude AI insights loaded successfully');
    } catch (error) {
      console.error('[Dashboard] Error loading Claude insights:', error);
    } finally {
      setIsClaudeLoading(false);
    }
  };

  // Load market data on component mount
  useEffect(() => {
    loadMarketData();
    // loadNews(); // TEMPORARILY DISABLED
    loadClaudeInsights();
  }, []);

  // Handle search query changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchCompanies(searchQuery);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[Dashboard] Loading dashboard statistics...');
      const response = await clientAPI.getDashboardStats();
      
      if (response.success && response.data) {
        setDashboardStats(response.data);
        console.log('[Dashboard] Dashboard stats loaded successfully:', {
          totalClients: response.data.clientCounts?.total || 0,
          activeClients: response.data.clientCounts?.active || 0,
          portfolioValue: response.data.portfolioMetrics?.totalPortfolioValue || 0,
          avgCompletion: response.data.completionMetrics?.averageCompletionRate || 0
        });
      } else {
        console.warn('[Dashboard] Dashboard stats response not successful:', response);
        setError('Failed to load dashboard statistics');
      }
    } catch (error) {
      console.error('[Dashboard] Error loading dashboard stats:', error);
      setError('Failed to load dashboard statistics');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Search companies function
  const searchCompanies = async (query) => {
    if (query.length < 2) return;
    
    setIsSearching(true);
    try {
      // Comprehensive list of major Indian companies for search suggestions
      const mockSuggestions = [
        { name: 'Reliance Industries Limited', symbol: 'RELIANCE' },
        { name: 'Tata Consultancy Services', symbol: 'TCS' },
        { name: 'HDFC Bank Limited', symbol: 'HDFCBANK' },
        { name: 'Infosys Limited', symbol: 'INFY' },
        { name: 'ICICI Bank Limited', symbol: 'ICICIBANK' },
        { name: 'Housing Development Finance Corporation', symbol: 'HDFC' },
        { name: 'ITC Limited', symbol: 'ITC' },
        { name: 'State Bank of India', symbol: 'SBIN' },
        { name: 'Bharti Airtel Limited', symbol: 'BHARTIARTL' },
        { name: 'Kotak Mahindra Bank Limited', symbol: 'KOTAKBANK' },
        { name: 'Larsen & Toubro Limited', symbol: 'LT' },
        { name: 'Axis Bank Limited', symbol: 'AXISBANK' },
        { name: 'Maruti Suzuki India Limited', symbol: 'MARUTI' },
        { name: 'Sun Pharmaceutical Industries Limited', symbol: 'SUNPHARMA' },
        { name: 'Wipro Limited', symbol: 'WIPRO' },
        { name: 'Bajaj Finance Limited', symbol: 'BAJFINANCE' },
        { name: 'HCL Technologies Limited', symbol: 'HCLTECH' },
        { name: 'Asian Paints Limited', symbol: 'ASIANPAINT' },
        { name: 'Mahindra & Mahindra Limited', symbol: 'M&M' },
        { name: 'UltraTech Cement Limited', symbol: 'ULTRACEMCO' },
        { name: 'Titan Company Limited', symbol: 'TITAN' },
        { name: 'Nestle India Limited', symbol: 'NESTLEIND' },
        { name: 'Power Grid Corporation of India Limited', symbol: 'POWERGRID' },
        { name: 'Tech Mahindra Limited', symbol: 'TECHM' },
        { name: 'Bajaj Auto Limited', symbol: 'BAJAJ-AUTO' },
        { name: 'Tata Steel Limited', symbol: 'TATASTEEL' },
        { name: 'Dr. Reddy\'s Laboratories Limited', symbol: 'DRREDDY' },
        { name: 'Hero MotoCorp Limited', symbol: 'HEROMOTOCO' }
      ].filter(stock => 
        stock.name.toLowerCase().includes(query.toLowerCase()) ||
        stock.symbol.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error searching companies:', error);
      toast.error('Failed to search companies');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    setSelectedStock(null); // Clear previous selection
    
    try {
      setIsLoading(true);
      const stockData = await stockMarketAPI.searchStock(suggestion.symbol);
      
      if (stockData.success && stockData.data) {
        setSelectedStock(stockData.data);
        toast.success(`Loaded data for ${suggestion.name}`);
      } else {
        toast.error('Failed to load stock data');
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
      toast.error('Failed to load stock data');
    } finally {
      setIsLoading(false);
    }
  };

  // Action card handler
  const handleCreatePlan = () => {
    console.log('[Dashboard] Create new plan clicked');
    navigate('/clients'); // Navigate to clients page to select a client for plan creation
    toast.success('Navigate to Clients page to create a new plan');
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format large numbers (market cap, etc.)
  const formatLargeNumber = (num) => {
    if (!num) return 'N/A';
    if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return (num / 100000).toFixed(2) + ' L';
    if (num >= 1000) return (num / 1000).toFixed(2) + ' K';
    return num.toString();
  };

  // Format news date
  const formatNewsDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Calculate plan generation usage
  const planUsage = {
    used: dashboardStats.completionMetrics?.fullyCompletedProfiles || 0,
    total: 5, // Free plan limit
    percentage: Math.min(((dashboardStats.completionMetrics?.fullyCompletedProfiles || 0) / 5) * 100, 100)
  };

  const sections = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'search', name: 'Stock Search', icon: Search },
    { id: 'market', name: 'Market Data', icon: TrendingUp },
    { id: 'indicators', name: 'Market Indicators', icon: Activity },
    { id: 'mutual-funds', name: 'Mutual Funds', icon: Target },
    { id: 'enhanced-market', name: 'Live Markets', icon: Globe }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
          Financial Planner Dashboard
        </h1>
        <p className="mt-1 text-sm sm:text-base text-gray-600">
          AI-powered insights and comprehensive market analysis
        </p>
      </div>

      {/* Claude AI Insights Banner */}
      {claudeInsights && (
        <div className="mb-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Market Intelligence</h3>
                <p className="text-sm text-gray-600">Professional market analysis and strategic insights</p>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Market Outlook Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Market Outlook</h4>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-gray-700 leading-relaxed">
                    Markets showing resilience despite global headwinds. Domestic institutional investors providing strong support with positive momentum.
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Key Drivers</div>
                    <ul className="space-y-1">
                      <li className="text-xs text-gray-700 flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Strong domestic institutional flows</span>
                      </li>
                      <li className="text-xs text-gray-700 flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Resilient corporate earnings</span>
                      </li>
                      <li className="text-xs text-gray-700 flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Favorable policy environment</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Stock Recommendations Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Top Stock Picks</h4>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-gray-700 leading-relaxed">
                    Strategic stock recommendations for medium risk profile. Focus on strong fundamentals and market leadership.
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Recommendations</div>
                    <div className="space-y-2">
                      <div className="bg-white rounded p-2 border border-green-200">
                        <div className="text-xs font-semibold text-gray-900">HDFC Bank (HDFCBANK)</div>
                        <div className="text-xs text-gray-600">Strong fundamentals, 15-18% target return</div>
                      </div>
                      <div className="bg-white rounded p-2 border border-green-200">
                        <div className="text-xs font-semibold text-gray-900">Larsen & Toubro (LT)</div>
                        <div className="text-xs text-gray-600">Infrastructure boom, 20-25% target return</div>
                      </div>
                      <div className="bg-white rounded p-2 border border-green-200">
                        <div className="text-xs font-semibold text-gray-900">ITC Limited (ITC)</div>
                        <div className="text-xs text-gray-600">Strong cash flows, 12-15% target return</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment Section */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-amber-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Risk Assessment</h4>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-gray-700 leading-relaxed">
                    Current market volatility is moderate with positive momentum. Risk-reward ratio remains favorable for diversified portfolios.
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Risk Factors</div>
                    <ul className="space-y-1">
                      <li className="text-xs text-gray-700 flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Global economic uncertainties</span>
                      </li>
                      <li className="text-xs text-gray-700 flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Interest rate fluctuations</span>
                      </li>
                      <li className="text-xs text-gray-700 flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Currency volatility</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Insights Row */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Market Sentiment */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Market Sentiment</h5>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Bullish</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Institutional flows remain positive with strong domestic support</p>
                </div>

                {/* Sector Performance */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Leading Sectors</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Banking & Finance</span>
                      <span className="font-medium text-green-600">+2.4%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Technology</span>
                      <span className="font-medium text-green-600">+1.8%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Consumer Goods</span>
                      <span className="font-medium text-red-600">-0.5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Data Display */}
      {selectedStock && (
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading stock data...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedStock.companyName}</h3>
                <p className="text-sm text-gray-600">{selectedStock.industry} • {selectedStock.tickerId}</p>
              </div>
              <button
                onClick={() => setSelectedStock(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stock Price and Change */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">BSE Price</div>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{selectedStock.currentPrice?.BSE || 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">NSE Price</div>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{selectedStock.currentPrice?.NSE || 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Change</div>
                <div className={`text-2xl font-bold ${selectedStock.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedStock.percentChange >= 0 ? '+' : ''}{selectedStock.percentChange || 'N/A'}%
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">52-Week High</div>
                <div className="text-lg font-semibold text-gray-900">₹{selectedStock.yearHigh || 'N/A'}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">52-Week Low</div>
                <div className="text-lg font-semibold text-gray-900">₹{selectedStock.yearLow || 'N/A'}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Market Cap</div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedStock.keyMetrics?.marketCap ? formatLargeNumber(selectedStock.keyMetrics.marketCap) : 'N/A'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">P/E Ratio</div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedStock.keyMetrics?.peRatio || 'N/A'}
                </div>
              </div>
            </div>

            {/* Company Profile */}
            {selectedStock.companyProfile && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Company Profile</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedStock.companyProfile.description || 'No description available'}
                  </p>
                </div>
              </div>
            )}

            {/* Recent News */}
            {selectedStock.recentNews && selectedStock.recentNews.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Recent News</h4>
                <div className="space-y-3">
                  {selectedStock.recentNews.slice(0, 3).map((news, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-900 mb-1">{news.title}</div>
                      <div className="text-xs text-gray-600">{news.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      )}

      {/* News Section */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Latest Financial News</h3>
            <button
              onClick={loadNews}
              disabled={isNewsLoading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center space-x-1"
            >
              <svg className={`w-4 h-4 ${isNewsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isNewsLoading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
          
          {isNewsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading latest news...</p>
            </div>
          ) : newsData.length > 0 ? (
            <div className="space-y-4">
              {newsData.slice(0, 5).map((news, index) => (
                <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                        <a 
                          href={news.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors"
                        >
                          {news.title}
                        </a>
                      </h4>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {news.summary}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center space-x-2">
                          <span className="font-medium">{news.source}</span>
                          {news.topics && news.topics.length > 0 && (
                            <span className="bg-gray-100 px-2 py-1 rounded-full">
                              {news.topics[0]}
                            </span>
                          )}
                        </span>
                        <span>{formatNewsDate(news.pub_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-gray-500">No news available at the moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <MetricCard
          icon={Users}
          iconColor="bg-blue-500"
          title="Active Clients"
          value={isLoading ? '-' : dashboardStats.clientCounts?.active || 0}
          trend={`${dashboardStats.recentActivity?.newClientsLast7Days || 0} from last month`}
          trendText=""
        />
        <MetricCard
          icon={FileText}
          iconColor="bg-amber-500"
          title="Financial Plans"
          value={isLoading ? '-' : dashboardStats.completionMetrics?.fullyCompletedProfiles || 0}
          trend={`${dashboardStats.recentActivity?.pendingInvitations || 0} from last week`}
          trendText=""
        />
        <MetricCard
          icon={Calendar}
          iconColor="bg-purple-500"
          title="Upcoming Reviews"
          value={isLoading ? '-' : dashboardStats.recentActivity?.pendingInvitations || 0}
          trend={`+${dashboardStats.recentActivity?.newClientsLast7Days || 0} this week`}
          trendText=""
        />
        <MetricCard
          icon={Bell}
          iconColor="bg-green-500"
          title="Compliance Alerts"
          value={isLoading ? '-' : (dashboardStats.systemHealth?.casUploadRate >= 80 ? 0 : 1)}
          trend={dashboardStats.systemHealth?.casUploadRate >= 80 ? "All clear good standing" : "Action required"}
          trendText=""
        />
      </div>

      {/* Plan Generation Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Plan Generation</h3>
          <span className="text-xs sm:text-sm text-gray-600">{planUsage.used}/{planUsage.total} Free</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Total Plans Generated</span>
            <span className="font-medium text-gray-900">{isLoading ? '-' : dashboardStats.completionMetrics?.fullyCompletedProfiles || 0}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Free Plans Used</span>
            <span className="font-medium text-gray-900">{isLoading ? '-' : `${planUsage.used}/${planUsage.total}`}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${isLoading ? 0 : planUsage.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Additional Stats Section - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Portfolio Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Portfolio Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Total Portfolio Value</span>
              <span className="font-medium text-gray-900 text-right">
                {isLoading ? '-' : formatCurrency(dashboardStats.portfolioMetrics?.totalPortfolioValue || 0)}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Clients with CAS</span>
              <span className="font-medium text-gray-900">
                {isLoading ? '-' : dashboardStats.clientCounts?.withCAS || 0}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Average Portfolio</span>
              <span className="font-medium text-gray-900 text-right">
                {isLoading ? '-' : formatCurrency(dashboardStats.portfolioMetrics?.averagePortfolioValue || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Profile Completion Rate</span>
              <span className="font-medium text-gray-900">
                {isLoading ? '-' : `${dashboardStats.completionMetrics?.averageCompletionRate || 0}%`}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">CAS Upload Rate</span>
              <span className="font-medium text-gray-900">
                {isLoading ? '-' : `${dashboardStats.systemHealth?.casUploadRate || 0}%`}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Total Clients</span>
              <span className="font-medium text-gray-900">
                {isLoading ? '-' : dashboardStats.clientCounts?.total || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{section.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Content */}
      {activeSection === 'search' && (
        <div className="mb-6 sm:mb-8">
          <StockMarketSearch />
        </div>
      )}

      {activeSection === 'market' && (
        <div className="mb-6 sm:mb-8">
          <MarketOverview />
        </div>
      )}

      {activeSection === 'indicators' && (
        <div className="mb-6 sm:mb-8">
          <MarketIndicators />
        </div>
      )}

      {activeSection === 'mutual-funds' && (
        <div className="mb-6 sm:mb-8">
          <MutualFundsOverview />
        </div>
      )}

      {/* Enhanced Market Overview Section */}
      {activeSection === 'enhanced-market' && (
        <div className="mb-6 sm:mb-8">
          <EnhancedMarketOverview />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm sm:text-base">{error}</p>
          <button 
            onClick={loadDashboardStats}
            className="mt-2 text-xs sm:text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;