// Location: frontend/src/components/meetings/MeetingAnalytics.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  Video, 
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { meetingAPI } from '../../services/api';

const MeetingAnalytics = () => {
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'quarter'

  // Load meetings data
  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await meetingAPI.getAdvisorMeetings({ limit: 1000 });
      setMeetings(response.meetings || []);
    } catch (error) {
      console.error('Failed to load meetings for analytics:', error);
      setError('Failed to load meeting data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!meetings.length) return {};

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter meetings based on time range
    const filterDate = (date) => {
      const meetingDate = new Date(date);
      switch (timeRange) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return meetingDate >= weekAgo;
        case 'month':
          return meetingDate.getMonth() === currentMonth && meetingDate.getFullYear() === currentYear;
        case 'quarter':
          const quarterStart = new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1);
          return meetingDate >= quarterStart;
        default:
          return true;
      }
    };

    const filteredMeetings = meetings.filter(meeting => 
      filterDate(meeting.scheduledAt || meeting.createdAt)
    );

    // Status distribution
    const statusCounts = filteredMeetings.reduce((acc, meeting) => {
      acc[meeting.status] = (acc[meeting.status] || 0) + 1;
      return acc;
    }, {});

    // Meeting type distribution
    const typeCounts = filteredMeetings.reduce((acc, meeting) => {
      acc[meeting.meetingType] = (acc[meeting.meetingType] || 0) + 1;
      return acc;
    }, {});

    // Daily meeting trends
    const dailyTrends = filteredMeetings.reduce((acc, meeting) => {
      const date = new Date(meeting.scheduledAt || meeting.createdAt).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Weekly trends
    const weeklyTrends = filteredMeetings.reduce((acc, meeting) => {
      const date = new Date(meeting.scheduledAt || meeting.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toDateString();
      acc[weekKey] = (acc[weekKey] || 0) + 1;
      return acc;
    }, {});

    // Transcription statistics
    const transcriptionStats = filteredMeetings.reduce((acc, meeting) => {
      if (meeting.transcript?.status === 'completed') {
        acc.completed += 1;
      } else if (meeting.transcript?.status === 'active') {
        acc.active += 1;
      } else {
        acc.notStarted += 1;
      }
      return acc;
    }, { completed: 0, active: 0, notStarted: 0 });

    // Duration analysis
    const durations = filteredMeetings
      .filter(meeting => meeting.duration > 0)
      .map(meeting => meeting.duration);

    const avgDuration = durations.length > 0 
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    return {
      totalMeetings: filteredMeetings.length,
      statusCounts,
      typeCounts,
      dailyTrends,
      weeklyTrends,
      transcriptionStats,
      avgDuration,
      totalDuration: durations.reduce((a, b) => a + b, 0)
    };
  }, [meetings, timeRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analyticsData.dailyTrends) return [];

    return Object.entries(analyticsData.dailyTrends)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        meetings: count
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14); // Last 14 days
  }, [analyticsData.dailyTrends]);

  const statusChartData = useMemo(() => {
    if (!analyticsData.statusCounts) return [];
    
    return Object.entries(analyticsData.statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: status === 'completed' ? '#10B981' : 
             status === 'active' ? '#3B82F6' : 
             status === 'scheduled' ? '#1E40AF' : '#3B82F6'
    }));
  }, [analyticsData.statusCounts]);

  const typeChartData = useMemo(() => {
    if (!analyticsData.typeCounts) return [];
    
    return Object.entries(analyticsData.typeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: type === 'onboarding' ? '#10B981' : 
             type === 'instant' ? '#3B82F6' : '#1E40AF'
    }));
  }, [analyticsData.typeCounts]);

  // Custom colors for charts (only navy blue, green, and white)
  const chartColors = ['#1E40AF', '#10B981', '#3B82F6', '#059669', '#1D4ED8'];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-blue-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-blue-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
        <div className="text-center text-blue-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-blue-300" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900">Meeting Analytics</h3>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm border border-blue-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-700"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Meetings */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Meetings</p>
              <p className="text-2xl font-bold text-blue-900">{analyticsData.totalMeetings}</p>
            </div>
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        {/* Average Duration */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Avg Duration</p>
              <p className="text-2xl font-bold text-green-900">{analyticsData.avgDuration}m</p>
            </div>
            <div className="p-2 bg-green-600 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        {/* Completed Meetings */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Completed</p>
              <p className="text-2xl font-bold text-blue-900">
                {analyticsData.statusCounts?.completed || 0}
              </p>
            </div>
            <div className="p-2 bg-blue-600 rounded-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        {/* Transcription Rate */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Transcriptions</p>
              <p className="text-2xl font-bold text-green-900">
                {analyticsData.transcriptionStats?.completed || 0}
              </p>
            </div>
            <div className="p-2 bg-green-600 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meeting Trends Line Chart */}
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-4">Meeting Trends</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#1E40AF' }}
                axisLine={{ stroke: '#1E40AF' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#1E40AF' }}
                axisLine={{ stroke: '#1E40AF' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #1E40AF',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="meetings" 
                stroke="#1E40AF" 
                strokeWidth={3}
                dot={{ fill: '#1E40AF', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-900 mb-4">Meeting Status</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #10B981',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Meeting Types Bar Chart */}
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-4">Meeting Types</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={typeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#1E40AF' }}
                axisLine={{ stroke: '#1E40AF' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#1E40AF' }}
                axisLine={{ stroke: '#1E40AF' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #1E40AF',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#1E40AF"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transcription Status Area Chart */}
        <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-900 mb-4">Transcription Status</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={[
              { name: 'Completed', value: analyticsData.transcriptionStats?.completed || 0 },
              { name: 'Active', value: analyticsData.transcriptionStats?.active || 0 },
              { name: 'Not Started', value: analyticsData.transcriptionStats?.notStarted || 0 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#10B981' }}
                axisLine={{ stroke: '#10B981' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#10B981' }}
                axisLine={{ stroke: '#10B981' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #10B981',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#10B981" 
                fill="#10B981"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="mt-6 pt-6 border-t border-blue-100">
        <h4 className="text-sm font-semibold text-blue-900 mb-4">Key Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">Most Active Day</p>
            <p className="text-sm font-medium text-blue-900">
              {chartData.length > 0 ? 
                chartData.reduce((max, item) => item.meetings > max.meetings ? item : max).date : 
                'N/A'
              }
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600">Completion Rate</p>
            <p className="text-sm font-medium text-green-900">
              {analyticsData.totalMeetings > 0 ? 
                Math.round((analyticsData.statusCounts?.completed || 0) / analyticsData.totalMeetings * 100) : 
                0
              }%
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">Total Duration</p>
            <p className="text-sm font-medium text-blue-900">
              {Math.round(analyticsData.totalDuration / 60)}h {analyticsData.totalDuration % 60}m
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingAnalytics;
