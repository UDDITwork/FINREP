// File: frontend/src/components/taxPlanning/TaxPlanningPage.jsx
/**
 * Tax Planning Page Component
 * Comprehensive tax planning analysis and recommendations for clients
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Pie, Line } from 'react-chartjs-2';
import {
  Calculator,
  User,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Loader2,
  FileText,
  PieChart,
  BarChart3,
  Home,
  Car,
  CreditCard,
  GraduationCap,
  Heart,
  PiggyBank,
  Briefcase,
  Award,
  Eye,
  Download,
  RefreshCw,
  Baby,
  Stethoscope,
  HandHeart,
  Scale,
  Gavel,
  FileSignature,
  Lock,
  Key,
  Globe,
  Map,
  Camera,
  Image,
  Trash2,
  Copy,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  Info,
  Star,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Upload,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  BookOpen,
  FileCheck,
  UserCheck,
  Building2,
  AlertTriangle,
  Bot,
  Brain,
  Sparkles
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

function TaxPlanningPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [existingTaxPlanning, setExistingTaxPlanning] = useState(null);
  const [visualizationData, setVisualizationData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchTaxPlanningData();
    }
  }, [clientId]);

  const fetchTaxPlanningData = async () => {
    try {
      setLoading(true);
      console.log('💰 [Tax Planning] Fetching data for client:', clientId);
      
      const response = await api.get(`/tax-planning/client/${clientId}`);
      
      if (response.data.success) {
        setTaxData(response.data.data);
        setExistingTaxPlanning(response.data.data.existingTaxPlanning);
        console.log('✅ [Tax Planning] Data loaded successfully');
      } else {
        throw new Error(response.data.message || 'Failed to fetch tax planning data');
      }
    } catch (error) {
      console.error('❌ [Tax Planning] Error fetching data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch tax planning data');
      toast.error('Failed to load tax planning data');
    } finally {
      setLoading(false);
    }
  };

  const generateAIRecommendations = async () => {
    try {
      setGeneratingAI(true);
      console.log('🤖 [Tax Planning AI] Generating recommendations');
      
      const response = await api.post(`/tax-planning/client/${clientId}/ai-recommendations`, {
        taxYear: new Date().getFullYear().toString()
      });
      
      if (response.data.success) {
        const taxPlanningData = response.data.data.taxPlanning;
        const visualizationData = response.data.data.visualizationData;
        setExistingTaxPlanning(taxPlanningData);
        setVisualizationData(visualizationData);
        toast.success('AI recommendations generated successfully!');
        console.log('✅ [Tax Planning AI] Recommendations generated:', {
          recommendationsCount: taxPlanningData.aiRecommendations?.recommendations?.length || 0,
          totalSavings: taxPlanningData.aiRecommendations?.totalPotentialSavings || 0,
          hasVisualizationData: !!visualizationData
        });
      } else {
        throw new Error(response.data.message || 'Failed to generate AI recommendations');
      }
    } catch (error) {
      console.error('❌ [Tax Planning AI] Error:', error);
      toast.error('Failed to generate AI recommendations');
    } finally {
      setGeneratingAI(false);
    }
  };

  const saveManualInputs = async (manualInputs) => {
    try {
      setSaving(true);
      console.log('✍️ [Tax Planning Manual] Saving advisor inputs');
      
      const response = await api.post(`/tax-planning/client/${clientId}/manual-inputs`, {
        taxYear: new Date().getFullYear().toString(),
        manualInputs
      });
      
      if (response.data.success) {
        const updatedTaxPlanning = response.data.data.taxPlanning;
        setExistingTaxPlanning(updatedTaxPlanning);
        toast.success('Manual inputs saved successfully!');
        console.log('✅ [Tax Planning Manual] Inputs saved:', {
          recommendationsCount: updatedTaxPlanning.manualAdvisorInputs?.recommendations?.length || 0
        });
      } else {
        throw new Error(response.data.message || 'Failed to save manual inputs');
      }
    } catch (error) {
      console.error('❌ [Tax Planning Manual] Error:', error);
      toast.error('Failed to save manual inputs');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tax planning data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchTaxPlanningData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!taxData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-4" />
          <p className="text-gray-600">No tax planning data available</p>
        </div>
      </div>
    );
  }

  const { clientInfo, taxPlanningData } = taxData || {};
  const {
    personalInfo,
    incomeAnalysis,
    taxSavingInvestments,
    capitalGainsAnalysis,
    businessTaxConsiderations,
    casData,
    financialPlanAnalysis,
    estateTaxPlanning,
    dataCompleteness
  } = taxPlanningData || {};

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'income', label: 'Income Analysis', icon: DollarSign },
    { id: 'deductions', label: 'Tax Deductions', icon: TrendingDown },
    { id: 'capital-gains', label: 'Capital Gains', icon: TrendingUp },
    { id: 'business', label: 'Business Tax', icon: Briefcase },
    { id: 'ai-recommendations', label: 'AI Recommendations', icon: Bot },
    { id: 'visualizations', label: 'Before vs After', icon: BarChart3 },
    { id: 'manual-inputs', label: 'Manual Inputs', icon: Edit },
    { id: 'compliance', label: 'Compliance', icon: FileCheck }
  ];

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center min-w-0">
                <Calculator className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold text-gray-900 truncate">Tax Planning</h1>
                  <p className="text-sm text-gray-500 truncate">{clientInfo?.name || 'Loading...'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={generateAIRecommendations}
                disabled={generatingAI}
                className="hidden sm:flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {generatingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                <span className="hidden lg:inline">Generate AI Recommendations</span>
                <span className="lg:hidden">AI Recs</span>
              </button>
              
              <button
                onClick={fetchTaxPlanningData}
                className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                title="Refresh data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Completeness Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Data Completeness</span>
            </div>
            <div className="flex items-center">
              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dataCompleteness}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700">{dataCompleteness}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 sm:space-x-4 lg:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 overflow-x-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Personal Information Card */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700">PAN Number</label>
                      <p className="text-gray-900 truncate">{personalInfo?.panNumber || 'Not provided'}</p>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                      <p className="text-gray-900 truncate">{personalInfo?.maritalStatus || 'Not specified'}</p>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700">Dependents</label>
                      <p className="text-gray-900">{personalInfo?.numberOfDependents || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Income Analysis Card */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Income Analysis
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded border border-green-200 min-w-0">
                      <p className="text-sm text-green-700">Annual Income</p>
                      <p className="text-lg sm:text-xl font-bold text-green-800 truncate">{formatCurrency(incomeAnalysis?.annualIncome || 0)}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded border border-blue-200 min-w-0">
                      <p className="text-sm text-blue-700">Monthly Income</p>
                      <p className="text-lg sm:text-xl font-bold text-blue-800 truncate">{formatCurrency(incomeAnalysis?.totalMonthlyIncome || 0)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded border border-purple-200 min-w-0">
                      <p className="text-sm text-purple-700">Income Type</p>
                      <p className="text-base sm:text-lg font-bold text-purple-800 truncate">{incomeAnalysis?.incomeType || 'Not specified'}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded border border-orange-200 min-w-0">
                      <p className="text-sm text-orange-700">Additional Income</p>
                      <p className="text-lg sm:text-xl font-bold text-orange-800 truncate">{formatCurrency(incomeAnalysis?.additionalIncome || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Tax-Saving Investments Card */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Current Tax-Saving Investments
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700">Section 80C (PPF)</label>
                      <p className="text-base sm:text-lg font-bold text-green-600 truncate">{formatCurrency(taxSavingInvestments?.section80C?.ppf || 0)}</p>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700">Section 80C (EPF)</label>
                      <p className="text-base sm:text-lg font-bold text-green-600 truncate">{formatCurrency(taxSavingInvestments?.section80C?.epf || 0)}</p>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700">Section 80C (ELSS)</label>
                      <p className="text-base sm:text-lg font-bold text-green-600 truncate">{formatCurrency(taxSavingInvestments?.section80C?.elss || 0)}</p>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700">Section 80D (Health Insurance)</label>
                      <p className="text-base sm:text-lg font-bold text-blue-600 truncate">{formatCurrency(taxSavingInvestments?.section80D?.selfFamily || 0)}</p>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700">Section 80CCD(1B) (NPS)</label>
                      <p className="text-base sm:text-lg font-bold text-purple-600 truncate">{formatCurrency(taxSavingInvestments?.section80CCD1B?.npsAdditional || 0)}</p>
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700">Section 24B (Home Loan Interest)</label>
                      <p className="text-base sm:text-lg font-bold text-orange-600 truncate">{formatCurrency(taxSavingInvestments?.section24B?.homeLoanInterest || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Data Completeness */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Completeness</h3>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 mr-4 min-w-0">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${dataCompleteness || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-bold text-blue-600 flex-shrink-0">{dataCompleteness || 0}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Complete client information for better tax planning recommendations
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'income' && (
              <div className="space-y-6">
                <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Income Analysis</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded border min-w-0">
                      <h4 className="font-medium text-gray-900">Monthly Income</h4>
                      <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">
                        {formatCurrency(incomeAnalysis?.monthlyIncome || 0)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded border min-w-0">
                      <h4 className="font-medium text-gray-900">Annual Income</h4>
                      <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">
                        {formatCurrency(incomeAnalysis?.annualIncome || 0)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded border min-w-0">
                      <h4 className="font-medium text-gray-900">Income Type</h4>
                      <p className="text-base sm:text-lg text-gray-700 truncate">
                        {incomeAnalysis?.incomeType || 'Not specified'}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded border min-w-0">
                      <h4 className="font-medium text-gray-900">Additional Income</h4>
                      <p className="text-base sm:text-lg font-bold text-blue-600 truncate">
                        {formatCurrency(incomeAnalysis?.additionalIncome || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deductions' && (
              <div className="space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingDown className="h-5 w-5 mr-2" />
                    Tax Deductions Analysis
                  </h3>
                  
                  {/* Section 80C Analysis */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Section 80C Deductions (₹1.5L Limit)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded border border-green-200 min-w-0">
                        <label className="block text-sm font-medium text-green-700">PPF</label>
                        <p className="text-base sm:text-lg font-bold text-green-800 truncate">{formatCurrency(taxSavingInvestments?.section80C?.ppf || 0)}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded border border-green-200 min-w-0">
                        <label className="block text-sm font-medium text-green-700">EPF</label>
                        <p className="text-base sm:text-lg font-bold text-green-800 truncate">{formatCurrency(taxSavingInvestments?.section80C?.epf || 0)}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded border border-green-200 min-w-0">
                        <label className="block text-sm font-medium text-green-700">ELSS</label>
                        <p className="text-base sm:text-lg font-bold text-green-800 truncate">{formatCurrency(taxSavingInvestments?.section80C?.elss || 0)}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded border border-green-200 min-w-0">
                        <label className="block text-sm font-medium text-green-700">NSC</label>
                        <p className="text-base sm:text-lg font-bold text-green-800 truncate">{formatCurrency(taxSavingInvestments?.section80C?.nsc || 0)}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded border border-green-200 min-w-0">
                        <label className="block text-sm font-medium text-green-700">Life Insurance</label>
                        <p className="text-base sm:text-lg font-bold text-green-800 truncate">{formatCurrency(taxSavingInvestments?.section80C?.lifeInsurance || 0)}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded border border-green-200 min-w-0">
                        <label className="block text-sm font-medium text-green-700">Principal Repayment</label>
                        <p className="text-base sm:text-lg font-bold text-green-800 truncate">{formatCurrency(taxSavingInvestments?.section80C?.principalRepayment || 0)}</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-800 text-sm sm:text-base">Total 80C Utilization:</span>
                        <span className="text-base sm:text-lg font-bold text-blue-900 truncate ml-2">
                          {formatCurrency(taxSavingInvestments?.section80C?.total80C || 0)} / ₹1,50,000
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(((taxSavingInvestments?.section80C?.total80C || 0) / 150000) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">
                          {(((taxSavingInvestments?.section80C?.total80C || 0) / 150000) * 100).toFixed(1)}% utilized
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 80D Analysis */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Section 80D - Medical Insurance</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded border border-blue-200 min-w-0">
                        <label className="block text-sm font-medium text-blue-700">Self & Family</label>
                        <p className="text-base sm:text-lg font-bold text-blue-800 truncate">{formatCurrency(taxSavingInvestments?.section80D?.selfFamily || 0)}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded border border-blue-200 min-w-0">
                        <label className="block text-sm font-medium text-blue-700">Parents</label>
                        <p className="text-base sm:text-lg font-bold text-blue-800 truncate">{formatCurrency(taxSavingInvestments?.section80D?.parents || 0)}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded border border-blue-200 min-w-0">
                        <label className="block text-sm font-medium text-blue-700">Senior Citizen</label>
                        <p className="text-base sm:text-lg font-bold text-blue-800 truncate">{formatCurrency(taxSavingInvestments?.section80D?.seniorCitizen || 0)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Other Deductions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-purple-50 p-4 rounded border border-purple-200 min-w-0">
                      <h4 className="font-semibold text-purple-800 mb-2 text-sm sm:text-base">Section 80CCD(1B) - NPS Additional</h4>
                      <p className="text-base sm:text-lg font-bold text-purple-900 truncate">{formatCurrency(taxSavingInvestments?.section80CCD1B?.npsAdditional || 0)}</p>
                      <p className="text-sm text-purple-600">Limit: ₹50,000</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded border border-orange-200 min-w-0">
                      <h4 className="font-semibold text-orange-800 mb-2 text-sm sm:text-base">Section 24B - Home Loan Interest</h4>
                      <p className="text-base sm:text-lg font-bold text-orange-900 truncate">{formatCurrency(taxSavingInvestments?.section24B?.homeLoanInterest || 0)}</p>
                      <p className="text-sm text-orange-600">Limit: ₹2,00,000</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'capital-gains' && (
              <div className="space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Capital Gains Analysis
                  </h3>
                  
                  {/* Equity Investments */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Equity Investments</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="bg-green-50 p-4 rounded border border-green-200 min-w-0">
                        <h5 className="font-semibold text-green-800 mb-2">Direct Stocks</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 text-sm">Current Value:</span>
                            <span className="font-bold text-green-800 text-sm truncate ml-2">{formatCurrency(capitalGainsAnalysis?.equityInvestments?.directStocks?.currentValue || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 text-sm">Purchase Value:</span>
                            <span className="font-bold text-green-800 text-sm truncate ml-2">{formatCurrency(capitalGainsAnalysis?.equityInvestments?.directStocks?.purchaseValue || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 text-sm">LTCG:</span>
                            <span className="font-bold text-green-800 text-sm truncate ml-2">{formatCurrency(capitalGainsAnalysis?.equityInvestments?.directStocks?.ltcg || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 text-sm">STCG:</span>
                            <span className="font-bold text-green-800 text-sm truncate ml-2">{formatCurrency(capitalGainsAnalysis?.equityInvestments?.directStocks?.stcg || 0)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded border border-blue-200 min-w-0">
                        <h5 className="font-semibold text-blue-800 mb-2">Mutual Funds</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700 text-sm">Current Value:</span>
                            <span className="font-bold text-blue-800 text-sm truncate ml-2">{formatCurrency(capitalGainsAnalysis?.equityInvestments?.mutualFunds?.currentValue || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700 text-sm">Purchase Value:</span>
                            <span className="font-bold text-blue-800 text-sm truncate ml-2">{formatCurrency(capitalGainsAnalysis?.equityInvestments?.mutualFunds?.purchaseValue || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700 text-sm">LTCG:</span>
                            <span className="font-bold text-blue-800 text-sm truncate ml-2">{formatCurrency(capitalGainsAnalysis?.equityInvestments?.mutualFunds?.ltcg || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700 text-sm">STCG:</span>
                            <span className="font-bold text-blue-800 text-sm truncate ml-2">{formatCurrency(capitalGainsAnalysis?.equityInvestments?.mutualFunds?.stcg || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Debt Investments */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Debt Investments</h4>
                    <div className="bg-purple-50 p-4 rounded border border-purple-200">
                      <h5 className="font-semibold text-purple-800 mb-2">Bonds & Debentures</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-purple-700">Current Value:</span>
                          <span className="font-bold text-purple-800">{formatCurrency(capitalGainsAnalysis?.debtInvestments?.bondsDebentures?.currentValue || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Purchase Value:</span>
                          <span className="font-bold text-purple-800">{formatCurrency(capitalGainsAnalysis?.debtInvestments?.bondsDebentures?.purchaseValue || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">LTCG:</span>
                          <span className="font-bold text-purple-800">{formatCurrency(capitalGainsAnalysis?.debtInvestments?.bondsDebentures?.ltcg || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">STCG:</span>
                          <span className="font-bold text-purple-800">{formatCurrency(capitalGainsAnalysis?.debtInvestments?.bondsDebentures?.stcg || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real Estate */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Real Estate Properties</h4>
                    {capitalGainsAnalysis?.realEstate?.properties && capitalGainsAnalysis.realEstate.properties.length > 0 ? (
                      <div className="space-y-3">
                        {capitalGainsAnalysis.realEstate.properties.map((property, index) => (
                          <div key={index} className="bg-orange-50 p-4 rounded border border-orange-200">
                            <h5 className="font-semibold text-orange-800 mb-2">{property.propertyType || 'Property'}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-orange-700">Current Value:</span>
                                  <span className="font-bold text-orange-800">{formatCurrency(property.currentValue || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-orange-700">Purchase Value:</span>
                                  <span className="font-bold text-orange-800">{formatCurrency(property.purchaseValue || 0)}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-orange-700">LTCG:</span>
                                  <span className="font-bold text-orange-800">{formatCurrency(property.ltcg || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-orange-700">Holding Period:</span>
                                  <span className="font-bold text-orange-800">{property.holdingPeriod || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded border border-gray-200 text-center">
                        <p className="text-gray-600">No real estate properties found</p>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Capital Gains Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Long Term Capital Gains</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(capitalGainsAnalysis?.totalLTCG || 0)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Short Term Capital Gains</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(capitalGainsAnalysis?.totalSTCG || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Business Tax Considerations
                  </h3>
                  
                  {/* Business Income */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Business Income</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-green-50 p-4 rounded border border-green-200">
                        <h5 className="font-semibold text-green-800 mb-2">Business Income</h5>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(businessTaxConsiderations?.businessIncome || 0)}</p>
                        <p className="text-sm text-green-600 mt-1">Annual business income</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded border border-blue-200">
                        <h5 className="font-semibold text-blue-800 mb-2">Business Expenses</h5>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(businessTaxConsiderations?.businessExpenses || 0)}</p>
                        <p className="text-sm text-blue-600 mt-1">Deductible business expenses</p>
                      </div>
                    </div>
                  </div>

                  {/* Professional Income */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Professional Income</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-purple-50 p-4 rounded border border-purple-200">
                        <h5 className="font-semibold text-purple-800 mb-2">Professional Income</h5>
                        <p className="text-2xl font-bold text-purple-900">{formatCurrency(businessTaxConsiderations?.professionalIncome || 0)}</p>
                        <p className="text-sm text-purple-600 mt-1">Annual professional income</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded border border-orange-200">
                        <h5 className="font-semibold text-orange-800 mb-2">Professional Expenses</h5>
                        <p className="text-2xl font-bold text-orange-900">{formatCurrency(businessTaxConsiderations?.professionalExpenses || 0)}</p>
                        <p className="text-sm text-orange-600 mt-1">Deductible professional expenses</p>
                      </div>
                    </div>
                  </div>

                  {/* Depreciation */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Depreciation</h4>
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">Total Depreciation</span>
                        <span className="text-xl font-bold text-gray-900">{formatCurrency(businessTaxConsiderations?.depreciation || 0)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Depreciation on business assets</p>
                    </div>
                  </div>

                  {/* Presumptive Tax */}
                  {businessTaxConsiderations?.presumptiveTax?.applicable && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Presumptive Tax</h4>
                      <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-yellow-700">Section:</span>
                            <span className="font-bold text-yellow-800">{businessTaxConsiderations.presumptiveTax.section || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-yellow-700">Presumptive Income:</span>
                            <span className="font-bold text-yellow-800">{formatCurrency(businessTaxConsiderations.presumptiveTax.income || 0)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-yellow-600 mt-2">
                          Presumptive taxation scheme is applicable for this business
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tax Calculation Summary */}
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Tax Calculation Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total Business Income:</span>
                        <span className="font-bold text-gray-900">{formatCurrency((businessTaxConsiderations?.businessIncome || 0) + (businessTaxConsiderations?.professionalIncome || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total Deductible Expenses:</span>
                        <span className="font-bold text-gray-900">{formatCurrency((businessTaxConsiderations?.businessExpenses || 0) + (businessTaxConsiderations?.professionalExpenses || 0) + (businessTaxConsiderations?.depreciation || 0))}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium text-gray-800">Net Taxable Business Income:</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(
                            ((businessTaxConsiderations?.businessIncome || 0) + (businessTaxConsiderations?.professionalIncome || 0)) - 
                            ((businessTaxConsiderations?.businessExpenses || 0) + (businessTaxConsiderations?.professionalExpenses || 0) + (businessTaxConsiderations?.depreciation || 0))
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai-recommendations' && (
              <div className="space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      AI Tax Planning Recommendations
                    </h3>
                    {existingTaxPlanning?.aiRecommendations && (
                      <button
                        onClick={fetchTaxPlanningData}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Refresh recommendations"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {existingTaxPlanning?.aiRecommendations ? (
                    <div className="space-y-4">
                      {/* AI Summary */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">AI Analysis Summary</h4>
                        <p className="text-blue-800">{existingTaxPlanning.aiRecommendations.summary}</p>
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="text-sm text-blue-600">
                            Confidence Score: {existingTaxPlanning.aiRecommendations.confidenceScore}%
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            Potential Savings: {formatCurrency(existingTaxPlanning.aiRecommendations.totalPotentialSavings || 0)}
                          </span>
                        </div>
                      </div>

                      {/* AI Recommendations */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Detailed Recommendations</h4>
                        {existingTaxPlanning.aiRecommendations.recommendations?.map((rec, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                              <h5 className="font-medium text-gray-900">{rec.title}</h5>
                              <div className="flex gap-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {rec.priority} priority
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  rec.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                                  rec.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {rec.riskLevel} risk
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-3">{rec.description}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Potential Savings</label>
                                <p className="text-lg font-bold text-green-600">{formatCurrency(rec.potentialSavings || 0)}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <span className="text-sm text-gray-600 capitalize">
                                  {rec.category?.replace('_', ' ') || 'General'}
                                </span>
                              </div>
                            </div>
                            {rec.implementationSteps && rec.implementationSteps.length > 0 && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Implementation Steps</label>
                                <ol className="list-decimal list-inside space-y-1">
                                  {rec.implementationSteps.map((step, stepIndex) => (
                                    <li key={stepIndex} className="text-sm text-gray-600">{step}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                            {rec.deadline && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700">Deadline</label>
                                <p className="text-sm text-gray-600">{new Date(rec.deadline).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No AI Recommendations Yet</h4>
                      <p className="text-gray-600 mb-4">Generate AI-powered tax planning recommendations based on client data</p>
                      <button
                        onClick={generateAIRecommendations}
                        disabled={generatingAI}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mx-auto"
                      >
                        {generatingAI ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Brain className="h-4 w-4 mr-2" />
                        )}
                        Generate AI Recommendations
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'visualizations' && (
              <div className="space-y-6">
                {visualizationData ? (
                  <>
                    {/* Before vs After Summary */}
                    {visualizationData.beforeAfterComparison && (
                      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <BarChart3 className="h-5 w-5 mr-2" />
                          Tax Planning Impact Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-red-600">Current Tax Liability</p>
                                <p className="text-2xl font-bold text-red-700">
                                  ₹{visualizationData.beforeAfterComparison.current?.totalTaxLiability?.toLocaleString() || 0}
                                </p>
                              </div>
                              <TrendingUp className="h-8 w-8 text-red-500" />
                            </div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-green-600">Optimized Tax Liability</p>
                                <p className="text-2xl font-bold text-green-700">
                                  ₹{visualizationData.beforeAfterComparison.optimized?.totalTaxLiability?.toLocaleString() || 0}
                                </p>
                              </div>
                              <TrendingDown className="h-8 w-8 text-green-500" />
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-blue-600">Total Savings</p>
                                <p className="text-2xl font-bold text-blue-700">
                                  ₹{visualizationData.beforeAfterComparison.totalSavings?.toLocaleString() || 0}
                                </p>
                                <p className="text-sm text-blue-600">
                                  ({visualizationData.beforeAfterComparison.savingsPercentage}% reduction)
                                </p>
                              </div>
                              <DollarSign className="h-8 w-8 text-blue-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Charts Grid */}
                    {visualizationData.charts && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Tax Liability Comparison Chart */}
                        {visualizationData.charts.taxLiabilityComparison && (
                          <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                              {visualizationData.charts.taxLiabilityComparison.title}
                            </h4>
                            <div className="h-64">
                              <Bar
                                data={visualizationData.charts.taxLiabilityComparison.data}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'top',
                                    },
                                    title: {
                                      display: false,
                                    },
                                  },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      ticks: {
                                        callback: function(value) {
                                          return '₹' + value.toLocaleString();
                                        }
                                      }
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Deduction Utilization Chart */}
                        {visualizationData.charts.deductionUtilization && (
                          <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                              {visualizationData.charts.deductionUtilization.title}
                            </h4>
                            <div className="h-64">
                              <Doughnut
                                data={visualizationData.charts.deductionUtilization.data}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'bottom',
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function(context) {
                                          return context.label + ': ₹' + context.parsed.toLocaleString();
                                        }
                                      }
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Savings Breakdown Chart */}
                        {visualizationData.charts.savingsBreakdown && (
                          <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                              {visualizationData.charts.savingsBreakdown.title}
                            </h4>
                            <div className="h-64">
                              <Pie
                                data={visualizationData.charts.savingsBreakdown.data}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'bottom',
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function(context) {
                                          return context.label + ': ₹' + context.parsed.toLocaleString();
                                        }
                                      }
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Implementation Timeline Chart */}
                        {visualizationData.charts.implementationTimeline && (
                          <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                              {visualizationData.charts.implementationTimeline.title}
                            </h4>
                            <div className="h-64">
                              <Line
                                data={visualizationData.charts.implementationTimeline.data}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'top',
                                    },
                                  },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      ticks: {
                                        callback: function(value) {
                                          return '₹' + value.toLocaleString();
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

                    {/* Implementation Timeline */}
                    {visualizationData.implementationTimeline && (
                      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Calendar className="h-5 w-5 mr-2" />
                          Implementation Timeline
                        </h3>
                        <div className="space-y-3">
                          {visualizationData.implementationTimeline.map((item, index) => (
                            <div key={item.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-green-600 font-medium">
                                      ₹{item.potentialSavings?.toLocaleString()}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      item.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {item.priority}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Deadline: {new Date(item.deadline).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary Stats */}
                    {visualizationData.summary && (
                      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Target className="h-5 w-5 mr-2" />
                          Implementation Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {visualizationData.summary.totalRecommendations}
                            </div>
                            <div className="text-sm text-blue-600">Total Recommendations</div>
                          </div>
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">
                              {visualizationData.summary.highPriorityRecommendations}
                            </div>
                            <div className="text-sm text-red-600">High Priority</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {visualizationData.summary.estimatedImplementationTime}
                            </div>
                            <div className="text-sm text-green-600">Implementation Time</div>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600 capitalize">
                              {visualizationData.summary.riskLevel}
                            </div>
                            <div className="text-sm text-yellow-600">Risk Level</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Visualization Data Available</h3>
                    <p className="text-gray-600 mb-4">
                      Generate AI recommendations first to see before vs after tax planning visualizations.
                    </p>
                    <button
                      onClick={generateAIRecommendations}
                      disabled={generatingAI}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center mx-auto"
                    >
                      {generatingAI ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Bot className="h-4 w-4 mr-2" />
                          Generate AI Recommendations
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'manual-inputs' && (
              <div className="space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Edit className="h-5 w-5 mr-2" />
                    Manual Advisor Inputs
                  </h3>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const manualInputs = {
                      recommendations: [{
                        title: formData.get('title'),
                        description: formData.get('description'),
                        rationale: formData.get('rationale'),
                        implementationNotes: formData.get('implementationNotes'),
                        expectedOutcome: formData.get('expectedOutcome'),
                        timeline: formData.get('timeline'),
                        responsible: formData.get('responsible'),
                        priority: formData.get('priority'),
                        status: 'draft'
                      }],
                      notes: formData.get('notes'),
                      followUpActions: formData.get('followUpActions')?.split('\n').filter(action => action.trim()),
                      clientInstructions: formData.get('clientInstructions')
                    };
                    saveManualInputs(manualInputs);
                  }} className="space-y-6">
                    
                    {/* Recommendation Form */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-4">Add New Tax Planning Recommendation</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation Title</label>
                          <input
                            type="text"
                            name="title"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="e.g., Maximize Section 80C Deductions"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                          <select
                            name="priority"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            name="description"
                            required
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Detailed description of the tax planning recommendation..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rationale</label>
                          <textarea
                            name="rationale"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Why this recommendation is suitable for the client..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Outcome</label>
                          <textarea
                            name="expectedOutcome"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Expected tax savings or benefits..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Notes</label>
                          <textarea
                            name="implementationNotes"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Step-by-step implementation guidance..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                          <input
                            type="text"
                            name="timeline"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="e.g., Before March 31, 2024"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Party</label>
                          <input
                            type="text"
                            name="responsible"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="e.g., Client, Advisor, CA"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                      <textarea
                        name="notes"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Any additional notes or considerations..."
                      />
                    </div>

                    {/* Follow-up Actions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Actions</label>
                      <textarea
                        name="followUpActions"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="List follow-up actions (one per line)..."
                      />
                    </div>

                    {/* Client Instructions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client Instructions</label>
                      <textarea
                        name="clientInstructions"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Specific instructions for the client..."
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        <span className="hidden sm:inline">Save Manual Inputs</span>
                        <span className="sm:hidden">Save</span>
                      </button>
                    </div>
                  </form>

                  {/* Existing Manual Inputs */}
                  {existingTaxPlanning?.manualAdvisorInputs?.recommendations && existingTaxPlanning.manualAdvisorInputs.recommendations.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">Existing Manual Recommendations</h4>
                      <div className="space-y-3">
                        {existingTaxPlanning.manualAdvisorInputs.recommendations.map((rec, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-gray-900">{rec.title}</h5>
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {rec.priority} priority
                              </span>
                            </div>
                            <p className="text-gray-700 mb-2">{rec.description}</p>
                            {rec.rationale && (
                              <p className="text-sm text-gray-600 mb-2"><strong>Rationale:</strong> {rec.rationale}</p>
                            )}
                            {rec.expectedOutcome && (
                              <p className="text-sm text-gray-600 mb-2"><strong>Expected Outcome:</strong> {rec.expectedOutcome}</p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              {rec.timeline && <div><strong>Timeline:</strong> {rec.timeline}</div>}
                              {rec.responsible && <div><strong>Responsible:</strong> {rec.responsible}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileCheck className="h-5 w-5 mr-2" />
                    Compliance & Filing
                  </h3>
                  <div className="text-center py-8">
                    <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Compliance Dashboard</h4>
                    <p className="text-gray-600">Tax compliance and filing information will be displayed here.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility functions
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(1)}%`;
};

const getHealthColor = (value, thresholds = { good: 80, warning: 60 }) => {
  if (value >= thresholds.good) return 'text-green-600';
  if (value >= thresholds.warning) return 'text-yellow-600';
  return 'text-red-600';
};

export default TaxPlanningPage;
