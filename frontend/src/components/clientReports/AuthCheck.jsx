/**
 * FILE LOCATION: frontend/src/components/clientReports/AuthCheck.jsx
 * 
 * PURPOSE: Simple authentication check component to debug auth issues
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

function AuthCheck() {
  const [authStatus, setAuthStatus] = useState('checking');
  const [token, setToken] = useState(null);
  const [advisor, setAdvisor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check localStorage
      const storedToken = localStorage.getItem('token');
      const storedAdvisor = localStorage.getItem('advisor');
      
      setToken(storedToken);
      setAdvisor(storedAdvisor ? JSON.parse(storedAdvisor) : null);

      if (!storedToken) {
        setAuthStatus('no-token');
        return;
      }

      // Test API call
      const response = await api.get('/auth/profile');
      
      if (response.data.success) {
        setAuthStatus('authenticated');
      } else {
        setAuthStatus('invalid-token');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthStatus('error');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('advisor');
    setAuthStatus('no-token');
    setToken(null);
    setAdvisor(null);
  };

  const renderStatus = () => {
    switch (authStatus) {
      case 'checking':
        return (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Checking authentication...</span>
          </div>
        );

      case 'authenticated':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Authenticated ✓</span>
          </div>
        );

      case 'no-token':
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <Lock className="h-4 w-4" />
            <span>No authentication token found</span>
          </div>
        );

      case 'invalid-token':
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Invalid or expired token</span>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Authentication error occurred</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Authentication Status</h2>
        
        <div className="space-y-4">
          {renderStatus()}
          
          {token && (
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm text-gray-600">Token: {token.substring(0, 20)}...</p>
            </div>
          )}
          
          {advisor && (
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm text-gray-600">
                Advisor: {advisor.firstName} {advisor.lastName}
              </p>
              <p className="text-sm text-gray-600">Email: {advisor.email}</p>
            </div>
          )}
          
          <div className="flex space-x-4 pt-4">
            {authStatus === 'authenticated' ? (
              <>
                <button
                  onClick={() => navigate('/client-reports')}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Go to Client Reports
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthCheck;
