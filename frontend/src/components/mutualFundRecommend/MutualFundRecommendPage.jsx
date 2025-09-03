/**
 * FILE LOCATION: frontend/src/components/mutualFundRecommend/MutualFundRecommendPage.jsx
 * 
 * PURPOSE: Main page component for mutual fund recommendations
 * 
 * FUNCTIONALITY:
 * - Comprehensive input form for mutual fund recommendations
 * - Claude AI integration for fund details
 * - Multiple recommendation management
 * - Form validation and error handling
 * - Professional enterprise UI design
 * 
 * FEATURES:
 * - Add/Remove recommendation sections
 * - Real-time Claude AI data fetching
 * - Form validation for required fields
 * - Professional styling with green, dark blue, and white colors
 * - Responsive design for all screen sizes
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  X, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Loader2, 
  Info,
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  Shield,
  Building,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { mutualFundRecommendAPI } from '../../services/api';

const MutualFundRecommendPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // State management
  const [recommendations, setRecommendations] = useState([{
    id: Date.now(),
    fundName: '',
    fundHouseName: '',
    recommendedMonthlySIP: '',
    sipStartDate: '',
    expectedExitDate: '',
    exitConditions: '',
    reasonForRecommendation: '',
    riskProfile: '',
    investmentGoal: '',
    claudeResponse: null,
    isLoadingClaude: false
  }]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientName, setClientName] = useState('');

  // Check authentication and load client name on component mount
  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading && !isAuthenticated) {
      toast.error('Please login to access this page');
      navigate('/login');
      return;
    }

    // Extract client name from URL or localStorage if available
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('clientName') || 'Client';
    setClientName(name);
  }, [isAuthenticated, authLoading, navigate]);

  // Add new recommendation section
  const addRecommendation = () => {
    setRecommendations(prev => [...prev, {
      id: Date.now() + Math.random(),
      fundName: '',
      fundHouseName: '',
      recommendedMonthlySIP: '',
      sipStartDate: '',
      expectedExitDate: '',
      exitConditions: '',
      reasonForRecommendation: '',
      riskProfile: '',
      investmentGoal: '',
      claudeResponse: null,
      isLoadingClaude: false
    }]);
  };

  // Remove recommendation section
  const removeRecommendation = (id) => {
    if (recommendations.length > 1) {
      setRecommendations(prev => prev.filter(rec => rec.id !== id));
    } else {
      toast.error('At least one recommendation is required');
    }
  };

  // Update recommendation field
  const updateRecommendation = (id, field, value) => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === id ? { ...rec, [field]: value } : rec
    ));
  };

  // Fetch fund details from Claude AI
  const fetchFundDetails = async (id) => {
    const recommendation = recommendations.find(rec => rec.id === id);
    
    if (!recommendation.fundName || !recommendation.fundHouseName) {
      toast.error('Please enter both fund name and fund house name');
      return;
    }

    // Check if user is authenticated and has a valid token
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required. Please login again.');
      navigate('/login');
      return;
    }

    // Set loading state
    updateRecommendation(id, 'isLoadingClaude', true);

    try {
      const response = await mutualFundRecommendAPI.fetchFundDetails(
        recommendation.fundName,
        recommendation.fundHouseName
      );

      if (response.success) {
        updateRecommendation(id, 'claudeResponse', response.data);
        toast.success('Fund details fetched successfully from Claude AI');
      } else {
        toast.error(response.message || 'Failed to fetch fund details');
      }
    } catch (error) {
      console.error('Error fetching fund details:', error);
      
      // Handle different types of errors
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Authentication failed. Please login again.');
          navigate('/login');
        } else if (error.response.status === 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(`Error: ${error.response.data?.message || 'Failed to fetch fund details'}`);
        }
      } else if (error.request) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to fetch fund details from Claude AI');
      }
    } finally {
      updateRecommendation(id, 'isLoadingClaude', false);
    }
  };

  // Validate form data
  const validateForm = () => {
    for (const rec of recommendations) {
      if (!rec.fundName || !rec.fundHouseName || !rec.recommendedMonthlySIP || 
          !rec.sipStartDate || !rec.expectedExitDate || !rec.exitConditions || 
          !rec.reasonForRecommendation || !rec.riskProfile || !rec.investmentGoal) {
        return false;
      }
    }
    return true;
  };

  // Submit recommendations
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields for all recommendations');
      return;
    }

    setSubmitting(true);

    try {
      const promises = recommendations.map(rec => 
        mutualFundRecommendAPI.createRecommendation({
          clientId,
          fundName: rec.fundName,
          fundHouseName: rec.fundHouseName,
          recommendedMonthlySIP: parseFloat(rec.recommendedMonthlySIP),
          sipStartDate: rec.sipStartDate,
          expectedExitDate: rec.expectedExitDate,
          exitConditions: rec.exitConditions,
          reasonForRecommendation: rec.reasonForRecommendation,
          riskProfile: rec.riskProfile,
          investmentGoal: rec.investmentGoal,
          claudeResponse: rec.claudeResponse
        })
      );

      await Promise.all(promises);
      
      toast.success('All recommendations submitted successfully!');
      navigate(`/clients/${clientId}`);
      
    } catch (error) {
      console.error('Error submitting recommendations:', error);
      toast.error('Failed to submit recommendations. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/clients/${clientId}`)}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Mutual Fund Recommendations
                </h1>
                <p className="text-sm text-gray-600">
                  Client: {clientName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={addRecommendation}
                className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recommendation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Recommendations */}
          {recommendations.map((recommendation, index) => (
            <div key={recommendation.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Recommendation #{index + 1}
                  </h3>
                  {recommendations.length > 1 && (
                    <button
                      onClick={() => removeRecommendation(recommendation.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Fund Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
                      Fund Information
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fund Name *
                      </label>
                      <input
                        type="text"
                        value={recommendation.fundName}
                        onChange={(e) => updateRecommendation(recommendation.id, 'fundName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., ICICI Prudential Large Cap Fund"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fund House Name *
                      </label>
                      <input
                        type="text"
                        value={recommendation.fundHouseName}
                        onChange={(e) => updateRecommendation(recommendation.id, 'fundHouseName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., ICICI Prudential"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchFundDetails(recommendation.id)}
                        disabled={!recommendation.fundName || !recommendation.fundHouseName || recommendation.isLoadingClaude}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {recommendation.isLoadingClaude ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Info className="h-4 w-4 mr-2" />
                        )}
                        {recommendation.isLoadingClaude ? 'Fetching...' : 'Fetch Fund Details'}
                      </button>
                    </div>
                  </div>

                  {/* Investment Parameters */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
                      Investment Parameters
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recommended Monthly SIP Amount (₹) *
                      </label>
                      <input
                        type="number"
                        min="100"
                        value={recommendation.recommendedMonthlySIP}
                        onChange={(e) => updateRecommendation(recommendation.id, 'recommendedMonthlySIP', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="5000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SIP Start Date *
                      </label>
                      <input
                        type="date"
                        value={recommendation.sipStartDate}
                        onChange={(e) => updateRecommendation(recommendation.id, 'sipStartDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Exit Date *
                      </label>
                      <input
                        type="date"
                        value={recommendation.expectedExitDate}
                        onChange={(e) => updateRecommendation(recommendation.id, 'expectedExitDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exit Conditions *
                      </label>
                      <textarea
                        value={recommendation.exitConditions}
                        onChange={(e) => updateRecommendation(recommendation.id, 'exitConditions', e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe when to exit this investment..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Recommendation *
                      </label>
                      <textarea
                        value={recommendation.reasonForRecommendation}
                        onChange={(e) => updateRecommendation(recommendation.id, 'reasonForRecommendation', e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Explain why you're recommending this fund..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Risk Profile *
                      </label>
                      <select
                        value={recommendation.riskProfile}
                        onChange={(e) => updateRecommendation(recommendation.id, 'riskProfile', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select risk profile</option>
                        <option value="Conservative">Conservative</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Aggressive">Aggressive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Investment Goal *
                      </label>
                      <select
                        value={recommendation.investmentGoal}
                        onChange={(e) => updateRecommendation(recommendation.id, 'investmentGoal', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select investment goal</option>
                        <option value="Wealth Creation">Wealth Creation</option>
                        <option value="Retirement">Retirement</option>
                        <option value="Child Education">Child Education</option>
                        <option value="Emergency Fund">Emergency Fund</option>
                        <option value="Other Reason">Other Reason</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Claude AI Response Display */}
                {recommendation.claudeResponse && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-md font-medium text-blue-900 mb-3 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Fund Details from Claude AI
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-white p-3 rounded border">
                        <span className="text-xs text-gray-500">Category</span>
                        <p className="font-medium">{recommendation.claudeResponse.category || 'N/A'}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <span className="text-xs text-gray-500">Launch Date</span>
                        <p className="font-medium">{recommendation.claudeResponse.launchDate || 'N/A'}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <span className="text-xs text-gray-500">AUM</span>
                        <p className="font-medium">{recommendation.claudeResponse.aum || 'N/A'}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <span className="text-xs text-gray-500">Latest NAV</span>
                        <p className="font-medium">{recommendation.claudeResponse.latestNAV || 'N/A'}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <span className="text-xs text-gray-500">Risk Level</span>
                        <p className="font-medium">{recommendation.claudeResponse.risk || 'N/A'}</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <span className="text-xs text-gray-500">Benchmark</span>
                        <p className="font-medium">{recommendation.claudeResponse.benchmark || 'N/A'}</p>
                      </div>
                    </div>

                    {recommendation.claudeResponse.returns && (
                      <div className="mt-4 p-3 bg-white rounded border">
                        <span className="text-xs text-gray-500">Returns (1Y/3Y/5Y)</span>
                        <p className="font-medium">
                          {recommendation.claudeResponse.returns.oneYear} / {recommendation.claudeResponse.returns.threeYear} / {recommendation.claudeResponse.returns.fiveYear}
                        </p>
                      </div>
                    )}

                    {recommendation.claudeResponse.topHoldings && recommendation.claudeResponse.topHoldings.length > 0 && (
                      <div className="mt-4 p-3 bg-white rounded border">
                        <span className="text-xs text-gray-500">Top Holdings</span>
                        <p className="font-medium">{recommendation.claudeResponse.topHoldings.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={submitting || !validateForm()}
            className="flex items-center px-8 py-3 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {submitting ? 'Submitting...' : 'Submit All Recommendations'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MutualFundRecommendPage;
