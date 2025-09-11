/**
 * FILE LOCATION: frontend/src/components/clientReports/ClientReportsPage.jsx

 */


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Calendar, FileText, TrendingUp, Shield, MessageCircle, BarChart3, PieChart, TrendingDown, Lock, DollarSign, Target, Activity, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { clientReportsAPI } from '../../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Bar, Doughnut, Pie, Line, Radar } from 'react-chartjs-2';
import BulkImportModal from './BulkImportModal';
import PDFDownloadButton from './PDFDownloadButton';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

function ClientReportsPage() {
  const [advisorData, setAdvisorData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to access client reports');
      navigate('/login');
      return;
    }
    
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Use the new clientReportsAPI functions
      const [advisorResponse, clientsResponse] = await Promise.all([
        clientReportsAPI.getAdvisorVaultData(),
        clientReportsAPI.getClientList()
      ]);

      setAdvisorData(advisorResponse.data);
      setClients(clientsResponse.data); // No .clients needed based on controller
      
      // Check if vault data needs updating
      if (advisorResponse.needsVaultUpdate) {
        toast.error('Please complete your vault profile information');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load client reports data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImportComplete = (importData) => {
    // Refresh the client list after successful import
    fetchData();
    toast.success(`Successfully imported ${importData.successful} clients`);
  };

  const handleClientClick = (client) => {
    console.log('🔍 [CLIENT REPORTS] Client click event:', {
      client: client,
      clientType: typeof client,
      clientId: client?._id,
      clientIdType: typeof client?._id,
      // Debug: Check all possible ID fields
      hasId: !!client?.id,
      hasUnderscoreId: !!client?._id,
      allKeys: Object.keys(client || {}),
      sampleKeys: Object.keys(client || {}).slice(0, 10)
    });

    // FIXED: Enhanced MongoDB ObjectID extraction with better debugging
    let clientId;
    
    if (typeof client === 'string') {
      // If client is already a string ID
      clientId = client;
      console.log('✅ [CLIENT REPORTS] Client is already a string ID:', clientId);
    } else if (client && typeof client === 'object') {
      // Try multiple ID field possibilities
      const possibleIdFields = ['_id', 'id', 'clientId', 'client_id'];
      
      for (const field of possibleIdFields) {
        if (client[field]) {
          console.log(`🔍 [CLIENT REPORTS] Found ID in field '${field}':`, {
            value: client[field],
            type: typeof client[field],
            constructor: client[field]?.constructor?.name
          });
          
          if (typeof client[field] === 'string') {
            clientId = client[field];
            console.log(`✅ [CLIENT REPORTS] Using string ID from '${field}':`, clientId);
            break;
          } else if (client[field] && typeof client[field] === 'object') {
            // Handle MongoDB ObjectID objects
            const objectId = client[field];
            
            // Try toHexString method first (most reliable)
            if (objectId.toHexString && typeof objectId.toHexString === 'function') {
              clientId = objectId.toHexString();
              console.log(`✅ [CLIENT REPORTS] Using toHexString from '${field}':`, clientId);
              break;
            }
            
            // Try toString method
            if (objectId.toString && typeof objectId.toString === 'function') {
              const stringValue = objectId.toString();
              if (stringValue !== '[object Object]' && stringValue.trim() !== '') {
                clientId = stringValue;
                console.log(`✅ [CLIENT REPORTS] Using toString from '${field}':`, clientId);
                break;
              }
            }
            
            // Try MongoDB JSON format
            if (objectId.$oid) {
              clientId = objectId.$oid;
              console.log(`✅ [CLIENT REPORTS] Using $oid from '${field}':`, clientId);
              break;
            }
            
            // Try other common ObjectID properties
            if (objectId.id && typeof objectId.id === 'string') {
              clientId = objectId.id;
              console.log(`✅ [CLIENT REPORTS] Using nested id from '${field}':`, clientId);
              break;
            }
            
            // Last resort - try to get any string representation
            if (Object.prototype.toString.call(objectId).includes('ObjectID')) {
              clientId = objectId.valueOf() || objectId.str || objectId.id;
              if (clientId) {
                console.log(`✅ [CLIENT REPORTS] Using fallback from '${field}':`, clientId);
                break;
              }
            }
          }
        }
      }
      
      // If still no clientId, try to find any string that looks like an ObjectID
      if (!clientId) {
        console.log('🔍 [CLIENT REPORTS] No ID found in standard fields, searching for ObjectID-like strings...');
        for (const [key, value] of Object.entries(client)) {
          if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
            clientId = value;
            console.log(`✅ [CLIENT REPORTS] Found ObjectID-like string in field '${key}':`, clientId);
            break;
          }
        }
      }
    }

    console.log('✅ [CLIENT REPORTS] Final extracted client ID:', {
      originalClient: client,
      extractedClientId: clientId,
      idType: typeof clientId,
      isValid: !!clientId && clientId !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(clientId)
    });

    if (!clientId || clientId === '[object Object]') {
      console.error('❌ [CLIENT REPORTS] Failed to extract valid client ID:', {
        originalClient: client,
        extractedId: clientId,
        availableFields: Object.keys(client || {}),
        sampleValues: Object.entries(client || {}).slice(0, 5).map(([k, v]) => ({ key: k, value: v, type: typeof v }))
      });
      toast.error('Invalid client ID - cannot view report');
      return;
    }

    // Validate that it looks like a MongoDB ObjectID
    if (!/^[0-9a-fA-F]{24}$/.test(clientId)) {
      console.warn('⚠️ [CLIENT REPORTS] Client ID format warning:', {
        clientId,
        length: clientId.length,
        pattern: /^[0-9a-fA-F]{24}$/.test(clientId)
      });
    }

    // Navigate with the properly extracted string ID
    console.log('🚀 [CLIENT REPORTS] Navigating to:', `/client-reports/${clientId}`);
    navigate(`/client-reports/${clientId}`);
  };

  const filteredClients = clients.filter(client =>
    client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'onboarding': return 'bg-blue-100 text-blue-800';
      case 'invited': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOnboardingProgress = (step) => {
    const percentage = Math.round((step / 7) * 100);
    return percentage;
  };

  // Chart data preparation functions
  const prepareClientStatusChart = () => {
    const statusCounts = clients.reduce((acc, client) => {
      const status = client.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          '#10B981', // green - active
          '#3B82F6', // blue - onboarding
          '#F59E0B', // yellow - invited
          '#6B7280', // gray - inactive
          '#EF4444'  // red - unknown
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  const prepareOnboardingProgressChart = () => {
    const progressData = Array.from({ length: 8 }, (_, i) => {
      const count = clients.filter(client => (client.onboardingStep || 0) === i).length;
      return count;
    });

    return {
      labels: ['Not Started', 'Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5', 'Step 6', 'Complete'],
      datasets: [{
        label: 'Clients',
        data: progressData,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  };

  const prepareCASStatusChart = () => {
    const casStatusCounts = clients.reduce((acc, client) => {
      const status = client.casData?.casStatus || 'not_uploaded';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(casStatusCounts).map(status => 
        status === 'not_uploaded' ? 'Not Uploaded' :
        status === 'parsed' ? 'Parsed' :
        status === 'processing' ? 'Processing' :
        status === 'error' ? 'Error' : status
      ),
      datasets: [{
        data: Object.values(casStatusCounts),
        backgroundColor: [
          '#6B7280', // gray - not uploaded
          '#10B981', // green - parsed
          '#F59E0B', // yellow - processing
          '#EF4444'  // red - error
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  const prepareFinancialOverviewChart = () => {
    const clientsWithFinancialData = clients.filter(client => 
      client.totalMonthlyIncome || client.totalMonthlyExpenses || client.netWorth
    );

    if (clientsWithFinancialData.length === 0) return null;

    const avgMonthlyIncome = clientsWithFinancialData.reduce((sum, client) => 
      sum + (client.totalMonthlyIncome || 0), 0) / clientsWithFinancialData.length;
    
    const avgMonthlyExpenses = clientsWithFinancialData.reduce((sum, client) => 
      sum + (client.totalMonthlyExpenses || 0), 0) / clientsWithFinancialData.length;
    
    const avgNetWorth = clientsWithFinancialData.reduce((sum, client) => 
      sum + (client.netWorth || 0), 0) / clientsWithFinancialData.length;

    return {
      labels: ['Avg Monthly Income', 'Avg Monthly Expenses', 'Avg Net Worth'],
      datasets: [{
        label: 'Amount (₹)',
        data: [avgMonthlyIncome, avgMonthlyExpenses, avgNetWorth],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',  // green - income
          'rgba(239, 68, 68, 0.8)',   // red - expenses
          'rgba(59, 130, 246, 0.8)'   // blue - net worth
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  };

  const prepareMonthlyTrendChart = () => {
    // Group clients by month of creation
    const monthlyData = clients.reduce((acc, client) => {
      const date = new Date(client.createdAt || client.lastActiveDate || Date.now());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});

    const sortedMonths = Object.keys(monthlyData).sort();
    const last6Months = sortedMonths.slice(-6);

    return {
      labels: last6Months.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }),
      datasets: [{
        label: 'New Clients',
        data: last6Months.map(month => monthlyData[month] || 0),
        borderColor: 'rgba(147, 51, 234, 1)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(147, 51, 234, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Advisor Data */}
      {advisorData && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {advisorData.firstName?.[0] || '?'}{advisorData.lastName?.[0] || '?'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {advisorData.firstName !== 'Not Available' ? advisorData.firstName : 'Advisor'} {advisorData.lastName !== 'Not Available' ? advisorData.lastName : 'Name'}
                  </h1>
                  <p className="text-gray-600">
                    {advisorData.firmName !== 'Not Available' ? advisorData.firmName : 'Financial Advisor'}
                  </p>
                  {advisorData.sebiRegNumber && advisorData.sebiRegNumber !== 'Not Available' && (
                    <p className="text-sm text-gray-500">SEBI: {advisorData.sebiRegNumber}</p>
                  )}
                  
                  {/* Show update prompt if data is missing */}
                  {advisorData.needsUpdate && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        ⚠️ {advisorData.updatePrompt || 'Please complete your vault profile information'}
                      </p>
                      <button 
                        onClick={() => navigate('/vault')}
                        className="mt-1 text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
                      >
                        Update Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-semibold text-gray-900">Client Reports</h2>
                <p className="text-gray-600">Comprehensive client overview</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Stats */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowBulkImport(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Upload className="h-4 w-4" />
                <span>Bulk Import</span>
              </button>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Total Clients: {clients.length}</span>
                <span>Active: {clients.filter(c => c.status === 'active').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Analytics Dashboard */}
        <div className="mb-10">
          <div className="border-b border-gray-200 pb-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Client Analytics Dashboard</h2>
            <p className="text-gray-600 mt-1">Comprehensive overview of client portfolio performance and metrics</p>
          </div>
          
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Portfolio</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{clients.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Active clients</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Clients</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{clients.filter(c => c.status === 'active').length}</p>
                  <p className="text-xs text-gray-500 mt-1">Engaged portfolio</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">CAS Compliance</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{clients.filter(c => c.casData?.casStatus === 'parsed').length}</p>
                  <p className="text-xs text-gray-500 mt-1">Documents processed</p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Onboarding</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{clients.filter(c => c.status === 'onboarding').length}</p>
                  <p className="text-xs text-gray-500 mt-1">In progress</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Portfolio Status Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Portfolio Status Distribution</h3>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <PieChart className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="h-72">
                <Doughnut 
                  data={prepareClientStatusChart()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          font: {
                            size: 12,
                            weight: '500'
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Onboarding Progress Analysis */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Onboarding Progress Analysis</h3>
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="h-72">
                <Bar 
                  data={prepareOnboardingProgressChart()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                          font: {
                            size: 11
                          }
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 11
                          }
                        },
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Compliance & Growth Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* CAS Compliance Status */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">CAS Compliance Status</h3>
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="h-72">
                <Pie 
                  data={prepareCASStatusChart()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          font: {
                            size: 12,
                            weight: '500'
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Portfolio Growth Trend */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Portfolio Growth Trend</h3>
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <div className="h-72">
                <Line 
                  data={prepareMonthlyTrendChart()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                          font: {
                            size: 11
                          }
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 11
                          }
                        },
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Financial Performance Overview */}
          {prepareFinancialOverviewChart() && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Financial Performance Overview</h3>
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <div className="h-80">
                <Bar 
                  data={prepareFinancialOverviewChart()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1,
                        callbacks: {
                          label: function(context) {
                            return `₹${context.parsed.y.toLocaleString('en-IN')}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                          },
                          font: {
                            size: 11
                          }
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 11
                          }
                        },
                        grid: {
                          display: false
                        }
                      }
                }
              }}
            />
          </div>
        </div>
      )}
        </div>

        {/* Client Portfolio Grid */}
        <div className="mb-8">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Client Portfolio</h2>
            <p className="text-gray-600 mt-1">Individual client overview and quick access to detailed reports</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client._id}
                onClick={() => handleClientClick(client)}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                {/* Client Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                      {client.firstName?.[0]}{client.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {client.firstName} {client.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{client.email}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                    {client.status}
                  </span>
                </div>

                {/* Client Details */}
                <div className="space-y-4">
                  {/* Onboarding Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 font-medium">Onboarding Progress</span>
                      <span className="text-gray-900 font-semibold">
                        {getOnboardingProgress(client.onboardingStep)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${getOnboardingProgress(client.onboardingStep)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* CAS Status */}
                  <div className="flex items-center space-x-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">CAS Status:</span>
                    <span className={`font-medium ${
                      client.casData?.casStatus === 'parsed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {client.casData?.casStatus === 'parsed' ? 'Compliant' : 'Pending'}
                    </span>
                  </div>

                  {/* Last Active */}
                  {client.lastActiveDate && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Last Activity:</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(client.lastActiveDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* PDF Download Button */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  {(() => {
                    // More robust client ID extraction
                    let clientIdString;
                    
                    if (client._id) {
                      if (typeof client._id === 'string') {
                        clientIdString = client._id;
                      } else if (client._id.toString) {
                        clientIdString = client._id.toString();
                      } else {
                        clientIdString = String(client._id);
                      }
                    } else if (client.id) {
                      clientIdString = client.id.toString();
                    } else {
                      clientIdString = 'unknown';
                    }
                    
                    console.log('🔍 [ClientReportsPage] Client ID conversion:', {
                      originalClient: client,
                      clientId: client._id,
                      clientIdType: typeof client._id,
                      clientIdString,
                      clientIdStringType: typeof clientIdString,
                      clientIdStringLength: clientIdString?.length,
                      allClientKeys: Object.keys(client)
                    });
                    
                    return (
                      <PDFDownloadButton 
                        clientId={clientIdString}
                        clientName={`${client.firstName} ${client.lastName}`}
                        className="w-full"
                      />
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Start by inviting your first client to see their comprehensive reports here.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImportComplete={handleBulkImportComplete}
      />
    </div>
  );
}

export default ClientReportsPage;
