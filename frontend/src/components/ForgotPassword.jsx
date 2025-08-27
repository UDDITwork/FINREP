/**
 * FILE LOCATION: frontend/src/components/ForgotPassword.jsx
 * 
 * Forgot password component that handles password reset requests.
 * Includes form validation, email submission, and integration with
 * the authentication system for password reset functionality.
 * Features: Professional glassmorphism design with green-blue gradient
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    console.log('\n🔍 [FRONTEND DEBUG] ==========================================');
    console.log(`📧 Forgot Password Form Submission`);
    console.log(`📧 Email entered: ${data.email}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🌐 Current URL: ${window.location.href}`);

    try {
      setIsSubmitting(true);
      console.log(`🔄 [DEBUG] Setting isSubmitting to true`);
      
      console.log(`📤 [DEBUG] Sending API request to /auth/forgot-password`);
      console.log(`📤 [DEBUG] Request payload:`, { email: data.email });
      
      const response = await api.post('/auth/forgot-password', {
        email: data.email
      });

      console.log(`✅ [DEBUG] API response received:`, response.data);
      console.log(`✅ [DEBUG] Response status: ${response.status}`);
      console.log(`✅ [DEBUG] Response success: ${response.data.success}`);

      if (response.data.success) {
        console.log(`✅ [DEBUG] Setting emailSent to true`);
        setEmailSent(true);
        console.log(`✅ [DEBUG] Showing success toast`);
        toast.success('Password reset request submitted successfully!');
        console.log(`✅ [DEBUG] Forgot password request completed successfully`);
      } else {
        console.log(`❌ [DEBUG] API returned success: false`);
        console.log(`❌ [DEBUG] Error message: ${response.data.message}`);
        toast.error(response.data.message || 'Failed to submit reset request');
      }
    } catch (error) {
      console.log(`❌ [DEBUG] Error occurred during API call`);
      console.log(`❌ [DEBUG] Error type: ${error.constructor.name}`);
      console.log(`❌ [DEBUG] Error message: ${error.message}`);
      console.log(`❌ [DEBUG] Error response status: ${error.response?.status}`);
      console.log(`❌ [DEBUG] Error response data:`, error.response?.data);
      console.log(`❌ [DEBUG] Error stack:`, error.stack);
      
      if (error.response?.data?.message) {
        console.log(`❌ [DEBUG] Showing error toast with message: ${error.response.data.message}`);
        toast.error(error.response.data.message);
      } else {
        console.log(`❌ [DEBUG] Showing generic error toast`);
        toast.error('An error occurred. Please try again later.');
      }
    } finally {
      console.log(`🔄 [DEBUG] Setting isSubmitting to false`);
      setIsSubmitting(false);
      console.log('🔍 [FRONTEND DEBUG] ==========================================\n');
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-600">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-50">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-emerald-300 to-teal-400 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-gradient-to-r from-teal-300 to-emerald-400 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>
        </div>
        
        {/* Welcome text - top left */}
        <div className="absolute top-8 left-8 z-20">
          <h1 
            className="text-4xl font-bold text-white drop-shadow-2xl"
            style={{ fontFamily: 'Times New Roman, serif' }}
          >
            Welcome to Richie
          </h1>
        </div>

        {/* Success Message Container */}
        <div className="max-w-md w-full relative z-20">
          <div className="bg-white/10 backdrop-blur-lg px-8 py-10 rounded-2xl shadow-2xl border border-white/20">
            {/* Success Icon */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
                             <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Request Submitted</h1>
               <p className="text-gray-100 text-base drop-shadow-md">You can now proceed to reset your password</p>
            </div>

            {/* Success Message */}
            <div className="text-center space-y-6">
                             <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                 <p className="text-white text-sm leading-relaxed">
                   Your password reset request has been submitted successfully. 
                   You can now proceed to the reset password page to set a new password.
                 </p>
               </div>

               <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
                 <p className="text-blue-100 text-xs">
                   <strong>Security Notice:</strong> Please use the same email address when resetting your password.
                 </p>
               </div>

                             {/* Action Buttons */}
               <div className="space-y-3">
                 <Link 
                   to="/reset-password"
                   className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
                 >
                   Reset Password
                 </Link>
                 
                 <Link 
                   to="/login"
                   className="w-full flex justify-center py-3 px-4 border border-white/30 rounded-lg shadow-lg bg-white/10 backdrop-blur-sm text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 transition duration-300"
                 >
                   Back to Login
                 </Link>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-600">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-emerald-300 to-teal-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-gradient-to-r from-teal-300 to-emerald-400 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
      </div>
      
      {/* Welcome text - top left */}
      <div className="absolute top-8 left-8 z-20">
        <h1 
          className="text-4xl font-bold text-white drop-shadow-2xl"
          style={{ fontFamily: 'Times New Roman, serif' }}
        >
          Welcome to Richie
        </h1>
      </div>

      {/* Forgot Password Form Container */}
      <div className="max-w-md w-full relative z-20">
        <div className="bg-white/10 backdrop-blur-lg px-8 py-10 rounded-2xl shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center px-4 py-2 border border-white/30 rounded-lg mb-6 bg-white/10 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white tracking-wide drop-shadow-lg">Richie</h2>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Forgot Password?</h1>
            <p className="text-gray-100 text-base drop-shadow-md">Enter your email to reset your password</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2 drop-shadow-sm">
                Email address
              </label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                className="w-full px-4 py-3 border border-white/30 rounded-lg placeholder-gray-300 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition duration-200 text-sm hover:bg-white/15"
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-200 drop-shadow-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-100 drop-shadow-md">Remember your password?</span>
              </div>
            </div>

            {/* Back to Login */}
            <div>
              <Link
                to="/login"
                className="w-full flex justify-center items-center py-3 px-4 border border-white/30 rounded-lg shadow-lg bg-white/10 backdrop-blur-sm text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 transition duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Login
              </Link>
            </div>

            {/* Help Text */}
            <div className="text-center pt-2">
              <p className="text-sm text-gray-100 drop-shadow-sm">
                Need help?{' '}
                <a href="#" className="font-medium text-blue-100 hover:text-white transition duration-200 drop-shadow-sm">
                  Contact Support
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
