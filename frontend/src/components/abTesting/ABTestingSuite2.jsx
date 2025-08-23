import React, { useState, useEffect } from 'react';
import { Search, User, TrendingUp, Calculator, Target, AlertTriangle } from 'lucide-react';
import { clientAPI } from '../../services/api';
import abTestingSuite2API from '../../services/abTestingSuite2API';
import ClientSelectionStep from './suite2/ClientSelectionStep';
import RiskAssessmentStep from './suite2/RiskAssessmentStep';
import ScenarioGenerationStep from './suite2/ScenarioGenerationStep';
import SimulationResultsStep from './suite2/SimulationResultsStep';
import StressTestingStep from './suite2/StressTestingStep';

const ABTestingSuite2 = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testSession, setTestSession] = useState({
    sessionId: null,
    client: null,
    riskProfile: null,
    scenarios: [],
    simulationResults: {},
    stressTestResults: {},
    finalSelection: null
  });
  const [error, setError] = useState(null);

  const steps = [
    { 
      id: 1, 
      name: 'Client Selection', 
      icon: User, 
      description: 'Select client for A/B testing analysis' 
    },
    { 
      id: 2, 
      name: 'Risk Assessment', 
      icon: AlertTriangle, 
      description: 'Comprehensive risk profiling questionnaire' 
    },
    { 
      id: 3, 
      name: 'Scenario Generation', 
      icon: TrendingUp, 
      description: 'Generate investment strategy scenarios' 
    },
    { 
      id: 4, 
      name: 'Monte Carlo Simulation', 
      icon: Calculator, 
      description: 'Run probabilistic analysis and projections' 
    },
    { 
      id: 5, 
      name: 'Stress Testing', 
      icon: Target, 
      description: 'Test scenarios against crisis conditions' 
    }
  ];

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clientAPI.getClients();
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (stepData) => {
    try {
      setError(null);
      
      // Create session if it's the first step (client selection)
      if (currentStep === 1 && stepData.client) {
        const sessionResponse = await abTestingSuite2API.createSession(stepData.client._id);
        setTestSession(prev => ({
          ...prev,
          sessionId: sessionResponse.session.sessionId,
          client: stepData.client
        }));
        setSelectedClient(stepData.client);
      }
      
      // Update risk profile
      else if (currentStep === 2 && stepData.riskProfile) {
        await abTestingSuite2API.updateRiskProfile(testSession.sessionId, stepData.riskProfile);
        setTestSession(prev => ({
          ...prev,
          riskProfile: stepData.riskProfile
        }));
      }
      
      // Add scenarios
      else if (currentStep === 3 && stepData.scenarios) {
        await abTestingSuite2API.addScenarios(testSession.sessionId, stepData.scenarios);
        setTestSession(prev => ({
          ...prev,
          scenarios: stepData.scenarios
        }));
      }
      
      // Add simulation results
      else if (currentStep === 4 && stepData.simulationResults) {
        await abTestingSuite2API.addSimulationResults(testSession.sessionId, stepData.simulationResults);
        setTestSession(prev => ({
          ...prev,
          simulationResults: stepData.simulationResults
        }));
      }
      
      // Add stress test results
      else if (currentStep === 5 && stepData.stressTestResults) {
        await abTestingSuite2API.addStressTestResults(testSession.sessionId, stepData.stressTestResults);
        setTestSession(prev => ({
          ...prev,
          stressTestResults: stepData.stressTestResults
        }));
      }
      
      // Move to next step
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
      
    } catch (error) {
      console.error('Error completing step:', error);
      setError(error.message);
    }
  };

  const handleStepChange = (stepId) => {
    setCurrentStep(stepId);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ClientSelectionStep
            clients={clients}
            loading={loading}
            selectedClient={selectedClient}
            onClientSelect={setSelectedClient}
            onComplete={(data) => handleStepComplete({ client: data })}
          />
        );
      case 2:
        return (
          <RiskAssessmentStep
            client={selectedClient}
            onComplete={(data) => handleStepComplete({ riskProfile: data })}
          />
        );
      case 3:
        return (
          <ScenarioGenerationStep
            client={selectedClient}
            riskProfile={testSession.riskProfile}
            onComplete={(data) => handleStepComplete({ scenarios: data })}
          />
        );
      case 4:
        return (
          <SimulationResultsStep
            client={selectedClient}
            scenarios={testSession.scenarios}
            onComplete={(data) => handleStepComplete({ simulationResults: data })}
          />
        );
      case 5:
        return (
          <StressTestingStep
            client={selectedClient}
            scenarios={testSession.scenarios}
            simulationResults={testSession.simulationResults}
            onComplete={(data) => handleStepComplete({ stressTestResults: data })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="mr-3 h-8 w-8 text-blue-600" />
              A/B Testing Suite 2.0
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Advanced Financial Investment Strategy Comparison with Monte Carlo Analysis
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="py-4">
            <ol className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const isClickable = currentStep >= step.id || testSession.client;

                return (
                  <li key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => isClickable && handleStepChange(step.id)}
                        disabled={!isClickable}
                        className={`
                          flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                          ${isActive 
                            ? 'border-blue-600 bg-blue-600 text-white' 
                            : isCompleted 
                              ? 'border-green-500 bg-green-500 text-white'
                              : isClickable
                                ? 'border-gray-300 bg-white text-gray-500 hover:border-blue-300'
                                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                      <div className="mt-2 text-center">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-blue-600' : 
                          isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {step.name}
                        </p>
                        <p className="text-xs text-gray-400 max-w-24">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <h4 className="text-red-800 font-medium">Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {renderStepContent()}
        </div>
      </div>

      {/* Debug Panel (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg max-w-sm">
          <h4 className="font-semibold mb-2">Debug Info</h4>
          <div className="text-xs space-y-1">
            <p>Current Step: {currentStep}</p>
            <p>Selected Client: {selectedClient?.firstName || 'None'}</p>
            <p>Risk Profile: {testSession.riskProfile ? 'Complete' : 'Pending'}</p>
            <p>Scenarios: {testSession.scenarios.length || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ABTestingSuite2;