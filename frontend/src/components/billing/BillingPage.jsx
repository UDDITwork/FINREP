/**
 * FILE LOCATION: frontend/src/components/billing/BillingPage.jsx
 * 
 * Billing and subscription management page for advisors.
 * Handles monthly subscription payments using SMEPay dynamic QR service.
 * Shows subscription status, payment history, and payment options.
 * Includes 30-day free trial period support.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Calendar, CheckCircle, AlertCircle, QrCode, Smartphone, Clock, Shield, Zap, Users, Brain, BarChart3, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

const BillingPage = () => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isActive: false,
    isTrialActive: false,
    hasPaid: false,
    expiryDate: null,
    daysRemaining: 0,
    amount: 999,
    plan: 'Monthly Professional'
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Check subscription status on component mount
  useEffect(() => {
    checkSubscriptionStatus();
    loadPaymentHistory();
  }, []);

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
      } else {
        // For demo purposes, set default status
        setSubscriptionStatus({
          isActive: false,
          isTrialActive: true,
          hasPaid: false,
          expiryDate: null,
          daysRemaining: 30,
          amount: 999,
          plan: 'Monthly Professional'
        });
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      toast.error('Failed to load subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const response = await fetch('/api/billing/payment-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const initiatePayment = async () => {
    try {
      setIsProcessingPayment(true);
      setShowPaymentModal(true);
      
      // Create payment order
      const response = await fetch('/api/billing/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: subscriptionStatus.amount,
          plan: subscriptionStatus.plan,
          customerDetails: {
            name: user?.name || 'Advisor',
            email: user?.email,
            mobile: user?.phone || ''
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeData(data);
        setPaymentStatus('pending');
        
        // Start polling for payment status
        pollPaymentStatus(data.orderSlug);
      } else {
        const errorData = await response.json();
        if (errorData.message && errorData.message.includes('Trial period is still active')) {
          toast.error(`Trial period is still active. ${subscriptionStatus.daysRemaining} days remaining.`);
        } else {
          toast.error('Failed to create payment');
        }
        setShowPaymentModal(false);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment');
      setShowPaymentModal(false);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const pollPaymentStatus = async (orderSlug) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/billing/check-payment-status/${orderSlug}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'paid') {
            setPaymentStatus('success');
            toast.success('Payment successful! Your subscription is now active.');
            clearInterval(pollInterval);
            
            // Refresh subscription status
            setTimeout(() => {
              checkSubscriptionStatus();
              setShowPaymentModal(false);
            }, 2000);
          } else if (data.status === 'failed') {
            setPaymentStatus('failed');
            toast.error('Payment failed. Please try again.');
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus === 'pending') {
        setPaymentStatus('timeout');
        toast.error('Payment timeout. Please try again.');
      }
    }, 300000);
  };

  const planFeatures = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Unlimited Clients",
      description: "Manage unlimited client portfolios"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Insights",
      description: "Advanced AI recommendations and analysis"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Comprehensive portfolio analytics and reporting"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "SEBI Compliance",
      description: "Built-in compliance tools and audit trails"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Automation Tools",
      description: "Automated workflows and client communication"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
              <p className="text-gray-600 mt-1">Manage your Richie AI subscription</p>
            </div>
            <div className="flex items-center space-x-3">
              <CreditCard className="w-8 h-8 text-[#1e3a5f]" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Status Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Subscription Status</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscriptionStatus.isTrialActive 
                    ? 'bg-blue-100 text-blue-800' 
                    : subscriptionStatus.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {subscriptionStatus.isTrialActive ? 'Trial Active' : subscriptionStatus.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              {subscriptionStatus.isTrialActive ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Gift className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">You're currently on a free trial</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">
                      Trial ends on: {subscriptionStatus.expiryDate ? new Date(subscriptionStatus.expiryDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="text-gray-700">
                      {subscriptionStatus.daysRemaining} days remaining in trial
                    </span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Free Trial:</strong> Enjoy all features for 30 days without any payment. 
                      After the trial period, you'll need to subscribe to continue using Richie AI.
                    </p>
                  </div>
                </div>
              ) : subscriptionStatus.isActive ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Your subscription is active</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">
                      Expires on: {subscriptionStatus.expiryDate ? new Date(subscriptionStatus.expiryDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="text-gray-700">
                      {subscriptionStatus.daysRemaining} days remaining
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-gray-700">Your subscription has expired</span>
                  </div>
                  <p className="text-gray-600">
                    To continue using Richie AI, please renew your subscription.
                  </p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Current Plan</p>
                    <p className="text-lg font-semibold text-gray-900">{subscriptionStatus.plan}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Monthly Price</p>
                    <p className="text-2xl font-bold text-[#1e3a5f]">₹{subscriptionStatus.amount}</p>
                  </div>
                </div>
              </div>

              {!subscriptionStatus.isActive && !subscriptionStatus.isTrialActive && (
                <button
                  onClick={initiatePayment}
                  disabled={isProcessingPayment}
                  className="mt-6 w-full bg-[#1e3a5f] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#1e3a5f]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment ? 'Processing...' : 'Renew Subscription'}
                </button>
              )}

              {subscriptionStatus.isTrialActive && subscriptionStatus.daysRemaining <= 7 && (
                <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-orange-900">Trial Ending Soon</h3>
                      <p className="text-orange-700 text-sm mt-1">
                        Your trial will end in {subscriptionStatus.daysRemaining} days. 
                        Subscribe now to continue enjoying all features without interruption.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Plan Features */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Features</h3>
              <div className="space-y-4">
                {planFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="text-[#1e3a5f] mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{feature.title}</p>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
            </div>
            <div className="p-6">
              {paymentHistory.length > 0 ? (
                <div className="space-y-4">
                  {paymentHistory.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{payment.plan}</p>
                        <p className="text-sm text-gray-600">{new Date(payment.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{payment.amount}</p>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No payment history available</p>
                  {subscriptionStatus.isTrialActive && (
                    <p className="text-sm text-gray-400 mt-2">Payments will appear here after your trial ends</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Payment</h3>
              
              {paymentStatus === 'pending' && qrCodeData && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <QrCode className="w-32 h-32 mx-auto text-[#1e3a5f]" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Scan the QR code with any UPI app to complete payment
                  </p>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#1e3a5f]">₹{subscriptionStatus.amount}</p>
                    <p className="text-sm text-gray-600">{subscriptionStatus.plan}</p>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Payment will be confirmed automatically</span>
                  </div>
                </div>
              )}

              {paymentStatus === 'success' && (
                <div className="space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <p className="text-green-600 font-medium">Payment Successful!</p>
                  <p className="text-sm text-gray-600">Your subscription has been activated.</p>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="space-y-4">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                  <p className="text-red-600 font-medium">Payment Failed</p>
                  <p className="text-sm text-gray-600">Please try again or contact support.</p>
                  <button
                    onClick={() => {
                      setPaymentStatus('pending');
                      initiatePayment();
                    }}
                    className="bg-[#1e3a5f] text-white py-2 px-4 rounded-lg"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {paymentStatus === 'timeout' && (
                <div className="space-y-4">
                  <Clock className="w-16 h-16 text-orange-500 mx-auto" />
                  <p className="text-orange-600 font-medium">Payment Timeout</p>
                  <p className="text-sm text-gray-600">Payment session expired. Please try again.</p>
                  <button
                    onClick={() => {
                      setPaymentStatus('pending');
                      initiatePayment();
                    }}
                    className="bg-[#1e3a5f] text-white py-2 px-4 rounded-lg"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowPaymentModal(false)}
                className="mt-6 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
