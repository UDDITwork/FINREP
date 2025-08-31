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

function TaxPlanningPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [existingTaxPlanning, setExistingTaxPlanning] = useState(null);
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
        setExistingTaxPlanning(response.data.data.taxPlanning);
        toast.success('AI recommendations generated successfully!');
        console.log('✅ [Tax Planning AI] Recommendations generated');
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
        setExistingTaxPlanning(response.data.data.taxPlanning);
        toast.success('Manual inputs saved successfully!');
        console.log('✅ [Tax Planning Manual] Inputs saved');
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
    { id: 'manual-inputs', label: 'Manual Inputs', icon: Edit },
    { id: 'compliance', label: 'Compliance', icon: FileCheck }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Tax Planning</h1>
                  <p className="text-sm text-gray-500">{clientInfo?.name || 'Loading...'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={generateAIRecommendations}
                disabled={generatingAI}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generatingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Generate AI Recommendations
              </button>
              
              <button
                onClick={fetchTaxPlanningData}
                className="p-2 text-gray-400 hover:text-gray-600"
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
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Personal Information Card */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">PAN Number</label>
                      <p className="text-gray-900">{personalInfo?.panNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                      <p className="text-gray-900">{personalInfo?.maritalStatus || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dependents</label>
                      <p className="text-gray-900">{personalInfo?.numberOfDependents || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Income Analysis Card */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Income Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded border border-green-200">
                      <p className="text-sm text-green-700">Annual Income</p>
                      <p className="text-xl font-bold text-green-800">{formatCurrency(incomeAnalysis?.annualIncome || 0)}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                      <p className="text-sm text-blue-700">Monthly Income</p>
                      <p className="text-xl font-bold text-blue-800">{formatCurrency(incomeAnalysis?.totalMonthlyIncome || 0)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded border border-purple-200">
                      <p className="text-sm text-purple-700">Income Type</p>
                      <p className="text-lg font-bold text-purple-800">{incomeAnalysis?.incomeType || 'Not specified'}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded border border-orange-200">
                      <p className="text-sm text-orange-700">Additional Income</p>
                      <p className="text-xl font-bold text-orange-800">{formatCurrency(incomeAnalysis?.additionalIncome || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Tax-Saving Investments Card */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Current Tax-Saving Investments
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Section 80C (PPF)</label>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(taxSavingInvestments?.section80C?.ppf || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Section 80C (EPF)</label>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(taxSavingInvestments?.section80C?.epf || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Section 80C (ELSS)</label>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(taxSavingInvestments?.section80C?.elss || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Section 80D (Health Insurance)</label>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(taxSavingInvestments?.section80D?.selfFamily || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Section 80CCD(1B) (NPS)</label>
                      <p className="text-lg font-bold text-purple-600">{formatCurrency(taxSavingInvestments?.section80CCD1B?.npsAdditional || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Section 24B (Home Loan Interest)</label>
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(taxSavingInvestments?.section24B?.homeLoanInterest || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Data Completeness */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Completeness</h3>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 mr-4">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${dataCompleteness || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{dataCompleteness || 0}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Complete client information for better tax planning recommendations
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'income' && (
              <div className="space-y-6">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Income Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900">Monthly Income</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(incomeAnalysis?.monthlyIncome || 0)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900">Annual Income</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(incomeAnalysis?.annualIncome || 0)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900">Income Type</h4>
                      <p className="text-lg text-gray-700">
                        {incomeAnalysis?.incomeType || 'Not specified'}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900">Additional Income</h4>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(incomeAnalysis?.additionalIncome || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deductions' && (
              <DeductionsTab
                taxSavingInvestments={taxSavingInvestments}
                formatCurrency={formatCurrency}
                formatPercentage={formatPercentage}
              />
            )}

            {activeTab === 'capital-gains' && (
              <CapitalGainsTab
                capitalGainsAnalysis={capitalGainsAnalysis}
                formatCurrency={formatCurrency}
                formatPercentage={formatPercentage}
              />
            )}

            {activeTab === 'business' && (
              <BusinessTab
                businessTaxConsiderations={businessTaxConsiderations}
                formatCurrency={formatCurrency}
              />
            )}

            {activeTab === 'ai-recommendations' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    AI Tax Planning Recommendations
                  </h3>
                  
                  {existingTaxPlanning?.aiRecommendations ? (
                    <div className="space-y-4">
                      {/* AI Summary */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">AI Analysis Summary</h4>
                        <p className="text-blue-800">{existingTaxPlanning.aiRecommendations.summary}</p>
                        <div className="mt-3 flex items-center justify-between">
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
                            <p className="text-gray-700 mb-3">{rec.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Potential Savings</label>
                                <p className="text-lg font-bold text-green-600">{formatCurrency(rec.potentialSavings || 0)}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  rec.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                                  rec.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {rec.riskLevel}
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

            {activeTab === 'manual-inputs' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation Title</label>
                          <input
                            type="text"
                            name="title"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Maximize Section 80C Deductions"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                          <select
                            name="priority"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            name="description"
                            required
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Detailed description of the tax planning recommendation..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rationale</label>
                          <textarea
                            name="rationale"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Why this recommendation is suitable for the client..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Outcome</label>
                          <textarea
                            name="expectedOutcome"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Expected tax savings or benefits..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Notes</label>
                          <textarea
                            name="implementationNotes"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Step-by-step implementation guidance..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                          <input
                            type="text"
                            name="timeline"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Before March 31, 2024"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Party</label>
                          <input
                            type="text"
                            name="responsible"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any additional notes or considerations..."
                      />
                    </div>

                    {/* Follow-up Actions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Actions</label>
                      <textarea
                        name="followUpActions"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="List follow-up actions (one per line)..."
                      />
                    </div>

                    {/* Client Instructions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client Instructions</label>
                      <textarea
                        name="clientInstructions"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Specific instructions for the client..."
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Manual Inputs
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
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance & Filing</h3>
                  <p className="text-gray-600">Compliance and filing information will be displayed here.</p>
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
