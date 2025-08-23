// File: frontend/src/components/finalReport/ComprehensivePDFGenerator.jsx
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle, Download, FileText, TrendingUp, Calendar, Users, Shield, Target, BarChart3 } from 'lucide-react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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

// PDF Document Component
const FinalReportPDF = ({ data }) => {
  if (!data) return null;

  const { header, client, services, summary } = data;
  const { advisor, firm } = header;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Comprehensive Financial Report</Text>
          <Text style={styles.subtitle}>
            {firm.firmName || advisor.firstName + ' ' + advisor.lastName}
          </Text>
          <Text style={styles.subtitle}>
            {firm.address || advisor.email}
          </Text>
          <Text style={styles.subtitle}>
            Phone: {firm.phone || advisor.phoneNumber} | Email: {advisor.email}
          </Text>
          
          <View style={styles.reportInfo}>
            <Text>Client: {header.clientName}</Text>
            <Text>Report ID: {header.reportId}</Text>
            <Text>Generated: {new Date(header.generatedAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Client Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridTitle}>Personal Details</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{client.personal.firstName} {client.personal.lastName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{client.personal.email}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{client.personal.phoneNumber}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>PAN:</Text>
                <Text style={styles.value}>{client.personal.panNumber}</Text>
              </View>
            </View>
            
            <View style={styles.gridItem}>
              <Text style={styles.gridTitle}>Financial Overview</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Monthly Income:</Text>
                <Text style={styles.value}>₹{client.financial.totalMonthlyIncome?.toLocaleString() || '0'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Monthly Expenses:</Text>
                <Text style={styles.value}>₹{client.financial.totalMonthlyExpenses?.toLocaleString() || '0'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Net Worth:</Text>
                <Text style={styles.value}>₹{client.financial.netWorth?.toLocaleString() || '0'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Services Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Summary</Text>
          
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Overall Statistics</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Services</Text>
                <Text style={styles.summaryValue}>{summary.totalServices}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Active Services</Text>
                <Text style={styles.summaryValue}>{summary.activeServices}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Portfolio Value</Text>
                <Text style={styles.summaryValue}>₹{summary.portfolioValue?.toLocaleString() || '0'}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Onboarding Progress</Text>
                <Text style={styles.summaryValue}>{summary.onboardingProgress || 'Not Started'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Financial Plans */}
        {services.financialPlans.count > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Plans ({services.financialPlans.count})</Text>
            {services.financialPlans.plans.map((plan, index) => (
              <View key={index} style={styles.summaryBox}>
                <Text style={styles.gridTitle}>Plan {index + 1}</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Status:</Text>
                  <Text style={styles.value}>{plan.status}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Created:</Text>
                  <Text style={styles.value}>{new Date(plan.createdAt).toLocaleDateString()}</Text>
                </View>
                {plan.planType && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Type:</Text>
                    <Text style={styles.value}>{plan.planType}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* KYC Verifications */}
        {services.kyc.count > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>KYC Verifications ({services.kyc.count})</Text>
            {services.kyc.verifications.map((kyc, index) => (
              <View key={index} style={styles.summaryBox}>
                <Text style={styles.gridTitle}>KYC {index + 1}</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Status:</Text>
                  <Text style={styles.value}>{kyc.overallStatus}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Completed:</Text>
                  <Text style={styles.value}>{new Date(kyc.updatedAt).toLocaleDateString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Meetings */}
        {services.meetings.count > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meetings ({services.meetings.count})</Text>
            {services.meetings.meetings.map((meeting, index) => (
              <View key={index} style={styles.summaryBox}>
                <Text style={styles.gridTitle}>Meeting {index + 1}</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Date:</Text>
                  <Text style={styles.value}>{new Date(meeting.meetingDate).toLocaleDateString()}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Status:</Text>
                  <Text style={styles.value}>{meeting.status}</Text>
                </View>
                {meeting.notes && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Notes:</Text>
                    <Text style={styles.value}>{meeting.notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* LOE Documents */}
        {services.loeDocuments.count > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LOE Documents ({services.loeDocuments.count})</Text>
            {services.loeDocuments.documents.map((loe, index) => (
              <View key={index} style={styles.summaryBox}>
                <Text style={styles.gridTitle}>LOE {index + 1}</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Status:</Text>
                  <Text style={styles.value}>{loe.status}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Created:</Text>
                  <Text style={styles.value}>{new Date(loe.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.reportInfo}>
          <Text>Generated by {advisor.firstName} {advisor.lastName}</Text>
          <Text>Report ID: {header.reportId}</Text>
          <Text>Page 1 of 1</Text>
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
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 [PDF Generator] Fetching comprehensive data for client:', client._id);
      
      const response = await api.get(`/final-report/data/${user.id}/${client._id}`);
      
      if (response.data.success) {
        console.log('✅ [PDF Generator] Data fetched successfully:', response.data.data);
        setData(response.data.data);
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
    <div className="space-y-6">
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

      {/* PDF Generation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate PDF Report</h3>
        
        <div className="text-center">
          <div className="mb-4">
            <FileText className="h-16 w-16 text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">
              Click the button below to generate and download a comprehensive PDF report
            </p>
          </div>
          
          <PDFDownloadLink
            document={<FinalReportPDF data={data} />}
            fileName={`Final_Report_${client.firstName}_${client.lastName}_${new Date().toISOString().split('T')[0]}.pdf`}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            {({ blob, url, loading, error }) => (
              <>
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Download Comprehensive Report
                  </>
                )}
              </>
            )}
          </PDFDownloadLink>
          
          {data && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Report ID: {data.header.reportId}</p>
              <p>Generated: {new Date(data.header.generatedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprehensivePDFGenerator;
