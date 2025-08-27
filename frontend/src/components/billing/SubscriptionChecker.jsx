/**
 * FILE LOCATION: frontend/src/components/billing/SubscriptionChecker.jsx
 * 
 * Subscription checker component that monitors subscription status
 * and shows the subscription blocker when subscription is expired.
 * Updated to handle 30-day free trial period.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import SubscriptionBlocker from './SubscriptionBlocker';

const SubscriptionChecker = ({ children }) => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBlocker, setShowBlocker] = useState(false);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/billing/subscription-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
        
        // Show blocker only if subscription is not active AND trial is not active
        // Users can access the dashboard during trial period
        if (!data.isActive && !data.isTrialActive) {
          setShowBlocker(true);
        } else {
          setShowBlocker(false);
        }
      } else {
        // If API fails, assume subscription is active for now
        setShowBlocker(false);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      // If there's an error, assume subscription is active for now
      setShowBlocker(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Refresh subscription status after successful payment
    checkSubscriptionStatus();
  };

  // Show loading while checking subscription
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // Show subscription blocker if subscription is expired (not during trial)
  if (showBlocker) {
    return <SubscriptionBlocker onPaymentSuccess={handlePaymentSuccess} />;
  }

  // Show normal content if subscription is active or trial is active
  return children;
};

export default SubscriptionChecker;
