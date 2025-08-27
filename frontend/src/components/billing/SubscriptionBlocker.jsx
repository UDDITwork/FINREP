/**
 * FILE LOCATION: frontend/src/components/billing/SubscriptionBlocker.jsx
 * 
 * Subscription blocker component that prevents access to the dashboard
 * when the advisor's subscription has expired. Shows a non-removable
 * message with payment options.
 * Updated to handle 30-day free trial period.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard, Lock, Calendar, Users, Brain, BarChart3, Shield, Zap, CheckCircle, X, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

const SubscriptionBlocker = ({ onPaymentSuccess }) => {
  const navigate = useNavigate();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const subscriptionAmount = 999;
  const planName = 'Monthly Professional';

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
          amount: subscriptionAmount,
          plan: planName,
          customerDetails: {
            name: 'Advisor',
            email: 'advisor@example.com',
            mobile: ''
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus('pending');
        
        // Start polling for payment status
        pollPaymentStatus(data.orderSlug);
      } else {
        const errorData = await response.json();
        if (errorData.message && errorData.message.includes('Trial period is still active')) {
          toast.error('Trial period is still active. Payment will be required after trial expires.');
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
            
            // Call the success callback to refresh the app
            setTimeout(() => {
              if (onPaymentSuccess) {
                onPaymentSuccess();
              }
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-full">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-900">Trial Period Expired</h1>
                <p className="text-red-700">Your 30-day free trial has ended. Please subscribe to continue.</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Payment Section */}
            <div>
              <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8b] rounded-lg p-6 text-white">
                <div className="text-center mb-6">
                  <CreditCard className="w-16 h-16 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Subscribe to Continue</h2>
                  <p className="text-blue-100">Get back to managing your clients with AI-powered insights</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-100">Plan:</span>
                    <span className="font-semibold">{planName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-100">Duration:</span>
                    <span className="font-semibold">30 Days</span>
                  </div>
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-blue-100">Total Amount:</span>
                    <span className="font-bold text-2xl">₹{subscriptionAmount}</span>
                  </div>
                </div>

                <button
                  onClick={initiatePayment}
                  disabled={isProcessingPayment}
                  className="w-full bg-white text-[#1e3a5f] py-4 px-6 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment ? 'Processing...' : 'Subscribe Now'}
                </button>

                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-blue-100">
                    <Shield className="w-4 h-4" />
                    <span>Secure payment via UPI</span>
                  </div>
                </div>
              </div>

              {/* Trial Information */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Gift className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Free Trial Completed</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      You've enjoyed 30 days of free access to all Richie AI features. 
                      Subscribe now to continue using the platform without interruption.
                    </p>
                  </div>
                </div>
              </div>

              {/* Urgency Message */}
              <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-900">Access Restricted</h3>
                    <p className="text-orange-700 text-sm mt-1">
                      Your dashboard access is currently blocked. Complete the subscription to restore full access to all features.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Features */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What You'll Get</h3>
              <div className="space-y-4">
                {planFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
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

              {/* Testimonials */}
              <div className="mt-8 bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">What Advisors Say</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      "Richie AI has transformed how I manage my clients. The AI insights are invaluable."
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      "The automation features save me hours every week. Highly recommended!"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Payment</h3>
              
              {paymentStatus === 'pending' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="w-32 h-32 mx-auto bg-[#1e3a5f] rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs">QR Code</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Scan the QR code with any UPI app to complete payment
                  </p>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#1e3a5f]">₹{subscriptionAmount}</p>
                    <p className="text-sm text-gray-600">{planName}</p>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
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
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
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

export default SubscriptionBlocker;
