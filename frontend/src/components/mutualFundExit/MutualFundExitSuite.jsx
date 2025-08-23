/**
 * FILE LOCATION: frontend/src/components/mutualFundExit/MutualFundExitSuite.jsx
 * 
 * FIXED: Corrected data access path for clients array
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  Users, 
  PieChart, 
  FileText, 
  Eye,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import ClientSelection from './ClientSelection';
import MutualFundsList from './MutualFundsList';
import ExitStrategyForm from './ExitStrategyForm';
import ExitStrategyView from './ExitStrategyView';
import api from '../../services/api';

const MutualFundExitSuite = () => {
  const [activeStep, setActiveStep] = useState('client-selection');
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedFund, setSelectedFund] = useState(null);
  const [clientsWithFunds, setClientsWithFunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchClientsWithFunds();
    fetchSummary();
  }, []);

  const fetchClientsWithFunds = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching clients with mutual funds...');
      
      const response = await api.get('/mutual-fund-exit-strategies/clients-with-funds');
      
      console.log('✅ Response received:', response.data);
      console.log('📊 Response structure:', {
        success: response.data?.success,
        hasData: !!response.data?.data,
        clientsLength: response.data?.data?.clients?.length || 0,
        summary: response.data?.data?.summary
      });
      
      if (response.data?.success) {
        // ✅ FIXED: Access clients from correct nested path
        setClientsWithFunds(response.data.data?.clients || []);
        console.log('📋 Clients set:', response.data.data?.clients?.length || 0);
        
        // Log first client for debugging
        if (response.data.data?.clients?.length > 0) {
          console.log('🔍 First client sample:', response.data.data.clients[0]);
        }
      } else {
        setError('Failed to fetch clients data');
      }
    } catch (err) {
      console.error('❌ Error fetching clients:', err);
      setError(err.response?.data?.message || 'Failed to load clients with mutual funds');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/mutual-fund-exit-strategies/summary');
      if (response.data?.success) {
        setSummary(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const handleClientSelect = (client) => {
    console.log('📋 Client selected:', client);
    setSelectedClient(client);
    setActiveStep('fund-listing');
  };

  const handleFundSelect = (fund) => {
    setSelectedFund(fund);
    setActiveStep('strategy-form');
  };

  const handleStrategyCreated = (strategy) => {
    // Refresh data and show success
    fetchClientsWithFunds();
    fetchSummary();
    setActiveStep('strategy-view');
  };

  const handleBackToFunds = () => {
    setSelectedFund(null);
    setActiveStep('fund-listing');
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    setSelectedFund(null);
    setActiveStep('client-selection');
  };

  const handleViewStrategy = (strategy) => {
    setSelectedFund(strategy);
    setActiveStep('strategy-view');
  };

  const getStepIcon = (step) => {
    switch (step) {
      case 'client-selection':
        return <Users className="w-5 h-5" />;
      case 'fund-listing':
        return <PieChart className="w-5 h-5" />;
      case 'strategy-form':
        return <FileText className="w-5 h-5" />;
      case 'strategy-view':
        return <Eye className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const getStepTitle = (step) => {
    switch (step) {
      case 'client-selection':
        return 'Select Client';
      case 'fund-listing':
        return 'Select Mutual Fund';
      case 'strategy-form':
        return 'Create Exit Strategy';
      case 'strategy-view':
        return 'View Exit Strategy';
      default:
        return 'Select Client';
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 'client-selection':
        return (
          <ClientSelection
            clients={clientsWithFunds}
            onClientSelect={handleClientSelect}
            loading={loading}
            error={error}
            onRetry={fetchClientsWithFunds}
            summary={summary}
          />
        );
      case 'fund-listing':
        return (
          <MutualFundsList
            client={selectedClient}
            onFundSelect={handleFundSelect}
            onBack={handleBackToClients}
            onViewStrategy={handleViewStrategy}
          />
        );
      case 'strategy-form':
        return (
          <ExitStrategyForm
            client={selectedClient}
            fund={selectedFund}
            onStrategyCreated={handleStrategyCreated}
            onBack={handleBackToFunds}
          />
        );
      case 'strategy-view':
        return (
          <ExitStrategyView
            strategy={selectedFund}
            onBack={handleBackToFunds}
            onEdit={() => setActiveStep('strategy-form')}
          />
        );
      default:
        return (
          <ClientSelection
            clients={clientsWithFunds}
            onClientSelect={handleClientSelect}
            loading={loading}
            error={error}
            onRetry={fetchClientsWithFunds}
            summary={summary}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 shadow-sm border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl shadow-lg">
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Mutual Fund Exit Suite
                </h1>
                <p className="text-gray-600 text-base">
                  Create comprehensive exit strategies for mutual fund investments
                </p>
              </div>
            </div>
            
            {/* Enhanced Summary Stats */}
            {summary && (
              <div className="flex items-center space-x-6">
                <div className="text-center bg-white rounded-xl p-4 shadow-sm border border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {summary.totalStrategies}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Total Strategies</div>
                </div>
                <div className="text-center bg-white rounded-xl p-4 shadow-sm border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{summary.totalValue?.toLocaleString('en-IN') || '0'}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Total Value</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Progress Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-12 py-6">
            {[
              'client-selection',
              'fund-listing',
              'strategy-form',
              'strategy-view'
            ].map((step, index) => {
              const isActive = activeStep === step;
              const isCompleted = [
                'client-selection',
                'fund-listing',
                'strategy-form',
                'strategy-view'
              ].indexOf(activeStep) > index;
              
              return (
                <div key={step} className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110' 
                      : isCompleted 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md' 
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <span className="text-lg font-bold">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-400'
                    }`}>
                      {getStepIcon(step)}
                    </div>
                    <span className={`text-base font-semibold transition-colors duration-300 ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {getStepTitle(step)}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className={`w-20 h-1 rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStepContent()}
      </div>

      {/* Enhanced Footer Navigation */}
      {activeStep !== 'client-selection' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl backdrop-blur-sm bg-white/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={
                  activeStep === 'fund-listing' 
                    ? handleBackToClients 
                    : activeStep === 'strategy-form' 
                      ? handleBackToFunds 
                      : handleBackToFunds
                }
                className="flex items-center space-x-3 px-6 py-3 text-gray-600 hover:text-gray-800 transition-all duration-300 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-gray-300"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
              
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700">
                  Step {['client-selection', 'fund-listing', 'strategy-form', 'strategy-view'].indexOf(activeStep) + 1} of 4
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getStepTitle(activeStep)}
                </div>
              </div>
              
              <div className="w-24"></div> {/* Spacer for centering */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MutualFundExitSuite;