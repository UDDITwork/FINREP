/**
 * FILE LOCATION: frontend/src/components/ResetPassword.jsx
 * 
 * Reset password component that handles password reset without token validation.
 * Includes form validation and new password submission.
 * Features: Professional glassmorphism design with green-blue gradient
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

function ResetPassword() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    console.log('\n🔍 [FRONTEND DEBUG] ==========================================');
    console.log(`📧 Reset Password Form Submission`);
    console.log(`📧 Email entered: ${data.email}`);
    console.log(`🔑 Password entered: ${data.password ? '***' + data.password.slice(-4) : 'NOT PROVIDED'}`);
    console.log(`🔑 Confirm Password entered: ${data.confirmPassword ? '***' + data.confirmPassword.slice(-4) : 'NOT PROVIDED'}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🌐 Current URL: ${window.location.href}`);

    try {
      setIsSubmitting(true);
      console.log(`🔄 [DEBUG] Setting isSubmitting to true`);
      
      console.log(`📤 [DEBUG] Sending API request to /auth/reset-password`);
      console.log(`📤 [DEBUG] Request payload:`, { 
        email: data.email, 
        password: data.password ? '***' + data.password.slice(-4) : 'NOT PROVIDED' 
      });
      
      const response = await api.post('/auth/reset-password', {
        email: data.email,
        password: data.password
      });

      console.log(`✅ [DEBUG] API response received:`, response.data);
      console.log(`✅ [DEBUG] Response status: ${response.status}`);
      console.log(`✅ [DEBUG] Response success: ${response.data.success}`);

      if (response.data.success) {
        console.log(`✅ [DEBUG] Password reset successful`);
        console.log(`✅ [DEBUG] Showing success toast`);
        toast.success('Password reset successfully! You can now login with your new password.');
        console.log(`✅ [DEBUG] Navigating to /login`);
        navigate('/login');
        console.log(`✅ [DEBUG] Reset password process completed successfully`);
      } else {
        console.log(`❌ [DEBUG] API returned success: false`);
        console.log(`❌ [DEBUG] Error message: ${response.data.message}`);
        toast.error(response.data.message || 'Failed to reset password');
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
        toast.error('An error occurred while resetting your password');
      }
    } finally {
      console.log(`🔄 [DEBUG] Setting isSubmitting to false`);
      setIsSubmitting(false);
      console.log('🔍 [FRONTEND DEBUG] ==========================================\n');
    }
  };



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

      {/* Reset Password Form Container */}
      <div className="max-w-md w-full relative z-20">
        <div className="bg-white/10 backdrop-blur-lg px-8 py-10 rounded-2xl shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center px-4 py-2 border border-white/30 rounded-lg mb-6 bg-white/10 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white tracking-wide drop-shadow-lg">Richie</h2>
            </div>
                         <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Reset Password</h1>
             <p className="text-gray-100 text-base drop-shadow-md">
               Enter your email and new password
             </p>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 mb-6 border border-blue-400/30">
            <p className="text-blue-100 text-xs">
              <strong>Security:</strong> Your new password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.
            </p>
          </div>

                     {/* Form */}
           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
             {/* Email */}
             <div>
               <label htmlFor="email" className="block text-sm font-medium text-white mb-2 drop-shadow-sm">
                 Email Address
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

             {/* New Password */}
             <div>
               <label htmlFor="password" className="block text-sm font-medium text-white mb-2 drop-shadow-sm">
                 New Password
               </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: 'Password must contain uppercase, lowercase, number and special character'
                    }
                  })}
                  className="w-full px-4 py-3 border border-white/30 rounded-lg placeholder-gray-300 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent pr-12 transition duration-200 text-sm hover:bg-white/15"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-white/10 rounded-r-lg transition duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg
                    className="h-5 w-5 text-gray-200 hover:text-white transition duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3.122-3.122l-1.415-1.415M18 12l-1.415 1.415"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    )}
                  </svg>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-200 drop-shadow-sm">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2 drop-shadow-sm">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  className="w-full px-4 py-3 border border-white/30 rounded-lg placeholder-gray-300 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent pr-12 transition duration-200 text-sm hover:bg-white/15"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-white/10 rounded-r-lg transition duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <svg
                    className="h-5 w-5 text-gray-200 hover:text-white transition duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {showConfirmPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3.122-3.122l-1.415-1.415M18 12l-1.415 1.415"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    )}
                  </svg>
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-200 drop-shadow-sm">{errors.confirmPassword.message}</p>
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
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-sm text-blue-100 hover:text-white transition duration-200 drop-shadow-sm"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
