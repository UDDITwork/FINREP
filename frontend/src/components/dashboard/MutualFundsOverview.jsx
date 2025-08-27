/**
 * FILE LOCATION: frontend/src/components/dashboard/MutualFundsOverview.jsx
 * 
 * Comprehensive mutual funds overview component that displays
 * top performing funds, fund categories, and Claude AI analysis
 * for investment recommendations.
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Star, Award, Target, Zap, BarChart3, DollarSign, Percent, ArrowUpRight, ArrowDownRight, Minus, Filter } from 'lucide-react';
import { getMutualFunds } from '../../services/stockMarketAPI';
import { getMutualFundAnalysis } from '../../services/claudeAPI';
import toast from 'react-hot-toast';

const MutualFundsOverview = () => {
  const [mutualFunds, setMutualFunds] = useState({
    topPerformers: [
      {
        name: 'Axis Bluechip Fund Direct Growth',
        category: 'Large Cap',
        nav: 45.25,
        change: 1.25,
        changePercent: 2.84,
        oneYear: 18.5,
        threeYear: 12.8,
        fiveYear: 15.2,
        rating: 4.5,
        aum: 8500,
        expense: 1.25,
        risk: 'Moderate',
        trend: 'up'
      },
      {
        name: 'HDFC Mid-Cap Opportunities Fund',
        category: 'Mid Cap',
        nav: 78.50,
        change: -0.75,
        changePercent: -0.95,
        oneYear: 22.3,
        threeYear: 18.7,
        fiveYear: 20.1,
        rating: 4.3,
        aum: 12500,
        expense: 1.45,
        risk: 'High',
        trend: 'down'
      },
      {
        name: 'SBI Small Cap Fund Direct Growth',
        category: 'Small Cap',
        nav: 125.75,
        change: 2.25,
        changePercent: 1.82,
        oneYear: 28.9,
        threeYear: 25.4,
        fiveYear: 22.8,
        rating: 4.7,
        aum: 6800,
        expense: 1.65,
        risk: 'Very High',
        trend: 'up'
      },
      {
        name: 'ICICI Prudential Technology Fund',
        category: 'Sectoral',
        nav: 95.25,
        change: 3.50,
        changePercent: 3.82,
        oneYear: 35.2,
        threeYear: 28.9,
        fiveYear: 25.6,
        rating: 4.2,
        aum: 4200,
        expense: 1.85,
        risk: 'High',
        trend: 'up'
      },
      {
        name: 'Kotak Emerging Equity Fund',
        category: 'Multi Cap',
        nav: 65.80,
        change: 1.20,
        changePercent: 1.86,
        oneYear: 24.7,
        threeYear: 20.3,
        fiveYear: 18.9,
        rating: 4.4,
        aum: 9200,
        expense: 1.35,
        risk: 'Moderate',
        trend: 'up'
      }
    ],
    categories: {
      largeCap: { count: 45, avgReturn: 15.2, risk: 'Low' },
      midCap: { count: 38, avgReturn: 18.7, risk: 'Moderate' },
      smallCap: { count: 32, avgReturn: 22.4, risk: 'High' },
      multiCap: { count: 28, avgReturn: 17.8, risk: 'Moderate' },
      sectoral: { count: 25, avgReturn: 25.3, risk: 'High' },
      index: { count: 18, avgReturn: 12.5, risk: 'Low' },
      debt: { count: 42, avgReturn: 8.2, risk: 'Very Low' },
      hybrid: { count: 35, avgReturn: 11.8, risk: 'Low' }
    },
    marketTrends: {
      totalAum: 450000,
      monthlyInflow: 8500,
      sipContribution: 12500,
      folioGrowth: 8.5
    }
  });

  const [claudeAnalysis, setClaudeAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('performance');

  // Load Claude AI analysis
  useEffect(() => {
    loadClaudeAnalysis();
  }, []);

  const loadClaudeAnalysis = async () => {
    try {
      setIsLoading(true);
      const analysis = await getMutualFundAnalysis('equity');
      
      if (analysis.success) {
        setClaudeAnalysis(analysis.data);
      }
    } catch (error) {
      console.error('Error loading Claude analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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

  // Get risk color
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Very Low':
        return 'text-green-600 bg-green-50';
      case 'Low':
        return 'text-blue-600 bg-blue-50';
      case 'Moderate':
        return 'text-yellow-600 bg-yellow-50';
      case 'High':
        return 'text-orange-600 bg-orange-50';
      case 'Very High':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  // Filter funds by category
  const filteredFunds = activeCategory === 'all' 
    ? mutualFunds.topPerformers 
    : mutualFunds.topPerformers.filter(fund => fund.category === activeCategory);

  // Sort funds
  const sortedFunds = [...filteredFunds].sort((a, b) => {
    switch (sortBy) {
      case 'performance':
        return b.oneYear - a.oneYear;
      case 'rating':
        return b.rating - a.rating;
      case 'aum':
        return b.aum - a.aum;
      case 'expense':
        return a.expense - b.expense;
      default:
        return 0;
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
             {/* Header */}
       <div className="p-6 border-b border-gray-200">
         <div>
           <h3 className="text-lg font-semibold text-gray-900">Mutual Funds Overview</h3>
           <p className="text-sm text-gray-600">Top performing funds and investment insights</p>
         </div>
       </div>

             {/* Investment Analysis */}
       {claudeAnalysis && (
         <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
           <div className="flex items-start space-x-3">
             <div className="flex-shrink-0">
               <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                 <Award className="w-4 h-4 text-white" />
               </div>
             </div>
             <div>
               <h4 className="font-semibold text-gray-900 mb-2">Investment Analysis</h4>
               <p className="text-sm text-gray-700 leading-relaxed">
                 {claudeAnalysis.analysis || 'Mutual fund analysis and investment recommendations.'}
               </p>
               {claudeAnalysis.recommendations && (
                 <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                   <h5 className="font-medium text-gray-900 mb-1">Investment Tips:</h5>
                   <ul className="text-sm text-gray-700 space-y-1">
                     {claudeAnalysis.recommendations.map((rec, index) => (
                       <li key={index} className="flex items-start space-x-2">
                         <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
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

      {/* Market Trends */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Market Trends</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total AUM</div>
            <div className="text-xl font-bold text-blue-600">
              ₹{formatLargeNumber(mutualFunds.marketTrends.totalAum)} Cr
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Monthly Inflow</div>
            <div className="text-xl font-bold text-green-600">
              ₹{formatLargeNumber(mutualFunds.marketTrends.monthlyInflow)} Cr
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">SIP Contribution</div>
            <div className="text-xl font-bold text-purple-600">
              ₹{formatLargeNumber(mutualFunds.marketTrends.sipContribution)} Cr
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Folio Growth</div>
            <div className="text-xl font-bold text-orange-600">
              +{mutualFunds.marketTrends.folioGrowth}%
            </div>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Category Performance</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(mutualFunds.categories).map(([category, data]) => (
            <div key={category} className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900 capitalize mb-2">
                {category.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                {data.count} Funds
              </div>
              <div className="text-sm text-green-600 font-medium">
                {data.avgReturn}% Avg Return
              </div>
              <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getRiskColor(data.risk)}`}>
                {data.risk} Risk
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Category:</span>
            </div>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="Large Cap">Large Cap</option>
              <option value="Mid Cap">Mid Cap</option>
              <option value="Small Cap">Small Cap</option>
              <option value="Multi Cap">Multi Cap</option>
              <option value="Sectoral">Sectoral</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="performance">Performance</option>
              <option value="rating">Rating</option>
              <option value="aum">AUM</option>
              <option value="expense">Expense Ratio</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Performing Funds */}
      <div className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Top Performing Funds</h4>
        <div className="space-y-4">
          {sortedFunds.map((fund, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-semibold text-gray-900">{fund.name}</h5>
                    <div className="flex items-center space-x-1">
                      {renderStars(fund.rating)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="capitalize">{fund.category}</span>
                    <span>•</span>
                    <span>NAV: ₹{fund.nav}</span>
                    <span>•</span>
                    <span>AUM: ₹{formatLargeNumber(fund.aum)} Cr</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getTrendColor(fund.trend)}`}>
                    {fund.change >= 0 ? '+' : ''}{fund.changePercent}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {fund.change >= 0 ? '+' : ''}₹{fund.change}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">1 Year</div>
                  <div className="font-semibold text-gray-900">{fund.oneYear}%</div>
                </div>
                <div>
                  <div className="text-gray-600">3 Year</div>
                  <div className="font-semibold text-gray-900">{fund.threeYear}%</div>
                </div>
                <div>
                  <div className="text-gray-600">5 Year</div>
                  <div className="font-semibold text-gray-900">{fund.fiveYear}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Expense Ratio</div>
                  <div className="font-semibold text-gray-900">{fund.expense}%</div>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <div className={`text-xs px-2 py-1 rounded-full ${getRiskColor(fund.risk)}`}>
                  {fund.risk} Risk
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MutualFundsOverview;
