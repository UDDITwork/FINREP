// Location: frontend/src/components/casManagement/ClientFinancialCharts.jsx

import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, RadialBarChart, RadialBar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Building2, FileText, Calendar, 
  PieChart as PieChartIcon, BarChart3, Activity, Target, Zap 
} from 'lucide-react';

const ClientFinancialCharts = ({ client, casDetails }) => {
  const [chartData, setChartData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (client && casDetails) {
      prepareChartData();
    }
  }, [client, casDetails]);

  const prepareChartData = () => {
    if (!casDetails) return;

    // Portfolio Allocation Data
    const portfolioData = [];
    let totalValue = 0;

    // Add Demat Account Holdings
    if (casDetails.accounts?.dematAccounts?.holdings) {
      casDetails.accounts.dematAccounts.holdings.forEach(holding => {
        const value = parseFloat(holding.value) || 0;
        totalValue += value;
        portfolioData.push({
          name: holding.symbol || 'Unknown',
          value: value,
          type: 'Equity',
          category: 'Demat Holdings'
        });
      });
    }

    // Add Mutual Fund Holdings
    if (casDetails.accounts?.mutualFunds?.folios) {
      casDetails.accounts.mutualFunds.folios.forEach(folio => {
        const value = parseFloat(folio.value) || 0;
        totalValue += value;
        portfolioData.push({
          name: folio.amc || 'Unknown AMC',
          value: value,
          type: 'Mutual Fund',
          category: 'MF Holdings'
        });
      });
    }

    // Group by type for pie chart
    const typeData = portfolioData.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = { name: item.type, value: 0, count: 0 };
      }
      acc[item.type].value += item.value;
      acc[item.type].count += 1;
      return acc;
    }, {});

    // Top 10 holdings for bar chart
    const topHoldings = portfolioData
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Performance trend data (simulated based on current data)
    const performanceData = generatePerformanceData(portfolioData);

    // Risk analysis data
    const riskData = generateRiskData(portfolioData);

    setChartData({
      portfolioData,
      typeData: Object.values(typeData),
      topHoldings,
      performanceData,
      riskData,
      totalValue,
      summary: {
        totalHoldings: portfolioData.length,
        equityValue: typeData['Equity']?.value || 0,
        mfValue: typeData['Mutual Fund']?.value || 0,
        avgHoldingValue: totalValue / portfolioData.length || 0
      }
    });
  };

  const generatePerformanceData = (holdings) => {
    // Simulate performance data based on holdings
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => {
      const baseValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      return {
        month,
        value: baseValue * (1 + variation),
        equity: (baseValue * 0.6) * (1 + variation * 1.2),
        mf: (baseValue * 0.4) * (1 + variation * 0.8)
      };
    });
  };

  const generateRiskData = (holdings) => {
    // Generate risk analysis data
    const riskCategories = [
      { name: 'Low Risk', value: 25, fill: '#10B981' },
      { name: 'Medium Risk', value: 45, fill: '#F59E0B' },
      { name: 'High Risk', value: 30, fill: '#EF4444' }
    ];
    return riskCategories;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value, total) => {
    return ((value / total) * 100).toFixed(1);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1'];

  if (!chartData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Financial Analytics - {client.firstName} {client.lastName}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Portfolio Value: {formatCurrency(chartData.totalValue)}
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: PieChartIcon },
            { id: 'holdings', label: 'Holdings', icon: BarChart3 },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'risk', label: 'Risk Analysis', icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-1" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Holdings</p>
              <p className="text-2xl font-bold text-blue-900">{chartData.summary.totalHoldings}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Equity Value</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(chartData.summary.equityValue)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">MF Value</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(chartData.summary.mfValue)}</p>
            </div>
            <Building2 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Avg Holding</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(chartData.summary.avgHoldingValue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Allocation Pie Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Allocation</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Distribution */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={chartData.riskData}>
                  <RadialBar minAngle={15} background clockWise={true} dataKey="value" />
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'holdings' && (
          <div className="space-y-6">
            {/* Top Holdings Bar Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Holdings</h4>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.topHoldings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Holdings Table */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">All Holdings</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Portfolio</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {chartData.portfolioData.slice(0, 10).map((holding, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{holding.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{holding.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(holding.value)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPercentage(holding.value, chartData.totalValue)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Performance Trend */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Performance Trend</h4>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData.performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="value" stackId="1" stroke="#8884d8" fill="#8884d8" name="Total Portfolio" />
                  <Area type="monotone" dataKey="equity" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Equity" />
                  <Area type="monotone" dataKey="mf" stackId="3" stroke="#ffc658" fill="#ffc658" name="Mutual Funds" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Best Performer</p>
                    <p className="text-lg font-bold text-green-900">
                      {chartData.topHoldings[0]?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Portfolio Diversity</p>
                    <p className="text-lg font-bold text-blue-900">
                      {chartData.portfolioData.length} Holdings
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Asset Allocation</p>
                    <p className="text-lg font-bold text-purple-900">
                      {formatPercentage(chartData.summary.equityValue, chartData.totalValue)}% Equity
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="space-y-6">
            {/* Risk Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Risk Profile</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={chartData.riskData}>
                    <RadialBar minAngle={15} background clockWise={true} dataKey="value" />
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Risk Metrics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Concentration Risk</span>
                    <span className="text-sm font-semibold text-yellow-600">Medium</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Diversification Score</span>
                    <span className="text-sm font-semibold text-green-600">7.5/10</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Volatility Index</span>
                    <span className="text-sm font-semibold text-blue-600">Moderate</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Risk-Adjusted Return</span>
                    <span className="text-sm font-semibold text-purple-600">Good</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Recommendations */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Risk Management Recommendations
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-blue-800">
                  • Consider increasing exposure to large-cap stocks for better stability
                </p>
                <p className="text-sm text-blue-800">
                  • Diversify across more sectors to reduce concentration risk
                </p>
                <p className="text-sm text-blue-800">
                  • Review mutual fund allocation to ensure optimal asset mix
                </p>
                <p className="text-sm text-blue-800">
                  • Monitor portfolio rebalancing needs quarterly
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientFinancialCharts;
