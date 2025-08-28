// File: frontend/src/components/finalReport/ComprehensivePDFGenerator.jsx
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle, Download, FileText, TrendingUp, Calendar, Users, Shield, Target, BarChart3 } from 'lucide-react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { finalReportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// PDF Styles - Using Helvetica instead of Inter font
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #1e40af',
    paddingBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 5,
    textAlign: 'center'
  },
  reportInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    fontSize: 10,
    color: '#6b7280'
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 5
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 8
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    width: '40%'
  },
  value: {
    fontSize: 12,
    color: '#111827',
    width: '60%'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  gridItem: {
    width: '48%',
    marginBottom: 15
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8
  },
  gridContent: {
    fontSize: 11,
    color: '#6b7280'
  },
  status: {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold'
  },
  statusActive: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e'
  },
  statusCompleted: {
    backgroundColor: '#dbeafe',
    color: '#1e40af'
  },
  statusInactive: {
    backgroundColor: '#f3f4f6',
    color: '#374151'
  },
  table: {
    marginTop: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    paddingVertical: 8
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    fontWeight: 'bold'
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    paddingHorizontal: 8
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  summaryItem: {
    width: '48%',
    marginBottom: 10
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827'
  }
});

// Helper function to safely render data
const safeRender = (data, fallback = 'N/A') => {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data === 'number') return data.toString();
  if (typeof data === 'boolean') return data ? 'Yes' : 'No';
  if (Array.isArray(data)) return `${data.length} items`;
  if (typeof data === 'object') return 'Available';
  return fallback;
};

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

// PDF Document Component - Ultra Simple version
const FinalReportPDF = ({ data }) => {
  if (!data) return null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Financial Report</Text>
          <Text style={styles.subtitle}>
            Client: {data?.header?.clientName || 'N/A'}
          </Text>
          <Text style={styles.subtitle}>
            Generated: {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          
              <View style={styles.row}>
            <Text style={styles.label}>Total Services:</Text>
            <Text style={styles.value}>{data?.summary?.totalServices || 0}</Text>
              </View>
              <View style={styles.row}>
            <Text style={styles.label}>Portfolio Value:</Text>
            <Text style={styles.value}>₹{data?.summary?.portfolioValue || 0}</Text>
              </View>
              <View style={styles.row}>
            <Text style={styles.label}>Active Services:</Text>
            <Text style={styles.value}>{data?.summary?.activeServices || 0}</Text>
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          
                <View style={styles.row}>
            <Text style={styles.label}>Financial Plans:</Text>
            <Text style={styles.value}>{data?.services?.financialPlans?.count || 0}</Text>
          </View>
                <View style={styles.row}>
            <Text style={styles.label}>KYC Verification:</Text>
            <Text style={styles.value}>{data?.services?.kyc?.count || 0}</Text>
          </View>
                <View style={styles.row}>
            <Text style={styles.label}>Meetings:</Text>
            <Text style={styles.value}>{data?.services?.meetings?.count || 0}</Text>
          </View>
                <View style={styles.row}>
            <Text style={styles.label}>LOE Documents:</Text>
            <Text style={styles.value}>{data?.services?.loeDocuments?.count || 0}</Text>
          </View>
          </View>

        {/* Footer */}
        <View style={styles.reportInfo}>
          <Text>Generated by Financial Advisor</Text>
          <Text>Date: {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Main Component
const ComprehensivePDFGenerator = ({ client, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (client && user) {
      fetchComprehensiveData();
    }
  }, [client, user]);

  const fetchComprehensiveData = async () => {
    // Add validation to ensure we have required data
    if (!client || !client._id) {
      setError('Invalid client data. Please select a valid client.');
      return;
    }
    
    if (!user) {
      setError('User not authenticated. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 [PDF Generator] Fetching comprehensive data for client:', client._id);
      
      // Use the new finalReportAPI for comprehensive data
      const response = await finalReportAPI.getComprehensiveClientData(client._id);
      
      if (response.success) {
        console.log('✅ [PDF Generator] Data fetched successfully:', response.data);
        setData(response.data);
      } else {
        console.error('❌ [PDF Generator] API returned error:', response);
        setError(response.message || 'Failed to fetch comprehensive data');
      }
    } catch (error) {
      console.error('❌ [PDF Generator] Error fetching data:', error);
      
      // Better error handling with specific messages
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        setError('Client data not found. Please check the client ID.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection.');
      } else {
        setError(error.response?.data?.message || 'Failed to fetch comprehensive data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Comprehensive Report</h3>
          <p className="text-gray-600">Fetching data from all systems...</p>
      </div>
    </div>
  );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        
        {/* Debug Information */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left max-w-md mx-auto">
          <h4 className="font-medium text-gray-700 mb-2">Debug Information:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Client ID:</strong> {client?._id || 'Not available'}</p>
            <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
            <p><strong>Client Name:</strong> {client?.firstName} {client?.lastName}</p>
            <p><strong>API Endpoint:</strong> /final-report/data/{client?._id}</p>
          </div>
        </div>
        
        <button
          onClick={fetchComprehensiveData}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Loader2 className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Unable to generate report for this client.</p>
    </div>
  );
  }

  return (
    <div className="space-y-6 relative">
      {/* Floating PDF Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            document.getElementById('pdf-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-full hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-110 shadow-lg"
        >
          <Download className="h-5 w-5 mr-2" />
          Go to PDF
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Comprehensive Financial Report
          </h2>
        <p className="text-gray-600">
            Client: {client.firstName} {client.lastName}
          </p>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Client List
        </button>
      </div>

      {/* Data Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data.summary.totalServices}</div>
            <div className="text-sm text-blue-600">Total Services</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data.summary.activeServices}</div>
            <div className="text-sm text-green-600">Active Services</div>
        </div>
        
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              ₹{data.summary.portfolioValue?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-purple-600">Portfolio Value</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {data.summary.onboardingProgress || 'N/A'}
        </div>
            <div className="text-sm text-yellow-600">Onboarding Step</div>
          </div>
        </div>
      </div>

      {/* Services Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Breakdown</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Financial Plans</span>
              <span className="text-lg font-bold text-blue-600">{data.services.financialPlans.count}</span>
      </div>
            <div className="text-xs text-gray-500">Active financial planning services</div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">KYC Verification</span>
              <span className="text-lg font-bold text-green-600">{data.services.kyc.count}</span>
            </div>
            <div className="text-xs text-gray-500">Completed KYC processes</div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Meetings</span>
              <span className="text-lg font-bold text-purple-600">{data.services.meetings.count}</span>
            </div>
            <div className="text-xs text-gray-500">Client consultation meetings</div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">LOE Documents</span>
              <span className="text-lg font-bold text-indigo-600">{data.services.loeDocuments.count}</span>
            </div>
            <div className="text-xs text-gray-500">Letters of engagement</div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Chat Sessions</span>
              <span className="text-lg font-bold text-pink-600">{data.services.chatHistory.count}</span>
            </div>
            <div className="text-xs text-gray-500">AI chat interactions</div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Investment Strategies</span>
              <span className="text-lg font-bold text-orange-600">{data.services.mutualFundStrategies.count}</span>
            </div>
            <div className="text-xs text-gray-500">Mutual fund exit strategies</div>
          </div>
        </div>
      </div>

      {/* Client Personal Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          Client Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Basic Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Full Name:</span>
                <span className="text-sm font-medium">{data.client?.personal?.firstName} {data.client?.personal?.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium">{data.client?.personal?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="text-sm font-medium">{data.client?.personal?.phoneNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">PAN Number:</span>
                <span className="text-sm font-medium">{data.client?.personal?.panNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Financial Profile</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Income:</span>
                <span className="text-sm font-medium">₹{data.client?.financial?.totalMonthlyIncome?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Expenses:</span>
                <span className="text-sm font-medium">₹{data.client?.financial?.totalMonthlyExpenses?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Net Worth:</span>
                <span className="text-sm font-medium">₹{data.client?.financial?.netWorth?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Savings:</span>
                <span className="text-sm font-medium">₹{data.client?.financial?.monthlySavings?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Plans Details */}
      {data.services.financialPlans.count > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-600" />
            Financial Plans ({data.services.financialPlans.count})
          </h3>
          
          <div className="space-y-4">
            {data.services.financialPlans.plans.slice(0, 3).map((plan, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-800">Plan {index + 1}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    plan.status === 'active' ? 'bg-green-100 text-green-800' :
                    plan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {plan.status || 'Unknown'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Created:</strong> {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A'}</p>
                  {plan.planType && <p><strong>Type:</strong> {plan.planType}</p>}
                  {plan.description && <p><strong>Description:</strong> {plan.description}</p>}
                </div>
              </div>
            ))}
            {data.services.financialPlans.count > 3 && (
              <p className="text-sm text-gray-500 text-center">
                +{data.services.financialPlans.count - 3} more plans available
              </p>
            )}
          </div>
        </div>
      )}

      {/* KYC Verification Details */}
      {data.services.kyc.count > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-indigo-600" />
            KYC Verification ({data.services.kyc.count})
          </h3>
          
          <div className="space-y-4">
            {data.services.kyc.verifications.slice(0, 3).map((kyc, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-800">Verification {index + 1}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    kyc.overallStatus === 'verified' ? 'bg-green-100 text-green-800' :
                    kyc.overallStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {kyc.overallStatus || 'Unknown'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Status:</strong> {kyc.overallStatus || 'N/A'}</p>
                  <p><strong>Created:</strong> {kyc.createdAt ? new Date(kyc.createdAt).toLocaleDateString() : 'N/A'}</p>
                  {kyc.verificationType && <p><strong>Type:</strong> {kyc.verificationType}</p>}
                </div>
              </div>
            ))}
            {data.services.kyc.count > 3 && (
              <p className="text-sm text-gray-500 text-center">
                +{data.services.kyc.count - 3} more verifications available
              </p>
            )}
          </div>
        </div>
      )}

      {/* Meeting History */}
      {data.services.meetings.count > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-600" />
            Meeting History ({data.services.meetings.count})
          </h3>
          
          <div className="space-y-4">
            {data.services.meetings.meetings.slice(0, 3).map((meeting, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-800">Meeting {index + 1}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
                    meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {meeting.status || 'Unknown'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Date:</strong> {meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Type:</strong> {meeting.meetingType || 'N/A'}</p>
                  {meeting.notes && <p><strong>Notes:</strong> {meeting.notes}</p>}
                </div>
              </div>
            ))}
            {data.services.meetings.count > 3 && (
              <p className="text-sm text-gray-500 text-center">
                +{data.services.meetings.count - 3} more meetings available
              </p>
            )}
          </div>
        </div>
      )}

      {/* Investment Strategies */}
      {data.services.mutualFundStrategies.count > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
            Investment Strategies ({data.services.mutualFundStrategies.count})
          </h3>
          
          <div className="space-y-4">
            {data.services.mutualFundStrategies.strategies.slice(0, 3).map((strategy, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-800">Strategy {index + 1}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    strategy.status === 'active' ? 'bg-green-100 text-green-800' :
                    strategy.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {strategy.status || 'Unknown'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Type:</strong> {strategy.strategyType || 'N/A'}</p>
                  <p><strong>Created:</strong> {strategy.createdAt ? new Date(strategy.createdAt).toLocaleDateString() : 'N/A'}</p>
                  {strategy.description && <p><strong>Description:</strong> {strategy.description}</p>}
                </div>
              </div>
            ))}
            {data.services.mutualFundStrategies.count > 3 && (
              <p className="text-sm text-gray-500 text-center">
                +{data.services.mutualFundStrategies.count - 3} more strategies available
              </p>
            )}
          </div>
        </div>
      )}

      {/* CAS Data Summary */}
      {data.client?.casData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-teal-600" />
            CAS Data Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">
                ₹{data.client.casData.parsedData?.summary?.total_value?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-teal-600">Total Portfolio Value</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data.client.casData.parsedData?.summary?.total_folios || '0'}
              </div>
              <div className="text-sm text-blue-600">Total Folios</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.client.casData.parsedData?.summary?.total_schemes || '0'}
              </div>
              <div className="text-sm text-green-600">Total Schemes</div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Generation */}
      <div id="pdf-section" className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg border-2 border-blue-200 p-8">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Generate PDF Report</h3>
            <p className="text-gray-600 text-lg">
              Click the button below to generate and download a comprehensive PDF report
            </p>
          </div>
          
          <PDFDownloadLink
            document={<FinalReportPDF data={data} />}
            fileName={`Final_Report_${client.firstName}_${client.lastName}_${new Date().toISOString().split('T')[0]}.pdf`}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg text-lg"
          >
            {({ blob, url, loading, error }) => (
              <>
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    Generating PDF...
                  </>
                ) : error ? (
                  <>
                    <AlertCircle className="h-6 w-6 mr-3" />
                    PDF Generation Failed
                  </>
                ) : (
                  <>
                    <Download className="h-6 w-6 mr-3" />
                    Download Comprehensive Report
                  </>
                )}
              </>
            )}
          </PDFDownloadLink>
          
          {data && (
            <div className="mt-6 text-sm text-gray-600 bg-white p-4 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-800 mb-2">Report Details:</p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">Report ID</p>
                  <p className="font-medium">{data.header?.reportId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Generated</p>
                  <p className="font-medium">{data.header?.generatedAt ? new Date(data.header.generatedAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprehensivePDFGenerator;
