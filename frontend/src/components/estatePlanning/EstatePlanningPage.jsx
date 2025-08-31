// File: frontend/src/components/estatePlanning/EstatePlanningPage.jsx
/**
 * Estate Planning Page Component
 * Comprehensive estate planning analysis and recommendations for clients
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Building,
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
  Calculator,
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
  Home as HomeIcon,
  Car as CarIcon,
  CreditCard as CreditCardIcon,
  Briefcase as BriefcaseIcon,
  PiggyBank as PiggyBankIcon,
  AlertTriangle,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  MapPin as MapPinIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  ExternalLink as ExternalLinkIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  X as XIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Zap as ZapIcon,
  TrendingUp as TrendingUpIcon,
  BarChart3 as BarChart3Icon,
  PieChart as PieChartIcon,
  Activity as ActivityIcon,
  AlertCircle as AlertCircleIcon,
  CheckCircle2 as CheckCircle2Icon,
  XCircle as XCircleIcon,
  Clock as ClockIcon2,
  Calendar as CalendarIcon2,
  DollarSign as DollarSignIcon,
  Percent as PercentIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon,
  Target as TargetIcon,
  Lightbulb as LightbulbIcon,
  BookOpen as BookOpenIcon,
  FileCheck as FileCheckIcon,
  UserCheck as UserCheckIcon,
  Building2 as Building2Icon
} from 'lucide-react';

function EstatePlanningPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estateData, setEstateData] = useState(null);
  const [estateInformation, setEstateInformation] = useState(null);
  const [willData, setWillData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchEstatePlanningData();
      fetchEstateInformation();
      fetchWillData();
    }
  }, [clientId]);

  const fetchEstatePlanningData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏛️ [Estate Planning] Fetching data for client:', clientId);
      
      const response = await clientAPI.getEstatePlanningData(clientId);
      
      if (response.success) {
        setEstateData(response.data);
        console.log('✅ [Estate Planning] Data loaded successfully:', {
          clientName: response.data.clientInfo?.name,
          hasPersonalInfo: !!response.data.estatePlanningData?.personalInfo,
          hasFinancialAssets: !!response.data.estatePlanningData?.financialAssets,
          hasRecommendations: !!response.data.estatePlanningData?.recommendations
        });
      } else {
        throw new Error(response.message || 'Failed to fetch estate planning data');
      }
    } catch (err) {
      console.error('❌ [Estate Planning] Error:', err);
      setError(err.message || 'Failed to load estate planning data');
      toast.error('Failed to load estate planning data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEstateInformation = async () => {
    try {
      console.log('🏛️ [Estate Planning] Fetching estate information for client:', clientId);
      
      const response = await clientAPI.getEstateInformation(clientId);
      
      if (response.success) {
        setEstateInformation(response.data.estateInformation);
        console.log('✅ [Estate Planning] Estate information loaded:', {
          hasEstateInfo: !!response.data.estateInformation,
          hasFamilyStructure: !!response.data.estateInformation?.familyStructure,
          hasRealEstate: response.data.estateInformation?.realEstateProperties?.length > 0
        });
      }
    } catch (err) {
      console.error('❌ [Estate Planning] Estate information fetch error:', err);
      // Don't set error state for estate information as it's optional
    }
  };

  const fetchWillData = async () => {
    try {
      console.log('📜 [Estate Planning] Fetching will data for client:', clientId);
      
      const response = await clientAPI.getWill(clientId);
      
      if (response.success) {
        setWillData(response.data.willDetails);
        console.log('✅ [Estate Planning] Will data loaded:', {
          hasWill: !!response.data.willDetails,
          willType: response.data.willDetails?.willType,
          contentLength: response.data.willDetails?.willContent?.length || 0
        });
      }
    } catch (err) {
      console.error('❌ [Estate Planning] Will data fetch error:', err);
      // Don't set error state for will data as it's optional
    }
  };

  const saveEstateInformation = async (estateData) => {
    try {
      setSaving(true);
      console.log('🏛️ [Estate Planning] Saving estate information:', {
        clientId,
        hasFamilyStructure: !!estateData.familyStructure,
        hasRealEstate: estateData.realEstateProperties?.length > 0
      });
      
      const response = await clientAPI.saveEstateInformation(clientId, estateData);
      
      if (response.success) {
        setEstateInformation(response.data.estateInformation);
        toast.success('Estate information saved successfully');
        console.log('✅ [Estate Planning] Estate information saved successfully');
      } else {
        throw new Error(response.message || 'Failed to save estate information');
      }
    } catch (err) {
      console.error('❌ [Estate Planning] Save estate information error:', err);
      toast.error('Failed to save estate information');
    } finally {
      setSaving(false);
    }
  };

  const saveWill = async (willData) => {
    try {
      setSaving(true);
      console.log('📜 [Estate Planning] Saving will:', {
        clientId,
        willType: willData.willType,
        contentLength: willData.willContent?.length || 0
      });
      
      const response = await clientAPI.saveWill(clientId, willData);
      
      if (response.success) {
        setWillData(response.data.willDetails);
        toast.success('Will saved successfully');
        console.log('✅ [Estate Planning] Will saved successfully');
      } else {
        throw new Error(response.message || 'Failed to save will');
      }
    } catch (err) {
      console.error('❌ [Estate Planning] Save will error:', err);
      toast.error('Failed to save will');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (!value) return '0%';
    return `${Math.round(value)}%`;
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthColor = (health) => {
    switch (health?.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading estate planning data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <button
              onClick={fetchEstatePlanningData}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2 inline" />
              Retry
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2 inline" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!estateData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Estate planning data not found for this client.</p>
        </div>
      </div>
    );
  }

  const { clientInfo, estatePlanningData } = estateData;
  const {
    personalInfo,
    financialAssets,
    liabilities,
    incomeAnalysis,
    investmentPortfolio,
    riskAssessment,
    casData,
    recommendations
  } = estatePlanningData;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'assets', label: 'Assets', icon: DollarSign },
    { id: 'liabilities', label: 'Liabilities', icon: TrendingDown },
    { id: 'income', label: 'Income & Cash Flow', icon: TrendingUp },
    { id: 'portfolio', label: 'Investment Portfolio', icon: PieChart },
    { id: 'risk', label: 'Risk Assessment', icon: Shield },
    { id: 'recommendations', label: 'Recommendations', icon: Target },
    { id: 'family', label: 'Family & Beneficiaries', icon: Heart },
    { id: 'properties', label: 'Real Estate', icon: Home },
    { id: 'legal', label: 'Legal Documents', icon: FileText },
    { id: 'will', label: 'Will Creation', icon: Award },
    { id: 'preferences', label: 'Estate Preferences', icon: Target }
  ];

  // Family & Beneficiaries Tab Component
  const FamilyBeneficiariesTab = () => {
    const [familyData, setFamilyData] = useState(estateInformation?.familyStructure || {
      spouse: { exists: false },
      children: [],
      dependents: [],
      beneficiaries: []
    });

    const handleSaveFamilyData = () => {
      const updatedEstateInfo = {
        ...estateInformation,
        familyStructure: familyData
      };
      saveEstateInformation(updatedEstateInfo);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Family & Beneficiaries Information</h3>
          <button
            onClick={handleSaveFamilyData}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Family Data
          </button>
        </div>

        {/* Spouse Information */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-pink-500" />
            <h4 className="text-lg font-medium">Spouse Information</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasSpouse"
                checked={familyData.spouse.exists}
                onChange={(e) => setFamilyData({
                  ...familyData,
                  spouse: { ...familyData.spouse, exists: e.target.checked }
                })}
                className="rounded"
              />
              <label htmlFor="hasSpouse" className="text-sm font-medium">Has Spouse</label>
            </div>
            
            {familyData.spouse.exists && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={familyData.spouse.fullName || ''}
                    onChange={(e) => setFamilyData({
                      ...familyData,
                      spouse: { ...familyData.spouse, fullName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter spouse's full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={familyData.spouse.dateOfBirth || ''}
                    onChange={(e) => setFamilyData({
                      ...familyData,
                      spouse: { ...familyData.spouse, dateOfBirth: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={familyData.spouse.panNumber || ''}
                    onChange={(e) => setFamilyData({
                      ...familyData,
                      spouse: { ...familyData.spouse, panNumber: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter PAN number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={familyData.spouse.occupation || ''}
                    onChange={(e) => setFamilyData({
                      ...familyData,
                      spouse: { ...familyData.spouse, occupation: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter occupation"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Children Information */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-blue-500" />
              <h4 className="text-lg font-medium">Children Information</h4>
            </div>
            <button
              onClick={() => setFamilyData({
                ...familyData,
                children: [...familyData.children, {
                  fullName: '',
                  dateOfBirth: '',
                  relationshipType: 'biological',
                  isMinor: true,
                  guardianRequired: true
                }]
              })}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Child
            </button>
          </div>
          
          <div className="space-y-4">
            {familyData.children.map((child, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium">Child {index + 1}</h5>
                  <button
                    onClick={() => setFamilyData({
                      ...familyData,
                      children: familyData.children.filter((_, i) => i !== index)
                    })}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={child.fullName}
                      onChange={(e) => {
                        const updatedChildren = [...familyData.children];
                        updatedChildren[index] = { ...child, fullName: e.target.value };
                        setFamilyData({ ...familyData, children: updatedChildren });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter child's full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={child.dateOfBirth}
                      onChange={(e) => {
                        const updatedChildren = [...familyData.children];
                        updatedChildren[index] = { ...child, dateOfBirth: e.target.value };
                        setFamilyData({ ...familyData, children: updatedChildren });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Type</label>
                    <select
                      value={child.relationshipType}
                      onChange={(e) => {
                        const updatedChildren = [...familyData.children];
                        updatedChildren[index] = { ...child, relationshipType: e.target.value };
                        setFamilyData({ ...familyData, children: updatedChildren });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="biological">Biological</option>
                      <option value="adopted">Adopted</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education Status</label>
                    <input
                      type="text"
                      value={child.educationStatus || ''}
                      onChange={(e) => {
                        const updatedChildren = [...familyData.children];
                        updatedChildren[index] = { ...child, educationStatus: e.target.value };
                        setFamilyData({ ...familyData, children: updatedChildren });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., School, College, Graduated"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Beneficiaries Information */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              <h4 className="text-lg font-medium">Estate Beneficiaries</h4>
            </div>
            <button
              onClick={() => setFamilyData({
                ...familyData,
                beneficiaries: [...familyData.beneficiaries, {
                  beneficiaryName: '',
                  relationship: '',
                  inheritancePercentage: 0,
                  isMinor: false
                }]
              })}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Beneficiary
            </button>
          </div>
          
          <div className="space-y-4">
            {familyData.beneficiaries.map((beneficiary, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium">Beneficiary {index + 1}</h5>
                  <button
                    onClick={() => setFamilyData({
                      ...familyData,
                      beneficiaries: familyData.beneficiaries.filter((_, i) => i !== index)
                    })}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary Name</label>
                    <input
                      type="text"
                      value={beneficiary.beneficiaryName}
                      onChange={(e) => {
                        const updatedBeneficiaries = [...familyData.beneficiaries];
                        updatedBeneficiaries[index] = { ...beneficiary, beneficiaryName: e.target.value };
                        setFamilyData({ ...familyData, beneficiaries: updatedBeneficiaries });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter beneficiary's full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={beneficiary.relationship}
                      onChange={(e) => {
                        const updatedBeneficiaries = [...familyData.beneficiaries];
                        updatedBeneficiaries[index] = { ...beneficiary, relationship: e.target.value };
                        setFamilyData({ ...familyData, beneficiaries: updatedBeneficiaries });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Son, Daughter, Spouse, Sibling"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inheritance Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={beneficiary.inheritancePercentage}
                      onChange={(e) => {
                        const updatedBeneficiaries = [...familyData.beneficiaries];
                        updatedBeneficiaries[index] = { ...beneficiary, inheritancePercentage: parseInt(e.target.value) || 0 };
                        setFamilyData({ ...familyData, beneficiaries: updatedBeneficiaries });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="tel"
                      value={beneficiary.contactNumber || ''}
                      onChange={(e) => {
                        const updatedBeneficiaries = [...familyData.beneficiaries];
                        updatedBeneficiaries[index] = { ...beneficiary, contactNumber: e.target.value };
                        setFamilyData({ ...familyData, beneficiaries: updatedBeneficiaries });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter contact number"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Real Estate Tab Component
  const RealEstateTab = () => {
    const [properties, setProperties] = useState(estateInformation?.realEstateProperties || []);
    const [showAddProperty, setShowAddProperty] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);

    const handleSaveProperties = () => {
      const updatedEstateInfo = {
        ...estateInformation,
        realEstateProperties: properties
      };
      saveEstateInformation(updatedEstateInfo);
    };

    const addProperty = () => {
      const newProperty = {
        propertyType: 'residential-house',
        propertyAddress: {
          city: '',
          state: '',
          pincode: ''
        },
        ownershipDetails: {
          ownershipType: 'sole',
          ownershipPercentage: 100
        },
        financialDetails: {
          currentMarketValue: 0
        },
        legalDocuments: {
          hasTitleDeed: false,
          isRegistered: false
        },
        rentalDetails: {
          isRented: false
        },
        propertyLoan: {
          hasLoan: false
        },
        propertySpecifics: {
          builtUpArea: 0,
          carpetArea: 0,
          numberOfRooms: 0
        }
      };
      setProperties([...properties, newProperty]);
      setEditingProperty(properties.length);
      setShowAddProperty(true);
    };

    const updateProperty = (index, updatedProperty) => {
      const updatedProperties = [...properties];
      updatedProperties[index] = { ...updatedProperties[index], ...updatedProperty };
      setProperties(updatedProperties);
    };

    const removeProperty = (index) => {
      setProperties(properties.filter((_, i) => i !== index));
    };

    const PropertyForm = ({ property, index, onSave, onCancel }) => (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium">Property {index + 1} Details</h4>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Property Type & Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select
                value={property.propertyType}
                onChange={(e) => updateProperty(index, { propertyType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="residential-house">Residential House</option>
                <option value="residential-apartment">Residential Apartment</option>
                <option value="commercial-office">Commercial Office</option>
                <option value="commercial-shop">Commercial Shop</option>
                <option value="agricultural-land">Agricultural Land</option>
                <option value="residential-plot">Residential Plot</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Sub Type</label>
              <input
                type="text"
                value={property.propertySubType || ''}
                onChange={(e) => updateProperty(index, { propertySubType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Villa, Studio, Warehouse"
              />
            </div>
          </div>

          {/* Address Details */}
          <div>
            <h5 className="text-md font-medium text-gray-900 mb-3">Address Details</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plot Number</label>
                <input
                  type="text"
                  value={property.propertyAddress?.plotNumber || ''}
                  onChange={(e) => updateProperty(index, {
                    propertyAddress: { ...property.propertyAddress, plotNumber: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building Name</label>
                <input
                  type="text"
                  value={property.propertyAddress?.buildingName || ''}
                  onChange={(e) => updateProperty(index, {
                    propertyAddress: { ...property.propertyAddress, buildingName: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                <input
                  type="text"
                  value={property.propertyAddress?.street || ''}
                  onChange={(e) => updateProperty(index, {
                    propertyAddress: { ...property.propertyAddress, street: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <input
                  type="text"
                  value={property.propertyAddress?.area || ''}
                  onChange={(e) => updateProperty(index, {
                    propertyAddress: { ...property.propertyAddress, area: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={property.propertyAddress?.city || ''}
                  onChange={(e) => updateProperty(index, {
                    propertyAddress: { ...property.propertyAddress, city: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input
                  type="text"
                  value={property.propertyAddress?.state || ''}
                  onChange={(e) => updateProperty(index, {
                    propertyAddress: { ...property.propertyAddress, state: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={property.propertyAddress?.pincode || ''}
                  onChange={(e) => updateProperty(index, {
                    propertyAddress: { ...property.propertyAddress, pincode: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div>
            <h5 className="text-md font-medium text-gray-900 mb-3">Financial Information</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Market Value *</label>
                <input
                  type="number"
                  value={property.financialDetails?.currentMarketValue || ''}
                  onChange={(e) => updateProperty(index, {
                    financialDetails: { ...property.financialDetails, currentMarketValue: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Value</label>
                <input
                  type="number"
                  value={property.financialDetails?.purchaseValue || ''}
                  onChange={(e) => updateProperty(index, {
                    financialDetails: { ...property.financialDetails, purchaseValue: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={property.financialDetails?.purchaseDate || ''}
                  onChange={(e) => updateProperty(index, {
                    financialDetails: { ...property.financialDetails, purchaseDate: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Value</label>
                <input
                  type="number"
                  value={property.financialDetails?.registrationValue || ''}
                  onChange={(e) => updateProperty(index, {
                    financialDetails: { ...property.financialDetails, registrationValue: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Property Specifics */}
          <div>
            <h5 className="text-md font-medium text-gray-900 mb-3">Property Specifications</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Built-up Area (sq ft)</label>
                <input
                  type="number"
                  value={property.propertySpecifics?.builtUpArea || ''}
                  onChange={(e) => updateProperty(index, {
                    propertySpecifics: { ...property.propertySpecifics, builtUpArea: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carpet Area (sq ft)</label>
                <input
                  type="number"
                  value={property.propertySpecifics?.carpetArea || ''}
                  onChange={(e) => updateProperty(index, {
                    propertySpecifics: { ...property.propertySpecifics, carpetArea: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rooms</label>
                <input
                  type="number"
                  value={property.propertySpecifics?.numberOfRooms || ''}
                  onChange={(e) => updateProperty(index, {
                    propertySpecifics: { ...property.propertySpecifics, numberOfRooms: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Legal Documents Status */}
          <div>
            <h5 className="text-md font-medium text-gray-900 mb-3">Legal Documents Status</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`hasTitleDeed-${index}`}
                  checked={property.legalDocuments?.hasTitleDeed || false}
                  onChange={(e) => updateProperty(index, {
                    legalDocuments: { ...property.legalDocuments, hasTitleDeed: e.target.checked }
                  })}
                  className="rounded"
                />
                <label htmlFor={`hasTitleDeed-${index}`} className="text-sm font-medium">Has Title Deed</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`isRegistered-${index}`}
                  checked={property.legalDocuments?.isRegistered || false}
                  onChange={(e) => updateProperty(index, {
                    legalDocuments: { ...property.legalDocuments, isRegistered: e.target.checked }
                  })}
                  className="rounded"
                />
                <label htmlFor={`isRegistered-${index}`} className="text-sm font-medium">Is Registered</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`hasOccupancyCertificate-${index}`}
                  checked={property.legalDocuments?.hasOccupancyCertificate || false}
                  onChange={(e) => updateProperty(index, {
                    legalDocuments: { ...property.legalDocuments, hasOccupancyCertificate: e.target.checked }
                  })}
                  className="rounded"
                />
                <label htmlFor={`hasOccupancyCertificate-${index}`} className="text-sm font-medium">Has Occupancy Certificate</label>
              </div>
            </div>
          </div>

          {/* Rental Information */}
          <div>
            <h5 className="text-md font-medium text-gray-900 mb-3">Rental Information</h5>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id={`isRented-${index}`}
                checked={property.rentalDetails?.isRented || false}
                onChange={(e) => updateProperty(index, {
                  rentalDetails: { ...property.rentalDetails, isRented: e.target.checked }
                })}
                className="rounded"
              />
              <label htmlFor={`isRented-${index}`} className="text-sm font-medium">Property is Rented</label>
            </div>
            
            {property.rentalDetails?.isRented && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent</label>
                  <input
                    type="number"
                    value={property.rentalDetails?.monthlyRent || ''}
                    onChange={(e) => updateProperty(index, {
                      rentalDetails: { ...property.rentalDetails, monthlyRent: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
                  <input
                    type="text"
                    value={property.rentalDetails?.tenantName || ''}
                    onChange={(e) => updateProperty(index, {
                      rentalDetails: { ...property.rentalDetails, tenantName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Loan Against Property */}
          <div>
            <h5 className="text-md font-medium text-gray-900 mb-3">Loan Against Property</h5>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id={`hasLoan-${index}`}
                checked={property.propertyLoan?.hasLoan || false}
                onChange={(e) => updateProperty(index, {
                  propertyLoan: { ...property.propertyLoan, hasLoan: e.target.checked }
                })}
                className="rounded"
              />
              <label htmlFor={`hasLoan-${index}`} className="text-sm font-medium">Has Loan Against Property</label>
            </div>
            
            {property.propertyLoan?.hasLoan && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={property.propertyLoan?.bankName || ''}
                    onChange={(e) => updateProperty(index, {
                      propertyLoan: { ...property.propertyLoan, bankName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outstanding Amount</label>
                  <input
                    type="number"
                    value={property.propertyLoan?.outstandingAmount || ''}
                    onChange={(e) => updateProperty(index, {
                      propertyLoan: { ...property.propertyLoan, outstandingAmount: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly EMI</label>
                  <input
                    type="number"
                    value={property.propertyLoan?.monthlyEMI || ''}
                    onChange={(e) => updateProperty(index, {
                      propertyLoan: { ...property.propertyLoan, monthlyEMI: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Property
            </button>
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Real Estate Properties</h3>
          <div className="flex gap-3">
            <button
              onClick={addProperty}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
            <button
              onClick={handleSaveProperties}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Properties
            </button>
          </div>
        </div>

        {/* Properties List */}
        {properties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Added</h3>
            <p className="text-gray-600 mb-4">Start by adding your real estate properties to track their details and value.</p>
            <button
              onClick={addProperty}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add First Property
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property, index) => (
              <div key={index} className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {property.propertyType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      {property.propertySubType && ` - ${property.propertySubType}`}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {property.propertyAddress?.city && property.propertyAddress?.state 
                        ? `${property.propertyAddress.city}, ${property.propertyAddress.state}`
                        : 'Address not specified'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(property.financialDetails?.currentMarketValue || 0)}
                    </span>
                    <button
                      onClick={() => {
                        setEditingProperty(index);
                        setShowAddProperty(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeProperty(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Built-up Area:</span>
                    <span className="ml-2">{property.propertySpecifics?.builtUpArea || 0} sq ft</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Rooms:</span>
                    <span className="ml-2">{property.propertySpecifics?.numberOfRooms || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2">
                      {property.rentalDetails?.isRented ? 'Rented' : 'Self-occupied'}
                    </span>
                  </div>
                </div>

                {property.rentalDetails?.isRented && (
                  <div className="mt-3 text-sm">
                    <span className="font-medium text-gray-700">Monthly Rent:</span>
                    <span className="ml-2 text-green-600">
                      {formatCurrency(property.rentalDetails?.monthlyRent || 0)}
                    </span>
                  </div>
                )}

                {property.propertyLoan?.hasLoan && (
                  <div className="mt-3 text-sm">
                    <span className="font-medium text-gray-700">Outstanding Loan:</span>
                    <span className="ml-2 text-red-600">
                      {formatCurrency(property.propertyLoan?.outstandingAmount || 0)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Property Form Modal */}
        {showAddProperty && editingProperty !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <PropertyForm
                property={properties[editingProperty]}
                index={editingProperty}
                onSave={() => {
                  setShowAddProperty(false);
                  setEditingProperty(null);
                }}
                onCancel={() => {
                  setShowAddProperty(false);
                  setEditingProperty(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Legal Documents Tab Component
  const LegalDocumentsTab = () => {
    const [legalDocs, setLegalDocs] = useState(estateInformation?.legalDocumentsStatus || {
      willDetails: { hasWill: false },
      trustStructures: [],
      powerOfAttorney: { hasPOA: false },
      nominations: []
    });

    const handleSaveLegalDocs = () => {
      const updatedEstateInfo = {
        ...estateInformation,
        legalDocumentsStatus: legalDocs
      };
      saveEstateInformation(updatedEstateInfo);
    };

    const addNomination = () => {
      const newNomination = {
        assetType: 'bank-account',
        nomineeDetails: {
          nomineeName: '',
          nomineeRelation: '',
          nominationPercentage: 100,
          isMinorNominee: false
        }
      };
      setLegalDocs({
        ...legalDocs,
        nominations: [...(legalDocs.nominations || []), newNomination]
      });
    };

    const updateNomination = (index, updatedNomination) => {
      const updatedNominations = [...(legalDocs.nominations || [])];
      updatedNominations[index] = { ...updatedNominations[index], ...updatedNomination };
      setLegalDocs({ ...legalDocs, nominations: updatedNominations });
    };

    const removeNomination = (index) => {
      setLegalDocs({
        ...legalDocs,
        nominations: (legalDocs.nominations || []).filter((_, i) => i !== index)
      });
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Legal Documents Management</h3>
          <button
            onClick={handleSaveLegalDocs}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Legal Documents
          </button>
        </div>

        {/* Will Status */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileSignature className="w-5 h-5 text-blue-500" />
            <h4 className="text-lg font-medium">Will Status</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasWill"
                checked={legalDocs.willDetails?.hasWill || false}
                onChange={(e) => setLegalDocs({
                  ...legalDocs,
                  willDetails: { ...legalDocs.willDetails, hasWill: e.target.checked }
                })}
                className="rounded"
              />
              <label htmlFor="hasWill" className="text-sm font-medium">Has Will</label>
            </div>
            
            {legalDocs.willDetails?.hasWill && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Will Type</label>
                  <select
                    value={legalDocs.willDetails?.willType || 'unregistered'}
                    onChange={(e) => setLegalDocs({
                      ...legalDocs,
                      willDetails: { ...legalDocs.willDetails, willType: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="unregistered">Unregistered Will</option>
                    <option value="registered">Registered Will</option>
                    <option value="notarized">Notarized Will</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Will</label>
                  <input
                    type="date"
                    value={legalDocs.willDetails?.dateOfWill || ''}
                    onChange={(e) => setLegalDocs({
                      ...legalDocs,
                      willDetails: { ...legalDocs.willDetails, dateOfWill: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Will Registration Number</label>
                  <input
                    type="text"
                    value={legalDocs.willDetails?.willRegistrationNumber || ''}
                    onChange={(e) => setLegalDocs({
                      ...legalDocs,
                      willDetails: { ...legalDocs.willDetails, willRegistrationNumber: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter registration number if applicable"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Power of Attorney */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="w-5 h-5 text-green-500" />
            <h4 className="text-lg font-medium">Power of Attorney</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasPOA"
                checked={legalDocs.powerOfAttorney?.hasPOA || false}
                onChange={(e) => setLegalDocs({
                  ...legalDocs,
                  powerOfAttorney: { ...legalDocs.powerOfAttorney, hasPOA: e.target.checked }
                })}
                className="rounded"
              />
              <label htmlFor="hasPOA" className="text-sm font-medium">Has Power of Attorney</label>
            </div>
            
            {legalDocs.powerOfAttorney?.hasPOA && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">POA Type</label>
                  <select
                    value={legalDocs.powerOfAttorney?.poaType || 'general'}
                    onChange={(e) => setLegalDocs({
                      ...legalDocs,
                      powerOfAttorney: { ...legalDocs.powerOfAttorney, poaType: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General POA</option>
                    <option value="specific">Specific POA</option>
                    <option value="durable">Durable POA</option>
                    <option value="medical">Medical POA</option>
                    <option value="financial">Financial POA</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointee Name</label>
                  <input
                    type="text"
                    value={legalDocs.powerOfAttorney?.appointeeDetails?.appointeeName || ''}
                    onChange={(e) => setLegalDocs({
                      ...legalDocs,
                      powerOfAttorney: {
                        ...legalDocs.powerOfAttorney,
                        appointeeDetails: {
                          ...legalDocs.powerOfAttorney.appointeeDetails,
                          appointeeName: e.target.value
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter appointee's name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointee Contact</label>
                  <input
                    type="tel"
                    value={legalDocs.powerOfAttorney?.appointeeDetails?.appointeeContact || ''}
                    onChange={(e) => setLegalDocs({
                      ...legalDocs,
                      powerOfAttorney: {
                        ...legalDocs.powerOfAttorney,
                        appointeeDetails: {
                          ...legalDocs.powerOfAttorney.appointeeDetails,
                          appointeeContact: e.target.value
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter contact number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    value={legalDocs.powerOfAttorney?.appointeeDetails?.appointeeRelation || ''}
                    onChange={(e) => setLegalDocs({
                      ...legalDocs,
                      powerOfAttorney: {
                        ...legalDocs.powerOfAttorney,
                        appointeeDetails: {
                          ...legalDocs.powerOfAttorney.appointeeDetails,
                          appointeeRelation: e.target.value
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Son, Daughter, Spouse"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Nominations */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-500" />
              <h4 className="text-lg font-medium">Asset Nominations</h4>
            </div>
            <button
              onClick={addNomination}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Nomination
            </button>
          </div>
          
          <div className="space-y-4">
            {(legalDocs.nominations || []).map((nomination, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium">Nomination {index + 1}</h5>
                  <button
                    onClick={() => removeNomination(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
                    <select
                      value={nomination.assetType}
                      onChange={(e) => updateNomination(index, { assetType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="bank-account">Bank Account</option>
                      <option value="insurance-policy">Insurance Policy</option>
                      <option value="pf-account">PF Account</option>
                      <option value="gratuity">Gratuity</option>
                      <option value="mutual-fund">Mutual Fund</option>
                      <option value="demat-account">Demat Account</option>
                      <option value="nps">NPS</option>
                      <option value="ppf">PPF</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                    <input
                      type="text"
                      value={nomination.institutionName || ''}
                      onChange={(e) => updateNomination(index, { institutionName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., SBI, HDFC, LIC"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account/Policy Number</label>
                    <input
                      type="text"
                      value={nomination.accountNumber || nomination.policyNumber || ''}
                      onChange={(e) => updateNomination(index, { 
                        accountNumber: e.target.value,
                        policyNumber: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter account or policy number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nominee Name *</label>
                    <input
                      type="text"
                      value={nomination.nomineeDetails?.nomineeName || ''}
                      onChange={(e) => updateNomination(index, {
                        nomineeDetails: { ...nomination.nomineeDetails, nomineeName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter nominee's full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={nomination.nomineeDetails?.nomineeRelation || ''}
                      onChange={(e) => updateNomination(index, {
                        nomineeDetails: { ...nomination.nomineeDetails, nomineeRelation: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Son, Daughter, Spouse"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomination Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nomination.nomineeDetails?.nominationPercentage || 100}
                      onChange={(e) => updateNomination(index, {
                        nomineeDetails: { ...nomination.nomineeDetails, nominationPercentage: parseInt(e.target.value) || 100 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Structures */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-orange-500" />
            <h4 className="text-lg font-medium">Trust Structures</h4>
          </div>
          
          <div className="text-center py-8">
            <Scale className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Trust Management</h3>
            <p className="text-gray-600">Trust structure management features will be available in the next update.</p>
          </div>
        </div>
      </div>
    );
  };

  // Estate Preferences Tab Component
  const EstatePreferencesTab = () => {
    const [preferences, setPreferences] = useState(estateInformation?.estatePreferences || {
      applicableLaws: {
        religion: 'Hindu',
        personalLaw: '',
        marriageLaw: '',
        ancestralProperty: false
      },
      distributionPreferences: {
        distributionMethod: 'equal',
        assetDistribution: [],
        specificBequests: []
      },
      guardianshipArrangements: [],
      philanthropy: [],
      businessSuccession: {
        hasBusinessInterest: false,
        businessDetails: []
      },
      internationalAssets: {
        hasInternationalAssets: false,
        countries: []
      }
    });

    const handleSavePreferences = () => {
      const updatedEstateInfo = {
        ...estateInformation,
        estatePreferences: preferences
      };
      saveEstateInformation(updatedEstateInfo);
    };

    const addSpecificBequest = () => {
      const newBequest = {
        itemDescription: '',
        beneficiaryName: '',
        sentimentalValue: '',
        monetaryValue: 0
      };
      setPreferences({
        ...preferences,
        distributionPreferences: {
          ...preferences.distributionPreferences,
          specificBequests: [...(preferences.distributionPreferences?.specificBequests || []), newBequest]
        }
      });
    };

    const updateSpecificBequest = (index, updatedBequest) => {
      const updatedBequests = [...(preferences.distributionPreferences?.specificBequests || [])];
      updatedBequests[index] = { ...updatedBequests[index], ...updatedBequest };
      setPreferences({
        ...preferences,
        distributionPreferences: {
          ...preferences.distributionPreferences,
          specificBequests: updatedBequests
        }
      });
    };

    const removeSpecificBequest = (index) => {
      setPreferences({
        ...preferences,
        distributionPreferences: {
          ...preferences.distributionPreferences,
          specificBequests: (preferences.distributionPreferences?.specificBequests || []).filter((_, i) => i !== index)
        }
      });
    };

    const addPhilanthropy = () => {
      const newPhilanthropy = {
        organizationType: 'registered-ngo',
        organizationName: '',
        donationType: 'fixed-amount',
        donationAmount: 0,
        donationPurpose: ''
      };
      setPreferences({
        ...preferences,
        philanthropy: [...(preferences.philanthropy || []), newPhilanthropy]
      });
    };

    const updatePhilanthropy = (index, updatedPhilanthropy) => {
      const updatedPhilanthropies = [...(preferences.philanthropy || [])];
      updatedPhilanthropies[index] = { ...updatedPhilanthropies[index], ...updatedPhilanthropy };
      setPreferences({ ...preferences, philanthropy: updatedPhilanthropies });
    };

    const removePhilanthropy = (index) => {
      setPreferences({
        ...preferences,
        philanthropy: (preferences.philanthropy || []).filter((_, i) => i !== index)
      });
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Estate Planning Preferences</h3>
          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Preferences
          </button>
        </div>

        {/* Legal Framework */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-blue-500" />
            <h4 className="text-lg font-medium">Legal Framework</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
              <select
                value={preferences.applicableLaws?.religion || 'Hindu'}
                onChange={(e) => setPreferences({
                  ...preferences,
                  applicableLaws: { ...preferences.applicableLaws, religion: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Hindu">Hindu</option>
                <option value="Muslim">Muslim</option>
                <option value="Christian">Christian</option>
                <option value="Sikh">Sikh</option>
                <option value="Buddhist">Buddhist</option>
                <option value="Jain">Jain</option>
                <option value="Parsi">Parsi</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Law</label>
              <input
                type="text"
                value={preferences.applicableLaws?.personalLaw || ''}
                onChange={(e) => setPreferences({
                  ...preferences,
                  applicableLaws: { ...preferences.applicableLaws, personalLaw: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Hindu Succession Act, Muslim Personal Law"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marriage Law</label>
              <input
                type="text"
                value={preferences.applicableLaws?.marriageLaw || ''}
                onChange={(e) => setPreferences({
                  ...preferences,
                  applicableLaws: { ...preferences.applicableLaws, marriageLaw: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Hindu Marriage Act, Special Marriage Act"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ancestralProperty"
                checked={preferences.applicableLaws?.ancestralProperty || false}
                onChange={(e) => setPreferences({
                  ...preferences,
                  applicableLaws: { ...preferences.applicableLaws, ancestralProperty: e.target.checked }
                })}
                className="rounded"
              />
              <label htmlFor="ancestralProperty" className="text-sm font-medium">Has Ancestral Property</label>
            </div>
          </div>
        </div>

        {/* Distribution Strategy */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-green-500" />
            <h4 className="text-lg font-medium">Distribution Strategy</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distribution Method</label>
              <select
                value={preferences.distributionPreferences?.distributionMethod || 'equal'}
                onChange={(e) => setPreferences({
                  ...preferences,
                  distributionPreferences: { ...preferences.distributionPreferences, distributionMethod: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="equal">Equal Distribution</option>
                <option value="need-based">Need-based Distribution</option>
                <option value="contribution-based">Contribution-based Distribution</option>
                <option value="custom">Custom Distribution</option>
              </select>
            </div>
          </div>

          {/* Specific Bequests */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-md font-medium text-gray-900">Specific Bequests</h5>
              <button
                onClick={addSpecificBequest}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                Add Bequest
              </button>
            </div>
            
            <div className="space-y-4">
              {(preferences.distributionPreferences?.specificBequests || []).map((bequest, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h6 className="font-medium">Bequest {index + 1}</h6>
                    <button
                      onClick={() => removeSpecificBequest(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
                      <input
                        type="text"
                        value={bequest.itemDescription}
                        onChange={(e) => updateSpecificBequest(index, { itemDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Family heirloom, Jewelry, Artwork"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary Name</label>
                      <input
                        type="text"
                        value={bequest.beneficiaryName}
                        onChange={(e) => updateSpecificBequest(index, { beneficiaryName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter beneficiary's name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sentimental Value</label>
                      <input
                        type="text"
                        value={bequest.sentimentalValue}
                        onChange={(e) => updateSpecificBequest(index, { sentimentalValue: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe sentimental significance"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monetary Value</label>
                      <input
                        type="number"
                        value={bequest.monetaryValue}
                        onChange={(e) => updateSpecificBequest(index, { monetaryValue: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Estimated value"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charitable Giving */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HandHeart className="w-5 h-5 text-purple-500" />
              <h4 className="text-lg font-medium">Charitable Giving</h4>
            </div>
            <button
              onClick={addPhilanthropy}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Charity
            </button>
          </div>
          
          <div className="space-y-4">
            {(preferences.philanthropy || []).map((charity, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium">Charity {index + 1}</h5>
                  <button
                    onClick={() => removePhilanthropy(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type</label>
                    <select
                      value={charity.organizationType}
                      onChange={(e) => updatePhilanthropy(index, { organizationType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="registered-ngo">Registered NGO</option>
                      <option value="educational-institution">Educational Institution</option>
                      <option value="religious-organization">Religious Organization</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                    <input
                      type="text"
                      value={charity.organizationName}
                      onChange={(e) => updatePhilanthropy(index, { organizationName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter organization name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Donation Type</label>
                    <select
                      value={charity.donationType}
                      onChange={(e) => updatePhilanthropy(index, { donationType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="fixed-amount">Fixed Amount</option>
                      <option value="percentage">Percentage of Estate</option>
                      <option value="specific-asset">Specific Asset</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Donation Amount</label>
                    <input
                      type="number"
                      value={charity.donationAmount}
                      onChange={(e) => updatePhilanthropy(index, { donationAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter donation amount"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Donation Purpose</label>
                    <textarea
                      value={charity.donationPurpose}
                      onChange={(e) => updatePhilanthropy(index, { donationPurpose: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Describe the purpose of the donation"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Business Succession */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-orange-500" />
            <h4 className="text-lg font-medium">Business Succession</h4>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="hasBusinessInterest"
              checked={preferences.businessSuccession?.hasBusinessInterest || false}
              onChange={(e) => setPreferences({
                ...preferences,
                businessSuccession: { ...preferences.businessSuccession, hasBusinessInterest: e.target.checked }
              })}
              className="rounded"
            />
            <label htmlFor="hasBusinessInterest" className="text-sm font-medium">Has Business Interest</label>
          </div>
          
          {preferences.businessSuccession?.hasBusinessInterest && (
            <div className="text-center py-8">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Business Succession Planning</h3>
              <p className="text-gray-600">Detailed business succession planning features will be available in the next update.</p>
            </div>
          )}
        </div>

        {/* International Assets */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-blue-500" />
            <h4 className="text-lg font-medium">International Assets</h4>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="hasInternationalAssets"
              checked={preferences.internationalAssets?.hasInternationalAssets || false}
              onChange={(e) => setPreferences({
                ...preferences,
                internationalAssets: { ...preferences.internationalAssets, hasInternationalAssets: e.target.checked }
              })}
              className="rounded"
            />
            <label htmlFor="hasInternationalAssets" className="text-sm font-medium">Has International Assets</label>
          </div>
          
          {preferences.internationalAssets?.hasInternationalAssets && (
            <div className="text-center py-8">
              <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">International Asset Planning</h3>
              <p className="text-gray-600">International asset management and cross-border planning features will be available in the next update.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Will Creation Tab Component
  const WillCreationTab = () => {
    const [willContent, setWillContent] = useState(willData?.willContent || '');
    const [willType, setWillType] = useState(willData?.willType || 'unregistered');
    const [executorDetails, setExecutorDetails] = useState(willData?.executorDetails || {
      primaryExecutor: '',
      primaryExecutorContact: '',
      primaryExecutorRelation: ''
    });

    const handleSaveWill = () => {
      const willData = {
        willContent,
        willType,
        executorDetails
      };
      saveWill(willData);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Will Creation & Management</h3>
          <button
            onClick={handleSaveWill}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Will
          </button>
        </div>

        {/* Will Type Selection */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileSignature className="w-5 h-5 text-blue-500" />
            <h4 className="text-lg font-medium">Will Type & Registration</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="unregistered"
                name="willType"
                value="unregistered"
                checked={willType === 'unregistered'}
                onChange={(e) => setWillType(e.target.value)}
                className="text-blue-600"
              />
              <label htmlFor="unregistered" className="text-sm font-medium">Unregistered Will</label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="registered"
                name="willType"
                value="registered"
                checked={willType === 'registered'}
                onChange={(e) => setWillType(e.target.value)}
                className="text-blue-600"
              />
              <label htmlFor="registered" className="text-sm font-medium">Registered Will</label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="notarized"
                name="willType"
                value="notarized"
                checked={willType === 'notarized'}
                onChange={(e) => setWillType(e.target.value)}
                className="text-blue-600"
              />
              <label htmlFor="notarized" className="text-sm font-medium">Notarized Will</label>
            </div>
          </div>
        </div>

        {/* Executor Details */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-green-500" />
            <h4 className="text-lg font-medium">Executor Details</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Executor Name</label>
              <input
                type="text"
                value={executorDetails.primaryExecutor}
                onChange={(e) => setExecutorDetails({
                  ...executorDetails,
                  primaryExecutor: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter executor's full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              <input
                type="text"
                value={executorDetails.primaryExecutorRelation}
                onChange={(e) => setExecutorDetails({
                  ...executorDetails,
                  primaryExecutorRelation: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Son, Daughter, Spouse, Friend"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="tel"
                value={executorDetails.primaryExecutorContact}
                onChange={(e) => setExecutorDetails({
                  ...executorDetails,
                  primaryExecutorContact: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter contact number"
              />
            </div>
          </div>
        </div>

        {/* Will Content Editor */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-purple-500" />
            <h4 className="text-lg font-medium">Will Content</h4>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Will Content (Professional Legal Document)
            </label>
            <textarea
              value={willContent}
              onChange={(e) => setWillContent(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Enter the complete will content here. This should be a professional legal document that clearly states your wishes for asset distribution, guardianship arrangements, and other important matters..."
            />
          </div>
          
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <p className="font-medium mb-2">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>This is a professional will creation tool. Please ensure all content is legally accurate.</li>
              <li>Consider consulting with a legal professional for complex estate planning needs.</li>
              <li>Regularly review and update your will after major life events.</li>
              <li>Ensure proper witness signatures and registration as per applicable laws.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Building className="h-6 w-6 mr-2 text-purple-600" />
                  Estate Planning
                </h1>
                <p className="text-gray-600">
                  {clientInfo?.name} • Client ID: {clientId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchEstatePlanningData}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-1 inline" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            personalInfo={personalInfo}
            financialAssets={financialAssets}
            liabilities={liabilities}
            incomeAnalysis={incomeAnalysis}
            investmentPortfolio={investmentPortfolio}
            riskAssessment={riskAssessment}
            casData={casData}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
            getRiskColor={getRiskColor}
            getHealthColor={getHealthColor}
          />
        )}

        {activeTab === 'assets' && (
          <AssetsTab
            financialAssets={financialAssets}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
          />
        )}

        {activeTab === 'liabilities' && (
          <LiabilitiesTab
            liabilities={liabilities}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'income' && (
          <IncomeTab
            incomeAnalysis={incomeAnalysis}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
            getHealthColor={getHealthColor}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioTab
            investmentPortfolio={investmentPortfolio}
            casData={casData}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
            getRiskColor={getRiskColor}
          />
        )}

        {activeTab === 'risk' && (
          <RiskTab
            riskAssessment={riskAssessment}
            formatPercentage={formatPercentage}
            getRiskColor={getRiskColor}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsTab
            recommendations={recommendations}
          />
        )}

        {activeTab === 'family' && <FamilyBeneficiariesTab />}
        {activeTab === 'will' && <WillCreationTab />}
        {activeTab === 'properties' && <RealEstateTab />}
        {activeTab === 'legal' && <LegalDocumentsTab />}
        {activeTab === 'preferences' && <EstatePreferencesTab />}
      </div>
    </div>
  );
}

// Overview Tab Component
const OverviewTab = ({
  personalInfo,
  financialAssets,
  liabilities,
  incomeAnalysis,
  investmentPortfolio,
  riskAssessment,
  casData,
  formatCurrency,
  formatPercentage,
  getRiskColor,
  getHealthColor
}) => {
  const netWorth = financialAssets?.totalAssets - liabilities?.totalLiabilities;

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(financialAssets?.totalAssets)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Liabilities</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(liabilities?.totalLiabilities)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Worth</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(netWorth)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PiggyBank className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Surplus</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(incomeAnalysis?.monthlySurplus)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Full Name</p>
            <p className="font-medium">{personalInfo?.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Age</p>
            <p className="font-medium">{personalInfo?.age || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Marital Status</p>
            <p className="font-medium">{personalInfo?.maritalStatus || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Dependents</p>
            <p className="font-medium">{personalInfo?.numberOfDependents || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">PAN Number</p>
            <p className="font-medium">{personalInfo?.panNumber || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{personalInfo?.email}</p>
          </div>
        </div>
      </div>

      {/* Financial Health Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Financial Health Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Cash Flow Health</p>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getHealthColor(incomeAnalysis?.cashFlowHealth)}`}>
              {incomeAnalysis?.cashFlowHealth || 'Unknown'}
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Risk Level</p>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(investmentPortfolio?.riskLevel)}`}>
              {investmentPortfolio?.riskLevel || 'Unknown'}
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Diversification</p>
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {investmentPortfolio?.diversification || 'Unknown'}
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Liquidity</p>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(investmentPortfolio?.liquidity)}`}>
              {investmentPortfolio?.liquidity || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* CAS Data Summary */}
      {casData && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            CAS Portfolio Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Portfolio Value</p>
              <p className="text-lg font-semibold">{formatCurrency(casData.totalPortfolioValue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Demat Accounts</p>
              <p className="text-lg font-semibold">{casData.dematAccounts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mutual Funds</p>
              <p className="text-lg font-semibold">{casData.mutualFunds}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm text-gray-500">
                {casData.lastUpdated ? new Date(casData.lastUpdated).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Assets Tab Component
const AssetsTab = ({ financialAssets, formatCurrency, formatPercentage }) => {
  const totalAssets = financialAssets?.totalAssets || 0;

  return (
    <div className="space-y-6">
      {/* Asset Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Liquid Assets</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(financialAssets?.liquidAssets)}
            </p>
            <p className="text-xs text-gray-500">
              {formatPercentage((financialAssets?.liquidAssets / totalAssets) * 100)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Investment Assets</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(financialAssets?.investmentAssets)}
            </p>
            <p className="text-xs text-gray-500">
              {formatPercentage((financialAssets?.investmentAssets / totalAssets) * 100)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Real Estate</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(financialAssets?.realEstateAssets)}
            </p>
            <p className="text-xs text-gray-500">
              {formatPercentage((financialAssets?.realEstateAssets / totalAssets) * 100)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Retirement Assets</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(financialAssets?.retirementAssets)}
            </p>
            <p className="text-xs text-gray-500">
              {formatPercentage((financialAssets?.retirementAssets / totalAssets) * 100)}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Asset Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Asset Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(financialAssets?.breakdown || {}).map(([key, value]) => (
                <tr key={key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPercentage((value / totalAssets) * 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Liabilities Tab Component
const LiabilitiesTab = ({ liabilities, formatCurrency }) => {
  return (
    <div className="space-y-6">
      {/* Liability Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Liability Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Secured Debt</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(liabilities?.securedDebt)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Unsecured Debt</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(liabilities?.unsecuredDebt)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Monthly EMIs</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(liabilities?.monthlyEMIs)}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Liability Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Liability Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outstanding Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly EMI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interest Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(liabilities?.breakdown || {}).map(([key, value]) => (
                <tr key={key}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(value.outstandingAmount || value.totalOutstanding)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(value.monthlyEMI || value.monthlyPayment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {value.interestRate || value.averageInterestRate ? 
                      `${value.interestRate || value.averageInterestRate}%` : 
                      'N/A'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Income Tab Component
const IncomeTab = ({ incomeAnalysis, formatCurrency, formatPercentage, getHealthColor }) => {
  return (
    <div className="space-y-6">
      {/* Income Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income & Cash Flow Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Monthly Income</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(incomeAnalysis?.monthlyIncome)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Monthly Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(incomeAnalysis?.monthlyExpenses)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Monthly Surplus</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(incomeAnalysis?.monthlySurplus)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Cash Flow Health</p>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getHealthColor(incomeAnalysis?.cashFlowHealth)}`}>
              {incomeAnalysis?.cashFlowHealth || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Income Details */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Annual Income</p>
            <p className="text-xl font-semibold">{formatCurrency(incomeAnalysis?.annualIncome)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Income Type</p>
            <p className="text-xl font-semibold">{incomeAnalysis?.incomeType || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Income Stability</p>
            <p className="text-xl font-semibold">{incomeAnalysis?.incomeStability || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Surplus Ratio</p>
            <p className="text-xl font-semibold">
              {formatPercentage(
                incomeAnalysis?.monthlyIncome > 0 ? 
                (incomeAnalysis?.monthlySurplus / incomeAnalysis?.monthlyIncome) * 100 : 0
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      {incomeAnalysis?.expenseBreakdown && Object.keys(incomeAnalysis.expenseBreakdown).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expense Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(incomeAnalysis.expenseBreakdown).map(([key, value]) => (
                  <tr key={key}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPercentage(
                        incomeAnalysis?.monthlyExpenses > 0 ? 
                        (value / incomeAnalysis?.monthlyExpenses) * 100 : 0
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Portfolio Tab Component
const PortfolioTab = ({ investmentPortfolio, casData, formatCurrency, formatPercentage, getRiskColor }) => {
  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Portfolio Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(investmentPortfolio?.totalValue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Risk Level</p>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getRiskColor(investmentPortfolio?.riskLevel)}`}>
              {investmentPortfolio?.riskLevel || 'Unknown'}
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Diversification</p>
            <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
              {investmentPortfolio?.diversification || 'Unknown'}
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Liquidity</p>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getRiskColor(investmentPortfolio?.liquidity)}`}>
              {investmentPortfolio?.liquidity || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Asset Allocation */}
      {investmentPortfolio?.assetAllocation && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(investmentPortfolio.assetAllocation).map(([key, value]) => (
              <div key={key} className="text-center">
                <p className="text-sm text-gray-600 capitalize">{key}</p>
                <p className="text-xl font-semibold">{formatPercentage(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CAS Data Integration */}
      {casData && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CAS Portfolio Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Portfolio Value</p>
              <p className="text-lg font-semibold">{formatCurrency(casData.totalPortfolioValue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Demat Accounts</p>
              <p className="text-lg font-semibold">{casData.dematAccounts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mutual Funds</p>
              <p className="text-lg font-semibold">{casData.mutualFunds}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm text-gray-500">
                {casData.lastUpdated ? new Date(casData.lastUpdated).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Risk Tab Component
const RiskTab = ({ riskAssessment, formatPercentage, getRiskColor }) => {
  return (
    <div className="space-y-6">
      {/* Risk Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Overall Risk Score</p>
            <p className="text-2xl font-bold text-gray-900">
              {riskAssessment?.overallRiskScore || 0}/8
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Investment Experience</p>
            <p className="text-sm font-medium text-gray-900">
              {riskAssessment?.investmentExperience || 'Not specified'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Risk Tolerance</p>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getRiskColor(riskAssessment?.riskTolerance)}`}>
              {riskAssessment?.riskTolerance || 'Not specified'}
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Investment Capacity</p>
            <p className="text-lg font-semibold">
              ₹{riskAssessment?.monthlyInvestmentCapacity?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {riskAssessment?.riskFactors && riskAssessment.riskFactors.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Identified Risk Factors</h3>
          <div className="space-y-2">
            {riskAssessment.riskFactors.map((factor, index) => (
              <div key={index} className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                <p className="text-sm text-yellow-800">{factor}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Recommendations Tab Component
const RecommendationsTab = ({ recommendations }) => {
  const recommendationCategories = [
    { key: 'immediateActions', title: 'Immediate Actions', icon: Clock, color: 'red' },
    { key: 'shortTermGoals', title: 'Short Term Goals', icon: Target, color: 'yellow' },
    { key: 'longTermGoals', title: 'Long Term Goals', icon: Award, color: 'green' },
    { key: 'riskMitigation', title: 'Risk Mitigation', icon: Shield, color: 'blue' },
    { key: 'taxOptimization', title: 'Tax Optimization', icon: Calculator, color: 'purple' },
    { key: 'estateProtection', title: 'Estate Protection', icon: Building, color: 'indigo' }
  ];

  return (
    <div className="space-y-6">
      {recommendationCategories.map(({ key, title, icon: Icon, color }) => {
        const items = recommendations?.[key] || [];
        if (items.length === 0) return null;

        return (
          <div key={key} className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Icon className={`h-5 w-5 mr-2 text-${color}-600`} />
              {title}
            </h3>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {(!recommendations || Object.values(recommendations).every(arr => arr.length === 0)) && (
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Available</h3>
          <p className="text-gray-600">
            Complete client financial data to generate personalized estate planning recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default EstatePlanningPage;
