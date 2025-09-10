/**
 * FILE LOCATION: frontend/src/components/clientReports/ClientDetailReport.jsx
 * 
 * PURPOSE: COMPREHENSIVE CLIENT REPORT - DISPLAYS ALL DATABASE FIELDS
 * 
 * FUNCTIONALITY:
 * - Displays ALL client data from ALL database models
 * - Shows EVERY field with "Not Available" fallbacks
 * - Comprehensive data organization with tabs
 * - Enhanced error handling and console logging
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Calendar, FileText, TrendingUp, Shield, MessageCircle, 
  BarChart3, PieChart, TrendingDown, Lock, DollarSign, Home, Car, 
  GraduationCap, CreditCard, Building, Building2, Gem, Briefcase, Heart, Eye, 
  CheckCircle, Clock, AlertCircle, User, MapPin, Phone, Mail, 
  Calculator, PiggyBank, Target, FileBarChart, Activity, Settings,
  ClipboardCheck, StickyNote, EyeOff, RefreshCw
} from 'lucide-react';
import EnhancedTranscriptDisplay from '../common/EnhancedTranscriptDisplay';
import { toast } from 'react-hot-toast';
import { clientReportsAPI } from '../../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Bar, Doughnut, Pie, Line, Radar } from 'react-chartjs-2';

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

function ClientDetailReport() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [debugInfo, setDebugInfo] = useState({});
  const [enhancedTranscriptMode, setEnhancedTranscriptMode] = useState({});

  // Enhanced console logging function
  const logDebug = (stage, data, isError = false) => {
    const timestamp = new Date().toISOString();
    const logPrefix = `[${timestamp}] 🖥️ [FRONTEND DEBUG]`;
    
    if (isError) {
      console.error(`${logPrefix} ❌ ${stage}:`, data);
    } else {
      console.log(`${logPrefix} ✅ ${stage}:`, data);
    }
  };

  useEffect(() => {
    logDebug('COMPONENT MOUNT', { clientId, activeTab });
    
    // Check authentication first
    const token = localStorage.getItem('token');
    if (!token) {
      logDebug('AUTHENTICATION FAILED', { reason: 'No token found' }, true);
      toast.error('Please login to access client reports');
      navigate('/login');
      return;
    }
    
    // Enhanced client ID validation and debugging
    if (clientId) {
      logDebug('CLIENT ID RECEIVED', {
        clientId,
        type: typeof clientId,
        isObject: typeof clientId === 'object',
        isString: typeof clientId === 'string',
        length: clientId?.length,
        stringified: JSON.stringify(clientId),
        constructor: clientId?.constructor?.name,
        prototype: Object.getPrototypeOf(clientId)?.constructor?.name
      });
      
      // Check if clientId is [object Object] - this indicates a routing issue
      if (clientId === '[object Object]') {
        logDebug('CRITICAL: [object Object] detected in clientId', { clientId }, true);
        toast.error('Invalid client ID format detected. Please return to client list and try again.');
        navigate('/client-reports');
        return;
      }
      
      // Additional check for object types that might be causing issues
      if (typeof clientId === 'object' && clientId !== null) {
        logDebug('CRITICAL: Object type detected in clientId', { 
          clientId,
          keys: Object.keys(clientId),
          hasOwnProperty: clientId.hasOwnProperty,
          toString: clientId.toString,
          valueOf: clientId.valueOf
        }, true);
        
        // Try to extract a valid ID from the object
        const extractedId = clientId._id || clientId.id || clientId.toString();
        logDebug('EXTRACTED ID FROM OBJECT', { extractedId, type: typeof extractedId });
        
        if (extractedId && typeof extractedId === 'string' && extractedId !== '[object Object]') {
          logDebug('USING EXTRACTED ID', { extractedId });
          // Update the clientId parameter or navigate with the correct ID
          navigate(`/client-reports/${extractedId}`, { replace: true });
          return;
        } else {
          toast.error('Invalid client ID format detected. Please return to client list and try again.');
          navigate('/client-reports');
          return;
        }
      }
      
      const debugInfo = clientReportsAPI.debugClientId(clientId);
      logDebug('CLIENT ID DEBUG INFO', debugInfo);
      
      if (!debugInfo.isValid) {
        logDebug('INVALID CLIENT ID DETECTED', { clientId, debugInfo }, true);
        toast.error('Invalid client ID provided');
        navigate('/client-reports');
        return;
      }
    } else {
      logDebug('NO CLIENT ID PROVIDED', { clientId }, true);
      toast.error('No client ID provided');
      navigate('/client-reports');
      return;
    }
    
    fetchClientReport();
  }, [clientId, navigate]);

  const fetchClientReport = async () => {
    try {
      setLoading(true);
      logDebug('FETCH START', { clientId, timestamp: new Date().toISOString() });
      
      // ENHANCED BROWSER CONSOLE LOGGING
      console.log(`\n🚀 [FRONTEND] Starting comprehensive client report fetch`);
      console.log(`📊 [FRONTEND] Client ID: ${clientId}`);
      console.log(`⏰ [FRONTEND] Fetch start time: ${new Date().toISOString()}`);
      console.log(`🎯 [FRONTEND] Target models: EstateInformation, MutualFundRecommend, TaxPlanning`);
      console.log(`🔍 [FRONTEND] Expected data: Complete client data with all 3 new models`);
      
      // Enhanced clientId validation before making the API call
      if (!clientId) {
        throw new Error('No client ID provided');
      }
      
      if (typeof clientId !== 'string') {
        throw new Error(`Invalid client ID type: ${typeof clientId}. Expected string.`);
      }
      
      if (clientId.trim() === '') {
        throw new Error('Client ID is empty string');
      }
      
      if (clientId === '[object Object]') {
        throw new Error('Client ID is [object Object] - routing issue detected');
      }
      
      logDebug('CLIENT ID VALIDATION PASSED', { 
        clientId, 
        type: typeof clientId, 
        length: clientId.length,
        trimmed: clientId.trim(),
        isObjectObject: clientId === '[object Object]'
      });
      
      const response = await clientReportsAPI.getClientReport(clientId);
      
      // COMPREHENSIVE API RESPONSE LOGGING
      console.log(`\n📡 [FRONTEND] API Response received successfully`);
      console.log(`✅ [FRONTEND] Response status: ${response.status || 'Unknown'}`);
      console.log(`📊 [FRONTEND] Response success: ${response.success}`);
      console.log(`⏰ [FRONTEND] Processing time: ${response.processingTime}`);
      console.log(`📋 [FRONTEND] Response size: ${JSON.stringify(response).length} characters`);
      console.log(`🔍 [FRONTEND] Data exists: ${!!response.data}`);
      
      // NEW MODELS DATA VERIFICATION LOGGING
      if (response.data) {
        console.log(`\n🎯 [FRONTEND] New Models Data Verification:`);
        
        // Estate Information Verification
        const estateData = response.data.estateInformation;
        console.log(`🏠 [ESTATE VERIFICATION] Estate data present: ${!!estateData}`);
        if (estateData) {
          console.log(`📊 [ESTATE VERIFICATION] Estate exists: ${estateData.exists}`);
          console.log(`📋 [ESTATE VERIFICATION] Estate data fields: ${Object.keys(estateData.data || {}).length}`);
          console.log(`📈 [ESTATE VERIFICATION] Estate summary fields: ${Object.keys(estateData.summary || {}).length}`);
          console.log(`💰 [ESTATE VERIFICATION] Estimated net estate: ${estateData.summary?.estimatedNetEstate || 'Not Available'}`);
        } else {
          console.log(`❌ [ESTATE VERIFICATION] Estate data missing from response`);
        }
        
        // Mutual Fund Recommendations Verification
        const mfData = response.data.mutualFundRecommendations;
        console.log(`📈 [MF VERIFICATION] MF recommendations present: ${!!mfData}`);
        if (mfData) {
          console.log(`📊 [MF VERIFICATION] MF count: ${mfData.count}`);
          console.log(`📋 [MF VERIFICATION] MF recommendations: ${mfData.recommendations?.length || 0}`);
          console.log(`📈 [MF VERIFICATION] MF summary fields: ${Object.keys(mfData.summary || {}).length}`);
          console.log(`💰 [MF VERIFICATION] Total SIP amount: ${mfData.summary?.totalSIPAmount || 'Not Available'}`);
          if (mfData.recommendations?.length > 0) {
            console.log(`📋 [MF VERIFICATION] Sample fund: ${mfData.recommendations[0].fundName || 'Unknown'}`);
          }
        } else {
          console.log(`❌ [MF VERIFICATION] MF recommendations missing from response`);
        }
        
        // Tax Planning Verification
        const taxData = response.data.taxPlanning;
        console.log(`🧾 [TAX VERIFICATION] Tax planning present: ${!!taxData}`);
        if (taxData) {
          console.log(`📊 [TAX VERIFICATION] Tax plans count: ${taxData.count}`);
          console.log(`📋 [TAX VERIFICATION] Tax plans: ${taxData.plans?.length || 0}`);
          console.log(`📈 [TAX VERIFICATION] Tax summary fields: ${Object.keys(taxData.summary || {}).length}`);
          console.log(`💰 [TAX VERIFICATION] Total tax savings: ${taxData.summary?.totalTaxSavings || 'Not Available'}`);
          if (taxData.plans?.length > 0) {
            console.log(`📋 [TAX VERIFICATION] Tax years: ${taxData.plans.map(plan => plan.taxYear).join(', ')}`);
          }
        } else {
          console.log(`❌ [TAX VERIFICATION] Tax planning missing from response`);
        }
        
        // Overall Verification
        const allModelsPresent = !!(estateData && mfData && taxData);
        console.log(`\n🎯 [OVERALL VERIFICATION] All 3 new models present: ${allModelsPresent ? 'YES' : 'NO'}`);
        console.log(`📊 [OVERALL VERIFICATION] Estate: ${estateData ? '✅' : '❌'}`);
        console.log(`📈 [OVERALL VERIFICATION] MF Recommendations: ${mfData ? '✅' : '❌'}`);
        console.log(`🧾 [OVERALL VERIFICATION] Tax Planning: ${taxData ? '✅' : '❌'}`);
      } else {
        console.log(`❌ [FRONTEND] No data received in response`);
      }
      
      logDebug('FETCH RESPONSE RECEIVED', {
        status: response.status,
        dataExists: !!response.data,
        success: response.success,
        dataSize: JSON.stringify(response).length,
        processingTime: response.processingTime
      });

      if (response?.success) {
        const reportData = response.data;
        
        // COMPREHENSIVE DATA SETTING LOGGING
        console.log(`\n💾 [FRONTEND] Setting client data in state`);
        console.log(`📊 [FRONTEND] Report data received: ${!!reportData}`);
        console.log(`📋 [FRONTEND] Client data fields: ${reportData.client ? Object.keys(reportData.client).length : 0}`);
        
        // NEW MODELS STATE SETTING LOGGING
        console.log(`\n🎯 [FRONTEND] New Models State Setting:`);
        console.log(`🏠 [ESTATE STATE] Estate data being set: ${!!reportData.estateInformation}`);
        console.log(`📈 [MF STATE] MF recommendations being set: ${!!reportData.mutualFundRecommendations}`);
        console.log(`🧾 [TAX STATE] Tax planning being set: ${!!reportData.taxPlanning}`);
        
        setClientData(reportData);
        
        // Store debug information with enhanced new models tracking
        const debugInfo = {
          fetchTime: new Date().toISOString(),
          processingTime: response.processingTime,
          dataIntegrity: response.dataIntegrity,
          clientFieldsCount: reportData.client ? Object.keys(reportData.client).length : 0,
          relatedDataCount: {
            financialPlans: reportData.financialPlans?.count || 0,
            meetings: reportData.meetings?.count || 0,
            legalDocs: (reportData.legalDocuments?.loeCount || 0) + (reportData.legalDocuments?.loeAutomationCount || 0),
            abTests: reportData.abTesting?.count || 0,
            chats: reportData.chatHistory?.count || 0,
            exitStrategies: reportData.mutualFundExitStrategies?.count || 0,
            invitations: reportData.invitations?.count || 0,
            // NEW MODELS COUNT
            estateInformation: reportData.estateInformation?.exists ? 1 : 0,
            mutualFundRecommendations: reportData.mutualFundRecommendations?.count || 0,
            taxPlanning: reportData.taxPlanning?.count || 0
          }
        };
        
        console.log(`📊 [FRONTEND] Debug info set with new models counts:`);
        console.log(`🏠 [DEBUG] Estate information: ${debugInfo.relatedDataCount.estateInformation}`);
        console.log(`📈 [DEBUG] MF recommendations: ${debugInfo.relatedDataCount.mutualFundRecommendations}`);
        console.log(`🧾 [DEBUG] Tax planning: ${debugInfo.relatedDataCount.taxPlanning}`);
        
        setDebugInfo(debugInfo);

        logDebug('DATA SET SUCCESSFULLY', {
          clientName: `${reportData.client?.basicInfo?.firstName} ${reportData.client?.basicInfo?.lastName}`,
          hasAdvisorData: !!reportData.advisor,
          hasClientData: !!reportData.client,
          clientDataFields: reportData.client ? Object.keys(reportData.client).length : 0,
          dataCompleteness: reportData.summary?.dataCompleteness
        });
      } else {
        logDebug('FETCH FAILED - Invalid Response', { response: response.data }, true);
        toast.error('Failed to load client report - Invalid response');
      }
    } catch (error) {
      logDebug('FETCH ERROR', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      }, true);
      
      toast.error(`Failed to load client report: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
      logDebug('FETCH COMPLETED', { loading: false });
    }
  };

  // Helper function to safely display any value
  const safeDisplay = (value, fallback = 'Not Available') => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value).length > 0 ? value : fallback;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value : [fallback];
    }
    return value;
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 'Not Available';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(numAmount);
  };

  // Helper function to format date
  const formatDate = (date) => {
    if (!date || date === 'Not Available') return 'Not Available';
    try {
      return new Date(date).toLocaleDateString('en-IN');
    } catch {
      return 'Invalid Date';
    }
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    if (!status || status === 'Not Available') return 'text-gray-600 bg-gray-100';
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'onboarding': return 'text-blue-600 bg-blue-100';
      case 'invited': return 'text-yellow-600 bg-yellow-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Chart data preparation functions
  const prepareFinancialOverviewChart = () => {
    if (!client) return null;

    const monthlyIncome = client.financialInfo?.totalMonthlyIncome || 0;
    const monthlyExpenses = client.financialInfo?.totalMonthlyExpenses || 0;
    const netWorth = client.financialInfo?.netWorth || client.financialInfo?.calculatedFinancials?.netWorth || 0;
    const monthlySavings = monthlyIncome - monthlyExpenses;

    return {
      labels: ['Monthly Income', 'Monthly Expenses', 'Monthly Savings', 'Net Worth'],
      datasets: [{
        label: 'Amount (₹)',
        data: [monthlyIncome, monthlyExpenses, monthlySavings, netWorth],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',  // green - income
          'rgba(239, 68, 68, 0.8)',   // red - expenses
          'rgba(59, 130, 246, 0.8)',  // blue - savings
          'rgba(147, 51, 234, 0.8)'   // purple - net worth
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(147, 51, 234, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  };

  const prepareAssetsBreakdownChart = () => {
    if (!client?.assets) return null;

    const assets = client.assets;
    const labels = [];
    const data = [];
    const colors = [
      '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];

    // Basic assets
    if (assets.cashBankSavings) {
      labels.push('Cash & Savings');
      data.push(assets.cashBankSavings);
    }
    if (assets.realEstate) {
      labels.push('Real Estate');
      data.push(assets.realEstate);
    }

    // Investment assets
    if (assets.investments?.equity?.mutualFunds) {
      labels.push('Mutual Funds');
      data.push(assets.investments.equity.mutualFunds);
    }
    if (assets.investments?.equity?.directStocks) {
      labels.push('Direct Stocks');
      data.push(assets.investments.equity.directStocks);
    }
    if (assets.investments?.fixedIncome?.ppf) {
      labels.push('PPF');
      data.push(assets.investments.fixedIncome.ppf);
    }
    if (assets.investments?.fixedIncome?.epf) {
      labels.push('EPF');
      data.push(assets.investments.fixedIncome.epf);
    }
    if (assets.investments?.fixedIncome?.nps) {
      labels.push('NPS');
      data.push(assets.investments.fixedIncome.nps);
    }

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  const prepareDebtsBreakdownChart = () => {
    if (!client?.debtsAndLiabilities) return null;

    const debts = client.debtsAndLiabilities;
    const labels = [];
    const data = [];
    const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#84CC16'];

    if (debts.homeLoan?.outstandingAmount) {
      labels.push('Home Loan');
      data.push(debts.homeLoan.outstandingAmount);
    }
    if (debts.personalLoan?.outstandingAmount) {
      labels.push('Personal Loan');
      data.push(debts.personalLoan.outstandingAmount);
    }
    if (debts.carLoan?.outstandingAmount) {
      labels.push('Car Loan');
      data.push(debts.carLoan.outstandingAmount);
    }
    if (debts.educationLoan?.outstandingAmount) {
      labels.push('Education Loan');
      data.push(debts.educationLoan.outstandingAmount);
    }
    if (debts.creditCards?.totalOutstanding) {
      labels.push('Credit Cards');
      data.push(debts.creditCards.totalOutstanding);
    }

    return {
      labels,
      datasets: [{
        label: 'Outstanding Amount (₹)',
        data,
        backgroundColor: colors.slice(0, labels.length).map(color => color + '80'),
        borderColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  };

  const prepareMonthlyExpensesChart = () => {
    if (!client?.financialInfo?.monthlyExpenses) return null;

    const expenses = client.financialInfo.monthlyExpenses;
    const labels = [];
    const data = [];
    const colors = [
      '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#84CC16',
      '#10B981', '#3B82F6', '#EC4899', '#6366F1', '#F97316'
    ];

    Object.entries(expenses).forEach(([key, value]) => {
      if (value && value > 0) {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        labels.push(label);
        data.push(value);
      }
    });

    return {
      labels,
      datasets: [{
        label: 'Monthly Expenses (₹)',
        data,
        backgroundColor: colors.slice(0, labels.length).map(color => color + '80'),
        borderColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  };

  const prepareRiskProfileChart = () => {
    if (!client?.riskProfile) return null;

    const riskProfile = client.riskProfile;
    const labels = ['Investment Experience', 'Risk Tolerance', 'Investment Horizon'];
    const data = [];

    // Convert text values to numerical scores
    const experienceScore = riskProfile.investmentExperience === 'Beginner' ? 1 :
                           riskProfile.investmentExperience === 'Intermediate' ? 2 : 3;
    
    const toleranceScore = riskProfile.riskTolerance === 'Conservative' ? 1 :
                          riskProfile.riskTolerance === 'Moderate' ? 2 : 3;
    
    const horizonScore = riskProfile.investmentHorizon === 'Short-term' ? 1 :
                        riskProfile.investmentHorizon === 'Medium-term' ? 2 : 3;

    data.push(experienceScore, toleranceScore, horizonScore);

    return {
      labels,
      datasets: [{
        label: 'Risk Profile Score',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        fill: true
      }]
    };
  };

  const prepareGoalProgressChart = () => {
    if (!client?.majorGoals || client.majorGoals.length === 0) return null;

    const goals = client.majorGoals;
    const labels = goals.map(goal => goal.goalName || 'Unnamed Goal').slice(0, 5);
    const targetAmounts = goals.map(goal => goal.targetAmount || 0).slice(0, 5);
    const currentAmounts = goals.map(goal => goal.currentAmount || 0).slice(0, 5);

    return {
      labels,
      datasets: [
        {
          label: 'Target Amount (₹)',
          data: targetAmounts,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Current Amount (₹)',
          data: currentAmounts,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    };
  };

  const prepareCashFlowWaterfallChart = () => {
    if (!client?.financialInfo) return null;

    const monthlyIncome = client.financialInfo.totalMonthlyIncome || 0;
    const monthlyExpenses = client.financialInfo.totalMonthlyExpenses || 0;
    const monthlySavings = monthlyIncome - monthlyExpenses;

    // Create waterfall chart data
    const labels = ['Monthly Income', 'Housing/Rent', 'Groceries & Food', 'Transportation', 'Education', 'Healthcare', 'Entertainment', 'Insurance', 'Loan EMIs', 'Other Expenses', 'Net Cash Flow'];
    
    const data = [
      monthlyIncome, // Start with income
      -(client.financialInfo.monthlyExpenses?.housingRent || 0),
      -(client.financialInfo.monthlyExpenses?.groceriesUtilitiesFood || 0),
      -(client.financialInfo.monthlyExpenses?.transportation || 0),
      -(client.financialInfo.monthlyExpenses?.education || 0),
      -(client.financialInfo.monthlyExpenses?.healthcare || 0),
      -(client.financialInfo.monthlyExpenses?.entertainment || 0),
      -(client.financialInfo.monthlyExpenses?.insurancePremiums || 0),
      -(client.financialInfo.monthlyExpenses?.loanEmis || 0),
      -(client.financialInfo.monthlyExpenses?.otherExpenses || 0),
      monthlySavings // End with net cash flow
    ];

    // Color coding for positive/negative values
    const backgroundColor = data.map((value, index) => {
      if (index === 0) return 'rgba(16, 185, 129, 0.8)'; // Income - Green
      if (index === labels.length - 1) { // Net Cash Flow
        return value >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
      }
      return 'rgba(239, 68, 68, 0.8)'; // Expenses - Red
    });

    const borderColor = data.map((value, index) => {
      if (index === 0) return 'rgba(16, 185, 129, 1)'; // Income - Green
      if (index === labels.length - 1) { // Net Cash Flow
        return value >= 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)';
      }
      return 'rgba(239, 68, 68, 1)'; // Expenses - Red
    });

    return {
      labels,
      datasets: [{
        label: 'Amount (₹)',
        data,
        backgroundColor,
        borderColor,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading comprehensive client report...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching all client data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!clientData || !clientData.client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Client Data Not Found</h3>
          <p className="text-gray-600 mb-4">The requested client data could not be loaded.</p>
          <div className="bg-gray-100 p-4 rounded-lg mb-4 text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>Client ID: {clientId}</p>
            <p>Fetch Time: {debugInfo.fetchTime || 'Not recorded'}</p>
          </div>
          <button
            onClick={() => navigate('/client-reports')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Client List
          </button>
        </div>
      </div>
    );
  }

  const client = clientData.client;
  const advisor = clientData.advisor;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/client-reports')}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                title="Return to Client Portfolio"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {safeDisplay(client.basicInfo?.firstName)} {safeDisplay(client.basicInfo?.lastName)}
                </h1>
                <p className="text-lg text-gray-600 mt-1">Comprehensive Financial Portfolio Report</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>Client ID: {clientId}</span>
                  <span>•</span>
                  <span>Generated: {debugInfo.fetchTime ? new Date(debugInfo.fetchTime).toLocaleString() : 'Unknown'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(client.basicInfo?.status)}`}>
                  {safeDisplay(client.basicInfo?.status)}
                </span>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Onboarding:</span> Step {safeDisplay(client.basicInfo?.onboardingStep)} of 7
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2">
            {[
              { id: 'overview', name: 'Portfolio Overview', icon: Eye },
              { id: 'personal', name: 'Personal Information', icon: User },
              { id: 'financial', name: 'Financial Summary', icon: DollarSign },
              { id: 'income-expenses', name: 'Income & Expenses', icon: Calculator, highlight: true },
              { id: 'assets', name: 'Asset Allocation', icon: TrendingUp },
              { id: 'debts', name: 'Liabilities', icon: CreditCard },
              { id: 'insurance', name: 'Insurance Coverage', icon: Shield },
              { id: 'goals', name: 'Financial Objectives', icon: Target },
              { id: 'retirement', name: 'Retirement Planning', icon: PiggyBank },
              { id: 'cas-data', name: 'Investment Portfolio', icon: BarChart3 },
              { id: 'meetings', name: 'Client Meetings', icon: Calendar },
              { id: 'documents', name: 'Legal Documents', icon: FileText },
              { id: 'chat', name: 'AI Consultations', icon: MessageCircle },
              { id: 'plans', name: 'Financial Plans', icon: FileBarChart },
              { id: 'risk-profile', name: 'Risk Assessment', icon: Activity },
              { id: 'kyc', name: 'Compliance', icon: Lock },
              { id: 'preferences', name: 'Preferences', icon: Settings },
              { id: 'ab-testing', name: 'Investment Scenarios', icon: BarChart3 },
              // NEW COMPREHENSIVE DATA TABS
              { id: 'estate-planning', name: 'Estate Planning', icon: Home },
              { id: 'mutual-fund-recommendations', name: 'MF Recommendations', icon: TrendingUp },
              { id: 'tax-planning', name: 'Tax Planning', icon: Calculator }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  const previousTab = activeTab;
                  setActiveTab(tab.id);
                  
                  // ENHANCED TAB SWITCHING LOGGING
                  console.log(`\n🔄 [FRONTEND] Tab switched from '${previousTab}' to '${tab.id}'`);
                  console.log(`📊 [FRONTEND] Tab name: ${tab.name}`);
                  console.log(`⏰ [FRONTEND] Switch time: ${new Date().toISOString()}`);
                  
                  // NEW MODELS TAB ACCESS LOGGING
                  if (tab.id === 'estate-planning') {
                    console.log(`🏠 [ESTATE TAB] Estate Planning tab accessed`);
                    console.log(`📊 [ESTATE TAB] Estate data available: ${clientData?.estateInformation ? 'YES' : 'NO'}`);
                    if (clientData?.estateInformation) {
                      console.log(`📋 [ESTATE TAB] Estate exists: ${clientData.estateInformation.exists}`);
                      console.log(`📈 [ESTATE TAB] Estate data fields: ${Object.keys(clientData.estateInformation.data || {}).length}`);
                    }
                  } else if (tab.id === 'mutual-fund-recommendations') {
                    console.log(`📈 [MF TAB] Mutual Fund Recommendations tab accessed`);
                    console.log(`📊 [MF TAB] MF data available: ${clientData?.mutualFundRecommendations ? 'YES' : 'NO'}`);
                    if (clientData?.mutualFundRecommendations) {
                      console.log(`📋 [MF TAB] MF count: ${clientData.mutualFundRecommendations.count}`);
                      console.log(`📈 [MF TAB] MF recommendations: ${clientData.mutualFundRecommendations.recommendations?.length || 0}`);
                    }
                  } else if (tab.id === 'tax-planning') {
                    console.log(`🧾 [TAX TAB] Tax Planning tab accessed`);
                    console.log(`📊 [TAX TAB] Tax data available: ${clientData?.taxPlanning ? 'YES' : 'NO'}`);
                    if (clientData?.taxPlanning) {
                      console.log(`📋 [TAX TAB] Tax plans count: ${clientData.taxPlanning.count}`);
                      console.log(`📈 [TAX TAB] Tax plans: ${clientData.taxPlanning.plans?.length || 0}`);
                    }
                  }
                  
                  logDebug('TAB CHANGE', { from: previousTab, to: tab.id });
                }}
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                    : tab.highlight
                    ? 'border-transparent text-green-700 hover:text-green-800 hover:border-green-300 hover:bg-green-50 bg-green-25'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
                {tab.highlight && (
                  <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                    NEW
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* PORTFOLIO OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Portfolio Data Completeness */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Portfolio Data Completeness</h3>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(clientData.summary?.dataCompleteness || {}).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className={`w-6 h-6 rounded-full mx-auto mb-3 flex items-center justify-center ${
                      value ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {value ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                    <p className={`text-xs font-medium ${
                      value ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {value ? 'Complete' : 'Pending'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Monthly Income</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(client.financialInfo?.totalMonthlyIncome)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Monthly Expenses</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(client.financialInfo?.totalMonthlyExpenses)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Net Worth</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(client.financialInfo?.netWorth || client.financialInfo?.calculatedFinancials?.netWorth)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Client Meetings</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {clientData.meetings?.count || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Overview Chart */}
            {prepareFinancialOverviewChart() && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Financial Overview
                </h3>
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
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Assets vs Debts Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets Breakdown */}
              {prepareAssetsBreakdownChart() && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Assets Breakdown
                  </h3>
                  <div className="h-64">
                    <Doughnut 
                      data={prepareAssetsBreakdownChart()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              padding: 20,
                              usePointStyle: true
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `₹${context.parsed.toLocaleString('en-IN')}`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Debts Breakdown */}
              {prepareDebtsBreakdownChart() && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                    Debts Breakdown
                  </h3>
                  <div className="h-64">
                    <Bar 
                      data={prepareDebtsBreakdownChart()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
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
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Risk Profile Chart */}
            {prepareRiskProfileChart() && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-purple-600" />
                  Risk Profile Assessment
                </h3>
                <div className="h-64">
                  <Radar 
                    data={prepareRiskProfileChart()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 3,
                          ticks: {
                            stepSize: 1,
                            callback: function(value) {
                              return value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High';
                            }
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Portfolio Activity Summary */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Portfolio Activity Summary</h3>
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-gray-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <FileBarChart className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900">{debugInfo.relatedDataCount?.financialPlans || 0}</p>
                  <p className="text-sm font-medium text-gray-600">Financial Plans</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <Calendar className="h-8 w-8 mx-auto mb-3 text-green-600" />
                  <p className="text-2xl font-bold text-gray-900">{debugInfo.relatedDataCount?.meetings || 0}</p>
                  <p className="text-sm font-medium text-gray-600">Client Meetings</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <FileText className="h-8 w-8 mx-auto mb-3 text-orange-600" />
                  <p className="text-2xl font-bold text-gray-900">{debugInfo.relatedDataCount?.legalDocs || 0}</p>
                  <p className="text-sm font-medium text-gray-600">Legal Documents</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <MessageCircle className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                  <p className="text-2xl font-bold text-gray-900">{debugInfo.relatedDataCount?.chats || 0}</p>
                  <p className="text-sm font-medium text-gray-600">AI Consultations</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PERSONAL INFORMATION TAB */}
        {activeTab === 'personal' && (
          <div className="space-y-8">
            {/* Basic Personal Information */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Basic Personal Information</h3>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">First Name</p>
                  <p className="font-medium">{safeDisplay(client.basicInfo?.firstName)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Name</p>
                  <p className="font-medium">{safeDisplay(client.basicInfo?.lastName)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{safeDisplay(client.basicInfo?.email)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-medium">{safeDisplay(client.basicInfo?.phoneNumber)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium">{formatDate(client.basicInfo?.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-medium">{safeDisplay(client.basicInfo?.gender)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Marital Status</p>
                  <p className="font-medium">{safeDisplay(client.basicInfo?.maritalStatus)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Number of Dependents</p>
                  <p className="font-medium">{safeDisplay(client.basicInfo?.numberOfDependents)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Occupation</p>
                  <p className="font-medium">{safeDisplay(client.basicInfo?.occupation)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employer/Business Name</p>
                  <p className="font-medium">{safeDisplay(client.basicInfo?.employerBusinessName)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">PAN Number</p>
                  <p className="font-medium">{safeDisplay(client.basicInfo?.panNumber)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Aadhar Number</p>
                  <p className="font-medium">{safeDisplay(client.basicInfo?.aadharNumber)}</p>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Address Information</h3>
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Street Address</p>
                  <p className="font-medium">{safeDisplay(client.address?.street)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">City</p>
                  <p className="font-medium">{safeDisplay(client.address?.city)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">State</p>
                  <p className="font-medium">{safeDisplay(client.address?.state)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ZIP Code</p>
                  <p className="font-medium">{safeDisplay(client.address?.zipCode)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Country</p>
                  <p className="font-medium">{safeDisplay(client.address?.country)}</p>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Account Status</h3>
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.basicInfo?.status)}`}>
                    {safeDisplay(client.basicInfo?.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Onboarding Step</p>
                  <p className="font-medium">{safeDisplay(client.basicInfo?.onboardingStep)} of 7</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Active Date</p>
                  <p className="font-medium">{formatDate(client.basicInfo?.lastActiveDate)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FINANCIAL DATA TAB */}
        {activeTab === 'financial' && (
          <div className="space-y-8">
            {/* Financial Summary */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Financial Summary</h3>
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Income Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Income:</span>
                      <span className="font-medium">{formatCurrency(client.financialInfo?.totalMonthlyIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual Income:</span>
                      <span className="font-medium">{formatCurrency(client.financialInfo?.annualIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Additional Income:</span>
                      <span className="font-medium">{formatCurrency(client.financialInfo?.additionalIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income Type:</span>
                      <span className="font-medium">{safeDisplay(client.financialInfo?.incomeType)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Expenses</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Expenses:</span>
                      <span className="font-medium">{formatCurrency(client.financialInfo?.totalMonthlyExpenses)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual Taxes:</span>
                      <span className="font-medium">{formatCurrency(client.financialInfo?.annualTaxes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual Vacation:</span>
                      <span className="font-medium">{formatCurrency(client.financialInfo?.annualVacationExpenses)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expense Notes:</span>
                      <span className="font-medium">{safeDisplay(client.financialInfo?.expenseNotes)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Calculated Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net Worth:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(client.financialInfo?.netWorth || client.financialInfo?.calculatedFinancials?.netWorth)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Surplus:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(client.financialInfo?.calculatedFinancials?.monthlySavings)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Savings Target:</span>
                      <span className="font-medium">{formatCurrency(client.financialInfo?.monthlySavingsTarget)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Overview Chart */}
            {prepareFinancialOverviewChart() && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Financial Overview Chart</h3>
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
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
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Monthly Expenses Breakdown Chart */}
            {prepareMonthlyExpensesChart() && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Monthly Expenses Breakdown</h3>
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <PieChart className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="h-80">
                  <Bar 
                    data={prepareMonthlyExpensesChart()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
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
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* INCOME & EXPENSES TAB */}
        {activeTab === 'income-expenses' && (
          <div className="space-y-8">
            {/* Financial Overview Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Monthly Income Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 uppercase tracking-wide">Monthly Income</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {formatCurrency(client.financialInfo?.totalMonthlyIncome)}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      {client.financialInfo?.annualIncome && 
                        `₹${(client.financialInfo.annualIncome / 12).toLocaleString('en-IN')}/month avg`
                      }
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-green-700" />
                  </div>
                </div>
              </div>

              {/* Monthly Expenses Card */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700 uppercase tracking-wide">Monthly Expenses</p>
                    <p className="text-3xl font-bold text-red-900 mt-2">
                      {formatCurrency(client.financialInfo?.totalMonthlyExpenses)}
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      {client.financialInfo?.calculatedFinancials?.monthlySavings !== undefined && 
                        `₹${Math.abs(client.financialInfo.calculatedFinancials.monthlySavings).toLocaleString('en-IN')} ${client.financialInfo.calculatedFinancials.monthlySavings >= 0 ? 'surplus' : 'deficit'}`
                      }
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-8 w-8 text-red-700" />
                  </div>
                </div>
              </div>

              {/* Net Cash Flow Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Net Cash Flow</p>
                    <p className={`text-3xl font-bold mt-2 ${
                      (client.financialInfo?.calculatedFinancials?.monthlySavings || 0) >= 0 
                        ? 'text-blue-900' : 'text-red-900'
                    }`}>
                      {formatCurrency(client.financialInfo?.calculatedFinancials?.monthlySavings || 0)}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      {client.financialInfo?.calculatedFinancials?.monthlySavings !== undefined && 
                        `${((client.financialInfo.calculatedFinancials.monthlySavings / (client.financialInfo?.totalMonthlyIncome || 1)) * 100).toFixed(1)}% of income`
                      }
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                    <Calculator className="h-8 w-8 text-blue-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Creative Income vs Expenses Comparison */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Income vs Expenses Analysis</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Income</span>
                  <div className="w-3 h-3 bg-red-500 rounded-full ml-4"></div>
                  <span className="text-sm text-gray-600">Expenses</span>
                </div>
              </div>
              
              {/* Horizontal Bar Comparison */}
              <div className="space-y-6">
                {/* Income Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Monthly Income</span>
                    <span className="text-sm font-semibold text-green-700">
                      {formatCurrency(client.financialInfo?.totalMonthlyIncome)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-8 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${Math.min(100, ((client.financialInfo?.totalMonthlyIncome || 0) / Math.max(client.financialInfo?.totalMonthlyExpenses || 1, client.financialInfo?.totalMonthlyIncome || 1)) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Expenses Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Monthly Expenses</span>
                    <span className="text-sm font-semibold text-red-700">
                      {formatCurrency(client.financialInfo?.totalMonthlyExpenses)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-400 to-red-600 h-8 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${Math.min(100, ((client.financialInfo?.totalMonthlyExpenses || 0) / Math.max(client.financialInfo?.totalMonthlyIncome || 1, client.financialInfo?.totalMonthlyExpenses || 1)) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Surplus/Deficit Indicator */}
                {client.financialInfo?.calculatedFinancials?.monthlySavings !== undefined && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${
                        client.financialInfo.calculatedFinancials.monthlySavings >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className={`text-lg font-semibold ${
                        client.financialInfo.calculatedFinancials.monthlySavings >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {client.financialInfo.calculatedFinancials.monthlySavings >= 0 ? '✓' : '⚠'} 
                        Monthly {client.financialInfo.calculatedFinancials.monthlySavings >= 0 ? 'Surplus' : 'Deficit'}: 
                        {formatCurrency(Math.abs(client.financialInfo.calculatedFinancials.monthlySavings))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Creative Expense Breakdown Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Interactive Donut Chart */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Expense Distribution</h3>
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <PieChart className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="h-80">
                  <Doughnut 
                    data={prepareMonthlyExpensesChart()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: { size: 12, weight: '500' }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: '#ffffff',
                          bodyColor: '#ffffff',
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((context.parsed / total) * 100).toFixed(1);
                              return `${context.label}: ₹${context.parsed.toLocaleString('en-IN')} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      elements: {
                        arc: {
                          borderWidth: 3,
                          borderColor: '#ffffff'
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Expense Categories Breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Expense Categories</h3>
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(client.financialInfo?.monthlyExpenses || {}).map(([category, amount]) => {
                    if (!amount || amount === 0) return null;
                    
                    const totalExpenses = Object.values(client.financialInfo?.monthlyExpenses || {}).reduce((sum, val) => sum + (val || 0), 0);
                    const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(amount)}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Monthly Cash Flow Waterfall Chart */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Monthly Cash Flow Breakdown</h3>
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              
              <div className="h-96">
                <Bar 
                  data={prepareCashFlowWaterfallChart()}
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
                        callbacks: {
                          label: function(context) {
                            return `${context.label}: ₹${context.parsed.y.toLocaleString('en-IN')}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                          callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                          }
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Financial Health Indicators */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Financial Health Metrics</h3>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Savings Rate */}
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PiggyBank className="h-8 w-8 text-green-700" />
                  </div>
                  <h4 className="text-lg font-semibold text-green-900 mb-2">Savings Rate</h4>
                  <p className="text-3xl font-bold text-green-800">
                    {client.financialInfo?.totalMonthlyIncome && client.financialInfo?.calculatedFinancials?.monthlySavings !== undefined
                      ? `${Math.max(0, ((client.financialInfo.calculatedFinancials.monthlySavings / client.financialInfo.totalMonthlyIncome) * 100)).toFixed(1)}%`
                      : 'N/A'
                    }
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {client.financialInfo?.calculatedFinancials?.monthlySavings !== undefined && 
                      client.financialInfo.calculatedFinancials.monthlySavings >= 0 
                        ? 'Healthy' : 'Needs Attention'
                    }
                  </p>
                </div>

                {/* Expense Ratio */}
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calculator className="h-8 w-8 text-blue-700" />
                  </div>
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">Expense Ratio</h4>
                  <p className="text-3xl font-bold text-blue-800">
                    {client.financialInfo?.totalMonthlyIncome && client.financialInfo?.totalMonthlyExpenses
                      ? `${((client.financialInfo.totalMonthlyExpenses / client.financialInfo.totalMonthlyIncome) * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {client.financialInfo?.totalMonthlyIncome && client.financialInfo?.totalMonthlyExpenses &&
                      (client.financialInfo.totalMonthlyExpenses / client.financialInfo.totalMonthlyIncome) <= 0.7
                        ? 'Good' : 'High'
                    }
                  </p>
                </div>

                {/* Debt Service Ratio */}
                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-orange-700" />
                  </div>
                  <h4 className="text-lg font-semibold text-orange-900 mb-2">Debt Service</h4>
                  <p className="text-3xl font-bold text-orange-800">
                    {client.financialInfo?.totalMonthlyIncome && client.financialInfo?.monthlyExpenses?.loanEmis
                      ? `${((client.financialInfo.monthlyExpenses.loanEmis / client.financialInfo.totalMonthlyIncome) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </p>
                  <p className="text-sm text-orange-600 mt-1">
                    {client.financialInfo?.totalMonthlyIncome && client.financialInfo?.monthlyExpenses?.loanEmis &&
                      (client.financialInfo.monthlyExpenses.loanEmis / client.financialInfo.totalMonthlyIncome) <= 0.4
                        ? 'Manageable' : 'High'
                    }
                  </p>
                </div>

                {/* Emergency Fund Coverage */}
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-purple-700" />
                  </div>
                  <h4 className="text-lg font-semibold text-purple-900 mb-2">Emergency Fund</h4>
                  <p className="text-3xl font-bold text-purple-800">
                    {client.assets?.cashBankSavings && client.financialInfo?.totalMonthlyExpenses
                      ? `${Math.round(client.assets.cashBankSavings / client.financialInfo.totalMonthlyExpenses)} months`
                      : 'N/A'
                    }
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    {client.assets?.cashBankSavings && client.financialInfo?.totalMonthlyExpenses &&
                      (client.assets.cashBankSavings / client.financialInfo.totalMonthlyExpenses) >= 6
                        ? 'Adequate' : 'Insufficient'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Expense Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Detailed Monthly Expenses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(client.financialInfo?.monthlyExpenses || {}).map(([category, amount]) => (
                  <div key={category} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        amount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {amount > 0 ? 'Active' : 'No Expense'}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {formatCurrency(amount)}
                    </p>
                    {amount > 0 && (
                      <div className="text-sm text-gray-600">
                        {client.financialInfo?.totalMonthlyExpenses && 
                          `${((amount / client.financialInfo.totalMonthlyExpenses) * 100).toFixed(1)}% of total expenses`
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Expense Breakdown */}
            {client.financialInfo?.expenseBreakdown && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Enhanced Expense Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(client.financialInfo.expenseBreakdown).map(([category, amount]) => (
                    <div key={category} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 capitalize">
                          {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          amount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {amount > 0 ? 'Tracked' : 'Not Set'}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-2">
                        {formatCurrency(amount)}
                      </p>
                      <div className="text-sm text-gray-600">
                        {client.financialInfo?.totalMonthlyExpenses && amount > 0 &&
                          `${((amount / client.financialInfo.totalMonthlyExpenses) * 100).toFixed(1)}% of total expenses`
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ASSET ALLOCATION TAB */}
        {activeTab === 'assets' && (
          <div className="space-y-8">
            {/* Assets Summary */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Assets & Investments</h3>
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
              
              {/* Basic Assets */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Basic Assets</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Cash & Bank Savings</p>
                    <p className="font-medium">{formatCurrency(client.assets?.cashBankSavings)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Real Estate</p>
                    <p className="font-medium">{formatCurrency(client.assets?.realEstate)}</p>
                  </div>
                </div>
              </div>

              {/* Equity Investments */}
              {client.assets?.investments?.equity && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Equity Investments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Mutual Funds</p>
                      <p className="font-medium">{formatCurrency(client.assets.investments.equity?.mutualFunds)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Direct Stocks</p>
                      <p className="font-medium">{formatCurrency(client.assets.investments.equity?.directStocks)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fixed Income */}
              {client.assets?.investments?.fixedIncome && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Fixed Income Investments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">PPF</p>
                      <p className="font-medium">{formatCurrency(client.assets.investments.fixedIncome?.ppf)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">EPF</p>
                      <p className="font-medium">{formatCurrency(client.assets.investments.fixedIncome?.epf)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">NPS</p>
                      <p className="font-medium">{formatCurrency(client.assets.investments.fixedIncome?.nps)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fixed Deposits</p>
                      <p className="font-medium">{formatCurrency(client.assets.investments.fixedIncome?.fixedDeposits)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bonds & Debentures</p>
                      <p className="font-medium">{formatCurrency(client.assets.investments.fixedIncome?.bondsDebentures)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">NSC</p>
                      <p className="font-medium">{formatCurrency(client.assets.investments.fixedIncome?.nsc)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Investments */}
              {client.assets?.investments?.other && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Other Investments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">ULIP</p>
                      <p className="font-medium">{formatCurrency(client.assets.investments.other?.ulip)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Other Investments</p>
                      <p className="font-medium">{formatCurrency(client.assets.investments.other?.otherInvestments)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Assets Breakdown Chart */}
            {prepareAssetsBreakdownChart() && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Assets Distribution</h3>
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <PieChart className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="h-80">
                  <Doughnut 
                    data={prepareAssetsBreakdownChart()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 20,
                            usePointStyle: true
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((context.parsed / total) * 100).toFixed(1);
                              return `${context.label}: ₹${context.parsed.toLocaleString('en-IN')} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* DEBTS TAB */}
        {activeTab === 'debts' && (
          <div className="space-y-6">
            {/* Home Loan */}
            {client.debtsAndLiabilities?.homeLoan && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Home Loan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Has Loan</p>
                    <p className="font-medium">{client.debtsAndLiabilities.homeLoan.hasLoan ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Outstanding Amount</p>
                    <p className="font-medium">{formatCurrency(client.debtsAndLiabilities.homeLoan?.outstandingAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly EMI</p>
                    <p className="font-medium">{formatCurrency(client.debtsAndLiabilities.homeLoan?.monthlyEMI)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-medium">{safeDisplay(client.debtsAndLiabilities.homeLoan?.interestRate)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining Tenure</p>
                    <p className="font-medium">{safeDisplay(client.debtsAndLiabilities.homeLoan?.remainingTenure)} months</p>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Loan */}
            {client.debtsAndLiabilities?.personalLoan && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Loan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Has Loan</p>
                    <p className="font-medium">{client.debtsAndLiabilities.personalLoan.hasLoan ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Outstanding Amount</p>
                    <p className="font-medium">{formatCurrency(client.debtsAndLiabilities.personalLoan?.outstandingAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly EMI</p>
                    <p className="font-medium">{formatCurrency(client.debtsAndLiabilities.personalLoan?.monthlyEMI)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-medium">{safeDisplay(client.debtsAndLiabilities.personalLoan?.interestRate)}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Car Loan */}
            {client.debtsAndLiabilities?.carLoan && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  Car Loan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Has Loan</p>
                    <p className="font-medium">{client.debtsAndLiabilities.carLoan.hasLoan ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Outstanding Amount</p>
                    <p className="font-medium">{formatCurrency(client.debtsAndLiabilities.carLoan?.outstandingAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly EMI</p>
                    <p className="font-medium">{formatCurrency(client.debtsAndLiabilities.carLoan?.monthlyEMI)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-medium">{safeDisplay(client.debtsAndLiabilities.carLoan?.interestRate)}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Education Loan */}
            {client.debtsAndLiabilities?.educationLoan && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Education Loan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Has Loan</p>
                    <p className="font-medium">{client.debtsAndLiabilities.educationLoan.hasLoan ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Outstanding Amount</p>
                    <p className="font-medium">{formatCurrency(client.debtsAndLiabilities.educationLoan?.outstandingAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly EMI</p>
                    <p className="font-medium">{formatCurrency(client.debtsAndLiabilities.educationLoan?.monthlyEMI)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-medium">{safeDisplay(client.debtsAndLiabilities.educationLoan?.interestRate)}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Credit Cards */}
            {client.debtsAndLiabilities?.creditCards && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Credit Cards
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Has Debt</p>
                    <p className="font-medium">{client.debtsAndLiabilities.creditCards.hasDebt ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Outstanding</p>
                    <p className="font-medium">{formatCurrency(client.debtsAndLiabilities.creditCards?.totalOutstanding)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Payment</p>
                    <p className="font-medium">{formatCurrency(client.debtsAndLiabilities.creditCards?.monthlyPayment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Interest Rate</p>
                    <p className="font-medium">{safeDisplay(client.debtsAndLiabilities.creditCards?.averageInterestRate)}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Other Loans */}
            {client.debtsAndLiabilities?.otherLoans && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Loans</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Has Loan</p>
                    <p className="font-medium">{client.debtsAndLiabilities.otherLoans.hasLoan ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loan Type</p>
                    <p className="font-medium">{safeDisplay(client.debtsAndLiabilities.otherLoans?.loanType)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Outstanding Amount</p>
                    <p className="font-medium">{formatCurrency(client.debtsAndLiabilities.otherLoans?.outstandingAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly EMI</p>
                    <p className="font-medium">{formatCurrency(client.debtsAndLiabilities.otherLoans?.monthlyEMI)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Details */}
            {client.bankDetails && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Bank Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-medium">{safeDisplay(client.bankDetails?.accountNumber)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">IFSC Code</p>
                    <p className="font-medium">{safeDisplay(client.bankDetails?.ifscCode)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bank Name</p>
                    <p className="font-medium">{safeDisplay(client.bankDetails?.bankName)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Branch Name</p>
                    <p className="font-medium">{safeDisplay(client.bankDetails?.branchName)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Progress */}
            {client.formProgress && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ClipboardCheck className="h-5 w-5 mr-2" />
                  Onboarding Progress
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1,2,3,4,5,6,7].map(step => (
                    <div key={step} className="text-center">
                      <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        client.formProgress[`step${step}Completed`] ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step}
                      </div>
                      <p className="text-xs">{client.formProgress[`step${step}Completed`] ? 'Complete' : 'Pending'}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">Current Step: {safeDisplay(client.formProgress?.currentStep)} / 7</p>
                  <p className="text-xs text-gray-500">Last Saved: {formatDate(client.formProgress?.lastSavedAt)}</p>
                </div>
              </div>
            )}

            {/* Client Notes */}
            {client.notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <StickyNote className="h-5 w-5 mr-2" />
                  Client Notes
                </h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm">{safeDisplay(client.notes)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INSURANCE TAB */}
        {activeTab === 'insurance' && (
          <div className="space-y-6">
            {/* Life Insurance */}
            {client.insuranceCoverage?.lifeInsurance && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Life Insurance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Has Insurance</p>
                    <p className="font-medium">{client.insuranceCoverage.lifeInsurance.hasInsurance ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Cover Amount</p>
                    <p className="font-medium">{formatCurrency(client.insuranceCoverage.lifeInsurance?.totalCoverAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Annual Premium</p>
                    <p className="font-medium">{formatCurrency(client.insuranceCoverage.lifeInsurance?.annualPremium)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Insurance Type</p>
                    <p className="font-medium">{safeDisplay(client.insuranceCoverage.lifeInsurance?.insuranceType)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Health Insurance */}
            {client.insuranceCoverage?.healthInsurance && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Health Insurance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Has Insurance</p>
                    <p className="font-medium">{client.insuranceCoverage.healthInsurance.hasInsurance ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Cover Amount</p>
                    <p className="font-medium">{formatCurrency(client.insuranceCoverage.healthInsurance?.totalCoverAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Annual Premium</p>
                    <p className="font-medium">{formatCurrency(client.insuranceCoverage.healthInsurance?.annualPremium)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Family Members</p>
                    <p className="font-medium">{safeDisplay(client.insuranceCoverage.healthInsurance?.familyMembers)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Insurance */}
            {client.insuranceCoverage?.vehicleInsurance && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  Vehicle Insurance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Has Insurance</p>
                    <p className="font-medium">{client.insuranceCoverage.vehicleInsurance.hasInsurance ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Annual Premium</p>
                    <p className="font-medium">{formatCurrency(client.insuranceCoverage.vehicleInsurance?.annualPremium)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Other Insurance */}
            {client.insuranceCoverage?.otherInsurance && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Insurance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Has Insurance</p>
                    <p className="font-medium">{client.insuranceCoverage.otherInsurance.hasInsurance ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Insurance Types</p>
                    <p className="font-medium">{safeDisplay(client.insuranceCoverage.otherInsurance?.insuranceTypes)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Annual Premium</p>
                    <p className="font-medium">{formatCurrency(client.insuranceCoverage.otherInsurance?.annualPremium)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINANCIAL OBJECTIVES TAB */}
        {activeTab === 'goals' && (
          <div className="space-y-8">
            {/* Major Goals */}
            {client.majorGoals && client.majorGoals.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Major Financial Objectives</h3>
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  {client.majorGoals.map((goal, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Goal Name</p>
                          <p className="font-medium">{safeDisplay(goal?.goalName)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Target Amount</p>
                          <p className="font-medium">{formatCurrency(goal?.targetAmount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Target Year</p>
                          <p className="font-medium">{safeDisplay(goal?.targetYear)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Priority</p>
                          <span className={`px-2 py-1 rounded text-xs ${
                            goal?.priority === 'High' ? 'bg-red-100 text-red-800' :
                            goal?.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {safeDisplay(goal?.priority)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Financial Goals */}
            {client.enhancedFinancialGoals && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Financial Goals</h3>
                
                {/* Emergency Fund */}
                {client.enhancedFinancialGoals.emergencyFund && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Emergency Fund</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Priority</p>
                        <p className="font-medium">{safeDisplay(client.enhancedFinancialGoals.emergencyFund?.priority)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Target Amount</p>
                        <p className="font-medium">{formatCurrency(client.enhancedFinancialGoals.emergencyFund?.targetAmount)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Child Education */}
                {client.enhancedFinancialGoals.childEducation?.isApplicable && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Child Education</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Target Amount</p>
                        <p className="font-medium">{formatCurrency(client.enhancedFinancialGoals.childEducation?.targetAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Target Year</p>
                        <p className="font-medium">{safeDisplay(client.enhancedFinancialGoals.childEducation?.targetYear)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Goals */}
                {client.enhancedFinancialGoals.customGoals && client.enhancedFinancialGoals.customGoals.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Custom Goals</h4>
                    <div className="space-y-3">
                      {client.enhancedFinancialGoals.customGoals.map((goal, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <p className="text-sm text-gray-600">Goal Name</p>
                              <p className="font-medium">{safeDisplay(goal?.goalName)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Target Amount</p>
                              <p className="font-medium">{formatCurrency(goal?.targetAmount)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Priority</p>
                              <p className="font-medium">{safeDisplay(goal?.priority)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Investment Goals */}
            {client.investmentGoals && client.investmentGoals.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Goals</h3>
                <div className="flex flex-wrap gap-2">
                  {client.investmentGoals.map((goal, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {safeDisplay(goal)}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Investment Horizon</p>
                  <p className="font-medium">{safeDisplay(client.investmentHorizon)}</p>
                </div>
              </div>
            )}

            {/* Goal Progress Chart */}
            {prepareGoalProgressChart() && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Goal Progress Comparison</h3>
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="h-80">
                  <Bar 
                    data={prepareGoalProgressChart()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top'
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString('en-IN')}`;
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
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* RETIREMENT TAB */}
        {activeTab === 'retirement' && (
          <div className="space-y-6">
            {client.retirementPlanning && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PiggyBank className="h-5 w-5 mr-2" />
                  Retirement Planning
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Age</p>
                    <p className="font-medium">{safeDisplay(client.retirementPlanning?.currentAge)} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Retirement Age</p>
                    <p className="font-medium">{safeDisplay(client.retirementPlanning?.retirementAge)} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Has Retirement Corpus</p>
                    <p className="font-medium">{client.retirementPlanning?.hasRetirementCorpus ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Retirement Corpus</p>
                    <p className="font-medium">{formatCurrency(client.retirementPlanning?.currentRetirementCorpus)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Target Retirement Corpus</p>
                    <p className="font-medium">{formatCurrency(client.retirementPlanning?.targetRetirementCorpus)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Years to Retirement</p>
                    <p className="font-medium">
                      {client.retirementPlanning?.retirementAge && client.retirementPlanning?.currentAge
                        ? client.retirementPlanning.retirementAge - client.retirementPlanning.currentAge
                        : 'Not Available'} years
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CAS DATA TAB */}
        {activeTab === 'cas-data' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                CAS (Consolidated Account Statement) Data
              </h3>
              
              {/* CAS Status */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">CAS Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(client.casData?.casStatus)}`}>
                      {safeDisplay(client.casData?.casStatus)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Parsed</p>
                    <p className="font-medium">{formatDate(client.casData?.lastParsedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Parse Error</p>
                    <p className="font-medium text-red-600">{safeDisplay(client.casData?.parseError)}</p>
                  </div>
                </div>
              </div>

              {/* Investor Information */}
              {client.casData?.parsedData?.investor && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Investor Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{safeDisplay(client.casData.parsedData.investor?.name)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">PAN</p>
                      <p className="font-medium">{safeDisplay(client.casData.parsedData.investor?.pan)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{safeDisplay(client.casData.parsedData.investor?.email)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Mobile</p>
                      <p className="font-medium">{safeDisplay(client.casData.parsedData.investor?.mobile)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Demat Accounts */}
              {client.casData?.parsedData?.demat_accounts && client.casData.parsedData.demat_accounts.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Demat Accounts ({client.casData.parsedData.demat_accounts.length})</h4>
                  <div className="space-y-4">
                    {client.casData.parsedData.demat_accounts.map((account, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">DP Name</p>
                            <p className="font-medium">{safeDisplay(account?.dp_name)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Client ID</p>
                            <p className="font-medium">{safeDisplay(account?.client_id)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Value</p>
                            <p className="font-medium">{formatCurrency(account?.value)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mutual Funds */}
              {client.casData?.parsedData?.mutual_funds && client.casData.parsedData.mutual_funds.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Mutual Funds ({client.casData.parsedData.mutual_funds.length})</h4>
                  <div className="space-y-4">
                    {client.casData.parsedData.mutual_funds.map((fund, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">AMC</p>
                            <p className="font-medium">{safeDisplay(fund?.amc)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Folio Number</p>
                            <p className="font-medium">{safeDisplay(fund?.folio_number)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Value</p>
                            <p className="font-medium">{formatCurrency(fund?.value)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MEETINGS TAB */}
        {activeTab === 'meetings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Meetings ({clientData.meetings?.count || 0})
              </h3>
              {clientData.meetings?.meetings && clientData.meetings.meetings.length > 0 ? (
                <div className="space-y-4">
                  {clientData.meetings.meetings.map((meeting, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Room Name</p>
                          <p className="font-medium">{safeDisplay(meeting?.roomName)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(meeting?.status)}`}>
                            {safeDisplay(meeting?.status)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Scheduled At</p>
                          <p className="font-medium">{formatDate(meeting?.scheduledAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="font-medium">{safeDisplay(meeting?.duration)} minutes</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Meeting Type</p>
                          <p className="font-medium">{safeDisplay(meeting?.meetingType)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Has Transcript</p>
                          <p className="font-medium">{meeting?.hasTranscript ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Started At</p>
                          <p className="font-medium">{formatDate(meeting?.startedAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Ended At</p>
                          <p className="font-medium">{formatDate(meeting?.endedAt)}</p>
                        </div>
                      </div>
                      {meeting?.transcript && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="font-medium mb-2">Transcript Details</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-gray-600">Status</p>
                              <p className="font-medium">{safeDisplay(meeting.transcript?.status)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Language</p>
                              <p className="font-medium">{safeDisplay(meeting.transcript?.language)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Messages Count</p>
                              <p className="font-medium">{meeting.transcript?.realTimeMessages?.length || 0}</p>
                            </div>
                          </div>
                          
                          {/* Real-time Messages */}
                          {meeting.transcript?.realTimeMessages && meeting.transcript.realTimeMessages.length > 0 && (
                            <div className="mt-4">
                              <h6 className="font-medium mb-2">Conversation Transcript</h6>
                              <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded">
                                {meeting.transcript.realTimeMessages.slice(0, 10).map((message, msgIndex) => (
                                  <div key={msgIndex} className="mb-2">
                                    <p className="text-sm">
                                      <span className="font-medium">{safeDisplay(message?.participantName)}:</span> 
                                      <span className="ml-2">{safeDisplay(message?.text)}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">{formatDate(message?.timestamp)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Final Transcript */}
                          {meeting.transcript?.finalTranscript && (
                            <div className="mt-4">
                              <h6 className="font-medium mb-2">Final Transcript</h6>
                              <div className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                                <p className="text-sm whitespace-pre-wrap">{meeting.transcript.finalTranscript}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Enhanced Transcript Display Toggle */}
                          {meeting?.hasTranscript && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center justify-between mb-3">
                                <h6 className="font-medium text-gray-900">Enhanced Transcript View</h6>
                                <button
                                  onClick={() => setEnhancedTranscriptMode(prev => ({
                                    ...prev,
                                    [meeting._id]: !prev[meeting._id]
                                  }))}
                                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                >
                                  {enhancedTranscriptMode[meeting._id] ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-1" />
                                      Hide Enhanced View
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-1" />
                                      Show Enhanced View
                                    </>
                                  )}
                                </button>
                              </div>
                              
                              {/* Enhanced Transcript Display */}
                              {enhancedTranscriptMode[meeting._id] && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <EnhancedTranscriptDisplay 
                                    meeting={meeting}
                                    onTranscriptLoad={(data) => {
                                      console.log('Enhanced transcript loaded for meeting:', meeting._id, data);
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No meetings found for this client.</p>
              )}
            </div>
          </div>
        )}

        {/* RISK ASSESSMENT TAB */}
        {activeTab === 'risk-profile' && (
          <div className="space-y-8">
            {/* Risk Profile Summary */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Risk Assessment Profile</h3>
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              
              {/* Basic Risk Profile */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Basic Risk Assessment</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Investment Experience</p>
                    <p className="font-medium">{safeDisplay(client.riskProfile?.investmentExperience)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Risk Tolerance</p>
                    <p className="font-medium">{safeDisplay(client.riskProfile?.riskTolerance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Investment Horizon</p>
                    <p className="font-medium">{safeDisplay(client.investmentHorizon)}</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Risk Profile */}
              {client.riskProfile?.enhancedRiskProfile && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Enhanced Risk Assessment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Investment Experience Level</p>
                      <p className="font-medium">{safeDisplay(client.riskProfile.enhancedRiskProfile?.investmentExperience)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Risk Tolerance Level</p>
                      <p className="font-medium">{safeDisplay(client.riskProfile.enhancedRiskProfile?.riskTolerance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Investment Capacity</p>
                      <p className="font-medium">{formatCurrency(client.riskProfile.enhancedRiskProfile?.monthlyInvestmentCapacity)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Risk Profile Radar Chart */}
            {prepareRiskProfileChart() && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Risk Profile Visualization</h3>
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Activity className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="h-80">
                  <Radar 
                    data={prepareRiskProfileChart()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 3,
                          ticks: {
                            stepSize: 1,
                            callback: function(value) {
                              return value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High';
                            }
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const labels = ['Low', 'Medium', 'High'];
                              return `${context.label}: ${labels[context.parsed.r - 1]}`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI CONSULTATIONS TAB */}
        {activeTab === 'chat' && (
          <div className="space-y-8">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">AI Consultations History</h3>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">Total Consultations: {clientData.chatHistory?.count || 0}</div>
              
              {clientData.chatHistory?.conversations && clientData.chatHistory.conversations.length > 0 ? (
                <div className="space-y-4">
                  {clientData.chatHistory.conversations.map((chat, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{safeDisplay(chat?.title)}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              chat?.status === 'active' ? 'bg-green-500' : 
                              chat?.status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
                            }`}></span>
                            Status: {safeDisplay(chat?.status)}
                          </span>
                          <span>Messages: {chat?.messages?.length || 0}</span>
                        </div>
                      </div>
                      
                      {/* Display recent messages */}
                      {chat?.messages && chat.messages.length > 0 && (
                        <div className="max-h-60 overflow-y-auto bg-white p-4 rounded-lg border border-gray-200">
                          {chat.messages.slice(-5).map((message, msgIndex) => (
                            <div key={msgIndex} className="mb-4 last:mb-0">
                              <div className="flex items-start space-x-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  message.role === 'advisor' ? 'bg-blue-100 text-blue-800' : 
                                  message.role === 'ai' ? 'bg-green-100 text-green-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {safeDisplay(message?.role)}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900 leading-relaxed">{safeDisplay(message?.content)}</p>
                                  <p className="text-xs text-gray-500 mt-2">{formatDate(message?.timestamp)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No AI chat conversations found for this client.</p>
              )}
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Legal Documents ({clientData.legalDocuments?.loeCount || 0})
              </h3>
              
              {/* LOE Documents */}
              {clientData.legalDocuments?.loeDocuments && clientData.legalDocuments.loeDocuments.length > 0 ? (
                <div className="space-y-4">
                  {clientData.legalDocuments.loeDocuments.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Document Type</p>
                          <p className="font-medium">{safeDisplay(doc?.documentType)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(doc?.status)}`}>
                            {safeDisplay(doc?.status)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Upload Date</p>
                          <p className="font-medium">{formatDate(doc?.uploadDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">File Name</p>
                          <p className="font-medium">{safeDisplay(doc?.fileName)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">File Size</p>
                          <p className="font-medium">
                            {doc?.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : 'Not Available'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Processing Status</p>
                          <p className="font-medium">{safeDisplay(doc?.processingStatus)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No LOE documents found for this client.</p>
              )}
            </div>
          </div>
        )}

        {/* FINANCIAL PLANS TAB */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileBarChart className="h-5 w-5 mr-2" />
                Financial Plans ({clientData.financialPlans?.count || 0})
              </h3>
              
              {clientData.financialPlans?.plans && clientData.financialPlans.plans.length > 0 ? (
                <div className="space-y-4">
                  {clientData.financialPlans.plans.map((plan, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Plan Name</p>
                          <p className="font-medium">{safeDisplay(plan?.planName)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(plan?.status)}`}>
                            {safeDisplay(plan?.status)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Created Date</p>
                          <p className="font-medium">{formatDate(plan?.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Last Updated</p>
                          <p className="font-medium">{formatDate(plan?.updatedAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Plan Type</p>
                          <p className="font-medium">{safeDisplay(plan?.planType)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Risk Level</p>
                          <p className="font-medium">{safeDisplay(plan?.riskLevel)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No financial plans found for this client.</p>
              )}
            </div>
          </div>
        )}

        {/* KYC TAB */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                KYC & Compliance
              </h3>
              
              {/* Basic KYC Info */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">KYC Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">KYC Status</p>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(client.kycInfo?.kycStatus)}`}>
                      {safeDisplay(client.kycInfo?.kycStatus)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium">{formatDate(client.kycInfo?.lastUpdated)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Verification Level</p>
                    <p className="font-medium">{safeDisplay(client.kycInfo?.verificationLevel)}</p>
                  </div>
                </div>
              </div>

              {/* KYC Documents */}
              {client.kycInfo?.documents && client.kycInfo.documents.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">KYC Documents</h4>
                  <div className="space-y-3">
                    {client.kycInfo.documents.map((doc, index) => (
                      <div key={index} className="border rounded p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <p className="text-sm text-gray-600">Document Type</p>
                            <p className="font-medium">{safeDisplay(doc?.documentType)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(doc?.status)}`}>
                              {safeDisplay(doc?.status)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Upload Date</p>
                            <p className="font-medium">{formatDate(doc?.uploadDate)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Communication Preferences
              </h3>
              
              {/* Communication Preferences */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Contact Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Preferred Contact Method</p>
                    <p className="font-medium">{safeDisplay(client.communicationPreferences?.preferredContactMethod)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email Notifications</p>
                    <p className="font-medium">{client.communicationPreferences?.emailNotifications ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">SMS Notifications</p>
                    <p className="font-medium">{client.communicationPreferences?.smsNotifications ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Meeting Reminders</p>
                    <p className="font-medium">{client.communicationPreferences?.meetingReminders ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              </div>

              {/* Investment Preferences */}
              {client.communicationPreferences?.investmentPreferences && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Investment Preferences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Risk Tolerance</p>
                      <p className="font-medium">{safeDisplay(client.communicationPreferences.investmentPreferences?.riskTolerance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Investment Horizon</p>
                      <p className="font-medium">{safeDisplay(client.communicationPreferences.investmentPreferences?.investmentHorizon)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Preferred Asset Classes</p>
                      <p className="font-medium">{safeDisplay(client.communicationPreferences.investmentPreferences?.preferredAssetClasses)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AB TESTING TAB */}
        {activeTab === 'ab-testing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                AB Test Sessions ({clientData.abTesting?.count || 0})
              </h3>
              
              {clientData.abTesting?.sessions && clientData.abTesting.sessions.length > 0 ? (
                <div className="space-y-6">
                  {clientData.abTesting.sessions.map((session, index) => (
                    <div key={index} className="border rounded-lg p-6 bg-gray-50">
                      {/* Session Overview */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">Session Overview</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Session ID</p>
                            <p className="font-medium">{safeDisplay(session?.sessionId)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(session?.status)}`}>
                              {safeDisplay(session?.status)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Start Time</p>
                            <p className="font-medium">{formatDate(session?.sessionStartTime)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Duration</p>
                            <p className="font-medium">{safeDisplay(session?.sessionDurationMinutes)} minutes</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Completion %</p>
                            <p className="font-medium">{safeDisplay(session?.completionPercentage)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Selected Scenarios</p>
                            <p className="font-medium">{safeDisplay(session?.selectedScenariosCount)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Risk Profile Results */}
                      {session?.riskProfile?.calculatedRiskScore && (
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-3">Risk Assessment Results</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded">
                            <div>
                              <p className="text-sm text-gray-600">Risk Category</p>
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                session.riskProfile.calculatedRiskScore.riskCategory === 'Conservative' ? 'bg-green-100 text-green-800' :
                                session.riskProfile.calculatedRiskScore.riskCategory === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                session.riskProfile.calculatedRiskScore.riskCategory === 'Aggressive' ? 'bg-red-100 text-red-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {safeDisplay(session.riskProfile.calculatedRiskScore?.riskCategory)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Risk Score</p>
                              <p className="font-medium">{safeDisplay(session.riskProfile.calculatedRiskScore?.totalScore)} / {safeDisplay(session.riskProfile.calculatedRiskScore?.maxPossibleScore)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Risk Percentage</p>
                              <p className="font-medium">{safeDisplay(session.riskProfile.calculatedRiskScore?.riskPercentage)}%</p>
                            </div>
                          </div>
                          
                          {/* Recommended Allocation */}
                          {session.riskProfile?.recommendedAllocation && (
                            <div className="mt-4 bg-white p-4 rounded">
                              <h5 className="font-medium mb-2">Recommended Asset Allocation</h5>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-blue-600">{safeDisplay(session.riskProfile.recommendedAllocation?.equity)}%</p>
                                  <p className="text-sm text-gray-600">Equity</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-green-600">{safeDisplay(session.riskProfile.recommendedAllocation?.debt)}%</p>
                                  <p className="text-sm text-gray-600">Debt</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-purple-600">{safeDisplay(session.riskProfile.recommendedAllocation?.alternatives)}%</p>
                                  <p className="text-sm text-gray-600">Alternatives</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Investment Scenarios */}
                      {session?.scenarios && session.scenarios.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-3">Investment Scenarios ({session.scenarios.length})</h4>
                          <div className="space-y-4">
                            {session.scenarios.map((scenario, scenarioIndex) => (
                              <div key={scenarioIndex} className={`border rounded-lg p-4 ${scenario.isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-medium">{safeDisplay(scenario?.scenarioName)}</h5>
                                  {scenario.isSelected && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Selected</span>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600">Type</p>
                                    <p className="font-medium">{safeDisplay(scenario?.scenarioType)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Expected Return</p>
                                    <p className="font-medium">{safeDisplay(scenario?.parameters?.expectedReturn)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Monthly Investment</p>
                                    <p className="font-medium">{formatCurrency(scenario?.monthlyInvestment)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Suitability Score</p>
                                    <p className="font-medium">{safeDisplay(scenario?.suitabilityScore)}/100</p>
                                  </div>
                                </div>
                                
                                {/* Asset Allocation */}
                                {scenario?.parameters && (
                                  <div className="mt-3 pt-3 border-t">
                                    <p className="text-sm font-medium mb-2">Asset Allocation:</p>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>Equity: {safeDisplay(scenario.parameters?.equityAllocation)}%</div>
                                      <div>Debt: {safeDisplay(scenario.parameters?.debtAllocation)}%</div>
                                      <div>Alternatives: {safeDisplay(scenario.parameters?.alternativesAllocation)}%</div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Projected Returns */}
                                {scenario?.projectedReturns && (
                                  <div className="mt-3 pt-3 border-t">
                                    <p className="text-sm font-medium mb-2">Projected Returns:</p>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                                      <div>1Y: {formatCurrency(scenario.projectedReturns?.year1)}</div>
                                      <div>3Y: {formatCurrency(scenario.projectedReturns?.year3)}</div>
                                      <div>5Y: {formatCurrency(scenario.projectedReturns?.year5)}</div>
                                      <div>10Y: {formatCurrency(scenario.projectedReturns?.year10)}</div>
                                      <div>15Y: {formatCurrency(scenario.projectedReturns?.year15)}</div>
                                      <div>20Y: {formatCurrency(scenario.projectedReturns?.year20)}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Monte Carlo Simulation Results */}
                      {session?.simulationResults && session.simulationResults.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-3">Monte Carlo Simulation Results</h4>
                          {session.simulationResults.map((simulation, simIndex) => (
                            <div key={simIndex} className="bg-white rounded-lg p-4 mb-4">
                              <h5 className="font-medium mb-3">Scenario: {safeDisplay(simulation?.scenarioId)}</h5>
                              
                              {/* Portfolio Value Distribution */}
                              {simulation?.portfolioValueDistribution && (
                                <div className="mb-4">
                                  <h6 className="text-sm font-medium mb-2">Portfolio Value Distribution</h6>
                                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                                    <div>P10: {formatCurrency(simulation.portfolioValueDistribution?.p10)}</div>
                                    <div>P25: {formatCurrency(simulation.portfolioValueDistribution?.p25)}</div>
                                    <div>P50: {formatCurrency(simulation.portfolioValueDistribution?.p50)}</div>
                                    <div>P75: {formatCurrency(simulation.portfolioValueDistribution?.p75)}</div>
                                    <div>P90: {formatCurrency(simulation.portfolioValueDistribution?.p90)}</div>
                                    <div>Mean: {formatCurrency(simulation.portfolioValueDistribution?.mean)}</div>
                                  </div>
                                </div>
                              )}

                              {/* Risk Metrics */}
                              {simulation?.riskMetrics && (
                                <div className="mb-4">
                                  <h6 className="text-sm font-medium mb-2">Risk Metrics</h6>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                    <div>Volatility: {safeDisplay(simulation.riskMetrics?.volatility)}%</div>
                                    <div>Max Drawdown: {safeDisplay(simulation.riskMetrics?.maxDrawdown)}%</div>
                                    <div>VaR 95%: {formatCurrency(simulation.riskMetrics?.valueAtRisk95)}</div>
                                    <div>Sharpe Ratio: {safeDisplay(simulation.riskMetrics?.sharpeRatio)}</div>
                                    <div>Success Rate: {safeDisplay(simulation.riskMetrics?.successRate)}%</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Analysis */}
                      {session?.aiAnalysis && (
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-3">AI Analysis & Recommendations</h4>
                          <div className="bg-white rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Overall Recommendation</h5>
                                <p className="text-sm text-gray-600">{safeDisplay(session.aiAnalysis?.overallRecommendation)}</p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium mb-2">Risk Analysis</h5>
                                <p className="text-sm text-gray-600">{safeDisplay(session.aiAnalysis?.riskAnalysis)}</p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium mb-2">Goal Achievability</h5>
                                <p className="text-sm text-gray-600">{safeDisplay(session.aiAnalysis?.goalAchievabilityAnalysis)}</p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium mb-2">Confidence Score</h5>
                                <p className="text-lg font-medium text-blue-600">{safeDisplay(session.aiAnalysis?.confidenceScore)}/100</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Session Notes */}
                      {session?.sessionNotes && session.sessionNotes.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Session Notes ({session.sessionNotes.length})</h4>
                          <div className="bg-white rounded-lg p-4">
                            <div className="space-y-3 max-h-40 overflow-y-auto">
                              {session.sessionNotes.map((note, noteIndex) => (
                                <div key={noteIndex} className="border-l-4 border-blue-200 pl-3">
                                  <div className="flex justify-between items-start">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      note.noteType === 'advisor_note' ? 'bg-blue-100 text-blue-800' :
                                      note.noteType === 'system_note' ? 'bg-gray-100 text-gray-800' :
                                      note.noteType === 'client_feedback' ? 'bg-green-100 text-green-800' :
                                      'bg-purple-100 text-purple-800'
                                    }`}>
                                      {safeDisplay(note?.noteType)}
                                    </span>
                                    <span className="text-xs text-gray-500">{formatDate(note?.timestamp)}</span>
                                  </div>
                                  <p className="text-sm mt-1">{safeDisplay(note?.content)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No AB test sessions found for this client.</p>
              )}
            </div>
          </div>
        )}

        {/* ESTATE PLANNING TAB */}
        {activeTab === 'estate-planning' && (
          <div className="space-y-8">
            {/* ESTATE TAB RENDERING LOGGING */}
            {(() => {
              console.log(`\n🏠 [ESTATE TAB] Rendering Estate Planning tab content`);
              console.log(`📊 [ESTATE TAB] Client data available: ${!!clientData}`);
              console.log(`📋 [ESTATE TAB] Estate data available: ${!!clientData?.estateInformation}`);
              if (clientData?.estateInformation) {
                console.log(`📈 [ESTATE TAB] Estate exists: ${clientData.estateInformation.exists}`);
                console.log(`📊 [ESTATE TAB] Estate data fields: ${Object.keys(clientData.estateInformation.data || {}).length}`);
                console.log(`📋 [ESTATE TAB] Estate summary fields: ${Object.keys(clientData.estateInformation.summary || {}).length}`);
              }
              return null;
            })()}
            
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Estate Planning Information</h3>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Home className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              
              {/* COMPREHENSIVE ESTATE DATA DISPLAY - ALL 18 FIELDS */}
              <div className="space-y-8">
                
                {/* 1. CLIENT REFERENCE */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-600" />
                    Client Reference
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Client ID:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.clientId)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Record Status:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.exists ? 'Active' : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* 2. FAMILY STRUCTURE & BENEFICIARIES */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    Family Structure & Beneficiaries
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Spouse Exists:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.familyStructure?.spouse?.exists)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Spouse Name:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.familyStructure?.spouse?.fullName)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Children Count:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.familyStructure?.children?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Dependents Count:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.familyStructure?.dependents?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Beneficiaries Count:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.familyStructure?.beneficiaries?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Marriage Date:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.familyStructure?.spouse?.marriageDate)}</p>
                    </div>
                  </div>
                </div>

                {/* 3. REAL ESTATE PROPERTIES */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-blue-600" />
                    Real Estate Properties
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Properties Count:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.realEstateProperties?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Total Market Value:</span>
                      <p className="text-sm text-gray-900">
                        {clientData.estateInformation?.data?.realEstateProperties?.length > 0 
                          ? formatCurrency(clientData.estateInformation.data.realEstateProperties.reduce((sum, prop) => sum + (prop.financialDetails?.currentMarketValue || 0), 0))
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Property Types:</span>
                      <p className="text-sm text-gray-900">
                        {clientData.estateInformation?.data?.realEstateProperties?.length > 0 
                          ? clientData.estateInformation.data.realEstateProperties.map(prop => prop.propertyType).join(', ')
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Cities:</span>
                      <p className="text-sm text-gray-900">
                        {clientData.estateInformation?.data?.realEstateProperties?.length > 0 
                          ? clientData.estateInformation.data.realEstateProperties.map(prop => prop.propertyAddress?.city).filter(Boolean).join(', ')
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Rental Properties:</span>
                      <p className="text-sm text-gray-900">
                        {clientData.estateInformation?.data?.realEstateProperties?.length > 0 
                          ? clientData.estateInformation.data.realEstateProperties.filter(prop => prop.rentalDetails?.isRented).length
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Properties with Loans:</span>
                      <p className="text-sm text-gray-900">
                        {clientData.estateInformation?.data?.realEstateProperties?.length > 0 
                          ? clientData.estateInformation.data.realEstateProperties.filter(prop => prop.propertyLoan?.hasLoan).length
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. LEGAL DOCUMENTS STATUS */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Legal Documents Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Has Will:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.legalDocumentsStatus?.willDetails?.hasWill)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Will Type:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.legalDocumentsStatus?.willDetails?.willType)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Will Date:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.legalDocumentsStatus?.willDetails?.dateOfWill)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Trusts Count:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.legalDocumentsStatus?.trustStructures?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Has Power of Attorney:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.legalDocumentsStatus?.powerOfAttorney?.hasPOA)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Nominations Count:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.legalDocumentsStatus?.nominations?.length || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* 5. PERSONAL & DIGITAL ASSETS */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
                    Personal & Digital Assets
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Vehicles Count:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.personalAssets?.vehicles?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Valuables Count:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.personalAssets?.valuables?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Cryptocurrency Count:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.personalAssets?.digitalAssets?.cryptocurrency?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Digital Accounts Count:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.personalAssets?.digitalAssets?.digitalAccounts?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Intellectual Property Count:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.personalAssets?.digitalAssets?.intellectualProperty?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Total Vehicle Value:</span>
                      <p className="text-sm text-gray-900">
                        {clientData.estateInformation?.data?.personalAssets?.vehicles?.length > 0 
                          ? formatCurrency(clientData.estateInformation.data.personalAssets.vehicles.reduce((sum, vehicle) => sum + (vehicle.currentMarketValue || 0), 0))
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6. ESTATE PLANNING PREFERENCES */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Settings className="h-4 w-4 mr-2 text-blue-600" />
                    Estate Planning Preferences
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Religion:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.estatePreferences?.applicableLaws?.religion)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Distribution Method:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.estatePreferences?.distributionPreferences?.distributionMethod)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Personal Law:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.estatePreferences?.applicableLaws?.personalLaw)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Ancestral Property:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.estatePreferences?.applicableLaws?.ancestralProperty)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Guardianship Arrangements:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.estatePreferences?.guardianshipArrangements?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Philanthropy Count:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.estatePreferences?.philanthropy?.length || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* 7. HEALTHCARE & END-OF-LIFE DIRECTIVES */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-blue-600" />
                    Healthcare & End-of-Life Directives
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Blood Group:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.healthcareDirectives?.medicalProfile?.bloodGroup)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Chronic Conditions:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.healthcareDirectives?.medicalProfile?.chronicConditions?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Medical POA:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.healthcareDirectives?.healthcareDecisions?.medicalPowerOfAttorney?.hasDesignated)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Organ Donor:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.healthcareDirectives?.healthcareDecisions?.treatmentPreferences?.organDonation?.isOrganDonor)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Body Donor:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.healthcareDirectives?.healthcareDecisions?.treatmentPreferences?.bodyDonation?.isBodyDonor)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Funeral Preference:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.healthcareDirectives?.finalArrangements?.funeralPreferences?.ceremonialType)}</p>
                    </div>
                  </div>
                </div>

                {/* 8. ESTATE METADATA */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
                    Estate Metadata
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Estimated Net Estate:</span>
                      <p className="text-sm text-gray-900">{formatCurrency(clientData.estateInformation?.data?.estateMetadata?.estimatedNetEstate)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Estate Tax Liability:</span>
                      <p className="text-sm text-gray-900">{formatCurrency(clientData.estateInformation?.data?.estateMetadata?.estateTaxLiability)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Succession Complexity:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.estateMetadata?.successionComplexity)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Legal Review Required:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.estateMetadata?.legalReviewRequired)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Documentation Gaps:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.estateMetadata?.documentationGaps?.length || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Priority Actions:</span>
                      <p className="text-sm text-gray-900">{clientData.estateInformation?.data?.estateMetadata?.priorityActions?.length || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* 9. TIMESTAMPS */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-600" />
                    Record Timestamps
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Created At:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Last Updated:</span>
                      <p className="text-sm text-gray-900">{safeDisplay(clientData.estateInformation?.data?.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* SUMMARY SECTION */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Estate Planning Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{clientData.estateInformation?.data ? '18' : '0'}</p>
                      <p className="text-sm text-blue-800">Data Fields Available</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {clientData.estateInformation?.data ? 
                          Object.values(clientData.estateInformation.data).filter(value => 
                            value !== null && value !== undefined && value !== '' && 
                            !(Array.isArray(value) && value.length === 0)
                          ).length 
                          : '0'
                        }
                      </p>
                      <p className="text-sm text-blue-800">Fields with Data</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {clientData.estateInformation?.data ? 
                          Math.round((Object.values(clientData.estateInformation.data).filter(value => 
                            value !== null && value !== undefined && value !== '' && 
                            !(Array.isArray(value) && value.length === 0)
                          ).length / 18) * 100)
                          : '0'
                        }%
                      </p>
                      <p className="text-sm text-blue-800">Data Completeness</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* MUTUAL FUND RECOMMENDATIONS TAB */}
        {activeTab === 'mutual-fund-recommendations' && (
          <div className="space-y-8">
            {/* MF TAB RENDERING LOGGING */}
            {(() => {
              console.log(`\n📈 [MF TAB] Rendering Mutual Fund Recommendations tab content`);
              console.log(`📊 [MF TAB] Client data available: ${!!clientData}`);
              console.log(`📋 [MF TAB] MF data available: ${!!clientData?.mutualFundRecommendations}`);
              if (clientData?.mutualFundRecommendations) {
                console.log(`📈 [MF TAB] MF count: ${clientData.mutualFundRecommendations.count}`);
                console.log(`📊 [MF TAB] MF recommendations: ${clientData.mutualFundRecommendations.recommendations?.length || 0}`);
                console.log(`📋 [MF TAB] MF summary fields: ${Object.keys(clientData.mutualFundRecommendations.summary || {}).length}`);
              }
              return null;
            })()}
            
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Mutual Fund Recommendations</h3>
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
              
              {clientData.mutualFundRecommendations?.count > 0 ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Total Recommendations</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {clientData.mutualFundRecommendations.summary.totalRecommendations}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Active</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {clientData.mutualFundRecommendations.summary.activeRecommendations}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Completed</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {clientData.mutualFundRecommendations.summary.completedRecommendations}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Total SIP Amount</h4>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency(clientData.mutualFundRecommendations.summary.totalSIPAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Recommendations List */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Recommendation Details</h4>
                    <div className="space-y-4">
                      {clientData.mutualFundRecommendations.recommendations.map((rec, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-gray-900">{safeDisplay(rec.fundName)}</h5>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rec.status)}`}>
                              {safeDisplay(rec.status)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Fund House</p>
                              <p className="font-medium">{safeDisplay(rec.fundHouseName)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Monthly SIP</p>
                              <p className="font-medium">{formatCurrency(rec.recommendedMonthlySIP)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Risk Profile</p>
                              <p className="font-medium">{safeDisplay(rec.riskProfile)}</p>
                            </div>
                          </div>
                          <div className="mt-3 text-sm">
                            <p className="text-gray-600">Investment Goal</p>
                            <p className="font-medium">{safeDisplay(rec.investmentGoal)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Mutual Fund Recommendations</h3>
                  <p className="text-gray-600">No mutual fund recommendations have been made for this client.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAX PLANNING TAB */}
        {activeTab === 'tax-planning' && (
          <div className="space-y-8">
            {/* TAX TAB RENDERING LOGGING */}
            {(() => {
              console.log(`\n🧾 [TAX TAB] Rendering Tax Planning tab content`);
              console.log(`📊 [TAX TAB] Client data available: ${!!clientData}`);
              console.log(`📋 [TAX TAB] Tax data available: ${!!clientData?.taxPlanning}`);
              if (clientData?.taxPlanning) {
                console.log(`📈 [TAX TAB] Tax plans count: ${clientData.taxPlanning.count}`);
                console.log(`📊 [TAX TAB] Tax plans: ${clientData.taxPlanning.plans?.length || 0}`);
                console.log(`📋 [TAX TAB] Tax summary fields: ${Object.keys(clientData.taxPlanning.summary || {}).length}`);
              }
              return null;
            })()}
            
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Tax Planning Strategies</h3>
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Calculator className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              
              {clientData.taxPlanning?.count > 0 ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Total Plans</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {clientData.taxPlanning.summary.totalPlans}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Total Tax Savings</h4>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(clientData.taxPlanning.summary.totalTaxSavings)}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Average Savings</h4>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(clientData.taxPlanning.summary.averageTaxSavings)}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Current Year Plan</h4>
                      <p className="text-sm font-bold text-orange-600">
                        {clientData.taxPlanning.summary.currentYearPlan ? 'Available' : 'Not Available'}
                      </p>
                    </div>
                  </div>

                  {/* Tax Plans List */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Tax Planning Details</h4>
                    <div className="space-y-4">
                      {clientData.taxPlanning.plans.map((plan, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-gray-900">Tax Year: {safeDisplay(plan.taxYear)}</h5>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                              {safeDisplay(plan.status)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Taxable Income</p>
                              <p className="font-medium">{formatCurrency(plan.taxCalculations?.taxableIncome)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Total Tax Liability</p>
                              <p className="font-medium">{formatCurrency(plan.taxCalculations?.totalTaxLiability)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Tax Savings</p>
                              <p className="font-medium text-green-600">{formatCurrency(plan.totalTaxSavings)}</p>
                            </div>
                          </div>
                          <div className="mt-3 text-sm">
                            <p className="text-gray-600">Priority</p>
                            <p className="font-medium">{safeDisplay(plan.priority)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tax Planning Data</h3>
                  <p className="text-gray-600">Tax planning strategies have not been developed for this client.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Debug Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs max-w-md">
          <h4 className="font-semibold mb-2">Debug Info</h4>
          <p>Client ID: {clientId}</p>
          <p>Active Tab: {activeTab}</p>
          <p>Data Fields: {debugInfo.clientFieldsCount}</p>
          <p>Processing Time: {debugInfo.processingTime}</p>
          <p>Last Fetch: {debugInfo.fetchTime && new Date(debugInfo.fetchTime).toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
}

export default ClientDetailReport;