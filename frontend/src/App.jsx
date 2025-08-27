/**
 * FILE LOCATION: frontend/src/App.jsx
 * 
 * Main application component that sets up routing, authentication context,
 * and defines all application routes including public, protected, and admin routes.
 * This is the root component that wraps the entire application.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Home from './components/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import Dashboard from './components/Dashboard'
import AdvisorProfile from './components/AdvisorProfile'
import ClientsPage from './components/ClientsPage'
import ClientOnboardingForm from './components/client/ClientOnboardingForm'
import ClientDetailView from './components/client/ClientDetailView'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import { MeetingsPage } from './components/meetings'
import TranscriptionsPage from './components/meetings/TranscriptionsPage'
import TranscriptionManager from './components/transcriptions/TranscriptionManager'
import LOESignaturePage from './components/loe/LOESignaturePage'
import { CASManagementPage } from './components/casManagement'
import ABTestingDashboard from './components/abTesting/ABTestingDashboard'
import ABTestingSuite2 from './components/abTesting/ABTestingSuite2'
import ABTestingVisualizations from './components/abTesting/visualizations/ABTestingVisualizations'
import PortfolioManagementDashboard from './components/portfolio/PortfolioManagementDashboard'
import Settings from './components/Settings'
import ChatRichieAI from './pages/ChatRichieAI'
import KYCVerification from './components/kyc/KYCVerification'
import MutualFundExitSuite from './components/mutualFundExit/MutualFundExitSuite'
import { LOEAutomationDashboard, ClientLOESigningPage } from './components/loeAutomation'
import Vault from './components/Vault'
import { FinalReportPage } from './components/finalReport'
import BillingPage from './components/billing/BillingPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Toast notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />

          {/* Routes */}
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/client-onboarding/:token" element={<ClientOnboardingForm />} />
            <Route path="/loe/sign/:token" element={<LOESignaturePage />} />
            <Route path="/loe-automation/sign/:accessToken" element={<ClientLOESigningPage />} />
            
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            
            {/* Protected routes with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<AdvisorProfile />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:clientId" element={<ClientDetailView />} />
              <Route path="/meetings" element={<MeetingsPage />} />
              <Route path="/transcriptions" element={<TranscriptionsPage />} />
              <Route path="/transcription-manager" element={<TranscriptionManager />} />
              <Route path="/cas-management" element={<CASManagementPage />} />
              <Route path="/ab-testing" element={<ABTestingDashboard />} />
              <Route path="/ab-testing-suite-2" element={<ABTestingSuite2 />} />
              <Route path="/ab-testing-visualizations/:clientId" element={<ABTestingVisualizations />} />
              <Route path="/portfolio-management" element={<PortfolioManagementDashboard />} />
              <Route path="/chat-richieai" element={<ChatRichieAI />} />
              <Route path="/kyc-verification" element={<KYCVerification />} />
              <Route path="/mutual-fund-exit" element={<MutualFundExitSuite />} />
              <Route path="/loe-automation" element={<LOEAutomationDashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="/final-report" element={<FinalReportPage />} />
              <Route path="/billing" element={<BillingPage />} />
            </Route>
            
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
