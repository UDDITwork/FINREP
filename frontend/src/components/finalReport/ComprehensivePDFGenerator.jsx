// File: frontend/src/components/finalReport/ComprehensivePDFGenerator.jsx
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle, Download, FileText, TrendingUp, Calendar, Users, Shield, Target, BarChart3 } from 'lucide-react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import api from '../../services/api';

// Register fonts for PDF
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Inter'
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
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 15
  }
});

const ComprehensivePDFGenerator = ({ client, advisorId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfReady, setPdfReady] = useState(false);

  useEffect(() => {
    fetchComprehensiveData();
  }, [client._id, advisorId]);

  const fetchComprehensiveData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [PDF Generator] Fetching comprehensive data for client:', client._id);
      
      const response = await api.get(`/final-report/data/${advisorId}/${client._id}`);
      
      if (response.data.success) {
        console.log('✅ [PDF Generator] Data fetched successfully:', response.data.data);
        setData(response.data.data);
        setPdfReady(true);
      } else {
        setError('Failed to fetch comprehensive data');
      }
    } catch (error) {
      console.error('❌ [PDF Generator] Error fetching data:', error);
      setError(error.response?.data?.error || 'Failed to fetch comprehensive data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusStyle = (status) => {
    const statusMap = {
      'active': styles.statusActive,
      'completed': styles.statusCompleted,
      'pending': styles.statusPending,
      'approved': styles.statusCompleted,
      'signed': styles.statusCompleted
    };
    return statusMap[status] || styles.statusPending;
  };

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Comprehensive Report</h3>
        <p className="text-gray-600 mb-4">Fetching data from all systems...</p>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <span>Loading client data</span>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Generating Report</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchComprehensiveData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="p-6">
      <div className="text-center mb-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Report Ready!</h3>
        <p className="text-gray-600">
          Comprehensive report for {client.firstName} {client.lastName} is ready for download
        </p>
      </div>

      {/* Report Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {data?.summary?.totalServices || 0}
          </div>
          <div className="text-sm text-blue-800">Total Services</div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {data?.summary?.activeServices || 0}
          </div>
          <div className="text-sm text-green-800">Active Services</div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {formatCurrency(data?.summary?.portfolioValue || 0)}
          </div>
          <div className="text-sm text-purple-800">Portfolio Value</div>
        </div>
      </div>

      {/* Download Section */}
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">Download Final Report</h4>
        <p className="text-gray-600 mb-4">
          This report contains comprehensive data from all {data?.summary?.totalServices || 0} service areas
        </p>
        
        <PDFDownloadLink
          document={<FinalReportPDF data={data} client={client} />}
          fileName={`Final_Report_${client.firstName}_${client.lastName}_${new Date().toISOString().split('T')[0]}.pdf`}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          {({ loading }) => (
            <>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Generating PDF...' : 'Download Report'}
            </>
          )}
        </PDFDownloadLink>
      </div>

      {/* Report Preview */}
      <div className="mt-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Report Contents Preview</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Personal & Financial Information</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Financial Plans ({data?.services?.financialPlans?.count || 0})</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>KYC Verification Status</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Meetings & Transcriptions ({data?.services?.meetings?.count || 0})</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Investment Strategies ({data?.services?.mutualFundStrategies?.count || 0})</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Risk Assessment Sessions ({data?.services?.abTestSessions?.count || 0})</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return renderLoadingState();
  if (error) return renderErrorState();
  if (!pdfReady) return renderLoadingState();

  return renderSuccessState();
};

// PDF Document Component
const FinalReportPDF = ({ data, client }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Comprehensive Financial Report</Text>
        <Text style={styles.subtitle}>
          {data?.header?.firm?.firmName || 'Financial Advisory Services'}
        </Text>
        <Text style={styles.subtitle}>
          Client: {client.firstName} {client.lastName}
        </Text>
        
        <View style={styles.reportInfo}>
          <Text>Report ID: {data?.header?.reportId}</Text>
          <Text>Generated: {formatDate(data?.header?.generatedAt)}</Text>
        </View>
      </View>

      {/* Client Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Overview</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Full Name:</Text>
          <Text style={styles.value}>
            {data?.client?.personal?.firstName} {data?.client?.personal?.lastName}
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{data?.client?.personal?.email || 'N/A'}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{data?.client?.personal?.phoneNumber || 'N/A'}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Date of Birth:</Text>
          <Text style={styles.value}>
            {formatDate(data?.client?.personal?.dateOfBirth)}
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>PAN Number:</Text>
          <Text style={styles.value}>{data?.client?.personal?.panNumber || 'N/A'}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Occupation:</Text>
          <Text style={styles.value}>{data?.client?.personal?.occupation || 'N/A'}</Text>
        </View>
      </View>

      {/* Financial Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Monthly Income:</Text>
          <Text style={styles.value}>
            {formatCurrency(data?.client?.financial?.totalMonthlyIncome)}
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Monthly Expenses:</Text>
          <Text style={styles.value}>
            {formatCurrency(data?.client?.financial?.totalMonthlyExpenses)}
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Portfolio Value:</Text>
          <Text style={styles.value}>
            {formatCurrency(data?.summary?.portfolioValue)}
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Client Since:</Text>
          <Text style={styles.value}>
            {formatDate(data?.summary?.clientSince)}
          </Text>
        </View>
      </View>

      {/* Services Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services & Engagement</Text>
        
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridTitle}>Financial Plans</Text>
            <Text style={styles.gridContent}>
              Count: {data?.services?.financialPlans?.count || 0}
            </Text>
          </View>
          
          <View style={styles.gridItem}>
            <Text style={styles.gridTitle}>KYC Verification</Text>
            <Text style={styles.gridContent}>
              Status: {data?.services?.kyc?.verifications?.[0]?.overallStatus || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.gridItem}>
            <Text style={styles.gridTitle}>Meetings</Text>
            <Text style={styles.gridContent}>
              Count: {data?.services?.meetings?.count || 0}
            </Text>
          </View>
          
          <View style={styles.gridItem}>
            <Text style={styles.gridTitle}>Chat Sessions</Text>
            <Text style={styles.gridContent}>
              Count: {data?.services?.chatHistory?.count || 0}
            </Text>
          </View>
          
          <View style={styles.gridItem}>
            <Text style={styles.gridTitle}>Investment Strategies</Text>
            <Text style={styles.gridContent}>
              Count: {data?.services?.mutualFundStrategies?.count || 0}
            </Text>
          </View>
          
          <View style={styles.gridItem}>
            <Text style={styles.gridTitle}>Risk Assessment</Text>
            <Text style={styles.gridContent}>
              Count: {data?.services?.abTestSessions?.count || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        This report was generated on {formatDate(data?.header?.generatedAt)} by {data?.header?.firm?.firmName || 'Financial Advisory Services'}.
        All data is current as of the generation date.
      </Text>
    </Page>
  </Document>
);

export default ComprehensivePDFGenerator;
