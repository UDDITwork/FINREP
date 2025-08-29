import React, { useState } from 'react';
import api from '../services/api';

function DebugApiTest() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint, name) => {
    try {
      setLoading(true);
      console.log(`Testing ${name}:`, endpoint);
      
      const response = await api.get(endpoint);
      console.log(`${name} Response:`, response);
      
      setResults(prev => ({
        ...prev,
        [name]: {
          success: true,
          status: response.status,
          data: response.data,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error(`${name} Error:`, error);
      setResults(prev => ({
        ...prev,
        [name]: {
          success: false,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults({});
  };

  const testAllEndpoints = async () => {
    const endpoints = [
      { path: '/client-reports/test', name: 'Connection Test' },
      { path: '/client-reports/data-test', name: 'Data Exists Test' },
      { path: '/client-reports/vault', name: 'Vault Data' },
      { path: '/client-reports/clients', name: 'Client List' }
    ];

    for (const endpoint of endpoints) {
      await testEndpoint(endpoint.path, endpoint.name);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">🔍 API Debug Testing</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <button 
              onClick={() => testEndpoint('/client-reports/test', 'Connection Test')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              🔌 Test Connection
            </button>
            
            <button 
              onClick={() => testEndpoint('/client-reports/data-test', 'Data Exists Test')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              📊 Test Data Exists
            </button>
            
            <button 
              onClick={() => testEndpoint('/client-reports/vault', 'Vault Data')}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              🏦 Test Vault API
            </button>
            
            <button 
              onClick={() => testEndpoint('/client-reports/clients', 'Client List')}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              👥 Test Client List
            </button>
            
            <button 
              onClick={testAllEndpoints}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              🚀 Test All Endpoints
            </button>
            
            <button 
              onClick={clearResults}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              🗑️ Clear Results
            </button>
          </div>

          {loading && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Testing endpoints...</span>
            </div>
          )}
        </div>

        {/* Authentication Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🔐 Authentication Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Token Status</p>
              <p className="font-medium">
                {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Advisor Data</p>
              <p className="font-medium">
                {localStorage.getItem('advisor') ? '✅ Present' : '❌ Missing'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Token Preview</p>
              <p className="font-mono text-xs">
                {localStorage.getItem('token') 
                  ? localStorage.getItem('token').substring(0, 20) + '...'
                  : 'No token'
                }
              </p>
            </div>
          </div>
        </div>
        
        {/* Test Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">📋 Test Results</h2>
          
          {Object.keys(results).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No tests run yet. Click a test button above to start debugging.</p>
            </div>
          ) : (
            Object.entries(results).map(([name, result]) => (
              <div key={name} className={`p-4 rounded-lg shadow-md ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? '✅' : '❌'} {name}
                  </h3>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status:</p>
                    <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.status || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Success:</p>
                    <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.success ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
                
                {result.error && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Error:</p>
                    <p className="text-sm text-red-600">{result.error}</p>
                  </div>
                )}
                
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700">Response Data:</p>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DebugApiTest;
